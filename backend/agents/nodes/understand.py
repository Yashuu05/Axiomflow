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
    LangGraph node: Evaluates user request against safety, ethics, and business context to determine
    if request is compliant and information is sufficient for tool execution.
    """
    request = state.get("request", "")
    business_context = state.get("business_context", {})

    agent = SupervisorAgent()
    assessment = agent.assess_sufficiency(request=request, business_context=business_context)

    assessment_dict = assessment.model_dump()
    policy_check = assessment.policy_check

    if policy_check and not policy_check.is_allowed:
        print("\n" + "=" * 80)
        print("     [UNDERSTAND NODE] EXECUTION TERMINATED BY POLICY GUARDRAIL")
        print("=" * 80)
        print(f"Refusal Reason:  {policy_check.violation_reason}")
        print(f"Refusal Message: {policy_check.refusal_message}")
        print("=" * 80 + "\n")
        return {
            "sufficiency_assessment": assessment_dict,
            "final_response": policy_check.refusal_message,
            "status": "policy_rejected"
        }

    is_sufficient = assessment.is_sufficient

    return {
        "sufficiency_assessment": assessment_dict,
        "status": "planning" if is_sufficient else "awaiting_clarification"
    }


import asyncio

async def interactive_clarification_node(state: WorkflowState) -> Dict[str, Any]:
    """
    Human-In-The-Loop Clarification Node:
    If the request was underspecified, asks all missing questions in a single unified prompt.
    Supports interactive web dashboard input, interactive terminal input, and pre-configured mock answers for tests.
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

    # Interactive Terminal Input / Observability Logging
    print("\n" + "=" * 80)
    print("           SUPERVISOR AGENT: HUMAN-IN-THE-LOOP CLARIFICATION REQUIRED")
    print("=" * 80)
    print("To execute this task accurately, please answer the following questions:\n")
    for idx, q in enumerate(questions, 1):
        print(f"  [{idx}] {q}")
    print("-" * 80)

    # Check if running in web dashboard session
    is_web = (
        state.get("is_web_session", False)
        or bool(state.get("task_id") and str(state.get("task_id")).startswith("TSK_"))
        or bool(state.get("run_id") and str(state.get("run_id")).startswith("TSK_"))
    )

    if is_web:
        task_id = state.get("task_id") or state.get("run_id")
        import workflow_service
        workflow_service.set_workflow_waiting_clarification(task_id, assessment)
        clarification_event = workflow_service.get_or_create_clarification_event(task_id)
        print(f"[WEB DASHBOARD HITL] Awaiting human input via dashboard interface for task {task_id} (Timeout: 600s)...")
        is_set = await asyncio.to_thread(clarification_event.wait, 600)
        if not is_set:
            print(f"[WARNING] Clarification input timed out after 600s for task {task_id}.")
            gathered_answers = {}
        else:
            gathered_answers = workflow_service.get_clarification_answers(task_id)
            print(f"[SUCCESS] Received human operator clarification answers for task {task_id}: {gathered_answers}")

        return {
            "clarification_answers": gathered_answers,
            "status": "planning"
        }

    is_interactive = hasattr(sys.stdin, "isatty") and sys.stdin.isatty() and not is_web

    business_context = state.get("business_context") or {}
    default_email = (
        business_context.get("account_email")
        or business_context.get("business_email")
        or business_context.get("email")
        or "chillalyash2005@gmail.com"
    )

    gathered_answers: Dict[str, str] = {}
    if not is_interactive:
        print("[NON-INTERACTIVE AUTOMATED TEST DETECTED] Applying business context defaults for clarification...")
        for idx, q in enumerate(questions, 1):
            if "email" in q.lower() or "recipient" in q.lower() or "attendee" in q.lower():
                gathered_answers[f"question_{idx}"] = default_email
            elif "duration" in q.lower() or "long" in q.lower() or "time" in q.lower():
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
                ans = f"{default_email}, 1 hour, auto-generate Google Meet link"
            gathered_answers[f"question_{idx}"] = ans or "Standard defaults"

    print("=" * 80)
    print("[SUCCESS] Clarification answers recorded. Resuming planning...")
    print("=" * 80 + "\n")

    return {
        "clarification_answers": gathered_answers,
        "status": "planning"
    }
