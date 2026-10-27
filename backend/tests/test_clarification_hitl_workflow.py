import os
import sys
import asyncio

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from agents.supervisior.node import SupervisorAgent
import workflow_service

TEST_BUSINESS_CONTEXT = {
    "business_name": "AxiomFlow Global",
    "email": "operations@axiomflow.com",
    "account_email": "chillalyash2005@gmail.com",
    "website_url": "https://axiomflow.com"
}


def test_supervisor_detects_insufficient_information():
    """Verifies that an underspecified prompt triggers is_sufficient=False and asks questions."""
    request = "Coordinate milestone sync on Google Calendar with Meet link."
    agent = SupervisorAgent()
    assessment = agent.assess_sufficiency(request=request, business_context=TEST_BUSINESS_CONTEXT)

    assert assessment.is_sufficient is False, "Expected prompt to be marked underspecified"
    assert len(assessment.questions) >= 1, "Expected clarification questions"
    assert assessment.missing_fields is not None and len(assessment.missing_fields) >= 1
    print(f"\n[PASS] Supervisor generated {len(assessment.questions)} questions: {assessment.questions}")


async def test_workflow_service_clarification_synchronization():
    """Verifies that workflow service pauses and unblocks when clarification answers are submitted."""
    task_id = "TSK_TEST_CLARIFY_01"
    workflow_service.ACTIVE_WORKFLOWS[task_id] = {
        "task_id": task_id,
        "query": "Coordinate team milestone sync on Google Calendar with Meet conference link.",
        "user_id": "usr_test",
        "business_id": 2,
        "account_email": "chillalyash2005@gmail.com",
        "status": "running",
        "start_time": 0,
        "steps": workflow_service.create_initial_workflow_steps("test query"),
        "current_step_index": 0
    }

    mock_assessment = {
        "is_sufficient": False,
        "missing_fields": ["meeting_time", "attendees"],
        "questions": [
            "What is the scheduled date and time for the team milestone sync?",
            "Who are the attendee email addresses?"
        ],
        "reasoning": "Meeting time and attendees missing."
    }

    # Put workflow in waiting clarification state
    workflow_service.set_workflow_waiting_clarification(task_id, mock_assessment)
    assert workflow_service.ACTIVE_WORKFLOWS[task_id]["status"] == "waiting_clarification"
    assert workflow_service.ACTIVE_WORKFLOWS[task_id]["steps"][0]["status"] == "waiting"

    # Status check
    st = workflow_service.get_workflow_status(task_id)
    assert st["status"] == "waiting_clarification"
    assert st["clarification_needed"]["questions"] == mock_assessment["questions"]

    # Submit user answers asynchronously
    answers = {
        "question_1": "Tomorrow at 4:00 PM IST",
        "question_2": "team-lead@axiomflow.com, alex@partner.com"
    }

    ok = workflow_service.submit_clarification_answers(task_id, answers, raw_answer="Tomorrow 4pm with team-lead@axiomflow.com")
    assert ok is True
    assert workflow_service.get_clarification_answers(task_id) == answers

    # Verify event was signaled
    event = workflow_service.get_or_create_clarification_event(task_id)
    assert event.is_set() is True
    print("[PASS] Workflow service clarification pause and resume verified successfully.")


def test_supervisor_plan_incorporates_clarification_answers():
    """Verifies that SupervisorAgent.generate_plan utilizes clarification answers."""
    request = "Coordinate milestone sync on Google Calendar with Meet link."
    answers = {
        "question_1": "28th October 2026 at 4:00 PM IST",
        "question_2": "vip-client@enterprise.com",
        "question_3": "Review quarterly deliverables and cloud architecture"
    }

    agent = SupervisorAgent()
    plan = agent.generate_plan(
        request=request,
        business_context=TEST_BUSINESS_CONTEXT,
        clarification_answers=answers
    )

    assert plan is not None
    assert len(plan.steps) >= 1
    print(f"\n[PASS] Plan successfully generated with clarification answers: {plan.intent}")
    for s in plan.steps:
        print(f"  Step: {s.capability} -> {s.description}")


if __name__ == "__main__":
    test_supervisor_detects_insufficient_information()
    asyncio.run(test_workflow_service_clarification_synchronization())
    test_supervisor_plan_incorporates_clarification_answers()
    print("\nALL CLARIFICATION HITL TESTS PASSED!")
