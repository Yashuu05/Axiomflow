import os
import sys
from typing import Dict, Any

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from agents.state import WorkflowState
from agents.supervisior.node import SupervisorAgent


def plan_node(state: WorkflowState) -> Dict[str, Any]:
    """
    LangGraph node: Generates validated structured execution plan from user request,
    incorporating business context and any user clarification answers.
    """
    request = state.get("request", "")
    business_context = state.get("business_context", {})
    clarification_answers = state.get("clarification_answers")

    agent = SupervisorAgent()
    plan = agent.generate_plan(
        request=request,
        business_context=business_context,
        clarification_answers=clarification_answers
    )

    has_sheets = any("sheets" in s.capability for s in plan.steps)
    has_docs = any("docs" in s.capability for s in plan.steps)
    has_cal = any("calendar" in s.capability for s in plan.steps)

    next_status = (
        "executing_sheet" if has_sheets
        else ("executing_docs" if has_docs
        else ("executing_calendar" if has_cal
        else "drafting_email"))
    )

    return {
        "plan": plan.model_dump(),
        "status": next_status
    }

