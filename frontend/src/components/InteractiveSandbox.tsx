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
      "[FLAGGED]: Contact email missing from accounts master. Cannot dispatch without operator manual update.",
  },
];

export default function InteractiveSandbox() {
  const [invoices, setInvoices] = useState<WorkflowItem[]>(INITIAL_INVOICES);
  const [simulatedLogs, setSimulatedLogs] = useState<string[]>([
    "18:32:04 [INIT] Objective received: 'Reconcile and collect overdue invoices over 10 days'",
    "18:32:05 [INGEST] Parsed 3 records from local finance register (CSV)",
    "18:32:06 [EVAL] Identified 2 eligible contacts, 1 missing contact flag",
    "18:32:07 [HITL_GATE] Dispatches paused: Waiting for operator approval",
  ]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleAction = (id: string, action: "approve" | "reject" | "mark_paid") => {
    setInvoices((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (action === "approve") {
            return { ...item, status: "approved" };
          }
          if (action === "reject") {
            return { ...item, status: "rejected" };
          }
          if (action === "mark_paid") {
            return { ...item, status: "paid" };
          }
        }
        return item;
      })
    );

    const target = invoices.find((inv) => inv.id === id);
    const time = new Date().toLocaleTimeString();
    if (action === "approve") {
      setSimulatedLogs((prev) => [
        `${time} [OPERATOR_APPROVAL] Approved dispatch for ${target?.client} (${target?.id})`,
        ...prev,
      ]);
    } else if (action === "reject") {
      setSimulatedLogs((prev) => [
        `${time} [OPERATOR_REJECT] Rejected dispatch for ${target?.client}. Reason logged: Manual exemption`,
        ...prev,
      ]);
    } else if (action === "mark_paid") {
      setSimulatedLogs((prev) => [
        `${time} [REPLAN_TRIGGER] Payment detected in transit for ${target?.id}! Cancelling reminder queue dynamically.`,
        ...prev,
      ]);
    }
  };

  const handleExecuteBatch = () => {
    setIsProcessing(true);
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
      setSimulatedLogs((prev) => [
        `${time} [MUTATION_SUCCESS] Dispatched verified emails & updated database state: 200 OK`,
        ...prev,
      ]);
      setIsProcessing(false);
    }, 900);
  };

  const handleReset = () => {
    setInvoices(INITIAL_INVOICES);
    setSimulatedLogs([
      "18:32:04 [INIT] Objective received: 'Reconcile and collect overdue invoices over 10 days'",
      "18:32:05 [INGEST] Parsed 3 records from local finance register (CSV)",
      "18:32:06 [EVAL] Identified 2 eligible contacts, 1 missing contact flag",
      "18:32:07 [HITL_GATE] Dispatches paused: Waiting for operator approval",
    ]);
  };

  return (
    <section id="demo" className="py-24 px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20">
      {/* Title */}
      <div className="max-w-3xl mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#1A2F25]/20 bg-white/60 text-xs font-mono tracking-widest uppercase mb-4 text-[#526359]">
          <span>INTERACTIVE SANDBOX &middot; VERSION 1.0</span>
        </div>
        <h2 className="font-editorial text-4xl sm:text-5xl md:text-6xl text-[#1A2F25] font-normal leading-tight">
          Test the Human-in-the-Loop approval gate.
        </h2>
        <p className="mt-4 font-sans text-[#526359] text-base leading-relaxed">
          Experience how Axiomflow holds external communications in a staging queue, prevents actions on missing fields, and dynamically replans when payment settles in real-time.
        </p>
      </div>

      {/* Main Sandbox Window */}
      <div className="border border-[#1A2F25]/20 bg-white/60 backdrop-blur-xl shadow-glass">
        {/* Sandbox Bar */}
        <div className="border-b border-[#1A2F25]/15 p-4 md:px-6 flex flex-wrap items-center justify-between gap-4 bg-white/80">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 bg-[#E06D53]"></span>
            <span className="font-mono text-xs font-bold text-[#1A2F25]">
              SIMULATION ENGINE: AR_COLLECTION_AGENT
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleReset}
              className="px-3 py-1.5 border border-[#1A2F25]/20 text-xs font-mono text-[#526359] hover:text-[#1A2F25] hover:bg-white"
            >
              Reset Simulation
            </button>
            <button
              onClick={handleExecuteBatch}
              disabled={isProcessing}
              className="px-4 py-1.5 bg-[#E06D53] hover:bg-[#CD5B42] text-white text-xs font-mono font-semibold uppercase disabled:opacity-50"
            >
              {isProcessing ? "Committing Actions..." : "Commit Approved Batch &rarr;"}
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#1A2F25]/15">
          {/* Invoices List / HITL Control Tray */}
          <div className="lg:col-span-7 p-6 space-y-4">
            <div className="text-xs font-mono text-[#526359] uppercase tracking-wider mb-2">
              STAGED DISPATCH TRAY ({invoices.length} ITEMS)
            </div>

            {invoices.map((inv) => (
              <div
                key={inv.id}
                className={`p-4 border transition-all ${
                  inv.status === "dispatched"
                    ? "border-emerald-600/40 bg-emerald-50/40"
                    : inv.status === "paid"
                    ? "border-blue-600/40 bg-blue-50/30"
                    : inv.status === "approved"
                    ? "border-[#E06D53] bg-orange-50/20"
                    : inv.status === "rejected"
                    ? "border-red-400/40 bg-red-50/20 opacity-75"
                    : "border-[#1A2F25]/15 bg-white/80"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div>
                    <span className="font-mono font-bold text-xs text-[#1A2F25] mr-2">
                      {inv.id}
                    </span>
                    <span className="font-sans font-semibold text-sm text-[#1A2F25]">
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
                <p className="font-mono text-[11px] text-[#526359] bg-[#1A2F25]/5 p-2.5 my-2 border-l-2 border-[#E06D53]">
                  {inv.emailDraft}
                </p>

                {/* Status Badges & Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 mt-2 border-t border-[#1A2F25]/10">
                  <div className="text-[11px] font-mono">
                    STATUS:{" "}
                    <span
                      className={`font-semibold ${
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
                            onClick={() => handleAction(inv.id, "approve")}
                            className="px-2.5 py-1 bg-white hover:bg-emerald-600 hover:text-white border border-[#1A2F25]/20 text-[11px] font-mono transition-colors text-emerald-700 font-semibold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleAction(inv.id, "reject")}
                            className="px-2.5 py-1 bg-white hover:bg-red-600 hover:text-white border border-[#1A2F25]/20 text-[11px] font-mono transition-colors text-red-700"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => handleAction(inv.id, "mark_paid")}
                            title="Simulate payment arrival to trigger dynamic replan"
                            className="px-2.5 py-1 bg-[#1A2F25]/5 hover:bg-[#1A2F25] hover:text-white border border-[#1A2F25]/20 text-[11px] font-mono transition-colors text-[#1A2F25]"
                          >
                            Simulate Paid
                          </button>
                        </>
                      ) : (
                        <span className="text-[10px] font-mono text-amber-700 bg-amber-50 px-2 py-1 border border-amber-300">
                          BLOCKED: MISSING CONTACT DATA
                        </span>
                      )}
                    </div>
                  )}

                  {inv.status === "approved" && (
                    <span className="text-[11px] font-mono text-[#E06D53] font-medium">
                      Ready in commit batch
                    </span>
                  )}
                  {inv.status === "dispatched" && (
                    <span className="text-[11px] font-mono text-emerald-700 font-medium">
                      Delivered via SMTP Gateway
                    </span>
                  )}
                  {inv.status === "paid" && (
                    <span className="text-[11px] font-mono text-blue-700 font-medium">
                      Replanned: Item closed
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Audit Trail & Live Engine Console */}
          <div className="lg:col-span-5 p-6 bg-[#1A2F25] text-[#F8F6F2] font-mono text-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between border-b border-[#F8F6F2]/15 pb-3 mb-4">
                <span className="text-[#E5A93C] uppercase tracking-wider font-semibold">
                  AUDIT TRAIL & DISPATCH LOG
                </span>
                <span className="text-[10px] text-[#B9C4BD]">STREAM: ACTIVE</span>
              </div>

              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {simulatedLogs.map((log, index) => (
                  <div
                    key={index}
                    className="p-2 border border-[#F8F6F2]/10 bg-black/20 text-[11px] leading-relaxed text-[#B9C4BD]"
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-[#F8F6F2]/15 flex items-center justify-between text-[10px] text-[#B9C4BD]">
              <span>HITL INTEGRITY: ENFORCED</span>
              <span>ZERO HALLUCINATIONS</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
