import os
import sys
from typing import List, Optional, Dict, Any
from fastmcp import FastMCP

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from tools.client_factory import get_authorized_service

# Initialize FastMCP Server for Google Sheets Tools
sheets_mcp = FastMCP("SheetsToolsServer")


@sheets_mcp.tool()
def sheets_create_spreadsheet(
    user_id: str,
    account_email: str,
    title: str,
    sheet_name: Optional[str] = "Sheet1"
) -> Dict[str, Any]:
    """
    Creates a new Google Spreadsheet.
    Official Google reference: https://developers.google.com/workspace/sheets/api/guides/create

    Args:
        user_id: AxiomFlow User ID
        account_email: User's connected Google account email
        title: Title of the new Google Spreadsheet
        sheet_name: Name of the initial sheet tab (default 'Sheet1')

    Returns:
        Dict containing spreadsheet ID, URL, and created sheet properties
    """
    service = get_authorized_service(
        service_name="sheets",
        version="v4",
        user_id=user_id,
        account_email=account_email
    )

    spreadsheet_body = {
        "properties": {
            "title": title
        },
        "sheets": [
            {
                "properties": {
                    "title": sheet_name
                }
            }
        ]
    }

    spreadsheet = service.spreadsheets().create(
        body=spreadsheet_body,
        fields="spreadsheetId,spreadsheetUrl,properties,sheets.properties"
    ).execute()

    return {
        "status": "success",
        "operation": "sheets.create",
        "spreadsheet_id": spreadsheet.get("spreadsheetId"),
        "spreadsheet_url": spreadsheet.get("spreadsheetUrl"),
        "title": spreadsheet.get("properties", {}).get("title")
    }


@sheets_mcp.tool()
def sheets_read_values(
    user_id: str,
    account_email: str,
    spreadsheet_id: str,
    range_name: str
) -> Dict[str, Any]:
    """
    Reads cell values from a specified Google Spreadsheet and A1 range.
    Official Google reference: https://developers.google.com/workspace/sheets/api/guides/values

    Args:
        user_id: AxiomFlow User ID
        account_email: User's connected Google account email
        spreadsheet_id: Google Spreadsheet ID
        range_name: A1 notation range (e.g. 'Sheet1!A1:D10' or 'A1:C5')

    Returns:
        Dict containing row values matrix and dimension information
    """
    service = get_authorized_service(
        service_name="sheets",
        version="v4",
        user_id=user_id,
        account_email=account_email
    )

    result = service.spreadsheets().values().get(
        spreadsheetId=spreadsheet_id,
        range=range_name
    ).execute()

    rows = result.get("values", [])
    return {
        "status": "success",
        "operation": "sheets.read",
        "spreadsheet_id": spreadsheet_id,
        "range": result.get("range", range_name),
        "major_dimension": result.get("majorDimension", "ROWS"),
        "row_count": len(rows),
        "values": rows
    }


@sheets_mcp.tool()
def sheets_append_values(
    user_id: str,
    account_email: str,
    spreadsheet_id: str,
    range_name: str,
    values: List[List[Any]],
    value_input_option: str = "USER_ENTERED"
) -> Dict[str, Any]:
    """
    Appends tabular rows to a Google Spreadsheet following existing data.
    Official Google reference: https://developers.google.com/workspace/sheets/api/guides/values

    Args:
        user_id: AxiomFlow User ID
        account_email: User's connected Google account email
        spreadsheet_id: Google Spreadsheet ID
        range_name: A1 notation of table to append to (e.g. 'Sheet1!A1')
        values: 2D matrix of row values to append (e.g. [['2026-10-18', 'Client Sync', 500]])
        value_input_option: 'RAW' or 'USER_ENTERED' (default 'USER_ENTERED')

    Returns:
        Dict containing updated range, updated rows, and updated cells count
    """
    service = get_authorized_service(
        service_name="sheets",
        version="v4",
        user_id=user_id,
        account_email=account_email
    )

    body = {
        "values": values
    }

    result = service.spreadsheets().values().append(
        spreadsheetId=spreadsheet_id,
        range=range_name,
        valueInputOption=value_input_option,
        insertDataOption="INSERT_ROWS",
        body=body
    ).execute()

    updates = result.get("updates", {})
    return {
        "status": "success",
        "operation": "sheets.append",
        "spreadsheet_id": spreadsheet_id,
        "updated_range": updates.get("updatedRange"),
        "updated_rows": updates.get("updatedRows"),
        "updated_columns": updates.get("updatedColumns"),
        "updated_cells": updates.get("updatedCells")
    }


@sheets_mcp.tool()
def sheets_update_values(
    user_id: str,
    account_email: str,
    spreadsheet_id: str,
    range_name: str,
    values: List[List[Any]],
    value_input_option: str = "USER_ENTERED"
) -> Dict[str, Any]:
    """
    Updates or overwrites specific cells in a Google Spreadsheet in a specified A1 range.
    Official Google reference: https://developers.google.com/workspace/sheets/api/guides/values

    Args:
        user_id: AxiomFlow User ID
        account_email: User's connected Google account email
        spreadsheet_id: Google Spreadsheet ID
        range_name: Exact A1 notation range to update (e.g. 'Sheet1!B2:D2')
        values: 2D matrix of values to write
        value_input_option: 'RAW' or 'USER_ENTERED' (default 'USER_ENTERED')

    Returns:
        Dict containing updated range and updated cells count
    """
    service = get_authorized_service(
        service_name="sheets",
        version="v4",
        user_id=user_id,
        account_email=account_email
    )

    body = {
        "values": values
    }

    result = service.spreadsheets().values().update(
        spreadsheetId=spreadsheet_id,
        range=range_name,
        valueInputOption=value_input_option,
        body=body
    ).execute()

    return {
        "status": "success",
        "operation": "sheets.update",
        "spreadsheet_id": spreadsheet_id,
        "updated_range": result.get("updatedRange"),
        "updated_rows": result.get("updatedRows"),
        "updated_columns": result.get("updatedColumns"),
        "updated_cells": result.get("updatedCells")
    }


@sheets_mcp.tool()
def sheets_batch_update(
    user_id: str,
    account_email: str,
    spreadsheet_id: str,
    requests: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """
    Applies one or more spreadsheet formatting, structure, or calculation updates in a batch.
    Official Google reference: https://developers.google.com/workspace/sheets/api/guides/batchupdate

    Args:
        user_id: AxiomFlow User ID
        account_email: User's connected Google account email
        spreadsheet_id: Google Spreadsheet ID
        requests: List of BatchUpdate request dictionaries (e.g., addSheet, updateSheetProperties)

    Returns:
        Dict containing batch update replies and updated spreadsheet ID
    """
    service = get_authorized_service(
        service_name="sheets",
        version="v4",
        user_id=user_id,
        account_email=account_email
    )

    body = {
        "requests": requests
    }

    result = service.spreadsheets().batchUpdate(
        spreadsheetId=spreadsheet_id,
        body=body
    ).execute()

    return {
        "status": "success",
        "operation": "sheets.batch_update",
        "spreadsheet_id": spreadsheet_id,
        "replies_count": len(result.get("replies", []))
    }


@sheets_mcp.tool()
def sheets_clear_values(
    user_id: str,
    account_email: str,
    spreadsheet_id: str,
    range_name: str = "Sheet1!A1:Z100"
) -> Dict[str, Any]:
    """
    Clears all values and content from a specified range in a Google Spreadsheet.
    Official Google reference: https://developers.google.com/workspace/sheets/api/guides/values#clear_values

    Args:
        user_id: AxiomFlow User ID
        account_email: User's connected Google account email
        spreadsheet_id: Google Spreadsheet ID
        range_name: A1 notation range to clear (default 'Sheet1!A1:Z100')

    Returns:
        Dict confirming cleared range and spreadsheet ID
    """
    service = get_authorized_service(
        service_name="sheets",
        version="v4",
        user_id=user_id,
        account_email=account_email
    )

    result = service.spreadsheets().values().clear(
        spreadsheetId=spreadsheet_id,
        range=range_name,
        body={}
    ).execute()

    return {
        "status": "success",
        "operation": "sheets.clear",
        "spreadsheet_id": spreadsheet_id,
        "cleared_range": result.get("clearedRange", range_name)
    }

