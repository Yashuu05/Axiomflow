import os
import sys
import json
import time
import asyncio
from dotenv import load_dotenv

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

load_dotenv()

from tools.calendar_tools import (
    calendar_mcp,
    calendar_list_events,
    calendar_update_event,
    calendar_delete_event,
    calendar_get_event
)


async def run_calendar_read_update_delete_flow():
    """
    Performs the following calendar operations in sequence via FastMCP on chillalyash2005@gmail.com:
    1. Read event on 20th October 2026 and print in terminal.
    2. Update event on 20th October 2026 by changing timing to 4:00 p.m. (16:00 to 17:00 IST).
    3. Delete the event on 20th October 2026 after a time interval of 10 seconds.
    """
    user_id = "usr_72b30e7cd49e49e5"
    account_email = "chillalyash2005@gmail.com"

    print("=" * 80)
    print("CALENDAR LIFECYCLE TEST: READ -> UPDATE -> WAIT 10s -> DELETE VIA FASTMCP")
    print(f"Target Account: {account_email}")
    print("=" * 80)

    # -------------------------------------------------------------------------
    # STEP 1: READ EVENT ON 20TH OCTOBER 2026
    # -------------------------------------------------------------------------
    print("\n[STEP 1] Reading events on 20th October 2026 via FastMCP tool 'calendar_list_events'...")
    read_args = {
        "user_id": user_id,
        "account_email": account_email,
        "time_min": "2026-10-20T00:00:00+05:30",
        "time_max": "2026-10-20T23:59:59+05:30"
    }

    read_res = await calendar_mcp.call_tool("calendar_list_events", read_args)
    assert not read_res.is_error, "Failed to read calendar events"
    read_data = read_res.structured_content or {}
    events = read_data.get("events", [])

    print(f"Total events found on 20th October 2026: {len(events)}")
    for idx, ev in enumerate(events, 1):
        print(f"  Event #{idx}:")
        print(f"    ID:        {ev.get('id')}")
        print(f"    Summary:   {ev.get('summary')}")
        print(f"    Start:     {ev.get('start')}")
        print(f"    End:       {ev.get('end')}")
        print(f"    Link:      {ev.get('html_link')}")

    # Find the target event matching our meeting
    target_event = None
    for ev in events:
        if "growth strategies" in ev.get("summary", "").lower() or "founder" in ev.get("summary", "").lower():
            target_event = ev
            break

    if not target_event and events:
        target_event = events[0]

    assert target_event is not None, "No target meeting event found on 20th October 2026 to update"
    target_event_id = target_event["id"]
    print(f"\nTarget event selected for update/delete: ID = {target_event_id}")

    # -------------------------------------------------------------------------
    # STEP 2: UPDATE EVENT TIMING TO 4:00 PM (16:00 to 17:00 IST)
    # -------------------------------------------------------------------------
    new_start_time = "2026-10-20T16:00:00"
    new_end_time = "2026-10-20T17:00:00"
    print("\n" + "-" * 80)
    print(f"[STEP 2] Updating event timing to 4:00 PM IST ({new_start_time} to {new_end_time})...")
    print("Invoking FastMCP tool 'calendar_update_event'...")

    update_args = {
        "user_id": user_id,
        "account_email": account_email,
        "event_id": target_event_id,
        "start_time": new_start_time,
        "end_time": new_end_time,
        "time_zone": "Asia/Kolkata"
    }

    update_res = await calendar_mcp.call_tool("calendar_update_event", update_args)
    assert not update_res.is_error, "Failed to update calendar event"
    update_data = update_res.structured_content or {}

    print("\n[UPDATE SUCCESSFUL] Event timing updated:")
    print(f"  Event ID:      {update_data.get('event_id')}")
    print(f"  Summary:       {update_data.get('summary')}")
    print(f"  Updated Start: {update_data.get('start')}")
    print(f"  Updated End:   {update_data.get('end')}")
    print(f"  Calendar Link: {update_data.get('html_link')}")

    # -------------------------------------------------------------------------
    # STEP 3: WAIT 10 SECONDS FOR USER VERIFICATION
    # -------------------------------------------------------------------------
    print("\n" + "-" * 80)
    print("[STEP 3] Waiting 10 seconds before deletion for manual verification on your calendar...")
    for remaining in range(10, 0, -1):
        print(f"  Deleting in {remaining} seconds...", end="\r", flush=True)
        await asyncio.sleep(1)
    print("\n  Time interval of 10 seconds elapsed.")

    # -------------------------------------------------------------------------
    # STEP 4: DELETE THE EVENT
    # -------------------------------------------------------------------------
    print("\n" + "-" * 80)
    print(f"[STEP 4] Deleting event ID {target_event_id} via FastMCP tool 'calendar_delete_event'...")
    delete_args = {
        "user_id": user_id,
        "account_email": account_email,
        "event_id": target_event_id
    }

    delete_res = await calendar_mcp.call_tool("calendar_delete_event", delete_args)
    assert not delete_res.is_error, "Failed to delete calendar event"
    delete_data = delete_res.structured_content or {}

    print("\n[DELETE SUCCESSFUL] Event deleted from Google Calendar:")
    print(f"  Event ID: {delete_data.get('event_id')}")
    print(f"  Deleted:  {delete_data.get('deleted')}")

    # Final read verification to confirm event is gone
    verify_res = await calendar_mcp.call_tool("calendar_list_events", read_args)
    remaining_events = (verify_res.structured_content or {}).get("events", [])
    remaining_ids = [e.get("id") for e in remaining_events]
    assert target_event_id not in remaining_ids, "Event still present after deletion"

    print(f"\nFinal verification: Event {target_event_id} is no longer on calendar.")
    print("=" * 80)
    print("ALL CALENDAR OPERATIONS (READ -> UPDATE -> WAIT 10s -> DELETE) COMPLETED SUCCESSFULLY!")
    print("=" * 80)


if __name__ == "__main__":
    asyncio.run(run_calendar_read_update_delete_flow())
