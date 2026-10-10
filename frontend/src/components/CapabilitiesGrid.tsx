export default function CapabilitiesGrid() {
  const capabilities = [
    {
      step: "01",
      icon: (
        <svg className="w-5 h-5 stroke-[#1A2F25] stroke-[1.5]" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="square" strokeLinejoin="miter" d="M4 4h16v16H4zM4 9h16M9 4v16" />
        </svg>
      ),
      title: "Autonomous Multi-Source Ingestion",
      description:
        "Seamlessly joins structured spreadsheets (CSV/Excel), SQL records (PostgreSQL/Aura DB), Gmail threads, and real-time webhook streams into an unified schema.",
      badge: "MULTI-MODAL INGESTION",
      latency: "12ms normalize",
    },
    {
      step: "02",
      icon: (
        <svg className="w-5 h-5 stroke-[#E06D53] stroke-[1.5]" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="square" strokeLinejoin="miter" d="M12 2l10 6.5v7L12 22 2 15.5v-7L12 2zM12 22V12m10-3.5L12 12 2 8.5" />
        </svg>
      ),
      title: "Strict Human-in-the-Loop Gates",
      description:
        "External communication, financial transactions, and database mutations are held in an isolated staging queue until an authorized operator verifies and approves.",
      badge: "ZERO RUNAWAY RISK",
      latency: "0% bypass",
    },
    {
      step: "03",
      icon: (
        <svg className="w-5 h-5 stroke-[#1A2F25] stroke-[1.5]" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="square" strokeLinejoin="miter" d="M1 4v6h6M23 20v-6h-6M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
        </svg>
      ),
      title: "Dynamic In-Flight Re-planning",
      description:
        "Before executing any action, the engine re-checks ground truth. If an overdue invoice was settled moments earlier, reminder dispatch is cancelled in real time.",
      badge: "LIVE STATE CONSISTENCY",
      latency: "Real-time sync",
    },
    {
      step: "04",
      icon: (
        <svg className="w-5 h-5 stroke-[#1A2F25] stroke-[1.5]" fill="none" viewBox="0 0 24 24">
          <path strokeLinecap="square" strokeLinejoin="miter" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" />
        </svg>
      ),
      title: "Tamper-Evident Audit Trails",
      description:
        "Every objective, token deliberation, data lookup, and human modification is written to an immutable log with microsecond timestamps and explanatory justifications.",
      badge: "FULL OBSERVABILITY",
      latency: "100% trace coverage",
    },
  ];

  return (
    <section id="capabilities" className="py-24 px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20">
      {/* Eyebrow and Headline */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#1A2F25]/20 bg-white/60 text-xs font-mono tracking-widest uppercase mb-4 text-[#526359]">
            <span>ENGINE CAPABILITIES</span>
          </div>
          <h2 className="font-editorial text-4xl sm:text-5xl md:text-6xl text-[#1A2F25] font-normal leading-tight">
            Engineered for precision, not predictions.
          </h2>
        </div>
        <p className="font-sans text-sm text-[#526359] max-w-md leading-relaxed">
          Built on LangGraph agentic graphs and FastAPI microservices, tailored specifically for SMB operational resilience.
        </p>
      </div>

      {/* 4-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {capabilities.map((item, index) => (
          <div
            key={index}
            className="border border-[#1A2F25]/15 bg-white/70 backdrop-blur-md p-6 flex flex-col justify-between hover:border-[#E06D53] hover:shadow-lg transition-all duration-300 relative group"
          >
            <div>
              {/* Card Header with Step and Square-Bordered Icon */}
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono text-xs text-[#526359] group-hover:text-[#E06D53] transition-colors font-semibold">
                  [{item.step}]
                </span>
                <div className="p-2 border border-[#1A2F25]/15 bg-white shadow-xs">
                  {item.icon}
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="font-sans font-bold text-base text-[#1A2F25] mb-3 leading-snug">
                {item.title}
              </h3>
              <p className="font-sans text-xs text-[#526359] leading-relaxed">
                {item.description}
              </p>
            </div>

            {/* Bottom Tag */}
            <div className="mt-8 pt-4 border-t border-[#1A2F25]/10 flex items-center justify-between text-[11px] font-mono">
              <span className="text-[#526359]">{item.badge}</span>
              <span className="text-[#E06D53] font-semibold">{item.latency}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
