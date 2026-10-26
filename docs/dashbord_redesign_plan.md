# AxiomFlow.ai — Comprehensive Production-Grade Dashboard UI/UX Redesign Plan

---

## <aim>
To elevate the AxiomFlow.ai agentic web application dashboard from an early prototype interface into an industry-leading, production-grade autonomous workflow operating system—comparable in craft, responsiveness, and aesthetic clarity to state-of-the-art agentic products from OpenAI, Anthropic, and Linear.

---

## <goal>
Deliver an exhaustive, component-by-component architectural audit and redesign blueprint for all dashboard interfaces within AxiomFlow.ai. The redesign systematically resolves all visual dissonances, layout clipping, information architecture redundancies, typographic misalignments, micro-animation deficiencies, and missing state components, while strictly preserving the established brand design system:
- **Color Palette:** Warm Canvas (`#F8F6F2`), Deep Forest (`#1A2F25`), Terracotta / Clay (`#E06D53` / `#CD5B42`), Ochre / Gold (`#E5A93C`), Sage Stone (`#526359`), and Crisp Surface White (`#FFFFFF`).
- **Typography:** `Instrument Serif` (Editorial Display & Expressive Titles), `Plus Jakarta Sans` (Functional User Interface & Form Copy), and `JetBrains Mono` / Monospace (Telemetry, Logs, Timestamps, System Gateways, and Model Names).

---

## <scopes>
This evaluation and redesign blueprint strictly encompasses **all frontend dashboard components and pages** located in:
1. `frontend/src/app/dashboard/page.tsx` — Workspace Shell & Viewport Container
2. `frontend/src/components/dashboard/DashboardHeader.tsx` — Global Header, Navigation Tabs, Notifications Popover, Profile Trigger, and Floating Alert Toasts
3. `frontend/src/components/dashboard/DashboardSettingsModal.tsx` — Runtime System Preferences & Engine Switcher
4. `frontend/src/components/dashboard/WorkflowView.tsx` — Workflow Lifecycle Container & View Switcher
5. `frontend/src/components/dashboard/WorkflowBeforeExecution.tsx` — Pre-Execution Prompt Composer, Greeting Engine, and Intent Intake
6. `frontend/src/components/dashboard/WorkflowRunningView.tsx` — Active Execution Orchestrator, Live Timers, Progress Engine, and Control Bar
7. `frontend/src/components/dashboard/StepTimeline.tsx` — DAG Execution Pipeline Timeline, Node State Visualizers, and Navigation
8. `frontend/src/components/dashboard/StepDetail.tsx` — Step Inspector, Execution Telemetry Terminal, Reasoning Callout, and Verified Artifacts Hub
9. `frontend/src/components/dashboard/InlineCards.tsx` — Human-in-the-Loop (HITL) Supervisory Review Card, Zero-Hallucination Guard, Replan Alert, and Failure Escalation Cards
10. `frontend/src/components/dashboard/RadialDotsSpinner.tsx` — Micro-Indicator for Active Agentic Processing
11. `frontend/src/components/dashboard/ConnectView.tsx` — OAuth 2.0 Integration Management Hub, Service Connection Tiles, and Tool Scope Inspectors
12. `frontend/src/components/dashboard/LogsView.tsx` — Telemetry Table, Audit Log Explorer, Real-time Refresh Engine, and Deep Payload Modal
13. `frontend/src/components/dashboard/NotificationsView.tsx` — Event Stream Feed, SSE Connection Monitor, Alert Filters, and Dispatch Actions
14. `frontend/src/components/dashboard/ProfileView.tsx` — Organization Governance, Statutory Entity Records, Administrator Credentials, and Cloud DB Persistence

---

---

## 1. WORKSPACE SHELL & VIEWPORT ARCHITECTURE
`frontend/src/app/dashboard/page.tsx`

### <aim>
To construct a unified, non-clipping viewport frame that accommodates dense agentic workflow telemetry without nested scrollbars, visual clutter, or layout jitter across various display dimensions (from 13" laptop screens to 4K ultrawides).

### <goal>
Eliminate dual-scrollbar conflicts, calibrate responsive padding ramps, soften excessive border contrasts, and provide a stable desktop canvas that locks the global navigation and dynamically adapts content panes.

### <scopes>
- The root `<main>` viewport container
- The outer terracotta-bordered card shell (`rounded-[32px] border-[#E06D53]/60`)
- Layout responsiveness between 768px, 1024px, 1440px, and 1920px+ viewports
- State switching transition animations between primary views (`workflow`, `connect`, `logs`, `notifications`, `profile`)

### <current flaws>
1. **Dual Scrollbars & Viewport Overflow:** The root card has fixed margins and generous internal padding (`p-6 sm:p-8 md:p-10`) nested inside a `<main>` container with `p-4 sm:p-6 md:p-8`. On standard 13" and 15" displays (1080p, scaling 125%–150%, effective viewport height 700px–800px), content overflows vertically, causing both the browser window and the card container to display concurrent scrollbars.
2. **Visual Border Fatigue:** The entire 1500px card wrapper is bordered with a bright terracotta outline (`border-[#E06D53]/60`) and a tinted drop shadow (`shadow-[0_12px_40px_-12px_rgba(224,109,83,0.08)]`). When inner components (Logs table, Approval cards, and Artifact boxes) also use heavy terracotta borders, visual hierarchy collapses and the screen feels overly boxed-in.
3. **Abrupt State Transitions:** Switching between tabs (e.g., from Workflow to Logs or Connect) swaps DOM subtrees instantaneously without entry/exit fade or cross-dissolve transitions, creating a harsh visual snap.
4. **Mobile/Tablet Horizontal Pinching:** On mobile screens under 640px, the heavy rounded corners (`rounded-[24px]`) and `p-6` padding consume over 48px of horizontal width, compressing timeline nodes and data tables into narrow, unreadable columns.

### <proposed improvements>
1. **Strict Viewport Pinning on Desktop:**
   - Configure `min-h-screen max-h-screen h-screen flex flex-col overflow-hidden` on viewports >= 1024px.
   - Retain the top navigation header fixed at 64px, and allow the inner workspace card to fill exactly `calc(100vh - 88px)` with `overflow-hidden`.
   - Delegate vertical scrolling exclusively to the specific content panes (e.g., the timeline/detail columns or table body), eliminating browser-level scroll bouncing.
2. **Subtle, Sophisticated Border Elevation:**
   - Transition the outer card border from `border-[#E06D53]/60` to a refined, dual-toned border: `border border-[#1A2F25]/10 hover:border-[#1A2F25]/20`.
   - Apply a micro terracotta top-accent line (`h-[2px] w-full bg-gradient-to-r from-transparent via-[#E06D53]/80 to-transparent absolute top-0 left-0`) to preserve the brand’s warm identity without aggressively boxing in the viewport.
3. **Animated Route/Tab Transitions:**
   - Wrap the active tab rendering in a smooth Framer Motion or lightweight CSS animation container (`animate-in fade-in zoom-in-99 duration-200`).
4. **Adaptive Responsive Geometry:**
   - On screens < 640px: Reduce card radius to `rounded-xl` and padding to `p-3.5 sm:p-5`, maximizing touch target area and data legibility.

### <outcomes>
- Zero secondary scrollbar glitches across all standard laptop displays.
- Visual focus shifts from the outer framing borders onto live agent execution telemetry and interactive gateways.
- Silky, production-grade page transitions that match Anthropic Console and OpenAI ChatGPT interfaces.

### <notes/considerations>
- Mobile users (< 768px) must continue to have natural window scrolling (`overflow-y-auto`), as fixed viewport heights do not suit small handheld form factors.

---

---

## 2. GLOBAL NAVIGATION BAR & COMMAND HEADER
`frontend/src/components/dashboard/DashboardHeader.tsx`

### <aim>
To establish an intuitive, frictionless top command bar that provides clear workspace wayfinding, eliminates confusing feature duplication, and houses alerts and user governance with zero layout obstruction.

### <goal>
Unify the fragmented Information Architecture (IA), remove redundant tabs, resolve dropdown dismiss bugs, relocate floating toasts to prevent control blocking, and calibrate navigation typography for compact desktop displays.

### <scopes>
- Brand lockup logo (`AxiomflowLogo`)
- Central navigation tabs (`Workflow`, `Connect`, `Logs`, `Notifications`, `Profile`)
- Utility cluster (Notification Bell with popover, Settings Gear, Profile Avatar, and Logout button)
- Floating in-app alert toast notification system

### <current flaws>
1. **Critical Information Architecture (IA) Duplication:**
   - *Duplicate Notifications Entry:* The header features a top navigation tab titled **"Notifications"** (with record count pill) AND a floating **Notification Bell** icon on the right with its own dropdown popover and "Clear" trigger. Users are left unsure of whether to click the tab or the bell.
   - *Duplicate Profile Entry:* The header features a top navigation tab titled **"Profile"** AND a circular **User Avatar** icon on the right that navigates to the exact same profile view.
2. **Outdated "Under spec" Badge on Connect:**
   - The "Connect" tab still renders a prominent terracotta badge reading `Under spec`. However, Google Docs, Google Sheets, Gmail, and Google Calendar are already fully implemented, tested, and operational via FastMCP. This gives users the false impression that tool integrations are broken or incomplete.
3. **Missing Click-Outside & Keyboard Handlers:**
   - Neither the notification popover nor the profile avatar dropdown close when clicking outside of them or when pressing the `Escape` key. Once opened, users must click the exact toggle icon a second time to dismiss them.
4. **Intrusive Toast Overlay Collision:**
   - The in-app SSE toast alert floats at `fixed top-5 right-5 z-50`. This directly overlays and blocks the Notification Bell, Settings Gear, Profile Avatar, and Logout buttons for 6 full seconds whenever a workflow event occurs.
5. **Over-Scaled Display Typography:**
   - The nav tab labels use `font-editorial text-2xl md:text-3xl`. While visually striking, 32px serif links demand excessive horizontal space. On 1024px–1280px laptops, the tabs crowd together, occasionally causing text wrapping or forcing horizontal scrolling.
6. **Abrupt Tab Underline:**
   - The active tab indicator (`h-[2px] bg-[#E06D53]`) instantly appears and disappears on click without a sliding layout animation.

### <proposed improvements>
1. **Streamlined Information Architecture (IA):**
   - **Central Navigation (3 Focused Hubs):**
     - `Workflow` (Active orchestration & pre-run composer)
     - `Integrations` (Renamed from *Connect*; reflects real-time Google Workspace & FastMCP status)
     - `Audit Logs` (Deterministic database telemetry & execution records)
   - **Right Utility Cluster (Quick Tools & Governance):**
     - *Alerts Bell:* Click opens a modern slide-over notification drawer or dropdown with unread dot, live SSE status, and "View All in Audit Logs" link.
     - *Settings Gear:* Opens the Execution Preferences modal.
     - *User Avatar Menu:* Click opens a dropdown containing User Name, Business Name, "Account Settings", "Organization Profile", and a styled "Log out" option.
     - *Log out Button:* Move inside the profile dropdown or retain as an icon button to de-clutter the header strip.
2. **Update Integration Status Badge:**
   - Remove `Under spec`. Replace with a dynamic green status pill: `4 Connected` (or `Active`) when OAuth tokens exist, or a neutral `Setup` pill if disconnected.
3. **Implement Robust Click-Outside & Escape Dismissal:**
   - Attach a reusable `useClickOutside` hook to the popover containers and add a `keydown` listener for `Escape` to close all open popovers instantly.
4. **Relocate Floating Toast Notifications:**
   - Reposition toast notifications to `fixed bottom-6 right-6 z-50` with a slide-up animation (`slide-in-from-bottom-4`). This keeps the top navigation and action icons completely accessible at all times.
5. **Refined Navigation Typography:**
   - Scale nav links to `font-editorial text-xl md:text-2xl font-normal tracking-tight`. This retains the elegant editorial character while consuming 35% less horizontal space.
   - Add a smooth sliding underline indicator using CSS transitions or Framer Motion layoutId.

### <outcomes>
- A clean, uncluttered navigation bar with zero redundant buttons.
- No blocked interactive icons during active workflow executions.
- Clear, accurate representation of Google Workspace tool integration health.

### <notes/considerations>
- The brand logo (`AxiomflowLogo variant="full" size={28}`) is well-positioned and crisp; preserve its exact scale, hover opacity, and link target.

---

---

## 3. RUNTIME SYSTEM PREFERENCES & ENGINE MODAL
`frontend/src/components/dashboard/DashboardSettingsModal.tsx`

### <aim>
To empower power users and enterprise administrators to configure agentic runtime models, execution velocity, and supervisory guardrails through an accessible, tactile settings dialog.

### <goal>
Replace non-standard model identifiers, replace primitive form inputs with polished switches, implement backdrop dismiss mechanics, and wire settings into active runtime execution parameters.

### <scopes>
- Modal overlay & backdrop blur (`bg-[#1A2F25]/40 backdrop-blur-xs`)
- Primary LLM engine dropdown
- Simulation playback velocity segmented control
- Deterministic guardrails and auto-follow checkboxes
- Modal action triggers ("Apply Changes", "✕" close button)

### <current flaws>
1. **Fictional & Inconsistent Model Tagging:** The dropdown features `gemini-3.8-flash` (a non-existent version numbering), `gemini-1.5-pro`, and `claude-3-5-sonnet`. There is no visual explanation of latency, token cost, or capabilities.
2. **Disconnected Velocity Controls:** "Realtime (1x)", "Accelerated (4x)", and "Step-by-Step" buttons change local component state but are completely decoupled from backend polling intervals or agent SSE delays.
3. **Primitive Browser Form Controls:** Checkboxes use generic OS inputs with `accent-[#E06D53]`. In a premium agentic app, checkboxes lack the tactile feel of smooth iOS-style sliding switches.
4. **Inaccessible Modal Dismissal:** Clicking the dimmed backdrop does not close the modal; users are forced to click the small "✕" button in the corner. Pressing `Escape` does nothing.
5. **Lack of Persistence:** Preferences are stored purely in transient component state and reset to defaults whenever the modal is re-opened or the page is refreshed.

### <proposed improvements>
1. **Calibrated Model Selector with Metadata Cards:**
   - Update model options to official enterprise engines:
     - `Google Gemini 2.5 Flash` — *(Sub-500ms, Low Latency, High Throughput)*
     - `Google Gemini 1.5 Pro` — *(Deep Reasoning, Complex DAG Planning)*
     - `Claude 3.5 Sonnet` — *(Complex Logic & Code Synthesis)*
   - Display a compact latency & token badge beneath the selector.
2. **Tactile Custom Toggle Switches:**
   - Replace generic checkboxes with custom sliding toggles (`w-10 h-6 bg-[#1A2F25]/20 rounded-full peer-checked:bg-[#E06D53] transition-colors`).
3. **Full Backdrop & Keyboard Dismiss:**
   - Add click handler to overlay background (`onClick={(e) => e.target === overlayRef.current && onClose()}`) and attach a global `Escape` key listener.
4. **LocalStorage Preference Syncing:**
   - Persist user choices in `localStorage.getItem("axiomflow_settings")` so model preferences, velocity, and auto-scroll settings survive page reloads.

### <outcomes>
- Production-grade settings modal adhering to W3C WAI-ARIA dialog specifications.
- Clear user comprehension of available LLM backends.
- Persistent user preferences across sessions.

### <notes/considerations>
- When "Simulation Velocity" is altered, dispatch an event to `WorkflowRunningView` to adjust timer multipliers and SSE animation pacing.

---

---

## 4. WORKFLOW WORKSPACE: PRE-EXECUTION STATE
`frontend/src/components/dashboard/WorkflowView.tsx` & `frontend/src/components/dashboard/WorkflowBeforeExecution.tsx`

### <aim>
To provide a welcoming, high-impact workspace entry point that inspires immediate user action, guides prompt construction, and seamlessly launches automated agentic pipelines.

### <goal>
Remove exposed developer toggles, solve the "blank canvas" intimidation problem with curated quick-start prompt chips, enhance the composer input into a flexible multi-line textarea, and refine typographic hierarchy.

### <scopes>
- Pre-execution wrapper (`WorkflowBeforeExecution.tsx`)
- Headline greeting generator (`WELCOME_TEMPLATES`)
- Prompt input composer bar and submit button
- Developer state switcher pill (`[Before Run | Active Workflow]`)

### <current flaws>
1. **Exposed Developer State Switcher:**
   - In the top-right corner, a pill control toggles between **"Before Run"** and **"Active Workflow"**. This is a developer test harness that is currently exposed directly to end-users. Clicking "Active Workflow" without starting a task displays an empty or broken running state.
2. **The "Blank Canvas" Problem:**
   - Below the large welcome headline (`text-6xl`), the screen is completely empty except for a small input pill at the very bottom. First-time users are confronted with an empty void and have no immediate visual cues about what queries the system can execute.
3. **Single-Line Input Constraint:**
   - The query composer is a simple `<input type="text">` with placeholder `"ask query"`. Real-world enterprise agentic instructions (e.g. "Analyse the Q3 retail sales sheet, filter anomalies, draft a 3-page summary in Google Docs, and email the CFO for approval") require multi-line drafting. The single-line input truncates text and prevents comfortable multi-sentence prompting.
4. **Lack of Keyboard Shortcuts:**
   - The input only submits via the submit button click or single Enter. It lacks standard agentic shortcuts such as `Shift + Enter` for new lines, `Ctrl/Cmd + Enter` for instant run, and `Escape` to clear.
5. **Extreme Vertical Spacing Disconnect:**
   - The welcome headline is positioned in the dead center while the composer bar is anchored far down at the bottom margin. The eye has to jump across a vast expanse of unused white space.

### <proposed improvements>
1. **Eliminate the Manual State Toggle:**
   - Remove the `[Before Run | Active Workflow]` pill toggle from the UI. The interface should transition automatically into running state upon form submission or when an existing active task ID is detected via `/api/workflow/latest`.
2. **Curated Quick-Start Prompt Chips:**
   - Render a grid of 3–4 interactive suggestion cards directly beneath the headline to guide first-time users:
     - 📊 **Analyze Retail Sales Sheet:** *"Analyze sales sheet 'sales_q3.xlsx', detect negative margin trends, and export summary."*
     - 📝 **Executive Brief in Google Docs:** *"Draft an executive progress brief in Google Docs and email the board."*
     - 📅 **Schedule Review & Meeting Sync:** *"Coordinate team milestone sync on Google Calendar with Meet conference link."*
     - 🔄 **Autonomous Cross-App Sync:** *"Extract invoice status from Gmail and update central master spreadsheet."*
   - Clicking any chip populates the composer textarea instantly with a smooth focus.
3. **Expandable Multi-Line Prompt Composer:**
   - Upgrade the `<input>` element into an auto-expanding `<textarea>` that comfortably grows from 1 line (48px) to 4 lines (120px) as the user types.
   - Maintain the rounded pill aesthetic with smooth border glow (`focus-within:border-[#E06D53] focus-within:ring-2 focus-within:ring-[#E06D53]/20`).
4. **Enhanced Action Strip Inside Composer:**
   - Add visual badge inside the composer: `⌘ + ↵ to run`.
   - Include quick-attach icons for external document URLs or spreadsheet links.

### <outcomes>
- Zero confusion from exposed developer debug buttons.
- Time-to-first-workflow drops dramatically due to 1-click prompt chips.
- Users can comfortably compose nuanced, multi-step business objectives.

### <notes/considerations>
- The dynamic greeting templates (`WELCOME_TEMPLATES`) fetching the business name from `axiomflow_db` are well-crafted; keep the dynamic naming logic intact.

---

---

## 5. WORKFLOW WORKSPACE: LIVE EXECUTION ORCHESTRATOR
`frontend/src/components/dashboard/WorkflowRunningView.tsx` & `frontend/src/components/dashboard/RadialDotsSpinner.tsx`

### <aim>
To deliver a high-trust, real-time command cockpit that clearly communicates overall pipeline status, elapsed execution time, supervisory hold states, and execution controls without redundancy.

### <goal>
Eliminate duplicate query displays, fix elapsed timer micro-drift, upgrade control buttons with intuitive icons and safeguards, and enhance the progress bar with interactive milestone markers.

### <scopes>
- Top objective header strip
- Live status indicator & pulse dot
- Elapsed time counter and timer drift synchronization
- Execution control buttons (`Pause` / `Resume`, `Stop`)
- Pipeline progress bar & percentage readouts
- Bottom redundant composer pill
- `RadialDotsSpinner` micro-component

### <current flaws>
1. **Redundant Objective Display:**
   - The user's active query is rendered at the top of the view in large typography (`Objective: analyse the sheet...`) AND is then repeated verbatim at the very bottom inside a disabled pill container with the rotating spinner. This consumes ~120px of vertical space while providing zero additional information.
2. **Timer Jitter & Synchronization Drift:**
   - The elapsed time counter uses a local browser `setInterval(..., 1000)` while simultaneously receiving periodic `elapsed_seconds` updates from the backend status polling. When server latency fluctuates, the seconds counter visibly stutters or jumps back and forth by 1–2 seconds.
3. **Unprotected "Stop" Trigger:**
   - The `Stop` button immediately aborts the active workflow without any confirmation dialog or tooltip. Users risk accidentally terminating a multi-agent workflow that has already spent 45 seconds executing previous steps.
4. **Abstract Progress Bar:**
   - The progress bar displays a smooth continuous bar (`0% to 100%`) but fails to visualize the discrete DAG step milestones. Users cannot tell if 50% means Step 2 of 4 or an arbitrary heuristic.
5. **Spinner Micro-Stutter:**
   - The `RadialDotsSpinner` uses an 8-dot step animation (`steps(8, end)`). While intentional, the 1.2s cycle without easing can appear jittery on high-refresh-rate (120Hz/144Hz) displays.

### <proposed improvements>
1. **Remove the Redundant Bottom Pill:**
   - Delete the static bottom pill during active execution.
   - Utilize that freed vertical real estate to expand the step timeline and detail inspector, giving logs and generated artifacts ample breathing room.
2. **Monotonic, Drift-Free Timer Hook:**
   - Refactor the timer to record the workflow's absolute start timestamp (`startTime = Date.now() - serverElapsed * 1000`) and calculate elapsed time monotonically via `requestAnimationFrame` or a synchronized interval, eliminating jitter.
3. **Refined Control Cluster with Safeguards:**
   - Replace text-only buttons with sleek icon-labeled controls:
     - `Pause` / `Resume`: Icon toggle with gentle amber pulse when paused (`⏸ Pause` / `▶ Resume`).
     - `Stop`: Styled in muted charcoal (`#1A2F25]/80 hover:bg-red-600 hover:text-white transition-colors`) with a lightweight confirmation tooltip: *"Click again to confirm abort"*.
   - Add a `+ New Objective` button that returns cleanly to the pre-run workspace when the current run finishes.
4. **Milestone-Segmented Progress Bar:**
   - Introduce subtle milestone tick marks along the progress bar corresponding to each step in the DAG plan (e.g., 4 tick marks for a 4-step pipeline).
   - Display a clean dual metric: `Step 2 of 4 · 50% Complete`.
5. **High-Precision Radial Spinner:**
   - Smooth the `RadialDotsSpinner` animation with continuous cubic-bezier rotation (`animation: spin 1.4s cubic-bezier(0.4, 0, 0.2, 1) infinite`) while preserving the 8 graded opacity dots.

### <outcomes>
- Clean, uncluttered layout with 120px of reclaimed vertical space.
- Silky smooth, accurate live execution stopwatch.
- Zero accidental pipeline terminations.

### <notes/considerations>
- When the workflow reaches a terminal state (`completed`, `failed`, or `rejected`), automatically freeze the timer and switch the status dot to a solid emerald checkmark or ruby failure icon.

---

---

## 6. DAG EXECUTION PIPELINE TIMELINE
`frontend/src/components/dashboard/StepTimeline.tsx`

### <aim>
To visualize the agentic Directed Acyclic Graph (DAG) execution plan as a clear, interconnected journey that communicates pipeline progression, dynamic re-planning, and supervisory wait points at a glance.

### <goal>
Introduce a continuous vertical connector line between nodes, standardize icon weights, improve typographic hierarchy, and ensure step cards provide clear visual affordances for interactive selection.

### <scopes>
- Vertical step list container (left 5-column pane)
- Step status nodes (`completed`, `running`, `waiting`, `failed`, `replanned`, `pending`)
- Step titles, numbers, subtitles, and duration badges
- Interactive selected step highlight state

### <current flaws>
1. **Disconnected Floating Nodes:**
   - Step items render as isolated rounded rectangular buttons. There is no vertical connecting path or thread line between Step 1, Step 2, and Step 3. This breaks the fundamental mental model of a sequential, multi-agent pipeline and looks like a disconnected list of tasks.
2. **Inconsistent Status Glyphs:**
   - The status indicators use a mix of mismatched formats:
     - Completed uses an unstyled text glyph `✓` in emerald.
     - Running uses a custom animated pinging dot.
     - Waiting uses a circle with a pause emoji `⏸`.
     - Failed uses an unstyled text glyph `✕`.
     - Replanned uses a unicode arrow `⟲`.
   - The variations in optical alignment, stroke width, and sizing make the timeline look improvised.
3. **Aggressive Text Truncation:**
   - Step titles have `truncate` applied. On screens between 768px and 1100px, critical step descriptions (e.g. *"Generate sales insights document in Google Docs"*) get cut off as *"Generate sales ins..."*, with no tooltip to view the full text.
4. **Subtle Selection Affordance:**
   - The active selected step is distinguished only by a faint terracotta border (`border-[#E06D53]/60`) and a tiny arrow indicator hidden on small screens. When scanning rapidly, users struggle to identify which step's details are currently populating the right-hand inspector.

### <proposed improvements>
1. **Continuous Vertical SVG Thread Line:**
   - Implement an authentic DAG pipeline thread: A vertical line (`w-0.5 bg-[#1A2F25]/10`) running behind the nodes.
   - For completed steps, color the line segment in solid emerald (`bg-emerald-500`); for running steps, animate a pulsating gradient downward.
2. **Harmonized Vector Status Icons:**
   - Replace all raw text characters and emojis with crisp, uniform 20x20px SVGs:
     - `completed`: Circular emerald badge with crisp white checkmark.
     - `running`: Terracotta concentric rings with smooth spinning halo.
     - `waiting`: Ochre circular badge with clean pause bars (`||`).
     - `failed`: Ruby circular badge with clean diagonal cross.
     - `replanned`: Slate circular badge with smooth circular undo arrow.
     - `pending`: Hollow charcoal ring with subtle dashed border.
3. **Intelligent Multi-Line Title Wrapping & Tooltips:**
   - Allow titles to wrap smoothly across 2 lines before truncating, ensuring complete tool actions and parameters remain visible.
   - Add hover tooltips displaying full agent responsibility (e.g., `Responsible Agent: Docs Agent via FastMCP`).
4. **High-Contrast Active Step Elevation:**
   - When a step is selected, apply a crisp card elevation: `bg-white border-l-4 border-l-[#E06D53] border-t border-r border-b border-[#1A2F25]/10 shadow-sm`.
   - Add a subtle badge indicating `Active Inspector`.

### <outcomes>
- Instant user comprehension of multi-agent execution hierarchy.
- Pixel-perfect visual consistency across all pipeline states.
- Effortless step selection and status identification.

### <notes/considerations>
- Steps marked `replanned` should retain their strike-through styling to transparently display dynamic pipeline adaptation to the user.

---

---

## 7. STEP INSPECTOR, REASONING & ARTIFACT HUB
`frontend/src/components/dashboard/StepDetail.tsx`

### <aim>
To provide a comprehensive, transparent inspection terminal that reveals agent reasoning, live event telemetry, and verified tool-generated artifacts in real time.

### <goal>
Incorporate first-class Google Docs artifact verification cards, convert cramped activity logs into a terminal-grade streaming console with auto-scroll and copy controls, and elevate the "Why" reasoning callout.

### <scopes>
- Top step title and duration badge
- Human-in-the-Loop review gateways
- Verified Artifacts container (Calendar, Sheets, and Docs)
- Activity event stream log container
- "Why" deterministic agent reasoning callout

### <current flaws>
1. **Critical Missing Artifact Card (Google Docs):**
   - The `Generated Artifacts` box currently only supports `calendarEvent` and `sheetResult`. When the recently integrated **Docs Agent** creates a Google Doc (e.g., `sales_insights.docx` or a live Google Docs URL), it is **completely missing** from the artifacts display! Users have no clickable card to view or verify their generated documents.
2. **Cramped, Overflowing Activity Log Box:**
   - The activity stream is artificially restricted to `max-h-56` (224px). For multi-step agent actions with 15+ tool calls, this tiny box forces awkward scrolling.
3. **Missing Auto-Scroll for Live Telemetry:**
   - As new log events stream in via SSE/polling, the container does not automatically scroll to the newest message. Users must manually grab the scrollbar to check the latest activity.
4. **Lack of Log Utilities:**
   - There is no "Copy Logs" button, no timestamp format toggle, and no ability to inspect raw JSON payloads returned by FastMCP tools.
5. **Buried Agent Reasoning Callout:**
   - The "Why" reasoning section is placed at the very bottom in a plain muted box (`bg-[#F8F6F2]/60`). In agentic applications, explainability is a core feature; burying it under logs diminishes user trust in the AI's autonomous decisions.

### <proposed improvements>
1. **First-Class Google Docs Artifact Card:**
   - Add a dedicated Google Docs card to `Generated Artifacts`:
     - Blue Google Docs brand icon & document badge.
     - Document title (e.g. `sales_insights.docx`) and Google Drive file ID.
     - One-click action button: `Open in Google Docs ↗` (opens `https://docs.google.com/document/d/...` in a new tab).
2. **Terminal-Grade Streaming Activity Console:**
   - Expand the activity container to flex-grow within the inspector height.
   - Implement smooth auto-scroll to latest log entries with an auto-scroll lock toggle (`Auto-scroll: ON/OFF`).
   - Add a clean "Copy Logs" button with a brief `Copied ✓` feedback state.
3. **Prominent "Agent Reasoning & Intent" Card:**
   - Move the "Why" explainability card directly below the step header (above the raw logs).
   - Style with a distinctive warm border (`border-amber-200/80 bg-amber-50/40`), a lightbulb/brain vector icon, and clean typography: *"Deterministic Reasoning: [Agent justification]"*.

### <outcomes>
- Full visibility and one-click access for all 4 integrated services: Gmail, Calendar, Sheets, and Google Docs.
- Developer-friendly, highly readable activity log console.
- Heightened user trust through prominent, transparent agent reasoning.

### <notes/considerations>
- If a step failed, render the specific tool error trace with syntax highlighting directly inside the console.

---

---

## 8. HUMAN-IN-THE-LOOP (HITL) REVIEW GATEWAY
`frontend/src/components/dashboard/InlineCards.tsx`

### <aim>
To guarantee zero unauthorized outbound operations by providing a reliable, foolproof supervisory review gateway for high-stakes actions (sending emails, publishing documents, scheduling meetings).

### <goal>
Eliminate off-screen approval trapping, introduce a persistent supervisory warning banner, refine the draft editor with character counts and variable highlighting, and establish a clear button hierarchy.

### <scopes>
- `ApprovalCard` (Human-in-the-Loop Supervisory Review)
- `MissingInfoCard` (Zero-Hallucination Guard)
- `ReplanNotice` (Adaptive Pipeline Adjustment)
- `FailureCard` (Step Execution Interrupted & Escalation)

### <current flaws>
1. **Off-Screen Approval Trapping:**
   - When the workflow pauses for human approval at Step 3, the `ApprovalCard` is only rendered inside `StepDetail` *if the user has Step 3 selected*. If the user clicks Step 1 or Step 2 on the left timeline, the approval interface vanishes from view. The workflow appears indefinitely stuck with no visual prompt explaining where to approve.
2. **Equal Button Weight Increases Mis-Clicks:**
   - In `ApprovalCard`, the primary action `"Approve & Send"` and the destructive action `"Reject & Abort"` have similar visual weights and are placed right next to each other. This creates a high risk of accidental cancellation.
3. **Rudimentary Draft Editor:**
   - Clicking `"Edit Draft"` switches the email body to a plain `<textarea>` with zero syntax cues, no recipient editing capability, no subject line editing, and no word/character counter.
4. **Hardcoded Missing Info Card:**
   - `MissingInfoCard` contains hardcoded static copy: *"3 contacts in the investor registry have no email address configured"*. It does not reflect dynamic backend validation data.
5. **Lack of Undo for Rejection:**
   - Rejecting an approval immediately marks the task failed with no second confirmation step.

### <proposed improvements>
1. **Persistent Floating Supervisory Review Banner:**
   - Whenever any step enters `waiting_approval` status, display a prominent, sticky golden banner across the top of the workflow viewport:
     - `⚠️ Supervisory Sign-Off Required: Outgoing communication waiting for review in Step [N].`
     - Include a `Review Draft Now →` button that immediately selects the waiting step and brings the approval card into focus.
2. **Rigorous Visual Hierarchy for Action Buttons:**
   - **Approve:** Bold, solid terracotta button with checkmark icon (`bg-[#E06D53] hover:bg-[#CD5B42] text-white shadow-sm px-6 py-2`).
   - **Edit Draft:** Clean secondary outline button (`border border-[#1A2F25]/20 hover:border-[#1A2F25] text-[#1A2F25] bg-white px-4 py-2`).
   - **Reject & Abort:** Subdued, low-contrast ghost button (`text-red-600 hover:bg-red-50 px-3 py-2`) that triggers a confirmation popover before aborting.
3. **Comprehensive Draft Editor:**
   - Allow inline editing of **Subject**, **Recipients**, and **Body**.
   - Provide a real-time character and word count indicator.
   - Highlight edited words with a soft yellow wash to clearly indicate human modifications prior to dispatch.
4. **Dynamic Data-Gap Warnings:**
   - Connect `MissingInfoCard` to backend validation payloads, dynamically listing specific missing fields (e.g. missing column names, unverified attendee emails).

### <outcomes>
- Zero risk of a workflow remaining blocked unnoticed.
- Prevention of accidental workflow cancellations.
- Granular human supervisory control over generated drafts and artifacts.

### <notes/considerations>
- Once approved, show a clear transition animation: the card transforms into an emerald confirmation pill reading `✓ Approved by Supervisor · Dispatched via FastMCP`.

---

---

## 9. EXTERNAL INTEGRATIONS & OAUTH SERVICE HUB
`frontend/src/components/dashboard/ConnectView.tsx`

### <aim>
To provide a secure, modular integration hub where enterprise users can link, inspect, verify, and revoke external tools and cloud workspace credentials with total peace of mind.

### <goal>
Decompose the monolithic Google Workspace card into discrete service modules, showcase active Google Docs integration, remove abandoned placeholder cards, and add live health check verification.

### <scopes>
- Page header & security badge
- Google Workspace Core Suite card
- OAuth popup trigger & token exchange mechanics
- Additional integrations & database sources card

### <current flaws>
1. **Monolithic Google Card Obscures Granular Services:**
   - Gmail, Calendar, Sheets, and Docs are lumped together inside a single card titled *"Google Workspace Core Suite"*. Users cannot inspect the specific status, permissions, or token health of individual services.
2. **Outdated Scopes Subtitle:**
   - While the code includes the `documents` scope, the disconnected state description still reads: *"Connect Gmail (Send), Calendar (Events), and Sheets..."*, leaving out Google Docs and confusing users looking for cloud document automation.
3. **Deprecating Placeholder Card:**
   - The bottom card titled *"Additional Integrations & Database Sources"* displays empty placeholder text: *"No additional external database or file connections available (---)"*. It looks unfinished and provides no functional value.
4. **Lack of Connection Health Verification:**
   - There is no "Test Connection" button. If Google refresh tokens expire or are revoked from the Google Cloud Console, AxiomFlow still displays "CONNECTED" until a live workflow abruptly fails during tool execution.

### <proposed improvements>
1. **Modular Service Grid Architecture:**
   - Maintain the master Google Workspace OAuth link, but render a modular grid of distinct service cards:
     - ✉️ **Gmail API** — *Status: Active · Scopes: gmail.send · Last Used: 12m ago*
     - 📅 **Google Calendar API** — *Status: Active · Scopes: calendar.events · Last Used: 1h ago*
     - 📊 **Google Sheets API** — *Status: Active · Scopes: spreadsheets · Last Used: 5m ago*
     - 📄 **Google Docs API** — *Status: Active · Scopes: documents, drive.file · Last Used: Just now*
2. **Live Health Check ("Ping Tools") Action:**
   - Add a `Test Connection` button next to `Disconnect Account`.
   - Clicking it triggers a lightweight FastMCP ping to verify that API tokens are active and permissions valid, providing immediate reassurance.
3. **Transform Placeholder into an Enterprise Integrations Gallery:**
   - Replace the static empty card with a professional "Upcoming Connectors" showcase (e.g., Slack Webhooks, Microsoft 365, HubSpot CRM, PostgreSQL) with a `Request Access` or `Notify Me` button, turning an empty state into an exciting product roadmap feature.

### <outcomes>
- Immediate clarity on all connected Google services, specifically highlighting Google Docs capabilities.
- Proactive token health verification preventing unexpected runtime failures.
- Production-grade enterprise presentation.

### <notes/considerations>
- Preserve the existing secure OAuth popup code client flow (`window.google.accounts.oauth2.initCodeClient`), as it handles authorization code exchange reliably.

---

---

## 10. AUDIT TELEMETRY & SYSTEM EVENT LOGS
`frontend/src/components/dashboard/LogsView.tsx`

### <aim>
To deliver a high-performance, deterministic audit table that allows compliance officers and developers to inspect execution duration, agent handoffs, queries, and raw model outputs effortlessly.

### <goal>
Rectify improper font usage in data tables, optimize column width proportions, implement date/agent filters, and enrich the detail modal with syntax-highlighted JSON inspection.

### <scopes>
- Search & filter header strip
- Audit logs telemetry table (`<table className="w-full">`)
- Log row micro-interactions
- Selected log inspection modal

### <current flaws>
1. **Inappropriate Typography in Data Cells:**
   - All table cells (`task_id`, `Query`, `Description`, `Agent Name`, `LLM Name`, `Time Taken`, `Time Stamp`) are styled with `font-editorial text-lg md:text-xl`. `Instrument Serif` is an expressive display font designed for large editorial headings. Using a decorative serif for UUIDs, numeric durations, timestamps, and model tags makes the data wavy, difficult to scan, and unaligned.
2. **Horizontal Table Squeeze:**
   - All 8 columns are set to `whitespace-nowrap` with centered text and heavy terracotta borders (`border-[#E06D53]`), causing harsh horizontal scrolling and clipping on standard 14" screens.
3. **Client-Only 100-Record Ceiling:**
   - The table hardcodes a `limit=100` fetch and performs filtering only in memory. There is no server pagination, no date range filter, and no filter by specific agent (`Docs Agent`, `Sheet Agent`, etc.).
4. **Superficial Detail Modal:**
   - Clicking a log entry opens a modal that merely repeats the same text fields found in the row. It lacks raw tool parameters, token usage counts, error traces, and a "Copy JSON" button.

### <proposed improvements>
1. **Strict Data Typography Correction:**
   - **Table Headers:** `font-editorial text-base md:text-lg text-[#1A2F25] font-normal` (preserves brand character).
   - **IDs, Timestamps, Durations, and Statuses:** `font-mono text-xs text-[#526359]` (clean tabular numbers, aligned colons).
   - **Queries and Descriptions:** `font-sans text-xs text-[#1A2F25]` (maximum legibility and readability).
2. **Proportional Column Layout & Sticky Headers:**
   - Assign sensible column percentage widths (`Task ID: 12%`, `Query: 24%`, `Agent: 14%`, `LLM: 12%`, `Duration: 10%`, `Timestamp: 16%`, `Status: 12%`).
   - Allow `Query` to wrap to 2 lines instead of forcing excessive horizontal scrolling.
   - Keep the table header sticky during vertical scrolling.
3. **Advanced Filtering Controls:**
   - Add dropdown filters for **Agent Type** (`All`, `Docs Agent`, `Sheet Agent`, `Email Agent`, `Calendar Agent`, `Supervisor`) and a quick date selector (`Today`, `Last 7 Days`, `All`).
4. **Developer-Grade Deep Telemetry Modal:**
   - Equip the inspector modal with tabbed views:
     - `Overview`: High-level task summary, duration, timestamp, agent.
     - `Raw Payload`: Syntax-highlighted JSON response from FastMCP / LLM.
     - `Copy`: One-click button to copy full log JSON for debugging.

### <outcomes>
- Highly scannable, visually balanced audit table matching datadog and cloudflare telemetry standards.
- Rapid debugging capabilities through deep JSON payload inspection.
- Professional typographic hierarchy that respects the intended purpose of each font family.

### <notes/considerations>
- The 3-second auto-refresh polling is effective for live telemetry; maintain it with a subtle toggle to pause polling when inspecting a specific row.

---

---

## 11. REAL-TIME NOTIFICATIONS & ALERTS FEED
`frontend/src/components/dashboard/NotificationsView.tsx`

### <aim>
To provide a consolidated terminal feed of all automated pipeline milestones, supervisory alerts, and error escalations with live Server-Sent Events (SSE) synchronization.

### <goal>
Increase card information density, eliminate duplicate record anomalies, provide direct deep-linking into active workflows, and support grouped date categorization.

### <scopes>
- Top header, SSE live pulse indicator, and test dispatch triggers
- Filter pills (`All`, `Succeeded`, `Failed`, `Rejected`) and search input
- Notification list items and empty state view

### <current flaws>
1. **Bulky, Low-Density Notification Cards:**
   - Each notification record consumes over 130px of vertical space with multiple redundant borders and large margins. Viewing just 10 alerts requires scrolling through 1,300px of page height.
2. **Missing Direct Workflow Deep-Link:**
   - Notifications show `Task: TSK_TEST_ABCDE`, but the text is plain and unclickable. Users who receive a notification cannot click it to navigate directly to the corresponding workflow execution in the `workflow` tab.
3. **Monolithic Ungrouped Feed:**
   - Notifications are rendered as a continuous, ungrouped list without date section headers (e.g. `Today`, `Yesterday`, `Earlier this week`), making temporal browsing difficult.
4. **SSE Duplicate Key Hazards:**
   - In rare race conditions when SSE events arrive simultaneously with the 10-second polling fallback, notifications with identical IDs can cause React key warnings and flickering cards.

### <proposed improvements>
1. **Compact, High-Density Notification Feed:**
   - Redesign notification cards into streamlined, 64px compact list rows:
     - Left: Status icon badge (`SUCCEEDED`, `FAILED`, `PAUSED`).
     - Center: Message summary with task ID badge.
     - Right: Relative time (`2m ago`, `1h ago`) and action link.
2. **Interactive Workflow Navigation Link:**
   - Make the `Task: TSK_...` badge a clickable button that invokes `onNavigateToWorkflow(task_id)`, instantly switching the user to the `workflow` tab and populating the execution view for that task.
3. **Chronological Section Grouping:**
   - Group records under clean date separators (`Today`, `Yesterday`, `Older records`) using `font-mono text-xs uppercase text-[#526359]`.
4. **Deduplication Engine & Mark-as-Read:**
   - Enforce an idempotent deduplication filter before updating React state.
   - Add a subtle "Mark All as Read" action alongside "Clear All".

### <outcomes>
- 300% higher information density, allowing users to scan 30+ alerts without endless scrolling.
- Direct 1-click navigation from alert to workflow execution.
- Bulletproof SSE event ingestion with zero key collisions.

### <notes/considerations>
- The "+ Test Alert" trigger button is useful for verifying desktop notifications and SSE; keep it available in development and staging environments.

---

---

## 12. ORGANIZATION & PROFILE GOVERNANCE
`frontend/src/components/dashboard/ProfileView.tsx`

### <aim>
To deliver a corporate-grade organization profile and user governance console that enables real-time editing of statutory business details and administrative credentials without cognitive overload.

### <goal>
Replace the 2,000px single-column form with a clean tabbed/card layout, eliminate conflicting save buttons, introduce inline validation, and implement a floating unsaved changes action bar.

### <scopes>
- Business Profile form (`business_profile` table)
- Admin Profile form (`users` table)
- Top action bar and save triggers
- Floating 5-second auto-dismiss alerts

### <current flaws>
1. **Extreme Vertical Form Length (Cognitive Fatigue):**
   - The view stacks 16 individual form fields sequentially down a single column, generating a 2,000px scrollable wall of inputs. Finding a specific field (like CIN or Mobile Number) requires extensive scrolling.
2. **Confusing Multi-Button Save Paradigm:**
   - The page presents three competing save buttons:
     - `Update Profile` (saves both at top right)
     - `Update Business Profile` (saves Section 1)
     - `Update Admin Profile` (saves Section 2)
   - Users are confused about whether editing a field in Section 1 and clicking the button in Section 2 will discard or save their changes.
3. **Missing Real-Time Input Validation:**
   - Input fields (GSTIN, CIN, Business Email, Telephone) accept arbitrary strings with no format validation, pattern hints, or inline feedback.
4. **Jarring Alert Layout Shifts:**
   - Success and error messages are rendered inside a `sticky top-2` container that pushes the entire form downward by 80px upon appearance and pulls it upward when dismissed after 5 seconds, causing jarring layout shifts.

### <proposed improvements>
1. **Side-by-Side or Segmented Tab Layout:**
   - Organize the page into two clear, distinct tabs or a balanced 2-column grid on desktop:
     - 🏢 **Corporate Entity Identity:** *(Business Name, Sector, GSTIN, CIN, Address, Description)*
     - 👤 **Administrator & Security:** *(First/Last Name, Admin Email, Mobile, Department, Role)*
   - Reduces vertical scrolling by over 55%.
2. **Unified Dirty-State Save Bar:**
   - Remove the three separate save buttons.
   - Introduce a modern floating bottom action bar that appears only when changes are made:
     - `You have unsaved changes in Business Profile.`
     - Buttons: `Discard` (resets form) and `Save All Changes` (executes `/api/profile/update`).
3. **Inline Field Formatting & Tooltips:**
   - Add format validation masks and helper icons:
     - GSTIN: Automatic uppercase format (`27ABCDE1234F1Z5`).
     - Phone: International format validation (`+91 ...`).
     - Website: URL scheme validation (`https://...`).
4. **Fixed-Position Non-Disruptive Toast Alerts:**
   - Render database commit confirmations as fixed toasts in the bottom-right corner rather than pushing the entire document body.

### <outcomes>
- A clean, executive governance interface that respects user focus.
- Elimination of form layout shifts and conflicting save actions.
- Enforced statutory data integrity through inline format validation.

### <notes/considerations>
- The automatic session cache update (`syncSessionCache`) syncing business names to `localStorage` for instant header reflection works seamlessly; retain this pattern.

---

---

## 13. SUMMARY IMPLEMENTATION ROADMAP & PRIORITY MATRIX

| Priority | Section / Component | Key Target Improvements | Effort | Impact |
| :--- | :--- | :--- | :--- | :--- |
| **P0 (Immediate)** | **Workflow Running View & StepDetail** | Add Google Docs verified artifact card; delete redundant bottom pill; fix timer drift | Medium | Critical |
| **P0 (Immediate)** | **DashboardHeader & Nav** | Remove duplicate Notifications & Profile tabs; delete `Under spec` pill; add click-outside | Low | High |
| **P0 (Immediate)** | **InlineCards (HITL Gateway)** | Add persistent top supervisory hold banner; distinguish Approve vs Reject button styling | Medium | Critical |
| **P1 (High)** | **Workflow Before Execution** | Remove debug switcher; add multi-line composer with `⌘+Enter`; add quick-start prompt chips | Medium | High |
| **P1 (High)** | **LogsView (Audit Logs)** | Replace editorial serif in table cells with clean monospace/sans font; add agent filters & JSON copy | Medium | High |
| **P1 (High)** | **StepTimeline** | Add vertical SVG DAG connector line; standardize vector status glyphs; elevate active step card | Medium | High |
| **P2 (Medium)** | **ConnectView** | Break monolithic Google card into modular Gmail, Calendar, Sheets, Docs tiles; add test ping | Medium | Medium |
| **P2 (Medium)** | **NotificationsView** | Compact card height to 64px; group by date; add 1-click deep link to workflow task ID | Medium | Medium |
| **P2 (Medium)** | **ProfileView** | Switch to 2-column/tabbed layout; unified floating save bar; input format validation | Medium | Medium |
| **P3 (Polish)** | **DashboardSettingsModal** | Add real model metadata cards; custom iOS-style toggle switches; Escape key dismissal | Low | Polish |
| **P3 (Polish)** | **Global Shell & Viewport** | Viewport height pinning on desktop; subtle warm top accent gradient line | Low | Polish |

---

## <notes/considerations>
1. **Design System Invariants:** All proposed enhancements strictly retain the warm canvas `#F8F6F2`, deep forest `#1A2F25`, terracotta `#E06D53`, ochre `#E5A93C`, and font pairings (`Instrument Serif`, `Plus Jakarta Sans`, and `JetBrains Mono`). No outside utility frameworks or foreign color palettes are introduced.
2. **Zero Breaking Backend Changes:** All suggested frontend UI/UX enhancements utilize the existing, proven FastAPI endpoints (`/api/workflow/*`, `/api/notifications/*`, `/api/logs/*`, `/api/oauth/*`, and `/api/profile/*`) and FastMCP tool interfaces.
3. **Execution Ready:** This document provides the concrete specifications, component locations, DOM structures, and CSS patterns required for immediate step-by-step frontend implementation.
