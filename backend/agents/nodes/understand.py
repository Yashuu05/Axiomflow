import os
import sys
from typing import Dict, Any, List

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from agents.state import WorkflowState
from agents.supervisior.node import SupervisorAgent


def understand_node(state: WorkflowState) -> Dict[str, Any]:
    """
    LangGraph node: Evaluates user request against business context to determine
    if information is sufficient for tool execution.
    """
    request = state.get("request", "")
    business_context = state.get("business_context", {})

    agent = SupervisorAgent()
    assessment = agent.assess_sufficiency(request=request, business_context=business_context)

    assessment_dict = assessment.model_dump()
    is_sufficient = assessment.is_sufficient

    return {
        "sufficiency_assessment": assessment_dict,
        "status": "planning" if is_sufficient else "awaiting_clarification"
    }


def interactive_clarification_node(state: WorkflowState) -> Dict[str, Any]:
    """
    Human-In-The-Loop Clarification Node:
    If the request was underspecified, asks all missing questions in a single unified prompt.
    Supports both interactive terminal input and pre-configured mock answers for tests.
    """
    assessment = state.get("sufficiency_assessment") or {}
    questions: List[str] = assessment.get("questions", [])
    existing_answers = state.get("clarification_answers")

    # If answers already provided programmatically, proceed
    if existing_answers:
        return {
            "clarification_answers": existing_answers,
            "status": "planning"
        }

    # If no questions needed, pass through
    if not questions:
        return {"status": "planning"}

    # Interactive Terminal Input
    print("\n" + "=" * 80)
    print("           SUPERVISOR AGENT: HUMAN-IN-THE-LOOP CLARIFICATION REQUIRED")
    print("=" * 80)
    print("To execute this task accurately, please answer the following questions:\n")
    for idx, q in enumerate(questions, 1):
        print(f"  [{idx}] {q}")
    print("-" * 80)

    # Check if running in non-interactive environment (CI / background / test runner)
    is_interactive = hasattr(sys.stdin, "isatty") and sys.stdin.isatty()

    gathered_answers: Dict[str, str] = {}
    if not is_interactive:
        print("[NON-INTERACTIVE DETECTED] Applying automated fallback defaults for clarification...")
        for idx, q in enumerate(questions, 1):
            if "email" in q.lower() or "recipient" in q.lower():
                gathered_answers[f"question_{idx}"] = "yashvary13@gmail.com"
            elif "duration" in q.lower() or "long" in q.lower():
                gathered_answers[f"question_{idx}"] = "60 minutes"
            elif "meet" in q.lower() or "link" in q.lower() or "url" in q.lower():
                gathered_answers[f"question_{idx}"] = "Auto-generate Google Meet link"
            else:
                gathered_answers[f"question_{idx}"] = "Standard defaults"
    else:
        for idx, q in enumerate(questions, 1):
            try:
                ans = input(f"Answer for Question [{idx}]: ").strip()
            except (EOFError, KeyboardInterrupt):
                ans = "yashvary13@gmail.com, 1 hour, auto-generate Google Meet link"
            gathered_answers[f"question_{idx}"] = ans or "Standard defaults"

    print("=" * 80)
    print("[SUCCESS] All clarification answers recorded. Resuming planning...")
    print("=" * 80 + "\n")

    return {
        "clarification_answers": gathered_answers,
        "status": "planning"
    }
