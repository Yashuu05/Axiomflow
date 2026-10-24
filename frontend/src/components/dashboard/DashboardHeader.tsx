"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import AxiomflowLogo from "../AxiomflowLogo";
import DashboardSettingsModal from "./DashboardSettingsModal";

export type DashboardTab = "workflow" | "connect" | "logs" | "notifications" | "profile";

interface DashboardHeaderProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onLogout: () => void;
}

export interface NotificationItem {
  id: string;
  date: string;
  time: string;
  message: string;
  status: string;
  created_at: string;
}

export default function DashboardHeader({
  activeTab,
  onTabChange,
  onLogout,
}: DashboardHeaderProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [toast, setToast] = useState<{ show: boolean; message: string; status: string } | null>(null);
  const [userData, setUserData] = useState({
    userName: "---",
    businessName: "---",
    userRole: "---",
  });

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Dedicated fetch function for notifications
  const loadNotifications = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/notifications?limit=50`).catch(() => null);
      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
        }
      }
    } catch {
      // Silently ignore if backend is restarting or offline
    }
  }, [API_BASE]);

  useEffect(() => {
    let currentUserId = "usr_72b30e7cd49e49e5";
    try {
      const stored = localStorage.getItem("axiomflow_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.user_id) currentUserId = parsed.user_id;
        setUserData({
          userName: parsed.admin_name || "---",
          businessName: parsed.business_name || "---",
          userRole: parsed.role || "---",
        });
      }
    } catch {
      // Ignore if localStorage unavailable
    }

    // Fetch user & organization profile from axiomflow_db
    fetch(`${API_BASE}/api/user/profile/${currentUserId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((profile) => {
        if (profile) {
          setUserData({
            userName: profile.user_name || "---",
            businessName: profile.business_name || "---",
            userRole: profile.role || "---",
          });
        }
      })
      .catch(() => {
        // Silently preserve cached localStorage profile if backend is offline
      });

    // Initial notifications load
    loadNotifications();

    // Setup Server-Sent Events (SSE) listener for real-time notifications
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`${API_BASE}/api/notifications/events`);

      eventSource.onerror = () => {
        // Suppress browser console noise if backend is momentarily offline
      };

      eventSource.addEventListener("notification", (e: MessageEvent) => {
        try {
          const payload = JSON.parse(e.data);
          if (payload) {
            setNotifications((prev) => {
              const exists = prev.some((n) => n.id === payload.id);
              if (exists) return prev;
              return [payload, ...prev];
            });

            // Show interactive in-app toast notification
            setToast({
              show: true,
              message: payload.message || "New workflow alert received",
              status: payload.status || "info",
            });
          }
        } catch (err) {
          console.error("Failed to parse SSE payload in header:", err);
        }
      });
    } catch {
      // EventSource instantiation fallback
    }

    // Fallback polling interval every 8 seconds
    const interval = setInterval(() => {
      loadNotifications();
    }, 8000);

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      clearInterval(interval);
    };
  }, [API_BASE, loadNotifications]);

  // Auto-dismiss toast after 6 seconds
  useEffect(() => {
    if (toast?.show) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleToggleBell = () => {
    const nextState = !showNotifications;
    setShowNotifications(nextState);
    setShowProfile(false);
    if (nextState) {
      loadNotifications();
    }
  };

  return (
    <>
      {/* In-App Floating Toast Notification Pop-up */}
      {toast && toast.show && (
        <div className="fixed top-5 right-5 z-50 max-w-sm w-full bg-white border-2 border-[#E06D53] rounded-2xl shadow-2xl p-4 animate-in slide-in-from-top-4 duration-300 backdrop-blur-md">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E06D53] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#E06D53]"></span>
              </span>
              <span className="font-editorial text-lg font-semibold text-[#1A2F25]">
                AxiomFlow Alert
              </span>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-[#526359] hover:text-[#1A2F25] text-xs font-mono cursor-pointer"
            >
              ✕
            </button>
          </div>
          <p className="mt-1 text-xs font-sans text-[#1A2F25] leading-relaxed">
            {toast.message}
          </p>
          <div className="mt-3 flex items-center justify-between pt-2 border-t border-[#1A2F25]/10 text-[11px] font-mono">
            <span className="uppercase text-[#CD5B42] font-semibold">{toast.status}</span>
            <button
              type="button"
              onClick={() => {
                setToast(null);
                onTabChange("notifications");
              }}
              className="text-[#CD5B42] hover:underline font-semibold cursor-pointer"
            >
              Open Notifications →
            </button>
          </div>
        </div>
      )}

      <header className="w-full bg-[#F8F6F2] py-4 px-4 sm:px-8 border-b border-[#1A2F25]/8 select-none">
        <div className="max-w-[1500px] mx-auto flex items-center justify-between">
          {/* Left Brand Lockup */}
          <Link href="/" className="flex items-center group shrink-0" aria-label="Axiomflow Home">
            <AxiomflowLogo variant="full" size={28} />
          </Link>

          {/* Center Navigation Tabs: Workflow | Connect | Logs | Notifications */}
          <nav className="flex items-center gap-6 sm:gap-8 md:gap-12">
            <button
              type="button"
              onClick={() => onTabChange("workflow")}
              className={`font-editorial text-2xl md:text-3xl transition-all relative py-1 cursor-pointer ${
                activeTab === "workflow"
                  ? "text-[#1A2F25] font-normal"
                  : "text-[#1A2F25]/75 hover:text-[#1A2F25]"
              }`}
            >
              Workflow
              {activeTab === "workflow" && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#E06D53] rounded-full"></span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onTabChange("connect")}
              className={`font-editorial text-2xl md:text-3xl transition-all relative py-1 cursor-pointer flex items-center gap-1.5 ${
                activeTab === "connect"
                  ? "text-[#1A2F25] font-normal"
                  : "text-[#1A2F25]/75 hover:text-[#1A2F25]"
              }`}
            >
              <span>Connect</span>
              <span className="text-[9px] font-mono tracking-tighter uppercase px-1.5 py-0.5 rounded bg-[#E06D53]/15 text-[#E06D53] hidden sm:inline">
                Under spec
              </span>
              {activeTab === "connect" && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#E06D53] rounded-full"></span>
              )}
            </button>

            <button
              type="button"
              onClick={() => onTabChange("logs")}
              className={`font-editorial text-2xl md:text-3xl transition-all relative py-1 cursor-pointer ${
                activeTab === "logs"
                  ? "text-[#1A2F25] font-normal"
                  : "text-[#1A2F25]/75 hover:text-[#1A2F25]"
              }`}
            >
              Logs
              {activeTab === "logs" && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#E06D53] rounded-full"></span>
              )}
            </button>

            {/* Notifications Tab */}
            <button
              type="button"
              onClick={() => onTabChange("notifications")}
              className={`font-editorial text-2xl md:text-3xl transition-all relative py-1 cursor-pointer flex items-center gap-1.5 ${
                activeTab === "notifications"
                  ? "text-[#1A2F25] font-normal"
                  : "text-[#1A2F25]/75 hover:text-[#1A2F25]"
              }`}
            >
              <span>Notifications</span>
              {notifications.length > 0 && (
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-[#E06D53] text-white">
                  {notifications.length}
                </span>
              )}
              {activeTab === "notifications" && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#E06D53] rounded-full"></span>
              )}
            </button>

            {/* Profile Tab */}
            <button
              type="button"
              onClick={() => onTabChange("profile")}
              className={`font-editorial text-2xl md:text-3xl transition-all relative py-1 cursor-pointer ${
                activeTab === "profile"
                  ? "text-[#1A2F25] font-normal"
                  : "text-[#1A2F25]/75 hover:text-[#1A2F25]"
              }`}
            >
              Profile
              {activeTab === "profile" && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#E06D53] rounded-full"></span>
              )}
            </button>
          </nav>

          {/* Right Action Icons & Log out Pill */}
          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            {/* Log out Pill Button */}
            <button
              type="button"
              onClick={onLogout}
              className="px-4 md:px-5 py-1 border border-[#CD5B42] text-[#1A2F25] hover:bg-[#CD5B42] hover:text-white rounded-full font-editorial text-lg md:text-xl transition-all cursor-pointer shadow-2xs"
            >
              Log out
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={handleToggleBell}
                aria-label="Notifications"
                className="w-9 h-9 flex items-center justify-center text-[#CD5B42] hover:text-[#E06D53] transition-colors relative cursor-pointer"
              >
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
                </svg>
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E06D53] ring-2 ring-[#F8F6F2]"></span>
                )}
              </button>

              {/* Notifications Popover */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-84 bg-white border border-[#E06D53]/40 rounded-2xl shadow-xl p-4 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1A2F25]/10 mb-3">
                    <span className="font-editorial text-lg text-[#1A2F25]">Alerts & Approvals</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={loadNotifications}
                        title="Refresh notifications from DB"
                        className="text-[10px] font-mono text-[#526359] hover:text-[#E06D53] px-1 cursor-pointer"
                      >
                        ↻
                      </button>
                      <span className="text-[10px] font-mono text-[#E06D53] bg-[#E06D53]/10 px-1.5 py-0.5 rounded">
                        {notifications.length} {notifications.length === 1 ? "RECORD" : "RECORDS"}
                      </span>
                    </div>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs font-mono text-[#526359]">
                      no data available (---)
                    </div>
                  ) : (
                    <div className="space-y-2.5 max-h-72 overflow-y-auto">
                      {notifications.map((n) => (
                        <div
                          key={n.id}
                          className="p-2.5 bg-[#F8F6F2] hover:bg-[#FFF6F3] rounded-xl text-xs transition-colors cursor-pointer border border-[#1A2F25]/5"
                        >
                          <div className="flex items-center justify-between font-medium text-[#1A2F25] mb-0.5">
                            <span className="truncate pr-2 font-mono text-[11px] font-semibold uppercase text-[#CD5B42]">
                              {n.status || "EVENT"}
                            </span>
                            <span className="text-[10px] font-mono text-[#526359] shrink-0">
                              {n.time || n.date || "---"}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#526359] leading-relaxed">
                            {n.message || "---"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Popover footer linking to Notifications tab */}
                  <div className="mt-3 pt-2.5 border-t border-[#1A2F25]/10 flex items-center justify-between text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotifications(false);
                        onTabChange("notifications");
                      }}
                      className="text-[#CD5B42] hover:underline font-semibold cursor-pointer"
                    >
                      View All Notifications →
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await fetch(`${API_BASE}/api/notifications/clear`, { method: "POST" });
                          setNotifications([]);
                        } catch (e) {
                          console.error(e);
                        }
                      }}
                      className="text-stone-400 hover:text-red-500 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Settings Gear */}
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              aria-label="Settings"
              className="w-9 h-9 flex items-center justify-center text-[#CD5B42] hover:text-[#E06D53] transition-colors cursor-pointer"
            >
              <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
              </svg>
            </button>

            {/* User Profile Avatar / Profile Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  onTabChange("profile");
                  setShowProfile(false);
                  setShowNotifications(false);
                }}
                aria-label="User Profile"
                title="Profile: Business & Admin Details"
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-all cursor-pointer ${
                  activeTab === "profile"
                    ? "bg-[#E06D53] text-white shadow-sm ring-2 ring-[#E06D53]/40"
                    : "text-[#CD5B42] hover:text-[#E06D53] hover:bg-[#E06D53]/10"
                }`}
              >
                <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      <DashboardSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}
