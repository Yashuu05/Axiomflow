"use client";

import { useState } from "react";
import Link from "next/link";
import AxiomflowLogo from "./AxiomflowLogo";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#F8F6F2]/80 backdrop-blur-md border-b border-[#1A2F25]/10">
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-20 flex items-center justify-between">
        {/* Brand Lockup */}
        <a href="#" className="flex items-center gap-3 group" aria-label="Axiomflow Home">
          <AxiomflowLogo variant="full" size={32} />
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium tracking-wide uppercase text-[#526359]">
          <a
            href="#pipeline"
            className="hover:text-[#1A2F25] transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#E06D53] hover:after:w-full after:transition-all after:duration-300"
          >
            Runtime Pipeline
          </a>
          <a
            href="#architecture"
            className="hover:text-[#1A2F25] transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#E06D53] hover:after:w-full after:transition-all after:duration-300"
          >
            Deterministic Engine
          </a>
          <a
            href="#capabilities"
            className="hover:text-[#1A2F25] transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#E06D53] hover:after:w-full after:transition-all after:duration-300"
          >
            Capabilities
          </a>
          <a
            href="#demo"
            className="hover:text-[#1A2F25] transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#E06D53] hover:after:w-full after:transition-all after:duration-300"
          >
            Live Simulation
          </a>
        </nav>

        {/* CTA Button */}
        <div className="hidden sm:flex items-center gap-4">
          <span className="hidden lg:inline-flex items-center gap-2 text-xs font-mono text-[#526359] px-2.5 py-1 border border-[#1A2F25]/10 bg-white/50">
            <span className="w-1.5 h-1.5 bg-emerald-600"></span>
            SYS_HEALTH: 99.99%
          </span>
          <Link
            href="/dashboard"
            className="px-3.5 py-2 text-[#1A2F25] hover:text-[#E06D53] border border-[#1A2F25]/20 hover:border-[#E06D53] bg-white/70 hover:bg-white font-sans text-xs tracking-wider uppercase font-semibold transition-all duration-200"
          >
            Dashboard
          </Link>
          <Link
            href="/signin"
            className="px-3.5 py-2 text-[#526359] hover:text-[#1A2F25] font-sans text-xs tracking-wider uppercase font-semibold transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 bg-[#E06D53] hover:bg-[#CD5B42] text-white font-sans text-xs tracking-wider uppercase font-semibold transition-all duration-200 flex items-center gap-2.5 shadow-sm border border-[#E06D53] group"
          >
            <span>Register</span>
            <svg
              className="w-3.5 h-3.5 stroke-white group-hover:translate-x-1 transition-transform"
              fill="none"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="square" strokeLinejoin="miter" d="M5 12h14m-6-6l6 6-6 6" />
            </svg>
          </Link>
        </div>

        {/* Mobile menu button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 text-[#1A2F25] border border-[#1A2F25]/20 bg-white/60"
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
            {mobileMenuOpen ? (
              <path strokeLinecap="square" strokeLinejoin="miter" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="square" strokeLinejoin="miter" d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-[#1A2F25]/10 bg-[#F8F6F2] px-6 py-6 flex flex-col gap-4 text-xs font-mono uppercase tracking-wider">
          <a
            href="#pipeline"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 border-b border-[#1A2F25]/5 text-[#1A2F25]"
          >
            01 // Runtime Pipeline
          </a>
          <a
            href="#architecture"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 border-b border-[#1A2F25]/5 text-[#1A2F25]"
          >
            02 // Deterministic Engine
          </a>
          <a
            href="#capabilities"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 border-b border-[#1A2F25]/5 text-[#1A2F25]"
          >
            03 // Enterprise Capabilities
          </a>
          <a
            href="#demo"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 border-b border-[#1A2F25]/5 text-[#1A2F25]"
          >
            04 // Live Simulation
          </a>
          <div className="flex flex-col gap-2 mt-2">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center py-2.5 border border-[#E06D53] bg-white text-[#E06D53] font-semibold"
            >
              Enter Dashboard &rarr;
            </Link>
            <Link
              href="/signin"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center py-2.5 border border-[#1A2F25]/20 bg-white/70 text-[#1A2F25] font-semibold"
            >
              Sign In
            </Link>
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center py-3 bg-[#E06D53] text-white font-semibold"
            >
              Register Business &rarr;
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
