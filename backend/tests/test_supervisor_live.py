import os
import sys
import json
from dotenv import load_dotenv

# Ensure backend root is on sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

load_dotenv()

from agents.supervisior.node import SupervisorAgent
from agents.supervisior.schemas import SupervisorPlan

def test_supervisor_planning_with_user_example():
    """
    Tests the Planner/Supervisor Agent on the exact user prompt:
    "send email to finance team regrading important Q2 result dicussion and future revenue growth dicussions.
    Meeting will be held on 20th November at 10:00 for 2 hours with CFO and  CEO".
    """
    user_request = (
        "send email to finance team regrading important Q2 result dicussion and future revenue growth dicussions. "
        "Meeting will be held on 20th November at 10:00 a.m for 2 hours with CFO and CEO"
    )

    print("=" * 80)
    print("TESTING SUPERVISOR / PLANNER AGENT WITH GEMINI-3.8-FLASH & STREAMING")
    print("=" * 80)
    print(f"\nUser Input Request:\n\"{user_request}\"\n")

    agent = SupervisorAgent(model_name="gemini-3.8-flash")

    print("\n--- [STREAMING CHUNKS IN REAL-TIME] ---")
    chunk_count = 0
    stream_generator = agent.stream_plan_chunks(
        request=user_request,
        user_id="usr_72b30e7cd49e49e5",
        account_email="chillalyash2005@gmail.com"
    )

    try:
        while True:
            chunk = next(stream_generator)
            chunk_count += 1
            print(chunk, end="", flush=True)
    except StopIteration as stop:
        plan: SupervisorPlan = stop.value

    print("\n\n" + "=" * 80)
    print("STRUCTURED PLAN GENERATED & VALIDATED")
    print("=" * 80)
    print(f"Goal: {plan.goal}")
    print(f"Intent: {plan.intent}")
    print(f"Identified Services: {plan.identified_services}")
    print(f"Reasoning: {plan.reasoning}\n")

    print("Plan Steps:")
    for idx, step in enumerate(plan.steps, 1):
        dep_str = f" [Depends on: {', '.join(step.depends_on)}]" if step.depends_on else ""
        appr_str = " [APPROVAL REQUIRED]" if step.requires_approval else ""
        print(f"  {idx}. [{step.id}] {step.capability} (Risk: {step.risk}){appr_str}{dep_str}")
        print(f"     Description: {step.description}")
        if step.parameters:
            print(f"     Parameters: {json.dumps(step.parameters)}")

    # Verification assertions
    assert len(plan.steps) > 0, "Plan must contain at least one step"
    capabilities = [s.capability for s in plan.steps]

    # Verify key capabilities
    assert any("calendar" in c for c in capabilities), "Plan must include calendar scheduling or availability check"
    assert any("draft" in c for c in capabilities), "Plan must include email drafting"
    assert any("gmail.send" in c for c in capabilities), "Plan must include gmail.send step"

    # Verify approval gate on gmail.send and calendar.create_event
    for step in plan.steps:
        if step.capability in ("gmail.send", "calendar.create_event"):
            assert step.requires_approval is True, f"{step.capability} must require approval"
            assert step.risk == "external_side_effect"

    print("\n[SUCCESS] All Supervisor Agent assertions and plan validations passed!")
    return plan

if __name__ == "__main__":
    test_supervisor_planning_with_user_example()
