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

from tools.calendar_tools import calendar_mcp


async def test_create_calendar_event_via_fastmcp():
    """
    Test write operation (creating an event) on Google Calendar via FastMCP for chillalyash2005@gmail.com.
    Scenario:
    - Founder and co-founders meeting on 20th October 2026 at 6:00 p.m. IST (18:00 to 19:00).
    - Topic: Discussion on Business Growth Strategies.
    - Generates Google Meet link and returns event details.
    """
    user_id = "usr_72b30e7cd49e49e5"
    account_email = "chillalyash2005@gmail.com"

    title = "Founder & Co-founders Sync: Business Growth Strategies"
    start_time = "2026-10-20T18:00:00"
    end_time = "2026-10-20T19:00:00"
    description = (
        "Agenda:\n"
        "1. Q4 revenue projections and key growth targets\n"
        "2. Product automation workflow milestones\n"
        "3. Enterprise go-to-market execution"
    )
    time_zone = "Asia/Kolkata"

    print("=" * 80)
    print("TESTING GOOGLE CALENDAR WRITE OPERATION (CREATE EVENT) VIA FASTMCP")
    print("=" * 80)
    print(f"Calendar Account: {account_email}")
    print(f"Event Title:      {title}")
    print(f"Start Time:       {start_time} ({time_zone})")
    print(f"End Time:         {end_time} ({time_zone})")
    print(f"Description:\n{description}")
    print("-" * 80)
    print("Invoking 'calendar_create_event' tool through FastMCP...")

    tool_args = {
        "user_id": user_id,
        "account_email": account_email,
        "title": title,
        "start_time": start_time,
        "end_time": end_time,
        "description": description,
        "time_zone": time_zone,
        "add_meet_link": True
    }

    try:
        mcp_result = await calendar_mcp.call_tool("calendar_create_event", tool_args)

        print("\n[FastMCP Response Received]:")
        print(f"is_error: {mcp_result.is_error}")
        print(f"structured_content: {json.dumps(mcp_result.structured_content, indent=2)}")

        assert not mcp_result.is_error, "FastMCP tool reported an error during event creation"

        data = mcp_result.structured_content or {}
        payload = data.get("result", data)

        print("\n[SUCCESS] Google Calendar event created successfully via FastMCP!")
        print(f"Event ID:    {payload.get('event_id')}")
        print(f"Summary:     {payload.get('summary')}")
        print(f"Meet Link:   {payload.get('meet_link')}")
        print(f"Calendar URL:{payload.get('html_link')}")
        print("=" * 80)
        return payload

    except Exception as e:
        print(f"\n[ERROR] Failed to execute calendar_create_event via FastMCP: {str(e)}")
        raise


if __name__ == "__main__":
    asyncio.run(test_create_calendar_event_via_fastmcp())
