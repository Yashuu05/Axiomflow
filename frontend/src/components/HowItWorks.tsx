"use client";

export default function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Declare Objective in Plain English",
      category: "NATURAL LANGUAGE PLANNING",
      description:
        "Type any operational objective: 'Sweep sales_q3.xlsx for overdue balances, draft courteous reminders in Gmail, and compile an executive summary in Google Docs.' The agent constructs a structured execution graph with clear dependencies.",
      badge: "INTENT PARSING",
      widget: (
        <div className="p-3 bg-white border border-[#1A2F25]/12 text-xs font-mono text-[#526359] shadow-2xs">
          <div className="flex items-center gap-1.5 text-[#1A2F25] font-semibold mb-1">
            <span className="text-[#E06D53]">❯</span>
            <span>OBJECTIVE RECEIVED:</span>
          </div>
          <div className="text-[11px] text-[#1A2F25] bg-[#F8F6F2] p-2 border-l-2 border-[#E06D53]">
            &quot;Reconcile unpaid invoices &gt; 15 days, check Gmail confirmations, and draft executive brief in Docs.&quot;
          </div>
        </div>
      ),
    },
    {
      num: "02",
      title: "Autonomous Multi-Source Ingestion",
      category: "GROUND TRUTH RECONCILIATION",
      description:
        "The agent queries your Google Sheets register, checks the Gmail inbox for recent wire replies, and queries SQL records. It cross-checks records, calculates aging brackets, and flags missing emails without hallucinating.",
      badge: "MULTI-MODAL INGESTION",
      widget: (
        <div className="p-3 bg-white border border-[#1A2F25]/12 text-xs font-mono text-[#526359] shadow-2xs">
          <div className="flex items-center justify-between text-[11px] mb-1.5">
            <span className="text-[#1A2F25] font-semibold">RECONCILED SOURCES</span>
            <span className="text-emerald-700 font-bold">3 CONNECTED</span>
          </div>
          <div className="flex flex-wrap gap-1.5 text-[10px]">
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5">Sheets: 42 Invoices</span>
            <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5">Gmail: 2 Unread Replies</span>
            <span className="bg-stone-100 text-stone-700 border border-stone-200 px-2 py-0.5">SQL: Customer Balances</span>
          </div>
        </div>
      ),
    },
    {
      num: "03",
      title: "Mandatory Human-in-the-Loop Gate",
      category: "SAFETY & ZERO RUNAWAY RISK",
      description:
        "All drafted communications and external actions are held in an operator review tray. You review each item, edit drafts if desired, and approve or reject. If a client payment clears in the meantime, the in-flight re-planner auto-cancels the reminder.",
      badge: "MANDATORY SIGN-OFF",
      widget: (
        <div className="p-3 bg-white border-2 border-[#E06D53] text-xs font-sans shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-mono mb-2">
            <span className="text-[#E06D53] font-bold">APPROVAL TRAY (1 PENDING)</span>
            <span className="bg-[#E06D53] text-white px-1.5 py-0.5 text-[10px] font-mono">ACTION HELD</span>
          </div>
          <div className="text-xs font-semibold text-[#1A2F25]">Apex Logistics ($4,250.00)</div>
          <div className="mt-2 flex gap-2">
            <button type="button" className="px-2.5 py-1 bg-emerald-600 text-white font-mono text-[10px] font-bold">
              ✓ Approve
            </button>
            <button type="button" className="px-2.5 py-1 bg-white border border-[#1A2F25]/20 text-[#1A2F25] font-mono text-[10px]">
              ✕ Reject
            </button>
          </div>
        </div>
      ),
    },
    {
      num: "04",
      title: "FastMCP Dispatch & Audit Logging",
      category: "DETERMINISTIC MUTATION",
      description:
        "Approved items dispatch via authenticated FastMCP adapters (Gmail API, Docs API, Sheets API). Every prompt, retrieved parameter, and reviewer approval click is cryptographically recorded with millisecond timestamps.",
      badge: "FULL OBSERVABILITY",
      widget: (
        <div className="p-3 bg-white border border-[#1A2F25]/12 text-xs font-mono text-[#526359] shadow-2xs">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-emerald-700 font-bold">✓ 200 OK DISPATCHED</span>
            <span className="text-[#526359]">FAST-MCP</span>
          </div>
          <div className="text-[10px] text-[#526359] leading-snug">
            Email sent via Gmail API &middot; Row updated in Sheets &middot; Logged to Audit Table
          </div>
        </div>
      ),
    },
  ];

  return (
    <section id="how-it-works" className="py-24 px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20">
      <div className="max-w-3xl mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#1A2F25]/20 bg-white/70 text-xs font-mono tracking-widest uppercase mb-4 text-[#1A2F25] shadow-2xs">
          <span>OPERATIONAL ARCHITECTURE // 4-STAGE PIPELINE</span>
        </div>
        <h2 className="font-editorial text-4xl sm:text-5xl md:text-6xl text-[#1A2F25] font-normal leading-tight">
          How Axiomflow turns plain English into verified business execution.
        </h2>
        <p className="mt-4 font-sans text-base sm:text-lg text-[#526359] leading-relaxed">
          A transparent autonomous loop engineered for modern business teams. Complex multi-tool coordination with strict human authorization at every critical step.
        </p>
      </div>

      {/* 4-Step Grid with Connecting Flow Lines */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {steps.map((item, index) => (
          <div
            key={index}
            className="border border-[#1A2F25]/15 bg-white/70 backdrop-blur-md p-6 flex flex-col justify-between hover:border-[#E06D53] hover:shadow-md transition-all duration-300 relative group"
          >
            <div>
              {/* Header with Step Number & Badge */}
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-base font-bold text-[#E06D53] group-hover:scale-105 transition-transform">
                  [{item.num}]
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 border border-[#1A2F25]/10 bg-white text-[#526359]">
                  {item.badge}
                </span>
              </div>

              <div className="text-[10px] font-mono text-[#526359] uppercase tracking-wider mb-1">
                {item.category}
              </div>

              <h3 className="font-sans font-bold text-base text-[#1A2F25] mb-3 leading-snug">
                {item.title}
              </h3>

              <p className="font-sans text-xs text-[#526359] leading-relaxed mb-6">
                {item.description}
              </p>
            </div>

            {/* Micro visual interactive widget */}
            <div>
              {item.widget}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
