import os
import uuid
from typing import Optional
from contextlib import contextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, status, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
import pymysql
import bcrypt

load_dotenv()

# Database credentials
DB_HOST = os.getenv("DB_HOST")
DB_PORT = int(os.getenv("DB_PORT", 3306))
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_NAME = os.getenv("DB_NAME", "axiomflow_db")

app = FastAPI(
    title="AxiomFlow Core API",
    description="Deterministic workflow orchestration backend & registration service",
    version="1.0.0",
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include OAuth router
from google_oauth import router as google_oauth_router
app.include_router(google_oauth_router)

from database import get_db_connection

# --- Pydantic Schemas ---

class AdminSignupData(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=100, description="Admin first name")
    last_name: Optional[str] = Field(None, max_length=100, description="Admin last name")
    email: EmailStr = Field(..., description="Unique administrative email")
    password: str = Field(..., min_length=6, max_length=128, description="Account password")
    department: Optional[str] = Field(None, max_length=100, description="Executive department")
    profession: Optional[str] = Field(None, max_length=100, description="Designation / Profession")
    mobile_no: Optional[str] = Field(None, max_length=25, description="Mobile contact number")

class BusinessProfileData(BaseModel):
    business_name: str = Field(..., min_length=2, max_length=255, description="Company / Business name")
    sector: Optional[str] = Field(None, max_length=100, description="Industry sector")
    gstin: str = Field(..., min_length=5, max_length=30, description="GSTIN statutory registration")
    cin: str = Field(..., min_length=5, max_length=30, description="Corporate Identification Number (CIN)")
    phone_no: Optional[str] = Field(None, max_length=25, description="Official telephone number")
    email: Optional[EmailStr] = Field(None, description="Official business email")
    website_url: Optional[str] = Field(None, max_length=500, description="Corporate website URL")
    description: Optional[str] = Field(None, description="Company description / brief")

class BusinessRegistrationRequest(BaseModel):
    admin: AdminSignupData
    business: BusinessProfileData

class RegistrationResponse(BaseModel):
    success: bool
    message: str
    business_id: int
    user_id: str
    business_name: str
    admin_email: str

# --- Helper Functions ---

def hash_password(plain_password: str) -> str:
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(plain_password.encode('utf-8'), salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

class LoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Registered administrative email")
    password: str = Field(..., min_length=1, description="Account password")

class LoginResponse(BaseModel):
    success: bool
    message: str
    user_id: str
    admin_name: str
    admin_email: str
    role: str
    business_id: Optional[int]
    business_name: Optional[str]
class BusinessProfileUpdate(BaseModel):
    business_name: Optional[str] = None
    sector: Optional[str] = None
    gstin: Optional[str] = None
    cin: Optional[str] = None
    phone_no: Optional[str] = None
    email: Optional[str] = None
    website_url: Optional[str] = None
    address: Optional[str] = None
    description: Optional[str] = None

class AdminProfileUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    email: Optional[str] = None
    department: Optional[str] = None
    profession: Optional[str] = None
    mobile_no: Optional[str] = None

class FullProfileUpdateRequest(BaseModel):
    user_id: str
    business_id: Optional[int] = None
    business: Optional[BusinessProfileUpdate] = None
    admin: Optional[AdminProfileUpdate] = None

# --- API Endpoints ---

@app.get("/health")
@app.get("/api/health")
def health_check():
    """Verify backend status and RDS MySQL database connectivity."""
    db_status = "unreachable"
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT 1 AS alive;")
            result = cur.fetchone()
            if result and result.get("alive") == 1:
                db_status = "connected"
        conn.close()
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "status": "online",
        "service": "AxiomFlow Core API",
        "database": db_status
    }

@app.post("/api/register-business", response_model=RegistrationResponse, status_code=status.HTTP_201_CREATED)
def register_business(payload: BusinessRegistrationRequest):
    """
    Registers a new Business organization alongside its representative Admin user.
    - Creates record in `business_profile` table
    - Hashes admin password and creates record in `users` with role='admin'
    - Links `users.business_id` -> `business_profile.id`
    - Executes atomically within a database transaction
    """
    admin_data = payload.admin
    biz_data = payload.business

    # Normalize fields
    admin_email = admin_data.email.strip().lower()
    biz_gstin = biz_data.gstin.strip().upper()
    biz_cin = biz_data.cin.strip().upper()

    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            # 1. Check if admin email is already registered
            cur.execute("SELECT user_id FROM `users` WHERE `email` = %s LIMIT 1;", (admin_email,))
            existing_user = cur.fetchone()
            if existing_user:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Admin account with email '{admin_email}' already exists."
                )

            # 2. Check if business with same GSTIN is already registered
            cur.execute("SELECT id, business_name FROM `business_profile` WHERE `gstin` = %s LIMIT 1;", (biz_gstin,))
            existing_biz = cur.fetchone()
            if existing_biz:
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail=f"Business with GSTIN '{biz_gstin}' is already registered under '{existing_biz['business_name']}'."
                )

            # 3. Insert into `business_profile`
            insert_business_sql = """
                INSERT INTO `business_profile` (
                    `business_name`, `sector`, `gstin`, `cin`, 
                    `phone_no`, `email`, `website_url`, `description`
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s);
            """
            cur.execute(
                insert_business_sql,
                (
                    biz_data.business_name.strip(),
                    biz_data.sector.strip() if biz_data.sector else None,
                    biz_gstin,
                    biz_cin,
                    biz_data.phone_no.strip() if biz_data.phone_no else None,
                    str(biz_data.email).strip().lower() if biz_data.email else None,
                    biz_data.website_url.strip() if biz_data.website_url else None,
                    biz_data.description.strip() if biz_data.description else None,
                )
            )
            business_id = cur.lastrowid
            if not business_id:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to generate business profile record ID."
                )

            # 4. Hash password and insert Admin user into `users`
            hashed_pwd = hash_password(admin_data.password)
            user_id = f"usr_{uuid.uuid4().hex[:16]}"

            insert_user_sql = """
                INSERT INTO `users` (
                    `user_id`, `first_name`, `last_name`, `email`, 
                    `department`, `profession`, `mobile_no`, `role`, 
                    `business_id`, `password`
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """
            cur.execute(
                insert_user_sql,
                (
                    user_id,
                    admin_data.first_name.strip(),
                    admin_data.last_name.strip() if admin_data.last_name else None,
                    admin_email,
                    admin_data.department.strip() if admin_data.department else "Executive / Admin",
                    admin_data.profession.strip() if admin_data.profession else "Business Administrator",
                    admin_data.mobile_no.strip() if admin_data.mobile_no else None,
                    "admin",  # Complete system control role
                    business_id,  # Foreign key linkage to business_profile.id
                    hashed_pwd
                )
            )

            # Commit the atomic transaction
            conn.commit()

            return RegistrationResponse(
                success=True,
                message="Business and Admin account successfully registered.",
                business_id=business_id,
                user_id=user_id,
                business_name=biz_data.business_name.strip(),
                admin_email=admin_email
            )

    except HTTPException:
        if conn:
            conn.rollback()
        raise
    except pymysql.MySQLError as e:
        if conn:
            conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database transaction error: {str(e)}"
        )
    except Exception as e:
        if conn:
            conn.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected server error during registration: {str(e)}"
        )
    finally:
        if conn:
            conn.close()

@app.post("/api/login", response_model=LoginResponse)
def login_user(payload: LoginRequest):
    """
    Authenticates administrative or organizational user.
    - Validates presence of email in `users`
    - Verifies password against hashed bcrypt digest
    - Fetches associated `business_profile` information
    """
    user_email = payload.email.strip().lower()
    plain_password = payload.password

    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor() as cur:
            # Query user and join with business profile
            query = """
                SELECT 
                    u.user_id,
                    u.first_name,
                    u.last_name,
                    u.email,
                    u.password,
                    u.role,
                    u.business_id,
                    b.business_name
                FROM `users` u
                LEFT JOIN `business_profile` b ON u.business_id = b.id
                WHERE u.email = %s
                LIMIT 1;
            """
            cur.execute(query, (user_email,))
            user_record = cur.fetchone()

            if not user_record:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Invalid email: No registered administrator found with this email."
                )

            # Verify password
            if not verify_password(plain_password, user_record["password"]):
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid password: The password entered is incorrect."
                )

            full_name = f"{user_record['first_name']} {user_record['last_name'] or ''}".strip()

            return LoginResponse(
                success=True,
                message="Authentication successful.",
                user_id=user_record["user_id"],
                admin_name=full_name,
                admin_email=user_record["email"],
                role=user_record.get("role") or "admin",
                business_id=user_record.get("business_id"),
                business_name=user_record.get("business_name")
            )

    except HTTPException:
        raise
    except pymysql.MySQLError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database query error during login: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unexpected error during authentication: {str(e)}"
        )
    finally:
        if conn:
            conn.close()

# --- Real-Time Workflow & Telemetry API Endpoints ---
import workflow_service

class WorkflowRunPayload(BaseModel):
    query: str = Field(..., min_length=1, description="Business objective in natural language")
    user_id: Optional[str] = Field("usr_72b30e7cd49e49e5", description="User ID")
    business_id: Optional[int] = Field(2, description="Business ID")
    account_email: Optional[str] = Field("chillalyash2005@gmail.com", description="Google OAuth Account Email")
    auto_approve: Optional[bool] = Field(False, description="Whether to automatically approve human review steps")

class WorkflowApprovalPayload(BaseModel):
    task_id: str
    decision: str = Field("accepted", description="'accepted', 'rejected', or 'updated'")
    user_feedback: Optional[str] = None
    edited_body: Optional[str] = None

@app.get("/api/logs")
def get_logs_endpoint(
    limit: int = 50,
    status: Optional[str] = None,
    search: Optional[str] = None
):
    """Fetches real-time execution audit logs directly from MySQL axiomflow_db.logs table."""
    logs_data = workflow_service.fetch_audit_logs(
        limit=limit,
        status_filter=status,
        search=search
    )
    return {"logs": logs_data, "total": len(logs_data)}

import notification_service

@app.get("/api/notifications")
def get_notifications_endpoint(limit: int = 50):
    """Fetches real-time alert notifications directly from MySQL axiomflow_db.notifications table."""
    notifs = notification_service.fetch_notifications(limit=limit)
    return {"notifications": notifs, "total": len(notifs)}

@app.get("/api/notifications/events")
async def notifications_events_stream(request: Request):
    """
    Server-Sent Events (SSE) stream endpoint for real-time notification dispatch.
    Complies with W3C EventSource standard and provides instant push notifications.
    """
    return StreamingResponse(
        notification_service.sse_event_stream(request),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        }
    )

class TestNotificationPayload(BaseModel):
    message: Optional[str] = "Workflow execution completed successfully in 12.4s"
    status: Optional[str] = "succeeded"
    task_id: Optional[str] = "TSK_TEST1234"

@app.post("/api/notifications/test")
def trigger_test_notification(payload: Optional[TestNotificationPayload] = None):
    """Trigger a live test notification that records to DB, sends plyer desktop alert, and pushes SSE."""
    msg = payload.message if payload and payload.message else "Workflow execution completed successfully in 12.4s"
    st = payload.status if payload and payload.status else "succeeded"
    tid = payload.task_id if payload and payload.task_id else "TSK_TEST1234"
    nid = notification_service.record_notification(message=msg, status=st, task_id=tid)
    return {"success": True, "id": nid, "message": "Notification dispatched via DB, plyer, and SSE."}

@app.delete("/api/notifications")
@app.post("/api/notifications/clear")
def clear_notifications_endpoint():
    """Clears all notifications from axiomflow_db.notifications."""
    success = notification_service.clear_all_notifications()
    return {"success": success, "message": "All notifications cleared from database."}

@app.get("/api/user/profile/{user_id}")
def get_user_profile_endpoint(user_id: str):
    """Retrieves business context and user profile directly from axiomflow_db."""
    profile = workflow_service.fetch_business_profile_and_user(user_id)
    return profile

@app.get("/api/profile/full/{user_id}")
def get_full_profile_endpoint(user_id: str):
    """Retrieves all fields from business_profile and users tables for administration."""
    details = workflow_service.fetch_full_profile_details(user_id)
    if "error" in details and not details.get("admin") and not details.get("business"):
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch profile details: {details['error']}"
        )
    return details

@app.put("/api/profile/update")
def update_profile_endpoint(payload: FullProfileUpdateRequest):
    """
    Updates administrative details in 'users' and/or business details in 'business_profile'.
    Returns success message or error message if update fails.
    """
    try:
        biz_dict = payload.business.dict(exclude_unset=True) if payload.business else None
        admin_dict = payload.admin.dict(exclude_unset=True) if payload.admin else None
        res = workflow_service.update_profile_details(
            user_id=payload.user_id,
            business_id=payload.business_id,
            business_data=biz_dict,
            admin_data=admin_dict
        )
        return res
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Database update failed: {str(e)}"
        )

@app.post("/api/workflow/run")
async def run_workflow_endpoint(payload: WorkflowRunPayload):
    """
    Initiates an Agentic AI workflow for the given objective.
    Records execution to axiomflow_db.logs and axiomflow_db.notifications.
    """
    task_id = workflow_service.start_new_workflow(
        query=payload.query.strip(),
        user_id=payload.user_id or "usr_72b30e7cd49e49e5",
        business_id=payload.business_id or 2,
        account_email=payload.account_email or "chillalyash2005@gmail.com",
        auto_approve=payload.auto_approve or False
    )
    return {
        "success": True,
        "task_id": task_id,
        "status": "running",
        "message": "Workflow started successfully and recorded in axiomflow_db."
    }

@app.get("/api/workflow/status/{task_id}")
def get_workflow_status_endpoint(task_id: str):
    """Returns the live execution telemetry and step progress of a workflow task."""
    st = workflow_service.get_workflow_status(task_id)
    if not st:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow with task ID '{task_id}' not found."
        )
    return st

@app.get("/api/workflow/latest")
def get_latest_workflow_endpoint():
    """Returns the most recently executed active workflow, or null if none."""
    st = workflow_service.get_latest_active_workflow()
    return {"workflow": st}

@app.post("/api/workflow/approve")
def approve_workflow_endpoint(payload: WorkflowApprovalPayload):
    """Submits human supervisory decision (accept, reject, or edit) to resume paused workflow."""
    success = workflow_service.approve_workflow_step(
        task_id=payload.task_id,
        decision=payload.decision,
        user_feedback=payload.user_feedback,
        edited_body=payload.edited_body
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Active approval gateway for task '{payload.task_id}' not found."
        )
    return {"success": True, "message": f"Supervisory clearance '{payload.decision}' registered."}

class WorkflowControlPayload(BaseModel):
    task_id: str

@app.post("/api/workflow/pause")
def pause_workflow_endpoint(payload: WorkflowControlPayload):
    """Pauses an actively running workflow task."""
    ok = workflow_service.pause_workflow(payload.task_id)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow with task ID '{payload.task_id}' not found."
        )
    return {"success": True, "message": f"Task '{payload.task_id}' paused."}

@app.post("/api/workflow/resume")
def resume_workflow_endpoint(payload: WorkflowControlPayload):
    """Resumes a paused workflow task."""
    ok = workflow_service.resume_workflow(payload.task_id)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow with task ID '{payload.task_id}' not found."
        )
    return {"success": True, "message": f"Task '{payload.task_id}' resumed."}

@app.post("/api/workflow/stop")
def stop_workflow_endpoint(payload: WorkflowControlPayload):
    """Aborts and stops an active workflow task."""
    ok = workflow_service.stop_workflow(payload.task_id)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow with task ID '{payload.task_id}' not found."
        )
    return {"success": True, "message": f"Task '{payload.task_id}' stopped."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

