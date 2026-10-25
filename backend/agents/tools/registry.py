"""
Central Registry of Approved Capabilities and Tools.
Prevents models from inventing arbitrary functions, SQL, URLs, or executing unauthorized actions.
"""
from typing import Dict, Any, List

CAPABILITY_REGISTRY: Dict[str, Dict[str, Any]] = {
    # Gmail Capabilities
    "gmail.search": {
        "description": "Searches Gmail messages using query filters within the authorized user's mailbox",
        "service": "gmail",
        "risk": "read_only",
        "requires_approval": False,
        "parameters": ["query", "max_results"]
    },
    "gmail.get_thread": {
        "description": "Retrieves an email thread by thread_id",
        "service": "gmail",
        "risk": "read_only",
        "requires_approval": False,
        "parameters": ["thread_id"]
    },
    "gmail.draft": {
        "description": "Creates a draft email in Gmail without sending",
        "service": "gmail",
        "risk": "no_external_side_effect",
        "requires_approval": False,
        "parameters": ["to", "subject", "body"]
    },
    "gmail.send": {
        "description": "Sends an email to recipients via Gmail API (requires human approval)",
        "service": "gmail",
        "risk": "external_side_effect",
        "requires_approval": True,
        "parameters": ["to", "subject", "body"]
    },

    # Content Agent Capabilities
    "content.draft_email": {
        "description": "Drafts or polishes an email with tone, subject, and body from user instructions",
        "service": "content_agent",
        "risk": "no_external_side_effect",
        "requires_approval": False,
        "parameters": ["recipient_intent", "meeting_details", "key_points"]
    },

    # Google Calendar Capabilities
    "calendar.list_events": {
        "description": "Lists calendar events within a date-time interval",
        "service": "calendar",
        "risk": "read_only",
        "requires_approval": False,
        "parameters": ["time_min", "time_max", "calendar_id"]
    },
    "calendar.check_availability": {
        "description": "Checks available slots and conflicting events for requested date and time window",
        "service": "calendar",
        "risk": "read_only",
        "requires_approval": False,
        "parameters": ["target_date", "start_time", "duration_minutes"]
    },
    "calendar.create_event": {
        "description": "Schedules a Google Calendar meeting event with attendees and Google Meet conference",
        "service": "calendar",
        "risk": "external_side_effect",
        "requires_approval": True,
        "parameters": ["title", "start_time", "end_time", "attendees", "description"]
    },

    # Google Sheets Capabilities
    "sheets.create": {
        "description": "Creates a new Google Spreadsheet with a title and initial sheet tab name",
        "service": "sheets",
        "risk": "external_side_effect",
        "requires_approval": True,
        "parameters": ["title", "sheet_name"]
    },
    "sheets.read": {
        "description": "Reads data values from a specified Google Spreadsheet and A1 range",
        "service": "sheets",
        "risk": "read_only",
        "requires_approval": False,
        "parameters": ["spreadsheet_id", "range_name"]
    },
    "sheets.append": {
        "description": "Appends tabular rows to a Google Spreadsheet",
        "service": "sheets",
        "risk": "external_side_effect",
        "requires_approval": True,
        "parameters": ["spreadsheet_id", "range_name", "values"]
    },
    "sheets.update": {
        "description": "Updates cells in a Google Spreadsheet in a specified range",
        "service": "sheets",
        "risk": "external_side_effect",
        "requires_approval": True,
        "parameters": ["spreadsheet_id", "range_name", "values"]
    },

    # Google Docs Capabilities
    "docs.create": {
        "description": "Creates a new blank Google Document with a title and optional initial text",
        "service": "docs",
        "risk": "external_side_effect",
        "requires_approval": True,
        "parameters": ["title", "initial_text"]
    },
    "docs.read": {
        "description": "Reads full content, structural elements, and word count from a specified Google Document",
        "service": "docs",
        "risk": "read_only",
        "requires_approval": False,
        "parameters": ["document_id"]
    },
    "docs.write": {
        "description": "Writes, inserts, or overwrites content in a specified Google Document",
        "service": "docs",
        "risk": "external_side_effect",
        "requires_approval": True,
        "parameters": ["document_id", "text", "mode"]
    },
    "docs.append": {
        "description": "Appends formatted text to the end of a specified Google Document",
        "service": "docs",
        "risk": "external_side_effect",
        "requires_approval": True,
        "parameters": ["document_id", "text"]
    },
    "docs.replace_text": {
        "description": "Replaces placeholders or occurrences of target text in a Google Document",
        "service": "docs",
        "risk": "external_side_effect",
        "requires_approval": True,
        "parameters": ["document_id", "search_text", "replace_text"]
    },
    "docs.delete": {
        "description": "Moves a Google Document to trash or permanently deletes it via Google Drive API",
        "service": "docs",
        "risk": "external_side_effect",
        "requires_approval": True,
        "parameters": ["document_id", "permanent"]
    }
}

def is_valid_capability(capability: str) -> bool:
    """Validates if capability name exists in the allowed server-side registry."""
    return capability in CAPABILITY_REGISTRY

def get_capability_metadata(capability: str) -> Dict[str, Any]:
    """Retrieves metadata for an approved capability."""
    return CAPABILITY_REGISTRY.get(capability, {})

def get_allowed_capabilities_summary() -> str:
    """Formats list of approved capabilities for inclusion in planner prompt."""
    lines = []
    for cap, meta in CAPABILITY_REGISTRY.items():
        lines.append(f"- `{cap}`: {meta['description']} (Risk: {meta['risk']}, Requires Approval: {meta['requires_approval']})")
    return "\n".join(lines)
