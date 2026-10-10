export default function MetricsStrip() {
  const metrics = [
    {
      metric: "99.98%",
      label: "Execution Determinism",
      subtext: "Strict state transition guarantees",
      tag: "SLA TIER 1",
    },
    {
      metric: "< 420ms",
      label: "Verification Latency",
      subtext: "Guardrail validation per agent hop",
      tag: "BENCHMARK",
    },
    {
      metric: "100%",
      label: "Audit Traceability",
      subtext: "Cryptographically logged state tree",
      tag: "COMPLIANCE",
    },
    {
      metric: "0%",
      label: "Unauthorized Mutations",
      subtext: "Enforced Human-In-The-Loop gate",
      tag: "ZERO BYPASS",
    },
  ];

  return (
    <section className="relative z-20 border-y border-[#1A2F25]/15 bg-white/40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#1A2F25]/10">
          {metrics.map((item, index) => (
            <div
              key={index}
              className={`p-6 md:p-8 flex flex-col justify-between ${
                index !== 0 ? "sm:pl-8 lg:pl-10" : ""
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="font-mono text-[10px] tracking-widest uppercase px-2 py-0.5 border border-[#1A2F25]/15 bg-white/60 text-[#526359]">
                  {item.tag}
                </span>
                <span className="font-mono text-[11px] text-[#526359]">0{index + 1}</span>
              </div>
              <div>
                <div className="font-editorial text-4xl lg:text-5xl font-normal text-[#1A2F25] mb-2 tracking-tight">
                  {item.metric}
                </div>
                <div className="font-sans font-semibold text-sm text-[#1A2F25] mb-1">
                  {item.label}
                </div>
                <div className="font-sans text-xs text-[#526359] leading-relaxed">
                  {item.subtext}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
