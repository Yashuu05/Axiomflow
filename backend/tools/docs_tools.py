import os
import sys
from typing import Optional, Dict, Any, List
from fastmcp import FastMCP

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from tools.client_factory import get_authorized_service

# Initialize FastMCP Server for Google Docs & Drive Tools
docs_mcp = FastMCP("DocsToolsServer")


@docs_mcp.tool()
def docs_create_document(
    user_id: str,
    account_email: str,
    title: str,
    initial_text: Optional[str] = None
) -> Dict[str, Any]:
    """
    Creates a new Google Document.
    Official Google reference: https://developers.google.com/docs/api/reference/rest/v1/documents/create

    Args:
        user_id: AxiomFlow User ID
        account_email: User's connected Google account email
        title: Title of the new Google Document
        initial_text: Optional starting text content to populate immediately

    Returns:
        Dict containing document ID, URL, title, and initial update confirmation
    """
    service = get_authorized_service(
        service_name="docs",
        version="v1",
        user_id=user_id,
        account_email=account_email
    )

    doc = service.documents().create(body={"title": title}).execute()
    document_id = doc.get("documentId")
    document_url = f"https://docs.google.com/document/d/{document_id}/edit"

    chars_written = 0
    if initial_text:
        text_to_insert = str(initial_text)
        requests = [{
            "insertText": {
                "location": {"index": 1},
                "text": text_to_insert
            }
        }]
        service.documents().batchUpdate(
            documentId=document_id,
            body={"requests": requests}
        ).execute()
        chars_written = len(text_to_insert)

    return {
        "status": "success",
        "operation": "docs.create",
        "document_id": document_id,
        "document_url": document_url,
        "title": title,
        "characters_written": chars_written
    }


@docs_mcp.tool()
def docs_read_document(
    user_id: str,
    account_email: str,
    document_id: str
) -> Dict[str, Any]:
    """
    Reads a Google Document and extracts plain text, metadata, and structural statistics.
    Official Google reference: https://developers.google.com/docs/api/reference/rest/v1/documents/get

    Args:
        user_id: AxiomFlow User ID
        account_email: User's connected Google account email
        document_id: Google Document ID

    Returns:
        Dict containing document ID, title, URL, full extracted text, word count, paragraph count
    """
    service = get_authorized_service(
        service_name="docs",
        version="v1",
        user_id=user_id,
        account_email=account_email
    )

    doc = service.documents().get(documentId=document_id).execute()
    title = doc.get("title", "Untitled Document")
    body = doc.get("body", {})
    content_elements = body.get("content", [])

    extracted_text_chunks: List[str] = []
    paragraph_count = 0

    for element in content_elements:
        if "paragraph" in element:
            paragraph_count += 1
            for pe in element["paragraph"].get("elements", []):
                if "textRun" in pe:
                    extracted_text_chunks.append(pe["textRun"].get("content", ""))

    full_text = "".join(extracted_text_chunks)
    word_count = len(full_text.split())

    return {
        "status": "success",
        "operation": "docs.read",
        "document_id": document_id,
        "title": title,
        "document_url": f"https://docs.google.com/document/d/{document_id}/edit",
        "content": full_text,
        "word_count": word_count,
        "paragraph_count": paragraph_count,
        "revision_id": doc.get("revisionId")
    }


@docs_mcp.tool()
def docs_write_document(
    user_id: str,
    account_email: str,
    document_id: str,
    text: str,
    mode: str = "append",
    insert_index: Optional[int] = 1
) -> Dict[str, Any]:
    """
    Writes, appends, inserts, or overwrites text in a specified Google Document.
    Official Google reference: https://developers.google.com/docs/api/reference/rest/v1/documents/batchUpdate

    Args:
        user_id: AxiomFlow User ID
        account_email: User's connected Google account email
        document_id: Google Document ID
        text: Text content to write
        mode: Writing mode: 'append' (default), 'insert', or 'overwrite'
        insert_index: Target index if mode='insert' (defaults to 1)

    Returns:
        Dict confirming update operation, character count, and document URL
    """
    service = get_authorized_service(
        service_name="docs",
        version="v1",
        user_id=user_id,
        account_email=account_email
    )

    requests: List[Dict[str, Any]] = []

    if mode == "append":
        # Using endOfSegmentLocation with segmentId='' appends reliably to body end
        requests.append({
            "insertText": {
                "text": text,
                "endOfSegmentLocation": {"segmentId": ""}
            }
        })
    elif mode == "insert":
        idx = max(1, insert_index or 1)
        requests.append({
            "insertText": {
                "location": {"index": idx},
                "text": text
            }
        })
    elif mode == "overwrite":
        # 1. Fetch current document structure to calculate content boundaries
        doc = service.documents().get(documentId=document_id).execute()
        content = doc.get("body", {}).get("content", [])
        end_idx = content[-1].get("endIndex", 1) if content else 1
        # Google Docs requires preserving the trailing newline, so delete up to end_idx - 1
        if end_idx > 2:
            requests.append({
                "deleteContentRange": {
                    "range": {
                        "startIndex": 1,
                        "endIndex": end_idx - 1
                    }
                }
            })
        requests.append({
            "insertText": {
                "location": {"index": 1},
                "text": text
            }
        })
    else:
        raise ValueError(f"Unsupported write mode '{mode}'. Supported modes: 'append', 'insert', 'overwrite'.")

    result = service.documents().batchUpdate(
        documentId=document_id,
        body={"requests": requests}
    ).execute()

    return {
        "status": "success",
        "operation": f"docs.write_{mode}",
        "document_id": document_id,
        "document_url": f"https://docs.google.com/document/d/{document_id}/edit",
        "replies_count": len(result.get("replies", [])),
        "characters_written": len(text)
    }


@docs_mcp.tool()
def docs_replace_text(
    user_id: str,
    account_email: str,
    document_id: str,
    search_text: str,
    replace_text: str,
    match_case: bool = True
) -> Dict[str, Any]:
    """
    Replaces all occurrences of target text or placeholders throughout a Google Document.
    Official Google reference: https://developers.google.com/docs/api/reference/rest/v1/documents/request#ReplaceAllTextRequest

    Args:
        user_id: AxiomFlow User ID
        account_email: User's connected Google account email
        document_id: Google Document ID
        search_text: Target text or placeholder (e.g. '{{client_name}}')
        replace_text: Replacement text string
        match_case: Whether string matching is case sensitive (default True)

    Returns:
        Dict with count of occurrences replaced and document ID
    """
    service = get_authorized_service(
        service_name="docs",
        version="v1",
        user_id=user_id,
        account_email=account_email
    )

    requests = [{
        "replaceAllText": {
            "containsText": {
                "text": search_text,
                "matchCase": match_case
            },
            "replaceText": replace_text
        }
    }]

    result = service.documents().batchUpdate(
        documentId=document_id,
        body={"requests": requests}
    ).execute()

    occurrences = 0
    for reply in result.get("replies", []):
        if "replaceAllText" in reply:
            occurrences += reply["replaceAllText"].get("occurrencesChanged", 0)

    return {
        "status": "success",
        "operation": "docs.replace_text",
        "document_id": document_id,
        "document_url": f"https://docs.google.com/document/d/{document_id}/edit",
        "occurrences_changed": occurrences
    }


@docs_mcp.tool()
def docs_delete_content_range(
    user_id: str,
    account_email: str,
    document_id: str,
    start_index: int,
    end_index: int
) -> Dict[str, Any]:
    """
    Deletes content within a specified character index range in a Google Document.
    Official Google reference: https://developers.google.com/docs/api/reference/rest/v1/documents/request#DeleteContentRangeRequest

    Args:
        user_id: AxiomFlow User ID
        account_email: User's connected Google account email
        document_id: Google Document ID
        start_index: Starting UTF-16 code unit index (must be >= 1)
        end_index: Ending UTF-16 code unit index (must be > start_index)

    Returns:
        Dict confirming range deletion
    """
    if start_index < 1 or end_index <= start_index:
        raise ValueError("Invalid index range: start_index must be >= 1 and < end_index.")

    service = get_authorized_service(
        service_name="docs",
        version="v1",
        user_id=user_id,
        account_email=account_email
    )

    requests = [{
        "deleteContentRange": {
            "range": {
                "startIndex": start_index,
                "endIndex": end_index
            }
        }
    }]

    service.documents().batchUpdate(
        documentId=document_id,
        body={"requests": requests}
    ).execute()

    return {
        "status": "success",
        "operation": "docs.delete_range",
        "document_id": document_id,
        "deleted_range": {"start": start_index, "end": end_index}
    }


@docs_mcp.tool()
def docs_delete_document(
    user_id: str,
    account_email: str,
    document_id: str,
    permanent: bool = False
) -> Dict[str, Any]:
    """
    Deletes or trashes a Google Document file via Google Drive API v3.
    Requires scope https://www.googleapis.com/auth/drive.file.

    Args:
        user_id: AxiomFlow User ID
        account_email: User's connected Google account email
        document_id: Google Document ID
        permanent: If True, permanently deletes the file; if False (default), moves it to Trash

    Returns:
        Dict confirming trash or deletion outcome
    """
    drive_service = get_authorized_service(
        service_name="drive",
        version="v3",
        user_id=user_id,
        account_email=account_email
    )

    if permanent:
        drive_service.files().delete(fileId=document_id).execute()
        action = "permanently_deleted"
    else:
        drive_service.files().update(fileId=document_id, body={"trashed": True}).execute()
        action = "moved_to_trash"

    return {
        "status": "success",
        "operation": "docs.delete_document",
        "document_id": document_id,
        "action": action
    }
