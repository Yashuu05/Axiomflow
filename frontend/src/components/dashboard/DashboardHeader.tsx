"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import AxiomflowLogo from "../AxiomflowLogo";
import DashboardSettingsModal from "./DashboardSettingsModal";

export type DashboardTab = "workflow" | "connect" | "logs";

interface DashboardHeaderProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  onLogout: () => void;
}

interface NotificationItem {
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
  const [userData, setUserData] = useState({
    userName: "---",
    businessName: "---",
    userRole: "---",
  });

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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

    // Fetch real user & organization profile from axiomflow_db
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
      .catch((err) => console.error("Error loading user profile:", err));

    // Fetch real notifications from axiomflow_db.notifications
    fetch(`${API_BASE}/api/notifications`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.notifications) {
          setNotifications(data.notifications);
        } else {
          setNotifications([]);
        }
      })
      .catch((err) => console.error("Error loading notifications:", err));
  }, [API_BASE]);

  return (
    <>
      <header className="w-full bg-[#F8F6F2] py-4 px-4 sm:px-8 border-b border-[#1A2F25]/8 select-none">
        <div className="max-w-[1500px] mx-auto flex items-center justify-between">
          {/* Left Brand Lockup matching mockup */}
          <Link href="/" className="flex items-center group shrink-0" aria-label="Axiomflow Home">
            <AxiomflowLogo variant="full" size={28} />
          </Link>

          {/* Center Navigation Tabs matching mockup */}
          <nav className="flex items-center gap-8 md:gap-14">
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
          </nav>

          {/* Right Action Icons & Log out Pill matching mockup */}
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
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowProfile(false);
                }}
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
                <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E06D53]/40 rounded-2xl shadow-xl p-4 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1A2F25]/10 mb-3">
                    <span className="font-editorial text-lg text-[#1A2F25]">Alerts & Approvals</span>
                    <span className="text-[10px] font-mono text-[#E06D53] bg-[#E06D53]/10 px-1.5 py-0.5 rounded">
                      {notifications.length} {notifications.length === 1 ? "RECORD" : "RECORDS"}
                    </span>
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
                            <span className="truncate pr-2 font-mono text-[11px] font-semibold uppercase">{n.status || "EVENT"}</span>
                            <span className="text-[10px] font-mono text-[#526359] shrink-0">{n.time || n.date || "---"}</span>
                          </div>
                          <p className="text-[11px] text-[#526359] leading-relaxed">{n.message || "---"}</p>
                        </div>
                      ))}
                    </div>
                  )}
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

            {/* User Profile Avatar */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowProfile(!showProfile);
                  setShowNotifications(false);
                }}
                aria-label="User Profile"
                className="w-9 h-9 flex items-center justify-center text-[#CD5B42] hover:text-[#E06D53] transition-colors cursor-pointer"
              >
                <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
                </svg>
              </button>

              {/* Profile Dropdown */}
              {showProfile && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-[#E06D53]/40 rounded-2xl shadow-xl p-4 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center gap-3 pb-3 border-b border-[#1A2F25]/10 mb-3">
                    <div className="w-10 h-10 rounded-full bg-[#E06D53]/15 text-[#E06D53] flex items-center justify-center font-editorial text-xl font-bold">
                      {userData.userName.charAt(0)}
                    </div>
                    <div>
                      <div className="font-editorial text-lg text-[#1A2F25] leading-snug">
                        {userData.userName}
                      </div>
                      <div className="text-[11px] font-mono text-[#526359] truncate">
                        {userData.businessName}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs font-mono text-[#526359] mb-3">
                    <div className="flex justify-between">
                      <span>Role:</span>
                      <span className="text-[#1A2F25] font-semibold">{userData.userRole}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Database:</span>
                      <span className="text-[#1A2F25]">axiomflow_db</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onLogout}
                    className="w-full py-1.5 bg-[#F8F6F2] hover:bg-[#E06D53] hover:text-white border border-[#1A2F25]/10 rounded-xl text-xs font-mono text-[#1A2F25] transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              )}
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
