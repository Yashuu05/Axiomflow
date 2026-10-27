import Link from "next/link";
import AxiomflowLogo from "./AxiomflowLogo";

export default function Footer() {
  return (
    <footer className="border-t border-[#1A2F25]/12 bg-[#F8F6F2] py-16 px-6 md:px-12 text-[#1A2F25]">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-start justify-between gap-12">
        {/* Brand Lockup and Mission */}
        <div className="max-w-sm">
          <Link href="/" aria-label="Axiomflow Home">
            <AxiomflowLogo variant="full" size={30} />
          </Link>
          <p className="mt-4 font-sans text-xs text-[#526359] leading-relaxed">
            Axiomflow provides deterministic agentic execution for mission-critical business workflows. Built with mandatory human-in-the-loop safety gates, zero-token FastMCP adapters, and verifiable audit logging.
          </p>
          <div className="mt-5 inline-flex items-center gap-2 text-[11px] font-mono text-[#526359] px-3 py-1.5 border border-[#1A2F25]/10 bg-white/70 shadow-2xs">
            <span className="w-2 h-2 bg-emerald-600 rounded-full animate-pulse"></span>
            <span>SYSTEM STATUS: ALL SERVICES OPERATIONAL</span>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-xs font-sans">
          <div>
            <div className="font-mono uppercase font-bold text-[#1A2F25] tracking-wider text-[11px] mb-4">
              Platform
            </div>
            <ul className="space-y-2.5 text-[#526359]">
              <li><a href="#how-it-works" className="hover:text-[#1A2F25] transition-colors">How It Works</a></li>
              <li><a href="#integrations" className="hover:text-[#1A2F25] transition-colors">Tool Integrations</a></li>
              <li><a href="#solutions" className="hover:text-[#1A2F25] transition-colors">Enterprise Solutions</a></li>
              <li><a href="#sandbox" className="hover:text-[#1A2F25] transition-colors">Interactive Sandbox</a></li>
              <li><a href="#security" className="hover:text-[#1A2F25] transition-colors">Security &amp; Governance</a></li>
            </ul>
          </div>

          <div>
            <div className="font-mono uppercase font-bold text-[#1A2F25] tracking-wider text-[11px] mb-4">
              Solutions
            </div>
            <ul className="space-y-2.5 text-[#526359]">
              <li><a href="#solutions" className="hover:text-[#1A2F25] transition-colors">Accounts Receivable</a></li>
              <li><a href="#solutions" className="hover:text-[#1A2F25] transition-colors">Executive Briefings</a></li>
              <li><a href="#solutions" className="hover:text-[#1A2F25] transition-colors">Calendar Team Sync</a></li>
              <li><a href="#solutions" className="hover:text-[#1A2F25] transition-colors">Compliance Audits</a></li>
              <li><a href="#solutions" className="hover:text-[#1A2F25] transition-colors">Google Workspace FastMCP</a></li>
            </ul>
          </div>

          <div>
            <div className="font-mono uppercase font-bold text-[#1A2F25] tracking-wider text-[11px] mb-4">
              Governance
            </div>
            <ul className="space-y-2.5 text-[#526359]">
              <li><span className="text-[#1A2F25] font-medium">OAuth 2.0 PKCE</span></li>
              <li><span className="text-[#1A2F25] font-medium">Human-in-the-Loop Gates</span></li>
              <li><span className="text-[#1A2F25] font-medium">Deterministic Graph Logic</span></li>
              <li><span className="text-[#1A2F25] font-medium">Zero Model Training</span></li>
              <li><span className="text-[#1A2F25] font-medium">Immutable Audit Trail</span></li>
            </ul>
          </div>

          <div>
            <div className="font-mono uppercase font-bold text-[#1A2F25] tracking-wider text-[11px] mb-4">
              Account &amp; Legal
            </div>
            <ul className="space-y-2.5 text-[#526359]">
              <li><Link href="/signup" className="text-[#E06D53] hover:underline font-medium">Register Business</Link></li>
              <li><Link href="/signin" className="hover:text-[#1A2F25] transition-colors">Sign In to Workspace</Link></li>
              <li><Link href="/dashboard" className="hover:text-[#1A2F25] transition-colors">Live Dashboard</Link></li>
              <li><a href="#faq" className="hover:text-[#1A2F25] transition-colors">Security Whitepaper</a></li>
              <li><a href="#faq" className="hover:text-[#1A2F25] transition-colors">Privacy &amp; Terms</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-[#1A2F25]/10 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-[#526359] gap-4">
        <div>
          &copy; 2026 Axiomflow Technologies. All rights reserved.
        </div>
        <div className="flex items-center gap-4">
          <span>Autonomous Business Workflow Runtime</span>
          <span>&middot;</span>
          <span className="text-emerald-700">SOC2 &amp; OAuth 2.0 Ready</span>
        </div>
      </div>
    </footer>
  );
}
