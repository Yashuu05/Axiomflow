"""
AxiomFlow Google Workspace Tools Package.
Exposes modular FastMCP servers and native Python functions for Gmail, Google Calendar, and Google Sheets.
"""
from tools.gmail_tools import (
    gmail_mcp,
    gmail_create_draft,
    gmail_send_email,
    gmail_search_messages,
    gmail_get_thread
)

from tools.calendar_tools import (
    calendar_mcp,
    calendar_create_event,
    calendar_list_events,
    calendar_check_availability,
    calendar_get_event,
    calendar_update_event,
    calendar_delete_event
)

from tools.sheet_tools import (
    sheets_mcp,
    sheets_create_spreadsheet,
    sheets_read_values,
    sheets_append_values,
    sheets_update_values,
    sheets_batch_update
)

__all__ = [
    # Gmail
    "gmail_mcp",
    "gmail_create_draft",
    "gmail_send_email",
    "gmail_search_messages",
    "gmail_get_thread",

    # Calendar
    "calendar_mcp",
    "calendar_create_event",
    "calendar_list_events",
    "calendar_check_availability",
    "calendar_get_event",
    "calendar_update_event",
    "calendar_delete_event",

    # Sheets
    "sheets_mcp",
    "sheets_create_spreadsheet",
    "sheets_read_values",
    "sheets_append_values",
    "sheets_update_values",
    "sheets_batch_update"
]
