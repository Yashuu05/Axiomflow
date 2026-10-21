# Implementation Plan: Integrating Agentic AI Pipeline with AxiomFlow Dashboard

## 1. Executive Summary & Context

In previous development and testing phases, four core end-to-end test suites were successfully validated using `pytest`:
1. **TEST 1: Gmail + Calendar** (`test_agent_pipeline_terminal.py`) — Natural language meeting scheduling, time window normalization, Google Meet video link generation, and Gmail notification.
2. **TEST 2: Gmail + Sheets** (`test_sheets_email_pipeline.py`) — Financial data analysis, Google Sheets creation and population, CSV export, and email delivery.
3. **TEST 3: Gmail + Sheets + Calendar** (`test_multi_agent_sheets_calendar_gmail.py`) — Multi-agent cooperation coordinating simultaneous spreadsheet generation, calendar scheduling, and executive email dispatch.
4. **TEST 4: Agentic AI Ethics & Guardrails** (`test_policies_ethics_guardrails.py`) — Multi-layer safety policies, boundary enforcement, and deterministic refusal of out-of-scope or hostile requests.

The mock data across all dashboard components has been removed, and the tabs are connected to the AWS RDS MySQL `axiomflow_db` database. 

**Current Objective:** Smoothly integrate the validated **Agentic AI Pipeline** with the **frontend dashboard (user interface)**, enabling real-time human interaction, live DAG execution streaming, runtime audit logging to `axiomflow_db.logs`, and post-execution alert triggering to `axiomflow_db.notifications`.

---

## 2. System Architecture & Component Mapping

```mermaid
flowchart TD
    subgraph Frontend["Frontend Dashboard (Next.js 16 / TypeScript)"]
        UI_COMPOSER["Workflow Tab Composer\n(Natural Language Input)"]
        UI_RUNNING["Workflow Running View\n(StepTimeline + StepDetail + RadialDotsSpinner)"]
        UI_HITL["Human Approval Card\n(Approve / Reject / Edit Draft)"]
        UI_LOGS["Logs Tab\n(Real-time Audit Telemetry Table)"]
        UI_NOTIFS["DashboardHeader\n(Alerts & Notifications Popover)"]
        UI_CONNECT["Connect Tab\n(Google Workspace OAuth Status)"]
    end

    subgraph BackendAPI["FastAPI Orchestration Backend (Python 3.10)"]
        EP_RUN["POST /api/workflow/run"]
        EP_STATUS["GET /api/workflow/status/{task_id}"]
        EP_APPROVE["POST /api/workflow/approve"]
        EP_LOGS["GET /api/logs"]
        EP_NOTIFS["GET /api/notifications"]
        SVC["workflow_service.py\n(Runtime Coordinator & Polling Engine)"]
    end

    subgraph AgenticPipeline["Agentic AI Pipeline (LangGraph State Machine)"]
        NODE_CTX["retrieve_context"]
        NODE_UNDERSTAND["understand & policies_ethics"]
        NODE_CLARIFY["clarify_hitl"]
        NODE_PLAN["plan (SupervisorAgent)"]
        NODE_CAL["execute_calendar (CalendarAgent)"]
        NODE_SHEET["execute_sheet (SheetAgent)"]
        NODE_CONTENT["draft_email (EmailContentAgent)"]
        NODE_APPROVAL["email_consent_hitl"]
        NODE_REVISE["revise_email"]
        NODE_GMAIL["execute_gmail (FastMCP)"]
        NODE_SUMMARIZE["summarize"]
    end

    subgraph Database["AWS RDS MySQL (axiomflow_db)"]
        DB_USERS[("users")]
        DB_BIZ[("business_profile")]
        DB_OAUTH[("oauth_connections")]
        DB_LOGS[("logs\n(Runtime updates per node)")]
        DB_NOTIFS[("notifications\n(Triggered ONLY on termination)")]
    end

    %% Interactions
    UI_COMPOSER -->|1. Submit Objective| EP_RUN
    EP_RUN --> SVC
    SVC -->|2. Stream Execution| AgenticPipeline
    AgenticPipeline --> NODE_CTX --> NODE_UNDERSTAND --> NODE_PLAN
    NODE_PLAN --> NODE_CAL
    NODE_PLAN --> NODE_SHEET
    NODE_CAL --> NODE_CONTENT
    NODE_SHEET --> NODE_CONTENT
    NODE_CONTENT --> NODE_APPROVAL
    NODE_APPROVAL -->|Needs Consent| UI_HITL
    UI_HITL -->|Approve/Reject| EP_APPROVE
    EP_APPROVE --> SVC
    NODE_APPROVAL -->|Approved| NODE_GMAIL
    NODE_GMAIL --> NODE_SUMMARIZE

    %% Real-time DB Updates
    SVC -.->|Simultaneous Runtime Logging| DB_LOGS
    DB_LOGS -.->|Real-time telemetry poll| UI_LOGS
    
    %% Terminal Notifications
    NODE_SUMMARIZE -.->|On Completion/Error ONLY| DB_NOTIFS
    DB_NOTIFS -.->|Fetch terminal alerts| UI_NOTIFS

    %% Telemetry Stream
    SVC -.->|Status Polling (1.5s)| UI_RUNNING
```

---

## 3. End-to-End User Interaction Flow

### 3.1 Initiating Workflow from Dashboard
1. The user logs in to the dashboard and opens the **Workflow** tab (the central operational workspace).
2. The user states their operational intent in natural language (e.g., *"Schedule meeting of 'Revenue discussion' to only finance team on 20/10/2026 at 10:00 a.m and prepare summary spreadsheet"*).
3. The frontend issues a `POST /api/workflow/run` request containing `query`, `user_id`, and `business_id`.
4. The backend initializes a unique `task_id` (`TSK_XXXXXXXX`), creates the initial running record in `axiomflow_db.logs`, and begins asynchronous pipeline execution.
5. The frontend transitions immediately from *Before Run* to *Active Workflow*, opening the live execution timeline.

### 3.2 Runtime Execution & Simultaneous Logging
1. As the pipeline progresses through LangGraph nodes, `workflow_service.py` intercepts each node event:
   - **`retrieve_context`**: Loads company profile & user roles from `business_profile` and `users`.
   - **`understand`**: Runs ethics and safety policies (`PolicyEthicsGuardrail`). If prohibited or out-of-scope, halts with immediate refusal explanation.
   - **`plan`**: Supervisor Agent analyzes intent, temporal anchors (`Asia/Kolkata`), and emits structured DAG plan.
   - **`execute_calendar` / `execute_sheet`**: FastMCP tools interact with Google Calendar (booking event + Meet link) and Google Sheets (inserting rows + generating CSV).
   - **`draft_email`**: Synthesizes formal email draft personalized with participant details, meet link, and sheet attachments.
2. **Simultaneous Database Updates**: During runtime, `workflow_service.py` updates the `logs` table in `axiomflow_db` as tasks and steps emit events. When the user switches to or views the **Logs** tab, the real-time activity and runtime duration are visible immediately.

### 3.3 Human-in-the-Loop (HITL) Supervisory Gateway
1. When the email draft is synthesized, node `email_consent_hitl` is reached.
2. The workflow pauses in `waiting_approval` status.
3. The frontend displays the interactive `ApprovalCard` within `StepDetail`:
   - Shows recipient email addresses, subject line, Google Meet URL, and generated email body.
   - User has three options:
     - **Approve & Send**: Authorizes transmission. Backend proceeds to `execute_gmail` via FastMCP.
     - **Reject & Abort**: Rejects outbound dispatch. Pipeline halts cleanly at `abort_rejected` with zero emails dispatched.
     - **Edit Draft**: Allows supervisor to modify email copy directly in the UI before approving.

### 3.4 Terminal Notification Triggering
- **Strict Rule**: Unlike `logs` (which update continuously in runtime), `notifications` are **only triggered after runtime execution terminates**, either due to:
  - `status = "completed"`: e.g., *"Workflow task TSK_7E52C811 completed successfully in 14.2s."*
  - `status = "failed"` or `"rejected"`: e.g., *"Workflow task TSK_12C2439D halted: Policy check failed."*
- These notifications appear in the header notification bell popover.

---

## 4. Technical Implementation Phases

### Phase 1: LangGraph Streaming & Event Bridge (`backend/workflow_service.py`)
- Refactor `workflow_service.py` to drive the actual compiled LangGraph `build_workflow_graph()`.
- Use an asynchronous runner that steps through graph execution or streams state transitions via `graph.astream()`.
- Capture node outputs:
  - `retrieve_context` -> `business_context`
  - `understand` -> `sufficiency_assessment`, `policy_check`
  - `plan` -> `plan.steps`, `plan.identified_services`
  - `execute_calendar` -> `calendar_event` (event ID, start/end time, meet link, attendees)
  - `execute_sheet` -> `sheet_result` (spreadsheet ID, title, URL, row count, CSV content)
  - `draft_email` -> `email_draft` (to, subject, body, meet link, attachments)
  - `email_consent_hitl` -> pause for user signal
  - `execute_gmail` -> `gmail_outcome` (message ID, delivery status)
  - `summarize` -> `final_response`
- Map graph nodes to the 6 dashboard timeline steps:
  1. Evaluate Intent & Guardrails
  2. Synthesize Execution Plan
  3. Execute Specialist Tool Operations
  4. Email Drafting & Human Sign-off
  5. Secure Dispatch & Synchronization
  6. Audit Telemetry Recording

### Phase 2: Runtime Telemetry & Database Synchronization
- **Simultaneous Logging**: Implement `record_log()` calls at each stage:
  - On task start: Insert record with `status = 'Running'`.
  - On tool completion: Update record with tool outcome and interim status.
  - On final summary: Update record with `status = 'Completed'`, final description, total `time_taken` (numeric float in seconds), and `agent_name`.
  - On policy violation or error: Update record with `status = 'Failed'` and refusal reason.
- **Terminal Notifications Only**:
  - Guarantee that `record_notification()` is called **only** in the terminal blocks (`completed`, `failed`, `rejected`), with clean date and time timestamps.

### Phase 3: Interactive Workspace Controls in Dashboard
- Ensure all interactive controls in `WorkflowRunningView.tsx` and `WorkflowView.tsx` work seamlessly:
  - **Pause**: Halts the client timer and signals the backend coordinator to pause before invoking the next tool node.
  - **Resume**: Resumes the workflow runner.
  - **Stop**: Aborts the active task and logs clean termination to `axiomflow_db.logs`.
  - **Approve**: Sends `{ task_id, decision: "accepted" }` to `/api/workflow/approve`.
  - **Reject**: Sends `{ task_id, decision: "rejected" }` to `/api/workflow/approve`.
  - **Edit Draft**: Sends `{ task_id, decision: "updated", edited_body: "..." }`.

### Phase 4: UI Telemetry & Real-Time Artifact Display
- In `StepDetail.tsx`:
  - Render real-time generated artifacts:
    - Google Meet link badge with clickable link.
    - Google Spreadsheet link with row count and preview.
    - Outbound email draft with editable body.
  - Display actual model reasoning emitted by the supervisor and specialists.
  - Display live event logs with `Asia/Kolkata` timestamps.

### Phase 5: Verification & End-to-End Testing
- Execute 4 test suites through the integrated dashboard API:
  - **Test Case A**: Calendar + Email (`Schedule revenue meeting...`) -> Verify event in Google Calendar, drafted email, approval, and Gmail send.
  - **Test Case B**: Sheets + Email (`Generate sales report...`) -> Verify sheet creation in Google Sheets, CSV attachment, and email send.
  - **Test Case C**: Multi-Agent Calendar + Sheets + Email -> Verify simultaneous execution of all specialists.
  - **Test Case D**: Ethics / Out-of-Scope Query (`explain me what is Agentic AI`) -> Verify prompt policy rejection, refusal message, and failure logging in `axiomflow_db.logs`.
- Confirm `axiomflow_db.logs` contains real-time entries and `axiomflow_db.notifications` receives records **only** on termination.

---

## 5. Verification Checklist

| Criterion | Target Behavior | Validation Method |
| :--- | :--- | :--- |
| **Agentic AI Pipeline Integration** | Real LangGraph state machine executes specialist agents & FastMCP tools | Trace execution graph nodes from `main.py` -> `workflow_service.py` -> `graph.py` |
| **Simultaneous Runtime Logging** | `logs` table in `axiomflow_db` updates during runtime execution | Query RDS MySQL `logs` table while workflow is running |
| **Terminal Notifications Only** | `notifications` table is triggered ONLY upon `completed` or `failed` termination | Verify 0 notifications during execution; 1 notification on finish |
| **Workflow Interactivity** | Initiate, pause, resume, stop, approve, reject, edit from UI | Interactive manual & automated TestClient testing |
| **Data Fallbacks** | Clean `no data available` or `---` when no task is active | Check UI render before initiating any query |
