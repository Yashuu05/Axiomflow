import os
import sys
import json
import asyncio
from datetime import datetime, timedelta
from zoneinfo import ZoneInfo
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from langchain_core.messages import SystemMessage, HumanMessage

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from agents.config import settings
from agents.model_factory import get_resilient_chat_model
from agents.state import CalendarEventResult, WorkflowState
from tools.calendar_tools import calendar_mcp


class CalendarEventSpec(BaseModel):
    """Normalized calendar event parameters interpreted by Calendar Agent."""
    title: str = Field(..., description="Clear event summary or title")
    start_time_iso: str = Field(..., description="Start time in ISO format (e.g. '2026-10-26T16:00:00+05:30')")
    end_time_iso: str = Field(..., description="End time in ISO format (e.g. '2026-10-26T17:00:00+05:30')")
    attendees: List[str] = Field(default_factory=list, description="List of attendee email addresses")
    description: Optional[str] = Field(default=None, description="Event agenda or meeting overview")
    location: Optional[str] = Field(default=None, description="Location string or virtual meeting note")
    add_meet_link: bool = Field(default=True, description="Whether to generate Google Meet link")


CALENDAR_AGENT_SYSTEM_PROMPT = """You are the Google Calendar Specialist Agent for AxiomFlow.
Your objective is to interpret scheduling intent from the user request, plan parameters, and clarification answers,
and normalize them into precise ISO 8601 timestamps anchored strictly to the 'Asia/Kolkata' timezone (+05:30).

RULES:
1. Temporal Anchor:
   - Current Date and Time: {current_time}
   - Timezone: Asia/Kolkata (+05:30)
   - Evaluate all dates ('today', 'tomorrow', '26th Oct', etc.) relative to this current time.
2. Duration:
   - If duration is specified (e.g., '1 hour', '45 mins'), compute end_time_iso accordingly.
   - If duration is not specified, default to 60 minutes.
3. Conference:
   - Unless user explicitly specifies an in-person physical location, set add_meet_link = True.
4. Attendees:
   - Extract all recipient or participant emails mentioned in request or clarification answers.
"""


class CalendarAgent:
    """
    Calendar Specialist Agent.
    Interprets scheduling constraints and executes FastMCP calendar tools.
    """

    def __init__(self, timezone_str: str = "Asia/Kolkata", temperature: float = 0.1):
        self.timezone_str = timezone_str
        self.timezone = ZoneInfo(timezone_str)
        self.temperature = temperature
        self.resilient_model = get_resilient_chat_model(temperature=self.temperature)

    def get_current_time_str(self) -> str:
        now = datetime.now(self.timezone)
        return now.strftime("%A, %Y-%m-%d %I:%M:%S %p %Z")

    def interpret_event_parameters(
        self,
        request: str,
        plan_parameters: Optional[Dict[str, Any]] = None,
        clarification_answers: Optional[Dict[str, str]] = None
    ) -> CalendarEventSpec:
        """
        Uses LLM with structured output to parse natural language timing into
        validated ISO 8601 strings and attendees.
        """
        current_time_str = self.get_current_time_str()
        system_prompt = CALENDAR_AGENT_SYSTEM_PROMPT.format(current_time=current_time_str)

        user_content = (
            f"User Request: \"{request}\"\n\n"
            f"Plan Step Parameters: {json.dumps(plan_parameters or {}, indent=2)}\n\n"
            f"User Clarifications: {json.dumps(clarification_answers or {}, indent=2)}\n\n"
            f"Extract and normalize calendar parameters into CalendarEventSpec."
        )

        structured_llm = self.resilient_model.with_structured_output(CalendarEventSpec)
        spec: CalendarEventSpec = structured_llm.invoke([
            SystemMessage(content=system_prompt),
            HumanMessage(content=user_content)
        ])
        return spec

    async def schedule_event_via_mcp(
        self,
        user_id: str,
        account_email: str,
        spec: CalendarEventSpec
    ) -> CalendarEventResult:
        """
        Calls FastMCP calendar_create_event tool to create the calendar event with Google Meet link.
        """
        tool_args = {
            "user_id": user_id,
            "account_email": account_email,
            "title": spec.title,
            "start_time": spec.start_time_iso,
            "end_time": spec.end_time_iso,
            "attendees": spec.attendees,
            "description": spec.description or f"Scheduled via AxiomFlow: {spec.title}",
            "location": spec.location,
            "time_zone": self.timezone_str,
            "add_meet_link": spec.add_meet_link,
            "calendar_id": "primary"
        }

        mcp_result = await calendar_mcp.call_tool("calendar_create_event", tool_args)
        if mcp_result.is_error:
            raise RuntimeError(f"FastMCP calendar_create_event failed: {mcp_result.content}")

        raw_data = mcp_result.structured_content or {}
        payload = raw_data.get("result", raw_data)

        return CalendarEventResult(
            event_id=payload.get("event_id", payload.get("id", "unknown_event")),
            summary=spec.title,
            start_time=spec.start_time_iso,
            end_time=spec.end_time_iso,
            html_link=payload.get("htmlLink") or payload.get("html_link"),
            meet_link=payload.get("meetLink") or payload.get("meet_link"),
            attendees=spec.attendees
        )


async def calendar_agent_execution_node(state: WorkflowState) -> Dict[str, Any]:
    """
    LangGraph node adapter for the Calendar Agent.
    Interprets parameters, invokes FastMCP calendar_create_event, and stores CalendarEventResult.
    """
    user_id = state.get("user_id", "default_user")
    account_email = state.get("account_email", "")
    request = state.get("request", "")
    plan = state.get("plan", {})
    clarification_answers = state.get("clarification_answers")

    # Find calendar step parameters in plan if available
    calendar_params = {}
    if plan and "steps" in plan:
        for s in plan["steps"]:
            if "calendar" in s.get("capability", ""):
                calendar_params = s.get("parameters", {})
                break

    agent = CalendarAgent()
    spec = agent.interpret_event_parameters(
        request=request,
        plan_parameters=calendar_params,
        clarification_answers=clarification_answers
    )

    calendar_result = await agent.schedule_event_via_mcp(
        user_id=user_id,
        account_email=account_email,
        spec=spec
    )

    outcomes = list(state.get("tool_outcomes", []))
    outcomes.append({
        "step_id": "calendar_create_event",
        "capability": "calendar.create_event",
        "status": "succeeded",
        "resource_id": calendar_result.event_id,
        "data": calendar_result.model_dump()
    })

    return {
        "calendar_event": calendar_result.model_dump(),
        "tool_outcomes": outcomes,
        "status": "drafting_email"
    }
