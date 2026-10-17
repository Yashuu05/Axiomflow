from typing import Literal, Optional, Dict, Any
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.base import BaseCheckpointSaver

from agents.state import WorkflowState

# Import node handlers
# Note: For initial scaffolding, default pass-through implementations are provided
# which will be enriched as specialist nodes are integrated.

def understand_node(state: WorkflowState) -> Dict[str, Any]:
    """Interprets the natural language request and prepares intent context."""
    return {"status": "planning"}

def plan_node(state: WorkflowState) -> Dict[str, Any]:
    """Generates structured capability execution plan."""
    return {"status": "planning"}

def retrieve_context_node(state: WorkflowState) -> Dict[str, Any]:
    """Executes read-only operations to gather bounded context."""
    return {"status": "running"}

def draft_content_node(state: WorkflowState) -> Dict[str, Any]:
    """Drafts proposed content (e.g. email or calendar invite) using ContentAgent."""
    return {"status": "running"}

def validate_node(state: WorkflowState) -> Dict[str, Any]:
    """Validates schemas, recipient boundaries, and permissions."""
    return {"status": "running"}

def approval_node(state: WorkflowState) -> Dict[str, Any]:
    """Interrupt / pause gate for human review of consequential actions."""
    return {"status": "waiting_approval"}

def execute_tools_node(state: WorkflowState) -> Dict[str, Any]:
    """Executes approved deterministic tools against Google Workspace APIs."""
    return {"status": "running"}

def summarize_node(state: WorkflowState) -> Dict[str, Any]:
    """Generates structured final user summary report."""
    return {"status": "succeeded"}

def route_after_validation(state: WorkflowState) -> Literal["approval", "execute_tools", "summarize"]:
    """Conditional routing based on risk level and approval requirement."""
    pending = state.get("pending_approval")
    if pending and pending.get("status") == "pending":
        return "approval"

    plan = state.get("plan")
    if plan and plan.get("steps"):
        return "execute_tools"

    return "summarize"

def route_after_approval(state: WorkflowState) -> Literal["execute_tools", "summarize"]:
    """Conditional routing after human decision."""
    pending = state.get("pending_approval")
    if pending and pending.get("status") == "approved":
        return "execute_tools"
    return "summarize"

def build_workflow_graph(checkpointer: Optional[BaseCheckpointSaver] = None):
    """
    Constructs and compiles the core LangGraph state machine workflow.
    """
    workflow = StateGraph(WorkflowState)

    # Add execution nodes
    workflow.add_node("understand", understand_node)
    workflow.add_node("plan", plan_node)
    workflow.add_node("retrieve_context", retrieve_context_node)
    workflow.add_node("draft_content", draft_content_node)
    workflow.add_node("validate", validate_node)
    workflow.add_node("approval", approval_node)
    workflow.add_node("execute_tools", execute_tools_node)
    workflow.add_node("summarize", summarize_node)

    # Add edges defining workflow structure
    workflow.add_edge(START, "understand")
    workflow.add_edge("understand", "plan")
    workflow.add_edge("plan", "retrieve_context")
    workflow.add_edge("retrieve_context", "draft_content")
    workflow.add_edge("draft_content", "validate")

    # Conditional branching
    workflow.add_conditional_edges(
        "validate",
        route_after_validation,
        {
            "approval": "approval",
            "execute_tools": "execute_tools",
            "summarize": "summarize",
        }
    )

    workflow.add_conditional_edges(
        "approval",
        route_after_approval,
        {
            "execute_tools": "execute_tools",
            "summarize": "summarize",
        }
    )

    workflow.add_edge("execute_tools", "summarize")
    workflow.add_edge("summarize", END)

    # Compile with optional checkpointer (for pause/resume approval flows)
    return workflow.compile(checkpointer=checkpointer)
