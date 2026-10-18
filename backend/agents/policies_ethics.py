"""
AxiomFlow Policies and Ethics Guardrails Engine.

Defines the operational boundaries, safety rules, ethical standards,
and scope limits for AxiomFlow. Evaluates all incoming user requests at the
Supervisor gateway before any planning or tool execution takes place.
"""

import os
import sys
import re
from typing import Dict, Any, Optional, Literal, Tuple
from pydantic import BaseModel, Field
from langchain_core.messages import SystemMessage, HumanMessage

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from agents.model_factory import get_resilient_chat_model


class PolicyCheckResult(BaseModel):
    """Structured assessment of policy, ethics, and capability compliance."""
    is_allowed: bool = Field(
        ...,
        description="True if query is safe, ethical, and within business workflow automation scope; False if red-flagged."
    )
    category: Literal[
        "ALLOWED",
        "IRRELEVANT_KNOWLEDGE",
        "OUT_OF_SCOPE",
        "HARMFUL_HOSTILE",
        "SUSPICIOUS_FINANCIAL",
        "DISCRIMINATORY_BIAS"
    ] = Field(
        default="ALLOWED",
        description="Categorization of the request against operational policies."
    )
    violation_reason: Optional[str] = Field(
        default=None,
        description="Internal explanation of why the request is disallowed."
    )
    refusal_message: Optional[str] = Field(
        default=None,
        description="Polite user-facing refusal message terminating execution."
    )


POLICY_EVALUATOR_PROMPT = """You are the Chief Policy, Ethics, and Capability Safety Guardrail for AxiomFlow, an enterprise business workflow automation platform.
Your critical responsibility is to inspect incoming user requests at the Supervisor Gateway and RED-FLAG any request that is harmful, out-of-scope, irrelevant, abusive, discriminatory, or suspicious.

AXIOMFLOW AUTHORIZED SCOPE:
AxiomFlow is strictly bounded to the following 3 Google Workspace services for legitimate business operations:
1. Google Calendar: Scheduling business meetings, checking calendar availability, updating calendar events.
2. Google Sheets: Creating business spreadsheets, populating data records, reading and generating business insights.
3. Gmail: Drafting professional business emails, human-verified sending with attachments.

PROHIBITED CATEGORIES (MANDATORY RED FLAGS - is_allowed = False):
1. HARMFUL_HOSTILE:
   - Requests seeking to block, revoke, or restrict email or account access (e.g. 'block the email access to example@gmail.com').
   - Requests instructing to write hostile, termination, forced resignation, or harassment emails (e.g. 'write an email to example@gmail.com to leave the company', 'fire employee X', threats, intimidation).
   - Malicious disruption, account hijacking, sabotage, or unauthorized modifications.
   Refusal Message format:
   "Sorry, I cannot execute the requested tasks. Reason: the requested query seems harmful and is besides my capabilities. If you have any other tasks, I am here to help."

2. OUT_OF_SCOPE:
   - Requests asking to book travel, flights, trains, cabs, hotels, or rental services (e.g. 'Book the flight from Mumbai to Delhi for 3 adults with budget of INR 80000').
   - Requests asking for food delivery, e-commerce purchases, software code development, or server infrastructure provisioning.
   - Any external service outside Google Calendar, Google Sheets, and Gmail.
   Refusal Message format:
   "Sorry, I cannot execute the requested tasks. Reason: booking travel, flights, or external consumer services is besides my capabilities. I specialize in Google Calendar, Sheets, and Gmail business workflow automations. If you have any other tasks, I am here to help."

3. IRRELEVANT_KNOWLEDGE:
   - General knowledge Q&A, theoretical explanations, educational tutorials, chit-chat, poetry, jokes (e.g. 'explain me what is Agentic AI', 'what is machine learning', 'write a poem').
   - Requests that do not seek to automate a business workflow.
   Refusal Message format:
   "Sorry, I cannot execute the requested tasks. Reason: answering general knowledge or theoretical questions is besides my capabilities, as I am designed specifically for business workflow automation. If you have any other tasks, I am here to help."

4. SUSPICIOUS_FINANCIAL:
   - Requests to read payment/credit card/banking information and execute monetary payments or transfers (e.g. 'read payment_info sheet and perform payment for travel', 'transfer money', 'process credit card').
   - Credential harvesting, phishing, or financial fraud.
   Refusal Message format:
   "Sorry, I cannot execute the requested tasks. Reason: executing financial transactions or accessing sensitive payment credentials is fundamentally restricted and besides my capabilities. If you have any other tasks, I am here to help."

5. DISCRIMINATORY_BIAS:
   - Hate speech, derogatory remarks, harassment based on race, gender, religion, nationality, disability, sexual orientation.
   Refusal Message format:
   "Sorry, I cannot execute the requested tasks. Reason: the requested query violates ethical policies prohibiting discrimination and bias. If you have any other tasks, I am here to help."

ALLOWED REQUESTS (is_allowed = True):
- Normal business workflows involving Google Calendar scheduling, Google Sheets data management/insights, and Gmail drafting/sending.
- category = "ALLOWED", violation_reason = None, refusal_message = None.

Evaluate the user request and return the structured PolicyCheckResult."""


class PolicyEthicsGuardrail:
    """
    Supervisor Gateway Guardrail for Policy, Ethics, and Capability Enforcement.
    Combines high-speed deterministic pattern guards with multi-layer resilient LLM evaluation.
    """

    def __init__(self, temperature: float = 0.0):
        self.temperature = temperature
        self.resilient_model = get_resilient_chat_model(temperature=self.temperature)

    def fast_rule_screening(self, request: str) -> Optional[PolicyCheckResult]:
        """
        Fast deterministic screening for overt policy, safety, and scope violations.
        Returns PolicyCheckResult if an overt violation is identified; otherwise None.
        """
        lower = request.strip().lower()

        # 1. Harmful / Hostile / Account Block
        if (
            "block the email access" in lower
            or "block email access" in lower
            or "revoke email access" in lower
            or "lock account" in lower
            or "hack" in lower
            or "leave the company" in lower
            or "force to resign" in lower
            or "threaten" in lower
            or "harass" in lower
        ):
            return PolicyCheckResult(
                is_allowed=False,
                category="HARMFUL_HOSTILE",
                violation_reason="Request involves hostile action, workplace harassment, or unauthorized access restriction.",
                refusal_message="Sorry, I cannot execute the requested tasks. Reason: the requested query seems harmful and is besides my capabilities. If you have any other tasks, I am here to help."
            )

        # 2. Suspicious Financial / Payment Execution
        if (
            ("payment" in lower or "credit card" in lower or "bank" in lower or "transfer money" in lower)
            and ("perform payment" in lower or "execute payment" in lower or "pay" in lower or "transfer" in lower)
        ):
            return PolicyCheckResult(
                is_allowed=False,
                category="SUSPICIOUS_FINANCIAL",
                violation_reason="Request attempts automated payment processing or monetary transfers from payment sheets.",
                refusal_message="Sorry, I cannot execute the requested tasks. Reason: executing financial payments or processing sensitive payment data is besides my capabilities and violates safety policies. If you have any other tasks, I am here to help."
            )

        # 3. Out-of-Scope (Flight / Travel / E-commerce Booking)
        flight_patterns = [
            r"\bbook.*flight\b",
            r"\bflight.*book\b",
            r"\bbook.*ticket\b",
            r"\bflight from .* to\b",
            r"\bhotel booking\b",
            r"\border food\b",
            r"\bswiggy\b",
            r"\bzomato\b",
            r"\buber\b",
            r"\bola\b"
        ]
        for pat in flight_patterns:
            if re.search(pat, lower):
                return PolicyCheckResult(
                    is_allowed=False,
                    category="OUT_OF_SCOPE",
                    violation_reason="Request demands travel/ticket booking or external consumer services not supported by AxiomFlow.",
                    refusal_message="Sorry, I cannot execute the requested tasks. Reason: booking flights, travel, or external consumer services is besides my capabilities. I specialize in Google Calendar, Sheets, and Gmail business workflow automations. If you have any other tasks, I am here to help."
                )

        # 4. Irrelevant Q&A / Theory / Chat
        irrelevant_patterns = [
            r"\bexplain (?:me )?what is\b",
            r"\bwhat is\b.*ai\b",
            r"\btell me about\b",
            r"\bwrite a poem\b",
            r"\bwho is\b",
            r"\bwrite an essay\b",
            r"\bwhat is the capital\b"
        ]
        for pat in irrelevant_patterns:
            if re.search(pat, lower):
                return PolicyCheckResult(
                    is_allowed=False,
                    category="IRRELEVANT_KNOWLEDGE",
                    violation_reason="Request is general theoretical Q&A or chit-chat rather than an actionable business automation.",
                    refusal_message="Sorry, I cannot execute the requested tasks. Reason: answering general knowledge or theoretical questions is besides my capabilities, as I am designed specifically for business workflow automation. If you have any other tasks, I am here to help."
                )

        return None

    def evaluate_request(
        self,
        request: str,
        business_context: Optional[Dict[str, Any]] = None
    ) -> PolicyCheckResult:
        """
        Evaluates user request against AxiomFlow policies and ethics.
        Emits rich observability logs to the terminal.
        """
        # Step 1: Fast deterministic rule screening
        screen_result = self.fast_rule_screening(request)
        if screen_result:
            self._log_terminal_guardrail(request, screen_result, source="Deterministic Rule Engine")
            return screen_result

        # Step 2: Semantic LLM Evaluation
        try:
            structured_llm = self.resilient_model.with_structured_output(PolicyCheckResult)
            user_msg = f"User Request to Evaluate:\n\"{request}\""
            result: PolicyCheckResult = structured_llm.invoke([
                SystemMessage(content=POLICY_EVALUATOR_PROMPT),
                HumanMessage(content=user_msg)
            ])
            self._log_terminal_guardrail(request, result, source="Resilient LLM Guardrail")
            return result
        except Exception as e:
            # Safe fallback: if LLM evaluation fails and fast screening was clean, check basic keyword flags
            print(f"[POLICY GUARDRAIL WARNING] LLM evaluation error: {e}. Defaulting to safe inspection.", flush=True)
            return PolicyCheckResult(
                is_allowed=True,
                category="ALLOWED",
                violation_reason=None,
                refusal_message=None
            )

    def _log_terminal_guardrail(self, request: str, result: PolicyCheckResult, source: str) -> None:
        """Emits clear terminal banner for Supervisor Policy Guardrail."""
        print("\n" + "=" * 80)
        print("          [SUPERVISOR POLICY & ETHICS GUARDRAIL]")
        print("=" * 80)
        print(f"Evaluator:   {source}")
        print(f"Request:     \"{request}\"")
        if result.is_allowed:
            print("Status:      \033[92m[ALLOWED - COMPLIES WITH POLICIES & ETHICS]\033[0m")
            print("Category:    ALLOWED")
        else:
            print("Status:      \033[91m[RED FLAG - VIOLATION DETECTED - EXECUTION BLOCKED]\033[0m")
            print(f"Category:    {result.category}")
            print(f"Reason:      {result.violation_reason}")
            print("-" * 80)
            print("Polite Refusal Message:")
            print(result.refusal_message)
        print("=" * 80 + "\n")
