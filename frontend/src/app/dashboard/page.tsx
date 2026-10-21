"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DashboardHeader, { DashboardTab } from "@/components/dashboard/DashboardHeader";
import WorkflowView from "@/components/dashboard/WorkflowView";
import LogsView from "@/components/dashboard/LogsView";
import ConnectView from "@/components/dashboard/ConnectView";
import NotificationsView from "@/components/dashboard/NotificationsView";

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
    <div className="min-h-screen bg-[#F8F6F2] text-[#1A2F25] flex flex-col selection:bg-[#E06D53] selection:text-white">
      {/* Top Navbar matching layout.png & mockups */}
      <DashboardHeader
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab)}
        onLogout={handleLogout}
      />

      {/* Main Workspace Frame matching layout.png */}
      <main className="flex-1 max-w-[1500px] w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col">
        {/* Workspace Card with characteristic terracotta rounded border */}
        <div className="flex-1 w-full bg-white/80 rounded-[24px] sm:rounded-[32px] border border-[#E06D53]/60 shadow-[0_12px_40px_-12px_rgba(224,109,83,0.08)] p-6 sm:p-8 md:p-10 flex flex-col justify-between relative overflow-hidden backdrop-blur-sm">
          {activeTab === "workflow" && <WorkflowView />}
          {activeTab === "connect" && (
            <ConnectView onBackToWorkflow={() => setActiveTab("workflow")} />
          )}
          {activeTab === "logs" && <LogsView />}
          {activeTab === "notifications" && (
            <NotificationsView onNavigateToWorkflow={() => setActiveTab("workflow")} />
          )}
        </div>
      </main>
    </div>
  );
}
