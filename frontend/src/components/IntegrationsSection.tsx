"use client";

import Link from "next/link";

export default function IntegrationsSection() {
  const activeIntegrations = [
    {
      name: "Gmail API",
      scope: "gmail.send",
      icon: "✉️",
      category: "COMMUNICATION",
      description:
        "Drafts contextual reminders, checks client replies to prevent redundant notices, and dispatches only upon human sign-off.",
      badge: "LIVE ADAPTER",
    },
    {
      name: "Google Sheets API",
      scope: "spreadsheets",
      icon: "📊",
      category: "DATA REGISTRY",
      description:
        "Queries live revenue sheets, detects overdue line items, updates payment tracking columns, and logs operational metrics.",
      badge: "LIVE ADAPTER",
    },
    {
      name: "Google Docs API",
      scope: "documents, drive.file",
      icon: "📄",
      category: "DOCUMENTATION",
      description:
        "Autonomously synthesizes executive briefs, formats structured tables, and stages shared Google Drive documents for review.",
      badge: "LIVE ADAPTER",
    },
    {
      name: "Google Calendar API",
      scope: "calendar.events",
      icon: "📅",
      category: "SCHEDULING",
      description:
        "Inspects free/busy availability across stakeholders, coordinates team review syncs, and embeds Google Meet links.",
      badge: "LIVE ADAPTER",
    },
    {
      name: "PostgreSQL & AWS RDS",
      scope: "sql.read_verify",
      icon: "🗄️",
      category: "DATABASE",
      description:
        "Connects securely to central transactional databases, cross-checks invoice ground truth, and writes immutable audit logs.",
      badge: "LIVE ADAPTER",
    },
    {
      name: "CSV & Excel Ingestion",
      scope: "schema.normalize",
      icon: "📁",
      category: "FILE REGISTRY",
      description:
        "Instantly normalizes messy accounts receivable registers, flags missing customer emails, and isolates anomalies.",
      badge: "NATIVE CORE",
    },
  ];

  const upcomingIntegrations = [
    { name: "Slack Webhooks", tag: "Q4 2026", icon: "💬", desc: "Supervisory incident & approval notifications" },
    { name: "Microsoft 365", tag: "Q4 2026", icon: "🏢", desc: "Outlook mail & Excel cloud spreadsheet sync" },
    { name: "HubSpot CRM", tag: "Q1 2027", icon: "🧲", desc: "Customer deal stage & automated intake" },
    { name: "ERP Webhooks", tag: "Q1 2027", icon: "⚡", desc: "Two-way webhook triggers for SAP & NetSuite" },
  ];

  return (
    <section id="integrations" className="py-24 px-6 md:px-12 max-w-7xl mx-auto scroll-mt-20">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#1A2F25]/20 bg-white/70 text-xs font-mono tracking-widest uppercase mb-4 text-[#1A2F25] shadow-2xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            <span>CONNECTED ECOSYSTEM // ZERO-TOKEN FASTMCP</span>
          </div>
          <h2 className="font-editorial text-4xl sm:text-5xl md:text-6xl text-[#1A2F25] font-normal leading-tight">
            Natively integrated with the tools you run every day.
          </h2>
        </div>
        <p className="font-sans text-sm sm:text-base text-[#526359] max-w-lg leading-relaxed">
          Axiomflow utilizes zero-token FastMCP adapters authenticated with OAuth 2.0 PKCE. No brittle web scrapers, no credential leakage, and instant single-click revocation.
        </p>
      </div>

      {/* 6-Card Active Tool Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {activeIntegrations.map((item, idx) => (
          <div
            key={idx}
            className="border border-[#1A2F25]/15 bg-white/75 backdrop-blur-md p-6 flex flex-col justify-between hover:border-[#E06D53] hover:shadow-md transition-all duration-300 group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-2xl p-2 bg-white border border-[#1A2F25]/10 shadow-2xs">
                  {item.icon}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 border border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold">
                  {item.badge}
                </span>
              </div>
              <div className="text-[10px] font-mono text-[#526359] uppercase tracking-wider mb-1">
                {item.category}
              </div>
              <h3 className="font-sans font-bold text-base text-[#1A2F25] mb-2 group-hover:text-[#E06D53] transition-colors">
                {item.name}
              </h3>
              <p className="font-sans text-xs text-[#526359] leading-relaxed">
                {item.description}
              </p>
            </div>

            <div className="mt-6 pt-3 border-t border-[#1A2F25]/10 flex items-center justify-between text-[11px] font-mono text-[#526359]">
              <span>SCOPE:</span>
              <code className="text-[#CD5B42] font-semibold">{item.scope}</code>
            </div>
          </div>
        ))}
      </div>

      {/* Upcoming Enterprise Connectors */}
      <div className="p-6 md:p-8 bg-white/50 border border-[#1A2F25]/12 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
          <div>
            <h4 className="font-sans font-bold text-sm uppercase tracking-wider text-[#1A2F25]">
              Upcoming Enterprise Connectors
            </h4>
            <p className="text-xs text-[#526359] mt-0.5">
              Scheduled tool adapters rolling out to Axiomflow workspace accounts.
            </p>
          </div>
          <Link
            href="/signup"
            className="text-xs font-mono text-[#E06D53] hover:underline font-semibold"
          >
            Request Custom Connector &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {upcomingIntegrations.map((item, idx) => (
            <div
              key={idx}
              className="p-4 bg-white/80 border border-[#1A2F25]/10 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xl">{item.icon}</span>
                  <span className="text-[9px] font-mono uppercase bg-[#1A2F25]/5 text-[#526359] px-2 py-0.5 font-semibold">
                    {item.tag}
                  </span>
                </div>
                <div className="font-sans font-semibold text-xs text-[#1A2F25]">{item.name}</div>
                <div className="text-[11px] text-[#526359] mt-1 leading-snug">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
