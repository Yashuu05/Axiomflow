"use client";

import { useState, useEffect, useCallback } from "react";

export interface NotificationRecord {
  id: string;
  date: string;
  time: string;
  message: string;
  status: string;
  task_id?: string;
  created_at: string;
}

interface NotificationsViewProps {
  onNavigateToWorkflow?: (taskId?: string) => void;
}

export default function NotificationsView({ onNavigateToWorkflow }: NotificationsViewProps) {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [sseConnected, setSseConnected] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Fetch notifications from MySQL RDS
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/notifications?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    fetchNotifications();

    // Setup Server-Sent Events (SSE) connection
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`${API_BASE}/api/notifications/events`);

      eventSource.onopen = () => {
        setSseConnected(true);
      };

      eventSource.addEventListener("notification", (event: MessageEvent) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload) {
            setNotifications((prev) => {
              // Avoid duplicate by ID
              const exists = prev.some((n) => n.id === payload.id);
              if (exists) return prev;
              return [payload, ...prev];
            });
            setActionMessage("New notification received via SSE!");
            setTimeout(() => setActionMessage(null), 4000);
          }
        } catch (e) {
          console.error("Error parsing SSE notification payload:", e);
        }
      });

      eventSource.onerror = () => {
        setSseConnected(false);
      };
    } catch (err) {
      console.warn("SSE not supported or failed to connect:", err);
      setSseConnected(false);
    }

    // Fallback periodic poll every 10 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 10000);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      clearInterval(interval);
    };
  }, [API_BASE, fetchNotifications]);

  // Clear all notifications
  const handleClearAll = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications/clear`, {
        method: "POST",
      });
      if (res.ok) {
        setNotifications([]);
        setActionMessage("All notifications cleared from axiomflow_db.");
        setTimeout(() => setActionMessage(null), 3000);
      }
    } catch (err) {
      console.error("Failed to clear notifications:", err);
    }
  };

  // Trigger test notification
  const handleTriggerTest = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: "AxiomFlow test notification: Pipeline executed successfully via FastMCP.",
          status: "succeeded",
          task_id: "TSK_TEST_" + Math.random().toString(36).substring(2, 7).toUpperCase(),
        }),
      });
      if (res.ok) {
        setActionMessage("Test notification dispatched (DB + plyer desktop + SSE).");
        setTimeout(() => setActionMessage(null), 4000);
        fetchNotifications();
      }
    } catch (err) {
      console.error("Failed to trigger test notification:", err);
    }
  };

  // Filter logic
  const filteredNotifications = notifications.filter((item) => {
    const s = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      (item.message && item.message.toLowerCase().includes(s)) ||
      (item.status && item.status.toLowerCase().includes(s)) ||
      (item.id && item.id.toLowerCase().includes(s)) ||
      (item.date && item.date.toLowerCase().includes(s));

    const itemStatus = (item.status || "").toLowerCase();
    let matchesStatus = filterStatus === "All";
    if (filterStatus === "Succeeded") {
      matchesStatus = itemStatus === "succeeded" || itemStatus === "completed";
    } else if (filterStatus === "Failed") {
      matchesStatus = itemStatus === "failed";
    } else if (filterStatus === "Rejected") {
      matchesStatus = itemStatus === "rejected";
    }

    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const s = (status || "").toLowerCase();
    if (s === "succeeded" || s === "completed") {
      return {
        bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
        label: "SUCCEEDED",
        dot: "bg-emerald-500",
      };
    } else if (s === "failed") {
      return {
        bg: "bg-red-50 text-red-700 border-red-200",
        label: "FAILED",
        dot: "bg-red-500",
      };
    } else if (s === "rejected") {
      return {
        bg: "bg-orange-50 text-[#CD5B42] border-[#E06D53]/30",
        label: "REJECTED",
        dot: "bg-[#CD5B42]",
      };
    } else if (s === "paused") {
      return {
        bg: "bg-amber-50 text-amber-700 border-amber-200",
        label: "PAUSED",
        dot: "bg-amber-500",
      };
    }
    return {
      bg: "bg-stone-50 text-stone-700 border-stone-200",
      label: "INFO",
      dot: "bg-stone-400",
    };
  };

  return (
    <div className="flex-1 flex flex-col justify-start py-2">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[#E06D53]/20">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-editorial text-2xl sm:text-3xl text-[#1A2F25]">
              Workflow Notifications & Alerts
            </h1>
            <span className="text-[11px] font-mono text-[#526359] bg-[#1A2F25]/5 px-2.5 py-0.5 rounded-full border border-[#1A2F25]/10">
              {loading ? "..." : `${filteredNotifications.length} Records`}
            </span>
          </div>
          <p className="text-xs font-mono text-[#526359] mt-1">
            Terminal execution alerts stored in <code className="text-[#1A2F25]">axiomflow_db.notifications</code>.
          </p>
        </div>

        {/* Live SSE Status & Action Strip */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* SSE Pulse Indicator */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono border transition-colors ${
              sseConnected
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-stone-100 text-stone-500 border-stone-200"
            }`}
            title={sseConnected ? "Server-Sent Events active" : "SSE disconnected (polling fallback active)"}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                sseConnected ? "bg-emerald-500 animate-pulse" : "bg-stone-400"
              }`}
            ></span>
            <span>{sseConnected ? "SSE Live" : "Polling"}</span>
          </div>

          {/* Test notification button */}
          <button
            type="button"
            onClick={handleTriggerTest}
            className="px-3 py-1.5 bg-[#F8F6F2] hover:bg-[#FFF6F3] border border-[#E06D53]/40 rounded-full text-xs font-mono text-[#1A2F25] transition-colors cursor-pointer"
            title="Dispatch a test notification to verify plyer desktop and SSE"
          >
            + Test Alert
          </button>

          {/* Clear all */}
          {notifications.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className="px-3 py-1.5 bg-white hover:bg-red-50 border border-red-200 text-red-600 rounded-full text-xs font-mono transition-colors cursor-pointer"
              title="Delete all records from notifications table"
            >
              Clear All
            </button>
          )}

          {/* Refresh */}
          <button
            type="button"
            onClick={fetchNotifications}
            disabled={loading}
            className="px-3 py-1.5 bg-white hover:bg-[#F8F6F2] border border-[#E06D53]/40 rounded-full text-xs font-mono text-[#1A2F25] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <span className={loading ? "animate-spin" : ""}>↻</span>
            <span className="hidden md:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-[#E06D53]/10 border border-[#E06D53]/30 text-xs font-mono text-[#1A2F25] flex items-center justify-between animate-in fade-in">
          <span>{actionMessage}</span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-[#E06D53] hover:text-[#1A2F25] cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-5">
        {/* Status filter pills */}
        <div className="flex items-center gap-1 bg-[#1A2F25]/5 p-1 rounded-full text-xs font-mono">
          {["All", "Succeeded", "Failed", "Rejected"].map((st) => (
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

        {/* Search input */}
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search notifications..."
            className="w-full sm:w-64 px-3.5 py-1.5 pl-8 bg-white border border-[#E06D53]/40 rounded-full text-xs font-mono text-[#1A2F25] placeholder:text-[#526359]/60 focus:outline-none focus:border-[#E06D53]"
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

      {/* Notifications Grid / List */}
      {filteredNotifications.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 px-4 border border-dashed border-[#E06D53]/40 rounded-2xl bg-white/50 text-center">
          <div className="w-12 h-12 rounded-full bg-[#E06D53]/10 text-[#E06D53] flex items-center justify-center text-xl mb-3">
            🔔
          </div>
          <h2 className="font-editorial text-2xl text-[#1A2F25] mb-1">
            No notifications available
          </h2>
          <p className="text-xs font-mono text-[#526359] max-w-md">
            Terminal notifications will appear here when an automated workflow completes, fails, or pauses.
          </p>
          <button
            type="button"
            onClick={handleTriggerTest}
            className="mt-4 px-4 py-1.5 bg-[#E06D53] hover:bg-[#CD5B42] text-white text-xs font-mono rounded-full transition-colors cursor-pointer shadow-xs"
          >
            Trigger Test Notification
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((notif) => {
            const badge = getStatusBadge(notif.status);
            return (
              <div
                key={notif.id}
                className="bg-white/80 hover:bg-white border border-[#E06D53]/30 hover:border-[#E06D53] rounded-2xl p-4 sm:p-5 transition-all shadow-xs group"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-semibold border ${badge.bg}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                      {badge.label}
                    </span>

                    <span className="text-xs font-mono text-[#1A2F25] font-medium">
                      Notification #{notif.id}
                    </span>

                    {notif.task_id && (
                      <span className="text-[11px] font-mono text-[#526359] bg-[#1A2F25]/5 px-2 py-0.5 rounded">
                        Task: {notif.task_id}
                      </span>
                    )}
                  </div>

                  <div className="text-[11px] font-mono text-[#526359] flex items-center gap-2">
                    <span>📅 {notif.date || "---"}</span>
                    <span>⏰ {notif.time || "---"}</span>
                  </div>
                </div>

                <p className="text-sm font-sans text-[#1A2F25] leading-relaxed group-hover:text-[#CD5B42] transition-colors">
                  {notif.message}
                </p>

                <div className="mt-3 pt-2.5 border-t border-[#1A2F25]/5 flex items-center justify-between text-[11px] font-mono text-[#526359]">
                  <span>Database: axiomflow_db.notifications</span>
                  <span>Created: {notif.created_at || "---"}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
