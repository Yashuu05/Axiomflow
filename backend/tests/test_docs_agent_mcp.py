import os
import sys
import pytest
from unittest.mock import MagicMock, patch

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from agents.state import DocResult, WorkflowState
from agents.tools.registry import (
    is_valid_capability,
    get_capability_metadata,
    CAPABILITY_REGISTRY
)
from agents.graph import (
    build_workflow_graph,
    route_after_plan,
    route_after_sheet,
    route_after_docs,
    route_after_calendar
)
from agents.specialists.docs_agent import DocsAgent, ComposedDocument
from tools.docs_tools import docs_mcp


def test_docs_capabilities_registry():
    """Verify that Google Docs capabilities are correctly registered and approved."""
    docs_caps = ["docs.create", "docs.read", "docs.write", "docs.append", "docs.replace_text", "docs.delete"]
    for cap in docs_caps:
        assert is_valid_capability(cap), f"Capability {cap} should be valid in CAPABILITY_REGISTRY"
        meta = get_capability_metadata(cap)
        assert meta["service"] == "docs"
        if cap == "docs.read":
            assert meta["risk"] == "read_only"
            assert meta["requires_approval"] is False
        else:
            assert meta["risk"] == "external_side_effect"
            assert meta["requires_approval"] is True


def test_doc_result_schema():
    """Verify DocResult Pydantic schema validation."""
    doc_res = DocResult(
        document_id="1AbC_xyz_test_doc_id",
        document_url="https://docs.google.com/document/d/1AbC_xyz_test_doc_id/edit",
        title="Project Titan Specifications",
        operation="docs.create_and_write",
        content_preview="Executive Summary: System integration...",
        word_count=450,
        status="success"
    )
    assert doc_res.document_id == "1AbC_xyz_test_doc_id"
    assert doc_res.word_count == 450
    assert doc_res.status == "success"
    dump = doc_res.model_dump()
    assert dump["operation"] == "docs.create_and_write"


def test_docs_mcp_tools_registered():
    """Verify that docs_mcp FastMCP server has registered all expected tool handlers."""
    expected_tools = {
        "docs_create_document",
        "docs_read_document",
        "docs_write_document",
        "docs_replace_text",
        "docs_delete_content_range",
        "docs_delete_document"
    }
    # FastMCP holds registered tools
    server_tools = set()
    # In FastMCP, tools can be inspected from docs_mcp
    if hasattr(docs_mcp, "_tools"):
        server_tools = set(docs_mcp._tools.keys())
    elif hasattr(docs_mcp, "tools"):
        server_tools = {t.name for t in docs_mcp.tools}

    for tool_name in expected_tools:
        # Check either in server_tools or directly importable
        from tools.docs_tools import (
            docs_create_document,
            docs_read_document,
            docs_write_document,
            docs_replace_text,
            docs_delete_content_range,
            docs_delete_document
        )
        assert callable(docs_create_document)
        assert callable(docs_read_document)
        assert callable(docs_write_document)
        assert callable(docs_replace_text)
        assert callable(docs_delete_content_range)
        assert callable(docs_delete_document)


def test_graph_routing_with_docs():
    """Verify conditional router transitions for Google Docs workflows."""
    # 1. Route after plan when docs capability is present
    state_docs: WorkflowState = {
        "plan": {
            "steps": [{"capability": "docs.create"}, {"capability": "docs.write"}]
        }
    }
    assert route_after_plan(state_docs) == "execute_docs"

    # 2. Multi-service routing: Sheets -> Docs -> Calendar -> Email
    state_multi: WorkflowState = {
        "plan": {
            "steps": [
                {"capability": "sheets.create"},
                {"capability": "docs.create"},
                {"capability": "calendar.create_event"},
                {"capability": "gmail.send"}
            ]
        },
        "sheet_result": {"spreadsheet_id": "sheet_123"},
        "docs_result": None
    }
    assert route_after_sheet(state_multi) == "execute_docs"

    # 3. Route after docs to calendar if calendar has not executed
    state_after_docs: WorkflowState = {
        "plan": {
            "steps": [
                {"capability": "docs.create"},
                {"capability": "calendar.create_event"},
                {"capability": "gmail.send"}
            ]
        },
        "docs_result": {"document_id": "doc_123"},
        "calendar_event": None
    }
    assert route_after_docs(state_after_docs) == "execute_calendar"

    # 4. Route after docs to email if calendar already executed or not requested
    state_docs_email: WorkflowState = {
        "plan": {
            "steps": [
                {"capability": "docs.create"},
                {"capability": "content.draft_email"}
            ]
        },
        "docs_result": {"document_id": "doc_123"}
    }
    assert route_after_docs(state_docs_email) == "draft_email"


def test_graph_compiles_with_docs_node():
    """Verify StateGraph compiles successfully with the execute_docs node."""
    graph = build_workflow_graph()
    assert graph is not None
    # Verify node exists in graph nodes
    assert "execute_docs" in graph.nodes


@pytest.mark.asyncio
async def test_docs_agent_mcp_mock_execution():
    """Verify DocsAgent create_and_write_doc_via_mcp with mocked FastMCP tool responses."""
    agent = DocsAgent()

    mock_create_response = MagicMock()
    mock_create_response.is_error = False
    mock_create_response.structured_content = {
        "result": {
            "document_id": "mock_doc_id_456",
            "document_url": "https://docs.google.com/document/d/mock_doc_id_456/edit",
            "title": "Mock Handover Document"
        }
    }

    mock_write_response = MagicMock()
    mock_write_response.is_error = False
    mock_write_response.structured_content = {
        "result": {
            "characters_written": 120,
            "document_id": "mock_doc_id_456"
        }
    }

    with patch.object(docs_mcp, "call_tool") as mock_call:
        mock_call.side_effect = [mock_create_response, mock_write_response]

        res = await agent.create_and_write_doc_via_mcp(
            user_id="test_user",
            account_email="test@business.com",
            title="Mock Handover Document",
            content="## Executive Summary\nTesting document creation via FastMCP."
        )

        assert res.document_id == "mock_doc_id_456"
        assert res.document_url == "https://docs.google.com/document/d/mock_doc_id_456/edit"
        assert res.status == "success"
        assert res.operation == "docs.create_and_write"
        assert mock_call.call_count == 2


@pytest.mark.asyncio
async def test_docs_agent_execution_node_placeholder_id_recovery():
    """Verify that docs_agent_execution_node handles DAG placeholder IDs without failing."""
    from agents.specialists.docs_agent import docs_agent_execution_node

    state: WorkflowState = {
        "user_id": "test_user",
        "account_email": "test@business.com",
        "request": "Create a new document called sales_insights.docx with sales data",
        "business_context": {"business_name": "Test Co"},
        "plan": {
            "steps": [
                {
                    "id": "step_2",
                    "capability": "docs.create",
                    "parameters": {"title": "sales_insights.docx"}
                },
                {
                    "id": "step_3",
                    "capability": "docs.write",
                    "parameters": {"document_id": "step_2_id", "text": "<generated_sales_insights>"}
                }
            ]
        }
    }

    mock_create_response = MagicMock()
    mock_create_response.is_error = False
    mock_create_response.structured_content = {
        "result": {
            "document_id": "real_doc_id_999",
            "document_url": "https://docs.google.com/document/d/real_doc_id_999/edit",
            "title": "sales_insights.docx"
        }
    }

    mock_write_response = MagicMock()
    mock_write_response.is_error = False
    mock_write_response.structured_content = {
        "result": {
            "characters_written": 250,
            "document_id": "real_doc_id_999"
        }
    }

    with patch.object(docs_mcp, "call_tool") as mock_call:
        mock_call.side_effect = [mock_create_response, mock_write_response]
        with patch.object(DocsAgent, "compose_document_content") as mock_compose:
            mock_compose.return_value = ComposedDocument(
                title="sales_insights.docx",
                formatted_body="## Sales Insights\nAnalysis results here."
            )

            result = await docs_agent_execution_node(state)
            assert result["status"] == "executing_docs"
            assert result["docs_result"]["document_id"] == "real_doc_id_999"
            assert result["docs_result"]["operation"] == "docs.create_and_write"
            assert mock_call.call_count == 2

