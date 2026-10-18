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


from agents.policies_ethics import PolicyEthicsGuardrail, PolicyCheckResult


class SupervisorAgent:
    """
    Supervisor / Planning Agent.
    - Evaluates incoming queries against AxiomFlow Policies & Ethics guardrails.
    - Evaluates request sufficiency against business context.
    - Asks batch clarification questions if critical information is missing.
    - Constructs a validated, structured execution plan using ResilientChatModel (Gemini -> Groq -> Ollama).
    """

    def __init__(self, model_name: Optional[str] = None, temperature: float = 0.1):
        self.model_name = model_name
        self.temperature = temperature
        self.resilient_model = get_resilient_chat_model(temperature=self.temperature)
        self.guardrail = PolicyEthicsGuardrail(temperature=0.0)

    def evaluate_policy(
        self,
        request: str,
        business_context: Optional[Dict[str, Any]] = None
    ) -> PolicyCheckResult:
        """Evaluates user request against safety, ethics, and capability boundaries."""
        return self.guardrail.evaluate_request(request, business_context)

    def assess_sufficiency(
        self,
        request: str,
        business_context: Dict[str, Any]
    ) -> SufficiencyAssessment:
        """
        Evaluates whether user prompt complies with policy and has enough parameters for tool execution.
        If critical fields are missing, generates all necessary clarification questions in a single batch.
        """
        # Step 0: Policy and Ethics Guardrail Gate
        policy_result = self.evaluate_policy(request, business_context)
        if not policy_result.is_allowed:
            return SufficiencyAssessment(
                is_sufficient=False,
                missing_fields=[],
                questions=[],
                reasoning=f"Policy violation: {policy_result.violation_reason}",
                policy_check=policy_result
            )

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
        assessment.policy_check = policy_result

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
        # Step 0: Policy Guardrail Gate
        policy_result = self.evaluate_policy(request, business_context)
        if not policy_result.is_allowed:
            return SupervisorPlan(
                intent="Blocked - Policy/Ethics Violation",
                goal="Execution terminated by safety guardrails",
                identified_services=[],
                steps=[],
                policy_check=policy_result,
                is_policy_rejected=True,
                refusal_message=policy_result.refusal_message,
                reasoning=policy_result.violation_reason
            )

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
        plan.policy_check = policy_result

        # Ensure steps are populated if model returned an empty list for multi-task
        if not plan.is_policy_rejected and len(plan.steps) == 0:
            self._synthesize_fallback_steps(plan, request)

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

    def _synthesize_fallback_steps(self, plan: SupervisorPlan, request: str) -> None:
        """Synthesizes execution steps if LLM omitted them in structured output."""
        req_lower = request.lower()
        services = set(plan.identified_services)

        step_idx = 1
        prev_id = None

        if "sheets" in services or "sheet" in req_lower:
            step_id = f"step_{step_idx}"
            cap = "sheets.read" if "read" in req_lower or "insight" in req_lower or "analyse" in req_lower else "sheets.create"
            plan.steps.append(StepProposal(
                id=step_id,
                capability=cap,
                description="Read/Create and analyze target Google Spreadsheet",
                parameters={"title": "retail_sales" if "retail" in req_lower else "sales"},
                risk="external_side_effect" if cap == "sheets.create" else "read_only",
                requires_approval=cap == "sheets.create"
            ))
            prev_id = step_id
            step_idx += 1

        if "calendar" in services or "meet" in req_lower or "schedule" in req_lower:
            step_id = f"step_{step_idx}"
            plan.steps.append(StepProposal(
                id=step_id,
                capability="calendar.create_event",
                description="Schedule Google Calendar meeting with Google Meet link",
                parameters={"title": "Discussion Meeting"},
                depends_on=[prev_id] if prev_id else [],
                risk="external_side_effect",
                requires_approval=True
            ))
            prev_id = step_id
            step_idx += 1

        if "gmail" in services or "email" in req_lower or "mail" in req_lower:
            draft_id = f"step_{step_idx}"
            plan.steps.append(StepProposal(
                id=draft_id,
                capability="content.draft_email",
                description="Draft executive email with insights, meeting details, and attachment",
                parameters={},
                depends_on=[prev_id] if prev_id else [],
                risk="no_external_side_effect",
                requires_approval=False
            ))
            step_idx += 1
            plan.steps.append(StepProposal(
                id=f"step_{step_idx}",
                capability="gmail.send",
                description="Dispatch email to recipient via Gmail API",
                parameters={},
                depends_on=[draft_id],
                risk="external_side_effect",
                requires_approval=True
            ))

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
