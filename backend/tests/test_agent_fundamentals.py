import pytest
from agents.config import AgentSettings
from agents.state import StepPlan, StructuredPlan, EmailDraft, WorkflowState
from agents.model_factory import get_chat_model
from agents.graph import build_workflow_graph

def test_agent_config():
    """Verify settings initialization and defaults."""
    settings = AgentSettings()
    assert settings.DEFAULT_LLM_PROVIDER in ["gemini", "groq", "ollama"]
    assert settings.MAX_PLAN_STEPS > 0
    assert settings.REQUIRE_APPROVAL_FOR_EXTERNAL_SEND is True

def test_workflow_state_schemas():
    """Verify Pydantic models for step planning and email drafting."""
    step = StepPlan(
        id="step_1",
        capability="gmail.search",
        description="Search recent emails from Acme",
        risk="read_only"
    )
    assert step.id == "step_1"
    assert step.risk == "read_only"

    plan = StructuredPlan(
        goal="Send follow-up email",
        steps=[step]
    )
    assert len(plan.steps) == 1
    assert plan.goal == "Send follow-up email"

    draft = EmailDraft(
        to=["client@acme.com"],
        subject="Meeting Follow-up",
        body="Hello Acme team, here are the action items."
    )
    assert draft.to == ["client@acme.com"]
    assert draft.subject == "Meeting Follow-up"

def test_model_factory_invalid_provider():
    """Verify factory raises ValueError for unsupported model providers."""
    with pytest.raises(ValueError, match="Unsupported LLM provider"):
        get_chat_model(provider="unsupported_ai_provider")

def test_model_factory_gemini_init():
    """Verify ChatGoogleGenerativeAI instantiation."""
    model = get_chat_model(provider="gemini", api_key="dummy_key")
    assert model is not None

def test_graph_compilation_and_execution():
    """Verify LangGraph workflow compiles and can process an initial state."""
    app = build_workflow_graph()
    assert app is not None

    initial_state: WorkflowState = {
        "run_id": "test_run_123",
        "tenant_id": "tenant_1",
        "user_id": "usr_72b30e7cd49e49e5",
        "business_id": 2,
        "account_email": "chillalyash2005@gmail.com",
        "request": "Summarize my latest meeting emails and check calendar.",
    }

    result = app.invoke(initial_state)
    assert result is not None
    assert "status" in result
    assert result["status"] == "succeeded"
