"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  task_id?: string;
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
  const [toast, setToast] = useState<{ show: boolean; message: string; status: string; taskId?: string } | null>(null);
  const [hasActiveIntegrations, setHasActiveIntegrations] = useState<boolean>(false);
  const [userData, setUserData] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("axiomflow_session");
        if (stored) {
          const parsed = JSON.parse(stored);
          return {
            userName: parsed.admin_name || "---",
            businessName: parsed.business_name || "---",
            userRole: parsed.role || "---",
          };
        }
      } catch {
        // Ignore if localStorage unavailable
      }
    }
    return {
      userName: "---",
      businessName: "---",
      userRole: "---",
    };
  });

  const notificationsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

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

  // Click-outside and keyboard Escape dismissal handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowNotifications(false);
        setShowProfile(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    let currentUserId = "usr_72b30e7cd49e49e5";
    try {
      const stored = localStorage.getItem("axiomflow_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.user_id) currentUserId = parsed.user_id;
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
      .catch(() => {});

    // Check OAuth integration status to dynamically update "Connect" pill
    fetch(`${API_BASE}/api/oauth/google/status/${currentUserId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.connected_accounts && data.connected_accounts.length > 0) {
          setHasActiveIntegrations(true);
        } else {
          setHasActiveIntegrations(false);
        }
      })
      .catch(() => {});

    // Initial notifications load deferred to next tick
    const initTimer = setTimeout(() => {
      loadNotifications();
    }, 0);

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

            // Show interactive in-app toast notification relocated to bottom-right
            setToast({
              show: true,
              message: payload.message || "New workflow alert received",
              status: payload.status || "info",
              taskId: payload.task_id,
            });
          }
        } catch (err) {
          console.error("Failed to parse SSE payload in header:", err);
        }
      });
    } catch {
      // EventSource fallback
    }

    // Fallback polling interval every 8 seconds
    const interval = setInterval(() => {
      loadNotifications();
    }, 8000);

    return () => {
      clearTimeout(initTimer);
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

  const handleToggleProfile = () => {
    setShowProfile(!showProfile);
    setShowNotifications(false);
  };

  return (
    <>
      {/* Relocated Non-Intrusive Floating Toast Notification (Bottom-Right) */}
      {toast && toast.show && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white/95 border-2 border-[#E06D53] rounded-2xl shadow-2xl p-4 animate-in slide-in-from-bottom-4 duration-300 backdrop-blur-md">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E06D53] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-[#E06D53]"></span>
              </span>
              <span className="font-editorial text-lg font-semibold text-[#1A2F25]">
                Workflow Alert
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
          <p className="mt-1.5 text-xs font-sans text-[#1A2F25] leading-relaxed">
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
              Open Feed →
            </button>
          </div>
        </div>
      )}

      <header className="w-full bg-[#F8F6F2] py-3.5 px-4 sm:px-8 border-b border-[#1A2F25]/8 select-none shrink-0 z-40">
        <div className="max-w-[1500px] mx-auto flex items-center justify-between">
          {/* Left Brand Lockup */}
          <Link href="/" className="flex items-center group shrink-0" aria-label="Axiomflow Home">
            <AxiomflowLogo variant="full" size={28} />
          </Link>

          {/* Central Navigation: 3 Focused Wayfinding Hubs (Workflow | Integrations | Audit Logs) */}
          <nav className="flex items-center gap-6 sm:gap-10">
            {/* Workflow Hub */}
            <button
              type="button"
              onClick={() => onTabChange("workflow")}
              className={`font-editorial text-xl md:text-2xl tracking-tight transition-all relative py-1 cursor-pointer ${
                activeTab === "workflow"
                  ? "text-[#1A2F25] font-normal"
                  : "text-[#1A2F25]/70 hover:text-[#1A2F25]"
              }`}
            >
              Workflow
              {activeTab === "workflow" && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#E06D53] rounded-full"></span>
              )}
            </button>

            {/* Integrations Hub (Renamed from Connect, with dynamic status badge) */}
            <button
              type="button"
              onClick={() => onTabChange("connect")}
              className={`font-editorial text-xl md:text-2xl tracking-tight transition-all relative py-1 cursor-pointer flex items-center gap-2 ${
                activeTab === "connect"
                  ? "text-[#1A2F25] font-normal"
                  : "text-[#1A2F25]/70 hover:text-[#1A2F25]"
              }`}
            >
              <span>Integrations</span>
              {hasActiveIntegrations ? (
                <span className="text-[10px] font-mono tracking-tighter uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300 hidden sm:inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                  Active
                </span>
              ) : (
                <span className="text-[10px] font-mono tracking-tighter uppercase px-2 py-0.5 rounded-full bg-[#1A2F25]/5 text-[#526359] border border-[#1A2F25]/10 hidden sm:inline">
                  Setup
                </span>
              )}
              {activeTab === "connect" && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#E06D53] rounded-full"></span>
              )}
            </button>

            {/* Audit Logs Hub (Renamed from Logs) */}
            <button
              type="button"
              onClick={() => onTabChange("logs")}
              className={`font-editorial text-xl md:text-2xl tracking-tight transition-all relative py-1 cursor-pointer ${
                activeTab === "logs"
                  ? "text-[#1A2F25] font-normal"
                  : "text-[#1A2F25]/70 hover:text-[#1A2F25]"
              }`}
            >
              Audit Logs
              {activeTab === "logs" && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-[#E06D53] rounded-full"></span>
              )}
            </button>
          </nav>

          {/* Right Action Icons & User Governance Cluster */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 shrink-0">
            {/* Notification Bell with unread counter badge */}
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={handleToggleBell}
                aria-label="Notifications"
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-all cursor-pointer relative ${
                  showNotifications || activeTab === "notifications"
                    ? "text-[#E06D53] bg-[#E06D53]/10"
                    : "text-[#1A2F25]/75 hover:text-[#E06D53] hover:bg-[#1A2F25]/5"
                }`}
                title="Alerts & Live Notifications"
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z" />
                </svg>
                {notifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E06D53] ring-2 ring-[#F8F6F2]"></span>
                )}
              </button>

              {/* Notifications Popover Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-84 sm:w-96 bg-white border border-[#1A2F25]/12 rounded-2xl shadow-xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1A2F25]/10 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-editorial text-lg text-[#1A2F25]">Alerts & Telemetry</span>
                      <span className="text-[10px] font-mono text-[#E06D53] bg-[#E06D53]/10 px-1.5 py-0.5 rounded font-bold">
                        {notifications.length}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={loadNotifications}
                      title="Refresh notifications"
                      className="text-xs font-mono text-[#526359] hover:text-[#E06D53] px-1.5 py-0.5 rounded border border-[#1A2F25]/10 cursor-pointer"
                    >
                      ↻ Refresh
                    </button>
                  </div>

                  {notifications.length === 0 ? (
                    <div className="py-6 text-center text-xs font-mono text-[#526359]">
                      No new events recorded (---)
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {notifications.slice(0, 8).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            setShowNotifications(false);
                            onTabChange("notifications");
                          }}
                          className="p-2.5 bg-[#F8F6F2] hover:bg-[#FFF6F3] rounded-xl text-xs transition-colors cursor-pointer border border-[#1A2F25]/5"
                        >
                          <div className="flex items-center justify-between font-medium text-[#1A2F25] mb-0.5">
                            <span className="truncate pr-2 font-mono text-[10px] font-semibold uppercase text-[#CD5B42]">
                              {n.status || "EVENT"}
                            </span>
                            <span className="text-[10px] font-mono text-[#526359] shrink-0">
                              {n.time || n.date || "---"}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#526359] leading-relaxed line-clamp-2">
                            {n.message || "---"}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Popover footer */}
                  <div className="mt-3 pt-2.5 border-t border-[#1A2F25]/10 flex items-center justify-between text-xs font-mono">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNotifications(false);
                        onTabChange("notifications");
                      }}
                      className="text-[#CD5B42] hover:underline font-semibold cursor-pointer"
                    >
                      Open Full Event Feed →
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
                      Clear All
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Runtime System Preferences Gear */}
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              aria-label="Settings"
              title="Runtime Execution Preferences"
              className="w-9 h-9 flex items-center justify-center text-[#1A2F25]/75 hover:text-[#E06D53] hover:bg-[#1A2F25]/5 rounded-full transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
              </svg>
            </button>

            {/* Profile Menu Trigger & Governance Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={handleToggleProfile}
                aria-label="User Profile Governance"
                title="Account & Organization Governance"
                className={`w-9 h-9 flex items-center justify-center rounded-full transition-all cursor-pointer ${
                  showProfile || activeTab === "profile"
                    ? "bg-[#E06D53] text-white shadow-sm ring-2 ring-[#E06D53]/40"
                    : "text-[#1A2F25]/75 hover:text-[#E06D53] hover:bg-[#1A2F25]/5"
                }`}
              >
                <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
              </button>

              {/* Profile Dropdown Menu */}
              {showProfile && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-[#1A2F25]/12 rounded-2xl shadow-xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="pb-3 border-b border-[#1A2F25]/10">
                    <div className="font-semibold text-sm text-[#1A2F25] truncate">
                      {userData.userName !== "---" ? userData.userName : "Workspace Administrator"}
                    </div>
                    <div className="text-xs text-[#526359] truncate mt-0.5">
                      {userData.businessName !== "---" ? userData.businessName : "Axiomflow Organization"}
                    </div>
                    <span className="inline-block mt-1.5 px-2 py-0.5 bg-[#1A2F25]/5 border border-[#1A2F25]/10 rounded-full text-[10px] font-mono uppercase text-[#CD5B42]">
                      Role: {userData.userRole !== "---" ? userData.userRole : "Admin"}
                    </span>
                  </div>

                  <div className="py-2 space-y-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfile(false);
                        onTabChange("profile");
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-sans text-[#1A2F25] hover:bg-[#F8F6F2] rounded-xl transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span>Organization Governance</span>
                      <span className="text-[#526359]">&rarr;</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setShowProfile(false);
                        setShowSettings(true);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-sans text-[#1A2F25] hover:bg-[#F8F6F2] rounded-xl transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <span>Runtime System Preferences</span>
                      <span className="text-[#526359]">&rarr;</span>
                    </button>
                  </div>

                  <div className="pt-2 border-t border-[#1A2F25]/10">
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfile(false);
                        onLogout();
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-sans text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium cursor-pointer flex items-center justify-between"
                    >
                      <span>Sign out</span>
                      <span>🚪</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Logout Pill */}
            <button
              type="button"
              onClick={onLogout}
              className="px-3.5 py-1 border border-[#1A2F25]/20 text-[#1A2F25] hover:border-[#CD5B42] hover:bg-[#CD5B42] hover:text-white rounded-full font-editorial text-base sm:text-lg transition-all cursor-pointer shadow-2xs hidden sm:inline-block"
            >
              Log out
            </button>
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
