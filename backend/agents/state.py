from typing import TypedDict, Optional, List, Dict, Any, Literal
from pydantic import BaseModel, Field


# --- Strongly-Typed Schema Models for Business Context & Agents ---

class BusinessContext(BaseModel):
    """Registered organization profile providing context for email sending and planning."""
    business_name: str = Field(..., description="Registered company or business name")
    email: str = Field(..., description="Official business or administrator email (sender email)")
    website_url: Optional[str] = Field(default=None, description="Official company website URL")
    sector: Optional[str] = Field(default=None, description="Business sector / industry")
    description: Optional[str] = Field(default=None, description="Company overview / brief")
    user_id: str = Field(..., description="AxiomFlow user identifier")
    account_email: str = Field(..., description="Connected Google OAuth account email")


from pydantic import BaseModel, Field, field_validator


class SufficiencyAssessment(BaseModel):
    """Assessment of whether user prompt has enough information for tool execution."""
    is_sufficient: bool = Field(
        ...,
        description="True if prompt has all necessary details for calendar and email tools; False if missing critical parameters"
    )
    missing_fields: Optional[List[str]] = Field(
        default=None,
        description="Names of missing required parameters (e.g. 'receiver_email', 'meeting_duration', 'meeting_url_preference')"
    )
    questions: Optional[List[str]] = Field(
        default=None,
        description="Numbered, complete list of questions to ask user simultaneously. Empty if is_sufficient is True."
    )
    reasoning: Optional[str] = Field(
        default=None,
        description="Explanation of why information is sufficient or what specific data is missing"
    )

    @field_validator("missing_fields", "questions", mode="before")
    def default_none_to_empty(cls, v):
        return v if v is not None else []


class StepPlan(BaseModel):
    """Represents a bounded single step inside a task plan."""
    id: str = Field(..., description="Unique step identifier (e.g. 'step_1')")
    capability: str = Field(..., description="Capability name (e.g. 'calendar.create_event', 'content.draft_email', 'gmail.send')")
    description: str = Field(..., description="Explanation of what the step aims to accomplish")
    parameters: Dict[str, Any] = Field(default_factory=dict, description="Resolved parameters for tool execution")
    depends_on: List[str] = Field(default_factory=list, description="IDs of prerequisite steps")
    risk: Literal["read_only", "no_external_side_effect", "external_side_effect"] = Field(
        default="read_only",
        description="Risk level of the step"
    )
    requires_approval: bool = Field(default=False, description="Whether human confirmation is mandated")


class StructuredPlan(BaseModel):
    """Structured plan proposal produced by the Supervisor/Planner."""
    intent: str = Field(..., description="Interpreted user intent")
    goal: str = Field(..., description="High-level business objective")
    identified_services: List[str] = Field(default_factory=list, description="Google services involved")
    steps: List[StepPlan] = Field(default_factory=list, description="Ordered sequence of execution steps")
    clarification_needed: Optional[str] = Field(default=None, description="Clarification if needed")
    reasoning: Optional[str] = Field(default=None, description="Planning logic")


class CalendarEventResult(BaseModel):
    """Outcome payload from Calendar Agent / FastMCP calendar creation."""
    event_id: str = Field(..., description="Google Calendar Event ID")
    summary: str = Field(..., description="Event Title / Summary")
    start_time: str = Field(..., description="ISO 8601 Start Time (Asia/Kolkata)")
    end_time: str = Field(..., description="ISO 8601 End Time (Asia/Kolkata)")
    html_link: Optional[str] = Field(default=None, description="Google Calendar web URL")
    meet_link: Optional[str] = Field(default=None, description="Auto-generated Google Meet conference URL")
    attendees: List[str] = Field(default_factory=list, description="List of invited attendee emails")


class SheetResult(BaseModel):
    """Outcome payload from Sheet Agent / FastMCP sheets creation."""
    spreadsheet_id: str = Field(..., description="Google Spreadsheet ID")
    spreadsheet_url: str = Field(..., description="Google Spreadsheet web URL")
    title: str = Field(..., description="Spreadsheet Title")
    sheet_name: str = Field(default="sales", description="Sheet Tab Name")
    row_count: int = Field(..., description="Number of data rows inserted")
    headers: List[str] = Field(default_factory=list, description="Column headers")
    values: List[List[Any]] = Field(default_factory=list, description="Row values inserted")
    csv_content: Optional[str] = Field(default=None, description="Exported CSV representation of sheet")
    insights: Optional[str] = Field(default=None, description="Plain text summarized insights extracted from data")
    summary_metrics: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Key computed metric indicators")


class DocResult(BaseModel):
    """Outcome payload from Docs Agent / FastMCP docs execution."""
    document_id: str = Field(..., description="Google Document ID")
    document_url: str = Field(..., description="Web URL to open and edit document in browser")
    title: str = Field(..., description="Document Title")
    operation: str = Field(default="docs.create_and_write", description="Primary operation performed")
    content_preview: Optional[str] = Field(default=None, description="Preview of document content")
    word_count: Optional[int] = Field(default=0, description="Estimated total word count")
    status: Literal["success", "failed"] = Field(default="success")


class EmailDraft(BaseModel):
    """Structured draft generated by Email Content Specialist."""
    to: List[str] = Field(..., description="Recipient email addresses")
    subject: str = Field(..., description="Subject line")
    body: str = Field(..., description="Email body content with Meet link and agenda")
    cc: List[str] = Field(default_factory=list, description="Optional CC recipients")
    bcc: List[str] = Field(default_factory=list, description="Optional BCC recipients")
    attachments: List[Dict[str, Any]] = Field(default_factory=list, description="Optional email attachments")
    assumptions: List[str] = Field(default_factory=list, description="Assumptions made when drafting")


class EmailConsentDecision(BaseModel):
    """Human-In-The-Loop review decision for outgoing email."""
    decision: Literal["pending", "accepted", "rejected", "updated"] = Field(
        default="pending",
        description="Action chosen by user: accepted (send email), rejected (abort pipeline), updated (revise draft)"
    )
    user_feedback: Optional[str] = Field(
        default=None,
        description="Specific revision instructions provided by user if decision is 'updated'"
    )
    revision_count: int = Field(default=0, description="Number of times draft has been updated")


class ToolOutcome(BaseModel):
    """Standardized record of tool execution result."""
    step_id: str = Field(..., description="Associated step id in the plan")
    capability: str = Field(..., description="Capability executed")
    status: Literal["succeeded", "failed", "skipped"] = Field(..., description="Outcome status")
    resource_id: Optional[str] = Field(default=None, description="Created/referenced ID (e.g. message_id, event_id)")
    data: Optional[Dict[str, Any]] = Field(default=None, description="Result payload returned by tool")
    error: Optional[str] = Field(default=None, description="Error message if execution failed")


class ExecutionError(BaseModel):
    """Standardized error record inside graph state."""
    node: str = Field(..., description="Node where error occurred")
    error_type: str = Field(..., description="Error category")
    message: str = Field(..., description="User-friendly error message")
    recoverable: bool = Field(default=False, description="Whether retry or repair was attempted")


# --- LangGraph Shared Workflow State ---

class WorkflowState(TypedDict, total=False):
    """
    Central typed workflow state flowing across all nodes in the LangGraph execution.
    Contains business profile context, user clarifications, plan, tool outputs,
    email drafts, consent choices, and execution audits.
    """
    # Context & Tenant Identity
    run_id: str
    task_id: Optional[str]
    is_web_session: Optional[bool]
    tenant_id: str
    user_id: str
    business_id: int
    account_email: str
    business_context: Dict[str, Any]  # Stores business_name, email, website_url, description

    # Request & Clarification
    request: str
    sufficiency_assessment: Optional[Dict[str, Any]]  # Stores SufficiencyAssessment dict
    clarification_answers: Optional[Dict[str, str]]    # Stores answers keyed by missing field

    # Plan Progression
    plan: Optional[Dict[str, Any]]                    # Stores StructuredPlan dict
    current_step_index: int

    # Specialist Agent Outputs & Tool Artifacts
    calendar_event: Optional[Dict[str, Any]]          # Stores CalendarEventResult dict
    sheet_result: Optional[Dict[str, Any]]            # Stores SheetResult dict
    docs_result: Optional[Dict[str, Any]]             # Stores DocResult dict
    email_draft: Optional[Dict[str, Any]]             # Stores EmailDraft dict
    email_consent: Optional[Dict[str, Any]]           # Stores EmailConsentDecision dict

    # Observability & Audit
    tool_outcomes: List[Dict[str, Any]]
    fallback_logs: List[Dict[str, Any]]               # Records any LLM fallback events
    errors: List[Dict[str, Any]]
    final_response: Optional[str]
    status: Literal[
        "initializing",
        "assessing",
        "awaiting_clarification",
        "planning",
        "executing_calendar",
        "executing_sheet",
        "executing_docs",
        "drafting_email",
        "awaiting_email_consent",
        "executing_gmail",
        "succeeded",
        "failed",
        "rejected"
    ]
