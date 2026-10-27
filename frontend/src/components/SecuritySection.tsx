"use client";

export default function SecuritySection() {
  const pillars = [
    {
      icon: "🛡️",
      title: "Mandatory Human-in-the-Loop Gates",
      tag: "ZERO RUNAWAY RISK",
      description:
        "External communications, invoice payment updates, and calendar bookings are held in an isolated staging tray. No action dispatches without an authorized operator clicking 'Approve'.",
    },
    {
      icon: "🔐",
      title: "OAuth 2.0 PKCE FastMCP Adapters",
      tag: "LEAST PRIVILEGE",
      description:
        "Tool adapters connect with minimal granular scopes (gmail.send, spreadsheets, documents, calendar.events). Master passwords are never stored, and access can be revoked instantly.",
    },
    {
      icon: "🚫",
      title: "Zero Model Training on Customer Data",
      tag: "DATA PRIVACY",
      description:
        "Your private financial registers, customer lists, and email correspondences are processed in memory and never used to train or fine-tune public foundation models.",
    },
    {
      icon: "📜",
      title: "Tamper-Evident Immutable Audit Log",
      tag: "100% OBSERVABILITY",
      description:
        "Every agent deliberation token, data retrieval parameter, and human review timestamp is logged permanently in verifiable audit storage, exportable for external compliance.",
    },
    {
      icon: "⚖️",
      title: "Deterministic State Graph Architecture",
      tag: "NO STOCHASTIC DRIFT",
      description:
        "Built on LangGraph state machines and FastAPI microservices. Probabilistic text synthesis is strictly separated from mathematical calculations and database writes.",
    },
    {
      icon: "🏢",
      title: "Role-Based Business Governance",
      tag: "ADMIN CONTROL",
      description:
        "Registered business administrators retain full control over organization profile settings, connected Google Workspace integrations, and user permissions.",
    },
  ];

  return (
    <section id="security" className="py-24 px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#1A2F25]/20 bg-white/70 text-xs font-mono tracking-widest uppercase mb-4 text-[#1A2F25] shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E06D53]"></span>
            <span>ENTERPRISE GOVERNANCE // COMPLIANCE &amp; SAFETY</span>
          </div>
          <h2 className="font-editorial text-4xl sm:text-5xl md:text-6xl text-[#1A2F25] font-normal leading-tight">
            Security engineered into the core. Zero runaway AI risk.
          </h2>
        </div>
        <p className="font-sans text-sm sm:text-base text-[#526359] max-w-lg leading-relaxed">
          Mission-critical operations cannot afford probabilistic hallucinations or rogue outbound communications. Axiomflow combines agentic speed with bank-grade verification gates.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pillars.map((item, idx) => (
          <div
            key={idx}
            className="border border-[#1A2F25]/15 bg-white/75 backdrop-blur-md p-6 flex flex-col justify-between hover:border-[#E06D53] hover:shadow-md transition-all duration-300 group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl p-2 bg-white border border-[#1A2F25]/10 shadow-2xs">
                  {item.icon}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 border border-[#1A2F25]/10 bg-white text-[#526359] font-semibold">
                  {item.tag}
                </span>
              </div>
              <h3 className="font-sans font-bold text-base text-[#1A2F25] mb-2 group-hover:text-[#E06D53] transition-colors">
                {item.title}
              </h3>
              <p className="font-sans text-xs text-[#526359] leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="mt-6 pt-3 border-t border-[#1A2F25]/10 flex items-center justify-between text-[11px] font-mono text-emerald-700 font-semibold">
              <span>ENFORCED AT RUNTIME</span>
              <span>✓ PASS</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
