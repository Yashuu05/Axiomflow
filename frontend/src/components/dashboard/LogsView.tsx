"use client";

import { useState } from "react";

export interface LogEntry {
  task_id: string;
  query: string;
  description: string;
  agent_name: string;
  llm_name: string;
  time_taken: string;
  time_stamp: string;
  status: "Completed" | "Failed" | "Running" | "Pending";
  token_usage?: { prompt: number; completion: number; total: number };
  system_payload?: string;
}

const MOCK_LOGS: LogEntry[] = [
  {
    task_id: "ABC_066",
    query: "write an investor meeting email",
    description: "email content generator",
    agent_name: "email agent",
    llm_name: "gemini-3.8-flash",
    time_taken: "12 sec",
    time_stamp: "19/10/2026 04:00:20",
    status: "Completed",
    token_usage: { prompt: 1420, completion: 480, total: 1900 },
    system_payload: JSON.stringify(
      {
        action: "generate_template",
        recipient_count: 42,
        verified_by: "DeterministicVerifier.v1",
        output_sha256: "9f82c...b12a",
      },
      null,
      2
    ),
  },
  {
    task_id: "ABC_067",
    query: "write an investor meeting email",
    description: "Sending email to investors",
    agent_name: "email agent",
    llm_name: "gemini-3.8-flash",
    time_taken: "16 sec",
    time_stamp: "19/10/2026 04:16:20",
    status: "Failed",
    token_usage: { prompt: 1100, completion: 92, total: 1192 },
    system_payload: JSON.stringify(
      {
        error: "SMTP_AUTH_TIMEOUT: Gateway connection rejected by mail.investor-relay.org",
        retry_policy: "Backoff (1/3)",
        interrupted_at_step: "SES_DISPATCH",
      },
      null,
      2
    ),
  },
  {
    task_id: "ABC_068",
    query: "schedule meeting of 'Revenue discussion'",
    description: "finance team meeting coordinator",
    agent_name: "calendar agent",
    llm_name: "gemini-3.8-flash",
    time_taken: "8 sec",
    time_stamp: "20/10/2026 09:12:00",
    status: "Completed",
    token_usage: { prompt: 950, completion: 320, total: 1270 },
    system_payload: JSON.stringify(
      {
        calendar_id: "cal_fin_2026_q4",
        slot: "2026-10-20T10:00:00+05:30",
        participants: ["finance.lead@axiomflow.internal", "controller@axiomflow.internal"],
      },
      null,
      2
    ),
  },
  {
    task_id: "ABC_069",
    query: "reconcile overdue invoice INV-204",
    description: "accounts receivable audit & ledger balance",
    agent_name: "reconciliation agent",
    llm_name: "gemini-1.5-pro",
    time_taken: "24 sec",
    time_stamp: "20/10/2026 10:30:14",
    status: "Completed",
    token_usage: { prompt: 3410, completion: 1120, total: 4530 },
    system_payload: JSON.stringify(
      {
        invoice_ref: "INV-204",
        amount_due: 42500.0,
        settlement_status: "PAID_RECONCILED",
        cleared_bank_tx: "TXN_HDFC_992144",
      },
      null,
      2
    ),
  },
  {
    task_id: "ABC_070",
    query: "quarterly statutory compliance dispatch",
    description: "regulatory filing compiler & ROC verification",
    agent_name: "compliance agent",
    llm_name: "gemini-3.8-flash",
    time_taken: "18 sec",
    time_stamp: "20/10/2026 11:05:45",
    status: "Running",
    token_usage: { prompt: 2150, completion: 640, total: 2790 },
    system_payload: JSON.stringify(
      {
        statutory_body: "MCA / GSTN",
        form: "GSTR-3B_FY26_Q2",
        status: "RUNNING_AUDIT_VERIFICATION",
      },
      null,
      2
    ),
  },
];

export default function LogsView() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const filteredLogs = MOCK_LOGS.filter((item) => {
    const matchesSearch =
      item.task_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.agent_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      filterStatus === "All" || item.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: LogEntry["status"]) => {
    switch (status) {
      case "Completed":
        return "text-[#10B981]"; // bright emerald green matching mockup
      case "Failed":
        return "text-[#EF4444]"; // bright red matching mockup
      case "Running":
        return "text-[#E5A93C]";
      default:
        return "text-[#526359]";
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-start py-2">
      {/* Search & Filter Header Strip */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="font-editorial text-2xl text-[#1A2F25]">
            Execution Telemetry & Audit Logs
          </span>
          <span className="text-[11px] font-mono text-[#526359] bg-[#1A2F25]/5 px-2 py-0.5 rounded border border-[#1A2F25]/10">
            {filteredLogs.length} Records
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Status filter pills */}
          <div className="flex items-center gap-1 bg-[#1A2F25]/5 p-1 rounded-full text-xs font-mono">
            {["All", "Completed", "Failed", "Running"].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  filterStatus === st
                    ? "bg-white text-[#1A2F25] font-semibold shadow-xs"
                    : "text-[#526359] hover:text-[#1A2F25]"
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search logs..."
              className="px-3.5 py-1.5 pl-8 bg-white border border-[#E06D53]/40 rounded-full text-xs font-mono text-[#1A2F25] placeholder:text-[#526359]/60 focus:outline-none focus:border-[#E06D53]"
            />
            <svg
              className="w-3.5 h-3.5 text-[#526359] absolute left-3 top-2.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Table Container matching logs.png */}
      <div className="overflow-x-auto rounded-2xl border border-[#E06D53] bg-white/70 shadow-sm">
        <table className="w-full border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#E06D53] font-editorial text-lg md:text-xl text-[#1A2F25]">
              <th className="py-4 px-4 border-r border-[#E06D53] font-normal text-center whitespace-nowrap">
                task_id
              </th>
              <th className="py-4 px-4 border-r border-[#E06D53] font-normal text-center whitespace-nowrap">
                Query
              </th>
              <th className="py-4 px-4 border-r border-[#E06D53] font-normal text-center whitespace-nowrap">
                Description
              </th>
              <th className="py-4 px-4 border-r border-[#E06D53] font-normal text-center whitespace-nowrap">
                Agent Name
              </th>
              <th className="py-4 px-4 border-r border-[#E06D53] font-normal text-center whitespace-nowrap">
                LLM Name
              </th>
              <th className="py-4 px-4 border-r border-[#E06D53] font-normal text-center whitespace-nowrap">
                Time Taken
              </th>
              <th className="py-4 px-4 border-r border-[#E06D53] font-normal text-center whitespace-nowrap">
                Time Stamp
              </th>
              <th className="py-4 px-4 font-normal text-center whitespace-nowrap">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E06D53]">
            {filteredLogs.map((log) => (
              <tr
                key={log.task_id}
                onClick={() => setSelectedLog(log)}
                className="hover:bg-[#E06D53]/5 transition-colors cursor-pointer group"
              >
                {/* task_id */}
                <td className="py-5 px-4 border-r border-[#E06D53] font-editorial text-lg text-center text-[#1A2F25] whitespace-nowrap">
                  {log.task_id}
                </td>

                {/* Query */}
                <td className="py-5 px-4 border-r border-[#E06D53] font-editorial text-lg text-center text-[#1A2F25]">
                  {log.query}
                </td>

                {/* Description */}
                <td className="py-5 px-4 border-r border-[#E06D53] font-editorial text-lg text-center text-[#1A2F25]">
                  {log.description}
                </td>

                {/* Agent Name */}
                <td className="py-5 px-4 border-r border-[#E06D53] font-editorial text-lg text-center text-[#1A2F25] whitespace-nowrap">
                  {log.agent_name}
                </td>

                {/* LLM Name */}
                <td className="py-5 px-4 border-r border-[#E06D53] font-editorial text-lg text-center text-[#1A2F25] whitespace-nowrap">
                  {log.llm_name}
                </td>

                {/* Time Taken */}
                <td className="py-5 px-4 border-r border-[#E06D53] font-editorial text-lg text-center text-[#1A2F25] whitespace-nowrap">
                  {log.time_taken}
                </td>

                {/* Time Stamp */}
                <td className="py-5 px-4 border-r border-[#E06D53] font-editorial text-lg text-center text-[#1A2F25] whitespace-nowrap">
                  {log.time_stamp}
                </td>

                {/* Status */}
                <td className="py-5 px-4 font-editorial text-xl text-center whitespace-nowrap">
                  <span className={`${getStatusColor(log.status)} font-normal`}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}

            {filteredLogs.length === 0 && (
              <tr>
                <td
                  colSpan={8}
                  className="py-12 text-center text-[#526359] font-editorial text-xl"
                >
                  No matching log telemetry records found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs font-mono text-[#526359] px-2">
        <span>Click any row to inspect deep telemetry and payload output.</span>
        <span>MySQL: `axiomflow_db.audit_logs`</span>
      </div>

      {/* Selected Log Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 bg-[#1A2F25]/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#E06D53] rounded-2xl max-w-2xl w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setSelectedLog(null)}
              className="absolute top-4 right-4 text-[#526359] hover:text-[#1A2F25] w-8 h-8 rounded-full border border-[#1A2F25]/10 flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs text-[#E06D53] font-bold">
                AUDIT_TELEMETRY // {selectedLog.task_id}
              </span>
              <span
                className={`font-editorial text-lg ${getStatusColor(
                  selectedLog.status
                )}`}
              >
                ● {selectedLog.status}
              </span>
            </div>

            <h3 className="font-editorial text-2xl text-[#1A2F25] mb-4">
              {selectedLog.query}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[#F8F6F2] rounded-xl font-mono text-xs mb-4">
              <div>
                <span className="text-[#526359] block text-[10px]">AGENT</span>
                <span className="text-[#1A2F25] font-semibold">{selectedLog.agent_name}</span>
              </div>
              <div>
                <span className="text-[#526359] block text-[10px]">LLM</span>
                <span className="text-[#1A2F25] font-semibold">{selectedLog.llm_name}</span>
              </div>
              <div>
                <span className="text-[#526359] block text-[10px]">DURATION</span>
                <span className="text-[#1A2F25] font-semibold">{selectedLog.time_taken}</span>
              </div>
              <div>
                <span className="text-[#526359] block text-[10px]">TIMESTAMP</span>
                <span className="text-[#1A2F25] font-semibold">{selectedLog.time_stamp}</span>
              </div>
            </div>

            {selectedLog.token_usage && (
              <div className="flex items-center justify-between text-xs font-mono text-[#526359] border-b border-[#1A2F25]/10 pb-3 mb-4">
                <span>Prompt Tokens: {selectedLog.token_usage.prompt}</span>
                <span>Completion: {selectedLog.token_usage.completion}</span>
                <span className="font-semibold text-[#1A2F25]">
                  Total: {selectedLog.token_usage.total}
                </span>
              </div>
            )}

            <div>
              <div className="text-xs font-mono text-[#526359] uppercase tracking-wider mb-2">
                VERIFIED_PAYLOAD_OUTPUT (JSON):
              </div>
              <pre className="bg-[#1A2F25] text-[#F8F6F2] p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-52">
                {selectedLog.system_payload}
              </pre>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-[#E06D53] hover:bg-[#CD5B42] text-white text-xs font-mono uppercase font-semibold rounded-full"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
