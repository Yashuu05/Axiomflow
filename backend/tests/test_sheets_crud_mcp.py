import os
import sys
import json
import asyncio
from dotenv import load_dotenv

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

load_dotenv()

from tools.sheet_tools import (
    sheets_mcp,
    sheets_create_spreadsheet,
    sheets_append_values,
    sheets_read_values,
    sheets_clear_values
)


async def run_sheets_crud_flow():
    """
    Executes the following operations in sequence with 5-second intervals via FastMCP:
    1. Write operation: Create 'Test_Axiomflow' sheet and write employee salary table with 3 records.
    2. Update operation: Append 3 more employee records to 'Test_Axiomflow'.
    3. Read operation: Read all rows from 'Test_Axiomflow' and print neatly in terminal.
    4. Delete operation: Clear all table data/content from 'Test_Axiomflow'.
    """
    user_id = "usr_72b30e7cd49e49e5"
    account_email = "chillalyash2005@gmail.com"
    doc_title = "Test_Axiomflow"

    print("=" * 80)
    print("GOOGLE SHEETS CRUD OPERATIONS TEST VIA FASTMCP")
    print(f"Target Account:  {account_email}")
    print(f"Spreadsheet:     {doc_title}")
    print("=" * 80)

    # -------------------------------------------------------------------------
    # STEP 1: CREATE SPREADSHEET & WRITE INITIAL TABLE (HEADER + 3 RECORDS)
    # -------------------------------------------------------------------------
    print("\n[STEP 1: WRITE] Creating spreadsheet 'Test_Axiomflow' via FastMCP 'sheets_create_spreadsheet'...")
    create_args = {
        "user_id": user_id,
        "account_email": account_email,
        "title": doc_title,
        "sheet_name": "EmployeeSalaries"
    }

    create_res = await sheets_mcp.call_tool("sheets_create_spreadsheet", create_args)
    assert not create_res.is_error, "Failed to create spreadsheet"
    create_data = create_res.structured_content or {}
    spreadsheet_id = create_data.get("spreadsheet_id")
    spreadsheet_url = create_data.get("spreadsheet_url")

    print("[CREATE SUCCESSFUL]")
    print(f"  Spreadsheet ID:  {spreadsheet_id}")
    print(f"  Spreadsheet URL: {spreadsheet_url}")

    initial_table = [
        ["Employee ID", "Full Name", "Department", "Role", "Monthly Salary (INR)"],
        ["EMP-101", "Aarav Sharma", "Engineering", "Backend Developer", "120,000"],
        ["EMP-102", "Priya Nair", "Product", "Product Manager", "145,000"],
        ["EMP-103", "Rohan Mehta", "Finance", "Financial Analyst", "95,000"]
    ]

    print("\nWriting initial employee salary table (3 records + headers) via 'sheets_append_values'...")
    append_args_1 = {
        "user_id": user_id,
        "account_email": account_email,
        "spreadsheet_id": spreadsheet_id,
        "range_name": "EmployeeSalaries!A1",
        "values": initial_table
    }

    write_res = await sheets_mcp.call_tool("sheets_append_values", append_args_1)
    assert not write_res.is_error, "Failed to write initial records"
    write_data = write_res.structured_content or {}
    print(f"[WRITE SUCCESSFUL] Updated Range: {write_data.get('updated_range')}, Rows: {write_data.get('updated_rows')}")

    # Interval of 5 seconds
    print("\n>>> Waiting 5 seconds before next operation...")
    for remaining in range(5, 0, -1):
        print(f"  Proceeding in {remaining}s...", end="\r", flush=True)
        await asyncio.sleep(1)
    print("\n  5-second interval elapsed.")

    # -------------------------------------------------------------------------
    # STEP 2: UPDATE (APPEND 3 MORE RECORDS)
    # -------------------------------------------------------------------------
    print("\n" + "-" * 80)
    print("[STEP 2: UPDATE] Appending 3 more employee records to 'Test_Axiomflow' via 'sheets_append_values'...")
    additional_records = [
        ["EMP-104", "Sneha Kulkarni", "Design", "UI/UX Designer", "110,000"],
        ["EMP-105", "Vikram Sen", "Operations", "Operations Lead", "130,000"],
        ["EMP-106", "Ananya Verma", "Engineering", "AI Engineer", "160,000"]
    ]

    append_args_2 = {
        "user_id": user_id,
        "account_email": account_email,
        "spreadsheet_id": spreadsheet_id,
        "range_name": "EmployeeSalaries!A1",
        "values": additional_records
    }

    update_res = await sheets_mcp.call_tool("sheets_append_values", append_args_2)
    assert not update_res.is_error, "Failed to append additional records"
    update_data = update_res.structured_content or {}
    print("[UPDATE SUCCESSFUL]")
    print(f"  Appended Range: {update_data.get('updated_range')}")
    print(f"  Rows Added:     {update_data.get('updated_rows')}")

    # Interval of 5 seconds
    print("\n>>> Waiting 5 seconds before next operation...")
    for remaining in range(5, 0, -1):
        print(f"  Proceeding in {remaining}s...", end="\r", flush=True)
        await asyncio.sleep(1)
    print("\n  5-second interval elapsed.")

    # -------------------------------------------------------------------------
    # STEP 3: READ OPERATION
    # -------------------------------------------------------------------------
    print("\n" + "-" * 80)
    print("[STEP 3: READ] Reading all contents from 'Test_Axiomflow' via 'sheets_read_values'...")
    read_args = {
        "user_id": user_id,
        "account_email": account_email,
        "spreadsheet_id": spreadsheet_id,
        "range_name": "EmployeeSalaries!A1:E20"
    }

    read_res = await sheets_mcp.call_tool("sheets_read_values", read_args)
    assert not read_res.is_error, "Failed to read spreadsheet"
    read_data = read_res.structured_content or {}
    rows = read_data.get("values", [])

    print(f"\n[READ SUCCESSFUL] Total Rows Retrieved: {len(rows)}\n")
    print(f"{'#':<4} | {'Employee ID':<12} | {'Full Name':<16} | {'Department':<14} | {'Role':<20} | {'Monthly Salary'}")
    print("-" * 95)
    for idx, row in enumerate(rows):
        if idx == 0:
            continue  # Header row printed separately
        emp_id = row[0] if len(row) > 0 else ""
        name = row[1] if len(row) > 1 else ""
        dept = row[2] if len(row) > 2 else ""
        role = row[3] if len(row) > 3 else ""
        salary = row[4] if len(row) > 4 else ""
        print(f"{idx:<4} | {emp_id:<12} | {name:<16} | {dept:<14} | {role:<20} | {salary}")

    # Interval of 5 seconds
    print("\n>>> Waiting 5 seconds before next operation...")
    for remaining in range(5, 0, -1):
        print(f"  Proceeding in {remaining}s...", end="\r", flush=True)
        await asyncio.sleep(1)
    print("\n  5-second interval elapsed.")

    # -------------------------------------------------------------------------
    # STEP 4: DELETE (CLEAR CONTENT)
    # -------------------------------------------------------------------------
    print("\n" + "-" * 80)
    print("[STEP 4: DELETE] Clearing all content from 'Test_Axiomflow' via 'sheets_clear_values'...")
    clear_args = {
        "user_id": user_id,
        "account_email": account_email,
        "spreadsheet_id": spreadsheet_id,
        "range_name": "EmployeeSalaries!A1:E50"
    }

    clear_res = await sheets_mcp.call_tool("sheets_clear_values", clear_args)
    assert not clear_res.is_error, "Failed to clear spreadsheet values"
    clear_data = clear_res.structured_content or {}

    print("[DELETE SUCCESSFUL]")
    print(f"  Cleared Range:   {clear_data.get('cleared_range')}")
    print(f"  Spreadsheet ID:  {clear_data.get('spreadsheet_id')}")

    # Verify that content is deleted
    verify_res = await sheets_mcp.call_tool("sheets_read_values", read_args)
    remaining_rows = (verify_res.structured_content or {}).get("values", [])
    print(f"\nFinal verification: Rows remaining in sheet: {len(remaining_rows)}")
    assert len(remaining_rows) == 0, "Sheet was not cleared successfully"

    print("=" * 80)
    print("ALL GOOGLE SHEETS CRUD OPERATIONS COMPLETED SUCCESSFULLY IN SEQUENCE!")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(run_sheets_crud_flow())
