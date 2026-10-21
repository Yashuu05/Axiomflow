import os
import sys
import time
import pytest
from fastapi.testclient import TestClient

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from main import app
import workflow_service

client = TestClient(app)

def test_guardrail_refusal_terminal_notification():
    """
    Test Case 1: Out-of-scope/policy violating query.
    Pipeline should immediately halt at Step 1, log Failure in MySQL, and emit 1 failed notification.
    """
    query = "explain me what is Agentic AI and its future in 2030"
    res = client.post("/api/workflow/run", json={
        "query": query,
        "user_id": "usr_72b30e7cd49e49e5",
        "business_id": 2,
        "auto_approve": True
    })
    assert res.status_code == 200
    data = res.json()
    task_id = data["task_id"]
    assert task_id.startswith("TSK_")

    # Poll status until terminated (allow up to 50s for LLM network latency / fallback)
    max_wait = 50
    start = time.time()
    final_status = None
    status_data = None

    while time.time() - start < max_wait:
        st_res = client.get(f"/api/workflow/status/{task_id}")
        assert st_res.status_code == 200
        status_data = st_res.json()
        final_status = status_data["status"]
        if final_status in ("failed", "rejected", "completed"):
            break
        time.sleep(1)

    assert final_status == "failed"
    assert status_data["steps"][0]["status"] == "failed"
    assert "safety" in status_data["steps"][0]["subtitle"].lower() or "guardrail" in status_data["steps"][0]["subtitle"].lower()

    # Verify logs table updated in MySQL
    logs_res = client.get(f"/api/logs?search={task_id}")
    assert logs_res.status_code == 200
    logs = logs_res.json()["logs"]
    assert len(logs) > 0
    assert logs[0]["status"] == "Failed"
    assert "PolicyEthicsGuardrail" in logs[0]["agent_name"]

    # Verify notifications table has terminal notification
    notifs_res = client.get("/api/notifications?limit=5")
    assert notifs_res.status_code == 200
    notifs = notifs_res.json()["notifications"]
    # At least one notification exists for this task failure
    matching_notifs = [n for n in notifs if task_id in n["message"]]
    assert len(matching_notifs) == 1
    assert matching_notifs[0]["status"] == "failed"


def test_hitl_approval_web_gateway():
    """
    Test Case 2: Human-in-the-Loop review and approval gateway via Web API.
    Workflow pauses at Step 4 awaiting supervisor approval, then resumes upon /api/workflow/approve.
    """
    query = "Schedule meeting with finance team on 26th Oct 2026 at 4:00 PM for 30 minutes with yashvary13@gmail.com and send email."
    res = client.post("/api/workflow/run", json={
        "query": query,
        "user_id": "usr_72b30e7cd49e49e5",
        "business_id": 2,
        "auto_approve": False
    })
    assert res.status_code == 200
    task_id = res.json()["task_id"]

    # Poll until reached waiting_approval (allow up to 120s for external LLM fallback/network)
    max_wait = 120
    start = time.time()
    reached_approval = False
    status_data = None

    while time.time() - start < max_wait:
        st_res = client.get(f"/api/workflow/status/{task_id}")
        assert st_res.status_code == 200
        status_data = st_res.json()
        if status_data["status"] == "waiting_approval":
            reached_approval = True
            break
        elif status_data["status"] in ("failed", "completed"):
            break
        time.sleep(2)

    assert reached_approval, f"Workflow did not reach waiting_approval state. Current status: {status_data['status']}"
    assert status_data["steps"][3]["status"] == "waiting"
    assert status_data["email_draft"] is not None
    assert "to" in status_data["email_draft"]

    # Submit supervisor approval
    appr_res = client.post("/api/workflow/approve", json={
        "task_id": task_id,
        "decision": "accepted"
    })
    assert appr_res.status_code == 200
    assert appr_res.json()["success"] is True

    # Poll until workflow finishes execution
    start = time.time()
    completed = False
    while time.time() - start < 45:
        st_res = client.get(f"/api/workflow/status/{task_id}")
        status_data = st_res.json()
        if status_data["status"] == "completed":
            completed = True
            break
        time.sleep(2)

    assert completed, f"Workflow did not complete after approval. Current status: {status_data['status']}"
    assert status_data["steps"][3]["status"] == "completed"
    assert status_data["steps"][4]["status"] == "completed"
    assert status_data["steps"][5]["status"] == "completed"

    # Verify logs table in MySQL
    logs_res = client.get(f"/api/logs?search={task_id}")
    assert logs_res.status_code == 200
    logs = logs_res.json()["logs"]
    assert len(logs) > 0
    assert logs[0]["status"] == "Completed"

    # Verify notifications table has exactly 1 terminal notification
    notifs_res = client.get("/api/notifications?limit=10")
    assert notifs_res.status_code == 200
    notifs = notifs_res.json()["notifications"]
    matching_notifs = [n for n in notifs if task_id in n["message"]]
    assert len(matching_notifs) == 1
    assert matching_notifs[0]["status"] == "succeeded"


def test_workflow_pause_and_resume():
    """
    Test Case 3: Interactive Pause and Resume Controls.
    Verifies that calling /api/workflow/pause halts progression and /api/workflow/resume unblocks it.
    """
    query = "Schedule meeting with finance team on 26th Oct 2026 at 4:00 PM for 30 minutes with yashvary13@gmail.com and send email."
    res = client.post("/api/workflow/run", json={
        "query": query,
        "user_id": "usr_72b30e7cd49e49e5",
        "business_id": 2,
        "auto_approve": True
    })
    assert res.status_code == 200
    task_id = res.json()["task_id"]

    # Pause immediately
    pause_res = client.post("/api/workflow/pause", json={"task_id": task_id})
    assert pause_res.status_code == 200
    assert pause_res.json()["success"] is True

    # Check status reports is_paused = True
    st_res = client.get(f"/api/workflow/status/{task_id}")
    assert st_res.status_code == 200
    assert st_res.json()["is_paused"] is True

    # Resume workflow
    resume_res = client.post("/api/workflow/resume", json={"task_id": task_id})
    assert resume_res.status_code == 200
    assert resume_res.json()["success"] is True

    # Check status reports is_paused = False
    st_res2 = client.get(f"/api/workflow/status/{task_id}")
    assert st_res2.status_code == 200
    assert st_res2.json()["is_paused"] is False


def test_workflow_stop_interruption():
    """
    Test Case 4: Stop / Abort Interruption.
    Verifies that calling /api/workflow/stop immediately halts the task, sets status to failed,
    and updates axiomflow_db.logs.
    """
    query = "Schedule meeting with finance team on 26th Oct 2026 at 4:00 PM for 30 minutes with yashvary13@gmail.com and send email."
    res = client.post("/api/workflow/run", json={
        "query": query,
        "user_id": "usr_72b30e7cd49e49e5",
        "business_id": 2,
        "auto_approve": False
    })
    assert res.status_code == 200
    task_id = res.json()["task_id"]

    # Call stop
    stop_res = client.post("/api/workflow/stop", json={"task_id": task_id})
    assert stop_res.status_code == 200
    assert stop_res.json()["success"] is True

    # Status should reflect failure / stopped
    st_res = client.get(f"/api/workflow/status/{task_id}")
    assert st_res.status_code == 200
    data = st_res.json()
    assert data["status"] == "failed"
    assert data["is_stopped"] is True
