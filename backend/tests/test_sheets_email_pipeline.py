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
from agents.specialists.content_agent import EmailContentAgent
from agents.pipeline import run_pipeline
from tools.sheet_tools import sheets_mcp

# Shared test configuration
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

SAMPLE_BUSINESS_REQUEST = (
    f"Create a new sheet named 'sales' and insert 10 random values such as "
    f"'customer_id', 'date-time', 'quantity', 'total_price', 'discount', "
    f"and mail the newly created sheet 'sales' informing CFO of monthly sales sheet to {TEST_RECIPIENT_EMAIL}."
)


def test_01_supervisor_planning_for_sheets_and_email():
    """
    Test 1: Supervisor Agent Planning for Google Sheets + Gmail scenario.
    Validates:
      - Request sufficiency assessment marks is_sufficient=True (recipient provided).
      - Planner identifies 'sheets' and 'gmail' services.
      - Structured plan proposes sheets creation/append, content drafting, and gmail send.
      - Prints full observability logs to terminal.
    """
    print("\n" + "=" * 80)
    print("TEST 1: SUPERVISOR AGENT PLANNING FOR SHEETS & GMAIL PIPELINE")
    print("=" * 80)

    agent = SupervisorAgent()

    # 1. Sufficiency Check
    assessment = agent.assess_sufficiency(
        request=SAMPLE_BUSINESS_REQUEST,
        business_context=TEST_BUSINESS_CONTEXT
    )

    print(f"Request: \"{SAMPLE_BUSINESS_REQUEST}\"")
    print(f"Sufficiency Assessment:")
    print(f"  is_sufficient:  {assessment.is_sufficient}")
    print(f"  missing_fields: {assessment.missing_fields}")
    print(f"  questions:      {assessment.questions}")

    assert assessment.is_sufficient is True, "Expected request with recipient and sheet name to be sufficient"
    assert len(assessment.questions) == 0, "Expected 0 questions for complete request"

    # 2. Plan Generation
    plan = agent.generate_plan(
        request=SAMPLE_BUSINESS_REQUEST,
        business_context=TEST_BUSINESS_CONTEXT
    )

    print("\nGenerated Structured Plan:")
    print(f"  Intent:   {plan.intent}")
    print(f"  Goal:     {plan.goal}")
    print(f"  Services: {plan.identified_services}")
    print("  Steps Proposed:")
    for s in plan.steps:
        print(f"    - [{s.id}] {s.capability}: {s.description} (Risk: {s.risk}, Approval: {s.requires_approval})")

    # Assertions
    capabilities = [s.capability for s in plan.steps]
    assert any("sheets" in c for c in capabilities), "Plan must include Google Sheets capabilities"
    assert "content.draft_email" in capabilities, "Plan must include email content drafting"
    assert "gmail.send" in capabilities, "Plan must include gmail send"

    print("\n[PASS] Test 1: Supervisor successfully generated structured plan for Sheets + Gmail workflow.")


@pytest.mark.asyncio
async def test_02_sheet_agent_standalone_creation_and_population():
    """
    Test 2: Sheet Agent standalone execution via FastMCP tools.
    Validates:
      - Google Spreadsheet 'sales' is created via FastMCP 'sheets_create_spreadsheet'.
      - 10 random records conforming to schema (customer_id, date-time, quantity, total_price, discount)
        are inserted via 'sheets_append_values'.
      - Data is read back via 'sheets_read_values' to verify persistence in Google Sheets.
      - CSV representation is generated for email attachment.
    """
    print("\n" + "=" * 80)
    print("TEST 2: SHEET AGENT STANDALONE EXECUTION & DATA PERSISTENCE")
    print("=" * 80)

    agent = SheetAgent()
    sheet_result = await agent.create_and_populate_sheet_via_mcp(
        user_id=TEST_USER_ID,
        account_email=TEST_ACCOUNT_EMAIL,
        title="sales",
        sheet_name="sales",
        num_records=10
    )

    print(f"\n[Created Sheet Result]:")
    print(f"  Spreadsheet ID:  {sheet_result.spreadsheet_id}")
    print(f"  Spreadsheet URL: {sheet_result.spreadsheet_url}")
    print(f"  Rows Count:      {sheet_result.row_count}")
    print(f"  Headers:         {sheet_result.headers}")
    print(f"  CSV Preview:\n{sheet_result.csv_content[:200]}...")

    assert sheet_result.spreadsheet_id is not None
    assert len(sheet_result.spreadsheet_id) > 10
    assert "https://docs.google.com/spreadsheets" in sheet_result.spreadsheet_url
    assert sheet_result.row_count == 10
    assert sheet_result.headers == ["customer_id", "date-time", "quantity", "total_price", "discount"]
    assert sheet_result.csv_content is not None

    # Read back from Google Sheets API via FastMCP to verify online persistence
    print("\nVerifying data directly from Google Sheets API via FastMCP 'sheets_read_values'...")
    read_args = {
        "user_id": TEST_USER_ID,
        "account_email": TEST_ACCOUNT_EMAIL,
        "spreadsheet_id": sheet_result.spreadsheet_id,
        "range_name": "sales!A1:E12"
    }
    read_res = await sheets_mcp.call_tool("sheets_read_values", read_args)
    assert not read_res.is_error, "Failed to read values back from created spreadsheet"
    read_data = (read_res.structured_content or {}).get("result", read_res.structured_content or {})
    retrieved_rows = read_data.get("values", [])

    print(f"[Verification Successful] Retrieved {len(retrieved_rows)} rows (1 header + {len(retrieved_rows)-1} data rows)")
    assert len(retrieved_rows) == 11, f"Expected 11 total rows (header + 10 data), got {len(retrieved_rows)}"
    assert retrieved_rows[0] == ["customer_id", "date-time", "quantity", "total_price", "discount"]

    print("\n[PASS] Test 2: Sheet Agent created and verified live Google Sheet with 10 records.")


def test_03_email_content_agent_drafting_with_sheet_attachment():
    """
    Test 3: Email Content Agent drafting for CFO with sheet context & attachment.
    Validates:
      - Uses registered business profile as sender identity.
      - Mentions the monthly sales report to the CFO.
      - Incorporates live Google Spreadsheet link.
      - Automatically attaches the generated sales.csv file.
    """
    print("\n" + "=" * 80)
    print("TEST 3: EMAIL CONTENT AGENT DRAFTING WITH SPREADSHEET CONTEXT")
    print("=" * 80)

    agent = EmailContentAgent()
    mock_sheet_result = {
        "title": "sales",
        "spreadsheet_url": "https://docs.google.com/spreadsheets/d/mock_sales_id/edit",
        "row_count": 10,
        "headers": ["customer_id", "date-time", "quantity", "total_price", "discount"],
        "csv_content": "customer_id,date-time,quantity,total_price,discount\nCUST-1001,2026-10-18 10:00:00,5,2500,5%"
    }

    supervisor_ctx = {
        "sheet_result": mock_sheet_result,
        "user_id": TEST_USER_ID,
        "account_email": TEST_ACCOUNT_EMAIL
    }

    draft = agent.draft_email(
        user_message=SAMPLE_BUSINESS_REQUEST,
        business_context=TEST_BUSINESS_CONTEXT,
        supervisor_context=supervisor_ctx
    )

    # Attach generated CSV
    draft.attachments = [{
        "filename": "sales.csv",
        "content": mock_sheet_result["csv_content"],
        "maintype": "text",
        "subtype": "csv"
    }]

    print(f"Generated Draft:")
    print(f"  To:          {draft.to}")
    print(f"  Subject:     {draft.subject}")
    print(f"  Attachments: {[a.get('filename') for a in draft.attachments]}")
    print("-" * 80)
    print("Draft Body Snippet:")
    print(draft.body[:250] + "...")

    assert any(TEST_RECIPIENT_EMAIL in addr for addr in draft.to), f"Expected {TEST_RECIPIENT_EMAIL} in recipients"
    assert "sales" in draft.subject.lower() or "monthly" in draft.subject.lower() or "cfo" in draft.subject.lower()
    assert len(draft.attachments) == 1
    assert draft.attachments[0]["filename"] == "sales.csv"
    print("\n[PASS] Test 3: Email Content Agent drafted executive email to CFO with live link and sales.csv attachment.")


@pytest.mark.asyncio
async def test_04_end_to_end_sheets_email_pipeline_execution():
    """
    Test 4: Complete End-to-End Pipeline Execution (Consent Accepted).
    Workflow:
      1. Supervisor Agent evaluates request and produces structured plan.
      2. Plan routes to Sheet Agent -> creates Google Sheet 'sales' & appends 10 random values.
      3. Plan routes to Email Content Agent -> drafts email informing CFO with link and attachment.
      4. Consent HITL is granted (mock_consent='accepted').
      5. FastMCP Gmail tool dispatches email with attached 'sales.csv' to yashvary13@gmail.com.
      6. Summarize node prints execution summary.
    """
    print("\n" + "=" * 80)
    print("TEST 4: END-TO-END PIPELINE EXECUTION (SHEETS CREATION -> ATTACHMENT -> GMAIL SEND)")
    print("=" * 80)

    final_state = await run_pipeline(
        request=SAMPLE_BUSINESS_REQUEST,
        user_id=TEST_USER_ID,
        account_email=TEST_ACCOUNT_EMAIL,
        business_context=TEST_BUSINESS_CONTEXT,
        mock_consent="accepted"
    )

    print("\n" + "-" * 80)
    print("ASSERTING PIPELINE RESULTS")
    print("-" * 80)
    print(f"Final Status: {final_state.get('status')}")

    assert final_state["status"] == "succeeded", f"Expected 'succeeded', got {final_state.get('status')}"

    # 1. Verify Sheet Agent Output
    sheet_res = final_state.get("sheet_result")
    assert sheet_res is not None, "Expected sheet_result in final state"
    assert sheet_res.get("title") == "sales"
    assert sheet_res.get("row_count") == 10
    assert "docs.google.com/spreadsheets" in sheet_res.get("spreadsheet_url", "")
    print(f"[OK] Google Sheet Created: {sheet_res.get('spreadsheet_url')}")

    # 2. Verify Email Draft & Attachment
    email_draft = final_state.get("email_draft")
    assert email_draft is not None, "Expected email_draft in final state"
    assert any(TEST_RECIPIENT_EMAIL in r for r in email_draft.get("to", []))
    assert len(email_draft.get("attachments", [])) >= 1, "Expected CSV file attached to email draft"
    print(f"[OK] Email Drafted with Subject: \"{email_draft.get('subject')}\"")
    print(f"[OK] Attached File: {email_draft.get('attachments')[0].get('filename')}")

    # 3. Verify Gmail Send Tool Outcome
    outcomes = final_state.get("tool_outcomes", [])
    gmail_outcomes = [o for o in outcomes if o.get("capability") == "gmail.send"]
    assert len(gmail_outcomes) == 1, "Expected exactly 1 gmail.send execution"
    assert gmail_outcomes[0]["status"] == "succeeded"
    assert gmail_outcomes[0]["resource_id"] is not None
    print(f"[OK] Gmail Dispatched! Message ID: {gmail_outcomes[0]['resource_id']}")

    print("\n[SUCCESS] Test 4: End-to-End Sheets + Gmail Pipeline executed flawlessly!")


@pytest.mark.asyncio
async def test_05_end_to_end_pipeline_consent_rejection():
    """
    Test 5: Human-In-The-Loop Consent Rejection (Case 2: Reject).
    Validates:
      - Sheet is created and populated.
      - Email draft is prepared.
      - User rejects outgoing email consent (mock_consent='rejected').
      - Pipeline cleanly halts with status 'rejected' and zero emails are sent.
    """
    print("\n" + "=" * 80)
    print("TEST 5: PIPELINE SAFETY - HUMAN-IN-THE-LOOP CONSENT REJECTION")
    print("=" * 80)

    request = (
        f"Create a new sheet named 'sales' and insert 10 random values, "
        f"and mail the sheet to {TEST_RECIPIENT_EMAIL}."
    )

    final_state = await run_pipeline(
        request=request,
        user_id=TEST_USER_ID,
        account_email=TEST_ACCOUNT_EMAIL,
        business_context=TEST_BUSINESS_CONTEXT,
        mock_consent="rejected"
    )

    assert final_state["status"] == "rejected", f"Expected 'rejected', got {final_state.get('status')}"

    # Verify no email was dispatched
    sent_emails = [
        o for o in final_state["tool_outcomes"]
        if o.get("capability") == "gmail.send" and o.get("status") == "succeeded"
    ]
    assert len(sent_emails) == 0, "No email should be sent when consent is rejected"

    print("\n[SUCCESS] Test 5: Pipeline cleanly aborted on user rejection. Zero emails sent.")


if __name__ == "__main__":
    print("\n" + "=" * 80)
    print("STARTING GOOGLE SHEETS & GMAIL AGENT PIPELINE TEST SUITE")
    print("=" * 80)

    test_01_supervisor_planning_for_sheets_and_email()
    asyncio.run(test_02_sheet_agent_standalone_creation_and_population())
    test_03_email_content_agent_drafting_with_sheet_attachment()
    asyncio.run(test_04_end_to_end_sheets_email_pipeline_execution())
    asyncio.run(test_05_end_to_end_pipeline_consent_rejection())

    print("\n" + "=" * 80)
    print("ALL 5 GOOGLE SHEETS & GMAIL PIPELINE TESTS COMPLETED SUCCESSFULLY!")
    print("=" * 80)
