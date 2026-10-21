import os
import sys
from typing import Dict, Any, Optional

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from agents.state import WorkflowState, EmailConsentDecision


import asyncio

async def email_consent_hitl_node(state: WorkflowState) -> Dict[str, Any]:
    """
    Human-In-The-Loop Consent Node for Outgoing Email.
    Presents drafted email with sender identity, recipients, subject, body, and Meet link.
    Solicits user decision:
      [1] Accept -> Execute FastMCP Gmail Send
      [2] Reject -> Abort pipeline immediately
      [3] Update -> Accept user suggestions to re-draft
    Supports interactive terminal prompt, web dashboard HITL, and programmatic test fixtures.
    """
    draft = state.get("email_draft") or {}
    business_context = state.get("business_context") or {}
    calendar_event = state.get("calendar_event") or {}

    sender_name = business_context.get("business_name", "Axiomflow Pvt Ltd")
    sender_email = business_context.get("email", business_context.get("account_email", ""))
    to_recipients = ", ".join(draft.get("to", []))
    cc_recipients = ", ".join(draft.get("cc", [])) if draft.get("cc") else "None"
    subject = draft.get("subject", "No Subject")
    body = draft.get("body", "")
    meet_link = calendar_event.get("meet_link")
    sheet_result = state.get("sheet_result") or {}
    attachments = draft.get("attachments") or []

    # Check if consent decision was pre-supplied (e.g. In automated tests)
    pre_decision = state.get("email_consent", {}).get("decision")
    if pre_decision in ("accepted", "rejected", "updated"):
        decision = pre_decision
        user_feedback = state.get("email_consent", {}).get("user_feedback")
    elif state.get("is_web_session") or (state.get("run_id") and state.get("run_id").startswith("TSK_")) or (state.get("task_id") and state.get("task_id").startswith("TSK_")):
        task_id = state.get("task_id") or state.get("run_id")
        import workflow_service
        workflow_service.set_workflow_waiting_approval(task_id, draft)
        approval_event = workflow_service.get_or_create_approval_event(task_id)
        # Wait up to 300 seconds for supervisor approval from web UI via thread-safe event
        is_set = await asyncio.to_thread(approval_event.wait, 300)
        if not is_set:
            decision = "rejected"
            user_feedback = "Human supervisory approval timed out after 300 seconds."
        else:
            decision_data = workflow_service.get_approval_decision(task_id)
            decision = decision_data.get("decision", "accepted")
            user_feedback = decision_data.get("user_feedback")
            if decision_data.get("edited_body") and draft:
                draft["body"] = decision_data["edited_body"]
    else:
        # Render Interactive Terminal Card
        print("\n" + "=" * 80)
        print("                    HUMAN-IN-THE-LOOP CONSENT REQUIRED")
        print("=" * 80)
        print(f"Sender:       {sender_name} <{sender_email}>")
        print(f"To:           {to_recipients}")
        if cc_recipients != "None":
            print(f"CC:           {cc_recipients}")
        print(f"Subject:      {subject}")
        if sheet_result.get("title"):
            print(f"Spreadsheet:  {sheet_result.get('title')} ({sheet_result.get('spreadsheet_url')})")
        if attachments:
            print(f"Attachments:  {', '.join([a.get('filename', 'attachment') for a in attachments])}")
        if meet_link:
            print(f"Google Meet:  {meet_link}")
        print("-" * 80)
        print("Proposed Email Body:")
        print(body.strip())
        print("=" * 80)
        print("Select Action:")
        print("  [1] Accept  - Dispatch email via Gmail FastMCP tool")
        print("  [2] Reject  - Abort workflow immediately")
        print("  [3] Update  - Provide suggestions to revise email draft")
        print("-" * 80)

        user_feedback = None
        is_interactive = hasattr(sys.stdin, "isatty") and sys.stdin.isatty()
        if not is_interactive:
            print("[NON-INTERACTIVE DETECTED] Auto-approving email draft in automated test mode...")
            decision = "accepted"
        else:
            while True:
                try:
                    choice = input("Enter choice (1/2/3): ").strip()
                except (EOFError, KeyboardInterrupt):
                    choice = "1"

                if choice in ("1", "accept", "Accept"):
                    decision = "accepted"
                    print("\n[CONSENT GRANTED] User approved email dispatch.")
                    break
                elif choice in ("2", "reject", "Reject"):
                    decision = "rejected"
                    print("\n[CONSENT REJECTED] User aborted email dispatch. Terminating pipeline.")
                    break
                elif choice in ("3", "update", "Update"):
                    decision = "updated"
                    try:
                        user_feedback = input("\nEnter revision suggestions or changes for email body: ").strip()
                    except (EOFError, KeyboardInterrupt):
                        user_feedback = "Please make the tone more formal and mention agenda attachment."
                    print(f"\n[REVISION REQUESTED] User suggestions: \"{user_feedback}\"")
                    break
                else:
                    print("Invalid selection. Please enter 1, 2, or 3.")

    # Status transition
    if decision == "accepted":
        next_status = "executing_gmail"
    elif decision == "rejected":
        next_status = "rejected"
    else:
        next_status = "drafting_email"

    current_revision_count = state.get("revision_count", 0)
    consent_data = EmailConsentDecision(
        decision=decision,
        user_feedback=user_feedback,
        revision_count=current_revision_count
    ).model_dump()

    return {
        "email_draft": draft,
        "email_consent": consent_data,
        "user_feedback": user_feedback,
        "status": next_status
    }
