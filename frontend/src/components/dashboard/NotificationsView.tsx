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
  read?: boolean;
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
      const res = await fetch(`${API_BASE}/api/notifications?limit=100`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        const incoming = Array.isArray(data?.notifications) ? data.notifications : [];
        // Enforce idempotent deduplication
        setNotifications((prev) => {
          const map = new Map<string, NotificationRecord>();
          incoming.forEach((n: NotificationRecord) => map.set(n.id, n));
          prev.forEach((n) => {
            if (map.has(n.id) && n.read) {
              map.set(n.id, { ...map.get(n.id)!, read: true });
            }
          });
          return Array.from(map.values());
        });
      } else {
        setNotifications([]);
      }
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [API_BASE]);

  useEffect(() => {
    const initTimer = setTimeout(() => {
      fetchNotifications();
    }, 0);

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
              const exists = prev.some((n) => n.id === payload.id);
              if (exists) return prev;
              return [payload, ...prev];
            });
            setActionMessage("New alert received via SSE!");
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
    }

    // Fallback periodic poll every 10 seconds
    const interval = setInterval(() => {
      fetchNotifications();
    }, 10000);

    return () => {
      clearTimeout(initTimer);
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

  // Mark all as read locally
  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setActionMessage("Marked all alerts as read.");
    setTimeout(() => setActionMessage(null), 3000);
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
        setActionMessage("Test alert dispatched (DB + plyer desktop + SSE).");
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
      (item.task_id && item.task_id.toLowerCase().includes(s)) ||
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
        bg: "bg-emerald-50 text-emerald-800 border-emerald-200",
        label: "SUCCEEDED",
        dot: "bg-emerald-600",
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

  // Date categorization helper: Today, Yesterday, Earlier
  const todayStr = new Date().toISOString().slice(0, 10);
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = yesterdayDate.toISOString().slice(0, 10);

  const groupedNotifications: { label: string; items: NotificationRecord[] }[] = [];
  const todayItems: NotificationRecord[] = [];
  const yesterdayItems: NotificationRecord[] = [];
  const earlierItems: NotificationRecord[] = [];

  filteredNotifications.forEach((n) => {
    const d = n.date || (n.created_at ? n.created_at.slice(0, 10) : "");
    if (d === todayStr) {
      todayItems.push(n);
    } else if (d === yesterdayStr) {
      yesterdayItems.push(n);
    } else {
      earlierItems.push(n);
    }
  });

  if (todayItems.length > 0) groupedNotifications.push({ label: "Today", items: todayItems });
  if (yesterdayItems.length > 0) groupedNotifications.push({ label: "Yesterday", items: yesterdayItems });
  if (earlierItems.length > 0) groupedNotifications.push({ label: "Earlier Records", items: earlierItems });

  return (
    <div className="flex-1 flex flex-col justify-start py-1 h-full overflow-hidden">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-[#1A2F25]/10 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-editorial text-2xl sm:text-3xl text-[#1A2F25] tracking-tight">
              Event Stream & Alerts Feed
            </h2>
            <span className="text-xs font-mono text-[#526359] bg-[#1A2F25]/5 px-2.5 py-0.5 rounded-full border border-[#1A2F25]/10">
              {loading ? "..." : `${filteredNotifications.length} Events`}
            </span>
          </div>
          <p className="text-xs font-sans text-[#526359] mt-0.5">
            Real-time terminal execution alerts synchronized via Server-Sent Events (SSE).
          </p>
        </div>

        {/* Live SSE Status & Action Strip */}
        <div className="flex flex-wrap items-center gap-2">
          {/* SSE Pulse Indicator */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono border transition-colors ${
              sseConnected
                ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                : "bg-stone-100 text-stone-500 border-stone-200"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                sseConnected ? "bg-emerald-500 animate-pulse" : "bg-stone-400"
              }`}
            ></span>
            <span>{sseConnected ? "SSE Connected" : "Polling (10s)"}</span>
          </div>

          <button
            type="button"
            onClick={handleTriggerTest}
            className="px-3 py-1 bg-white hover:bg-[#F8F6F2] border border-[#1A2F25]/15 rounded-full text-xs font-mono text-[#1A2F25] transition-colors cursor-pointer shadow-2xs"
            title="Dispatch a test notification"
          >
            + Test Alert
          </button>

          {notifications.length > 0 && (
            <>
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="px-3 py-1 bg-white hover:bg-[#F8F6F2] border border-[#1A2F25]/15 text-[#526359] hover:text-[#1A2F25] rounded-full text-xs font-mono transition-colors cursor-pointer shadow-2xs"
              >
                Mark Read
              </button>

              <button
                type="button"
                onClick={handleClearAll}
                className="px-3 py-1 bg-white hover:bg-red-50 border border-red-200 text-red-600 rounded-full text-xs font-mono transition-colors cursor-pointer shadow-2xs"
              >
                Clear All
              </button>
            </>
          )}

          <button
            type="button"
            onClick={fetchNotifications}
            disabled={loading}
            className="px-2.5 py-1 bg-white hover:bg-[#F8F6F2] border border-[#1A2F25]/15 rounded-full text-xs font-mono text-[#1A2F25] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <span className={loading ? "animate-spin" : ""}>↻</span>
          </button>
        </div>
      </div>

      {/* Action Notification Banner */}
      {actionMessage && (
        <div className="mb-3 px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-mono text-emerald-800 flex items-center justify-between animate-in fade-in shrink-0">
          <span>{actionMessage}</span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 cursor-pointer font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mb-3.5 shrink-0">
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

        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search alerts or task ID..."
            className="w-full sm:w-64 px-3.5 py-1.5 pl-8 bg-white border border-[#1A2F25]/15 rounded-full text-xs font-mono text-[#1A2F25] placeholder:text-[#526359]/60 focus:outline-none focus:border-[#E06D53]"
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

      {/* Compact High-Density Notification Feed */}
      <div className="flex-1 overflow-y-auto pr-1 space-y-4">
        {filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 border border-dashed border-[#1A2F25]/15 rounded-2xl bg-white/50 text-center">
            <span className="text-2xl mb-2 opacity-60">🔔</span>
            <h3 className="font-editorial text-2xl text-[#1A2F25] mb-1">
              No notifications recorded
            </h3>
            <p className="text-xs font-sans text-[#526359] max-w-sm mb-4">
              Terminal notifications appear here when an automated workflow completes, fails, or pauses.
            </p>
            <button
              type="button"
              onClick={handleTriggerTest}
              className="px-4 py-1.5 bg-[#E06D53] hover:bg-[#CD5B42] text-white text-xs font-mono rounded-full transition-colors cursor-pointer shadow-xs"
            >
              Trigger Test Notification
            </button>
          </div>
        ) : (
          groupedNotifications.map((group) => (
            <div key={group.label}>
              {/* Chronological Section Header */}
              <div className="text-[11px] font-mono uppercase tracking-wider text-[#526359] mb-2 px-1 flex items-center gap-2">
                <span>{group.label}</span>
                <span className="flex-1 h-px bg-[#1A2F25]/8"></span>
              </div>

              <div className="space-y-1.5">
                {group.items.map((notif) => {
                  const badge = getStatusBadge(notif.status);
                  return (
                    <div
                      key={notif.id}
                      className={`bg-white hover:bg-[#FFF9F6] border border-[#1A2F25]/10 hover:border-[#E06D53]/40 rounded-xl p-3 sm:px-4 sm:py-2.5 transition-all shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 group ${
                        notif.read ? "opacity-75" : ""
                      }`}
                    >
                      {/* Left: Status & Message */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${badge.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`}></span>
                          {badge.label}
                        </span>

                        <p className="text-xs font-sans text-[#1A2F25] group-hover:text-[#CD5B42] transition-colors truncate">
                          {notif.message}
                        </p>
                      </div>

                      {/* Right: Task ID & Deep Link to Workflow */}
                      <div className="flex items-center gap-3 text-xs font-mono shrink-0 justify-between sm:justify-end">
                        {notif.task_id && (
                          <button
                            type="button"
                            onClick={() => onNavigateToWorkflow?.(notif.task_id)}
                            className="text-[11px] font-mono text-[#526359] hover:text-[#E06D53] bg-[#1A2F25]/5 hover:bg-[#E06D53]/10 px-2 py-0.5 rounded transition-colors cursor-pointer flex items-center gap-1"
                            title={`Navigate directly to workflow ${notif.task_id}`}
                          >
                            <span>{notif.task_id}</span>
                            <span>&rarr;</span>
                          </button>
                        )}

                        <span className="text-[11px] text-[#526359]">
                          {notif.time || notif.date || "---"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
