import os
import sys
import json
from typing import Dict, Any, Generator, Optional, List
from langchain_core.messages import SystemMessage, HumanMessage

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from agents.config import settings
from agents.model_factory import get_resilient_chat_model
from agents.state import WorkflowState
from agents.supervisior.schemas import SupervisorPlan, StepProposal, SufficiencyAssessment
from agents.supervisior.prompts import (
    SUFFICIENCY_SYSTEM_PROMPT,
    SUFFICIENCY_USER_PROMPT_TEMPLATE,
    SUPERVISOR_SYSTEM_PROMPT,
    PLANNER_USER_PROMPT_TEMPLATE
)
from agents.tools.registry import is_valid_capability


class SupervisorAgent:
    """
    Supervisor / Planning Agent.
    - Evaluates request sufficiency against business context.
    - Asks batch clarification questions if critical information is missing.
    - Constructs a validated, structured execution plan using ResilientChatModel (Gemini -> Groq -> Ollama).
    """

    def __init__(self, model_name: Optional[str] = None, temperature: float = 0.1):
        self.model_name = model_name
        self.temperature = temperature
        self.resilient_model = get_resilient_chat_model(temperature=self.temperature)

    def assess_sufficiency(
        self,
        request: str,
        business_context: Dict[str, Any]
    ) -> SufficiencyAssessment:
        """
        Evaluates whether user prompt has enough parameters for tool execution.
        If critical fields (e.g. recipient email or meeting duration) are missing,
        generates all necessary clarification questions in a single batch.
        """
        structured_llm = self.resilient_model.with_structured_output(SufficiencyAssessment)
        
        user_prompt = SUFFICIENCY_USER_PROMPT_TEMPLATE.format(
            request=request,
            business_name=business_context.get("business_name", "Axiomflow Business"),
            business_email=business_context.get("email", business_context.get("account_email", "sender@business.com")),
            website_url=business_context.get("website_url", "https://business.com"),
            account_email=business_context.get("account_email", "")
        )

        messages = [
            SystemMessage(content=SUFFICIENCY_SYSTEM_PROMPT),
            HumanMessage(content=user_prompt)
        ]

        assessment: SufficiencyAssessment = structured_llm.invoke(messages)

        # Real-time Terminal Observability & Tracing
        print("\n" + "=" * 80)
        print("          [SUPERVISOR AGENT] REQUEST SUFFICIENCY ASSESSMENT")
        print("=" * 80)
        print(f"Request: \"{request}\"")
        print(f"is_sufficient:   {assessment.is_sufficient}")
        print(f"missing_fields:  {assessment.missing_fields}")
        print(f"questions:       {assessment.questions}")
        if assessment.reasoning:
            print(f"reasoning:       {assessment.reasoning}")
        print("=" * 80 + "\n")

        return assessment

    def generate_plan(
        self,
        request: str,
        business_context: Dict[str, Any],
        clarification_answers: Optional[Dict[str, str]] = None
    ) -> SupervisorPlan:
        """
        Directly generates a structured plan using structured output mode.
        Incorporates user business context and any clarification answers provided by HITL.
        """
        structured_llm = self.resilient_model.with_structured_output(SupervisorPlan)

        clarification_summary = "None provided / request is self-contained."
        if clarification_answers:
            clarification_summary = "\n".join([f"- {k}: {v}" for k, v in clarification_answers.items()])

        messages = [
            SystemMessage(content=SUPERVISOR_SYSTEM_PROMPT),
            HumanMessage(content=PLANNER_USER_PROMPT_TEMPLATE.format(
                request=request,
                business_name=business_context.get("business_name", "AxiomFlow Client"),
                business_email=business_context.get("email", "sender@business.com"),
                website_url=business_context.get("website_url", ""),
                account_email=business_context.get("account_email", ""),
                clarification_summary=clarification_summary
            ))
        ]

        plan: SupervisorPlan = structured_llm.invoke(messages)
        self._validate_and_sanitize_plan(plan)

        # Real-time Terminal Observability & Tracing
        print("\n" + "=" * 80)
        print("          [SUPERVISOR AGENT] STRUCTURED EXECUTION PLAN GENERATED")
        print("=" * 80)
        print(f"Intent:              {plan.intent}")
        print(f"Goal:                {plan.goal}")
        print(f"Identified Services: {plan.identified_services}")
        print("-" * 80)
        print("Execution Steps:")
        for idx, step in enumerate(plan.steps, 1):
            print(f"  [{idx}] Step ID:     {step.id}")
            print(f"      Capability:  {step.capability}")
            print(f"      Description: {step.description}")
            print(f"      Parameters:  {json.dumps(step.parameters)}")
            print(f"      Depends On:  {step.depends_on}")
            print(f"      Approval:    {step.requires_approval} (Risk: {step.risk})")
        print("=" * 80 + "\n")

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
            if step.capability in ("gmail.send", "calendar.create_event", "sheets.create", "sheets.append", "sheets.update"):
                step.requires_approval = True
                step.risk = "external_side_effect"


def supervisor_planning_node(state: WorkflowState) -> Dict[str, Any]:
    """
    LangGraph node adapter for the Supervisor Planning agent.
    Receives WorkflowState, runs SupervisorAgent, and updates state with plan.
    """
    request = state.get("request", "")
    business_context = state.get("business_context", {})
    clarification_answers = state.get("clarification_answers")

    agent = SupervisorAgent()
    plan = agent.generate_plan(
        request=request,
        business_context=business_context,
        clarification_answers=clarification_answers
    )

    return {
        "plan": plan.model_dump(),
        "status": "planning"
    }
