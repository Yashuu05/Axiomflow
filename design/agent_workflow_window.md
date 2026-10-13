Core idea: a "run card" that streams in real time

When the user submits an objective, the agent creates one run card in the main area. The card shows the plan as a live timeline, and the user can see what the agent is doing right now, what it has finished, and what needs them.

┌─────────────────────────────────────────────────────────────────┐
│ "Send email to all investors about upcoming Investor Meeting"    │
│ ● Running   Step 3 of 6   ·   1m 42s          [Pause]  [Stop]    │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━░░░░░░░░░░░░░░░░░░░  50%          │
├──────────────────────────────┬──────────────────────────────────┤
│ ✓ 1  Understand objective    │  3 · Draft investor emails        │
│      Plan created · 4s       │  Running                          │
│ ✓ 2  Load investor list      │                                   │
│      42 contacts · 1.2s      │  Activity                         │
│ ◉ 3  Draft emails       ◀    │  10:42:03  Read meeting template  │
│      18 of 42 drafted        │  10:42:05  Drafted 18 of 42       │
│ ○ 4  Human approval          │                                   │
│ ○ 5  Send emails             │  Why  Personalizing each email    │
│ ○ 6  Log and confirm         │       with the investor's firm    │
└──────────────────────────────┴──────────────────────────────────┘

The left column is the timeline. The right column shows details for whichever step is selected. It follows the running step by default and can be pinned by the user. On narrow screens, the two columns stack, with the timeline on top.

Step states

Each state uses an icon and a text label, not color alone, so it stays readable for colorblind users.

State	Node	Color	Notes
Pending	Hollow circle	Slate Olive	Muted text
Running	Filled circle with a slow pulse ring	Amber Clay	The only animated element in the list
Waiting for you	Pause icon	Earthy Ochre	Shows "Needs your approval"
Completed	Check icon	Deep Forest	Shows duration and a result summary
Failed	Alert icon	Dark clay	Shows retry count, such as "Retry 1 of 2"
Re-planned	Dashed line through the title	Slate Olive	Shows what replaced it
Inline cards for interruptions

Interruptions appear inside the timeline at the step where they happen. They don't pop up as separate alerts.

Approval card (FR-14 to FR-16): Lists the drafts, with Approve, Edit, and Reject for each. Shows a note such as "Paused if no response in 30 minutes." Approve uses the Amber Clay primary CTA style.
Missing information card: For example, "3 investors have no email address." Offers "Add email" or "Skip these." The agent doesn't guess.
Re-plan notice (FR-12, FR-13): A small banner that explains the change. For example: "Plan updated. INV-204 was paid, so its reminder was removed. Source: inbox, 10:44." The old step is shown struck through and the new step is tagged "New."
Failure card (FR-10, FR-11): Shows the error in plain language, the retry count, and buttons for "Retry now" and "Escalate to manager."
Real-time mechanics

The frontend should not wait for a full response. The agent emits small events, and the UI reduces them into the run state.

json
{
  "run_id": "run_8f2a",
  "step_id": "s3",
  "type": "step_progress",
  "timestamp": "2026-10-12T10:42:05Z",
  "payload": { "message": "Drafted 18 of 42", "progress": 0.43 }
}

Event types to support: run_started, step_started, step_progress, tool_call, tool_result, step_completed, step_failed, approval_requested, plan_updated, run_completed.

Use SSE or WebSockets for transport. Several practical details matter here:

Throttle the activity log. Batch events that arrive within a short window so the log doesn't flicker.
Auto-scroll carefully. Follow the live event only if the user is already at the bottom. If they've scrolled up, show a "Jump to live" button.
Use aria-live="polite" only for step changes, not for every log line, so screen readers aren't overwhelmed.
Respect prefers-reduced-motion. Turn off the pulse and slide-in animations when it's set.
Keep the run recoverable. If the page reloads, rebuild the run card from the audit log, which the PRD already requires (FR-17).
Visual language
Surfaces: Step cards use Frosted Quartz with backdrop-blur(16px). The run card sits on the Liquid Surface gradient.
Progress bar: Earthy Ochre to Amber Clay gradient fill on a Deep Forest track at low opacity.
Typography: Keep the condensed serif from the mockup for the objective and step titles, since it gives the brand its character. Use a clean sans-serif for the activity log and detail text, so the small text stays readable.
Activity log: A monospace font for timestamps and tool names is acceptable, since it signals machine output. Keep it in Slate Olive.
Motion: New events slide in over about 150ms. The progress bar animates smoothly. Nothing else moves.
Components to build
RunCard: the objective, status pill, progress bar, and controls
StepTimeline: the list of steps and their states
StepDetail: the activity log, reasoning, and results for the selected step
InlineCard variants: approval, missing info, re-plan, and failure
Composer: the existing input, which switches to "Pause" or "Stop" while a run is active.