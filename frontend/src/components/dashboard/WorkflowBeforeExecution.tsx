"use client";

import { useState } from "react";

interface WorkflowBeforeExecutionProps {
  onStartWorkflow: (objective: string) => void;
}

const PRESET_OBJECTIVES = [
  {
    title: "Finance Team Meeting",
    query:
      'schedule meeting of “Revenue disucssion” to only finance team. Meeting will held on 20/10/2026 at 10:00 a.m',
    badge: "Calendar & Email",
  },
  {
    title: "Investor Dispatch",
    query: "Send email to all investors about upcoming Investor Meeting",
    badge: "Investor Relations",
  },
  {
    title: "Invoice Reconciliation",
    query: "Reconcile overdue invoice INV-204 and dispatch payment reminder via Stripe API",
    badge: "Accounts Receivable",
  },
  {
    title: "Statutory Tax Audit",
    query: "Cross-verify GSTIN tax records against quarterly supplier purchase order register",
    badge: "Compliance",
  },
];

export default function WorkflowBeforeExecution({
  onStartWorkflow,
}: WorkflowBeforeExecutionProps) {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputValue.trim();
    if (!query) {
      // Default fallback to the mockup query if empty
      onStartWorkflow(
        'schedule meeting of “Revenue disucssion” to only finance team. Meeting will held on 20/10/2026 at 10:00 a.m'
      );
      return;
    }
    onStartWorkflow(query);
  };

  return (
    <div className="flex-1 flex flex-col justify-between py-6 md:py-10">
      {/* Centered Welcome Headline */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto my-auto">
        <h1 className="font-editorial text-4xl sm:text-5xl md:text-6xl text-[#E06D53] font-normal leading-[1.15] tracking-tight">
          Welcome Axiomflow.ai, what’s your objective today?
        </h1>
        <p className="font-sans text-sm md:text-base text-[#526359] mt-4 max-w-xl leading-relaxed">
          State your operational intent in natural language. The deterministic runtime decomposes it into verified DAG steps with strict audit gates.
        </p>

        {/* Suggestion prompt chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-8 w-full max-w-2xl text-left">
          {PRESET_OBJECTIVES.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onStartWorkflow(item.query)}
              className="p-3.5 bg-white/70 hover:bg-white border border-[#1A2F25]/10 hover:border-[#E06D53]/60 rounded-xl transition-all shadow-xs group text-left flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="font-editorial text-lg text-[#1A2F25] group-hover:text-[#E06D53] transition-colors">
                  {item.title}
                </span>
                <span className="text-[10px] font-mono text-[#526359] bg-[#F8F6F2] px-2 py-0.5 rounded border border-[#1A2F25]/8">
                  {item.badge}
                </span>
              </div>
              <p className="font-sans text-xs text-[#526359] line-clamp-2 leading-relaxed">
                {item.query}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Composer Bar matching workflow_before_execution.png */}
      <div className="w-full max-w-4xl mx-auto px-2 pt-6">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center bg-white border border-[#E06D53] rounded-full shadow-[0_4px_24px_-6px_rgba(224,109,83,0.15)] focus-within:shadow-[0_6px_28px_-4px_rgba(224,109,83,0.25)] transition-all p-1.5 pl-6"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Send email to all investors about upcoming Investor Meeting"
            className="w-full bg-transparent font-editorial text-lg md:text-xl text-[#1A2F25] placeholder:text-[#526359]/60 focus:outline-none pr-3"
          />

          <button
            type="submit"
            aria-label="Submit objective"
            className="w-12 h-12 rounded-full bg-[#E06D53] hover:bg-[#CD5B42] text-white flex items-center justify-center shrink-0 shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            {/* Paper Airplane Send Icon matching mockup */}
            <svg
              className="w-5 h-5 fill-current transform rotate-45 -translate-y-0.5 -translate-x-0.5"
              viewBox="0 0 24 24"
            >
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
