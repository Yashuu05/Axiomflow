"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader, { DashboardTab } from "@/components/dashboard/DashboardHeader";
import WorkflowView from "@/components/dashboard/WorkflowView";
import LogsView from "@/components/dashboard/LogsView";
import ConnectView from "@/components/dashboard/ConnectView";
import NotificationsView from "@/components/dashboard/NotificationsView";
import ProfileView from "@/components/dashboard/ProfileView";

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DashboardTab>("workflow");

  const handleLogout = () => {
    try {
      localStorage.removeItem("axiomflow_session");
    } catch {
      // Ignore
    }
    router.push("/signin");
  };

  return (
    <div className="min-h-screen lg:max-h-screen lg:h-screen bg-[#F8F6F2] text-[#1A2F25] flex flex-col selection:bg-[#E06D53] selection:text-white lg:overflow-hidden">
      {/* Top Navbar */}
      <DashboardHeader
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onLogout={handleLogout}
      />

      {/* Main Workspace Frame */}
      <main className="flex-1 max-w-[1500px] w-full mx-auto p-3 sm:p-5 lg:p-6 flex flex-col min-h-0 overflow-hidden">
        {/* Workspace Card with refined dual-toned border & top terracotta accent */}
        <div className="flex-1 w-full bg-white/85 rounded-2xl sm:rounded-[28px] border border-[#1A2F25]/12 shadow-[0_12px_40px_-12px_rgba(26,47,37,0.06)] p-4 sm:p-6 lg:p-8 flex flex-col min-h-0 relative overflow-hidden backdrop-blur-sm">
          {/* Subtle warm top accent line */}
          <div className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#E06D53]/80 to-transparent absolute top-0 left-0" />

          {/* Animated View Container */}
          <div key={activeTab} className="flex-1 flex flex-col min-h-0 overflow-hidden animate-in fade-in duration-200">
            {activeTab === "workflow" && <WorkflowView />}
            {activeTab === "connect" && (
              <ConnectView onBackToWorkflow={() => setActiveTab("workflow")} />
            )}
            {activeTab === "logs" && <LogsView />}
            {activeTab === "notifications" && (
              <NotificationsView onNavigateToWorkflow={() => setActiveTab("workflow")} />
            )}
            {activeTab === "profile" && (
              <ProfileView onBackToWorkflow={() => setActiveTab("workflow")} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
