import os
import sys
from typing import Dict, Any, Optional
import pymysql

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from agents.state import WorkflowState


def fetch_business_context_from_db(user_id: str, business_id: Optional[int] = None) -> Dict[str, Any]:
    """
    Retrieves registered business details from AWS RDS MySQL (business_profile and users tables).
    Falls back gracefully to default registered profile if DB is unreachable.
    """
    db_host = os.getenv("DB_HOST")
    db_user = os.getenv("DB_USER")
    db_password = os.getenv("DB_PASSWORD")
    db_name = os.getenv("DB_NAME", "axiomflow_db")

    if db_host and db_user and db_password:
        try:
            conn = pymysql.connect(
                host=db_host,
                port=int(os.getenv("DB_PORT", 3306)),
                user=db_user,
                password=db_password,
                database=db_name,
                connect_timeout=5,
                cursorclass=pymysql.cursors.DictCursor
            )
            with conn.cursor() as cur:
                if business_id:
                    cur.execute("SELECT * FROM business_profile WHERE id = %s LIMIT 1;", (business_id,))
                else:
                    cur.execute(
                        """
                        SELECT b.* FROM business_profile b
                        JOIN users u ON u.business_id = b.id
                        WHERE u.user_id = %s LIMIT 1;
                        """,
                        (user_id,)
                    )
                biz = cur.fetchone()
                if biz:
                    conn.close()
                    return {
                        "business_name": biz.get("business_name") or "Axiomflow Pvt Ltd",
                        "email": biz.get("email") or "chillalyash2005@gmail.com",
                        "website_url": biz.get("website_url") or "https://www.axiomflow.ai",
                        "sector": biz.get("sector") or "IT & Software Services",
                        "description": biz.get("description") or "",
                        "user_id": user_id,
                        "account_email": biz.get("email") or "chillalyash2005@gmail.com"
                    }
            conn.close()
        except Exception:
            pass

    # Default fallback context for development & terminal testing
    return {
        "business_name": "Axiomflow Pvt Ltd",
        "email": "chillalyash2005@gmail.com",
        "website_url": "https://www.axiomflow.ai",
        "sector": "IT & Software Services",
        "description": "B2B SaaS Operation Automation Workflow platform",
        "user_id": user_id,
        "account_email": "chillalyash2005@gmail.com"
    }


def retrieve_context_node(state: WorkflowState) -> Dict[str, Any]:
    """
    LangGraph node: Injects registered business profile and sender information into workflow state.
    """
    user_id = state.get("user_id", "usr_72b30e7cd49e49e5")
    business_id = state.get("business_id")
    
    # Check if state already has business_context provided
    existing_ctx = state.get("business_context")
    if existing_ctx and existing_ctx.get("business_name"):
        return {"status": "assessing"}

    biz_ctx = fetch_business_context_from_db(user_id=user_id, business_id=business_id)
    return {
        "business_context": biz_ctx,
        "account_email": state.get("account_email") or biz_ctx.get("account_email", ""),
        "status": "assessing"
    }
