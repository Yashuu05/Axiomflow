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

    def generate_retail_sales_data(self, count: int = 12) -> Tuple[List[str], List[List[Any]]]:
        """
        Generates realistic retail sales transactions for multi-branch retail analysis.
        Columns: transaction_id, date, store_branch, category, units_sold, unit_price, revenue, cost, profit, payment_method
        """
        headers = [
            "transaction_id", "date", "store_branch", "category",
            "units_sold", "unit_price", "revenue", "cost", "profit", "payment_method"
        ]
        branches = ["Bangalore Central", "Mumbai Bandra", "Delhi Connaught", "Hyderabad Hitech"]
        categories = ["Electronics", "Apparel", "Home Goods", "Footwear"]
        payments = ["UPI", "Credit Card", "Net Banking", "Debit Card"]

        base_date = datetime(2026, 10, 1)
        rows: List[List[Any]] = []

        for i in range(1, count + 1):
            tx_id = f"TXN-80{100 + i}"
            dt_str = (base_date + timedelta(days=random.randint(1, 16))).strftime("%Y-%m-%d")
            branch = random.choice(branches)
            cat = random.choice(categories)
            units = random.randint(2, 20)
            unit_price = random.choice([499.0, 1299.0, 2499.0, 4999.0, 8999.0])
            revenue = round(units * unit_price, 2)
            cost = round(revenue * random.uniform(0.65, 0.78), 2)
            profit = round(revenue - cost, 2)
            payment = random.choice(payments)

            rows.append([tx_id, dt_str, branch, cat, units, unit_price, revenue, cost, profit, payment])

        return headers, rows

    def analyze_retail_sales(self, headers: List[str], rows: List[List[Any]]) -> Tuple[str, Dict[str, Any]]:
        """
        Performs business and financial analytics on retrieved retail sales records.
        Produces quantitative metrics and a structured, executive plain-text summary of insights.
        """
        total_revenue = 0.0
        total_profit = 0.0
        total_units = 0
        category_revenue: Dict[str, float] = {}
        branch_revenue: Dict[str, float] = {}

        # Column indices: 2: branch, 3: category, 4: units_sold, 6: revenue, 8: profit
        for r in rows:
            try:
                branch = str(r[2])
                cat = str(r[3])
                units = int(r[4])
                rev = float(r[6])
                prof = float(r[8])

                total_revenue += rev
                total_profit += prof
                total_units += units

                category_revenue[cat] = category_revenue.get(cat, 0.0) + rev
                branch_revenue[branch] = branch_revenue.get(branch, 0.0) + rev
            except (ValueError, IndexError):
                continue

        margin_pct = (total_profit / total_revenue * 100.0) if total_revenue > 0 else 0.0
        top_category = max(category_revenue.items(), key=lambda x: x[1])[0] if category_revenue else "General"
        top_category_rev = category_revenue.get(top_category, 0.0)
        top_branch = max(branch_revenue.items(), key=lambda x: x[1])[0] if branch_revenue else "Main Branch"
        top_branch_rev = branch_revenue.get(top_branch, 0.0)

        insights_lines = [
            f"- Gross Revenue: Total sales across all retail outlets reached INR {total_revenue:,.2f} over {len(rows)} transactions.",
            f"- Cumulative Net Profit: INR {total_profit:,.2f} maintaining a solid {margin_pct:.1f}% operating profit margin.",
            f"- Top Product Segment: '{top_category}' led overall sales, generating INR {top_category_rev:,.2f} ({(top_category_rev / total_revenue * 100):.1f}% of total revenue).",
            f"- Leading Retail Outlet: '{top_branch}' delivered highest store-level revenue at INR {top_branch_rev:,.2f}.",
            f"- Units Moved: {total_units} total retail units sold during the analyzed period.",
            f"- Recommendation for Executive Review: Prioritize inventory replenishment for '{top_category}' and optimize staffing at '{top_branch}' ahead of holiday demand."
        ]
        insights_text = "\n".join(insights_lines)

        metrics = {
            "total_revenue": total_revenue,
            "total_profit": total_profit,
            "margin_pct": round(margin_pct, 2),
            "total_units": total_units,
            "top_category": top_category,
            "top_category_rev": top_category_rev,
            "top_branch": top_branch,
            "top_branch_rev": top_branch_rev
        }

        return insights_text, metrics

    async def read_or_populate_retail_sales_sheet(
        self,
        user_id: str,
        account_email: str,
        title: str = "retail_sales",
        sheet_name: str = "retail_sales"
    ) -> SheetResult:
        """
        Handles the full retail sales workflow:
          1. Creates spreadsheet 'retail_sales' via FastMCP
          2. Appends realistic retail sales data
          3. Reads values back via FastMCP 'sheets_read_values'
          4. Analyzes the retrieved values to extract executive insights
          5. Generates CSV for email attachment
        """
        print("\n" + "=" * 80)
        print("          [SHEET AGENT] RETRIEVING & ANALYZING 'retail_sales' SHEET")
        print("=" * 80)
        print(f"User ID:        {user_id}")
        print(f"Account Email:  {account_email}")
        print(f"Target Sheet:   {title} (Tab: {sheet_name})")
        print("-" * 80)

        # 1. Create Spreadsheet
        print(f"[SHEET AGENT] Step 1: Initializing/Creating Google Spreadsheet '{title}' via FastMCP...")
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

        print("[SHEET AGENT] [SUCCESS] Target Spreadsheet Online!")
        print(f"  Spreadsheet ID:  {spreadsheet_id}")
        print(f"  Spreadsheet URL: {spreadsheet_url}")

        # 2. Populate Retail Sales Transactions
        headers, rows = self.generate_retail_sales_data(count=12)
        full_table = [headers] + rows

        print(f"\n[SHEET AGENT] Step 2: Populating {len(rows)} retail sales records into '{sheet_name}!A1'...")
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

        # 3. Read Values back using FastMCP sheets_read_values
        print(f"\n[SHEET AGENT] Step 3: Reading cell values from '{sheet_name}!A1:J20' via FastMCP...")
        read_args = {
            "user_id": user_id,
            "account_email": account_email,
            "spreadsheet_id": spreadsheet_id,
            "range_name": f"{sheet_name}!A1:J20"
        }
        read_res = await sheets_mcp.call_tool("sheets_read_values", read_args)
        if read_res.is_error:
            raise RuntimeError(f"FastMCP sheets_read_values failed: {read_res.content}")

        raw_read_data = read_res.structured_content or {}
        read_data = raw_read_data.get("result", raw_read_data)
        retrieved_matrix = read_data.get("values", [])

        data_rows = retrieved_matrix[1:] if len(retrieved_matrix) > 1 else rows
        retrieved_headers = retrieved_matrix[0] if len(retrieved_matrix) > 0 else headers

        # 4. Perform Analytics & Insight Generation
        print("\n[SHEET AGENT] Step 4: Performing Data & Financial Analysis on retail sales...")
        insights_text, metrics = self.analyze_retail_sales(retrieved_headers, data_rows)

        # 5. Build CSV Export Content
        csv_buffer = io.StringIO()
        csv_writer = csv.writer(csv_buffer)
        csv_writer.writerow(retrieved_headers)
        csv_writer.writerows(data_rows)
        csv_content = csv_buffer.getvalue()

        # Observability & Tracing Output
        print("\n" + "-" * 80)
        print("          [SHEET AGENT] COMPUTED METRICS & EXECUTIVE INSIGHTS")
        print("-" * 80)
        print(f"Total Revenue:   INR {metrics['total_revenue']:,.2f}")
        print(f"Total Profit:    INR {metrics['total_profit']:,.2f} ({metrics['margin_pct']}% margin)")
        print(f"Top Category:    {metrics['top_category']} (INR {metrics['top_category_rev']:,.2f})")
        print(f"Top Branch:      {metrics['top_branch']} (INR {metrics['top_branch_rev']:,.2f})")
        print("\nSummarized Plain Text Insights:")
        print(insights_text)
        print("-" * 80)
        print(f"[SHEET AGENT] CSV Content ready for attachment ({len(csv_content)} bytes).")
        print("=" * 80 + "\n")

        return SheetResult(
            spreadsheet_id=spreadsheet_id,
            spreadsheet_url=spreadsheet_url,
            title=title,
            sheet_name=sheet_name,
            row_count=len(data_rows),
            headers=retrieved_headers,
            values=data_rows,
            csv_content=csv_content,
            insights=insights_text,
            summary_metrics=metrics
        )

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
    Extracts parameters from state/plan, invokes SheetAgent to read/populate and analyze
    the Google Sheet, and registers tool outcomes.
    """
    user_id = state.get("user_id", "usr_72b30e7cd49e49e5")
    account_email = state.get("account_email", "chillalyash2005@gmail.com")
    request = state.get("request", "").lower()
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

    # Route between retail sales analysis or standard sales creation
    is_retail_analysis = (
        "retail" in title.lower() or
        "retail" in request or
        "insight" in request or
        "analyse" in request or
        "analyze" in request
    )

    if is_retail_analysis:
        target_title = "retail_sales" if "retail" in title.lower() or "retail" in request else title
        sheet_result = await agent.read_or_populate_retail_sales_sheet(
            user_id=user_id,
            account_email=account_email,
            title=target_title,
            sheet_name=target_title
        )
    else:
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
    if sheet_result.insights:
        outcomes.append({
            "step_id": "sheets_read_values",
            "capability": "sheets.read",
            "status": "succeeded",
            "resource_id": sheet_result.spreadsheet_id,
            "data": {
                "insights": sheet_result.insights,
                "metrics": sheet_result.summary_metrics
            }
        })

    return {
        "sheet_result": sheet_result.model_dump(),
        "tool_outcomes": outcomes,
        "status": "drafting_email"
    }
