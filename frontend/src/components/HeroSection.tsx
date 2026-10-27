"use client";

import { useState } from "react";
import Link from "next/link";

export default function HeroSection() {
  const [activeStage, setActiveStage] = useState<number>(2);

  return (
    <section className="relative min-h-screen w-full bg-[#F8F6F2] text-[#1A2F25] overflow-hidden flex flex-col justify-between pt-32 pb-20 px-6 md:px-12 selection:bg-[#E06D53] selection:text-white">
      {/* Ambient Fluid Mesh Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[760px] h-[540px] bg-gradient-to-tr from-[#E5A93C]/25 via-[#E06D53]/20 to-transparent blur-3xl opacity-75 animate-ambient-mesh" />
        <div className="absolute bottom-12 right-1/4 w-[540px] h-[400px] bg-gradient-to-bl from-[#E5A93C]/20 via-[#1A2F25]/5 to-transparent blur-3xl opacity-60" />
      </div>

      {/* Hero Content Stack */}
      <div className="relative z-10 max-w-5xl mx-auto w-full text-center flex flex-col items-center">
        {/* Status / Eyebrow Badge */}
        <div className="inline-flex items-center gap-3 px-3.5 py-1.5 border border-[#1A2F25]/20 bg-white/60 backdrop-blur-md mb-8 shadow-2xs">
          <span className="w-2 h-2 bg-[#E06D53] inline-block animate-pulse"></span>
          <span className="font-sans text-xs tracking-widest uppercase font-semibold text-[#1A2F25]">
            Autonomous Workflow Runtime // Human-in-the-Loop Enforced
          </span>
        </div>

        {/* Editorial Headline */}
        <h1 className="font-editorial text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-normal tracking-tight leading-[0.98] text-[#1A2F25] max-w-4xl">
          Autonomous operations for modern business.
        </h1>
        <h2 className="font-editorial text-3xl sm:text-4xl md:text-5xl text-[#526359] font-normal tracking-tight mt-2 max-w-3xl">
          Strict human control when it matters.
        </h2>

        {/* Subtitle */}
        <p className="font-sans text-base sm:text-lg text-[#526359] max-w-2xl mt-8 font-normal leading-relaxed">
          Coordinate multi-step agentic workflows across Google Workspace, spreadsheets, and databases. Automate invoice follow-ups, executive briefs, and team calendars with mandatory human sign-off gates and zero hallucinations.
        </p>

        {/* Action Triggers */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-10 w-full sm:w-auto">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 bg-[#E06D53] hover:bg-[#CD5B42] text-white font-sans text-xs tracking-wider uppercase font-semibold transition-all duration-200 flex items-center justify-center gap-3 border border-[#E06D53] shadow-md group"
          >
            <span>Register Your Business</span>
            <svg
              className="w-4 h-4 stroke-white stroke-[2] group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="square" strokeLinejoin="miter" d="M5 12h14m-6-6l6 6-6 6" />
            </svg>
          </Link>
          <a
            href="#sandbox"
            className="w-full sm:w-auto px-8 py-4 bg-white/80 hover:bg-white text-[#1A2F25] font-sans text-xs tracking-wider uppercase font-semibold transition-all duration-200 flex items-center justify-center gap-2.5 border border-[#1A2F25]/20 backdrop-blur-md shadow-2xs"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            <span>Test Live Sandbox</span>
          </a>
        </div>

        {/* Trust micro-row */}
        <div className="mt-4 text-xs font-mono text-[#526359] flex flex-wrap items-center justify-center gap-x-4 gap-y-1">
          <span>✓ 14-day free trial</span>
          <span>&middot;</span>
          <span>✓ Connect Google Workspace in 60s</span>
          <span>&middot;</span>
          <span>✓ Self-serve setup</span>
        </div>
      </div>

      {/* Glassmorphic Orchestration Canvas: Realistic Axiomflow Dashboard Workspace */}
      <div id="how-it-works" className="relative z-10 max-w-6xl mx-auto w-full mt-16 scroll-mt-24">
        {/* Floating Badges */}
        <div className="hidden lg:flex absolute -top-5 left-6 z-20 items-center gap-2 px-3 py-1 bg-white border border-[#1A2F25]/15 shadow-sm text-xs font-mono text-[#1A2F25]">
          <span className="text-emerald-600">🛡️</span>
          <span>MANDATORY OPERATOR APPROVAL GATE</span>
        </div>
        <div className="hidden lg:flex absolute -top-5 right-6 z-20 items-center gap-2 px-3 py-1 bg-white border border-[#1A2F25]/15 shadow-sm text-xs font-mono text-[#1A2F25]">
          <span className="text-[#E06D53]">⚡</span>
          <span>FASTMCP GOOGLE WORKSPACE CONNECTED</span>
        </div>

        <div className="w-full border border-[#1A2F25]/15 bg-white/70 backdrop-blur-xl shadow-glass p-6 md:p-8 relative">
          {/* Top Browser / App Workspace Chrome Bar */}
          <div className="flex flex-wrap items-center justify-between border-b border-[#1A2F25]/10 pb-4 mb-8 text-xs font-mono text-[#526359] gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 mr-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block"></span>
              </div>
              <span className="px-2.5 py-0.5 bg-[#1A2F25]/5 text-[#1A2F25] font-semibold">
                ORG: APEX LOGISTICS LTD
              </span>
              <span className="hidden sm:inline text-[#526359]">
                WORKFLOW: AR_OVERDUE_RECOVERY
              </span>
            </div>

            <div className="flex items-center gap-2 tracking-wider">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
              <span className="text-[#E06D53] font-bold">AWAITING HUMAN SIGN-OFF</span>
            </div>
          </div>

          {/* Pipeline Node Visualizer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* SVG Linking Lines for Desktop */}
            <div className="hidden md:block absolute top-1/2 left-[31%] w-[6%] h-[2px] bg-[#1A2F25]/20 z-0 -translate-y-1/2" />
            <div className="hidden md:block absolute top-1/2 left-[64%] w-[6%] h-[2px] bg-[#1A2F25]/20 z-0 -translate-y-1/2" />

            {/* Stage 1: Ingestion Node */}
            <div
              onClick={() => setActiveStage(1)}
              className={`cursor-pointer transition-all duration-300 p-6 flex flex-col justify-between relative border ${
                activeStage === 1
                  ? "border-[#E06D53] bg-white/95 shadow-glass-node"
                  : "border-[#1A2F25]/15 bg-white/70 hover:bg-white/85"
              }`}
            >
              {activeStage === 1 && (
                <div className="absolute -top-3 left-4 px-2 py-0.5 bg-[#E06D53] text-white font-mono text-[10px] tracking-wider uppercase font-semibold">
                  Selected Phase
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs text-[#526359] uppercase font-semibold">01 / Ingestion</span>
                  <div className="p-1.5 border border-[#1A2F25]/15 bg-white text-base">
                    📊
                  </div>
                </div>
                <h3 className="font-sans font-bold text-sm text-[#1A2F25] mb-2">
                  Multi-Source Data Ingestion
                </h3>
                <p className="font-sans text-xs text-[#526359] leading-relaxed">
                  Queries Google Sheets, checks Gmail inbox for recent wire confirmations, and reconciles records with the central SQL ledger.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#1A2F25]/10 flex items-center justify-between text-[11px] font-mono text-[#526359]">
                <span>GROUND TRUTH</span>
                <span className="text-emerald-700 font-semibold">3 RECORDS LOCATED</span>
              </div>
            </div>

            {/* Stage 2: Deterministic Logic Node (Active State) */}
            <div
              onClick={() => setActiveStage(2)}
              className={`cursor-pointer transition-all duration-300 p-6 flex flex-col justify-between relative border ${
                activeStage === 2
                  ? "border-[#E06D53] bg-white/95 shadow-glass-node ring-1 ring-[#E06D53]"
                  : "border-[#1A2F25]/15 bg-white/70 hover:bg-white/85"
              }`}
            >
              <div className="absolute -top-3 left-4 px-2 py-0.5 bg-[#E06D53] text-white font-mono text-[10px] tracking-wider uppercase font-semibold">
                Active Verification Gate
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs text-[#E06D53] uppercase font-bold">
                    02 / Policy &amp; HITL Gate
                  </span>
                  <div className="p-1.5 border border-[#E06D53] bg-[#E06D53]/10 text-base">
                    🛡️
                  </div>
                </div>
                <h3 className="font-sans font-bold text-sm text-[#1A2F25] mb-2">
                  Guardrails &amp; Human Approval
                </h3>
                <p className="font-sans text-xs text-[#526359] leading-relaxed">
                  Applies business aging policy (15d notice, 30d escalation). Stages personalized draft in review tray for operator sign-off before dispatch.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#1A2F25]/10 flex items-center justify-between text-[11px] font-mono text-[#526359]">
                <span>STAGE STATUS</span>
                <span className="text-[#E06D53] font-bold">HELD IN TRAY</span>
              </div>
            </div>

            {/* Stage 3: Execution / Commit Node */}
            <div
              onClick={() => setActiveStage(3)}
              className={`cursor-pointer transition-all duration-300 p-6 flex flex-col justify-between relative border ${
                activeStage === 3
                  ? "border-[#E06D53] bg-white/95 shadow-glass-node"
                  : "border-[#1A2F25]/15 bg-white/70 hover:bg-white/85"
              }`}
            >
              {activeStage === 3 && (
                <div className="absolute -top-3 left-4 px-2 py-0.5 bg-[#E06D53] text-white font-mono text-[10px] tracking-wider uppercase font-semibold">
                  Selected Phase
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs text-[#526359] uppercase font-semibold">03 / Execution</span>
                  <div className="p-1.5 border border-[#1A2F25]/15 bg-white text-base">
                    ✉️
                  </div>
                </div>
                <h3 className="font-sans font-bold text-sm text-[#1A2F25] mb-2">
                  FastMCP Dispatch &amp; Audit Sync
                </h3>
                <p className="font-sans text-xs text-[#526359] leading-relaxed">
                  Dispatches approved reminder via Gmail API, generates executive brief in Google Docs, and logs immutable timestamped audit trail.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#1A2F25]/10 flex items-center justify-between text-[11px] font-mono text-[#526359]">
                <span>DISPATCH ENGINE</span>
                <span className="text-emerald-700 font-semibold">GMAIL + DOCS API</span>
              </div>
            </div>
          </div>

          {/* Bottom Telemetry Bar */}
          <div className="mt-6 pt-4 border-t border-[#1A2F25]/10 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-[#526359] gap-2">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#E06D53]"></span>
              SAFETY GUARANTEE: ZERO ACTIONS SENT WITHOUT EXPLICIT OPERATOR APPROVAL
            </span>
            <span>VERIFIED FAST-MCP ADAPTERS: 4 ACTIVE</span>
          </div>
        </div>
      </div>
    </section>
  );
}
