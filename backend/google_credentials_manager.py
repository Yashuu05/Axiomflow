import os
from datetime import datetime, timezone
from google.oauth2.credentials import Credentials
from google.auth.transport.requests import Request
from token_vault import decrypt_token, encrypt_token

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID") or os.getenv("CLIENT_ID")
GOOGLE_CLIENT_SECRET = os.getenv("GOOGLE_CLIENT_SECRET") or os.getenv("CLIENT_SECRET")
GOOGLE_TOKEN_URI = "https://oauth2.googleapis.com/token"

def get_user_google_credentials(user_id: str, account_email: str, conn) -> Credentials:
    """
    Fetches, decrypts, and automatically refreshes Google credentials for a user.
    Persists updated access tokens back to MySQL if refreshed.
    """
    with conn.cursor() as cursor:
        cursor.execute(
            """
            SELECT encrypted_access_token, encrypted_refresh_token, scopes, token_expiry 
            FROM oauth_connections 
            WHERE user_id = %s AND account_email = %s AND status = 'active'
            """,
            (user_id, account_email)
        )
        record = cursor.fetchone()
        if not record:
            raise ValueError(f"No active Google connection found for user {user_id} and email {account_email}")

    access_token = decrypt_token(record["encrypted_access_token"])
    refresh_token = decrypt_token(record.get("encrypted_refresh_token") or "")
    scopes = record["scopes"].split(" ") if record.get("scopes") else []

    creds = Credentials(
        token=access_token,
        refresh_token=refresh_token if refresh_token else None,
        token_uri=GOOGLE_TOKEN_URI,
        client_id=GOOGLE_CLIENT_ID,
        client_secret=GOOGLE_CLIENT_SECRET,
        scopes=scopes
    )

    # If the access token has expired or is invalid, refresh it automatically using refresh_token
    if not creds.valid:
        if creds.expired and creds.refresh_token:
            creds.refresh(Request())
            # Save new encrypted access token back to DB
            new_enc_access = encrypt_token(creds.token)
            with conn.cursor() as cursor:
                cursor.execute(
                    """
                    UPDATE oauth_connections 
                    SET encrypted_access_token = %s, updated_at = CURRENT_TIMESTAMP 
                    WHERE user_id = %s AND account_email = %s
                    """,
                    (new_enc_access, user_id, account_email)
                )
                conn.commit()
        else:
            raise PermissionError("Google OAuth credentials expired and cannot be refreshed. User must re-connect.")

    return creds
