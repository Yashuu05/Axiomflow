import os
import sys

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from tools.calendar_tools import (
    calendar_mcp,
    calendar_create_event,
    calendar_list_events,
    calendar_check_availability,
    calendar_get_event,
    calendar_update_event,
    calendar_delete_event
)
