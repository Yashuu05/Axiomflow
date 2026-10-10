# Product Requirements Document (PRD)

## Intelligent Business Workflow Automation: Agentic AI Prototype

**Version:** 1.0 (Hackathon Final Round)
**Track:** Agentic AI
**Status:** Draft for prototype development

---

## 1. Overview

### 1.1 Problem Summary

Small and medium-sized businesses (SMBs) run daily operations across emails, spreadsheets, documents, messaging apps, and separate software tools. Employees lose significant time searching for information, cross-checking records, tracking pending tasks, chasing stakeholders, and copying data between systems.

Traditional automation (fixed if-then rules) cannot handle this well because real business workflows are dynamic. The next step often depends on information gathered from several sources, and conditions change while the work is in progress.

### 1.2 Product Vision

An agentic AI system that understands a business objective, gathers the information it needs from multiple sources, plans the steps, executes them with minimal manual effort, and asks a human for approval when stakes are high. It handles complete multi-step workflows, not single questions.

### 1.3 Goal of the Prototype

Demonstrate that one repetitive business workflow can be made faster, more reliable, traceable, and easier to manage.

---

## 2. Objectives and Success Criteria

| # | Objective | Measurable Success Indicator |
|---|-----------|------------------------------|
| O1 | Understand a business objective given in natural language | System converts a plain-English goal into a structured plan with at least 3 steps |
| O2 | Gather information from multiple sources | Data pulled from at least 2 source types (e.g., spreadsheet + database/CSV + email) |
| O3 | Plan and execute multi-step workflows | Workflow runs end to end without manual intervention, except at approval gates |
| O4 | Handle missing data and failed tasks | Failures are detected, logged, retried or escalated; no silent failures |
| O5 | Re-plan when conditions change | A changed input (e.g., payment received) changes the remaining plan |
| O6 | Human approval or escalation for important actions | No external communication or financial action is sent without approval |
| O7 | Audit trail | Every action, decision, and input is logged with timestamp and reason |

---

## 3. Target Users

- **Primary:** Operations or finance staff at an SMB who handle follow-ups, reminders, and record checks.
- **Secondary:** Team leads and managers who approve actions and review progress.
- **Demo audience:** Hackathon judges evaluating the agentic behavior and reliability of the system.

---

## 4. Recommended Demo Workflow

Choose one workflow and build it well. **Recommended: Overdue Invoice Follow-Up**

**Business objective:** "Collect all overdue payments from customers and keep the finance team informed."

### 4.1 Workflow Steps

1. **Understand the objective.** Parse the goal into sub-tasks: find overdue invoices, prioritize, draft reminders, get approval, send, track.
2. **Gather data.** Read the invoice register (CSV/Excel), look up customer records (database or JSON API), and check the email inbox for recent customer replies about payments.
3. **Identify overdue items.** Compare due dates with today's date. Flag invoices overdue by more than 0, 15, and 30 days.
4. **Prioritize.** Rank by amount, days overdue, and customer history (for example, a customer with 3 past late payments goes higher).
5. **Handle missing information.** If a customer has no email address, mark it "Needs contact info" and skip sending, rather than guessing.
6. **Recommend actions.** Friendly reminder for 1 to 15 days overdue, firm reminder for 16 to 30 days, escalation to the manager for over 30 days or amounts above a threshold.
7. **Generate communication.** Draft a personalized email for each invoice.
8. **Request approval.** Show the batch of drafts to a human reviewer. The reviewer approves, edits, or rejects each item.
9. **Execute.** Send approved emails (or simulate sending in the prototype). Update the invoice status to "Reminder Sent."
10. **Track resolution.** Re-check the payment register and inbox on a schedule. If paid, close the item. If a reply disputes the amount, escalate.
11. **Re-plan.** If a payment arrives after a reminder was drafted but before sending, remove that reminder from the queue and log the reason.
12. **Log everything.** Write each step to the audit trail.

---

## 5. Functional Requirements

### 5.1 Objective Understanding
- FR-1: Accept a business objective as free text.
- FR-2: Produce a structured plan (list of goals, sub-tasks, dependencies) that the user can view before execution.

### 5.2 Information Gathering
- FR-3: Connect to at least two data sources: spreadsheet (CSV/XLSX), database (SQLite or PostgreSQL), document store, or email (simulated or real via IMAP/API).
- FR-4: Normalize data into one common format (for example, a list of invoice records with customer IDs).
- FR-5: Join records across sources (for example, match invoice to customer by customer ID).

### 5.3 Planning and Execution
- FR-6: Break the objective into ordered steps with clear inputs and outputs for each step.
- FR-7: Each tool or action is a discrete function (fetch_invoices, check_payment, draft_email, send_email, update_status).
- FR-8: The agent decides the next step based on the result of the previous step, not from a fixed script.

### 5.4 Missing Data and Failures
- FR-9: Detect missing fields (email, amount, due date) and either request them, use a documented default, or skip the item and flag it.
- FR-10: Retry transient failures (for example, a timeout) up to 2 times with backoff.
- FR-11: After retries are exhausted, mark the task as failed, log the reason, and escalate to a human.

### 5.5 Dynamic Re-planning
- FR-12: Before each execution step, re-check the relevant source of truth (for example, is the invoice still unpaid?).
- FR-13: If the condition has changed, update the plan and record the change and its reason.

### 5.6 Human-in-the-Loop
- FR-14: Define a list of actions that always need approval: sending external emails, changing invoice status, any action above a set amount.
- FR-15: Provide an approval view showing proposed action, reason, and data used. Options: approve, edit, reject.
- FR-16: Actions not approved within a set time are paused, not executed.

### 5.7 Audit Trail
- FR-17: Log each event with: timestamp, step ID, action, input data summary, output, decision reason, and actor (agent or human).
- FR-18: Audit log is viewable and exportable (CSV or JSON).

### 5.8 Dashboard (Optional, Recommended for Demo)
- FR-19: Show workflow status: pending, in progress, waiting for approval, completed, failed.
- FR-20: Show a summary: total overdue amount, number of reminders sent, items escalated.

---

## 6. Non-Functional Requirements

- **Reliability:** No action is executed without a logged reason. No silent failures.
- **Safety:** External communication is never sent without approval in the prototype.
- **Traceability:** Any decision can be traced back to its inputs.
- **Usability:** A non-technical user can start a workflow and review approvals with minimal training.
- **Performance:** For a demo dataset (around 50 invoices), the full workflow completes in under 2 minutes, excluding human approval time.
- **Extensibility:** New tools or data sources can be added without rewriting the planner.

---

## 7. System Architecture (Suggested)

```
User Objective
      |
      v
+---------------------+
|  Planner (LLM)      |  <-- understands goal, creates and updates plan
+---------------------+
      |
      v
+---------------------+
|  Agent Executor     |  <-- runs one step at a time, decides next step
+---------------------+
      |
  +---+----+-----------+-----------+
  |        |           |           |
  v        v           v           v
Data     Customer    Email      Approval
Source   DB/API      Tool       Queue
(CSV)                           (Human)
      |
      v
+---------------------+
|  Audit Logger       |  --> audit_log.json / SQLite table
+---------------------+
```

**Suggested tech stack (flexible):**
- Language: Python
- LLM: any API-based model (for planning, drafting, and reasoning)
- Agent framework: LangGraph, CrewAI, or a simple custom loop with tool calling
- Data: pandas (CSV/XLSX), SQLite (database), JSON (mock API)
- Email: simulated outbox (text file or table) for the demo, with an optional SMTP integration
- UI: Streamlit or Gradio for approval view and dashboard
- Audit: SQLite table or JSON file

---

## 8. Sample Data for Demo

Create simple, realistic mock data:

- **invoices.csv:** invoice_id, customer_id, amount, due_date, status (Paid / Unpaid)
- **customers.json:** customer_id, name, email, past_late_payments
- **inbox.json:** list of simulated customer emails (for example, "I already paid last week")

Include edge cases on purpose:
- A customer with no email address
- An invoice paid after a reminder was drafted
- A customer who replies disputing the amount
- A failed email send (to show retry and escalation)

---

## 9. Workflow State Machine

```
[Objective Received]
        |
        v
[Planning] --> [Gathering Data] --> [Analysis]
                                       |
                                       v
                              [Awaiting Approval] --> (Rejected) --> [Closed: Skipped]
                                       |
                                    (Approved)
                                       v
                                  [Executing]  --> (Failed after retries) --> [Escalated]
                                       |
                                       v
                                 [Tracking]  --> (Paid) --> [Completed]
                                       |
                                       v
                             (Dispute/Changed) --> [Re-planning] --> back to [Analysis]
```

---

## 10. Scope

### In Scope (Prototype)
- One complete workflow (overdue invoice follow-up)
- Two or more data sources, with at least one simulated
- Multi-step planning with LLM-driven decisions
- Approval gate for outbound communication
- Retry, failure handling, and escalation
- Re-planning on changed data
- Audit trail with export

### Out of Scope (Prototype)
- Real payment processing or bank integration
- Production-grade authentication and multi-tenant security
- Support for more than one workflow
- Mobile app
- Full ERP integration

---

## 11. Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| LLM produces incorrect or inappropriate email text | Damage to customer relationship | Mandatory human approval; template-based fallback |
| Agent takes actions without reason | Loss of trust | Every action requires a logged reason; approval gates |
| Data sources are inconsistent | Wrong matching of invoices and customers | Validation step and clear flagging of mismatches |
| Scope too large for the time limit | Incomplete demo | Build one workflow end to end before adding features |
| Live API or email fails during demo | Demo breaks | Use simulated sources with a recorded fallback |

---

## 12. Milestones (Suggested for a Hackathon Timeline)

| Phase | Deliverable |
|-------|-------------|
| Hour 0 to 2 | Finalize workflow, data schema, and mock data |
| Hour 2 to 6 | Build data loading, overdue detection, and prioritization |
| Hour 6 to 10 | Implement planner, tool calls, and drafting of emails |
| Hour 10 to 14 | Add approval gate, retries, and escalation |
| Hour 14 to 18 | Add re-planning, audit log, and dashboard |
| Hour 18 to 22 | Testing with edge cases, polish UI |
| Hour 22 to 24 | Demo script, presentation slides, and backup recording |

*Adjust these to the actual duration of the final round.*

---

## 13. Demo Script (For Judges)

1. Enter the objective: "Collect overdue payments and keep finance informed."
2. Show the generated plan.
3. Show data gathered from the CSV, customer records, and inbox.
4. Show the prioritized list, including an item flagged for missing email.
5. Show the approval screen. Approve some items, edit one, reject one.
6. Simulate a payment arriving mid-workflow. Show re-planning in the log.
7. Show a failed send, retry, and escalation.
8. Open the audit trail and explain how each decision can be traced.

---

## 14. Open Questions

- Which workflow will the team present, and does the chosen judging rubric weigh autonomy or reliability more?
- Are real APIs allowed, or must all sources be simulated?
- What LLM and API budget is available during the event?
- Does the team need to present a live demo or a recorded one?

---

## 15. Glossary

- **Agentic AI:** AI that plans and takes a sequence of actions toward a goal, checking results along the way, rather than answering one prompt at a time.
- **Re-planning:** Updating the remaining steps when new information changes the situation.
- **Human-in-the-loop:** A design where a person approves or overrides important decisions.
- **Audit trail:** A record of what the system did, when, and why.
