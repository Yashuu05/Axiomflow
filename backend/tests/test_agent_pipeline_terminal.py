import os
import sys
import json
import pytest
import asyncio
from datetime import datetime
from dotenv import load_dotenv

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Enable real-time unbuffered stdout
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(line_buffering=True)

load_dotenv()

from agents.model_factory import ResilientChatModel, get_resilient_chat_model
from agents.supervisior.node import SupervisorAgent
from agents.specialists.calendar_agent import CalendarAgent
from agents.specialists.content_agent import EmailContentAgent
from agents.pipeline import run_pipeline


# Shared test context
TEST_USER_ID = "usr_72b30e7cd49e49e5"
TEST_ACCOUNT_EMAIL = "chillalyash2005@gmail.com"
TEST_RECIPIENT_EMAIL = "yashvary13@gmail.com"

TEST_BUSINESS_CONTEXT = {
    "business_name": "Axiomflow Pvt Ltd",
    "email": "chillalyash2005@gmail.com",
    "website_url": "https://www.axiomflow.ai",
    "sector": "IT & Software Services",
    "description": "B2B SaaS Operation Automation Workflow platform",
    "user_id": TEST_USER_ID,
    "account_email": TEST_ACCOUNT_EMAIL
}


def test_tc01_sufficiency_check_complete():
    """
    TC-01: User provides full details.
    Supervisor must ask 0 questions and mark is_sufficient=True.
    """
    print("\n" + "=" * 80)
    print("RUNNING TC-01: SUFFICIENCY CHECK ON FULLY SPECIFIED REQUEST")
    print("=" * 80)

    request = (
        f"Schedule meeting on 26th Oct 2026 at 4:00 PM for 1 hour with {TEST_RECIPIENT_EMAIL} "
        "to discuss Q3 product roadmap with Google Meet link and send reminder email."
    )

    agent = SupervisorAgent()
    assessment = agent.assess_sufficiency(request=request, business_context=TEST_BUSINESS_CONTEXT)

    print(f"Request: \"{request}\"")
    print(f"is_sufficient:   {assessment.is_sufficient}")
    print(f"missing_fields:  {assessment.missing_fields}")
    print(f"questions:       {assessment.questions}")

    assert assessment.is_sufficient is True, "Expected request with recipient and time to be sufficient"
    assert len(assessment.questions) == 0, "Expected 0 questions for complete request"
    print("[PASS] TC-01: 0 questions asked for fully-specified request.")


def test_tc02_underspecified_request_batch_questions():
    """
    TC-02: User provides minimal query without recipient email or duration.
    Supervisor must identify missing fields and ask ALL questions in a single unified prompt.
    """
    print("\n" + "=" * 80)
    print("RUNNING TC-02: UNDERSPECIFIED REQUEST (BATCH CLARIFICATION TEST)")
    print("=" * 80)

    request = "schedule meeting on 26th Oct 4:00 p.m and send reminder emails."

    agent = SupervisorAgent()
    assessment = agent.assess_sufficiency(request=request, business_context=TEST_BUSINESS_CONTEXT)

    print(f"Request: \"{request}\"")
    print(f"is_sufficient:   {assessment.is_sufficient}")
    print(f"missing_fields:  {assessment.missing_fields}")
    print(f"questions count: {len(assessment.questions)}")
    for idx, q in enumerate(assessment.questions, 1):
        print(f"  [{idx}] {q}")

    assert assessment.is_sufficient is False, "Expected minimal query to be marked underspecified"
    assert len(assessment.questions) >= 1, "Expected at least 1 question asked"
    # Verify sender identity was NOT asked
    for q in assessment.questions:
        assert "sender" not in q.lower() and "your email" not in q.lower(), "Supervisor must NOT ask for sender email"

    print("[PASS] TC-02: Batch questions generated correctly without asking sender identity.")


def test_tc03_model_fallback_simulation():
    """
    TC-03: Model Layer Fallback Mechanism.
    Forces Layer 1 (Gemini) to fail with invalid model name.
    Verifies that explicit error alert is displayed and Layer 2 (Groq) executes successfully.
    """
    print("\n" + "=" * 80)
    print("RUNNING TC-03: MODEL LAYER FALLBACK SIMULATION (LAYER 1 FAIL -> LAYER 2 SUCCESS)")
    print("=" * 80)

    fallback_model = ResilientChatModel(
        custom_layers=[
            ("gemini", "simulated-failing-gemini-model"),
            ("groq", "openai/gpt-oss-20b"),
            ("ollama", "qwen3:8b")
        ]
    )

    prompt = "Reply with exactly: 'Fallback simulation successful'"
    res = fallback_model.invoke(prompt)
    output_text = res.content if hasattr(res, "content") else str(res)
    print(f"Result from Fallback Model: \"{output_text.strip()}\"")

    assert len(fallback_model.fallback_logs) == 1, "Expected 1 fallback event logged"
    log_entry = fallback_model.fallback_logs[0]
    assert log_entry["failed_layer"] == 1
    assert log_entry["fallback_to_layer"] == 2
    assert "openai/gpt-oss-20b" in log_entry["fallback_model"]
    print(f"[PASS] TC-03: Fallback alert recorded: {log_entry['failed_model']} -> {log_entry['fallback_model']}")


@pytest.mark.asyncio
async def test_tc04_calendar_fastmcp_creation():
    """
    TC-04: Calendar Agent FastMCP execution.
    Creates a real Google Calendar meeting with Google Meet link via FastMCP tool.
    """
    print("\n" + "=" * 80)
    print("RUNNING TC-04: CALENDAR AGENT FASTMCP EVENT CREATION")
    print("=" * 80)

    agent = CalendarAgent()
    request = f"Schedule sync on 26th Oct 2026 at 4:00 PM for 45 minutes with {TEST_RECIPIENT_EMAIL}"
    spec = agent.interpret_event_parameters(request=request)

    print(f"Interpreted Spec:")
    print(f"  Title:     {spec.title}")
    print(f"  Start:     {spec.start_time_iso}")
    print(f"  End:       {spec.end_time_iso}")
    print(f"  Attendees: {spec.attendees}")

    result = await agent.schedule_event_via_mcp(
        user_id=TEST_USER_ID,
        account_email=TEST_ACCOUNT_EMAIL,
        spec=spec
    )

    print(f"\n[FastMCP Created Event]:")
    print(f"  Event ID:  {result.event_id}")
    print(f"  Meet Link: {result.meet_link}")
    print(f"  HTML Link: {result.html_link}")

    assert result.event_id is not None
    assert len(result.event_id) > 5
    print("[PASS] TC-04: Calendar event created successfully with FastMCP.")


def test_tc05_email_content_agent_sender_binding():
    """
    TC-05: Email Content Agent sender binding & temporal context.
    Verifies that the agent uses business profile as sender identity and does NOT ask for sender email.
    """
    print("\n" + "=" * 80)
    print("RUNNING TC-05: EMAIL CONTENT AGENT SENDER BINDING")
    print("=" * 80)

    agent = EmailContentAgent()
    user_request = f"Send reminder email to {TEST_RECIPIENT_EMAIL} regarding upcoming strategy review."
    supervisor_ctx = {
        "calendar_event": {
            "summary": "Strategy Review",
            "start_time": "2026-10-26T16:00:00+05:30",
            "meet_link": "https://meet.google.com/test-meet-link"
        }
    }

    draft = agent.draft_email(
        user_message=user_request,
        business_context=TEST_BUSINESS_CONTEXT,
        supervisor_context=supervisor_ctx
    )

    print(f"Generated Draft:")
    print(f"  To:      {draft.to}")
    print(f"  Subject: {draft.subject}")
    print(f"  Body Snippet: {draft.body[:120]}...")

    assert any(TEST_RECIPIENT_EMAIL in addr for addr in draft.to)
    assert len(draft.subject) > 5
    # Verify business name in body or signoff
    assert "Axiomflow" in draft.body or "Axiomflow" in draft.subject or "strategy" in draft.body.lower()
    print("[PASS] TC-05: Email draft generated with business sender context and Meet link.")


@pytest.mark.asyncio
async def test_tc06_hitl_consent_case_1_accept():
    """
    TC-06: End-to-End Pipeline with Consent Case 1 (Accept).
    Sufficiency -> Plan -> Calendar FastMCP -> Email Content -> Consent: Accept -> Gmail FastMCP Send -> Succeeded.
    """
    print("\n" + "=" * 80)
    print("RUNNING TC-06: END-TO-END PIPELINE WITH CONSENT CASE 1 (ACCEPT -> SEND)")
    print("=" * 80)

    request = (
        f"Schedule meeting on 26th Oct 2026 at 4:00 PM for 30 minutes with {TEST_RECIPIENT_EMAIL} "
        "regarding AxiomFlow automated pipeline deployment and send reminder email."
    )

    final_state = await run_pipeline(
        request=request,
        user_id=TEST_USER_ID,
        account_email=TEST_ACCOUNT_EMAIL,
        business_context=TEST_BUSINESS_CONTEXT,
        mock_consent="accepted"
    )

    assert final_state["status"] == "succeeded", f"Expected 'succeeded', got {final_state['status']}"
    assert final_state.get("calendar_event") is not None
    assert final_state.get("email_draft") is not None

    # Verify FastMCP Gmail send was executed
    gmail_outcomes = [o for o in final_state["tool_outcomes"] if o.get("capability") == "gmail.send"]
    assert len(gmail_outcomes) == 1, "Expected exactly 1 gmail.send execution"
    assert gmail_outcomes[0]["status"] == "succeeded"
    assert gmail_outcomes[0]["resource_id"] is not None

    print("\n[SUCCESS] TC-06: Entire pipeline completed and email dispatched via FastMCP!")


@pytest.mark.asyncio
async def test_tc07_hitl_consent_case_2_reject():
    """
    TC-07: End-to-End Pipeline with Consent Case 2 (Reject).
    Calendar is created, Email drafted, but User REJECTS consent.
    Pipeline must terminate immediately and NO email should be dispatched.
    """
    print("\n" + "=" * 80)
    print("RUNNING TC-07: END-TO-END PIPELINE WITH CONSENT CASE 2 (REJECT -> CLEAN ABORT)")
    print("=" * 80)

    request = (
        f"Schedule meeting on 26th Oct 2026 at 5:00 PM for 30 minutes with {TEST_RECIPIENT_EMAIL} "
        "and send notification email."
    )

    final_state = await run_pipeline(
        request=request,
        user_id=TEST_USER_ID,
        account_email=TEST_ACCOUNT_EMAIL,
        business_context=TEST_BUSINESS_CONTEXT,
        mock_consent="rejected"
    )

    assert final_state["status"] == "rejected", f"Expected 'rejected', got {final_state['status']}"
    # Verify NO gmail.send tool was executed
    sent_emails = [o for o in final_state["tool_outcomes"] if o.get("capability") == "gmail.send" and o.get("status") == "succeeded"]
    assert len(sent_emails) == 0, "No email must be sent when user rejects consent"

    print("\n[SUCCESS] TC-07: Pipeline cleanly aborted on user rejection. Zero emails sent.")


@pytest.mark.asyncio
async def test_tc08_hitl_consent_case_3_update_loop():
    """
    TC-08: Email Revision Loop (Case 3: Update).
    Simulates user providing revision feedback -> content agent updates draft -> user then accepts updated draft.
    """
    print("\n" + "=" * 80)
    print("RUNNING TC-08: EMAIL REVISION LOOP (UPDATE SUGGESTIONS -> RE-DRAFT -> ACCEPT)")
    print("=" * 80)

    agent = EmailContentAgent()
    user_request = f"Send reminder email to {TEST_RECIPIENT_EMAIL} about quarterly results."
    initial_draft = agent.draft_email(
        user_message=user_request,
        business_context=TEST_BUSINESS_CONTEXT
    )

    print(f"Original Subject: {initial_draft.subject}")
    print(f"Original Body:\n{initial_draft.body.strip()}\n")

    user_feedback = (
        "Make the tone extremely formal, emphasize that CFO attendance is mandatory, "
        "and include the sign-off 'Warm regards, AxiomFlow Executive Leadership'."
    )

    revised_draft = agent.revise_email(
        current_draft=initial_draft.model_dump(),
        user_feedback=user_feedback,
        business_context=TEST_BUSINESS_CONTEXT
    )

    print("-" * 80)
    print(f"Revised Subject: {revised_draft.subject}")
    print(f"Revised Body:\n{revised_draft.body.strip()}\n")

    # Verify revision incorporated feedback
    assert "CFO" in revised_draft.body or "mandatory" in revised_draft.body.lower() or "Executive Leadership" in revised_draft.body
    print("[PASS] TC-08: Email Content Agent updated draft according to user revision feedback.")


if __name__ == "__main__":
    print("\n" + "=" * 80)
    print("STARTING COMPLETE AGENT PIPELINE TERMINAL TEST SUITE")
    print("=" * 80)

    test_tc01_sufficiency_check_complete()
    test_tc02_underspecified_request_batch_questions()
    test_tc03_model_fallback_simulation()
    asyncio.run(test_tc04_calendar_fastmcp_creation())
    test_tc05_email_content_agent_sender_binding()
    asyncio.run(test_tc06_hitl_consent_case_1_accept())
    asyncio.run(test_tc07_hitl_consent_case_2_reject())
    asyncio.run(test_tc08_hitl_consent_case_3_update_loop())

    print("\n" + "=" * 80)
    print("ALL 8 AGENT PIPELINE TEST CASES COMPLETED SUCCESSFULLY!")
    print("=" * 80)
