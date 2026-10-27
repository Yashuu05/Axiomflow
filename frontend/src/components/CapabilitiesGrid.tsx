export default function CapabilitiesGrid() {
  const capabilities = [
    {
      step: "01",
      icon: "🔄",
      title: "Autonomous Multi-Source Ingestion",
      description:
        "Seamlessly joins structured spreadsheets (Google Sheets, CSV), SQL production records (PostgreSQL, AWS RDS), and real-time Gmail threads into an unified schema.",
      badge: "MULTI-MODAL INGESTION",
      latency: "Real-time schema map",
    },
    {
      step: "02",
      icon: "🛡️",
      title: "Strict Human-in-the-Loop Gates",
      tag: "ZERO RUNAWAY RISK",
      description:
        "External communication, financial transactions, and database modifications are held in an isolated staging queue until an authorized operator verifies and approves.",
      badge: "ZERO RUNAWAY RISK",
      latency: "100% pre-approved",
    },
    {
      step: "03",
      icon: "⚡",
      title: "Dynamic In-Flight Re-planning",
      description:
        "Before executing any action, the engine re-checks ground truth. If an overdue invoice was settled moments earlier, reminder dispatch is cancelled in real time.",
      badge: "LIVE STATE CONSISTENCY",
      latency: "Automated eviction",
    },
    {
      step: "04",
      icon: "📜",
      title: "Tamper-Evident Audit Trails",
      description:
        "Every objective, token deliberation, data lookup, and human modification is written to an immutable log with millisecond timestamps and explanatory justifications.",
      badge: "FULL OBSERVABILITY",
      latency: "Permanent record",
    },
  ];

  return (
    <section id="capabilities" className="py-24 px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20">
      {/* Eyebrow and Headline */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#1A2F25]/20 bg-white/70 text-xs font-mono tracking-widest uppercase mb-4 text-[#1A2F25] shadow-2xs">
            <span>CORE ARCHITECTURAL GUARANTEES</span>
          </div>
          <h2 className="font-editorial text-4xl sm:text-5xl md:text-6xl text-[#1A2F25] font-normal leading-tight">
            Engineered for precision, not predictions.
          </h2>
        </div>
        <p className="font-sans text-sm sm:text-base text-[#526359] max-w-md leading-relaxed">
          Designed specifically for mission-critical operations where hallucinated answers and unmonitored actions carry real business liability.
        </p>
      </div>

      {/* 4-Column Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {capabilities.map((item, index) => (
          <div
            key={index}
            className="border border-[#1A2F25]/15 bg-white/75 backdrop-blur-md p-6 flex flex-col justify-between hover:border-[#E06D53] hover:shadow-lg transition-all duration-300 relative group"
          >
            <div>
              {/* Card Header with Step and Square-Bordered Icon */}
              <div className="flex items-center justify-between mb-6">
                <span className="font-mono text-xs text-[#526359] group-hover:text-[#E06D53] transition-colors font-bold">
                  [{item.step}]
                </span>
                <div className="p-2 border border-[#1A2F25]/15 bg-white shadow-2xs text-xl">
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
              <span className="text-[#526359] font-medium">{item.badge}</span>
              <span className="text-[#E06D53] font-bold">{item.latency}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
