"use client";

import Link from "next/link";

export default function CtaSection() {
  return (
    <section id="deploy" className="py-24 px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20">
      <div className="relative border border-[#1A2F25]/20 bg-white/75 backdrop-blur-2xl p-8 md:p-16 overflow-hidden shadow-glass-node">
        {/* Warm Ambient Glow behind the block */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-gradient-to-tl from-[#E5A93C]/30 via-[#E06D53]/25 to-transparent blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -top-20 w-80 h-80 bg-gradient-to-br from-[#1A2F25]/5 via-[#E06D53]/15 to-transparent blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-[#1A2F25]/20 bg-white/80 text-xs font-mono tracking-widest uppercase mb-6 text-[#1A2F25] shadow-2xs">
            <span className="w-2 h-2 bg-[#E06D53] inline-block animate-pulse"></span>
            <span>ENTERPRISE ONBOARDING // SELF-SERVE PILOT</span>
          </div>

          <h2 className="font-editorial text-4xl sm:text-5xl md:text-6xl text-[#1A2F25] font-normal leading-[1.05] mb-6">
            Automate your first operational workflow in under 5 minutes.
          </h2>

          <p className="font-sans text-base sm:text-lg text-[#526359] leading-relaxed mb-10 max-w-2xl font-normal">
            Connect your Google Workspace in 60 seconds, stage multi-step financial and operational workflows, and enforce mandatory Human-in-the-Loop gates before any external action dispatches.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
            <Link
              href="/signup"
              className="px-8 py-4 bg-[#E06D53] hover:bg-[#CD5B42] text-white font-sans text-sm tracking-wider uppercase font-semibold transition-all duration-200 flex items-center justify-center gap-3 border border-[#E06D53] shadow-md group"
            >
              <span>Register Your Business Free</span>
              <svg
                className="w-4 h-4 stroke-white stroke-[2] group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="square" strokeLinejoin="miter" d="M5 12h14m-6-6l6 6-6 6" />
              </svg>
            </Link>

            <Link
              href="/signin"
              className="px-8 py-4 bg-white hover:bg-[#F8F6F2] text-[#1A2F25] font-sans text-sm tracking-wider uppercase font-semibold transition-all duration-200 flex items-center justify-center gap-2 border border-[#1A2F25]/20 shadow-2xs"
            >
              <span>Sign In to Workspace</span>
            </Link>
          </div>

          <div className="mt-10 pt-6 border-t border-[#1A2F25]/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono text-[#526359]">
            <div className="flex items-center gap-2">
              <span className="text-emerald-700 font-bold">✓</span>
              <span>14-Day Free Pilot</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-700 font-bold">✓</span>
              <span>No Credit Card</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-700 font-bold">✓</span>
              <span>OAuth 2.0 PKCE</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-emerald-700 font-bold">✓</span>
              <span>Zero Model Training</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
