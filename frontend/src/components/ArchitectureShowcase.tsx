"use client";

import { useState } from "react";

export default function ArchitectureShowcase() {
  const [activeTab, setActiveTab] = useState<"invoice" | "onboarding">("invoice");

  return (
    <section id="architecture" className="py-24 px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20">
      {/* Header */}
      <div className="max-w-3xl mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#1A2F25]/20 bg-white/60 text-xs font-mono tracking-widest uppercase mb-4 text-[#526359]">
          <span>CORE ENGINE ARCHITECTURE</span>
        </div>
        <h2 className="font-editorial text-4xl sm:text-5xl md:text-6xl text-[#1A2F25] font-normal leading-tight">
          How Axiomflow eliminates AI stochastic failure in business operations.
        </h2>
        <p className="mt-4 font-sans text-[#526359] text-base leading-relaxed">
          Unlike black-box chat agents, Axiomflow separates deterministic business rules from probabilistic language reasoning. Every tool invocation adheres to schema verification and Human-In-The-Loop authorization before mutation.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1A2F25]/15 mb-10 overflow-x-auto">
        <button
          onClick={() => setActiveTab("invoice")}
          className={`py-3 px-6 font-mono text-xs tracking-wider uppercase transition-colors whitespace-nowrap ${
            activeTab === "invoice"
              ? "border-b-2 border-[#E06D53] text-[#1A2F25] font-bold bg-white/50"
              : "text-[#526359] hover:text-[#1A2F25]"
          }`}
        >
          Workflow 01: Overdue Invoice Follow-Up (PRD Reference)
        </button>
        <button
          onClick={() => setActiveTab("onboarding")}
          className={`py-3 px-6 font-mono text-xs tracking-wider uppercase transition-colors whitespace-nowrap ${
            activeTab === "onboarding"
              ? "border-b-2 border-[#E06D53] text-[#1A2F25] font-bold bg-white/50"
              : "text-[#526359] hover:text-[#1A2F25]"
          }`}
        >
          Workflow 02: Vendor Contract Risk & Compliance Audit
        </button>
      </div>

      {/* Workflow 01 Content */}
      {activeTab === "invoice" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: 4-Tier Interactive Stepper */}
          <div className="lg:col-span-7 space-y-4">
            {/* Step 1 */}
            <div className="p-6 border border-[#1A2F25]/15 bg-white/65 backdrop-blur-md relative group hover:border-[#E06D53] transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs uppercase text-[#E06D53] font-semibold">
                  Phase 01 // Multi-Source Ingestion & Parsing
                </span>
                <span className="text-[11px] font-mono text-[#526359] px-2 py-0.5 border border-[#1A2F25]/10">
                  INPUT: CSV / API / IMAP
                </span>
              </div>
              <h3 className="font-sans font-bold text-base text-[#1A2F25] mb-1">
                Parse Natural Language Objective & Query Data Sources
              </h3>
              <p className="font-sans text-xs text-[#526359] leading-relaxed">
                The agent consumes: &quot;Collect overdue balances above $1,000&quot;. It reconciles records across the Accounts Receivable register (CSV/RDS) and verifies recent customer email replies to avoid redundant notices.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-mono text-[#1A2F25]">
                <span className="bg-[#1A2F25]/5 px-2 py-1">fetch_invoices()</span>
                <span className="bg-[#1A2F25]/5 px-2 py-1">normalize_schema()</span>
                <span className="bg-[#1A2F25]/5 px-2 py-1">reconcile_unpaid()</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-6 border border-[#1A2F25]/15 bg-white/65 backdrop-blur-md relative group hover:border-[#E06D53] transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs uppercase text-[#E06D53] font-semibold">
                  Phase 02 // Policy Evaluation & Aging Tiers
                </span>
                <span className="text-[11px] font-mono text-[#526359] px-2 py-0.5 border border-[#1A2F25]/10">
                  TIER DETERMINISM
                </span>
              </div>
              <h3 className="font-sans font-bold text-base text-[#1A2F25] mb-1">
                Dynamic Priority Scoring & Escalation Strategy
              </h3>
              <p className="font-sans text-xs text-[#526359] leading-relaxed">
                Applies deterministic escalation logic: 1-15 days (Courteous notice), 16-30 days (Firm reminder), 30+ days or &gt;$5,000 (Mandatory Manager Escalation). Detects missing contact info and isolates records safely.
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-mono text-[#1A2F25]">
                <span className="bg-[#1A2F25]/5 px-2 py-1">aging_bracket_check</span>
                <span className="bg-[#1A2F25]/5 px-2 py-1">missing_field_sanitizer</span>
                <span className="bg-[#1A2F25]/5 px-2 py-1">draft_personalized_msg</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="p-6 border-2 border-[#E06D53] bg-white/90 backdrop-blur-md relative shadow-md">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs uppercase text-[#E06D53] font-bold">
                  Phase 03 // Human-In-The-Loop Approval Gate (CRITICAL)
                </span>
                <span className="text-[11px] font-mono bg-[#E06D53] text-white px-2 py-0.5 font-semibold">
                  MANDATORY PAUSE
                </span>
              </div>
              <h3 className="font-sans font-bold text-base text-[#1A2F25] mb-1">
                Batch Approval & In-Flight State Re-Verification
              </h3>
              <p className="font-sans text-xs text-[#526359] leading-relaxed">
                Before sending emails or modifying accounts, the agent stages drafts in an approval tray. If a client wire transfer settles in the meantime, the dynamic re-planner automatically revokes the reminder draft.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <span className="text-xs font-mono text-[#E06D53] font-semibold">
                  STATUS: WAITING_FOR_OPERATOR_SIGN_OFF
                </span>
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-6 border border-[#1A2F25]/15 bg-white/65 backdrop-blur-md relative group hover:border-[#E06D53] transition-all">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-xs uppercase text-[#E06D53] font-semibold">
                  Phase 04 // Execution, Audit Trail & State Sync
                </span>
                <span className="text-[11px] font-mono text-[#526359] px-2 py-0.5 border border-[#1A2F25]/10">
                  MUTATION ENGINE
                </span>
              </div>
              <h3 className="font-sans font-bold text-base text-[#1A2F25] mb-1">
                Dispatches Actions & Writes Immutable Audit Log
              </h3>
              <p className="font-sans text-xs text-[#526359] leading-relaxed">
                Approved communication dispatches via SMTP / Gmail API. Invoice record updates to &quot;Reminder Sent&quot;. Every prompt, decision token, and reviewer click is stored with millisecond timestamps.
              </p>
            </div>
          </div>

          {/* Right: State Inspector Card */}
          <div className="lg:col-span-5 border border-[#1A2F25]/20 bg-[#1A2F25] text-[#F8F6F2] p-6 font-mono text-xs relative shadow-xl">
            <div className="flex items-center justify-between border-b border-[#F8F6F2]/15 pb-3 mb-4">
              <span className="text-[#E5A93C] uppercase tracking-wider font-semibold">
                [LIVE_GRAPH_STATE]
              </span>
              <span className="text-[#B9C4BD] text-[10px]">EXECUTION_TRACE_V1</span>
            </div>

            <pre className="text-[11px] leading-relaxed text-[#B9C4BD] overflow-x-auto">
{`{
  "workflow_id": "wf_ar_sweep_2026",
  "objective": "Collect overdue invoices > 15d",
  "pipeline_health": "NOMINAL",
  "nodes_active": 3,
  "sources_connected": [
    "csv://finance/invoices_q3.csv",
    "imap://billing@acme.inc",
    "db://auradb/customer_profiles"
  ],
  "items_evaluated": 42,
  "flagged_for_action": 3,
  "hitl_approval_required": true,
  "staged_actions": [
    {
      "client": "Apex Logistics Ltd",
      "amount": "$4,250.00",
      "overdue_days": 21,
      "urgency": "FIRM_NOTICE",
      "status": "AWAITING_REVIEWER"
    },
    {
      "client": "Vanguard Cloud Inc",
      "amount": "$12,800.00",
      "overdue_days": 38,
      "urgency": "EXECUTIVE_ESCALATION",
      "status": "AWAITING_REVIEWER"
    }
  ],
  "zero_hallucination_guarantee": "ASSERTION_PASSED"
}`}
            </pre>

            <div className="mt-6 pt-4 border-t border-[#F8F6F2]/15 flex items-center justify-between text-[10px] text-[#E5A93C]">
              <span>GRAPH ENGINE: LANGGRAPH 0.2+</span>
              <span>STATE IMMUTABILITY: VERIFIED</span>
            </div>
          </div>
        </div>
      )}

      {/* Workflow 02 Content */}
      {activeTab === "onboarding" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-7 space-y-4">
            <div className="p-6 border border-[#1A2F25]/15 bg-white/65 backdrop-blur-md">
              <span className="font-mono text-xs uppercase text-[#E06D53] font-semibold">
                Phase 01 // Multi-Source Contract Parsing
              </span>
              <h3 className="font-sans font-bold text-base text-[#1A2F25] mt-2 mb-1">
                Ingest PDF Master Service Agreements & Statements of Work
              </h3>
              <p className="font-sans text-xs text-[#526359] leading-relaxed">
                Extracts indemnification clauses, payment terms, and service level commitments across vendor documentation without data leaks.
              </p>
            </div>
            <div className="p-6 border-2 border-[#E06D53] bg-white/90 backdrop-blur-md">
              <span className="font-mono text-xs uppercase text-[#E06D53] font-bold">
                Phase 02 // Redline & Risk Classification
              </span>
              <h3 className="font-sans font-bold text-base text-[#1A2F25] mt-2 mb-1">
                Verify Non-Standard Terms Against Company Playbook
              </h3>
              <p className="font-sans text-xs text-[#526359] leading-relaxed">
                Cross-references unlimited liability exposure, triggers human legal sign-off for critical risks, and automates approvals for standard terms.
              </p>
            </div>
          </div>

          <div className="lg:col-span-5 border border-[#1A2F25]/20 bg-[#1A2F25] text-[#F8F6F2] p-6 font-mono text-xs shadow-xl">
            <div className="flex items-center justify-between border-b border-[#F8F6F2]/15 pb-3 mb-4">
              <span className="text-[#E5A93C] uppercase tracking-wider font-semibold">
                [COMPLIANCE_STATE]
              </span>
              <span className="text-[#B9C4BD] text-[10px]">DOC_SCANNER_V1</span>
            </div>
            <pre className="text-[11px] leading-relaxed text-[#B9C4BD] overflow-x-auto">
{`{
  "contract_id": "cntr_msa_99812",
  "vendor": "HyperScale Cloud Systems",
  "clauses_analyzed": 18,
  "high_risk_flags": 1,
  "risk_detail": "Unlimited liability on IP breach",
  "recommended_action": "ESCALATE_LEGAL_COUNSEL",
  "auto_approval_eligible": false,
  "hitl_lock": "ENABLED"
}`}
            </pre>
          </div>
        </div>
      )}
    </section>
  );
}
