import os
import sys
import json
import asyncio
from dotenv import load_dotenv

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

load_dotenv()

from tools.gmail_tools import gmail_mcp, gmail_send_email


async def test_send_email_via_fastmcp():
    """
    Test sending an email using the FastMCP tool interface on behalf of the authorized user.
    Uses non-confidential sample data for a business project update.
    """
    user_id = "usr_72b30e7cd49e49e5"
    account_email = "chillalyash2005@gmail.com"
    recipient = "yashvary13@gmail.com"

    sample_subject = "AxiomFlow Automated Workflow Test: Business Notification"
    sample_body = (
        "Hello,\n\n"
        "This is an automated test notification sent by the AxiomFlow platform "
        "via FastMCP tool execution.\n\n"
        "Status: System operational and tool verification in progress.\n\n"
        "Best regards,\n"
        "AxiomFlow Automation Team"
    )

    print("=" * 80)
    print("TESTING GMAIL SEND VIA FASTMCP TOOL")
    print("=" * 80)
    print(f"Sender (Authorized Account): {account_email}")
    print(f"Recipient:                   {recipient}")
    print(f"Subject:                     {sample_subject}")
    print(f"Body:\n{sample_body}\n")
    print("-" * 80)
    print("Invoking 'gmail_send_email' tool through FastMCP...")

    # Call tool via FastMCP server call_tool
    tool_args = {
        "user_id": user_id,
        "account_email": account_email,
        "to": [recipient],
        "subject": sample_subject,
        "body": sample_body,
        "cc": [],
        "bcc": []
    }

    try:
        mcp_result = await gmail_mcp.call_tool("gmail_send_email", tool_args)
        print("\n[FastMCP Response Received]:")
        print(f"is_error: {mcp_result.is_error}")
        print(f"structured_content: {json.dumps(mcp_result.structured_content, indent=2)}")
        print(f"content: {mcp_result.content}")

        assert not mcp_result.is_error, "FastMCP tool execution reported an error"
        result_data = mcp_result.structured_content or {}
        # In FastMCP, result data may be under 'result' key or direct dict
        payload = result_data.get("result", result_data)

        print("\n[SUCCESS] Email successfully dispatched via Gmail API through FastMCP!")
        print(f"Message ID: {payload.get('message_id')}")
        print(f"Thread ID:  {payload.get('thread_id')}")
        print("=" * 80)
        return payload

    except Exception as e:
        print(f"\n[ERROR] Failed to execute gmail_send_email via FastMCP: {str(e)}")
        raise


if __name__ == "__main__":
    asyncio.run(test_send_email_via_fastmcp())
