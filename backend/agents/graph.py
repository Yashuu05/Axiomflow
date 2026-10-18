import os
import sys
from typing import Literal, Optional, Dict, Any
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.base import BaseCheckpointSaver

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from agents.state import WorkflowState
from agents.nodes.retrieve_context import retrieve_context_node
from agents.nodes.understand import understand_node, interactive_clarification_node
from agents.nodes.plan import plan_node
from agents.nodes.execute import execute_calendar_node, execute_sheet_node, execute_gmail_node, abort_rejected_node
from agents.specialists.content_agent import email_content_node, email_revision_node
from agents.nodes.approval import email_consent_hitl_node
from agents.nodes.summarize import summarize_node


def route_after_understanding(state: WorkflowState) -> Literal["clarify_hitl", "plan"]:
    """Routes to HITL clarification if information is insufficient; otherwise to planning."""
    status = state.get("status")
    if status == "awaiting_clarification":
        return "clarify_hitl"
    return "plan"


def route_after_plan(state: WorkflowState) -> Literal["execute_sheet", "execute_calendar"]:
    """Routes to execute_sheet if the plan includes sheets capabilities; otherwise to execute_calendar."""
    plan = state.get("plan") or {}
    steps = plan.get("steps", [])
    has_sheets = any("sheets" in s.get("capability", "") for s in steps)
    if has_sheets:
        return "execute_sheet"
    return "execute_calendar"


def route_after_email_consent(state: WorkflowState) -> Literal["execute_gmail", "abort_rejected", "revise_email"]:
    """Routes based on user HITL consent decision: accept -> send, reject -> abort, update -> revise."""
    consent = state.get("email_consent") or {}
    decision = consent.get("decision", "accepted")

    if decision == "accepted":
        return "execute_gmail"
    elif decision == "rejected":
        return "abort_rejected"
    elif decision == "updated":
        return "revise_email"
    return "execute_gmail"


def build_workflow_graph(checkpointer: Optional[BaseCheckpointSaver] = None):
    """
    Constructs and compiles the complete LangGraph state machine connecting:
    - Context Loading & Sufficiency Assessment
    - Supervisor Planning & HITL Clarification
    - Specialist Execution: Calendar Agent OR Sheet Agent via FastMCP
    - Email Content Agent drafting with live link & CSV attachments
    - Email Consent HITL (Accept, Reject, Update Loop)
    - FastMCP Gmail Send execution
    - Audit Summarization
    """
    workflow = StateGraph(WorkflowState)

    # Execution Nodes
    workflow.add_node("retrieve_context", retrieve_context_node)
    workflow.add_node("understand", understand_node)
    workflow.add_node("clarify_hitl", interactive_clarification_node)
    workflow.add_node("plan", plan_node)
    workflow.add_node("execute_calendar", execute_calendar_node)
    workflow.add_node("execute_sheet", execute_sheet_node)
    workflow.add_node("draft_email", email_content_node)
    workflow.add_node("email_consent_hitl", email_consent_hitl_node)
    workflow.add_node("revise_email", email_revision_node)
    workflow.add_node("execute_gmail", execute_gmail_node)
    workflow.add_node("abort_rejected", abort_rejected_node)
    workflow.add_node("summarize", summarize_node)

    # Workflow Edges
    workflow.add_edge(START, "retrieve_context")
    workflow.add_edge("retrieve_context", "understand")

    # Sufficiency Branching: If missing info -> clarify_hitl; else -> plan
    workflow.add_conditional_edges(
        "understand",
        route_after_understanding,
        {
            "clarify_hitl": "clarify_hitl",
            "plan": "plan"
        }
    )
    workflow.add_edge("clarify_hitl", "plan")

    # Specialist Routing: Plan -> execute_sheet OR execute_calendar -> draft_email
    workflow.add_conditional_edges(
        "plan",
        route_after_plan,
        {
            "execute_sheet": "execute_sheet",
            "execute_calendar": "execute_calendar"
        }
    )
    workflow.add_edge("execute_sheet", "draft_email")
    workflow.add_edge("execute_calendar", "draft_email")
    workflow.add_edge("draft_email", "email_consent_hitl")

    # Email Consent Branching: Accept -> Gmail MCP, Reject -> Abort, Update -> Revise -> Consent
    workflow.add_conditional_edges(
        "email_consent_hitl",
        route_after_email_consent,
        {
            "execute_gmail": "execute_gmail",
            "abort_rejected": "abort_rejected",
            "revise_email": "revise_email"
        }
    )

    # Revision Loop: Revise email and re-prompt HITL consent
    workflow.add_edge("revise_email", "email_consent_hitl")

    # Terminal transitions
    workflow.add_edge("execute_gmail", "summarize")
    workflow.add_edge("abort_rejected", "summarize")
    workflow.add_edge("summarize", END)

    return workflow.compile(checkpointer=checkpointer)
