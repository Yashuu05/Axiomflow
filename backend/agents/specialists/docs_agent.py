import os
import sys
import json
import re
from typing import Dict, Any, Optional, List
from pydantic import BaseModel, Field
from langchain_core.messages import SystemMessage, HumanMessage

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

def is_valid_google_doc_id(doc_id: Optional[str]) -> bool:
    """Checks if a string is a genuine Google Document ID rather than a DAG placeholder."""
    if not doc_id:
        return False
    clean = str(doc_id).strip()
    if len(clean) < 20:
        return False
    if "step" in clean.lower() or "<" in clean or ">" in clean or "placeholder" in clean.lower():
        return False
    return bool(re.match(r"^[a-zA-Z0-9_-]{20,}$", clean))

from agents.config import settings
from agents.model_factory import get_resilient_chat_model
from agents.state import DocResult, WorkflowState
from tools.docs_tools import docs_mcp


DOCS_AGENT_SYSTEM_PROMPT = """You are the Google Docs Specialist Agent for AxiomFlow, an enterprise business workflow platform.
Your objective is to interpret user document intent, structure executive-ready documentation, and compose high-quality business prose.

GUIDELINES FOR DOCUMENT COMPOSITION:
1. Title: Provide a clear, professional, executive title (e.g., 'Project Titan Handover Specification', 'Q3 Financial Review & Roadmap').
2. Structure: Break content logically into distinct sections using markdown-style headings:
   - Executive Overview / Purpose
   - Scope & Key Objectives
   - Core Deliverables / Milestones / Specifications
   - Operational Notes & Next Actions
3. Polish & Tone: Formal, precise, enterprise-ready tone suitable for corporate review and external stakeholders.
4. Clean Formatting: Ensure paragraphs are separated with clear double-newlines for clean presentation in Google Docs.
"""


class ComposedDocument(BaseModel):
    """Structured document composition produced by Docs Agent."""
    title: str = Field(..., description="Clean, professional title for the Google Document")
    formatted_body: str = Field(..., description="Complete structured document text with headings, paragraphs, and bullet points")
    summary_notes: Optional[str] = Field(default=None, description="Concise 1-2 sentence executive summary of the document")


class DocsAgent:
    """
    Google Docs Specialist Agent for AxiomFlow.
    Responsible for:
      - Creating new Google Documents (e.g., project specifications, client proposals, handover notes)
      - Composing structured executive prose using resilient LLM output
      - Reading existing Google Documents and extracting plain text & statistics
      - Appending or updating text in existing documents
      - Finding and replacing template placeholders
      - Moving documents to trash or permanently deleting via Google Drive API
      - Emitting structured observability logs to terminal and returning DocResult
    """

    def __init__(self, temperature: float = 0.2):
        self.temperature = temperature
        self.resilient_model = get_resilient_chat_model(temperature=self.temperature)

    def compose_document_content(
        self,
        request: str,
        business_context: Dict[str, Any],
        supporting_data: Optional[str] = None
    ) -> ComposedDocument:
        """
        Uses LLM structured output to compose an executive, publication-grade document body.
        """
        structured_llm = self.resilient_model.with_structured_output(ComposedDocument)

        company_name = business_context.get("business_name", "AxiomFlow Enterprise")
        user_prompt = f"""User Business Request:
\"{request}\"

Company / Organization:
{company_name}

Supporting Context or Data:
{supporting_data or 'None provided'}

Compose a complete, publication-ready Google Document with a professional title and well-structured body."""

        messages = [
            SystemMessage(content=DOCS_AGENT_SYSTEM_PROMPT),
            HumanMessage(content=user_prompt)
        ]

        return structured_llm.invoke(messages)

    async def create_and_write_doc_via_mcp(
        self,
        user_id: str,
        account_email: str,
        title: str,
        content: str
    ) -> DocResult:
        """
        Executes Google Doc creation and content writing via FastMCP tools:
          1. docs_create_document
          2. docs_write_document (mode='append')
        """
        print("\n" + "=" * 80)
        print("          [DOCS AGENT] INITIALIZING GOOGLE DOC CREATION & WRITING")
        print("=" * 80)
        print(f"User ID:        {user_id}")
        print(f"Account Email:  {account_email}")
        print(f"Document Title: {title}")
        print(f"Content Length: {len(content)} characters")
        print("-" * 80)

        # 1. Create Document
        print(f"[DOCS AGENT] Step 1: Creating Google Document '{title}' via FastMCP...")
        create_args = {
            "user_id": user_id,
            "account_email": account_email,
            "title": title
        }
        create_res = await docs_mcp.call_tool("docs_create_document", create_args)
        if create_res.is_error:
            raise RuntimeError(f"FastMCP docs_create_document failed: {create_res.content}")

        raw_create_data = create_res.structured_content or {}
        create_data = raw_create_data.get("result", raw_create_data)
        document_id = create_data.get("document_id")
        document_url = create_data.get("document_url")

        print("[DOCS AGENT] [SUCCESS] Target Document Online!")
        print(f"  Document ID:  {document_id}")
        print(f"  Document URL: {document_url}")

        # 2. Write / Append Content
        print(f"\n[DOCS AGENT] Step 2: Writing structured content into '{title}' via FastMCP...")
        write_args = {
            "user_id": user_id,
            "account_email": account_email,
            "document_id": document_id,
            "text": content,
            "mode": "append"
        }
        write_res = await docs_mcp.call_tool("docs_write_document", write_args)
        if write_res.is_error:
            raise RuntimeError(f"FastMCP docs_write_document failed: {write_res.content}")

        word_count = len(content.split())
        preview = content[:250].strip() + ("..." if len(content) > 250 else "")

        print("\n" + "-" * 80)
        print("          [DOCS AGENT] DOCUMENT CREATION & WRITING SUMMARY")
        print("-" * 80)
        print(f"Document ID:   {document_id}")
        print(f"Document URL:  {document_url}")
        print(f"Total Words:   {word_count}")
        print(f"Preview:       {preview}")
        print("=" * 80 + "\n")

        return DocResult(
            document_id=document_id,
            document_url=document_url,
            title=title,
            operation="docs.create_and_write",
            content_preview=preview,
            word_count=word_count,
            status="success"
        )

    async def read_doc_via_mcp(
        self,
        user_id: str,
        account_email: str,
        document_id: str
    ) -> DocResult:
        """
        Reads a specified Google Document via FastMCP docs_read_document.
        """
        print("\n" + "=" * 80)
        print("          [DOCS AGENT] READING GOOGLE DOCUMENT VIA FASTMCP")
        print("=" * 80)
        print(f"User ID:        {user_id}")
        print(f"Account Email:  {account_email}")
        print(f"Document ID:    {document_id}")
        print("-" * 80)

        read_args = {
            "user_id": user_id,
            "account_email": account_email,
            "document_id": document_id
        }
        read_res = await docs_mcp.call_tool("docs_read_document", read_args)
        if read_res.is_error:
            raise RuntimeError(f"FastMCP docs_read_document failed: {read_res.content}")

        raw_data = read_res.structured_content or {}
        data = raw_data.get("result", raw_data)

        title = data.get("title", "Retrieved Document")
        doc_url = data.get("document_url", f"https://docs.google.com/document/d/{document_id}/edit")
        content = data.get("content", "")
        word_count = data.get("word_count", len(content.split()))
        preview = content[:250].strip() + ("..." if len(content) > 250 else "")

        print(f"[DOCS AGENT] [SUCCESS] Document '{title}' retrieved ({word_count} words).")
        print("=" * 80 + "\n")

        return DocResult(
            document_id=document_id,
            document_url=doc_url,
            title=title,
            operation="docs.read",
            content_preview=preview,
            word_count=word_count,
            status="success"
        )

    async def append_to_doc_via_mcp(
        self,
        user_id: str,
        account_email: str,
        document_id: str,
        text: str
    ) -> DocResult:
        """
        Appends text to an existing Google Document.
        """
        print(f"[DOCS AGENT] Appending text ({len(text)} chars) to Document ID '{document_id}'...")
        write_args = {
            "user_id": user_id,
            "account_email": account_email,
            "document_id": document_id,
            "text": text,
            "mode": "append"
        }
        res = await docs_mcp.call_tool("docs_write_document", write_args)
        if res.is_error:
            raise RuntimeError(f"FastMCP docs_write_document append failed: {res.content}")

        doc_url = f"https://docs.google.com/document/d/{document_id}/edit"
        return DocResult(
            document_id=document_id,
            document_url=doc_url,
            title="Updated Document",
            operation="docs.append",
            content_preview=text[:250],
            word_count=len(text.split()),
            status="success"
        )

    async def replace_text_via_mcp(
        self,
        user_id: str,
        account_email: str,
        document_id: str,
        search_text: str,
        replace_text: str
    ) -> DocResult:
        """
        Replaces placeholders or occurrences of target text in a Google Document.
        """
        print(f"[DOCS AGENT] Replacing '{search_text}' with '{replace_text}' in Document ID '{document_id}'...")
        replace_args = {
            "user_id": user_id,
            "account_email": account_email,
            "document_id": document_id,
            "search_text": search_text,
            "replace_text": replace_text,
            "match_case": True
        }
        res = await docs_mcp.call_tool("docs_replace_text", replace_args)
        if res.is_error:
            raise RuntimeError(f"FastMCP docs_replace_text failed: {res.content}")

        raw = res.structured_content or {}
        data = raw.get("result", raw)
        changed = data.get("occurrences_changed", 0)

        doc_url = f"https://docs.google.com/document/d/{document_id}/edit"
        return DocResult(
            document_id=document_id,
            document_url=doc_url,
            title="Updated Document",
            operation="docs.replace_text",
            content_preview=f"Replaced {changed} occurrences of '{search_text}'",
            word_count=0,
            status="success"
        )

    async def delete_doc_via_mcp(
        self,
        user_id: str,
        account_email: str,
        document_id: str,
        permanent: bool = False
    ) -> DocResult:
        """
        Moves document to trash or permanently deletes it.
        """
        print(f"[DOCS AGENT] Deleting Document ID '{document_id}' (permanent={permanent})...")
        del_args = {
            "user_id": user_id,
            "account_email": account_email,
            "document_id": document_id,
            "permanent": permanent
        }
        res = await docs_mcp.call_tool("docs_delete_document", del_args)
        if res.is_error:
            raise RuntimeError(f"FastMCP docs_delete_document failed: {res.content}")

        action = "permanently_deleted" if permanent else "moved_to_trash"
        return DocResult(
            document_id=document_id,
            document_url="",
            title="Deleted Document",
            operation="docs.delete",
            content_preview=f"Document {action}",
            word_count=0,
            status="success"
        )


async def docs_agent_execution_node(state: WorkflowState) -> Dict[str, Any]:
    """
    LangGraph execution node: Invokes DocsAgent to carry out Google Docs operations
    according to the supervisor's structured plan.
    """
    user_id = state.get("user_id", "")
    account_email = state.get("account_email", "")
    request = state.get("request", "")
    business_context = state.get("business_context", {})
    plan = state.get("plan", {})
    sheet_result = state.get("sheet_result")

    agent = DocsAgent()

    # Inspect plan steps to determine target operation and parameters
    doc_title = None
    target_doc_id = None
    operation_mode = "create_and_write"
    search_text = None
    replace_text = None
    explicit_text = None
    has_create_step = False

    if plan and "steps" in plan:
        for step in plan["steps"]:
            cap = step.get("capability", "")
            if "docs" in cap:
                params = step.get("parameters", {})
                if cap == "docs.create":
                    has_create_step = True
                    doc_title = params.get("title", doc_title)
                    explicit_text = params.get("initial_text", explicit_text)
                    operation_mode = "create_and_write"
                elif cap == "docs.read":
                    target_doc_id = params.get("document_id", target_doc_id)
                    operation_mode = "read"
                elif cap in ("docs.write", "docs.append"):
                    target_doc_id = params.get("document_id", target_doc_id)
                    explicit_text = params.get("text", explicit_text)
                    if not has_create_step and is_valid_google_doc_id(target_doc_id):
                        operation_mode = "append"
                    else:
                        operation_mode = "create_and_write"
                elif cap == "docs.replace_text":
                    target_doc_id = params.get("document_id", target_doc_id)
                    search_text = params.get("search_text")
                    replace_text = params.get("replace_text")
                    operation_mode = "replace_text"
                elif cap == "docs.delete":
                    target_doc_id = params.get("document_id", target_doc_id)
                    operation_mode = "delete"

    # Extract document title from request if not explicitly specified in plan
    if not doc_title or doc_title in ("sales", "document", "new_document"):
        title_match = re.search(r'(?:called|named|document|doc)\s*["\']?([^"\'\s]+\.(?:docx|doc|txt))["\']?', request, re.I)
        if not title_match:
            title_match = re.search(r'["\']([^"\']+\.(?:docx|doc|txt))["\']', request)
        if title_match:
            doc_title = title_match.group(1).strip()

    # If the target ID is a DAG step placeholder (e.g. 'step_2_id', 'step_1', '<doc_id>'),
    # or if creation was requested, guarantee create_and_write mode
    req_lower = request.lower()
    if has_create_step or "create" in req_lower or "new document" in req_lower or not is_valid_google_doc_id(target_doc_id):
        if operation_mode in ("append", "write"):
            operation_mode = "create_and_write"

    # Execute according to validated operation mode
    if operation_mode == "read" and is_valid_google_doc_id(target_doc_id):
        doc_result = await agent.read_doc_via_mcp(
            user_id=user_id,
            account_email=account_email,
            document_id=target_doc_id
        )
    elif operation_mode == "append" and is_valid_google_doc_id(target_doc_id):
        text_to_append = explicit_text or request
        doc_result = await agent.append_to_doc_via_mcp(
            user_id=user_id,
            account_email=account_email,
            document_id=target_doc_id,
            text=text_to_append
        )
    elif operation_mode == "replace_text" and is_valid_google_doc_id(target_doc_id) and search_text:
        doc_result = await agent.replace_text_via_mcp(
            user_id=user_id,
            account_email=account_email,
            document_id=target_doc_id,
            search_text=search_text,
            replace_text=replace_text or ""
        )
    elif operation_mode == "delete" and is_valid_google_doc_id(target_doc_id):
        doc_result = await agent.delete_doc_via_mcp(
            user_id=user_id,
            account_email=account_email,
            document_id=target_doc_id
        )
    else:
        # Default & Safe Fallback: Create and write new document
        # If sheet_result exists with insights, provide as supporting data
        supporting_data = None
        if sheet_result:
            supporting_data = (
                f"Spreadsheet Title: {sheet_result.get('title')}\n"
                f"URL: {sheet_result.get('spreadsheet_url')}\n"
                f"Data Insights: {sheet_result.get('insights')}\n"
                f"Summary Metrics: {json.dumps(sheet_result.get('summary_metrics', {}))}"
            )

        composed = agent.compose_document_content(
            request=request,
            business_context=business_context,
            supporting_data=supporting_data
        )

        # Determine if explicit_text is genuine user content or an LLM template placeholder
        is_placeholder_text = False
        if explicit_text:
            text_strip = explicit_text.strip()
            if text_strip.startswith("<") or text_strip.endswith(">") or "placeholder" in text_strip.lower() or "generated" in text_strip.lower():
                is_placeholder_text = True

        final_title = doc_title or composed.title
        final_body = composed.formatted_body if (not explicit_text or is_placeholder_text) else explicit_text

        doc_result = await agent.create_and_write_doc_via_mcp(
            user_id=user_id,
            account_email=account_email,
            title=final_title,
            content=final_body
        )

    outcomes = list(state.get("tool_outcomes", []))
    outcomes.append({
        "step_id": "docs_specialist_execution",
        "capability": doc_result.operation,
        "status": "succeeded",
        "resource_id": doc_result.document_id,
        "data": doc_result.model_dump()
    })

    return {
        "docs_result": doc_result.model_dump(),
        "tool_outcomes": outcomes,
        "status": "executing_docs"
    }
