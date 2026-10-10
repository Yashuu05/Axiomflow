"use client";

import { useState } from "react";

export default function CtaSection() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setSubmitted(true);
    }
  };

  return (
    <section id="deploy" className="py-24 px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20">
      <div className="relative border border-[#1A2F25]/20 bg-white/70 backdrop-blur-2xl p-8 md:p-16 overflow-hidden shadow-glass-node">
        {/* Warm Ambient Glow behind the block */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-gradient-to-tl from-[#E5A93C]/30 via-[#E06D53]/20 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#1A2F25]/20 bg-white/70 text-xs font-mono tracking-widest uppercase mb-6 text-[#526359]">
            <span>SYSTEM ACCESS // PROTOTYPE V1</span>
          </div>

          <h2 className="font-editorial text-4xl sm:text-5xl md:text-6xl text-[#1A2F25] font-normal leading-tight mb-6">
            Deploy deterministic agents across your operational workflows.
          </h2>

          <p className="font-sans text-base text-[#526359] leading-relaxed mb-10 max-w-xl">
            Join the developer preview for Axiomflow. Integrate LangGraph-driven orchestration with FastAPI microservices and guardrail your business from unsupervised mutations.
          </p>

          {submitted ? (
            <div className="p-4 border border-[#E06D53] bg-orange-50/50 text-[#1A2F25] font-mono text-xs flex items-center gap-3">
              <span className="w-2 h-2 bg-[#E06D53]"></span>
              <span>EARLY ACCESS INVITATION STAGED FOR: <strong>{email}</strong>. Welcome to Axiomflow.</span>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-xl">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="developer@company.com"
                className="flex-1 px-4 py-3.5 bg-white border border-[#1A2F25]/20 font-mono text-xs text-[#1A2F25] placeholder:text-[#526359]/70 focus:outline-none focus:border-[#E06D53] shadow-xs"
              />
              <button
                type="submit"
                className="px-6 py-3.5 bg-[#E06D53] hover:bg-[#CD5B42] text-white font-sans text-xs tracking-wider uppercase font-semibold transition-all duration-200 flex items-center justify-center gap-2.5 border border-[#E06D53] shadow-sm whitespace-nowrap"
              >
                <span>Request API Key</span>
                <svg className="w-3.5 h-3.5 stroke-white" fill="none" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-[#1A2F25]/10 flex flex-wrap items-center gap-6 text-[11px] font-mono text-[#526359]">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-emerald-600"></span>
              FastAPI + Uvicorn Ready
            </span>
            <span>&middot;</span>
            <span>LangGraph Agentic Graph</span>
            <span>&middot;</span>
            <span>Zero Hallucination Assertion</span>
          </div>
        </div>
      </div>
    </section>
  );
}
