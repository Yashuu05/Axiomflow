import os
import sys
import uuid
from typing import List, Optional, Dict, Any
from fastmcp import FastMCP

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from tools.client_factory import get_authorized_service

# Initialize FastMCP Server for Google Calendar Tools
calendar_mcp = FastMCP("CalendarToolsServer")


@calendar_mcp.tool()
def calendar_create_event(
    user_id: str,
    account_email: str,
    title: str,
    start_time: str,
    end_time: str,
    attendees: Optional[List[str]] = None,
    description: Optional[str] = None,
    location: Optional[str] = None,
    time_zone: str = "Asia/Kolkata",
    add_meet_link: bool = True,
    calendar_id: str = "primary"
) -> Dict[str, Any]:
    """
    Creates a Google Calendar event with optional Google Meet conference link and attendees.
    Official Google reference: https://developers.google.com/workspace/calendar/api/guides/create-events

    Args:
        user_id: AxiomFlow User ID
        account_email: User's connected Google account email
        title: Event title / summary
        start_time: Start time in ISO format (e.g. '2026-10-20T10:00:00')
        end_time: End time in ISO format (e.g. '2026-10-20T11:00:00')
        attendees: Optional list of attendee email addresses
        description: Optional event description or agenda
        location: Optional physical or virtual location
        time_zone: Timezone identifier (default 'Asia/Kolkata')
        add_meet_link: Whether to auto-generate a Google Meet video conference link (default True)
        calendar_id: Target calendar ID (default 'primary')

    Returns:
        Dict containing event ID, htmlLink, meetLink, and confirmed attendees
    """
    service = get_authorized_service(
        service_name="calendar",
        version="v3",
        user_id=user_id,
        account_email=account_email
    )

    event_body: Dict[str, Any] = {
        "summary": title,
        "description": description or "",
        "start": {
            "dateTime": start_time if "T" in start_time else f"{start_time}T00:00:00",
            "timeZone": time_zone
        },
        "end": {
            "dateTime": end_time if "T" in end_time else f"{end_time}T00:00:00",
            "timeZone": time_zone
        }
    }

    if location:
        event_body["location"] = location

    if attendees:
        valid_attendees = [email.strip() for email in attendees if isinstance(email, str) and "@" in email]
        if valid_attendees:
            event_body["attendees"] = [{"email": email} for email in valid_attendees]

    # Google Meet conference integration
    conference_version = 0
    if add_meet_link:
        conference_version = 1
        event_body["conferenceData"] = {
            "createRequest": {
                "requestId": str(uuid.uuid4()),
                "conferenceSolutionKey": {
                    "type": "hangoutsMeet"
                }
            }
        }

    created_event = service.events().insert(
        calendarId=calendar_id,
        body=event_body,
        conferenceDataVersion=conference_version,
        sendUpdates="all" if attendees else "none"
    ).execute()

    meet_link = None
    conference_data = created_event.get("conferenceData", {})
    entry_points = conference_data.get("entryPoints", [])
    for ep in entry_points:
        if ep.get("entryPointType") == "video":
            meet_link = ep.get("uri")
            break

    return {
        "status": "success",
        "operation": "calendar.create_event",
        "event_id": created_event.get("id"),
        "html_link": created_event.get("htmlLink"),
        "meet_link": meet_link,
        "summary": created_event.get("summary"),
        "start": created_event.get("start"),
        "end": created_event.get("end")
    }


@calendar_mcp.tool()
def calendar_list_events(
    user_id: str,
    account_email: str,
    time_min: str,
    time_max: Optional[str] = None,
    calendar_id: str = "primary",
    max_results: int = 20
) -> Dict[str, Any]:
    """
    Lists calendar events within a specified date-time interval.
    Official Google reference: https://developers.google.com/workspace/calendar/api/quickstart/python

    Args:
        user_id: AxiomFlow User ID
        account_email: User's connected Google account email
        time_min: Lower bound for an event's end time (ISO format)
        time_max: Upper bound for an event's start time (ISO format)
        calendar_id: Calendar ID (default 'primary')
        max_results: Maximum events to return (default 20)

    Returns:
        Dict containing list of calendar events with timing, title, and attendees
    """
    service = get_authorized_service(
        service_name="calendar",
        version="v3",
        user_id=user_id,
        account_email=account_email
    )

    params: Dict[str, Any] = {
        "calendarId": calendar_id,
        "timeMin": time_min if "Z" in time_min or "+" in time_min else f"{time_min}Z",
        "singleEvents": True,
        "orderBy": "startTime",
        "maxResults": max_results
    }
    if time_max:
        params["timeMax"] = time_max if "Z" in time_max or "+" in time_max else f"{time_max}Z"

    events_result = service.events().list(**params).execute()
    events = events_result.get("items", [])

    events_list = []
    for ev in events:
        events_list.append({
            "id": ev.get("id"),
            "summary": ev.get("summary", "(No Title)"),
            "start": ev.get("start", {}).get("dateTime") or ev.get("start", {}).get("date"),
            "end": ev.get("end", {}).get("dateTime") or ev.get("end", {}).get("date"),
            "html_link": ev.get("htmlLink"),
            "attendees": [a.get("email") for a in ev.get("attendees", []) if a.get("email")]
        })

    return {
        "status": "success",
        "operation": "calendar.list_events",
        "count": len(events_list),
        "events": events_list
    }


@calendar_mcp.tool()
def calendar_check_availability(
    user_id: str,
    account_email: str,
    target_date: str,
    start_time: str,
    duration_minutes: int = 60,
    time_zone: str = "Asia/Kolkata",
    calendar_id: str = "primary"
) -> Dict[str, Any]:
    """
    Checks if a requested date and time window has any conflicting calendar events.

    Args:
        user_id: AxiomFlow User ID
        account_email: User's connected Google account email
        target_date: Date string (YYYY-MM-DD)
        start_time: Time string (HH:MM in 24hr format)
        duration_minutes: Meeting duration in minutes (default 60)
        time_zone: Target timezone (default 'Asia/Kolkata')
        calendar_id: Calendar ID (default 'primary')

    Returns:
        Dict indicating whether the slot is free and listing any conflicting events
    """
    from datetime import datetime, timedelta

    start_dt = datetime.fromisoformat(f"{target_date}T{start_time}:00")
    end_dt = start_dt + timedelta(minutes=duration_minutes)

    time_min = start_dt.isoformat() + "+05:30"
    time_max = end_dt.isoformat() + "+05:30"

    events_resp = calendar_list_events(
        user_id=user_id,
        account_email=account_email,
        time_min=time_min,
        time_max=time_max,
        calendar_id=calendar_id
    )

    conflicts = events_resp.get("events", [])
    is_available = len(conflicts) == 0

    return {
        "status": "success",
        "operation": "calendar.check_availability",
        "target_date": target_date,
        "start_time": start_time,
        "duration_minutes": duration_minutes,
        "is_available": is_available,
        "conflicts": conflicts
    }


@calendar_mcp.tool()
def calendar_get_event(
    user_id: str,
    account_email: str,
    event_id: str,
    calendar_id: str = "primary"
) -> Dict[str, Any]:
    """
    Retrieves full details of a specific Google Calendar event by ID.

    Args:
        user_id: AxiomFlow User ID
        account_email: User's connected Google account email
        event_id: Google Calendar event ID
        calendar_id: Calendar ID (default 'primary')

    Returns:
        Dict containing event details
    """
    service = get_authorized_service(
        service_name="calendar",
        version="v3",
        user_id=user_id,
        account_email=account_email
    )

    event = service.events().get(calendarId=calendar_id, eventId=event_id).execute()
    return {
        "status": "success",
        "operation": "calendar.get_event",
        "event_id": event.get("id"),
        "summary": event.get("summary"),
        "description": event.get("description"),
        "start": event.get("start"),
        "end": event.get("end"),
        "html_link": event.get("htmlLink"),
        "status_code": event.get("status")
    }


@calendar_mcp.tool()
def calendar_update_event(
    user_id: str,
    account_email: str,
    event_id: str,
    title: Optional[str] = None,
    start_time: Optional[str] = None,
    end_time: Optional[str] = None,
    description: Optional[str] = None,
    location: Optional[str] = None,
    time_zone: str = "Asia/Kolkata",
    calendar_id: str = "primary"
) -> Dict[str, Any]:
    """
    Updates an existing Google Calendar event (e.g. changing start/end time, title, or description).
    Official Google reference: https://developers.google.com/workspace/calendar/api/v3/reference/events/patch

    Args:
        user_id: AxiomFlow User ID
        account_email: User's connected Google account email
        event_id: Google Calendar event ID to update
        title: Optional new event title
        start_time: Optional new start time in ISO format (e.g. '2026-10-20T16:00:00')
        end_time: Optional new end time in ISO format (e.g. '2026-10-20T17:00:00')
        description: Optional new description
        location: Optional new location
        time_zone: Timezone identifier (default 'Asia/Kolkata')
        calendar_id: Target calendar ID (default 'primary')

    Returns:
        Dict containing updated event summary, timing, and html link
    """
    service = get_authorized_service(
        service_name="calendar",
        version="v3",
        user_id=user_id,
        account_email=account_email
    )

    patch_body: Dict[str, Any] = {}
    if title is not None:
        patch_body["summary"] = title
    if description is not None:
        patch_body["description"] = description
    if location is not None:
        patch_body["location"] = location

    if start_time is not None:
        patch_body["start"] = {
            "dateTime": start_time if "T" in start_time else f"{start_time}T00:00:00",
            "timeZone": time_zone
        }
    if end_time is not None:
        patch_body["end"] = {
            "dateTime": end_time if "T" in end_time else f"{end_time}T00:00:00",
            "timeZone": time_zone
        }

    updated_event = service.events().patch(
        calendarId=calendar_id,
        eventId=event_id,
        body=patch_body
    ).execute()

    return {
        "status": "success",
        "operation": "calendar.update_event",
        "event_id": updated_event.get("id"),
        "summary": updated_event.get("summary"),
        "start": updated_event.get("start"),
        "end": updated_event.get("end"),
        "html_link": updated_event.get("htmlLink")
    }


@calendar_mcp.tool()
def calendar_delete_event(
    user_id: str,
    account_email: str,
    event_id: str,
    calendar_id: str = "primary"
) -> Dict[str, Any]:
    """
    Deletes an event from Google Calendar by ID.
    Official Google reference: https://developers.google.com/workspace/calendar/api/v3/reference/events/delete

    Args:
        user_id: AxiomFlow User ID
        account_email: User's connected Google account email
        event_id: Google Calendar event ID to delete
        calendar_id: Target calendar ID (default 'primary')

    Returns:
        Dict confirming deletion status
    """
    service = get_authorized_service(
        service_name="calendar",
        version="v3",
        user_id=user_id,
        account_email=account_email
    )

    service.events().delete(
        calendarId=calendar_id,
        eventId=event_id
    ).execute()

    return {
        "status": "success",
        "operation": "calendar.delete_event",
        "event_id": event_id,
        "deleted": True
    }
