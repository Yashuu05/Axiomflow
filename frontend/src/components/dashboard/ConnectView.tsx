"use client";

interface ConnectViewProps {
  onBackToWorkflow: () => void;
}

export default function ConnectView({ onBackToWorkflow }: ConnectViewProps) {
  const plannedConnectors = [
    {
      title: "Excel & CSV Spreadsheets",
      description: "Upload financial statements, vendor directories, or investor contact sheets (.xlsx, .csv).",
      tag: "IN SPECIFICATION",
      icon: "📊",
    },
    {
      title: "Relational Databases",
      description: "Direct JDBC/SQL connection to MySQL (axiomflow_db), PostgreSQL, or Oracle instances.",
      tag: "ARCHITECTURE REVIEW",
      icon: "🗄️",
    },
    {
      title: "Accounting & ERP Gateways",
      description: "Two-way synchronization with Tally, SAP, QuickBooks, and Stripe billing engines.",
      tag: "QUEUED",
      icon: "⚡",
    },
    {
      title: "Secure Cloud Buckets",
      description: "Ingest statutory filings and contractual PDFs from AWS S3, Google Drive, or Azure Blob.",
      tag: "QUEUED",
      icon: "☁️",
    },
  ];

  return (
    <div className="flex-1 flex flex-col justify-between py-6 max-w-4xl mx-auto w-full">
      <div className="text-center mb-8">
        <span className="inline-block px-3 py-1 bg-[#E06D53]/10 border border-[#E06D53]/30 text-[#E06D53] font-mono text-xs tracking-wider uppercase rounded-full mb-3">
          DATA INGESTION PIPELINE // ROADMAP
        </span>
        <h2 className="font-editorial text-3xl sm:text-4xl text-[#1A2F25] mb-2">
          Connect External Datastores & Spreadsheets
        </h2>
        <p className="font-sans text-sm text-[#526359] max-w-xl mx-auto leading-relaxed">
          The Connect module is currently in specification. Secure schema mappings and local tabular uploads will be integrated in the upcoming milestone.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-auto">
        {plannedConnectors.map((item, index) => (
          <div
            key={index}
            className="p-5 bg-white/80 border border-[#1A2F25]/10 rounded-2xl shadow-xs relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{item.icon}</span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-[#526359] bg-[#F8F6F2] px-2 py-0.5 rounded border border-[#1A2F25]/8">
                {item.tag}
              </span>
            </div>
            <h3 className="font-editorial text-xl text-[#1A2F25] mb-1">
              {item.title}
            </h3>
            <p className="font-sans text-xs text-[#526359] leading-relaxed">
              {item.description}
            </p>
          </div>
        ))}
      </div>

      <div className="text-center pt-8">
        <button
          type="button"
          onClick={onBackToWorkflow}
          className="px-6 py-2.5 bg-[#E06D53] hover:bg-[#CD5B42] text-white font-sans text-xs uppercase tracking-wider font-semibold rounded-full transition-all shadow-sm cursor-pointer"
        >
          &larr; Return to Active Workflow
        </button>
      </div>
    </div>
  );
}
