"use client";

import { useState } from "react";

export default function ArchitectureShowcase() {
  const [activeTab, setActiveTab] = useState<"invoice" | "brief">("invoice");

  return (
    <section id="solutions" className="py-24 px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20">
      {/* Header */}
      <div className="max-w-3xl mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#1A2F25]/20 bg-white/70 text-xs font-mono tracking-widest uppercase mb-4 text-[#1A2F25] shadow-2xs">
          <span>DETERMINISTIC AGENTIC WORKFLOWS</span>
        </div>
        <h2 className="font-editorial text-4xl sm:text-5xl md:text-6xl text-[#1A2F25] font-normal leading-tight">
          How Axiomflow eliminates AI hallucinations in critical operations.
        </h2>
        <p className="mt-4 font-sans text-[#526359] text-base sm:text-lg leading-relaxed">
          Unlike conversational chatbots that predict text blindly, Axiomflow separates business rules from language generation. Every external communication, calendar event, and spreadsheet edit requires schema verification and human sign-off.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1A2F25]/15 mb-10 overflow-x-auto">
        <button
          onClick={() => setActiveTab("invoice")}
          className={`py-3.5 px-6 font-mono text-xs tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "invoice"
              ? "border-b-2 border-[#E06D53] text-[#1A2F25] font-bold bg-white/60"
              : "text-[#526359] hover:text-[#1A2F25]"
          }`}
        >
          Workflow 01: Accounts Receivable &amp; Overdue Cash Recovery
        </button>
        <button
          onClick={() => setActiveTab("brief")}
          className={`py-3.5 px-6 font-mono text-xs tracking-wider uppercase transition-all whitespace-nowrap cursor-pointer ${
            activeTab === "brief"
              ? "border-b-2 border-[#E06D53] text-[#1A2F25] font-bold bg-white/60"
              : "text-[#526359] hover:text-[#1A2F25]"
          }`}
        >
          Workflow 02: Executive Google Docs Brief &amp; Calendar Sync
        </button>
      </div>

      {/* Workflow 01 Content: Overdue Invoices */}
      {activeTab === "invoice" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: 4-Tier Interactive Stepper */}
          <div className="lg:col-span-7 space-y-4">
            {/* Step 1 */}
            <div className="p-6 border border-[#1A2F25]/15 bg-white/70 backdrop-blur-md relative group hover:border-[#E06D53] transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs uppercase text-[#E06D53] font-bold">
                  Phase 01 // Multi-Source Ingestion &amp; Reconciliation
                </span>
                <span className="text-[11px] font-mono text-[#526359] px-2 py-0.5 border border-[#1A2F25]/10 bg-white">
                  INPUTS: SHEETS / SQL / GMAIL
                </span>
              </div>
              <h3 className="font-sans font-bold text-base text-[#1A2F25] mb-1">
                Parse Natural Language Goal &amp; Verify Ground Truth
              </h3>
              <p className="font-sans text-xs text-[#526359] leading-relaxed">
                The agent consumes: &quot;Collect overdue balances above $1,000&quot;. It scans Google Sheets, queries database customer records, and inspects Gmail replies to prevent sending notices to clients who recently wired payment.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-mono text-[#1A2F25]">
                <span className="bg-[#1A2F25]/5 px-2.5 py-1">fetch_invoices()</span>
                <span className="bg-[#1A2F25]/5 px-2.5 py-1">cross_check_gmail_replies()</span>
                <span className="bg-[#1A2F25]/5 px-2.5 py-1">reconcile_balances()</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 border border-[#1A2F25]/15 bg-white/70 backdrop-blur-md relative group hover:border-[#E06D53] transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs uppercase text-[#E06D53] font-bold">
                  Phase 02 // Policy Evaluation &amp; Dynamic Tiering
                </span>
                <span className="text-[11px] font-mono text-[#526359] px-2 py-0.5 border border-[#1A2F25]/10 bg-white">
                  TIER DETERMINISM
                </span>
              </div>
              <h3 className="font-sans font-bold text-base text-[#1A2F25] mb-1">
                Aging Calculation &amp; Personalized Draft Generation
              </h3>
              <p className="font-sans text-xs text-[#526359] leading-relaxed">
                Applies deterministic escalation logic: 1-15 days (Courteous notice), 16-30 days (Firm reminder), &gt;30 days (Mandatory Manager Escalation). Detects missing email addresses and isolates incomplete records safely without guessing.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-mono text-[#1A2F25]">
                <span className="bg-[#1A2F25]/5 px-2.5 py-1">aging_bracket_check</span>
                <span className="bg-[#1A2F25]/5 px-2.5 py-1">missing_contact_guard</span>
                <span className="bg-[#1A2F25]/5 px-2.5 py-1">draft_personalized_msg</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 border-2 border-[#E06D53] bg-white/95 backdrop-blur-md relative shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs uppercase text-[#E06D53] font-bold flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#E06D53] animate-pulse"></span>
                  Phase 03 // Mandatory Human-in-the-Loop Approval Gate
                </span>
                <span className="text-[11px] font-mono bg-[#E06D53] text-white px-2.5 py-0.5 font-bold">
                  ACTION HELD
                </span>
              </div>
              <h3 className="font-sans font-bold text-base text-[#1A2F25] mb-1">
                Batch Verification Tray &amp; Dynamic In-Flight Re-planning
              </h3>
              <p className="font-sans text-xs text-[#526359] leading-relaxed">
                All drafted emails and status changes remain staged in the operator tray. If a client payment settles in the meantime, the in-flight re-planner automatically cancels the reminder draft before dispatch.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <span className="text-xs font-mono text-[#E06D53] font-bold">
                  STATUS: WAITING_FOR_OPERATOR_SIGN_OFF
                </span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-6 border border-[#1A2F25]/15 bg-white/70 backdrop-blur-md relative group hover:border-[#E06D53] transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs uppercase text-[#E06D53] font-bold">
                  Phase 04 // Authenticated Dispatch &amp; Cryptographic Audit
                </span>
                <span className="text-[11px] font-mono text-[#526359] px-2 py-0.5 border border-[#1A2F25]/10 bg-white">
                  FAST-MCP EXECUTION
                </span>
              </div>
              <h3 className="font-sans font-bold text-base text-[#1A2F25] mb-1">
                Delivers Communication &amp; Logs Permanent Audit Record
              </h3>
              <p className="font-sans text-xs text-[#526359] leading-relaxed">
                Once approved, emails dispatch via Gmail API. Google Sheets updates invoice status to &quot;Reminder Sent&quot;. Every decision token, prompt, and operator click is recorded with millisecond timestamps in the audit log.
              </p>
            </div>
          </div>

          {/* Right: Visual State Inspector Card (Replaces raw JSON) */}
          <div className="lg:col-span-5 border border-[#1A2F25]/20 bg-[#1A2F25] text-[#F8F6F2] p-6 shadow-xl relative">
            <div className="flex items-center justify-between border-b border-[#F8F6F2]/15 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-[#E5A93C] uppercase tracking-wider font-mono text-xs font-bold">
                  LIVE WORKFLOW TRACE
                </span>
              </div>
              <span className="text-[#B9C4BD] font-mono text-[10px]">
                ID: WF_AR_RECONCILE_2026
              </span>
            </div>

            {/* Structured Process Cards */}
            <div className="space-y-3 font-sans text-xs">
              <div className="p-3.5 bg-white/5 border border-white/10 rounded-none">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#B9C4BD] mb-1">
                  <span>CLIENT ACCOUNT</span>
                  <span className="text-amber-400 font-bold">$4,250.00 OVERDUE (21D)</span>
                </div>
                <div className="font-semibold text-white text-sm">Apex Logistics Ltd</div>
                <div className="mt-2 text-[11px] text-[#B9C4BD] font-mono bg-black/30 p-2 border-l-2 border-[#E06D53]">
                  &quot;Drafting firm notice for Invoice #INV-1092. Account history verified: 0 past late payments.&quot;
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-[#B9C4BD]">
                  <span>RECIPIENT: billing@apexlogistics.com</span>
                  <span className="text-amber-400 font-semibold">APPROVAL REQUIRED</span>
                </div>
              </div>

              <div className="p-3.5 bg-white/5 border border-white/10 rounded-none">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#B9C4BD] mb-1">
                  <span>CLIENT ACCOUNT</span>
                  <span className="text-red-400 font-bold">$12,800.00 OVERDUE (38D)</span>
                </div>
                <div className="font-semibold text-white text-sm">Vanguard Cloud Inc</div>
                <div className="mt-2 text-[11px] text-[#B9C4BD] font-mono bg-black/30 p-2 border-l-2 border-red-400">
                  &quot;Escalated: balance &gt; $5,000 and aging &gt; 30d. Staging executive management alert.&quot;
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-[#B9C4BD]">
                  <span>RECIPIENT: finance@vanguard.io</span>
                  <span className="text-red-400 font-semibold">EXECUTIVE ESCALATION</span>
                </div>
              </div>

              <div className="p-3.5 bg-white/5 border border-white/10 rounded-none">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#B9C4BD] mb-1">
                  <span>AUTOMATED RE-PLANNING</span>
                  <span className="text-emerald-400 font-bold">STATE DETECTED</span>
                </div>
                <div className="font-semibold text-white text-sm">Meridian Transport Co ($3,450.00)</div>
                <p className="mt-1 text-[11px] text-[#B9C4BD] leading-relaxed">
                  ACH Wire detected in central bank ledger 4 mins ago. Reminder automatically evicted from approval tray.
                </p>
                <div className="mt-2 text-[10px] font-mono text-emerald-400 font-semibold">
                  STATUS: QUEUE ITEM CANCELLED SAFELY
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#F8F6F2]/15 flex items-center justify-between font-mono text-[10px] text-[#E5A93C]">
              <span>FASTMCP SUITE: VERIFIED</span>
              <span>ZERO HALLUCINATIONS</span>
            </div>
          </div>
        </div>
      )}

      {/* Workflow 02 Content: Executive Brief & Calendar Sync */}
      {activeTab === "brief" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 border border-[#1A2F25]/15 bg-white/70 backdrop-blur-md">
              <span className="font-mono text-xs uppercase text-[#E06D53] font-bold">
                Phase 01 // Multi-Tool Telemetry Aggregation
              </span>
              <h3 className="font-sans font-bold text-base text-[#1A2F25] mt-2 mb-1">
                Extract Revenue Trends &amp; Pending Operational Bottlenecks
              </h3>
              <p className="font-sans text-xs text-[#526359] leading-relaxed">
                Aggregates quarterly closed invoices from Google Sheets, reviews customer escalation threads in Gmail, and computes key operating margins without manual copy-pasting.
              </p>
            </div>

            <div className="p-6 border border-[#1A2F25]/15 bg-white/70 backdrop-blur-md">
              <span className="font-mono text-xs uppercase text-[#E06D53] font-bold">
                Phase 02 // Google Docs Executive Brief Synthesis
              </span>
              <h3 className="font-sans font-bold text-base text-[#1A2F25] mt-2 mb-1">
                Generates Formatted Document via Google Docs API
              </h3>
              <p className="font-sans text-xs text-[#526359] leading-relaxed">
                Applies corporate heading styles, inserts tables with negative margin warnings, and creates an organized Google Drive document link staged for leadership review.
              </p>
            </div>

            <div className="p-6 border-2 border-[#E06D53] bg-white/95 backdrop-blur-md shadow-md">
              <span className="font-mono text-xs uppercase text-[#E06D53] font-bold">
                Phase 03 // Human Review &amp; Approval
              </span>
              <h3 className="font-sans font-bold text-base text-[#1A2F25] mt-2 mb-1">
                Inspect Document Draft &amp; Meeting Invitation
              </h3>
              <p className="font-sans text-xs text-[#526359] leading-relaxed">
                The operations lead reviews the generated executive summary and inspects proposed attendees before any Google Calendar meeting or document sharing occurs.
              </p>
            </div>

            <div className="p-6 border border-[#1A2F25]/15 bg-white/70 backdrop-blur-md">
              <span className="font-mono text-xs uppercase text-[#E06D53] font-bold">
                Phase 04 // Google Calendar Booking &amp; Meet Generation
              </span>
              <h3 className="font-sans font-bold text-base text-[#1A2F25] mt-2 mb-1">
                Coordinates Stakeholder Schedules with Zero Conflicts
              </h3>
              <p className="font-sans text-xs text-[#526359] leading-relaxed">
                Checks stakeholder calendar free/busy slots via Google Calendar API, books a 30-min sync, attaches Google Meet video link, and shares the Google Docs brief.
              </p>
            </div>
          </div>

          <div className="lg:col-span-5 border border-[#1A2F25]/20 bg-[#1A2F25] text-[#F8F6F2] p-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#F8F6F2]/15 pb-3 mb-5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-[#E5A93C] uppercase tracking-wider font-mono text-xs font-bold">
                  GENERATED ARTIFACT PREVIEW
                </span>
              </div>
              <span className="text-[#B9C4BD] font-mono text-[10px]">DOCS_API_V1</span>
            </div>

            <div className="space-y-3 font-sans text-xs">
              <div className="p-4 bg-white/5 border border-white/10">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#E5A93C] mb-2">
                  <span>📄 GOOGLE DOCS ASSET</span>
                  <span>DOC_ID: 1h9_8f2Ka</span>
                </div>
                <div className="font-bold text-white text-base">
                  Q3 Operations &amp; Cash Recovery Executive Brief
                </div>
                <p className="text-[11px] text-[#B9C4BD] mt-2 leading-relaxed">
                  &quot;Executive summary generated with 3 critical overdue accounts, $20,500 total aged capital, and proposed 14-day cash recovery milestone.&quot;
                </p>
                <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-[#B9C4BD]">
                  <span>PERMISSIONS: RESTRICTED</span>
                  <span className="text-emerald-400 font-semibold">READY FOR REVIEW</span>
                </div>
              </div>

              <div className="p-4 bg-white/5 border border-white/10">
                <div className="flex items-center justify-between text-[11px] font-mono text-[#E5A93C] mb-2">
                  <span>📅 GOOGLE CALENDAR EVENT</span>
                  <span>CAL_EVENT: EVT_99182</span>
                </div>
                <div className="font-bold text-white text-sm">
                  Executive Cash Recovery Sync
                </div>
                <div className="mt-1 text-[11px] text-[#B9C4BD]">
                  Thursday, 3:30 PM &middot; 30 mins &middot; Google Meet
                </div>
                <div className="mt-2 text-[10px] font-mono text-emerald-400 font-semibold">
                  STATUS: HELD IN TRAY FOR APPROVAL
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#F8F6F2]/15 flex items-center justify-between font-mono text-[10px] text-[#E5A93C]">
              <span>CALENDAR &amp; DOCS FASTMCP</span>
              <span>100% TRACEABLE</span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
