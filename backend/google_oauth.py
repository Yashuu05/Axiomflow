import os
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel
import requests

from token_vault import encrypt_token, decrypt_token

router = APIRouter(prefix="/api/oauth/google", tags=["Google OAuth"])

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID") or os.getenv("CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET") or os.getenv("CLIENT_SECRET")
GOOGLE_TOKEN_URI = "https://oauth2.googleapis.com/token"
GOOGLE_REVOKE_URI = "https://oauth2.googleapis.com/revoke"
GOOGLE_USERINFO_URI = "https://www.googleapis.com/oauth2/v2/userinfo"

class ExchangeCodeRequest(BaseModel):
    code: str
    user_id: str
    business_id: int

class RevokeRequest(BaseModel):
    user_id: str
    account_email: str

def get_db():
    import main
    conn = main.get_db_connection()
    try:
        yield conn
    finally:
        conn.close()

@router.post("/exchange")
def exchange_google_code(req: ExchangeCodeRequest, conn = Depends(get_db)):
    """
    Exchanges one-time authorization code for access and refresh tokens via Google Identity Services
    code flow with redirect_uri='postmessage', encrypts tokens using AES-256, and stores in MySQL.
    """
    if not GOOGLE_CLIENT_ID or not GOOGLE_CLIENT_SECRET:
        raise HTTPException(
            status_code=500,
            detail="Google OAuth credentials (GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET) are not configured."
        )

    # 1. Exchange code with Google Token Endpoint
    # When using GIS popup code client, redirect_uri must be 'postmessage'
    token_payload = {
        "code": req.code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": "postmessage",
        "grant_type": "authorization_code"
    }

    try:
        resp = requests.post(GOOGLE_TOKEN_URI, data=token_payload, timeout=15)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to connect to Google OAuth server: {str(e)}")

    if resp.status_code != 200:
        raise HTTPException(status_code=400, detail=f"Google token exchange failed: {resp.text}")

    token_data = resp.json()
    access_token = token_data.get("access_token")
    refresh_token = token_data.get("refresh_token")
    expires_in = token_data.get("expires_in", 3600)
    scopes = token_data.get("scope", "")

    # 2. Retrieve user identity (connected Google account email)
    try:
        userinfo_resp = requests.get(
            GOOGLE_USERINFO_URI,
            headers={"Authorization": f"Bearer {access_token}"},
            timeout=10
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Failed to reach Google UserInfo API: {str(e)}")

    if userinfo_resp.status_code != 200:
        raise HTTPException(status_code=400, detail="Failed to fetch user email identity from Google")

    userinfo = userinfo_resp.json()
    account_email = userinfo.get("email")
    if not account_email:
        raise HTTPException(status_code=400, detail="No email returned by Google user profile")

    # 3. Encrypt tokens at rest
    enc_access = encrypt_token(access_token)
    enc_refresh = encrypt_token(refresh_token) if refresh_token else None

    # Calculate token expiry timestamp
    expiry_time = datetime.now(timezone.utc).timestamp() + expires_in
    expiry_dt = datetime.fromtimestamp(expiry_time, tz=timezone.utc)

    # 4. Save/Update in MySQL
    try:
        with conn.cursor() as cursor:
            sql = """
            INSERT INTO oauth_connections 
            (user_id, business_id, provider, account_email, encrypted_access_token, 
             encrypted_refresh_token, token_expiry, scopes, status)
            VALUES (%s, %s, 'google', %s, %s, %s, %s, %s, 'active')
            ON DUPLICATE KEY UPDATE 
                encrypted_access_token = VALUES(encrypted_access_token),
                encrypted_refresh_token = COALESCE(VALUES(encrypted_refresh_token), encrypted_refresh_token),
                token_expiry = VALUES(token_expiry),
                scopes = VALUES(scopes),
                status = 'active',
                updated_at = CURRENT_TIMESTAMP;
            """
            cursor.execute(sql, (
                req.user_id,
                req.business_id,
                account_email,
                enc_access,
                enc_refresh,
                expiry_dt,
                scopes
            ))
            conn.commit()
    except Exception as db_err:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to persist connection record: {str(db_err)}")

    return {
        "success": True,
        "message": "Google Account connected successfully",
        "account_email": account_email,
        "scopes": scopes.split(" ") if scopes else []
    }

@router.get("/status/{user_id}")
def get_connected_accounts(user_id: str, conn = Depends(get_db)):
    """
    Returns list of connected accounts for a given user without exposing secret tokens.
    """
    with conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT id, account_email, scopes, status, token_expiry, updated_at
            FROM oauth_connections 
            WHERE user_id = %s AND provider = 'google' AND status = 'active'
            ORDER BY updated_at DESC
            """,
            (user_id,)
        )
        rows = cursor.fetchall()
        # Convert any datetime/timestamp fields to ISO strings for JSON serialization
        for r in rows:
            if r.get("token_expiry"):
                r["token_expiry"] = r["token_expiry"].isoformat()
            if r.get("updated_at"):
                r["updated_at"] = r["updated_at"].isoformat()
        return {"connected_accounts": rows}

@router.post("/revoke")
def revoke_google_token(req: RevokeRequest, conn = Depends(get_db)):
    """
    Revokes the granted OAuth token with Google directly and removes/marks the record in the database.
    """
    with conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT encrypted_access_token, encrypted_refresh_token 
            FROM oauth_connections 
            WHERE user_id = %s AND account_email = %s
            """,
            (req.user_id, req.account_email)
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Connection record not found")

        # Decrypt token to revoke
        token_to_revoke = ""
        if row.get("encrypted_refresh_token"):
            token_to_revoke = decrypt_token(row.get("encrypted_refresh_token"))
        elif row.get("encrypted_access_token"):
            token_to_revoke = decrypt_token(row.get("encrypted_access_token"))

        # Send revocation request to Google
        if token_to_revoke:
            try:
                requests.post(GOOGLE_REVOKE_URI, params={"token": token_to_revoke}, timeout=10)
            except Exception as e:
                # Log but proceed to clean DB
                pass

        # Remove from MySQL
        cursor.execute(
            "DELETE FROM oauth_connections WHERE user_id = %s AND account_email = %s",
            (req.user_id, req.account_email)
        )
        conn.commit()

    return {"success": True, "message": "Google Account revoked and disconnected successfully"}
