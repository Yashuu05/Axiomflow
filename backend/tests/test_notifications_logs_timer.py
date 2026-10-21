import os
import sys
import pytest
from fastapi.testclient import TestClient

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from main import app
import workflow_service
import notification_service

@pytest.fixture
def client():
    return TestClient(app)

def test_phase1_notifications_fetch_and_format(client):
    """Verifies that notifications from axiomflow_db are fetched and properly formatted."""
    res = client.get("/api/notifications?limit=10")
    assert res.status_code == 200
    data = res.json()
    assert "notifications" in data
    assert isinstance(data["notifications"], list)
    if len(data["notifications"]) > 0:
        notif = data["notifications"][0]
        assert "id" in notif
        assert "date" in notif
        assert "time" in notif
        assert "message" in notif
        assert "status" in notif

def test_phase2_logs_store_each_step_of_workflow(client):
    """
    Verifies that logs table stores individual records for each step of a workflow
    rather than overwriting with a single log record.
    """
    test_task_id = "TSK_TEST_STEP_VERIFICATION"
    test_query = "Automated test query for multi-step logging"

    # Log Step 1
    s1_id = workflow_service.record_log(
        task_id=test_task_id,
        query=test_query,
        status="Completed",
        description="Step 1: Evaluated safety policies and guardrails",
        agent_name="PolicyEthicsGuardrail",
        llm_name="gemini-3.8-flash",
        time_taken=0.8
    )
    assert s1_id is not None

    # Log Step 2
    s2_id = workflow_service.record_log(
        task_id=test_task_id,
        query=test_query,
        status="Completed",
        description="Step 2: Synthesized DAG plan with 2 stages",
        agent_name="SupervisorAgent",
        llm_name="gemini-3.8-flash",
        time_taken=1.5
    )
    assert s2_id is not None
    assert s2_id != s1_id

    # Log Step 3
    s3_id = workflow_service.record_log(
        task_id=test_task_id,
        query=test_query,
        status="Completed",
        description="Step 3: Created Google Calendar meeting",
        agent_name="CalendarAgent",
        llm_name="gemini-3.8-flash",
        time_taken=2.1
    )
    assert s3_id is not None
    assert s3_id != s2_id

    # Fetch logs via API endpoint
    res = client.get(f"/api/logs?search={test_task_id}")
    assert res.status_code == 200
    logs = res.json()["logs"]
    
    # Must contain at least 3 distinct step logs for this single workflow!
    matching_steps = [l for l in logs if l["task_id"] == test_task_id]
    assert len(matching_steps) >= 3, f"Expected >= 3 step logs, got {len(matching_steps)}"
    
    # Check that each step has unique ID, distinct description, and agent name
    descriptions = [s["task_description"] for s in matching_steps]
    assert any("Step 1:" in d for d in descriptions)
    assert any("Step 2:" in d for d in descriptions)
    assert any("Step 3:" in d for d in descriptions)

def test_phase3_timer_elapsed_seconds_telemetry(client):
    """Verifies that workflow status provides numeric elapsed_seconds for smooth timer updates."""
    test_task_id = "TSK_TEST_TIMER"
    # Seed active workflow in ACTIVE_WORKFLOWS
    workflow_service.ACTIVE_WORKFLOWS[test_task_id] = {
        "task_id": test_task_id,
        "query": "Timer test query",
        "user_id": "usr_72b30e7cd49e49e5",
        "business_id": 2,
        "account_email": "chillalyash2005@gmail.com",
        "status": "running",
        "is_paused": False,
        "is_stopped": False,
        "start_time": 1000.0,
        "steps": [
            {"id": "s1", "name": "Step 1", "status": "completed"},
            {"id": "s2", "name": "Step 2", "status": "running"}
        ],
        "current_step_index": 1,
    }

    res = client.get(f"/api/workflow/status/{test_task_id}")
    assert res.status_code == 200
    st = res.json()
    assert "elapsed_seconds" in st
    assert isinstance(st["elapsed_seconds"], int)
    assert st["status"] == "running"

def test_phase4_sse_and_plyer_desktop_notifications(client):
    """Verifies test notification endpoint dispatches to DB, triggers plyer, and returns success."""
    res = client.post(
        "/api/notifications/test",
        json={
            "message": "Automated Phase 4 verification alert",
            "status": "succeeded",
            "task_id": "TSK_TEST_PHASE4"
        }
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["id"] is not None

    # Check notification appears in get /api/notifications
    notifs_res = client.get("/api/notifications?limit=5")
    assert notifs_res.status_code == 200
    recent = notifs_res.json()["notifications"]
    assert any(n["id"] == str(data["id"]) for n in recent)
