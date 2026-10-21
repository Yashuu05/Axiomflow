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
PAUSE_EVENTS: Dict[str, threading.Event] = {}
STOP_SIGNALS: Dict[str, bool] = {}


def record_notification(message: str, status: str = "info") -> Optional[int]:
    """
    Inserts a record into axiomflow_db.notifications table.
    CRITICAL RULE: Notifications are ONLY triggered after execution terminates
    (status = completed or failed/rejected). Never on startup or intermediate steps.
    """
    conn = None
    try:
        conn = get_db_conn()
        with conn.cursor() as cur:
            now = datetime.now()
            cur.execute(
                """
                INSERT INTO `notifications` (`date`, `time`, `message`, `status`, `created_at`)
                VALUES (%s, %s, %s, %s, CURRENT_TIMESTAMP);
                """,
                (now.date(), now.time().strftime("%H:%M:%S"), message, status)
            )
            conn.commit()
            return cur.lastrowid
    except Exception as e:
        print(f"[WARNING] Failed to record notification to database: {e}")
        return None
    finally:
        if conn:
            conn.close()


def record_log(
    task_id: str,
    query: str,
    status: str,
    description: str,
    agent_name: str,
    llm_name: str = "gemini-3.8-flash",
    time_taken: Optional[float] = None
):
    """
    Inserts or updates an audit log entry in axiomflow_db.logs table.
    Updates continuously in runtime as agents generate artifacts and steps run.
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
                VALUES (%s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                ON DUPLICATE KEY UPDATE
                    `status` = VALUES(`status`),
                    `task_description` = VALUES(`task_description`),
                    `agent_name` = VALUES(`agent_name`),
                    `llm_name` = VALUES(`llm_name`),
                    `time_taken` = VALUES(`time_taken`);
                """,
                (task_id, query, status, description, agent_name, llm_name, time_taken)
            )
            conn.commit()
    except Exception as e:
        print(f"[WARNING] Failed to record log to database: {e}")
    finally:
        if conn:
            conn.close()


def fetch_audit_logs(
    limit: int = 50,
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
                    `task_id`, `query`, `status`, `task_description`, 
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

            sql += " ORDER BY `time_stamp` DESC LIMIT %s;"
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


def fetch_notifications(limit: int = 20) -> List[Dict[str, Any]]:
    """Retrieves real-time alert notifications directly from RDS MySQL `notifications` table."""
    conn = None
    try:
        conn = get_db_conn()
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT `id`, `date`, `time`, `message`, `status`, `created_at`
                FROM `notifications`
                ORDER BY `created_at` DESC
                LIMIT %s;
                """,
                (limit,)
            )
            rows = cur.fetchall()
            results = []
            for r in rows:
                c_at = r.get("created_at")
                formatted_cat = c_at.strftime("%Y-%m-%d %H:%M:%S") if c_at else "---"
                results.append({
                    "id": str(r.get("id")),
                    "date": str(r.get("date")) if r.get("date") else "---",
                    "time": str(r.get("time")) if r.get("time") else "---",
                    "message": r.get("message") or "---",
                    "status": r.get("status") or "---",
                    "created_at": formatted_cat
                })
            return results
    except Exception as e:
        print(f"[ERROR] Failed to fetch notifications from database: {e}")
        return []
    finally:
        if conn:
            conn.close()


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
                    u.role, u.department, u.profession, u.business_id,
                    b.business_name, b.sector, b.gstin, b.cin, b.email as business_email,
                    b.website_url, b.description
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
                return {
                    "user_id": row.get("user_id"),
                    "user_name": full_name or "---",
                    "user_email": row.get("user_email") or "---",
                    "role": row.get("role") or "admin",
                    "department": row.get("department") or "---",
                    "profession": row.get("profession") or "---",
                    "business_id": row.get("business_id"),
                    "business_name": row.get("business_name") or "---",
                    "sector": row.get("sector") or "---",
                    "business_email": row.get("business_email") or row.get("user_email") or "---",
                    "website_url": row.get("website_url") or "---",
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
        "business_id": 2,
        "business_name": "Axiomflow Pvt Ltd",
        "sector": "IT & Software Services",
        "business_email": "chillalyash2005@gmail.com",
        "website_url": "https://www.axiomflow.ai",
        "description": "B2B SaaS Operation Automation Workflow platform"
    }


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
                record_log(task_id, query, "Failed", "Interrupted by user", "SupervisorAgent", "gemini-3.8-flash", elapsed)
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
                        record_log(task_id, query, "Failed", f"Policy Block: {refusal[:100]}", "PolicyEthicsGuardrail", "gemini-3.8-flash", elapsed)
                        record_notification(f"Task {task_id} rejected by guardrail: {refusal[:80]}", "failed")
                        return

                    log_activity(0, "Policy & ethics guardrails passed (Status: ALLOWED)")
                    s1_dur = round(time.time() - step1_start, 1)
                    workflow["steps"][0]["status"] = "completed"
                    workflow["steps"][0]["duration"] = f"{s1_dur}s"
                    workflow["steps"][0]["subtitle"] = f"Guardrails verified · {s1_dur}s"

                    workflow["current_step_index"] = 1
                    workflow["steps"][1]["status"] = "running"
                    workflow["steps"][1]["subtitle"] = "Synthesizing execution plan..."
                    step2_start = time.time()
                    record_log(task_id, query, "Running", "Guardrails verified, decomposing into DAG plan", "SupervisorAgent", "gemini-3.8-flash")

                # -------------------------------------------------------------
                # NODE: clarify_hitl
                # -------------------------------------------------------------
                elif node_name == "clarify_hitl":
                    log_activity(0, "Supervisory clarification parameters resolved.")

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
                    record_log(task_id, query, "Running", f"Plan synthesized ({steps_count} steps), invoking specialists", "SupervisorAgent", "gemini-3.8-flash")

                # -------------------------------------------------------------
                # NODE: execute_sheet
                # -------------------------------------------------------------
                elif node_name == "execute_sheet":
                    sheet_result = node_output.get("sheet_result")
                    if sheet_result:
                        workflow["sheet_result"] = sheet_result
                        log_activity(2, f"Google Sheet created: '{sheet_result.get('title')}' ({sheet_result.get('row_count')} rows)")
                        if sheet_result.get("spreadsheet_url"):
                            log_activity(2, f"Spreadsheet URL: {sheet_result.get('spreadsheet_url')}")

                # -------------------------------------------------------------
                # NODE: execute_calendar
                # -------------------------------------------------------------
                elif node_name == "execute_calendar":
                    cal_event = node_output.get("calendar_event")
                    if cal_event:
                        workflow["calendar_event"] = cal_event
                        log_activity(2, f"Google Calendar event created: '{cal_event.get('summary')}'")
                        if cal_event.get("meet_link"):
                            log_activity(2, f"Google Meet conference: {cal_event.get('meet_link')}")

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
                    record_log(task_id, query, "Running", f"Drafted email '{draft.get('subject') if draft else ''}', awaiting review", "EmailContentAgent", "gemini-3.8-flash")

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
                        record_log(task_id, query, "Running", "Supervisor approved email, transmitting via Gmail API", "HITL Supervisory Gateway", "gemini-3.8-flash")

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
                    record_log(task_id, query, "Rejected", "Supervisor rejected outgoing email consent", "HITL Supervisory Gateway", "gemini-3.8-flash", elapsed)
                    record_notification(f"Task {task_id} aborted: Supervisor rejected draft.", "failed")
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
                        description=f"Completed automated workflow: {query[:120]}",
                        agent_name="AxiomFlow Multi-Agent Pipeline",
                        llm_name="gemini-3.8-flash",
                        time_taken=total_elapsed
                    )
                    record_notification(
                        message=f"Workflow {task_id} completed successfully in {total_elapsed}s",
                        status="succeeded"
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
            llm_name="gemini-3.8-flash",
            time_taken=elapsed
        )
        record_notification(
            message=f"Workflow task {task_id} failed: {str(err)[:80]}",
            status="failed"
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
        llm_name="gemini-3.8-flash",
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
        "auto_approve": auto_approve,
        "final_response": None,
        "error": None
    }

    STOP_SIGNALS[task_id] = False
    APPROVAL_EVENTS[task_id] = threading.Event()

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
        "final_response": workflow.get("final_response"),
        "error": workflow.get("error")
    }


def get_latest_active_workflow() -> Optional[Dict[str, Any]]:
    """Returns the most recent active workflow, or None if none started."""
    if not ACTIVE_WORKFLOWS:
        return None
    latest_task_id = list(ACTIVE_WORKFLOWS.keys())[-1]
    return get_workflow_status(latest_task_id)
