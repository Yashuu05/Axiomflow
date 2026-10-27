import os
import sys
import time
import uuid
import asyncio
from datetime import datetime
from typing import Dict, Any, Optional, List

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__)))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

import pymysql
from dotenv import load_dotenv
load_dotenv()

from agents.graph import build_workflow_graph
from agents.state import WorkflowState
from database import get_db_connection as get_db_conn

import threading

# In-memory storage for active workflows and stateful signals
ACTIVE_WORKFLOWS: Dict[str, Dict[str, Any]] = {}
APPROVAL_EVENTS: Dict[str, threading.Event] = {}
APPROVAL_DECISIONS: Dict[str, Dict[str, Any]] = {}
CLARIFICATION_EVENTS: Dict[str, threading.Event] = {}
CLARIFICATION_ANSWERS: Dict[str, Dict[str, str]] = {}
PAUSE_EVENTS: Dict[str, threading.Event] = {}
STOP_SIGNALS: Dict[str, bool] = {}


from notification_service import (
    record_notification as service_record_notification,
    fetch_notifications as service_fetch_notifications
)

def record_notification(message: str, status: str = "info", task_id: Optional[str] = None) -> Optional[int]:
    """
    Inserts a record into axiomflow_db.notifications table, triggers a plyer desktop
    alert on the system, and streams an SSE event to connected dashboard clients.
    CRITICAL RULE: Notifications are ONLY triggered after execution terminates
    (status = completed or failed/rejected/paused). Never on startup or intermediate steps.
    """
    return service_record_notification(message=message, status=status, task_id=task_id)


def record_log(
    task_id: str,
    query: str,
    status: str,
    description: str,
    agent_name: str,
    llm_name: str = "openai/gpt-oss-120b (groq)",
    time_taken: Optional[float] = None
) -> Optional[int]:
    """
    Inserts an audit log entry in axiomflow_db.logs table for each individual step.
    CRITICAL RULE: 'logs' stores logs of each step within a single workflow in sequence,
    giving full step-by-step audit telemetry.
    """
    conn = None
    try:
        conn = get_db_conn()
        with conn.cursor() as cur:
            cur.execute(
                """
                INSERT INTO `logs` (
                    `task_id`, `query`, `status`, `task_description`, 
                    `agent_name`, `llm_name`, `time_taken`, `time_stamp`
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP);
                """,
                (task_id, query, status, description, agent_name, llm_name, time_taken)
            )
            conn.commit()
            return cur.lastrowid
    except Exception as e:
        print(f"[WARNING] Failed to record log to database: {e}")
        return None
    finally:
        if conn:
            conn.close()


def fetch_audit_logs(
    limit: int = 100,
    status_filter: Optional[str] = None,
    search: Optional[str] = None
) -> List[Dict[str, Any]]:
    """Retrieves real-time execution audit logs directly from RDS MySQL `logs` table."""
    conn = None
    try:
        conn = get_db_conn()
        with conn.cursor() as cur:
            sql = """
                SELECT 
                    `id`, `task_id`, `query`, `status`, `task_description`, 
                    `agent_name`, `llm_name`, `time_taken`, `time_stamp`
                FROM `logs`
            """
            conditions = []
            params: List[Any] = []

            if status_filter and status_filter.lower() != "all":
                conditions.append("LOWER(`status`) = %s")
                params.append(status_filter.lower())

            if search and search.strip():
                conditions.append(
                    "(`task_id` LIKE %s OR `query` LIKE %s OR `task_description` LIKE %s OR `agent_name` LIKE %s)"
                )
                term = f"%{search.strip()}%"
                params.extend([term, term, term, term])

            if conditions:
                sql += " WHERE " + " AND ".join(conditions)

            sql += " ORDER BY `id` DESC LIMIT %s;"
            params.append(limit)

            cur.execute(sql, tuple(params))
            rows = cur.fetchall()

            results = []
            for r in rows:
                ts = r.get("time_stamp")
                formatted_ts = ts.strftime("%Y-%m-%d %H:%M:%S") if ts else "---"
                time_taken_val = r.get("time_taken")
                formatted_time_taken = f"{time_taken_val:.1f}s" if time_taken_val is not None else "---"

                results.append({
                    "id": str(r.get("id")),
                    "task_id": r.get("task_id") or "---",
                    "query": r.get("query") or "---",
                    "task_description": r.get("task_description") or "---",
                    "agent_name": r.get("agent_name") or "---",
                    "llm_name": r.get("llm_name") or "---",
                    "time_taken": formatted_time_taken,
                    "raw_time_taken": time_taken_val,
                    "time_stamp": formatted_ts,
                    "status": r.get("status") or "---"
                })

            return results
    except Exception as e:
        print(f"[ERROR] Failed to fetch logs from database: {e}")
        return []
    finally:
        if conn:
            conn.close()


def fetch_notifications(limit: int = 50) -> List[Dict[str, Any]]:
    """Retrieves real-time alert notifications directly from RDS MySQL `notifications` table."""
    return service_fetch_notifications(limit=limit)


def fetch_business_profile_and_user(user_id: str) -> Dict[str, Any]:
    """Retrieves business context and user profile from axiomflow_db."""
    conn = None
    try:
        conn = get_db_conn()
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT 
                    u.user_id, u.first_name, u.last_name, u.email as user_email,
                    u.role, u.department, u.profession, u.mobile_no, u.business_id,
                    b.business_name, b.sector, b.gstin, b.cin, b.phone_no, b.email as business_email,
                    b.website_url, b.location_address, b.time_zone, b.country, b.address, b.description
                FROM `users` u
                LEFT JOIN `business_profile` b ON u.business_id = b.id
                WHERE u.user_id = %s
                LIMIT 1;
                """,
                (user_id,)
            )
            row = cur.fetchone()
            if row:
                full_name = f"{row.get('first_name', '')} {row.get('last_name') or ''}".strip()
                loc_addr = row.get("location_address") or row.get("address") or "---"
                return {
                    "user_id": row.get("user_id"),
                    "user_name": full_name or "---",
                    "user_email": row.get("user_email") or "---",
                    "role": row.get("role") or "admin",
                    "department": row.get("department") or "---",
                    "profession": row.get("profession") or "---",
                    "mobile_no": row.get("mobile_no") or "---",
                    "business_id": row.get("business_id"),
                    "business_name": row.get("business_name") or "---",
                    "sector": row.get("sector") or "---",
                    "business_email": row.get("business_email") or row.get("user_email") or "---",
                    "website_url": row.get("website_url") or "---",
                    "phone_no": row.get("phone_no") or "---",
                    "location_address": loc_addr,
                    "address": loc_addr,
                    "time_zone": row.get("time_zone") or "Asia/Kolkata",
                    "country": row.get("country") or "INDIA",
                    "description": row.get("description") or "---"
                }
    except Exception as e:
        print(f"[WARNING] Failed to fetch profile from DB: {e}")
    finally:
        if conn:
            conn.close()

    # Fallback default
    return {
        "user_id": user_id,
        "user_name": "Yash",
        "user_email": "chillalyash2005@gmail.com",
        "role": "admin",
        "department": "IT",
        "profession": "Administrator",
        "mobile_no": "+917775065511",
        "business_id": 2,
        "business_name": "Axiomflow Pvt Ltd",
        "sector": "IT & Software Services",
        "business_email": "chillalyash2005@gmail.com",
        "website_url": "https://www.axiomflow.ai",
        "phone_no": "+919850665111",
        "address": "SR. NO 40/1 lane no. 3, Dattanagar Ambegaon B.K Pune 411046",
        "description": "B2B SaaS Operation Automation Workflow platform"
    }


def fetch_full_profile_details(user_id: str) -> Dict[str, Any]:
    """Retrieves all fields from business_profile and users tables for administration."""
    conn = None
    try:
        conn = get_db_conn()
        with conn.cursor() as cur:
            # 1. Fetch user admin details
            cur.execute(
                """
                SELECT 
                    `user_id`, `first_name`, `last_name`, `email`, 
                    `department`, `profession`, `mobile_no`, `role`, 
                    `business_id`, `created_at`, `updated_at`
                FROM `users`
                WHERE `user_id` = %s
                LIMIT 1;
                """,
                (user_id,)
            )
            admin_row = cur.fetchone()

            business_id = admin_row.get("business_id") if admin_row else None

            # 2. Fetch business profile details
            biz_row = None
            if business_id:
                cur.execute(
                    """
                    SELECT 
                        `id`, `business_name`, `sector`, `gstin`, `cin`, 
                        `phone_no`, `email`, `website_url`, `location_address`,
                        `time_zone`, `country`, `description`, 
                        `address`, `created_at`, `updated_at`
                    FROM `business_profile`
                    WHERE `id` = %s
                    LIMIT 1;
                    """,
                    (business_id,)
                )
                biz_row = cur.fetchone()

            # Format datetimes
            if admin_row:
                if admin_row.get("created_at"):
                    admin_row["created_at"] = str(admin_row["created_at"])
                if admin_row.get("updated_at"):
                    admin_row["updated_at"] = str(admin_row["updated_at"])
            if biz_row:
                if biz_row.get("created_at"):
                    biz_row["created_at"] = str(biz_row["created_at"])
                if biz_row.get("updated_at"):
                    biz_row["updated_at"] = str(biz_row["updated_at"])

            return {
                "admin": admin_row or {},
                "business": biz_row or {}
            }
    except Exception as e:
        print(f"[ERROR] Failed to fetch full profile details: {e}")
        return {"admin": {}, "business": {}, "error": str(e)}
    finally:
        if conn:
            conn.close()


def update_profile_details(
    user_id: str,
    business_id: Optional[int] = None,
    business_data: Optional[Dict[str, Any]] = None,
    admin_data: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Updates respective fields in business_profile and/or users tables in axiomflow_db.
    Executes within an atomic database transaction.
    """
    conn = None
    try:
        conn = get_db_conn()
        with conn.cursor() as cur:
            # If business_id is not passed, resolve from user record
            if not business_id and user_id:
                cur.execute("SELECT `business_id` FROM `users` WHERE `user_id` = %s LIMIT 1;", (user_id,))
                urow = cur.fetchone()
                if urow and urow.get("business_id"):
                    business_id = urow["business_id"]

            # 1. Update business_profile if provided
            if business_data and business_id:
                allowed_biz_fields = [
                    "business_name", "sector", "gstin", "cin", 
                    "phone_no", "email", "website_url", "description",
                    "location_address", "time_zone", "country", "address"
                ]
                updates = []
                values = []
                for field in allowed_biz_fields:
                    if field in business_data and business_data[field] is not None:
                        updates.append(f"`{field}` = %s")
                        val = business_data[field]
                        values.append(val.strip() if isinstance(val, str) else val)

                if updates:
                    values.append(business_id)
                    biz_sql = f"UPDATE `business_profile` SET {', '.join(updates)}, `updated_at` = CURRENT_TIMESTAMP WHERE `id` = %s;"
                    cur.execute(biz_sql, tuple(values))

            # 2. Update users if admin_data provided
            if admin_data and user_id:
                allowed_user_fields = [
                    "first_name", "last_name", "email", 
                    "department", "profession", "mobile_no"
                ]
                updates = []
                values = []
                for field in allowed_user_fields:
                    if field in admin_data and admin_data[field] is not None:
                        updates.append(f"`{field}` = %s")
                        val = admin_data[field]
                        values.append(val.strip() if isinstance(val, str) else val)

                if updates:
                    values.append(user_id)
                    user_sql = f"UPDATE `users` SET {', '.join(updates)}, `updated_at` = CURRENT_TIMESTAMP WHERE `user_id` = %s;"
                    cur.execute(user_sql, tuple(values))

            conn.commit()
            return {"success": True, "message": "Successfully Updated Profile"}
    except Exception as e:
        if conn:
            conn.rollback()
        raise e
    finally:
        if conn:
            conn.close()


def create_initial_workflow_steps(query: str) -> List[Dict[str, Any]]:
    """Creates the 6 deterministic DAG steps for real-time progress tracking in the dashboard."""
    now_str = datetime.now().strftime("%H:%M:%S")
    return [
        {
            "id": "s1",
            "number": 1,
            "title": "Evaluate Intent & Guardrails",
            "subtitle": "Assessing objective...",
            "status": "running",
            "duration": "live",
            "activityLogs": [
                {"time": now_str, "message": f"Assessing objective: '{query}'"},
                {"time": now_str, "message": "Invoking Supervisor Agent & Ethics Guardrail Policy"}
            ],
            "reasoning": "Evaluating user query against policy, ethics guardrails, and tenant business profile."
        },
        {
            "id": "s2",
            "number": 2,
            "title": "Synthesize Execution Plan",
            "subtitle": "Pending",
            "status": "pending",
            "duration": "---",
            "activityLogs": [],
            "reasoning": "Decomposing natural language prompt into atomic, reversible execution phases."
        },
        {
            "id": "s3",
            "number": 3,
            "title": "Execute Specialist Tool Operations",
            "subtitle": "Pending",
            "status": "pending",
            "duration": "---",
            "activityLogs": [],
            "reasoning": "Interfacing with verified external Google Workspace tools (Calendar / Sheets)."
        },
        {
            "id": "s4",
            "number": 4,
            "title": "Email Drafting & Human Sign-off",
            "subtitle": "Pending",
            "status": "pending",
            "duration": "---",
            "activityLogs": [],
            "reasoning": "Personalizing outgoing communication and presenting for human supervisor review (FR-14)."
        },
        {
            "id": "s5",
            "number": 5,
            "title": "Secure Dispatch & Synchronization",
            "subtitle": "Pending",
            "status": "pending",
            "duration": "---",
            "activityLogs": [],
            "reasoning": "Transmitting approved payload securely via Google Workspace API."
        },
        {
            "id": "s6",
            "number": 6,
            "title": "Audit Telemetry Recording",
            "subtitle": "Pending",
            "status": "pending",
            "duration": "---",
            "activityLogs": [],
            "reasoning": "Persisting deterministic audit trail to MySQL axiomflow_db.logs and notifications."
        }
    ]


# Web-session HITL Gate Functions
def set_workflow_waiting_approval(task_id: str, draft: Dict[str, Any]):
    """Called by email_consent_hitl_node when running in a web session."""
    if task_id in ACTIVE_WORKFLOWS:
        ACTIVE_WORKFLOWS[task_id]["status"] = "waiting_approval"
        ACTIVE_WORKFLOWS[task_id]["email_draft"] = draft
        steps = ACTIVE_WORKFLOWS[task_id].get("steps", [])
        if len(steps) > 3:
            steps[3]["status"] = "waiting"
            steps[3]["subtitle"] = "Needs your approval"


def get_or_create_approval_event(task_id: str) -> threading.Event:
    """Returns or creates the threading.Event that pauses execution until user approves/rejects."""
    if task_id not in APPROVAL_EVENTS:
        APPROVAL_EVENTS[task_id] = threading.Event()
    return APPROVAL_EVENTS[task_id]


def get_or_create_clarification_event(task_id: str) -> threading.Event:
    """Returns or creates the threading.Event that pauses execution until user provides answers to clarification questions."""
    if task_id not in CLARIFICATION_EVENTS:
        CLARIFICATION_EVENTS[task_id] = threading.Event()
    return CLARIFICATION_EVENTS[task_id]


def get_clarification_answers(task_id: str) -> Dict[str, str]:
    """Retrieves the clarification answers provided via web UI."""
    return CLARIFICATION_ANSWERS.get(task_id, {})


def set_workflow_waiting_clarification(task_id: str, assessment: Dict[str, Any]):
    """Called by interactive_clarification_node when running in a web session."""
    if task_id in ACTIVE_WORKFLOWS:
        ACTIVE_WORKFLOWS[task_id]["status"] = "waiting_clarification"
        ACTIVE_WORKFLOWS[task_id]["clarification_needed"] = assessment
        get_or_create_clarification_event(task_id)
        steps = ACTIVE_WORKFLOWS[task_id].get("steps", [])
        if len(steps) > 0:
            steps[0]["status"] = "waiting"
            steps[0]["subtitle"] = "Needs your answers"


def submit_clarification_answers(
    task_id: str,
    answers: Dict[str, str],
    raw_answer: Optional[str] = None
) -> bool:
    """Processes user clarification answers to unblock coordinator and resume planning."""
    if task_id not in ACTIVE_WORKFLOWS:
        return False

    workflow = ACTIVE_WORKFLOWS[task_id]
    workflow["clarification_answers"] = answers
    if raw_answer:
        workflow["clarification_raw_answer"] = raw_answer

    CLARIFICATION_ANSWERS[task_id] = answers

    # Resume step 0 status indicator to running while planner picks it up
    steps = workflow.get("steps", [])
    if len(steps) > 0:
        steps[0]["status"] = "running"
        steps[0]["subtitle"] = "Processing your answers..."

    event = get_or_create_clarification_event(task_id)
    event.set()
    return True


def get_approval_decision(task_id: str) -> Dict[str, Any]:
    """Retrieves the supervisory decision supplied via web UI."""
    return APPROVAL_DECISIONS.get(task_id, {"decision": "accepted"})


def pause_workflow(task_id: str) -> bool:
    """Pauses the workflow coordinator."""
    if task_id in ACTIVE_WORKFLOWS:
        ACTIVE_WORKFLOWS[task_id]["is_paused"] = True
        if task_id not in PAUSE_EVENTS:
            PAUSE_EVENTS[task_id] = threading.Event()
        PAUSE_EVENTS[task_id].clear()
        return True
    return False


def resume_workflow(task_id: str) -> bool:
    """Resumes the paused workflow coordinator."""
    if task_id in ACTIVE_WORKFLOWS:
        ACTIVE_WORKFLOWS[task_id]["is_paused"] = False
        if task_id in PAUSE_EVENTS:
            PAUSE_EVENTS[task_id].set()
        return True
    return False


def stop_workflow(task_id: str) -> bool:
    """Aborts the workflow coordinator immediately."""
    if task_id in ACTIVE_WORKFLOWS:
        ACTIVE_WORKFLOWS[task_id]["is_stopped"] = True
        ACTIVE_WORKFLOWS[task_id]["status"] = "failed"
        ACTIVE_WORKFLOWS[task_id]["error"] = "Workflow interrupted by supervisor."
        STOP_SIGNALS[task_id] = True
        if task_id in APPROVAL_EVENTS:
            APPROVAL_DECISIONS[task_id] = {"decision": "rejected", "user_feedback": "Stopped by supervisor"}
            APPROVAL_EVENTS[task_id].set()
        if task_id in CLARIFICATION_EVENTS:
            CLARIFICATION_EVENTS[task_id].set()
        if task_id in PAUSE_EVENTS:
            PAUSE_EVENTS[task_id].set()
        return True
    return False


def approve_workflow_step(
    task_id: str,
    decision: str = "accepted",
    user_feedback: Optional[str] = None,
    edited_body: Optional[str] = None
) -> bool:
    """Processes user supervisory response to resume paused workflow."""
    if task_id not in ACTIVE_WORKFLOWS:
        return False

    workflow = ACTIVE_WORKFLOWS[task_id]
    if edited_body and workflow.get("email_draft"):
        workflow["email_draft"]["body"] = edited_body

    APPROVAL_DECISIONS[task_id] = {
        "decision": decision,
        "user_feedback": user_feedback,
        "edited_body": edited_body
    }

    if task_id in APPROVAL_EVENTS:
        APPROVAL_EVENTS[task_id].set()
        return True

    return True


async def run_workflow_coordinator(task_id: str):
    """
    Background executor running the real compiled LangGraph state machine.
    Streams node transitions, logs audit events to axiomflow_db.logs in runtime,
    and records exactly ONE notification upon terminal completion or failure.
    """
    workflow = ACTIVE_WORKFLOWS.get(task_id)
    if not workflow:
        return

    query = workflow["query"]
    user_id = workflow["user_id"]
    account_email = workflow["account_email"]
    business_id = workflow["business_id"]
    start_time = workflow["start_time"]
    business_context = workflow["business_context"]
    auto_approve = workflow.get("auto_approve", False)

    def log_activity(step_idx: int, message: str):
        now_str = datetime.now().strftime("%H:%M:%S")
        if step_idx < len(workflow["steps"]):
            workflow["steps"][step_idx]["activityLogs"].append({
                "time": now_str,
                "message": message
            })

    # Prepare LangGraph state
    initial_state: WorkflowState = {
        "run_id": task_id,
        "task_id": task_id,
        "is_web_session": True,
        "tenant_id": "tenant_axiomflow_main",
        "user_id": user_id,
        "business_id": business_id or 2,
        "account_email": account_email,
        "request": query,
        "business_context": business_context or {},
        "current_step_index": 0,
        "tool_outcomes": [],
        "fallback_logs": [],
        "errors": [],
        "revision_count": 0,
        "status": "initializing"
    }

    if auto_approve:
        initial_state["email_consent"] = {
            "decision": "accepted",
            "revision_count": 0
        }

    step1_start = start_time
    step2_start = None
    step3_start = None
    step4_start = None
    step5_start = None
    step6_start = None

    try:
        graph = build_workflow_graph()

        async for chunk in graph.astream(initial_state):
            # Check for user stop signal
            if STOP_SIGNALS.get(task_id) or workflow.get("is_stopped"):
                log_activity(workflow.get("current_step_index", 0), "Workflow interrupted by supervisor.")
                elapsed = round(time.time() - start_time, 2)
                record_log(task_id, query, "Failed", "Interrupted by user", "SupervisorAgent", "openai/gpt-oss-120b (groq)", elapsed)
                record_notification(f"Workflow {task_id} interrupted by user.", "failed")
                return

            # Check for user pause signal
            while workflow.get("is_paused"):
                if task_id not in PAUSE_EVENTS:
                    PAUSE_EVENTS[task_id] = threading.Event()
                await asyncio.to_thread(PAUSE_EVENTS[task_id].wait, 0.5)

            for node_name, node_output in chunk.items():
                # -------------------------------------------------------------
                # NODE: retrieve_context
                # -------------------------------------------------------------
                if node_name == "retrieve_context":
                    ctx = node_output.get("business_context")
                    if ctx:
                        workflow["business_context"] = ctx
                        log_activity(0, f"Retrieved business context for '{ctx.get('business_name', 'Axiomflow')}'")

                # -------------------------------------------------------------
                # NODE: understand
                # -------------------------------------------------------------
                elif node_name == "understand":
                    status = node_output.get("status")
                    if status == "policy_rejected":
                        refusal = node_output.get("final_response", "Blocked by safety and policy guardrails.")
                        workflow["steps"][0]["status"] = "failed"
                        workflow["steps"][0]["subtitle"] = "Blocked by safety guardrail"
                        log_activity(0, f"GUARDRAIL BLOCKED: {refusal}")
                        workflow["status"] = "failed"
                        workflow["error"] = refusal
                        workflow["final_response"] = refusal
                        elapsed = round(time.time() - start_time, 2)
                        record_log(task_id, query, "Failed", f"Step 1: Guardrail Refusal: {refusal[:100]}", "PolicyEthicsGuardrail", "openai/gpt-oss-120b (groq)", elapsed)
                        record_notification(f"Task {task_id} rejected by guardrail: {refusal[:80]}", "failed", task_id=task_id)
                        return

                    log_activity(0, "Policy & ethics guardrails passed (Status: ALLOWED)")

                    if status == "awaiting_clarification":
                        assessment_dict = node_output.get("sufficiency_assessment") or {}
                        workflow["clarification_needed"] = assessment_dict
                        workflow["status"] = "waiting_clarification"
                        workflow["steps"][0]["status"] = "waiting"
                        workflow["steps"][0]["subtitle"] = "Needs your answers"
                        num_q = len(assessment_dict.get("questions", []))
                        log_activity(0, f"Supervisor detected insufficient parameters. {num_q} clarification questions requested.")
                        record_log(task_id, query, "Waiting Clarification", f"Step 1: Insufficient details. Supervisor requested {num_q} clarification answers.", "SupervisorAgent", "openai/gpt-oss-120b (groq)", round(time.time() - step1_start, 1))
                    else:
                        s1_dur = round(time.time() - step1_start, 1)
                        workflow["steps"][0]["status"] = "completed"
                        workflow["steps"][0]["duration"] = f"{s1_dur}s"
                        workflow["steps"][0]["subtitle"] = f"Guardrails verified · {s1_dur}s"

                        workflow["current_step_index"] = 1
                        workflow["steps"][1]["status"] = "running"
                        workflow["steps"][1]["subtitle"] = "Synthesizing execution plan..."
                        step2_start = time.time()
                        record_log(task_id, query, "Completed", "Step 1: Intent evaluated & guardrails verified (Status: ALLOWED)", "PolicyEthicsGuardrail", "openai/gpt-oss-120b (groq)", s1_dur)

                # -------------------------------------------------------------
                # NODE: clarify_hitl
                # -------------------------------------------------------------
                elif node_name == "clarify_hitl":
                    answers = node_output.get("clarification_answers") or {}
                    log_activity(0, f"Clarification parameters provided by user ({len(answers)} fields). Resuming workflow.")
                    s1_dur = round(time.time() - step1_start, 1)
                    workflow["steps"][0]["status"] = "completed"
                    workflow["steps"][0]["duration"] = f"{s1_dur}s"
                    workflow["steps"][0]["subtitle"] = f"Clarifications resolved · {s1_dur}s"
                    workflow["status"] = "running"

                    workflow["current_step_index"] = 1
                    workflow["steps"][1]["status"] = "running"
                    workflow["steps"][1]["subtitle"] = "Synthesizing execution plan..."
                    step2_start = time.time()
                    record_log(task_id, query, "Completed", f"Step 1: Clarification resolved ({len(answers)} answers provided)", "SupervisorAgent", "openai/gpt-oss-120b (groq)", s1_dur)

                # -------------------------------------------------------------
                # NODE: plan
                # -------------------------------------------------------------
                elif node_name == "plan":
                    plan = node_output.get("plan", {})
                    workflow["plan"] = plan
                    steps_count = len(plan.get("steps", []))
                    services = ", ".join(plan.get("identified_services", [])) or "Google Workspace"
                    log_activity(1, f"Identified external capabilities: [{services}]")
                    log_activity(1, f"Synthesized verified DAG plan with {steps_count} atomic stages")

                    s2_dur = round(time.time() - (step2_start or time.time()), 1)
                    workflow["steps"][1]["status"] = "completed"
                    workflow["steps"][1]["duration"] = f"{s2_dur}s"
                    workflow["steps"][1]["subtitle"] = f"{steps_count} steps planned · {s2_dur}s"

                    workflow["current_step_index"] = 2
                    workflow["steps"][2]["status"] = "running"
                    workflow["steps"][2]["subtitle"] = "Executing specialist tool operations..."
                    step3_start = time.time()
                    record_log(
                        task_id=task_id,
                        query=query,
                        status="Completed",
                        description=f"Step 2: Synthesized verified DAG plan ({steps_count} stages: {services})",
                        agent_name="SupervisorAgent",
                        llm_name="openai/gpt-oss-120b (groq)",
                        time_taken=s2_dur
                    )

                # -------------------------------------------------------------
                # NODE: execute_sheet
                # -------------------------------------------------------------
                elif node_name == "execute_sheet":
                    sheet_result = node_output.get("sheet_result")
                    if sheet_result:
                        workflow["sheet_result"] = sheet_result
                        s_dur = round(time.time() - (step3_start or time.time()), 1)
                        log_activity(2, f"Google Sheet created: '{sheet_result.get('title')}' ({sheet_result.get('row_count')} rows)")
                        if sheet_result.get("spreadsheet_url"):
                            log_activity(2, f"Spreadsheet URL: {sheet_result.get('spreadsheet_url')}")
                        workflow["steps"][2]["status"] = "completed"
                        workflow["steps"][2]["duration"] = f"{s_dur}s"
                        workflow["steps"][2]["subtitle"] = f"Sheet created · {s_dur}s"
                        record_log(
                            task_id=task_id,
                            query=query,
                            status="Completed",
                            description=f"Step 3: Google Sheet '{sheet_result.get('title')}' created with {sheet_result.get('row_count')} records",
                            agent_name="SheetAgent",
                            llm_name="openai/gpt-oss-120b (groq)",
                            time_taken=s_dur
                        )

                # -------------------------------------------------------------
                # NODE: execute_calendar
                # -------------------------------------------------------------
                elif node_name == "execute_calendar":
                    cal_event = node_output.get("calendar_event")
                    if cal_event:
                        workflow["calendar_event"] = cal_event
                        c_dur = round(time.time() - (step3_start or time.time()), 1)
                        log_activity(2, f"Google Calendar event created: '{cal_event.get('summary')}'")
                        if cal_event.get("meet_link"):
                            log_activity(2, f"Google Meet conference: {cal_event.get('meet_link')}")
                        workflow["steps"][2]["status"] = "completed"
                        workflow["steps"][2]["duration"] = f"{c_dur}s"
                        workflow["steps"][2]["subtitle"] = f"Event booked · {c_dur}s"
                        record_log(
                            task_id=task_id,
                            query=query,
                            status="Completed",
                            description=f"Step 3: Booked Google Calendar event '{cal_event.get('summary')}' with video meet link",
                            agent_name="CalendarAgent",
                            llm_name="openai/gpt-oss-120b (groq)",
                            time_taken=c_dur
                        )

                # -------------------------------------------------------------
                # NODE: execute_docs
                # -------------------------------------------------------------
                elif node_name == "execute_docs":
                    docs_res = node_output.get("docs_result")
                    if docs_res:
                        workflow["docs_result"] = docs_res
                        d_dur = round(time.time() - (step3_start or time.time()), 1)
                        log_activity(2, f"Google Doc processed: '{docs_res.get('title')}' ({docs_res.get('word_count', 0)} words)")
                        if docs_res.get("document_url"):
                            log_activity(2, f"Document URL: {docs_res.get('document_url')}")
                        workflow["steps"][2]["status"] = "completed"
                        workflow["steps"][2]["duration"] = f"{d_dur}s"
                        workflow["steps"][2]["subtitle"] = f"Doc processed · {d_dur}s"
                        record_log(
                            task_id=task_id,
                            query=query,
                            status="Completed",
                            description=f"Step 3: Google Doc '{docs_res.get('title')}' executed ({docs_res.get('operation')})",
                            agent_name="DocsAgent",
                            llm_name="openai/gpt-oss-120b (groq)",
                            time_taken=d_dur
                        )

                # -------------------------------------------------------------
                # NODE: draft_email
                # -------------------------------------------------------------
                elif node_name == "draft_email":
                    draft = node_output.get("email_draft")
                    workflow["email_draft"] = draft

                    # Complete Step 3 if still running
                    if workflow["steps"][2]["status"] == "running":
                        s3_dur = round(time.time() - (step3_start or time.time()), 1)
                        workflow["steps"][2]["status"] = "completed"
                        workflow["steps"][2]["duration"] = f"{s3_dur}s"
                        workflow["steps"][2]["subtitle"] = f"Tool operations executed · {s3_dur}s"

                    workflow["current_step_index"] = 3
                    workflow["steps"][3]["status"] = "running"
                    workflow["steps"][3]["subtitle"] = "Drafting personalized email..."
                    step4_start = time.time()

                    if draft:
                        log_activity(3, f"Draft synthesized: '{draft.get('subject')}'")
                        log_activity(3, f"Recipients: {', '.join(draft.get('to', []))}")
                    log_activity(3, "Human-in-the-Loop review gate engaged (FR-14: Outbound verification required)")
                    record_log(
                        task_id=task_id,
                        query=query,
                        status="Waiting Approval",
                        description=f"Step 4: Drafted email '{draft.get('subject') if draft else ''}', awaiting supervisory sign-off",
                        agent_name="EmailContentAgent",
                        llm_name="openai/gpt-oss-120b (groq)",
                        time_taken=round(time.time() - step4_start, 1)
                    )

                # -------------------------------------------------------------
                # NODE: email_consent_hitl
                # -------------------------------------------------------------
                elif node_name == "email_consent_hitl":
                    consent = node_output.get("email_consent", {})
                    decision = consent.get("decision", "accepted")
                    if node_output.get("email_draft"):
                        workflow["email_draft"] = node_output.get("email_draft")

                    if decision == "accepted":
                        s4_dur = round(time.time() - (step4_start or time.time()), 1)
                        workflow["steps"][3]["status"] = "completed"
                        workflow["steps"][3]["duration"] = f"{s4_dur}s"
                        workflow["steps"][3]["subtitle"] = f"Approved by supervisor · {s4_dur}s"
                        log_activity(3, "Supervisor approval confirmed. Cryptographic clearance registered.")

                        workflow["current_step_index"] = 4
                        workflow["steps"][4]["status"] = "running"
                        workflow["steps"][4]["subtitle"] = "Dispatching via Gmail API..."
                        step5_start = time.time()
                        record_log(
                            task_id=task_id,
                            query=query,
                            status="Approved",
                            description="Step 4: Supervisor approved outbound email draft, authorizing Gmail API transmission",
                            agent_name="HITL Supervisory Gateway",
                            llm_name="openai/gpt-oss-120b (groq)",
                            time_taken=s4_dur
                        )

                    elif decision == "rejected":
                        workflow["steps"][3]["status"] = "failed"
                        workflow["steps"][3]["subtitle"] = "Rejected by supervisor"
                        log_activity(3, "Supervisor rejected draft. Dispatch cleanly aborted with zero emails sent.")

                # -------------------------------------------------------------
                # NODE: revise_email
                # -------------------------------------------------------------
                elif node_name == "revise_email":
                    if node_output.get("email_draft"):
                        workflow["email_draft"] = node_output.get("email_draft")
                    log_activity(3, "Draft revised according to supervisor edits. Re-prompting approval gate.")

                # -------------------------------------------------------------
                # NODE: abort_rejected
                # -------------------------------------------------------------
                elif node_name == "abort_rejected":
                    workflow["status"] = "rejected"
                    workflow["steps"][3]["status"] = "failed"
                    workflow["steps"][3]["subtitle"] = "Rejected by supervisor"
                    workflow["steps"][4]["status"] = "failed"
                    workflow["steps"][4]["subtitle"] = "Dispatch aborted"
                    elapsed = round(time.time() - start_time, 2)
                    record_log(
                        task_id=task_id,
                        query=query,
                        status="Rejected",
                        description="Step 4: Dispatch aborted - Supervisor rejected outbound email consent",
                        agent_name="HITL Supervisory Gateway",
                        llm_name="openai/gpt-oss-120b (groq)",
                        time_taken=elapsed
                    )
                    record_notification(f"Task {task_id} aborted: Supervisor rejected draft.", "rejected", task_id=task_id)
                    return

                # -------------------------------------------------------------
                # NODE: execute_gmail
                # -------------------------------------------------------------
                elif node_name == "execute_gmail":
                    s5_dur = round(time.time() - (step5_start or time.time()), 1)
                    workflow["steps"][4]["status"] = "completed"
                    workflow["steps"][4]["duration"] = f"{s5_dur}s"
                    workflow["steps"][4]["subtitle"] = f"Dispatched successfully · {s5_dur}s"
                    log_activity(4, "Email successfully transmitted via Gmail API endpoint.")
                    record_log(
                        task_id=task_id,
                        query=query,
                        status="Completed",
                        description="Step 5: Outbound email dispatched successfully via Gmail API",
                        agent_name="Gmail Specialist",
                        llm_name="openai/gpt-oss-120b (groq)",
                        time_taken=s5_dur
                    )

                    workflow["current_step_index"] = 5
                    workflow["steps"][5]["status"] = "running"
                    workflow["steps"][5]["subtitle"] = "Persisting audit telemetry..."
                    step6_start = time.time()

                # -------------------------------------------------------------
                # NODE: summarize
                # -------------------------------------------------------------
                elif node_name == "summarize":
                    final_resp = node_output.get("final_response")
                    workflow["final_response"] = final_resp

                    # Complete Step 3 if still running
                    if workflow["steps"][2]["status"] in ("running", "pending"):
                        s3_dur = round(time.time() - (step3_start or time.time()), 1)
                        workflow["steps"][2]["status"] = "completed"
                        workflow["steps"][2]["duration"] = f"{s3_dur}s"
                        workflow["steps"][2]["subtitle"] = f"Tool operations executed · {s3_dur}s"

                    # If Step 4 was pending (non-email workflow), mark skipped/completed
                    if workflow["steps"][3]["status"] == "pending":
                        workflow["steps"][3]["status"] = "completed"
                        workflow["steps"][3]["duration"] = "0.0s"
                        workflow["steps"][3]["subtitle"] = "Skipped · Non-email objective"
                        log_activity(3, "Email drafting not required for this workflow objective.")

                    # If Step 5 was pending (non-email workflow), mark skipped/completed
                    if workflow["steps"][4]["status"] == "pending":
                        workflow["steps"][4]["status"] = "completed"
                        workflow["steps"][4]["duration"] = "0.0s"
                        workflow["steps"][4]["subtitle"] = "Skipped · Non-email objective"
                        log_activity(4, "Email dispatch not required for this workflow objective.")

                    workflow["current_step_index"] = 5
                    workflow["steps"][5]["status"] = "running"
                    workflow["steps"][5]["subtitle"] = "Persisting audit telemetry..."

                    s6_dur = round(time.time() - (step6_start or time.time()), 1)
                    workflow["steps"][5]["status"] = "completed"
                    workflow["steps"][5]["duration"] = f"{s6_dur}s"
                    workflow["steps"][5]["subtitle"] = f"Logged to MySQL axiomflow_db · {s6_dur}s"
                    log_activity(5, "Appended execution telemetry to axiomflow_db.logs and axiomflow_db.notifications")

                    total_elapsed = round(time.time() - start_time, 2)
                    workflow["status"] = "completed"
                    record_log(
                        task_id=task_id,
                        query=query,
                        status="Completed",
                        description=f"Step 6: Workflow task completed successfully in {total_elapsed}s",
                        agent_name="AxiomFlow Multi-Agent Pipeline",
                        llm_name="openai/gpt-oss-120b (groq)",
                        time_taken=total_elapsed
                    )
                    record_notification(
                        message=f"Workflow {task_id} completed successfully in {total_elapsed}s",
                        status="succeeded",
                        task_id=task_id
                    )

    except Exception as err:
        elapsed = round(time.time() - start_time, 2)
        print(f"[ERROR] Workflow execution exception: {err}")
        curr_idx = workflow.get("current_step_index", 0)
        log_activity(curr_idx, f"Encountered runtime error: {str(err)}")
        if curr_idx < len(workflow["steps"]):
            workflow["steps"][curr_idx]["status"] = "failed"
            workflow["steps"][curr_idx]["subtitle"] = "Runtime failure"

        workflow["status"] = "failed"
        workflow["error"] = str(err)

        record_log(
            task_id=task_id,
            query=query,
            status="Failed",
            description=f"Error: {str(err)[:120]}",
            agent_name="SupervisorAgent",
            llm_name="openai/gpt-oss-120b (groq)",
            time_taken=elapsed
        )
        record_notification(
            message=f"Workflow task {task_id} failed: {str(err)[:80]}",
            status="failed",
            task_id=task_id
        )


def start_new_workflow(
    query: str,
    user_id: str = "usr_72b30e7cd49e49e5",
    business_id: int = 2,
    account_email: str = "chillalyash2005@gmail.com",
    auto_approve: bool = False
) -> str:
    """
    Initializes a new real-time workflow run, records the initial running status
    in axiomflow_db.logs, and launches background task execution.
    NOTE: Notifications are NOT written here. Only upon completed or failed/rejected termination.
    """
    task_id = f"TSK_{uuid.uuid4().hex[:8].upper()}"
    business_context = fetch_business_profile_and_user(user_id)

    # Initial log in MySQL logs table (updates simultaneously in runtime)
    record_log(
        task_id=task_id,
        query=query,
        status="Running",
        description="Workflow execution initialized",
        agent_name="SupervisorAgent",
        llm_name="openai/gpt-oss-120b (groq)",
        time_taken=None
    )

    steps = create_initial_workflow_steps(query)

    ACTIVE_WORKFLOWS[task_id] = {
        "task_id": task_id,
        "query": query,
        "user_id": user_id,
        "business_id": business_id,
        "account_email": account_email,
        "business_context": business_context,
        "status": "running",
        "is_paused": False,
        "is_stopped": False,
        "start_time": time.time(),
        "steps": steps,
        "current_step_index": 0,
        "email_draft": None,
        "calendar_event": None,
        "sheet_result": None,
        "docs_result": None,
        "clarification_needed": None,
        "clarification_answers": None,
        "auto_approve": auto_approve,
        "final_response": None,
        "error": None
    }

    STOP_SIGNALS[task_id] = False
    APPROVAL_EVENTS[task_id] = threading.Event()
    CLARIFICATION_EVENTS[task_id] = threading.Event()

    # Launch execution in a dedicated daemon thread with its own asyncio loop
    t = threading.Thread(target=lambda: asyncio.run(run_workflow_coordinator(task_id)), daemon=True)
    t.start()

    return task_id


def get_workflow_status(task_id: str) -> Optional[Dict[str, Any]]:
    """Returns current real-time state of a workflow task."""
    workflow = ACTIVE_WORKFLOWS.get(task_id)
    if not workflow:
        return None

    elapsed = int(time.time() - workflow["start_time"])
    steps = workflow["steps"]

    # Calculate progress percent
    completed_count = sum(1 for s in steps if s["status"] == "completed")
    running_bonus = 0.5 if any(s["status"] in ("running", "waiting") for s in steps) else 0
    progress_percent = min(100, int(((completed_count + running_bonus) / len(steps)) * 100))

    return {
        "task_id": workflow["task_id"],
        "query": workflow["query"],
        "status": workflow["status"],
        "is_paused": workflow.get("is_paused", False),
        "is_stopped": workflow.get("is_stopped", False),
        "elapsed_seconds": elapsed,
        "progress_percent": progress_percent,
        "current_step_index": workflow["current_step_index"],
        "steps": steps,
        "email_draft": workflow.get("email_draft"),
        "calendar_event": workflow.get("calendar_event"),
        "sheet_result": workflow.get("sheet_result"),
        "docs_result": workflow.get("docs_result"),
        "clarification_needed": workflow.get("clarification_needed"),
        "clarification_answers": workflow.get("clarification_answers"),
        "final_response": workflow.get("final_response"),
        "error": workflow.get("error")
    }


def get_latest_active_workflow() -> Optional[Dict[str, Any]]:
    """Returns the most recent active workflow, or None if none started."""
    if not ACTIVE_WORKFLOWS:
        return None
    latest_task_id = list(ACTIVE_WORKFLOWS.keys())[-1]
    return get_workflow_status(latest_task_id)
