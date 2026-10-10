import AxiomflowLogo from "./AxiomflowLogo";

export default function Footer() {
  return (
    <footer className="border-t border-[#1A2F25]/15 bg-[#F8F6F2] py-16 px-6 md:px-12 text-[#1A2F25]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start justify-between gap-12">
        {/* Brand Lockup and Mission */}
        <div className="max-w-sm">
          <AxiomflowLogo variant="full" size={30} />
          <p className="mt-4 font-sans text-xs text-[#526359] leading-relaxed">
            Axiomflow provides deterministic agentic execution for critical business workflows. Built with human-in-the-loop safety and zero hallucination tolerances.
          </p>
          <div className="mt-4 flex items-center gap-2 text-xs font-mono text-[#526359]">
            <span className="w-2 h-2 bg-emerald-600"></span>
            ALL SYSTEMS OPERATIONAL (CLUSTER IN-MUM-01)
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-xs font-mono uppercase tracking-wider">
          <div>
            <div className="font-bold text-[#1A2F25] mb-4">Architecture</div>
            <ul className="space-y-2.5 text-[#526359]">
              <li><a href="#pipeline" className="hover:text-[#1A2F25]">Runtime Pipeline</a></li>
              <li><a href="#architecture" className="hover:text-[#1A2F25]">Graph State Engine</a></li>
              <li><a href="#demo" className="hover:text-[#1A2F25]">HITL Verification</a></li>
              <li><a href="#capabilities" className="hover:text-[#1A2F25]">Audit Logging</a></li>
            </ul>
          </div>

          <div>
            <div className="font-bold text-[#1A2F25] mb-4">Tech Stack</div>
            <ul className="space-y-2.5 text-[#526359]">
              <li><span className="text-[#1A2F25]">FastAPI / Python 3.11</span></li>
              <li><span className="text-[#1A2F25]">LangChain &amp; LangGraph</span></li>
              <li><span className="text-[#1A2F25]">Next.js &amp; Tailwind CSS</span></li>
              <li><span className="text-[#1A2F25]">AWS RDS &amp; Neo4j/Aura</span></li>
            </ul>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <div className="font-bold text-[#1A2F25] mb-4">Project Context</div>
            <ul className="space-y-2.5 text-[#526359]">
              <li><span>Computer Engineering Capstone</span></li>
              <li><span>Version 1.0 (Prototype)</span></li>
              <li><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-[#1A2F25]">GitHub Repository</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto mt-12 pt-6 border-t border-[#1A2F25]/10 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-[#526359] gap-4">
        <div>
          &copy; 2026 Axiomflow. Designed with Architectural Glassmorphism.
        </div>
        <div>
          Deterministic Workflow Automation System &middot; v1.0
        </div>
      </div>
    </footer>
  );
}
