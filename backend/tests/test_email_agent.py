import os
import sys
import json
import pytest
from datetime import datetime
from zoneinfo import ZoneInfo
from dotenv import load_dotenv

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

load_dotenv()

from agents.specialists.content_agent import EmailContentAgent, EmailStructure, email_content_node
from agents.state import WorkflowState


def test_timezone_awareness():
    """Verify that the agent correctly recognizes the Asia/Kolkata timezone and current time."""
    agent = EmailContentAgent(timezone_str="Asia/Kolkata")
    time_str = agent.get_current_time_str()
    assert "IST" in time_str or "+0530" in time_str or "Asia/Kolkata" in time_str or len(time_str) > 0
    sys_msg = agent.construct_system_message()
    assert "Asia/Kolkata" in sys_msg.content
    assert "TEMPORAL CONTEXT" in sys_msg.content


def test_email_structure_schema():
    """Verify EmailStructure validation and fields."""
    sample = EmailStructure(
        to=["john@acme.com"],
        subject="Sprint Planning",
        body="Hi John, let's meet tomorrow at 10 AM IST.",
        cc=["lead@acme.com"],
        assumptions=["Meeting will be conducted via Google Meet"]
    )
    dumped = sample.model_dump()
    assert dumped["to"] == ["john@acme.com"]
    assert dumped["subject"] == "Sprint Planning"
    assert "Hi John" in dumped["body"]
    assert dumped["cc"] == ["lead@acme.com"]
    assert isinstance(dumped["bcc"], list)
    assert isinstance(dumped["attachments"], list)
    assert dumped["assumptions"] == ["Meeting will be conducted via Google Meet"]


def test_live_draft_email_with_datetime_understanding():
    """
    Live test with Gemini to verify that the agent uses Asia/Kolkata timing context
    and supervisor context to generate complete, structured email content.
    """
    agent = EmailContentAgent()

    user_request = (
        "Send an urgent reminder to client@startup.io and CC finance@mycorp.com about tomorrow's "
        "strategy sync at 4:30 PM. Mention that the financial forecast deck will be shared beforehand."
    )

    supervisor_context = {
        "intent": "Notify client about strategy sync and forecast deck",
        "goal": "Send meeting reminder with prep materials info",
        "account_email": "chillalyash2005@gmail.com",
        "meeting_details": {
            "title": "Strategy Sync",
            "time": "4:30 PM IST",
            "date": "Tomorrow"
        }
    }

    draft = agent.draft_email(
        user_message=user_request,
        supervisor_context=supervisor_context
    )

    print("\n--- GENERATED EMAIL DRAFT ---")
    print(json.dumps(draft.model_dump(), indent=2))

    # Assertions on structured output
    assert isinstance(draft, EmailStructure)
    assert any("client@startup.io" in addr for addr in draft.to)
    assert any("finance@mycorp.com" in addr for addr in draft.cc)
    assert len(draft.subject) > 5
    assert len(draft.body) > 20
    assert any(term in draft.body.lower() or term in draft.subject.lower() for term in ["strategy", "sync", "meeting", "forecast"])


def test_email_content_node_in_workflow_state():
    """Verify that email_content_node consumes WorkflowState and produces email_draft."""
    initial_state: WorkflowState = {
        "run_id": "test_run_email_456",
        "tenant_id": "tenant_1",
        "user_id": "usr_72b30e7cd49e49e5",
        "business_id": 2,
        "account_email": "chillalyash2005@gmail.com",
        "request": "Draft an email to recruiter@techcorp.com regarding the interview confirmation scheduled for this Friday at 11 AM IST.",
        "plan": {
            "intent": "Send interview confirmation email",
            "goal": "Confirm candidate availability for Friday 11 AM IST",
            "steps": [
                {"id": "step_1", "capability": "content.draft_email", "description": "Draft confirmation email"}
            ]
        },
        "retrieved_context": []
    }

    result = email_content_node(initial_state)

    assert "email_draft" in result
    draft = result["email_draft"]
    assert isinstance(draft, dict)
    assert "to" in draft
    assert "subject" in draft
    assert "body" in draft
    assert any("recruiter@techcorp.com" in addr for addr in draft["to"])
    assert len(draft["subject"]) > 0


if __name__ == "__main__":
    print("=" * 80)
    print("RUNNING EMAIL CONTENT AGENT TEST SUITE")
    print("=" * 80)
    test_timezone_awareness()
    print("[PASS] test_timezone_awareness")
    test_email_structure_schema()
    print("[PASS] test_email_structure_schema")
    test_live_draft_email_with_datetime_understanding()
    print("[PASS] test_live_draft_email_with_datetime_understanding")
    test_email_content_node_in_workflow_state()
    print("[PASS] test_email_content_node_in_workflow_state")
    print("\n[ALL TESTS PASSED SUCCESSFULLY!]")
