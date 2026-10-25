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
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

load_dotenv()

from agents.config import settings
from agents.model_factory import get_resilient_chat_model
from agents.state import WorkflowState, EmailDraft


class EmailStructure(BaseModel):
    """Structured Email output schema."""
    to: List[str] = Field(default_factory=list, description="List of primary recipient email addresses")
    subject: str = Field(..., description="A concise, professional subject line")
    body: str = Field(..., description="The structured body content of the email")
    cc: List[str] = Field(default_factory=list, description="List of CC recipient emails")
    bcc: List[str] = Field(default_factory=list, description="List of BCC recipient emails")
    attachments: List[Dict[str, Any]] = Field(default_factory=list, description="List of attachment metadata dicts")
    assumptions: List[str] = Field(default_factory=list, description="Explicit assumptions made while drafting")


CONTENT_AGENT_PROMPT = """You are the Email Content Specialist Agent for AxiomFlow, an enterprise business workflow automation platform.
Your responsibility is to draft or revise clear, professional, context-aware emails informed by user instructions,
business context, spreadsheet data, meeting details, and temporal awareness in Asia/Kolkata timezone.

CRITICAL RULES:
1. SENDER IDENTITY & SIGN-OFF:
   - The sender is the registered business ({business_name}) with email ({business_email}).
   - Always sign off the email with the business name or organization team (e.g. 'Best regards,\\n{business_name} Team').
   - NEVER ask for the sender's email address or name; it is already defined.
2. RECIPIENT ACCURACY:
   - Use the provided recipient email(s) in the 'to' list (e.g. 'yashvary@gmail.com' or 'yashvary13@gmail.com').
3. SPREADSHEET & BUSINESS REPORTING CONTEXT:
   - If a Google Sheet (e.g., 'sales', 'retail_sales') was created or analyzed in the workflow context, address the recipient (e.g., the CFO, CEO, finance team) informing them about the sheet.
   - If spreadsheet insights or metrics are present in context, EXPLICITLY explain and highlight those key insights (such as revenue, profit margins, top-performing product category, leading branches, and recommendations) clearly in the email body using bullet points.
   - Mention the spreadsheet title, summary of records, and include the live Google Spreadsheet URL directly in the email body.
   - Explicitly inform the recipient that the complete spreadsheet data is attached as a CSV file for offline reference.
4. GOOGLE DOCS CONTEXT:
   - If a Google Document (e.g., 'sales_insights.docx') was created or written in the workflow context (see docs_result in context), explicitly inform the recipient (e.g. CFO) about the document.
   - Include the document title and the live Google Document URL directly in the email body so the recipient can review it online.
5. MEETING CONTEXT:
   - If a meeting has been scheduled (see calendar_event in context), incorporate the meeting date, time, attendees (e.g., CEO, CFO, finance team), and Google Meet URL directly into the body.
   - Explain that the meeting is convened to discuss the insights and data from the sheet.
6. REVISION INSTRUCTIONS:
   - If user revision suggestions are provided, apply them accurately while maintaining professionalism.
"""


class EmailContentAgent:
    """
    Email Content Specialist Agent.
    Drafts and updates professional emails using ResilientChatModel (Gemini -> Groq -> Ollama).
    """

    EmailStructure = EmailStructure

    def __init__(
        self,
        temperature: float = 0.2,
        timezone_str: str = "Asia/Kolkata"
    ):
        self.temperature = temperature
        self.timezone_str = timezone_str
        self.timezone = ZoneInfo(timezone_str)
        self.resilient_model = get_resilient_chat_model(temperature=self.temperature)

    def get_current_time_str(self) -> str:
        now = datetime.now(self.timezone)
        return now.strftime("%A, %Y-%m-%d %I:%M:%S %p %Z")

    def construct_system_message(
        self,
        business_context: Optional[Dict[str, Any]] = None,
        supervisor_context: Optional[Dict[str, Any]] = None
    ) -> SystemMessage:
        biz = business_context or {}
        business_name = biz.get("business_name", "AxiomFlow")
        business_email = biz.get("email", biz.get("account_email", "admin@axiomflow.ai"))
        current_time = self.get_current_time_str()

        context_section = ""
        if supervisor_context:
            context_section = f"\n\n### WORKFLOW, SPREADSHEET & MEETING CONTEXT:\n{json.dumps(supervisor_context, indent=2, default=str)}"

        full_content = (
            f"{CONTENT_AGENT_PROMPT.format(business_name=business_name, business_email=business_email)}\n\n"
            f"### TEMPORAL CONTEXT (CRITICAL):\n"
            f"- Current Date and Time: {current_time}\n"
            f"- Timezone: {self.timezone_str}\n"
            f"{context_section}"
        )
        return SystemMessage(content=full_content)

    def draft_email(
        self,
        user_message: str,
        business_context: Optional[Dict[str, Any]] = None,
        supervisor_context: Optional[Dict[str, Any]] = None
    ) -> EmailStructure:
        """Generates structured email draft."""
        system_message = self.construct_system_message(
            business_context=business_context,
            supervisor_context=supervisor_context
        )
        human_message = HumanMessage(content=user_message)

        structured_llm = self.resilient_model.with_structured_output(EmailStructure)
        result: EmailStructure = structured_llm.invoke([system_message, human_message])
        return result

    def revise_email(
        self,
        current_draft: Dict[str, Any],
        user_feedback: str,
        business_context: Optional[Dict[str, Any]] = None,
        supervisor_context: Optional[Dict[str, Any]] = None
    ) -> EmailStructure:
        """
        Revises an existing email draft based on user HITL feedback (Case 3: Update).
        """
        system_message = self.construct_system_message(
            business_context=business_context,
            supervisor_context=supervisor_context
        )

        revision_prompt = (
            f"CURRENT EMAIL DRAFT:\n{json.dumps(current_draft, indent=2)}\n\n"
            f"USER REVISION FEEDBACK / REQUESTED CHANGES:\n\"{user_feedback}\"\n\n"
            f"Please regenerate the EmailStructure incorporating the user's requested revisions accurately."
        )

        structured_llm = self.resilient_model.with_structured_output(EmailStructure)
        result: EmailStructure = structured_llm.invoke([
            system_message,
            HumanMessage(content=revision_prompt)
        ])
        return result


def email_content_node(state: WorkflowState) -> Dict[str, Any]:
    """
    LangGraph node adapter for drafting initial email content.
    """
    request = state.get("request", "")
    business_context = state.get("business_context", {})
    calendar_event = state.get("calendar_event")
    sheet_result = state.get("sheet_result")
    docs_result = state.get("docs_result")
    clarification_answers = state.get("clarification_answers")

    supervisor_context = {
        "calendar_event": calendar_event,
        "sheet_result": {
            "title": sheet_result.get("title") if sheet_result else None,
            "spreadsheet_url": sheet_result.get("spreadsheet_url") if sheet_result else None,
            "row_count": sheet_result.get("row_count") if sheet_result else None,
            "headers": sheet_result.get("headers") if sheet_result else None,
            "insights": sheet_result.get("insights") if sheet_result else None,
            "summary_metrics": sheet_result.get("summary_metrics") if sheet_result else None
        } if sheet_result else None,
        "docs_result": {
            "title": docs_result.get("title") if docs_result else None,
            "document_url": docs_result.get("document_url") if docs_result else None,
            "word_count": docs_result.get("word_count") if docs_result else None,
            "operation": docs_result.get("operation") if docs_result else None,
            "content_preview": docs_result.get("content_preview") if docs_result else None
        } if docs_result else None,
        "clarification_answers": clarification_answers,
        "user_id": state.get("user_id"),
        "account_email": state.get("account_email")
    }

    agent = EmailContentAgent()
    draft = agent.draft_email(
        user_message=request,
        business_context=business_context,
        supervisor_context=supervisor_context
    )

    # Attach generated CSV and document content if present
    attachments = []
    if sheet_result and sheet_result.get("csv_content"):
        filename = f"{sheet_result.get('title', 'sales')}.csv"
        attachments.append({
            "filename": filename,
            "content": sheet_result.get("csv_content"),
            "maintype": "text",
            "subtype": "csv"
        })

    if docs_result and docs_result.get("title"):
        doc_title = docs_result.get("title", "sales_insights")
        doc_filename = doc_title if doc_title.endswith((".docx", ".txt", ".doc")) else f"{doc_title}.docx"
        doc_content = docs_result.get("content_preview", "Sales Insights Document Content")
        attachments.append({
            "filename": doc_filename,
            "content": doc_content,
            "maintype": "text",
            "subtype": "plain"
        })

    if attachments:
        draft.attachments = attachments

    # Real-time Terminal Observability & Tracing
    print("\n" + "=" * 80)
    print("             [EMAIL CONTENT AGENT] EMAIL DRAFT GENERATED")
    print("=" * 80)
    print(f"To:          {draft.to}")
    print(f"Subject:     {draft.subject}")
    print(f"Attachments: {[a.get('filename') for a in draft.attachments]}")
    print("-" * 80)
    print("Proposed Body:")
    print(draft.body.strip())
    print("=" * 80 + "\n")

    return {
        "email_draft": draft.model_dump(),
        "status": "awaiting_email_consent"
    }


def email_revision_node(state: WorkflowState) -> Dict[str, Any]:
    """
    LangGraph node adapter for revising email content when user requests updates (Case 3).
    """
    current_draft = state.get("email_draft", {})
    user_feedback = state.get("user_feedback", "")
    business_context = state.get("business_context", {})
    calendar_event = state.get("calendar_event")
    sheet_result = state.get("sheet_result")
    docs_result = state.get("docs_result")
    clarification_answers = state.get("clarification_answers")
    current_revisions = state.get("revision_count", 0)

    supervisor_context = {
        "calendar_event": calendar_event,
        "sheet_result": {
            "title": sheet_result.get("title") if sheet_result else None,
            "spreadsheet_url": sheet_result.get("spreadsheet_url") if sheet_result else None,
            "row_count": sheet_result.get("row_count") if sheet_result else None,
            "headers": sheet_result.get("headers") if sheet_result else None,
            "insights": sheet_result.get("insights") if sheet_result else None,
            "summary_metrics": sheet_result.get("summary_metrics") if sheet_result else None
        } if sheet_result else None,
        "docs_result": {
            "title": docs_result.get("title") if docs_result else None,
            "document_url": docs_result.get("document_url") if docs_result else None,
            "word_count": docs_result.get("word_count") if docs_result else None,
            "operation": docs_result.get("operation") if docs_result else None,
            "content_preview": docs_result.get("content_preview") if docs_result else None
        } if docs_result else None,
        "clarification_answers": clarification_answers,
        "user_id": state.get("user_id"),
        "account_email": state.get("account_email")
    }

    agent = EmailContentAgent()
    updated_draft = agent.revise_email(
        current_draft=current_draft,
        user_feedback=user_feedback,
        business_context=business_context,
        supervisor_context=supervisor_context
    )

    # Maintain attachments across revisions
    revised_attachments = []
    if sheet_result and sheet_result.get("csv_content"):
        filename = f"{sheet_result.get('title', 'sales')}.csv"
        revised_attachments.append({
            "filename": filename,
            "content": sheet_result.get("csv_content"),
            "maintype": "text",
            "subtype": "csv"
        })
    if docs_result and docs_result.get("title"):
        doc_title = docs_result.get("title", "sales_insights")
        doc_filename = doc_title if doc_title.endswith((".docx", ".txt", ".doc")) else f"{doc_title}.docx"
        revised_attachments.append({
            "filename": doc_filename,
            "content": docs_result.get("content_preview", "Sales Insights Document Content"),
            "maintype": "text",
            "subtype": "plain"
        })
    if revised_attachments:
        updated_draft.attachments = revised_attachments

    # Real-time Terminal Observability & Tracing
    print("\n" + "=" * 80)
    print("             [EMAIL CONTENT AGENT] REVISED EMAIL DRAFT")
    print("=" * 80)
    print(f"To:          {updated_draft.to}")
    print(f"Subject:     {updated_draft.subject}")
    print(f"Attachments: {[a.get('filename') for a in updated_draft.attachments]}")
    print("-" * 80)
    print("Revised Body:")
    print(updated_draft.body.strip())
    print("=" * 80 + "\n")

    return {
        "email_draft": updated_draft.model_dump(),
        "revision_count": current_revisions + 1,
        "status": "awaiting_email_consent"
    }
