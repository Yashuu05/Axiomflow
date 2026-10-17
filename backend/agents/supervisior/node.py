import json
from typing import Dict, Any, Generator, Optional
from langchain_core.messages import SystemMessage, HumanMessage

from agents.config import settings
from agents.model_factory import get_chat_model
from agents.state import WorkflowState
from agents.supervisior.schemas import SupervisorPlan
from agents.supervisior.prompts import SUPERVISOR_SYSTEM_PROMPT, PLANNER_USER_PROMPT_TEMPLATE
from agents.tools.registry import is_valid_capability

class SupervisorAgent:
    """
    Supervisor / Planning Agent.
    Interprets user requests in natural language, streams reasoning chunks,
    and constructs a validated, structured execution plan using gemini-3.8-flash.
    """

    def __init__(self, model_name: str = "gemini-3.8-flash", temperature: float = 0.1):
        self.model_name = model_name
        self.temperature = temperature
        self.llm = get_chat_model(
            provider="gemini",
            model_name=self.model_name,
            temperature=self.temperature
        )

    def generate_plan(self, request: str, user_id: str = "default_user", account_email: str = "") -> SupervisorPlan:
        """
        Directly generates a structured plan using structured output mode.
        Validates produced capabilities against server registry.
        """
        structured_llm = self.llm.with_structured_output(SupervisorPlan)
        messages = [
            SystemMessage(content=SUPERVISOR_SYSTEM_PROMPT),
            HumanMessage(content="User Business Request:\n\"Schedule a client sync on Friday at 3 PM and notify the sales team via email\"\n\nTenant / Context:\n- User ID: usr_example\n- Account Email: user@example.com\n\nAnalyze this request and generate the structured execution plan following the schema."),
            SystemMessage(content=(
                '{"intent": "Schedule a meeting and email the sales team", "goal": "Create client sync event on calendar and send announcement email", "identified_services": ["calendar", "content", "gmail"], "steps": ['
                '{"id": "step_1", "capability": "calendar.create_event", "description": "Create client sync calendar event for Friday 3 PM", "parameters": {"title": "Client Sync", "start_time": "Friday 15:00"}, "depends_on": [], "risk": "external_side_effect", "requires_approval": true},'
                '{"id": "step_2", "capability": "content.draft_email", "description": "Draft client sync notification email to sales team", "parameters": {"subject": "Client Sync Meeting", "recipient": "sales team"}, "depends_on": ["step_1"], "risk": "no_external_side_effect", "requires_approval": false},'
                '{"id": "step_3", "capability": "gmail.send", "description": "Send drafted client sync notification email to sales team", "parameters": {"to": "sales-team@example.com"}, "depends_on": ["step_1", "step_2"], "risk": "external_side_effect", "requires_approval": true}'
                '], "clarification_needed": null, "reasoning": "Calendar event must be scheduled first, then email drafted with details, and sent after user approval."}'
            )),
            HumanMessage(content=PLANNER_USER_PROMPT_TEMPLATE.format(
                request=request,
                user_id=user_id,
                account_email=account_email
            ))
        ]

        plan: SupervisorPlan = structured_llm.invoke(messages)
        self._validate_and_sanitize_plan(plan)
        return plan

    def stream_plan_chunks(
        self,
        request: str,
        user_id: str = "default_user",
        account_email: str = ""
    ) -> Generator[str, None, SupervisorPlan]:
        """
        Streams natural language reasoning tokens in real-time as chunks,
        then produces and validates the final structured plan.
        Yields chunk text to caller, returns final SupervisorPlan.
        """
        prompt = (
            f"{SUPERVISOR_SYSTEM_PROMPT}\n\n"
            f"IMPORTANT: First provide a brief 1-2 sentence chain-of-thought analysis of the user request. "
            f"Then output the execution plan JSON.\n\n"
            f"User Request: \"{request}\""
        )

        messages = [
            SystemMessage(content=SUPERVISOR_SYSTEM_PROMPT),
            HumanMessage(content=PLANNER_USER_PROMPT_TEMPLATE.format(
                request=request,
                user_id=user_id,
                account_email=account_email
            ))
        ]

        # 1. Stream thinking / reasoning chunks from gemini-3.8-flash while accumulating
        accumulated_text = ""
        for chunk in self.llm.stream(messages):
            if chunk.content:
                text_content = ""
                if isinstance(chunk.content, list):
                    for part in chunk.content:
                        if isinstance(part, dict) and "text" in part:
                            text_content += part["text"]
                        elif isinstance(part, str):
                            text_content += part
                elif isinstance(chunk.content, str):
                    text_content = chunk.content

                if text_content:
                    accumulated_text += text_content
                    yield text_content

        # 2. Extract and parse structured plan directly from accumulated stream to conserve quota
        plan = None
        try:
            # Check for JSON block in markdown
            raw = accumulated_text.strip()
            if "```json" in raw:
                json_part = raw.split("```json")[1].split("```")[0].strip()
            elif "```" in raw:
                json_part = raw.split("```")[1].split("```")[0].strip()
            elif raw.startswith("{") and raw.endswith("}"):
                json_part = raw
            else:
                json_part = ""

            if json_part:
                data = json.loads(json_part)
                # Map alternate field names if model returned them
                if "plan" in data and "steps" not in data:
                    data["steps"] = data["plan"]
                elif "execution_plan" in data and "steps" not in data:
                    data["steps"] = data["execution_plan"]

                # Ensure standard fields
                if "intent" not in data:
                    data["intent"] = data.get("summary") or data.get("request_summary") or data.get("intent_summary") or request
                if "goal" not in data:
                    data["goal"] = data.get("summary") or data.get("request_summary") or request

                # Normalize steps list
                normalized_steps = []
                for s in data.get("steps", []):
                    step_id = s.get("id") or s.get("step_id") or f"step_{len(normalized_steps)+1}"
                    cap = s.get("capability", "gmail.send")
                    desc = s.get("description", "")
                    params = s.get("parameters", {})
                    deps = s.get("depends_on") or s.get("dependencies") or []
                    risk = s.get("risk", "read_only")
                    appr = s.get("requires_approval", False)
                    normalized_steps.append({
                        "id": step_id,
                        "capability": cap,
                        "description": desc,
                        "parameters": params,
                        "depends_on": deps,
                        "risk": risk,
                        "requires_approval": appr
                    })
                data["steps"] = normalized_steps

                plan = SupervisorPlan(**data)
                self._validate_and_sanitize_plan(plan)
        except Exception:
            # Fallback if streaming output could not be directly parsed
            plan = None

        if plan is None:
            plan = self.generate_plan(request, user_id=user_id, account_email=account_email)

        return plan

    def _validate_and_sanitize_plan(self, plan: SupervisorPlan) -> None:
        """
        Enforces server-side security checks:
        1. All capability names must exist in the capability registry.
        2. Any external write capability must mandate approval.
        """
        for step in plan.steps:
            if not is_valid_capability(step.capability):
                raise ValueError(
                    f"Security violation: Planner proposed unauthorized capability '{step.capability}'. "
                    f"This capability is not in the server registry."
                )
            if step.capability in ("gmail.send", "calendar.create_event", "sheets.append", "sheets.update"):
                step.requires_approval = True
                step.risk = "external_side_effect"

def supervisor_planning_node(state: WorkflowState) -> Dict[str, Any]:
    """
    LangGraph node adapter for the Supervisor Planning agent.
    Receives WorkflowState, runs SupervisorAgent, and updates state with plan.
    """
    request = state.get("request", "")
    user_id = state.get("user_id", "default_user")
    account_email = state.get("account_email", "")

    agent = SupervisorAgent()
    plan = agent.generate_plan(request=request, user_id=user_id, account_email=account_email)

    return {
        "plan": plan.model_dump(),
        "status": "running"
    }
