import os
import sys
import asyncio
from typing import Dict, Any

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from agents.state import WorkflowState
from agents.specialists.calendar_agent import CalendarAgent
from agents.specialists.sheet_agent import sheet_agent_execution_node
from agents.specialists.docs_agent import docs_agent_execution_node
from tools.gmail_tools import gmail_mcp


async def execute_sheet_node(state: WorkflowState) -> Dict[str, Any]:
    """
    LangGraph node: Executes Google Sheets creation and population via SheetAgent and FastMCP.
    """
    return await sheet_agent_execution_node(state)


async def execute_docs_node(state: WorkflowState) -> Dict[str, Any]:
    """
    LangGraph node: Executes Google Docs operations via DocsAgent and FastMCP.
    """
    return await docs_agent_execution_node(state)


async def execute_calendar_node(state: WorkflowState) -> Dict[str, Any]:
    """
    LangGraph node: Executes Google Calendar event creation via FastMCP tool.
    Normalizes time, adds Google Meet video link, and invites attendees.
    """
    user_id = state.get("user_id", "usr_72b30e7cd49e49e5")
    account_email = state.get("account_email", "")
    request = state.get("request", "")
    plan = state.get("plan", {})
    clarification_answers = state.get("clarification_answers")

    calendar_params = {}
    if plan and "steps" in plan:
        for s in plan["steps"]:
            if "calendar" in s.get("capability", ""):
                calendar_params = s.get("parameters", {})
                break

    agent = CalendarAgent()
    spec = agent.interpret_event_parameters(
        request=request,
        plan_parameters=calendar_params,
        clarification_answers=clarification_answers
    )

    calendar_result = await agent.schedule_event_via_mcp(
        user_id=user_id,
        account_email=account_email,
        spec=spec
    )

    outcomes = list(state.get("tool_outcomes", []))
    outcomes.append({
        "step_id": "calendar_create_event",
        "capability": "calendar.create_event",
        "status": "succeeded",
        "resource_id": calendar_result.event_id,
        "data": calendar_result.model_dump()
    })

    return {
        "calendar_event": calendar_result.model_dump(),
        "tool_outcomes": outcomes,
        "status": "drafting_email"
    }


async def execute_gmail_node(state: WorkflowState) -> Dict[str, Any]:
    """
    LangGraph node: Dispatches approved email via FastMCP Gmail tool with attachments.
    """
    user_id = state.get("user_id", "usr_72b30e7cd49e49e5")
    account_email = state.get("account_email", "")
    draft = state.get("email_draft") or {}
    sheet_result = state.get("sheet_result")

    attachments = list(draft.get("attachments") or [])
    if not any("csv" in str(a.get("filename", "")).lower() for a in attachments) and sheet_result and sheet_result.get("csv_content"):
        filename = f"{sheet_result.get('title', 'sales')}.csv"
        attachments.append({
            "filename": filename,
            "content": sheet_result.get("csv_content"),
            "maintype": "text",
            "subtype": "csv"
        })

    docs_result = state.get("docs_result")
    if docs_result and not any("doc" in str(a.get("filename", "")).lower() for a in attachments):
        doc_title = docs_result.get("title", "sales_insights")
        doc_filename = doc_title if doc_title.endswith((".docx", ".txt", ".doc")) else f"{doc_title}.docx"
        doc_content = docs_result.get("content_preview", "Sales Insights Document Content")
        attachments.append({
            "filename": doc_filename,
            "content": doc_content,
            "maintype": "text",
            "subtype": "plain"
        })

    tool_args = {
        "user_id": user_id,
        "account_email": account_email,
        "to": draft.get("to", []),
        "subject": draft.get("subject", "AxiomFlow Automated Notification"),
        "body": draft.get("body", ""),
        "cc": draft.get("cc", []),
        "bcc": draft.get("bcc", []),
        "attachments": attachments
    }

    print("\n" + "=" * 80)
    print("             [GMAIL EXECUTION AGENT] SENDING EMAIL VIA FASTMCP")
    print("=" * 80)
    print(f"From (Authorized): {account_email}")
    print(f"To:                {tool_args['to']}")
    print(f"Subject:           {tool_args['subject']}")
    print(f"Attachments:       {[a.get('filename') for a in attachments] if attachments else 'None'}")
    print("-" * 80)
    print("Invoking FastMCP 'gmail_send_email'...")

    mcp_result = await gmail_mcp.call_tool("gmail_send_email", tool_args)
    if mcp_result.is_error:
        raise RuntimeError(f"FastMCP gmail_send_email failed: {mcp_result.content}")

    raw_data = mcp_result.structured_content or {}
    payload = raw_data.get("result", raw_data)

    print("[GMAIL EXECUTION AGENT] [SUCCESS] Email dispatched successfully!")
    print(f"  Message ID: {payload.get('message_id')}")
    print(f"  Thread ID:  {payload.get('thread_id')}")
    print(f"  Has Attachments: {payload.get('has_attachments')}")
    print("=" * 80 + "\n")

    outcomes = list(state.get("tool_outcomes", []))
    outcomes.append({
        "step_id": "gmail_send_email",
        "capability": "gmail.send",
        "status": "succeeded",
        "resource_id": payload.get("message_id"),
        "data": payload
    })

    return {
        "tool_outcomes": outcomes,
        "status": "succeeded"
    }


def abort_rejected_node(state: WorkflowState) -> Dict[str, Any]:
    """
    LangGraph node: Cleanly terminates execution if user rejected consent.
    """
    outcomes = list(state.get("tool_outcomes", []))
    outcomes.append({
        "step_id": "email_consent",
        "capability": "gmail.send",
        "status": "skipped",
        "resource_id": None,
        "data": {"reason": "User rejected email draft consent"}
    })

    return {
        "tool_outcomes": outcomes,
        "status": "rejected"
    }
