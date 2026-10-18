import os
import sys
import io
import csv
import json
import random
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Tuple
from pydantic import BaseModel, Field

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from agents.state import SheetResult, WorkflowState
from tools.sheet_tools import sheets_mcp


class SheetAgent:
    """
    Google Sheets Specialist Agent for AxiomFlow.
    Responsible for:
      - Creating new Google Spreadsheets (e.g. 'sales')
      - Generating and inserting business data rows (e.g. 10 random sales transactions)
      - Exporting tabular data as CSV for email attachments and downstream agents
      - Emitting structured observability logs to terminal
    """

    def __init__(self):
        pass

    def generate_random_sales_data(self, count: int = 10) -> Tuple[List[str], List[List[Any]]]:
        """
        Generates tabular sales records conforming to the required schema:
        Columns: customer_id, date-time, quantity, total_price, discount
        """
        headers = ["customer_id", "date-time", "quantity", "total_price", "discount"]
        rows: List[List[Any]] = []

        base_time = datetime(2026, 10, 1, 9, 30, 0)
        discounts = ["0%", "5%", "10%", "12%", "15%", "20%"]

        for i in range(1, count + 1):
            cust_id = f"CUST-{1000 + i}"
            # Random date within October 2026
            dt = base_time + timedelta(days=random.randint(0, 16), hours=random.randint(1, 10), minutes=random.randint(0, 59))
            dt_str = dt.strftime("%Y-%m-%d %H:%M:%S")
            quantity = random.randint(1, 25)
            unit_price = random.choice([250.0, 499.0, 1200.0, 3500.0, 5800.0, 12500.0])
            total_price = round(quantity * unit_price, 2)
            discount = random.choice(discounts)

            rows.append([cust_id, dt_str, quantity, total_price, discount])

        return headers, rows

    async def create_and_populate_sheet_via_mcp(
        self,
        user_id: str,
        account_email: str,
        title: str = "sales",
        sheet_name: str = "sales",
        num_records: int = 10
    ) -> SheetResult:
        """
        Executes Google Sheets creation and data insertion via FastMCP tools:
          1. sheets_create_spreadsheet
          2. sheets_append_values
        Also builds in-memory CSV for email attachment.
        """
        print("\n" + "=" * 80)
        print("          [SHEET AGENT] INITIALIZING GOOGLE SHEETS CREATION & POPULATION")
        print("=" * 80)
        print(f"User ID:        {user_id}")
        print(f"Account Email:  {account_email}")
        print(f"Target Sheet:   {title} (Tab: {sheet_name})")
        print(f"Records to add: {num_records}")
        print("-" * 80)

        # 1. Create Spreadsheet
        print(f"[SHEET AGENT] Step 1: Creating Google Spreadsheet '{title}' via FastMCP...")
        create_args = {
            "user_id": user_id,
            "account_email": account_email,
            "title": title,
            "sheet_name": sheet_name
        }

        create_res = await sheets_mcp.call_tool("sheets_create_spreadsheet", create_args)
        if create_res.is_error:
            raise RuntimeError(f"FastMCP sheets_create_spreadsheet failed: {create_res.content}")

        raw_create_data = create_res.structured_content or {}
        create_data = raw_create_data.get("result", raw_create_data)
        spreadsheet_id = create_data.get("spreadsheet_id")
        spreadsheet_url = create_data.get("spreadsheet_url")

        print("[SHEET AGENT] [SUCCESS] Spreadsheet Created!")
        print(f"  Spreadsheet ID:  {spreadsheet_id}")
        print(f"  Spreadsheet URL: {spreadsheet_url}")

        # 2. Generate Random Sales Data
        headers, rows = self.generate_random_sales_data(count=num_records)
        full_table = [headers] + rows

        print(f"\n[SHEET AGENT] Step 2: Inserting {len(rows)} sales records into '{sheet_name}!A1'...")
        append_args = {
            "user_id": user_id,
            "account_email": account_email,
            "spreadsheet_id": spreadsheet_id,
            "range_name": f"{sheet_name}!A1",
            "values": full_table
        }

        append_res = await sheets_mcp.call_tool("sheets_append_values", append_args)
        if append_res.is_error:
            raise RuntimeError(f"FastMCP sheets_append_values failed: {append_res.content}")

        raw_append_data = append_res.structured_content or {}
        append_data = raw_append_data.get("result", raw_append_data)
        print("[SHEET AGENT] [SUCCESS] Sales data inserted into Google Sheets!")
        print(f"  Updated Range: {append_data.get('updated_range')}")
        print(f"  Rows Added:    {append_data.get('updated_rows')}")

        # 3. Build CSV Attachment Content
        csv_buffer = io.StringIO()
        csv_writer = csv.writer(csv_buffer)
        csv_writer.writerow(headers)
        csv_writer.writerows(rows)
        csv_content = csv_buffer.getvalue()

        # Print Formatted Table for Observability & Tracing
        print("\n" + "-" * 80)
        print("          [SHEET AGENT] POPULATED SALES SHEET PREVIEW")
        print("-" * 80)
        print(f"{'#':<4} | {'Customer ID':<13} | {'Date-Time':<20} | {'Quantity':<9} | {'Total Price':<14} | {'Discount'}")
        print("-" * 80)
        for idx, r in enumerate(rows, 1):
            print(f"{idx:<4} | {r[0]:<13} | {r[1]:<20} | {r[2]:<9} | INR {r[3]:<10} | {r[4]}")
        print("-" * 80)
        print(f"[SHEET AGENT] CSV Content generated ({len(csv_content)} bytes ready for email attachment).")
        print("=" * 80 + "\n")

        return SheetResult(
            spreadsheet_id=spreadsheet_id,
            spreadsheet_url=spreadsheet_url,
            title=title,
            sheet_name=sheet_name,
            row_count=len(rows),
            headers=headers,
            values=rows,
            csv_content=csv_content
        )


async def sheet_agent_execution_node(state: WorkflowState) -> Dict[str, Any]:
    """
    LangGraph node adapter for Sheet Agent execution.
    Extracts parameters from state/plan, invokes SheetAgent to create and populate
    the Google Sheet, and registers tool outcomes.
    """
    user_id = state.get("user_id", "usr_72b30e7cd49e49e5")
    account_email = state.get("account_email", "chillalyash2005@gmail.com")
    plan = state.get("plan") or {}

    title = "sales"
    sheet_name = "sales"

    # Inspect plan parameters if planner provided explicit sheet title
    if plan and "steps" in plan:
        for step in plan["steps"]:
            if "sheets" in step.get("capability", ""):
                params = step.get("parameters", {})
                title = params.get("title", params.get("sheet_title", title))
                sheet_name = params.get("sheet_name", sheet_name)
                break

    agent = SheetAgent()
    sheet_result = await agent.create_and_populate_sheet_via_mcp(
        user_id=user_id,
        account_email=account_email,
        title=title,
        sheet_name=sheet_name,
        num_records=10
    )

    outcomes = list(state.get("tool_outcomes", []))
    outcomes.append({
        "step_id": "sheets_create_spreadsheet",
        "capability": "sheets.create",
        "status": "succeeded",
        "resource_id": sheet_result.spreadsheet_id,
        "data": {
            "title": sheet_result.title,
            "url": sheet_result.spreadsheet_url
        }
    })
    outcomes.append({
        "step_id": "sheets_append_values",
        "capability": "sheets.append",
        "status": "succeeded",
        "resource_id": sheet_result.spreadsheet_id,
        "data": {
            "row_count": sheet_result.row_count,
            "headers": sheet_result.headers
        }
    })

    return {
        "sheet_result": sheet_result.model_dump(),
        "tool_outcomes": outcomes,
        "status": "drafting_email"
    }
