import os
import uuid
from typing import Optional
from contextlib import contextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, status
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

def get_db_connection():
    return pymysql.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        database=DB_NAME,
        connect_timeout=10,
        autocommit=False,  # Transactions handled explicitly
        cursorclass=pymysql.cursors.DictCursor
    )

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
