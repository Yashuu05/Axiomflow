import os
import sys

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from tools.docs_tools import (
    docs_mcp,
    docs_create_document,
    docs_read_document,
    docs_write_document,
    docs_replace_text,
    docs_delete_content_range,
    docs_delete_document
)
