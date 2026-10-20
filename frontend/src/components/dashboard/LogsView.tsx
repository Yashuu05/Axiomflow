"use client";

import { useState, useEffect, useCallback } from "react";

export interface LogEntry {
  task_id: string;
  query: string;
  task_description?: string;
  description?: string;
  agent_name: string;
  llm_name: string;
  time_taken: string;
  raw_time_taken?: number;
  time_stamp: string;
  status: string;
}

export default function LogsView() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/logs`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      } else {
        setLogs([]);
      }
    } catch (err) {
      console.error("Failed to load logs from axiomflow_db:", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const filteredLogs = logs.filter((item) => {
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (item.task_id && item.task_id.toLowerCase().includes(s)) ||
      (item.query && item.query.toLowerCase().includes(s)) ||
      (item.task_description && item.task_description.toLowerCase().includes(s)) ||
      (item.agent_name && item.agent_name.toLowerCase().includes(s));

    const matchesStatus =
      filterStatus === "All" ||
      (item.status && item.status.toLowerCase() === filterStatus.toLowerCase());

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "completed" || s === "succeeded") {
      return "text-[#10B981]";
    } else if (s === "failed" || s === "rejected") {
      return "text-[#EF4444]";
    } else if (s === "running") {
      return "text-[#E5A93C]";
    }
    return "text-[#526359]";
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
            {loading ? "..." : `${filteredLogs.length} Records`}
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

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchLogs}
            disabled={loading}
            aria-label="Refresh Logs"
            title="Refresh logs from axiomflow_db"
            className="px-3 py-1.5 bg-white hover:bg-[#F8F6F2] border border-[#E06D53]/40 rounded-full text-xs font-mono text-[#1A2F25] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <span className={`${loading ? "animate-spin" : ""}`}>↻</span>
            <span className="hidden md:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Table Container matching design */}
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
                  {log.task_id || "---"}
                </td>

                {/* Query */}
                <td className="py-5 px-4 border-r border-[#E06D53] font-editorial text-lg text-center text-[#1A2F25]">
                  {log.query || "---"}
                </td>

                {/* Description */}
                <td className="py-5 px-4 border-r border-[#E06D53] font-editorial text-lg text-center text-[#1A2F25]">
                  {log.task_description || log.description || "---"}
                </td>

                {/* Agent Name */}
                <td className="py-5 px-4 border-r border-[#E06D53] font-editorial text-lg text-center text-[#1A2F25] whitespace-nowrap">
                  {log.agent_name || "---"}
                </td>

                {/* LLM Name */}
                <td className="py-5 px-4 border-r border-[#E06D53] font-editorial text-lg text-center text-[#1A2F25] whitespace-nowrap">
                  {log.llm_name || "---"}
                </td>

                {/* Time Taken */}
                <td className="py-5 px-4 border-r border-[#E06D53] font-editorial text-lg text-center text-[#1A2F25] whitespace-nowrap">
                  {log.time_taken || "---"}
                </td>

                {/* Time Stamp */}
                <td className="py-5 px-4 border-r border-[#E06D53] font-editorial text-lg text-center text-[#1A2F25] whitespace-nowrap">
                  {log.time_stamp || "---"}
                </td>

                {/* Status */}
                <td className="py-5 px-4 font-editorial text-xl text-center whitespace-nowrap">
                  <span className={`${getStatusColor(log.status)} font-normal`}>
                    {log.status || "---"}
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
                  {loading
                    ? "Loading audit telemetry from axiomflow_db..."
                    : "no data available (---)"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs font-mono text-[#526359] px-2">
        <span>Click any row to inspect deep telemetry and payload output.</span>
        <span>Connected: RDS MySQL `axiomflow_db.logs`</span>
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
                AUDIT_TELEMETRY // {selectedLog.task_id || "---"}
              </span>
              <span
                className={`font-editorial text-lg ${getStatusColor(
                  selectedLog.status
                )}`}
              >
                ● {selectedLog.status || "---"}
              </span>
            </div>

            <h3 className="font-editorial text-2xl text-[#1A2F25] mb-4">
              {selectedLog.query || "---"}
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[#F8F6F2] rounded-xl font-mono text-xs mb-4">
              <div>
                <span className="text-[#526359] block text-[10px]">AGENT</span>
                <span className="text-[#1A2F25] font-semibold">{selectedLog.agent_name || "---"}</span>
              </div>
              <div>
                <span className="text-[#526359] block text-[10px]">LLM</span>
                <span className="text-[#1A2F25] font-semibold">{selectedLog.llm_name || "---"}</span>
              </div>
              <div>
                <span className="text-[#526359] block text-[10px]">DURATION</span>
                <span className="text-[#1A2F25] font-semibold">{selectedLog.time_taken || "---"}</span>
              </div>
              <div>
                <span className="text-[#526359] block text-[10px]">TIMESTAMP</span>
                <span className="text-[#1A2F25] font-semibold">{selectedLog.time_stamp || "---"}</span>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-xs font-mono text-[#526359] uppercase tracking-wider mb-2">
                TASK_DESCRIPTION:
              </div>
              <div className="bg-[#F8F6F2] text-[#1A2F25] p-3 rounded-xl text-xs font-sans border border-[#1A2F25]/10">
                {selectedLog.task_description || selectedLog.description || "---"}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 bg-[#E06D53] hover:bg-[#CD5B42] text-white text-xs font-mono uppercase font-semibold rounded-full cursor-pointer"
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
