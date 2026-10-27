"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AxiomflowLogo from "./AxiomflowLogo";

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    try {
      const session = localStorage.getItem("axiomflow_session");
      if (session) {
        setHasSession(true);
      }
    } catch {
      // Ignore
    }
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#F8F6F2]/85 backdrop-blur-md border-b border-[#1A2F25]/10 shadow-[0_4px_20px_-4px_rgba(26,47,37,0.03)] transition-all">
      <div className="max-w-7xl mx-auto px-6 md:px-10 h-20 flex items-center justify-between">
        {/* Brand Lockup */}
        <Link href="/" className="flex items-center gap-3 group" aria-label="Axiomflow Home">
          <AxiomflowLogo variant="full" size={32} />
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden lg:flex items-center gap-7 text-[12px] font-medium tracking-wider uppercase text-[#526359]">
          <a
            href="#how-it-works"
            className="hover:text-[#1A2F25] transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#E06D53] hover:after:w-full after:transition-all after:duration-300"
          >
            How It Works
          </a>
          <a
            href="#integrations"
            className="hover:text-[#1A2F25] transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#E06D53] hover:after:w-full after:transition-all after:duration-300"
          >
            Integrations
          </a>
          <a
            href="#solutions"
            className="hover:text-[#1A2F25] transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#E06D53] hover:after:w-full after:transition-all after:duration-300"
          >
            Solutions
          </a>
          <a
            href="#sandbox"
            className="hover:text-[#1A2F25] transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#E06D53] hover:after:w-full after:transition-all after:duration-300"
          >
            Live Sandbox
          </a>
          <a
            href="#security"
            className="hover:text-[#1A2F25] transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#E06D53] hover:after:w-full after:transition-all after:duration-300"
          >
            Security & Trust
          </a>
          <a
            href="#faq"
            className="hover:text-[#1A2F25] transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1.5px] after:bg-[#E06D53] hover:after:w-full after:transition-all after:duration-300"
          >
            FAQ
          </a>
        </nav>

        {/* CTA Actions */}
        <div className="hidden sm:flex items-center gap-3">
          {hasSession ? (
            <Link
              href="/dashboard"
              className="px-4 py-2 border border-[#1A2F25]/20 hover:border-[#1A2F25] bg-white/80 hover:bg-white text-[#1A2F25] font-sans text-xs tracking-wider uppercase font-semibold transition-all duration-200 shadow-2xs"
            >
              Open Dashboard &rarr;
            </Link>
          ) : (
            <Link
              href="/signin"
              className="px-4 py-2 text-[#526359] hover:text-[#1A2F25] font-sans text-xs tracking-wider uppercase font-semibold transition-colors"
            >
              Sign In
            </Link>
          )}

          <Link
            href="/signup"
            className="px-5 py-2.5 bg-[#E06D53] hover:bg-[#CD5B42] text-white font-sans text-xs tracking-wider uppercase font-semibold transition-all duration-200 flex items-center gap-2 shadow-xs border border-[#E06D53] group"
          >
            <span>Register Business</span>
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
          className="lg:hidden p-2 text-[#1A2F25] border border-[#1A2F25]/20 bg-white/60"
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
        <div className="lg:hidden border-b border-[#1A2F25]/10 bg-[#F8F6F2] px-6 py-6 flex flex-col gap-3 text-xs font-mono uppercase tracking-wider">
          <a
            href="#how-it-works"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 border-b border-[#1A2F25]/5 text-[#1A2F25] flex justify-between"
          >
            <span>01 // How It Works</span>
            <span className="text-[#526359]">&rarr;</span>
          </a>
          <a
            href="#integrations"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 border-b border-[#1A2F25]/5 text-[#1A2F25] flex justify-between"
          >
            <span>02 // Integrations Suite</span>
            <span className="text-[#526359]">&rarr;</span>
          </a>
          <a
            href="#solutions"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 border-b border-[#1A2F25]/5 text-[#1A2F25] flex justify-between"
          >
            <span>03 // Enterprise Solutions</span>
            <span className="text-[#526359]">&rarr;</span>
          </a>
          <a
            href="#sandbox"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 border-b border-[#1A2F25]/5 text-[#1A2F25] flex justify-between"
          >
            <span>04 // Live HITL Sandbox</span>
            <span className="text-[#526359]">&rarr;</span>
          </a>
          <a
            href="#security"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 border-b border-[#1A2F25]/5 text-[#1A2F25] flex justify-between"
          >
            <span>05 // Security &amp; Trust</span>
            <span className="text-[#526359]">&rarr;</span>
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="py-2 border-b border-[#1A2F25]/5 text-[#1A2F25] flex justify-between"
          >
            <span>06 // Frequently Asked Questions</span>
            <span className="text-[#526359]">&rarr;</span>
          </a>

          <div className="flex flex-col gap-2 mt-3 pt-2 border-t border-[#1A2F25]/10">
            {hasSession ? (
              <Link
                href="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2.5 border border-[#1A2F25]/20 bg-white text-[#1A2F25] font-semibold tracking-wide uppercase"
              >
                Go to Workspace Dashboard &rarr;
              </Link>
            ) : (
              <Link
                href="/signin"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2.5 border border-[#1A2F25]/20 bg-white/70 text-[#1A2F25] font-semibold tracking-wide uppercase"
              >
                Sign In
              </Link>
            )}
            <Link
              href="/signup"
              onClick={() => setMobileMenuOpen(false)}
              className="text-center py-3 bg-[#E06D53] hover:bg-[#CD5B42] text-white font-semibold tracking-wide uppercase"
            >
              Register Business &rarr;
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
