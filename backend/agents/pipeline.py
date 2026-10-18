import os
import sys
import uuid
import asyncio
from typing import Dict, Any, Optional

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from dotenv import load_dotenv
load_dotenv()

from agents.state import WorkflowState
from agents.graph import build_workflow_graph


async def run_pipeline(
    request: str,
    user_id: str = "usr_72b30e7cd49e49e5",
    account_email: str = "chillalyash2005@gmail.com",
    business_id: Optional[int] = 2,
    business_context: Optional[Dict[str, Any]] = None,
    mock_clarifications: Optional[Dict[str, str]] = None,
    mock_consent: Optional[str] = None,
    mock_feedback: Optional[str] = None
) -> WorkflowState:
    """
    Executes the end-to-end AxiomFlow agent pipeline.
    Connects:
      - Supervisor assessment & HITL clarification
      - Calendar Agent & FastMCP tool execution
      - Email Content Agent & HITL consent review
      - FastMCP Gmail send & summarization
    """
    run_id = f"run_{uuid.uuid4().hex[:12]}"

    initial_state: WorkflowState = {
        "run_id": run_id,
        "tenant_id": "tenant_axiomflow_main",
        "user_id": user_id,
        "business_id": business_id or 2,
        "account_email": account_email,
        "request": request,
        "business_context": business_context or {},
        "current_step_index": 0,
        "tool_outcomes": [],
        "fallback_logs": [],
        "errors": [],
        "revision_count": 0,
        "status": "initializing"
    }

    if mock_clarifications:
        initial_state["clarification_answers"] = mock_clarifications

    if mock_consent:
        initial_state["email_consent"] = {
            "decision": mock_consent,
            "user_feedback": mock_feedback,
            "revision_count": 0
        }

    graph = build_workflow_graph()

    print("\n" + "=" * 80)
    print(f"STARTING AGENTIC PIPELINE (Run ID: {run_id})")
    print(f"Request: \"{request}\"")
    print(f"User ID: {user_id} | Account: {account_email}")
    print("=" * 80)

    final_state = await graph.ainvoke(initial_state)

    print("\n" + final_state.get("final_response", "[Pipeline execution finished]"))
    return final_state


def main_interactive_cli():
    """Terminal entry point for running the pipeline interactively."""
    print("=" * 80)
    print("             AXIOMFLOW END-TO-END AGENTIC PIPELINE CLI")
    print("=" * 80)
    default_prompt = "schedule meeting on 26th Oct 4:00 p.m and send reminder emails."
    print(f"Default example: \"{default_prompt}\"")
    
    try:
        user_input = input("\nEnter your business request (press Enter for default): ").strip()
    except EOFError:
        user_input = ""

    request_text = user_input if user_input else default_prompt

    asyncio.run(run_pipeline(
        request=request_text,
        user_id="usr_72b30e7cd49e49e5",
        account_email="chillalyash2005@gmail.com"
    ))


if __name__ == "__main__":
    main_interactive_cli()
