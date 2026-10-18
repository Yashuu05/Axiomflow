import os
import sys
import json
from typing import Dict, Any

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from agents.state import WorkflowState


def summarize_node(state: WorkflowState) -> Dict[str, Any]:
    """
    LangGraph node: Formats final audit summary and terminal report.
    """
    status = state.get("status", "unknown")
    business_context = state.get("business_context", {})
    calendar_event = state.get("calendar_event")
    email_draft = state.get("email_draft")
    outcomes = state.get("tool_outcomes", [])
    fallback_logs = state.get("fallback_logs", [])

    lines = []
    lines.append("=" * 80)
    lines.append("                  AXIOMFLOW AGENT PIPELINE EXECUTION SUMMARY")
    lines.append("=" * 80)
    lines.append(f"Execution Status: {status.upper()}")
    lines.append(f"Business Profile: {business_context.get('business_name')} ({business_context.get('email')})")
    lines.append(f"Original Request: \"{state.get('request', '')}\"")

    if state.get("clarification_answers"):
        lines.append("\nHITL Clarification Answers Provided:")
        for k, v in state["clarification_answers"].items():
            lines.append(f"  - {k}: {v}")

    if calendar_event:
        lines.append("\nGoogle Calendar Event Scheduled:")
        lines.append(f"  - Event ID:    {calendar_event.get('event_id')}")
        lines.append(f"  - Title:       {calendar_event.get('summary')}")
        lines.append(f"  - Timing:      {calendar_event.get('start_time')} to {calendar_event.get('end_time')}")
        lines.append(f"  - Meet Link:   {calendar_event.get('meet_link') or 'None'}")
        lines.append(f"  - Attendees:   {', '.join(calendar_event.get('attendees', []))}")

    if email_draft:
        lines.append("\nEmail Dispatch Details:")
        lines.append(f"  - Recipient:   {', '.join(email_draft.get('to', []))}")
        lines.append(f"  - Subject:     {email_draft.get('subject')}")
        if status == "succeeded":
            gmail_outcome = next((o for o in outcomes if o.get("capability") == "gmail.send" and o.get("status") == "succeeded"), None)
            if gmail_outcome:
                lines.append(f"  - Message ID:  {gmail_outcome.get('resource_id')}")
                lines.append("  - Dispatch:    Delivered via Gmail API")
        elif status == "rejected":
            lines.append("  - Dispatch:    ABORTED (User rejected email consent)")

    if fallback_logs:
        lines.append("\nLLM Fallback Events Recorded:")
        for f in fallback_logs:
            lines.append(f"  - Layer {f.get('failed_layer')} ({f.get('failed_model')}) failed -> Switched to Layer {f.get('fallback_to_layer')} ({f.get('fallback_model')})")

    lines.append("=" * 80)
    summary_report = "\n".join(lines)

    return {
        "final_response": summary_report,
        "status": status
    }
