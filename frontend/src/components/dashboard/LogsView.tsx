"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export interface LogEntry {
  id?: string;
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
  const [filterAgent, setFilterAgent] = useState<string>("All");
  const [filterDate, setFilterDate] = useState<string>("All");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<"overview" | "json">("overview");
  const [copiedJson, setCopiedJson] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const modalOverlayRef = useRef<HTMLDivElement>(null);
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const fetchLogs = useCallback(async (isSilent: boolean = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/logs?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setConnectionError(null);
      } else {
        setConnectionError(`API server responded with HTTP ${res.status}`);
      }
    } catch (err) {
      console.warn("Could not reach backend /api/logs:", err);
      setConnectionError(`Cannot reach AxiomFlow Core API at ${API_BASE}. Please ensure the backend server is running.`);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    const initTimer = setTimeout(() => {
      fetchLogs();
    }, 0);

    // Auto-poll for live step updates every 3 seconds while viewing Logs
    const interval = setInterval(() => {
      fetchLogs(true);
    }, 3000);

    return () => {
      clearTimeout(initTimer);
      clearInterval(interval);
    };
  }, [fetchLogs]);

  // Modal keyboard dismissal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selectedLog) {
        setSelectedLog(null);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedLog]);

  const filteredLogs = logs.filter((item) => {
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (item.task_id && item.task_id.toLowerCase().includes(s)) ||
      (item.query && item.query.toLowerCase().includes(s)) ||
      (item.task_description && item.task_description.toLowerCase().includes(s)) ||
      (item.description && item.description.toLowerCase().includes(s)) ||
      (item.agent_name && item.agent_name.toLowerCase().includes(s));

    const itemStatus = (item.status || "").toLowerCase();
    const filter = filterStatus.toLowerCase();
    let matchesStatus = filter === "all";

    if (filter === "completed") {
      matchesStatus = itemStatus === "completed" || itemStatus === "succeeded";
    } else if (filter === "failed") {
      matchesStatus = itemStatus === "failed" || itemStatus === "rejected";
    } else if (filter === "running") {
      matchesStatus = itemStatus === "running" || itemStatus === "waiting approval" || itemStatus === "approved";
    }

    const matchesAgent =
      filterAgent === "All" ||
      (item.agent_name && item.agent_name.toLowerCase().includes(filterAgent.toLowerCase()));

    let matchesDate = true;
    if (filterDate === "Today") {
      const today = new Date().toISOString().slice(0, 10);
      matchesDate = item.time_stamp ? item.time_stamp.includes(today) : true;
    }

    return matchesSearch && matchesStatus && matchesAgent && matchesDate;
  });

  const getStatusColor = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "completed" || s === "succeeded") {
      return "text-emerald-700 bg-emerald-50 border-emerald-200";
    } else if (s === "failed" || s === "rejected") {
      return "text-red-700 bg-red-50 border-red-200";
    } else if (s === "running") {
      return "text-amber-700 bg-amber-50 border-amber-200";
    } else if (s.includes("approval") || s.includes("waiting")) {
      return "text-[#E06D53] bg-[#E06D53]/10 border-[#E06D53]/30";
    } else if (s === "approved") {
      return "text-blue-700 bg-blue-50 border-blue-200";
    }
    return "text-[#526359] bg-gray-100 border-gray-200";
  };

  const handleCopyJson = () => {
    if (!selectedLog) return;
    navigator.clipboard.writeText(JSON.stringify(selectedLog, null, 2));
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col justify-start py-1 h-full overflow-hidden">
      {/* Search & Filter Header Strip */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <h2 className="font-editorial text-2xl md:text-3xl text-[#1A2F25] tracking-tight">
            Audit Telemetry & System Logs
          </h2>
          <span className="text-xs font-mono text-[#526359] bg-[#1A2F25]/5 px-2.5 py-0.5 rounded-full border border-[#1A2F25]/10 font-medium">
            {loading ? "..." : `${filteredLogs.length} Records`}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Agent Filter Dropdown */}
          <select
            value={filterAgent}
            onChange={(e) => setFilterAgent(e.target.value)}
            className="bg-white border border-[#1A2F25]/15 rounded-full px-3 py-1.5 text-xs font-mono text-[#1A2F25] focus:outline-none focus:border-[#E06D53]"
          >
            <option value="All">All Agents</option>
            <option value="Supervisor">Supervisor Agent</option>
            <option value="Docs">Docs Agent</option>
            <option value="Sheet">Sheet Agent</option>
            <option value="Calendar">Calendar Agent</option>
            <option value="Email">Email Agent</option>
          </select>

          {/* Date Filter Dropdown */}
          <select
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="bg-white border border-[#1A2F25]/15 rounded-full px-3 py-1.5 text-xs font-mono text-[#1A2F25] focus:outline-none focus:border-[#E06D53]"
          >
            <option value="All">All Dates</option>
            <option value="Today">Today</option>
          </select>

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
              className="px-3.5 py-1.5 pl-8 bg-white border border-[#1A2F25]/15 rounded-full text-xs font-mono text-[#1A2F25] placeholder:text-[#526359]/60 focus:outline-none focus:border-[#E06D53] w-36 sm:w-48"
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
            onClick={() => fetchLogs()}
            disabled={loading}
            aria-label="Refresh Logs"
            title="Refresh logs from axiomflow_db"
            className="px-3 py-1.5 bg-white hover:bg-[#F8F6F2] border border-[#1A2F25]/15 rounded-full text-xs font-mono text-[#1A2F25] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <span className={`${loading ? "animate-spin" : ""}`}>↻</span>
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Audit Table Container with Sticky Header & Professional Typography */}
      <div className="flex-1 overflow-auto rounded-2xl border border-[#1A2F25]/12 bg-white/90 shadow-sm relative">
        <table className="w-full border-collapse text-left text-xs">
          <thead className="sticky top-0 bg-[#F8F6F2] z-10 border-b border-[#1A2F25]/12 select-none shadow-2xs">
            <tr className="font-editorial text-sm md:text-base text-[#1A2F25]">
              <th className="py-3 px-3.5 font-normal w-[12%]">Task ID</th>
              <th className="py-3 px-3.5 font-normal w-[22%]">Query</th>
              <th className="py-3 px-3.5 font-normal w-[24%]">Description</th>
              <th className="py-3 px-3.5 font-normal w-[13%]">Agent</th>
              <th className="py-3 px-3.5 font-normal w-[11%]">LLM Engine</th>
              <th className="py-3 px-3.5 font-normal w-[9%] text-right">Duration</th>
              <th className="py-3 px-3.5 font-normal w-[9%] text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A2F25]/8">
            {filteredLogs.map((log, idx) => (
              <tr
                key={log.id || `${log.task_id}-${idx}`}
                onClick={() => {
                  setSelectedLog(log);
                  setActiveModalTab("overview");
                }}
                className="hover:bg-[#E06D53]/5 transition-colors cursor-pointer group"
              >
                {/* task_id */}
                <td className="py-3 px-3.5 font-mono text-xs text-[#526359] group-hover:text-[#CD5B42] font-semibold whitespace-nowrap">
                  {log.task_id || "---"}
                </td>

                {/* Query */}
                <td className="py-3 px-3.5 font-sans text-xs text-[#1A2F25] leading-relaxed line-clamp-2">
                  {log.query || "---"}
                </td>

                {/* Description */}
                <td className="py-3 px-3.5 font-sans text-xs text-[#526359] leading-relaxed line-clamp-2">
                  {log.task_description || log.description || "---"}
                </td>

                {/* Agent Name */}
                <td className="py-3 px-3.5 font-mono text-xs text-[#1A2F25] whitespace-nowrap">
                  <span className="px-2 py-0.5 rounded bg-[#1A2F25]/5 border border-[#1A2F25]/10 text-[11px]">
                    {log.agent_name || "---"}
                  </span>
                </td>

                {/* LLM Name */}
                <td className="py-3 px-3.5 font-mono text-[11px] text-[#526359] truncate max-w-[120px]">
                  {log.llm_name ? log.llm_name.replace("openai/", "").replace("google/", "") : "---"}
                </td>

                {/* Time Taken */}
                <td className="py-3 px-3.5 font-mono text-xs text-[#1A2F25] text-right whitespace-nowrap">
                  {log.time_taken || "---"}
                </td>

                {/* Status */}
                <td className="py-3 px-3.5 text-center whitespace-nowrap">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-semibold ${getStatusColor(log.status)}`}>
                    {log.status || "---"}
                  </span>
                </td>
              </tr>
            ))}

            {filteredLogs.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="py-16 text-center text-[#526359] font-editorial text-xl"
                >
                  {loading ? (
                    "Loading audit telemetry from axiomflow_db..."
                  ) : connectionError ? (
                    <div className="flex flex-col items-center justify-center gap-1.5 text-amber-700">
                      <span className="font-semibold text-lg">{connectionError}</span>
                      <span className="text-xs font-mono text-[#526359]">
                        Start backend via: <code className="bg-[#1A2F25]/5 px-1.5 py-0.5 rounded text-[#E06D53]">uvicorn main:app --reload</code> (port 8000)
                      </span>
                    </div>
                  ) : (
                    "No audit log records match the selected filters (---)"
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-2.5 flex items-center justify-between text-xs font-mono text-[#526359] px-2 shrink-0">
        <span>Click any row to inspect deep telemetry and raw FastMCP payload.</span>
        <span>Connected: RDS MySQL `axiomflow_db.logs`</span>
      </div>

      {/* Developer-Grade Deep Telemetry Modal */}
      {selectedLog && (
        <div
          ref={modalOverlayRef}
          onClick={(e) => e.target === modalOverlayRef.current && setSelectedLog(null)}
          className="fixed inset-0 z-50 bg-[#1A2F25]/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
        >
          <div className="bg-white border border-[#1A2F25]/15 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-150 max-h-[85vh] flex flex-col">
            <button
              type="button"
              onClick={() => setSelectedLog(null)}
              className="absolute top-4 right-4 text-[#526359] hover:text-[#1A2F25] w-8 h-8 rounded-full border border-[#1A2F25]/10 flex items-center justify-center cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-2 mb-1 shrink-0">
              <span className="font-mono text-xs text-[#E06D53] font-bold">
                AUDIT_TELEMETRY // {selectedLog.task_id || "---"}
              </span>
              <span
                className={`font-mono text-xs px-2 py-0.5 rounded-full border font-semibold ${getStatusColor(
                  selectedLog.status
                )}`}
              >
                ● {selectedLog.status || "---"}
              </span>
            </div>

            <h3 className="font-editorial text-2xl text-[#1A2F25] mb-3 shrink-0">
              {selectedLog.query || "---"}
            </h3>

            {/* Modal Navigation Tabs: Overview vs Raw Payload */}
            <div className="flex items-center gap-2 border-b border-[#1A2F25]/10 mb-4 shrink-0">
              <button
                type="button"
                onClick={() => setActiveModalTab("overview")}
                className={`pb-2 px-1 text-xs font-mono font-medium transition-colors cursor-pointer relative ${
                  activeModalTab === "overview"
                    ? "text-[#E06D53] border-b-2 border-[#E06D53]"
                    : "text-[#526359] hover:text-[#1A2F25]"
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveModalTab("json")}
                className={`pb-2 px-1 text-xs font-mono font-medium transition-colors cursor-pointer relative ${
                  activeModalTab === "json"
                    ? "text-[#E06D53] border-b-2 border-[#E06D53]"
                    : "text-[#526359] hover:text-[#1A2F25]"
                }`}
              >
                Raw JSON Payload
              </button>
            </div>

            <div className="flex-1 overflow-y-auto pr-1">
              {activeModalTab === "overview" ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3.5 bg-[#F8F6F2] rounded-xl font-mono text-xs mb-4">
                    <div>
                      <span className="text-[#526359] block text-[10px]">AGENT</span>
                      <span className="text-[#1A2F25] font-semibold">{selectedLog.agent_name || "---"}</span>
                    </div>
                    <div>
                      <span className="text-[#526359] block text-[10px]">LLM ENGINE</span>
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
                    <div className="text-xs font-mono text-[#526359] uppercase tracking-wider mb-1.5">
                      Execution Step Description:
                    </div>
                    <div className="bg-[#F8F6F2] text-[#1A2F25] p-3.5 rounded-xl text-xs font-sans border border-[#1A2F25]/10 leading-relaxed">
                      {selectedLog.task_description || selectedLog.description || "---"}
                    </div>
                  </div>
                </>
              ) : (
                <div className="relative">
                  <pre className="p-4 bg-[#1A2F25] text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto leading-relaxed shadow-inner max-h-72">
                    {JSON.stringify(selectedLog, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-[#1A2F25]/10 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={handleCopyJson}
                className="px-3.5 py-1.5 border border-[#1A2F25]/20 hover:border-[#1A2F25] rounded-full text-xs font-mono text-[#1A2F25] transition-colors cursor-pointer"
              >
                {copiedJson ? "Copied ✓" : "Copy JSON"}
              </button>

              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-1.5 bg-[#E06D53] hover:bg-[#CD5B42] text-white text-xs font-mono uppercase font-semibold rounded-full cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
