"use client";

import { useState, useEffect } from "react";
import WorkflowBeforeExecution from "./WorkflowBeforeExecution";
import WorkflowRunningView from "./WorkflowRunningView";

export default function WorkflowView() {
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [objective, setObjective] = useState<string>("");

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Check on mount if there is already an active workflow running in the backend
  useEffect(() => {
    fetch(`${API_BASE}/api/workflow/latest`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.workflow) {
          setActiveTaskId(data.workflow.task_id);
          setObjective(data.workflow.query);
          if (
            data.workflow.status === "running" ||
            data.workflow.status === "waiting_approval"
          ) {
            setIsRunning(true);
          }
        }
      })
      .catch((err) => console.error("Error checking latest workflow:", err));
  }, [API_BASE]);

  const handleStartWorkflow = async (query: string) => {
    setObjective(query);
    try {
      let userId = "usr_72b30e7cd49e49e5";
      let businessId = 2;
      let accountEmail = "chillalyash2005@gmail.com";

      try {
        const stored = localStorage.getItem("axiomflow_session");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.user_id) userId = parsed.user_id;
          if (parsed.business_id) businessId = parsed.business_id;
          if (parsed.admin_email) accountEmail = parsed.admin_email;
        }
      } catch {
        // use defaults
      }

      const res = await fetch(`${API_BASE}/api/workflow/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          user_id: userId,
          business_id: businessId,
          account_email: accountEmail,
          auto_approve: false,
        }),
      });

      const data = await res.json();
      if (res.ok && data.task_id) {
        setActiveTaskId(data.task_id);
        setIsRunning(true);
      }
    } catch (err) {
      console.error("Failed to start workflow:", err);
    }
  };

  const handleResetWorkflow = () => {
    setIsRunning(false);
  };

  return (
    <div className="flex-1 flex flex-col justify-between h-full">
      {/* State Switcher Indicator */}
      <div className="flex justify-end mb-2">
        <div className="inline-flex items-center gap-1 bg-[#1A2F25]/5 p-1 rounded-full text-[11px] font-mono">
          <button
            type="button"
            onClick={() => setIsRunning(false)}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
              !isRunning
                ? "bg-white text-[#1A2F25] font-semibold shadow-xs"
                : "text-[#526359] hover:text-[#1A2F25]"
            }`}
          >
            Before Run
          </button>
          <button
            type="button"
            onClick={() => setIsRunning(true)}
            className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
              isRunning
                ? "bg-[#E06D53] text-white font-semibold shadow-xs"
                : "text-[#526359] hover:text-[#1A2F25]"
            }`}
          >
            Active Workflow
          </button>
        </div>
      </div>

      {isRunning ? (
        <WorkflowRunningView
          taskId={activeTaskId}
          objective={objective}
          onResetWorkflow={handleResetWorkflow}
        />
      ) : (
        <WorkflowBeforeExecution onStartWorkflow={handleStartWorkflow} />
      )}
    </div>
  );
}
