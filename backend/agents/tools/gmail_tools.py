import os
import sys

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from tools.gmail_tools import (
    gmail_mcp,
    gmail_create_draft,
    gmail_send_email,
    gmail_search_messages,
    gmail_get_thread
)
