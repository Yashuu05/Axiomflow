"use client";

import { useState } from "react";

interface WorkflowItem {
  id: string;
  client: string;
  amount: number;
  daysOverdue: number;
  hasContact: boolean;
  status: "pending_review" | "approved" | "rejected" | "dispatched" | "paid";
  emailDraft: string;
}

const INITIAL_INVOICES: WorkflowItem[] = [
  {
    id: "INV-2041",
    client: "Meridian Logistics Corp",
    amount: 3450,
    daysOverdue: 12,
    hasContact: true,
    status: "pending_review",
    emailDraft:
      "Dear Meridian Accounts Team, this is a courteous reminder regarding Invoice #INV-2041 ($3,450.00) which matured 12 days ago. Please share remittance details at your earliest convenience.",
  },
  {
    id: "INV-2089",
    client: "Horizon Analytics LLC",
    amount: 8900,
    daysOverdue: 28,
    hasContact: true,
    status: "pending_review",
    emailDraft:
      "Dear Horizon Finance, Invoice #INV-2089 for $8,900.00 is currently 28 days overdue. As per our mutual terms, please settle immediately or advise on payment scheduling to prevent account suspension.",
  },
  {
    id: "INV-2104",
    client: "Vertex Supply Partners",
    amount: 1200,
    daysOverdue: 34,
    hasContact: false,
    status: "pending_review",
    emailDraft:
      "[BLOCKED]: Contact email missing from accounts master. Cannot dispatch without operator manual update.",
  },
];

interface AuditEntry {
  id: string;
  timestamp: string;
  type: "INIT" | "INGEST" | "APPROVAL" | "REJECT" | "REPLAN" | "DISPATCH";
  message: string;
  actor: string;
}

export default function InteractiveSandbox() {
  const [invoices, setInvoices] = useState<WorkflowItem[]>(INITIAL_INVOICES);
  const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([
    {
      id: "log-1",
      timestamp: "10:14:02",
      type: "INIT",
      message: "Natural language goal parsed: 'Reconcile and collect overdue invoices over 10 days'",
      actor: "AGENT_CORE",
    },
    {
      id: "log-2",
      timestamp: "10:14:03",
      type: "INGEST",
      message: "Cross-checked 3 records across Google Sheets & Gmail replies",
      actor: "FASTMCP_SHEETS",
    },
    {
      id: "log-3",
      timestamp: "10:14:04",
      type: "APPROVAL",
      message: "External communication held: Awaiting mandatory operator sign-off",
      actor: "HITL_GATE",
    },
  ]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [commitSuccess, setCommitSuccess] = useState<boolean>(false);

  const handleAction = (id: string, action: "approve" | "reject" | "mark_paid") => {
    setInvoices((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (action === "approve") return { ...item, status: "approved" };
          if (action === "reject") return { ...item, status: "rejected" };
          if (action === "mark_paid") return { ...item, status: "paid" };
        }
        return item;
      })
    );

    const target = invoices.find((inv) => inv.id === id);
    const time = new Date().toLocaleTimeString();

    if (action === "approve") {
      setAuditLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          timestamp: time,
          type: "APPROVAL",
          message: `Operator authorized dispatch for ${target?.client} (${target?.id})`,
          actor: "OPERATOR",
        },
        ...prev,
      ]);
    } else if (action === "reject") {
      setAuditLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          timestamp: time,
          type: "REJECT",
          message: `Operator rejected reminder for ${target?.client}. Reason logged: Manual exemption`,
          actor: "OPERATOR",
        },
        ...prev,
      ]);
    } else if (action === "mark_paid") {
      setAuditLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          timestamp: time,
          type: "REPLAN",
          message: `Wire transfer detected for ${target?.id}! Dynamic re-planner evicted draft from queue`,
          actor: "REPLANNER",
        },
        ...prev,
      ]);
    }
  };

  const handleExecuteBatch = () => {
    setIsProcessing(true);
    setCommitSuccess(false);

    setTimeout(() => {
      setInvoices((prev) =>
        prev.map((item) => {
          if (item.status === "approved" && item.hasContact) {
            return { ...item, status: "dispatched" };
          }
          return item;
        })
      );

      const time = new Date().toLocaleTimeString();
      setAuditLogs((prev) => [
        {
          id: `log-${Date.now()}`,
          timestamp: time,
          type: "DISPATCH",
          message: "FastMCP Gmail API dispatched approved notices: 200 OK. State synced to Sheets.",
          actor: "FASTMCP_GMAIL",
        },
        ...prev,
      ]);

      setIsProcessing(false);
      setCommitSuccess(true);
      setTimeout(() => setCommitSuccess(false), 4000);
    }, 700);
  };

  const handleReset = () => {
    setInvoices(INITIAL_INVOICES);
    setCommitSuccess(false);
    setAuditLogs([
      {
        id: "log-1",
        timestamp: "10:14:02",
        type: "INIT",
        message: "Natural language goal parsed: 'Reconcile and collect overdue invoices over 10 days'",
        actor: "AGENT_CORE",
      },
      {
        id: "log-2",
        timestamp: "10:14:03",
        type: "INGEST",
        message: "Cross-checked 3 records across Google Sheets & Gmail replies",
        actor: "FASTMCP_SHEETS",
      },
      {
        id: "log-3",
        timestamp: "10:14:04",
        type: "APPROVAL",
        message: "External communication held: Awaiting mandatory operator sign-off",
        actor: "HITL_GATE",
      },
    ]);
  };

  const approvedCount = invoices.filter((i) => i.status === "approved" && i.hasContact).length;

  return (
    <section id="sandbox" className="py-24 px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20">
      {/* Title */}
      <div className="max-w-3xl mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#1A2F25]/20 bg-white/70 text-xs font-mono tracking-widest uppercase mb-4 text-[#1A2F25] shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
          <span>LIVE INTERACTIVE SIMULATOR // TRY HUMAN-IN-THE-LOOP</span>
        </div>
        <h2 className="font-editorial text-4xl sm:text-5xl md:text-6xl text-[#1A2F25] font-normal leading-tight">
          Test the Human-in-the-Loop verification gate.
        </h2>
        <p className="mt-4 font-sans text-base sm:text-lg text-[#526359] leading-relaxed">
          Experience how Axiomflow holds communications in an isolated review tray, blocks actions on missing contact fields, and dynamically cancels queued drafts when payments settle.
        </p>
      </div>

      {/* Main Sandbox Window */}
      <div className="border border-[#1A2F25]/20 bg-white/70 backdrop-blur-xl shadow-glass">
        {/* Sandbox Bar */}
        <div className="border-b border-[#1A2F25]/15 p-4 md:px-6 flex flex-wrap items-center justify-between gap-4 bg-white/90">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E06D53]"></span>
            <span className="font-mono text-xs font-bold text-[#1A2F25]">
              SIMULATION ENGINE: AR_COLLECTION_FLOW
            </span>
            <span className="hidden sm:inline font-mono text-[11px] text-[#526359] bg-[#1A2F25]/5 px-2 py-0.5">
              FASTMCP ACTIVE
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 border border-[#1A2F25]/20 text-xs font-mono text-[#526359] hover:text-[#1A2F25] hover:bg-white transition-colors cursor-pointer"
            >
              Reset Simulation
            </button>
            <button
              type="button"
              onClick={handleExecuteBatch}
              disabled={isProcessing || approvedCount === 0}
              className="px-4 py-1.5 bg-[#E06D53] hover:bg-[#CD5B42] text-white text-xs font-mono font-bold uppercase disabled:opacity-40 transition-all cursor-pointer shadow-xs flex items-center gap-2"
            >
              <span>{isProcessing ? "Dispatching via Gmail..." : `Commit Approved (${approvedCount}) →`}</span>
            </button>
          </div>
        </div>

        {commitSuccess && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-6 py-2.5 text-xs font-mono text-emerald-800 flex items-center justify-between animate-in fade-in">
            <span>✓ Verified: Emails dispatched via Gmail FastMCP adapter. Ground truth synced back to Google Sheets.</span>
            <span className="font-bold">STATUS: 200 OK</span>
          </div>
        )}

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#1A2F25]/15">
          {/* Staged Dispatch Tray (Left 7 Cols) */}
          <div className="lg:col-span-7 p-6 space-y-4">
            <div className="flex items-center justify-between text-xs font-mono text-[#526359] uppercase tracking-wider mb-2">
              <span>STAGED OPERATOR REVIEW TRAY ({invoices.length} ITEMS)</span>
              <span className="text-[#E06D53] font-semibold">1-CLICK AUTHORIZATION</span>
            </div>

            {invoices.map((inv) => (
              <div
                key={inv.id}
                className={`p-4 border transition-all ${
                  inv.status === "dispatched"
                    ? "border-emerald-600/40 bg-emerald-50/50"
                    : inv.status === "paid"
                    ? "border-blue-600/40 bg-blue-50/40"
                    : inv.status === "approved"
                    ? "border-[#E06D53] bg-orange-50/30 ring-1 ring-[#E06D53]"
                    : inv.status === "rejected"
                    ? "border-red-400/40 bg-red-50/30 opacity-75"
                    : "border-[#1A2F25]/15 bg-white/85"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-[#1A2F25] bg-[#1A2F25]/5 px-2 py-0.5">
                      {inv.id}
                    </span>
                    <span className="font-sans font-bold text-sm text-[#1A2F25]">
                      {inv.client}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-[#1A2F25]">
                      ${inv.amount.toLocaleString()}
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 border border-[#1A2F25]/15 bg-white text-[#526359]">
                      {inv.daysOverdue}D OVERDUE
                    </span>
                  </div>
                </div>

                {/* Email Draft Snippet */}
                <p className="font-mono text-[11px] text-[#526359] bg-[#1A2F25]/5 p-3 my-2 border-l-2 border-[#E06D53] leading-relaxed">
                  {inv.emailDraft}
                </p>

                {/* Status Badges & Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 mt-2 border-t border-[#1A2F25]/10">
                  <div className="text-[11px] font-mono">
                    STATUS:{" "}
                    <span
                      className={`font-bold ${
                        inv.status === "dispatched"
                          ? "text-emerald-700"
                          : inv.status === "paid"
                          ? "text-blue-700"
                          : inv.status === "approved"
                          ? "text-[#E06D53]"
                          : inv.status === "rejected"
                          ? "text-red-700"
                          : "text-[#526359]"
                      }`}
                    >
                      {inv.status.toUpperCase()}
                    </span>
                  </div>

                  {inv.status === "pending_review" && (
                    <div className="flex items-center gap-2">
                      {inv.hasContact ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleAction(inv.id, "approve")}
                            className="px-3 py-1 bg-white hover:bg-emerald-600 hover:text-white border border-[#1A2F25]/20 text-[11px] font-mono transition-colors text-emerald-700 font-bold cursor-pointer"
                          >
                            ✓ Approve
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAction(inv.id, "reject")}
                            className="px-3 py-1 bg-white hover:bg-red-600 hover:text-white border border-[#1A2F25]/20 text-[11px] font-mono transition-colors text-red-700 cursor-pointer"
                          >
                            ✕ Reject
                          </button>
                          <button
                            type="button"
                            onClick={() => handleAction(inv.id, "mark_paid")}
                            title="Simulate bank wire arriving to test dynamic replan"
                            className="px-3 py-1 bg-[#1A2F25]/5 hover:bg-[#1A2F25] hover:text-white border border-[#1A2F25]/20 text-[11px] font-mono transition-colors text-[#1A2F25] cursor-pointer"
                          >
                            ⚡ Simulate Paid
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-2.5 py-1 border border-amber-300 font-semibold">
                          BLOCKED: MISSING EMAIL FIELD
                        </span>
                      )}
                    </div>
                  )}

                  {inv.status === "approved" && (
                    <span className="text-[11px] font-mono text-[#E06D53] font-semibold">
                      Ready in commit batch &middot; Click top button to dispatch
                    </span>
                  )}
                  {inv.status === "dispatched" && (
                    <span className="text-[11px] font-mono text-emerald-700 font-semibold">
                      ✓ Dispatched via Gmail API &middot; Logged to Audit
                    </span>
                  )}
                  {inv.status === "paid" && (
                    <span className="text-[11px] font-mono text-blue-700 font-semibold">
                      ✓ Replanned: Payment settled in transit &middot; Cancelled
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Formatted Audit Feed (Right 5 Cols) */}
          <div className="lg:col-span-5 p-6 bg-[#1A2F25] text-[#F8F6F2] font-mono text-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#F8F6F2]/15 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  <span className="text-[#E5A93C] uppercase tracking-wider font-bold">
                    CRYPTOGRAPHIC AUDIT LEDGER
                  </span>
                </div>
                <span className="text-[10px] text-[#B9C4BD]">STREAM: LIVE</span>
              </div>

              <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
                {auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 border border-[#F8F6F2]/10 bg-black/25 text-[11px] leading-relaxed text-[#B9C4BD]"
                  >
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-[#E5A93C] font-semibold">{log.timestamp}</span>
                      <span className="px-1.5 py-0.2 bg-white/10 text-white font-mono text-[9px]">
                        {log.actor}
                      </span>
                    </div>
                    <div className="text-white">{log.message}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#F8F6F2]/15 flex items-center justify-between text-[10px] text-[#B9C4BD]">
              <span>HITL INTEGRITY: ENFORCED</span>
              <span className="text-emerald-400 font-semibold">ZERO BYPASS</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
