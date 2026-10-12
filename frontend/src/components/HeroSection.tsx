"use client";

import { useState } from "react";
import Link from "next/link";

export default function HeroSection() {
  const [activeStage, setActiveStage] = useState<number>(2);

  return (
    <section className="relative min-h-screen w-full bg-[#F8F6F2] text-[#1A2F25] overflow-hidden flex flex-col justify-between pt-32 pb-20 px-6 md:px-12 selection:bg-[#E06D53] selection:text-white">
      {/* Ambient Fluid Mesh Background */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[520px] bg-gradient-to-tr from-[#E5A93C]/25 via-[#E06D53]/20 to-transparent blur-3xl opacity-75 animate-ambient-mesh" />
        <div className="absolute bottom-12 right-1/4 w-[520px] h-[380px] bg-gradient-to-bl from-[#E5A93C]/20 via-[#1A2F25]/5 to-transparent blur-3xl opacity-60" />
      </div>

      {/* Hero Content Stack */}
      <div className="relative z-10 max-w-5xl mx-auto w-full text-center flex flex-col items-center">
        {/* Status / Eyebrow Badge */}
        <div className="inline-flex items-center gap-3 px-3.5 py-1.5 border border-[#1A2F25]/20 bg-white/50 backdrop-blur-md mb-8">
          <span className="w-2 h-2 bg-[#E06D53] inline-block animate-pulse"></span>
          <span className="font-sans text-xs tracking-widest uppercase font-semibold text-[#1A2F25]">
            Autonomous Runtime Architecture
          </span>
        </div>

        {/* Editorial Headline */}
        <h1 className="font-editorial text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-normal tracking-tight leading-[0.98] text-[#1A2F25] max-w-4xl">
          Deterministic execution for complex service operations.
        </h1>

        {/* Subtitle */}
        <p className="font-sans text-base sm:text-lg text-[#526359] max-w-2xl mt-8 font-normal leading-relaxed">
          Coordinate agentic workflows across ticketing, financial reconciliation, and onboarding with strict verification gates, human-in-the-loop approvals, and zero hallucinations.
        </p>

        {/* Action Triggers */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mt-10 w-full sm:w-auto">
          <Link
            href="/signup"
            className="w-full sm:w-auto px-8 py-4 bg-[#E06D53] hover:bg-[#CD5B42] text-white font-sans text-sm tracking-wide font-medium transition-all duration-200 flex items-center justify-center gap-3 border border-[#E06D53] shadow-sm group"
          >
            <span>Register Business</span>
            <svg
              className="w-4 h-4 stroke-white stroke-[1.75] group-hover:translate-x-1 transition-transform"
              fill="none"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="square" strokeLinejoin="miter" d="M5 12h14m-6-6l6 6-6 6" />
            </svg>
          </Link>
          <a
            href="#demo"
            className="w-full sm:w-auto px-8 py-4 bg-white/70 hover:bg-white text-[#1A2F25] font-sans text-sm tracking-wide font-medium transition-all duration-200 flex items-center justify-center gap-3 border border-[#1A2F25]/15 backdrop-blur-md shadow-sm"
          >
            <span>Inspect System Traces</span>
            <span className="font-mono text-xs text-[#526359]">[V1_DEMO]</span>
          </a>
        </div>
      </div>

      {/* Glassmorphic Orchestration Canvas (Mock Engine) */}
      <div id="pipeline" className="relative z-10 max-w-6xl mx-auto w-full mt-16 scroll-mt-24">
        <div className="w-full border border-[#1A2F25]/15 bg-white/50 backdrop-blur-xl shadow-glass p-6 md:p-8 relative">
          {/* Top Window Metadata Bar */}
          <div className="flex items-center justify-between border-b border-[#1A2F25]/10 pb-4 mb-8 text-xs font-mono text-[#526359]">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-700"></span>
                CLUSTER ACTIVE: IN-MUM-01
              </span>
              <span className="hidden md:inline border-l border-[#1A2F25]/10 pl-4">
                SYNC LATENCY: 24MS
              </span>
              <span className="hidden sm:inline border-l border-[#1A2F25]/10 pl-4">
                AGENT: LANGGRAPH_HYBRID
              </span>
            </div>
            <div className="flex items-center gap-2 tracking-wider">
              <span className="text-[#1A2F25] font-semibold">RUN_ID: 8F92A-AXF</span>
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
                  Selected Node
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs text-[#526359] uppercase">01 / Ingestion</span>
                  <div className="p-1.5 border border-[#1A2F25]/15 bg-white">
                    <svg className="w-4 h-4 stroke-[#1A2F25] stroke-[1.5]" fill="none" viewBox="0 0 24 24">
                      <path strokeLinecap="square" strokeLinejoin="miter" d="M4 4h16v16H4zM4 9h16M9 4v16" />
                    </svg>
                  </div>
                </div>
                <h4 className="font-sans font-semibold text-sm text-[#1A2F25] mb-2">
                  Multichannel Inbound
                </h4>
                <p className="font-sans text-xs text-[#526359] leading-relaxed">
                  Consumes incoming tickets from WhatsApp Gateway, Gmail IMAP, and ERP webhooks into an indexed state graph.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#1A2F25]/10 flex items-center justify-between text-[11px] font-mono text-[#526359]">
                <span>STREAM PARSER</span>
                <span className="text-[#1A2F25] font-semibold">VALIDATED</span>
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
                Active Evaluation
              </div>
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs text-[#E06D53] uppercase font-semibold">
                    02 / Policy Logic
                  </span>
                  <div className="p-1.5 border border-[#E06D53] bg-[#E06D53]/10">
                    <svg className="w-4 h-4 stroke-[#E06D53] stroke-[1.5]" fill="none" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="square"
                        strokeLinejoin="miter"
                        d="M12 2l10 6.5v7L12 22 2 15.5v-7L12 2zM12 22V12m10-3.5L12 12 2 8.5"
                      />
                    </svg>
                  </div>
                </div>
                <h4 className="font-sans font-semibold text-sm text-[#1A2F25] mb-2">
                  Guardrail & Context Engine
                </h4>
                <p className="font-sans text-xs text-[#526359] leading-relaxed">
                  Verifies customer account entitlement, checks invoice aging thresholds, and triggers mandatory HITL approval before dispatch.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#1A2F25]/10 flex items-center justify-between text-[11px] font-mono text-[#526359]">
                <span>HITL GATE</span>
                <span className="text-[#E06D53] font-semibold">PASS (AUTO_APPROVAL)</span>
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
                  Selected Node
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs text-[#526359] uppercase">03 / Execution</span>
                  <div className="p-1.5 border border-[#1A2F25]/15 bg-white">
                    <svg className="w-4 h-4 stroke-[#1A2F25] stroke-[1.5]" fill="none" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="square"
                        strokeLinejoin="miter"
                        d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3"
                      />
                    </svg>
                  </div>
                </div>
                <h4 className="font-sans font-semibold text-sm text-[#1A2F25] mb-2">
                  Database & Gateway Commit
                </h4>
                <p className="font-sans text-xs text-[#526359] leading-relaxed">
                  Dispatches tailored invoice reminder via API, writes immutable audit record, and synchronizes status back to AWS RDS.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-[#1A2F25]/10 flex items-center justify-between text-[11px] font-mono text-[#526359]">
                <span>OUTCOME</span>
                <span className="text-[#1A2F25] font-semibold">200 OK / DISPATCHED</span>
              </div>
            </div>
          </div>

          {/* Bottom Telemetry Bar */}
          <div className="mt-6 pt-4 border-t border-[#1A2F25]/10 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-[#526359] gap-2">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#E06D53]"></span>
              TELEMETRY: ZERO HALLUCINATION ASSERTION STRICT_MODE
            </span>
            <span>VERIFICATION RUNTIME: 312MS</span>
          </div>
        </div>
      </div>
    </section>
  );
}
