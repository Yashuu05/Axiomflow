"""
AxiomFlow Agent Architecture Package.
Integrates Multi-Agent Orchestration with FastMCP Google Workspace tools.
"""

from agents.config import settings
from agents.model_factory import get_chat_model, get_resilient_chat_model, ResilientChatModel
from agents.state import WorkflowState, BusinessContext, SufficiencyAssessment, StructuredPlan, CalendarEventResult, EmailDraft, EmailConsentDecision
from agents.graph import build_workflow_graph
from agents.pipeline import run_pipeline

__all__ = [
    "settings",
    "get_chat_model",
    "get_resilient_chat_model",
    "ResilientChatModel",
    "WorkflowState",
    "BusinessContext",
    "SufficiencyAssessment",
    "StructuredPlan",
    "CalendarEventResult",
    "EmailDraft",
    "EmailConsentDecision",
    "build_workflow_graph",
    "run_pipeline"
]
