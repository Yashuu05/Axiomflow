import os
import sys
from typing import Optional
from googleapiclient.discovery import build
from google.oauth2.credentials import Credentials

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

import main
from google_credentials_manager import get_user_google_credentials


def get_authorized_service(
    service_name: str,
    version: str,
    user_id: str,
    account_email: str
):
    """
    Builds and returns an authorized Google API service instance for a specific user and email.
    Credentials are encrypted at rest and automatically refreshed using google_credentials_manager.
    """
    conn = main.get_db_connection()
    try:
        credentials: Credentials = get_user_google_credentials(
            user_id=user_id,
            account_email=account_email,
            conn=conn
        )
        return build(service_name, version, credentials=credentials, cache_discovery=False)
    finally:
        conn.close()
