import os
import sys
import json
from datetime import datetime
from zoneinfo import ZoneInfo
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field
from langchain_core.messages import SystemMessage, HumanMessage
from dotenv import load_dotenv

# Ensure backend root is on sys.path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(current_dir, "..", ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from agents.config import settings
from agents.model_factory import get_chat_model
from agents.state import WorkflowState, EmailDraft

load_dotenv()


class EmailStructure(BaseModel):
    """Structured Email output schema."""
    to: List[str] = Field(default_factory=list, description="List of primary recipient email addresses")
    subject: str = Field(..., description="A concise, professional subject line")
    body: str = Field(..., description="The structured body content of the email")
    cc: List[str] = Field(default_factory=list, description="List of CC recipient emails")
    bcc: List[str] = Field(default_factory=list, description="List of BCC recipient emails")
    attachments: List[Dict[str, Any]] = Field(default_factory=list, description="List of attachment metadata dicts")
    assumptions: List[str] = Field(default_factory=list, description="Explicit assumptions made while drafting")


class EmailContentAgent:
    """
    Email Content Specialist Agent.
    Responsible for drafting professional, structured email content (to, subject, body, cc, bcc)
    informed by user instructions, Supervisor agent context, and Asia/Kolkata timezone awareness.
    """

    # Schema alias for backward compatibility
    EmailStructure = EmailStructure

    def __init__(
        self,
        provider: Optional[str] = None,
        model_name: Optional[str] = None,
        temperature: float = 0.3,
        timezone_str: str = "Asia/Kolkata"
    ):
        self.provider = provider or settings.DEFAULT_LLM_PROVIDER
        self.model_name = model_name or settings.DEFAULT_MODEL_NAME
        self.temperature = temperature
        self.timezone_str = timezone_str
        self.timezone = ZoneInfo(timezone_str)
        self.llm = self.define_model(
            provider=self.provider,
            model_name=self.model_name,
            temperature=self.temperature
        )

    def define_model(
        self,
        provider: Optional[str] = None,
        model_name: Optional[str] = None,
        temperature: float = 0.3
    ):
        """
        Defines and configures the chat model via model factory.
        """
        if not (0.0 <= temperature <= 2.0):
            raise ValueError(f"InvalidTemperatureValueException: invalid temperature {temperature}")

        return get_chat_model(
            provider=provider or self.provider,
            model_name=model_name or self.model_name,
            temperature=temperature
        )

    def _get_fallback_llm(self):
        """Returns secondary fallback LLM if primary hits rate limits or quota."""
        if self.provider == "gemini" and settings.GROQ_API_KEY:
            return get_chat_model(provider="groq", model_name="openai/gpt-oss-20b", temperature=self.temperature)
        elif self.provider == "groq" and settings.GEMINI_API_KEY:
            return get_chat_model(provider="gemini", model_name="gemini-2.5-flash", temperature=self.temperature)
        return None

    def get_current_time_str(self) -> str:
        """Returns the current date, time, and day of week in the configured timezone."""
        now = datetime.now(self.timezone)
        return now.strftime("%A, %Y-%m-%d %I:%M:%S %p %Z")

    def load_system_prompt(self) -> str:
        """Loads system prompt from markdown file or falls back to default."""
        prompt_file = os.path.join(current_dir, "content_agent_prompt.md")
        if os.path.exists(prompt_file):
            with open(prompt_file, "r", encoding="utf-8") as f:
                return f.read().strip()
        return (
            "You are the Email Content Specialist Agent for AxiomFlow. "
            "Draft clear, professional, context-aware emails according to user instructions "
            "and supervisor context, formatted to the requested JSON schema."
        )

    def construct_system_message(self, supervisor_context: Optional[Dict[str, Any]] = None) -> SystemMessage:
        """
        Constructs system message with role guidelines, dynamic Asia/Kolkata time,
        and contextual data passed by the Supervisor agent.
        """
        base_prompt = self.load_system_prompt()
        current_time = self.get_current_time_str()

        context_section = ""
        if supervisor_context:
            context_section = f"\n\n### SUPERVISOR & WORKFLOW CONTEXT:\n{json.dumps(supervisor_context, indent=2, default=str)}"

        full_content = (
            f"{base_prompt}\n\n"
            f"### TEMPORAL CONTEXT (CRITICAL):\n"
            f"- Current Date and Time: {current_time}\n"
            f"- Timezone: {self.timezone_str}\n"
            f"- Evaluate all relative dates ('today', 'tomorrow', 'next Monday', deadlines) strictly based on this current time."
            f"{context_section}"
        )
        return SystemMessage(content=full_content)

    def draft_email(
        self,
        user_message: str,
        supervisor_context: Optional[Dict[str, Any]] = None,
        output_structure: type = EmailStructure
    ) -> EmailStructure:
        """
        Generates a structured email draft conforming to EmailStructure.
        """
        system_message = self.construct_system_message(supervisor_context=supervisor_context)
        human_message = HumanMessage(content=user_message)

        try:
            structured_llm = self.llm.with_structured_output(output_structure)
            result = structured_llm.invoke([system_message, human_message])
            return result
        except Exception as e:
            fallback = self._get_fallback_llm()
            if fallback:
                print(f"[ContentAgent] Primary LLM failed ({e.__class__.__name__}). Switching to fallback provider...")
                fallback_structured = fallback.with_structured_output(output_structure)
                return fallback_structured.invoke([system_message, human_message])
            raise

    def draft_email_as_dict(
        self,
        user_message: str,
        supervisor_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Convenience method returning email draft as a dictionary.
        """
        draft = self.draft_email(user_message=user_message, supervisor_context=supervisor_context)
        if hasattr(draft, "model_dump"):
            return draft.model_dump()
        return dict(draft)

    def run_email_model(
        self,
        sys_message: Any,
        user_message: Any,
        model: Any,
        output_structure: type = EmailStructure
    ) -> Optional[EmailStructure]:
        """
        Runs defined email model to print and return structured response.
        Maintains backward compatibility with earlier script signature.
        """
        try:
            model_with_structure = model.with_structured_output(output_structure)
            response = model_with_structure.invoke([sys_message, user_message])
            print("AI response:\n")
            print(response)
            return response
        except Exception as e:
            print(f"Error while running Email Agent: {str(e)}")
            return None


def email_content_node(state: WorkflowState) -> Dict[str, Any]:
    """
    LangGraph node adapter for the Email Content Specialist.
    Consumes WorkflowState (user request, plan, retrieved context),
    drafts the structured email, and updates workflow state.
    """
    request = state.get("request", "")
    plan = state.get("plan", {})
    retrieved_context = state.get("retrieved_context", [])

    # Extract supervisor context
    supervisor_context = {
        "plan_intent": plan.get("intent") if isinstance(plan, dict) else None,
        "plan_goal": plan.get("goal") if isinstance(plan, dict) else None,
        "steps": plan.get("steps") if isinstance(plan, dict) else [],
        "retrieved_context": retrieved_context,
        "tenant_id": state.get("tenant_id"),
        "account_email": state.get("account_email")
    }

    agent = EmailContentAgent()
    draft = agent.draft_email(user_message=request, supervisor_context=supervisor_context)
    draft_dict = draft.model_dump() if hasattr(draft, "model_dump") else dict(draft)

    return {
        "email_draft": draft_dict,
        "status": "running"
    }


def EmailAgentPipeline():
    """CLI test execution pipeline for testing Email Content Agent."""
    email_agent = EmailContentAgent()
    user_prompt = (
        "Write a reminder email to 'yash@gmail.com' about the company meeting on 18 oct 2026 at 10:00pm, "
        "meeting is about the product development process."
    )
    print("Running Email Content Agent Pipeline...")
    draft = email_agent.draft_email(user_message=user_prompt)
    print("\nStructured Email Draft Result:")
    print(json.dumps(draft.model_dump(), indent=2))
    return draft


if __name__ == "__main__":
    EmailAgentPipeline()
