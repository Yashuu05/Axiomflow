import os
import sys
import base64
from email.message import EmailMessage
from typing import List, Optional, Dict, Any
from fastmcp import FastMCP

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from tools.client_factory import get_authorized_service

# Initialize FastMCP Server for Gmail Tools
gmail_mcp = FastMCP("GmailToolsServer")


def _build_raw_message(
    to: List[str] | str,
    subject: str,
    body: str,
    cc: Optional[List[str] | str] = None,
    bcc: Optional[List[str] | str] = None,
    attachments: Optional[List[Dict[str, Any]]] = None
) -> str:
    """Helper function to build base64url encoded raw email according to RFC 2822 with optional attachments."""
    msg = EmailMessage()
    msg.set_content(body)

    if isinstance(to, list):
        msg["To"] = ", ".join(to)
    else:
        msg["To"] = to

    msg["Subject"] = subject

    if cc:
        msg["Cc"] = ", ".join(cc) if isinstance(cc, list) else cc
    if bcc:
        msg["Bcc"] = ", ".join(bcc) if isinstance(bcc, list) else bcc

    if attachments:
        for att in attachments:
            filename = att.get("filename", "attachment.csv")
            content = att.get("content", "")
            if isinstance(content, str):
                content = content.encode("utf-8")
            maintype = att.get("maintype", "text")
            subtype = att.get("subtype", "csv")
            msg.add_attachment(content, maintype=maintype, subtype=subtype, filename=filename)

    raw_bytes = msg.as_bytes()
    return base64.urlsafe_b64encode(raw_bytes).decode("utf-8")


@gmail_mcp.tool()
def gmail_create_draft(
    user_id: str,
    account_email: str,
    to: List[str],
    subject: str,
    body: str,
    cc: Optional[List[str]] = None,
    bcc: Optional[List[str]] = None,
    attachments: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Creates a draft email in Gmail without sending.
    Official Google reference: https://developers.google.com/workspace/gmail/api/guides/drafts

    Args:
        user_id: AxiomFlow User ID
        account_email: User's connected Google account email
        to: List of recipient email addresses
        subject: Subject line for the email
        body: Plain text content of the email
        cc: Optional list of CC recipient addresses
        bcc: Optional list of BCC recipient addresses
        attachments: Optional list of attachment dictionaries with filename, content, maintype, subtype

    Returns:
        Dict containing draft ID and created draft metadata
    """
    service = get_authorized_service(
        service_name="gmail",
        version="v1",
        user_id=user_id,
        account_email=account_email
    )

    encoded_message = _build_raw_message(to=to, subject=subject, body=body, cc=cc, bcc=bcc, attachments=attachments)
    draft_body = {
        "message": {
            "raw": encoded_message
        }
    }

    draft = service.users().drafts().create(userId="me", body=draft_body).execute()
    return {
        "status": "success",
        "operation": "gmail.draft",
        "draft_id": draft.get("id"),
        "message_id": draft.get("message", {}).get("id")
    }


@gmail_mcp.tool()
def gmail_send_email(
    user_id: str,
    account_email: str,
    to: List[str],
    subject: str,
    body: str,
    cc: Optional[List[str]] = None,
    bcc: Optional[List[str]] = None,
    thread_id: Optional[str] = None,
    attachments: Optional[List[Dict[str, Any]]] = None
) -> Dict[str, Any]:
    """
    Sends an email message directly via the official Gmail API with optional attachments.
    Official Google reference: https://developers.google.com/workspace/gmail/api/guides/sending

    Args:
        user_id: AxiomFlow User ID
        account_email: User's connected Google account email
        to: List of recipient email addresses
        subject: Subject line for the email
        body: Plain text content of the email
        cc: Optional list of CC recipient addresses
        bcc: Optional list of BCC recipient addresses
        thread_id: Optional thread ID to send as part of an existing conversation
        attachments: Optional list of attachment dictionaries with filename, content, maintype, subtype

    Returns:
        Dict containing the sent message ID, thread ID, and label IDs
    """
    service = get_authorized_service(
        service_name="gmail",
        version="v1",
        user_id=user_id,
        account_email=account_email
    )

    encoded_message = _build_raw_message(to=to, subject=subject, body=body, cc=cc, bcc=bcc, attachments=attachments)
    message_body: Dict[str, Any] = {
        "raw": encoded_message
    }
    if thread_id:
        message_body["threadId"] = thread_id

    sent_message = service.users().messages().send(userId="me", body=message_body).execute()
    return {
        "status": "success",
        "operation": "gmail.send",
        "message_id": sent_message.get("id"),
        "thread_id": sent_message.get("threadId"),
        "label_ids": sent_message.get("labelIds", []),
        "has_attachments": bool(attachments)
    }


@gmail_mcp.tool()
def gmail_search_messages(
    user_id: str,
    account_email: str,
    query: str,
    max_results: int = 10
) -> Dict[str, Any]:
    """
    Searches Gmail messages matching a search query (e.g., 'from:client@example.com is:unread').
    Official Google reference: https://developers.google.com/workspace/gmail/api/quickstart/python

    Args:
        user_id: AxiomFlow User ID
        account_email: User's connected Google account email
        query: Gmail search query filter string
        max_results: Maximum number of messages to return (default 10)

    Returns:
        Dict containing matching message list with snippet, subject, sender, and dates
    """
    service = get_authorized_service(
        service_name="gmail",
        version="v1",
        user_id=user_id,
        account_email=account_email
    )

    response = service.users().messages().list(userId="me", q=query, maxResults=max_results).execute()
    messages = response.get("messages", [])

    detailed_messages = []
    for msg_meta in messages[:max_results]:
        msg_id = msg_meta.get("id")
        full_msg = service.users().messages().get(
            userId="me",
            id=msg_id,
            format="metadata",
            metadataHeaders=["Subject", "From", "To", "Date"]
        ).execute()

        headers = {h["name"]: h["value"] for h in full_msg.get("payload", {}).get("headers", [])}
        detailed_messages.append({
            "id": msg_id,
            "thread_id": full_msg.get("threadId"),
            "snippet": full_msg.get("snippet"),
            "subject": headers.get("Subject", ""),
            "from": headers.get("From", ""),
            "to": headers.get("To", ""),
            "date": headers.get("Date", "")
        })

    return {
        "status": "success",
        "operation": "gmail.search",
        "query": query,
        "count": len(detailed_messages),
        "messages": detailed_messages
    }


@gmail_mcp.tool()
def gmail_get_thread(
    user_id: str,
    account_email: str,
    thread_id: str
) -> Dict[str, Any]:
    """
    Retrieves full details of a specific email thread by thread ID.
    Official Google reference: https://developers.google.com/workspace/gmail/api/quickstart/python

    Args:
        user_id: AxiomFlow User ID
        account_email: User's connected Google account email
        thread_id: Gmail thread ID

    Returns:
        Dict containing messages within the thread
    """
    service = get_authorized_service(
        service_name="gmail",
        version="v1",
        user_id=user_id,
        account_email=account_email
    )

    thread = service.users().threads().get(userId="me", id=thread_id).execute()
    messages = thread.get("messages", [])
    summarized_messages = []

    for msg in messages:
        headers = {h["name"]: h["value"] for h in msg.get("payload", {}).get("headers", [])}
        summarized_messages.append({
            "id": msg.get("id"),
            "snippet": msg.get("snippet"),
            "subject": headers.get("Subject", ""),
            "from": headers.get("From", ""),
            "date": headers.get("Date", "")
        })

    return {
        "status": "success",
        "operation": "gmail.get_thread",
        "thread_id": thread_id,
        "message_count": len(summarized_messages),
        "messages": summarized_messages
    }
