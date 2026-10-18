import os
import sys
import json
import pytest
import asyncio
from dotenv import load_dotenv

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Enable unbuffered stdout for immediate terminal logging
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(line_buffering=True)

load_dotenv()

from agents.supervisior.node import SupervisorAgent
from agents.specialists.sheet_agent import SheetAgent
from agents.specialists.calendar_agent import CalendarAgent
from agents.specialists.content_agent import EmailContentAgent
from agents.pipeline import run_pipeline

# Authorized identities & test configuration
TEST_USER_ID = "usr_72b30e7cd49e49e5"
TEST_ACCOUNT_EMAIL = "chillalyash2005@gmail.com"
TEST_RECIPIENT_EMAIL = "yashvary13@gmail.com"

TEST_BUSINESS_CONTEXT = {
    "business_name": "Axiomflow Pvt Ltd",
    "email": TEST_ACCOUNT_EMAIL,
    "website_url": "https://www.axiomflow.ai",
    "sector": "IT & Software Services",
    "description": "B2B SaaS Operation Automation Workflow platform",
    "user_id": TEST_USER_ID,
    "account_email": TEST_ACCOUNT_EMAIL
}

SAMPLE_BUSINESS_SCENARIO = (
    f"analyse and generate insights in short for sheets 'retail_sales'. "
    f"Mail the insights generated with the sheet to '{TEST_RECIPIENT_EMAIL}' explaining insights. "
    f"Then schedule a meeting on 24th October 2026 at 3:00 p.m to 4:00 p.m to discuss the insights from the sheets. "
    f"Meeting will be attended by CEO, CFO and finance team. "
    f"Meeting will held online via meet (meetin URL will be provided the day before meet)."
)


def test_01_supervisor_planning_multi_task():
    """
    Test 1: Supervisor Agent Planning for Multi-Task Workflow.
    Verifies:
      - Information Sufficiency Evaluator detects complete parameters (is_sufficient=True, questions=[]).
      - Supervisor generates structured plan covering all three services: sheets, calendar, and gmail.
      - Step proposals establish proper sequencing and dependency relationships.
    """
    print("\n" + "=" * 80)
    print("TEST 1: SUPERVISOR MULTI-TASK PLANNING (SHEETS + CALENDAR + GMAIL)")
    print("=" * 80)
    print(f"Request: \"{SAMPLE_BUSINESS_SCENARIO}\"\n")

    supervisor = SupervisorAgent()

    # 1. Evaluate Information Sufficiency
    assessment = supervisor.assess_sufficiency(
        request=SAMPLE_BUSINESS_SCENARIO,
        business_context=TEST_BUSINESS_CONTEXT
    )

    print("-" * 80)
    print("Sufficiency Assessment Result:")
    print(f"  is_sufficient:  {assessment.is_sufficient}")
    print(f"  missing_fields: {assessment.missing_fields}")
    print(f"  questions:      {assessment.questions}")
    print(f"  reasoning:      {assessment.reasoning}")
    print("-" * 80)

    assert assessment.is_sufficient is True, "Multi-task request with sheet, email, and meeting details must be sufficient"
    assert len(assessment.questions) == 0, "No questions should be asked when all required details are provided"

    # 2. Generate Structured Execution Plan
    plan = supervisor.generate_plan(
        request=SAMPLE_BUSINESS_SCENARIO,
        business_context=TEST_BUSINESS_CONTEXT
    )

    print("\nSupervisor Implementation Plan:")
    print(f"  Intent:   {plan.intent}")
    print(f"  Goal:     {plan.goal}")
    print(f"  Services: {plan.identified_services}")
    print("\nProposed Step Execution Sequence:")
    for s in plan.steps:
        print(f"  - [{s.id}] {s.capability:<25} | {s.description} (Risk: {s.risk}, Approval: {s.requires_approval})")
    print("=" * 80)

    capabilities = [s.capability for s in plan.steps]
    assert any("sheets" in c for c in capabilities), "Plan must contain sheets operations"
    assert any("calendar" in c for c in capabilities), "Plan must contain calendar scheduling"
    assert "content.draft_email" in capabilities, "Plan must contain content drafting"
    assert "gmail.send" in capabilities, "Plan must contain email sending"

    print("\n[PASS] Test 1: Supervisor successfully understood intent and generated structured multi-task plan.")


@pytest.mark.asyncio
async def test_02_sheet_agent_retail_sales_analysis():
    """
    Test 2: Sheet Agent Specialist - Retrieval, Analytics & Insight Generation.
    Verifies:
      - Sheet Agent creates and populates 'retail_sales' spreadsheet via FastMCP.
      - Reads cell matrix back via FastMCP 'sheets_read_values'.
      - Computes business metrics (revenue, profit margin, top category, top branch).
      - Produces structured plain-text executive insights.
      - Exports tabular data as CSV for email attachment.
    """
    print("\n" + "=" * 80)
    print("TEST 2: SHEET AGENT RETRIEVAL & RETAIL SALES ANALYTICS")
    print("=" * 80)

    agent = SheetAgent()
    sheet_result = await agent.read_or_populate_retail_sales_sheet(
        user_id=TEST_USER_ID,
        account_email=TEST_ACCOUNT_EMAIL,
        title="retail_sales",
        sheet_name="retail_sales"
    )

    print("-" * 80)
    print("Sheet Agent Outcome:")
    print(f"  Spreadsheet ID:  {sheet_result.spreadsheet_id}")
    print(f"  Spreadsheet URL: {sheet_result.spreadsheet_url}")
    print(f"  Data Rows:       {sheet_result.row_count}")
    print(f"  CSV Size:        {len(sheet_result.csv_content)} bytes")
    print(f"  Metrics:         {sheet_result.summary_metrics}")
    print("\nPlain-text Executive Insights:")
    print(sheet_result.insights)
    print("=" * 80)

    assert sheet_result.spreadsheet_id is not None, "Spreadsheet ID must be returned"
    assert sheet_result.spreadsheet_url.startswith("https://docs.google.com/spreadsheets/d/"), "Valid Google Sheets URL required"
    assert sheet_result.row_count >= 10, "Expected at least 10 retail sales rows"
    assert sheet_result.insights is not None and len(sheet_result.insights) > 50, "Executive insights must be generated"
    assert sheet_result.summary_metrics is not None, "Summary metrics dictionary must be populated"
    assert sheet_result.summary_metrics["total_revenue"] > 0, "Total revenue must be positive"

    print("\n[PASS] Test 2: Sheet Agent successfully read, analyzed, and generated insights for 'retail_sales'.")


@pytest.mark.asyncio
async def test_03_calendar_agent_meeting_scheduling():
    """
    Test 3: Calendar Agent Specialist - Parameter Normalization & Event Scheduling.
    Verifies:
      - Calendar Agent interprets 24th October 2026 at 3:00 p.m to 4:00 p.m in Asia/Kolkata timezone.
      - Calls FastMCP calendar_create_event tool with Google Meet conference generation.
      - Returns valid event ID, timing, and Google Meet URL.
    """
    print("\n" + "=" * 80)
    print("TEST 3: CALENDAR AGENT MEETING SCHEDULING (24th OCT 2026 3:00-4:00 PM)")
    print("=" * 80)

    agent = CalendarAgent()
    spec = agent.interpret_event_parameters(
        request=SAMPLE_BUSINESS_SCENARIO,
        plan_parameters={
            "date": "2026-10-24",
            "time": "15:00:00",
            "duration": 60,
            "attendees": [TEST_RECIPIENT_EMAIL]
        }
    )

    print("Interpreted Calendar Spec:")
    print(f"  Title:      {spec.title}")
    print(f"  Start Time: {spec.start_time_iso}")
    print(f"  End Time:   {spec.end_time_iso}")
    print(f"  Meet Link:  {spec.add_meet_link}")
    print(f"  Attendees:  {spec.attendees}")

    assert "2026-10-24T15:00:00" in spec.start_time_iso, "Start time must be 3:00 PM on Oct 24, 2026"
    assert "2026-10-24T16:00:00" in spec.end_time_iso, "End time must be 4:00 PM on Oct 24, 2026"

    # Schedule event via FastMCP
    result = await agent.schedule_event_via_mcp(
        user_id=TEST_USER_ID,
        account_email=TEST_ACCOUNT_EMAIL,
        spec=spec
    )

    print("-" * 80)
    print("Scheduled Event Details:")
    print(f"  Event ID:    {result.event_id}")
    print(f"  Title:       {result.summary}")
    print(f"  Timing:      {result.start_time} -> {result.end_time}")
    print(f"  Meet Link:   {result.meet_link}")
    print(f"  HTML Link:   {result.html_link}")
    print("=" * 80)

    assert result.event_id is not None, "Event ID must be returned by Google Calendar"
    assert result.meet_link is not None and "meet.google.com" in result.meet_link, "Google Meet conference URL must be generated"

    print("\n[PASS] Test 3: Calendar Agent successfully scheduled event with Google Meet link.")


@pytest.mark.asyncio
async def test_04_end_to_end_multi_agent_pipeline_execution():
    """
    Test 4: End-to-End Multi-Task Pipeline Execution (Sheets + Calendar + Gmail).
    Verifies the entire sequence:
      1. Supervisor Agent evaluates sufficiency and plans steps.
      2. Sheet Agent creates/populates 'retail_sales', analyzes metrics, extracts insights, and builds CSV.
      3. Calendar Agent schedules discussion meeting for 24th Oct 2026 with Google Meet URL.
      4. Email Content Agent synthesizes sheet insights, spreadsheet link, meeting details, and attaches CSV.
      5. HITL Consent node receives human approval ('accepted').
      6. FastMCP Gmail tool dispatches the email with attachment to yashvary13@gmail.com.
      7. Summarizer emits comprehensive audit log.
    """
    print("\n" + "=" * 80)
    print("TEST 4: FULL END-TO-END MULTI-AGENT WORKFLOW (SHEETS + CALENDAR + GMAIL)")
    print("=" * 80)
    print(f"Scenario Prompt:\n\"{SAMPLE_BUSINESS_SCENARIO}\"\n")

    final_state = await run_pipeline(
        request=SAMPLE_BUSINESS_SCENARIO,
        user_id=TEST_USER_ID,
        account_email=TEST_ACCOUNT_EMAIL,
        business_id=2,
        business_context=TEST_BUSINESS_CONTEXT,
        mock_consent="accepted"
    )

    print("\n" + "=" * 80)
    print("                  END-TO-END VERIFICATION CHECKS")
    print("=" * 80)

    # 1. Pipeline Status
    assert final_state.get("status") == "succeeded", f"Pipeline should succeed, got {final_state.get('status')}"

    # 2. Sheet Outcome Verification
    sheet_result = final_state.get("sheet_result")
    assert sheet_result is not None, "SheetResult must be present in workflow state"
    assert sheet_result.get("title") == "retail_sales", "Sheet title must be retail_sales"
    assert sheet_result.get("spreadsheet_url"), "Spreadsheet URL must be present"
    assert sheet_result.get("insights"), "Sheet insights must be present"
    print(f"[OK] Sheet Created & Analyzed: {sheet_result.get('title')} ({sheet_result.get('spreadsheet_url')})")

    # 3. Calendar Outcome Verification
    calendar_event = final_state.get("calendar_event")
    assert calendar_event is not None, "Calendar event must be recorded in state"
    assert "2026-10-24" in calendar_event.get("start_time"), "Meeting date must be Oct 24, 2026"
    assert calendar_event.get("meet_link"), "Google Meet link must be recorded"
    print(f"[OK] Meeting Scheduled: {calendar_event.get('summary')} at {calendar_event.get('start_time')} (Meet: {calendar_event.get('meet_link')})")

    # 4. Email Draft Verification
    draft = final_state.get("email_draft")
    assert draft is not None, "Email draft must be generated"
    assert TEST_RECIPIENT_EMAIL in draft.get("to", []), f"Recipient {TEST_RECIPIENT_EMAIL} must be in email 'to' list"
    assert len(draft.get("attachments", [])) > 0, "CSV attachment must be attached to email"
    assert draft["attachments"][0].get("filename") == "retail_sales.csv", "Attachment filename must be retail_sales.csv"
    print(f"[OK] Email Drafted: To: {draft.get('to')} | Subject: {draft.get('subject')} | Attachment: {draft['attachments'][0].get('filename')}")

    # 5. Gmail Send Verification
    outcomes = final_state.get("tool_outcomes", [])
    gmail_outcome = next((o for o in outcomes if o.get("capability") == "gmail.send" and o.get("status") == "succeeded"), None)
    assert gmail_outcome is not None, "gmail.send must succeed in tool outcomes"
    assert gmail_outcome.get("resource_id") is not None, "Gmail message ID must be returned"
    print(f"[OK] Email Dispatched via Gmail API: Message ID {gmail_outcome.get('resource_id')}")

    # 6. Final Audit Response
    final_response = final_state.get("final_response", "")
    assert "retail_sales" in final_response, "Audit response must reference retail_sales"
    assert "2026-10-24" in final_response, "Audit response must reference scheduled meeting"
    print("[OK] Complete multi-tool audit log confirmed.")
    print("=" * 80)
    print("\n[PASS] Test 4: Full Multi-Agent pipeline (Sheets + Calendar + Gmail) succeeded 100%!")


@pytest.mark.asyncio
async def test_05_hitl_rejection_safety_gate():
    """
    Test 5: Human-In-The-Loop Consent Rejection Safety Gate.
    Verifies that when a user rejects the email draft:
      - Sheet analysis and Calendar scheduling complete safely.
      - Email dispatch is completely blocked.
      - Status terminates as 'rejected'.
      - No email is transmitted over Gmail API.
    """
    print("\n" + "=" * 80)
    print("TEST 5: HITL REJECTION SAFETY GATE IN MULTI-TASK PIPELINE")
    print("=" * 80)

    final_state = await run_pipeline(
        request=SAMPLE_BUSINESS_SCENARIO,
        user_id=TEST_USER_ID,
        account_email=TEST_ACCOUNT_EMAIL,
        business_id=2,
        business_context=TEST_BUSINESS_CONTEXT,
        mock_consent="rejected"
    )

    assert final_state.get("status") == "rejected", "Pipeline status must be 'rejected' upon user refusal"

    outcomes = final_state.get("tool_outcomes", [])
    gmail_sent = any(o.get("capability") == "gmail.send" and o.get("status") == "succeeded" for o in outcomes)
    assert not gmail_sent, "Zero emails should be sent when HITL consent is rejected"

    print("\n[PASS] Test 5: HITL rejection successfully blocked unauthorized email dispatch.")
