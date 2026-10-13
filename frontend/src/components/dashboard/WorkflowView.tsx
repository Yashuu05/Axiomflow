"use client";

import { useState } from "react";
import WorkflowBeforeExecution from "./WorkflowBeforeExecution";
import WorkflowRunningView from "./WorkflowRunningView";

export default function WorkflowView() {
  const [isRunning, setIsRunning] = useState<boolean>(true); // default to running state so user can immediately see the rich running interface, or toggle
  const [objective, setObjective] = useState<string>(
    'schedule meeting of “Revenue disucssion” to only finance team. Meeting will held on 20/10/2026 at 10:00 a.m'
  );

  const handleStartWorkflow = (query: string) => {
    setObjective(query);
    setIsRunning(true);
  };

  const handleResetWorkflow = () => {
    setIsRunning(false);
  };

  return (
    <div className="flex-1 flex flex-col justify-between h-full">
      {/* State Switcher Indicator (helpful for demoing both mockups) */}
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
          objective={objective}
          onResetWorkflow={handleResetWorkflow}
        />
      ) : (
        <WorkflowBeforeExecution onStartWorkflow={handleStartWorkflow} />
      )}
    </div>
  );
}
