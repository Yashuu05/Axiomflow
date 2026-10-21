"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import StepTimeline, { WorkflowStep } from "./StepTimeline";
import StepDetail from "./StepDetail";
import RadialDotsSpinner from "./RadialDotsSpinner";

interface WorkflowRunningViewProps {
  taskId?: string | null;
  objective?: string;
  onResetWorkflow: () => void;
}

export default function WorkflowRunningView({
  taskId,
  objective: initialObjective,
  onResetWorkflow,
}: WorkflowRunningViewProps) {
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string>("s1");
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [currentRunningStepIndex, setCurrentRunningStepIndex] = useState<number>(0);
  const [workflowStatus, setWorkflowStatus] = useState<string>("initializing");
  const [emailDraft, setEmailDraft] = useState<any>(null);
  const [calendarEvent, setCalendarEvent] = useState<any>(null);
  const [sheetResult, setSheetResult] = useState<any>(null);
  const [objective, setObjective] = useState<string>(initialObjective || "---");

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Dedicated 1-second interval timer that increments smoothly by exactly 1s every 1000ms
  useEffect(() => {
    const isCurrentlyActive =
      (workflowStatus === "running" ||
        workflowStatus === "waiting_approval" ||
        workflowStatus === "initializing") &&
      !isPaused &&
      !!taskId;

    if (isCurrentlyActive) {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [workflowStatus, isPaused, taskId]);

  // Poll backend for real-time workflow status
  const pollStatus = useCallback(async () => {
    if (!taskId) return;
    try {
      const res = await fetch(`${API_BASE}/api/workflow/status/${taskId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.query) setObjective(data.query);
        if (data.status) setWorkflowStatus(data.status);
        if (typeof data.is_paused === "boolean") setIsPaused(data.is_paused);
        if (data.steps && data.steps.length > 0) {
          setSteps(data.steps);
          // If selectedStepId not set or invalid, select running/waiting step
          const activeStep = data.steps.find(
            (s: WorkflowStep) => s.status === "running" || s.status === "waiting"
          );
          if (activeStep) {
            setSelectedStepId((prev) => {
              const stillExists = data.steps.some((s: WorkflowStep) => s.id === prev);
              return stillExists ? prev : activeStep.id;
            });
          }
        }
        if (typeof data.elapsed_seconds === "number") {
          // If terminal status, lock directly to server total
          if (
            data.status === "completed" ||
            data.status === "failed" ||
            data.status === "rejected"
          ) {
            setElapsedSeconds(data.elapsed_seconds);
          } else {
            // While running, only perform drift correction if divergence exceeds 2 seconds
            setElapsedSeconds((prev) => {
              if (prev === 0 || Math.abs(prev - data.elapsed_seconds) > 2) {
                return data.elapsed_seconds;
              }
              return prev;
            });
          }
        }
        if (typeof data.progress_percent === "number") {
          setProgressPercent(data.progress_percent);
        }
        if (typeof data.current_step_index === "number") {
          setCurrentRunningStepIndex(data.current_step_index);
        }
        if (data.email_draft) {
          setEmailDraft(data.email_draft);
        }
        if (data.calendar_event) {
          setCalendarEvent(data.calendar_event);
        }
        if (data.sheet_result) {
          setSheetResult(data.sheet_result);
        }

        // Stop polling if reached terminal status
        if (
          data.status === "completed" ||
          data.status === "failed" ||
          data.status === "rejected"
        ) {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      }
    } catch (err) {
      console.error("Polling error:", err);
    }
  }, [taskId, API_BASE]);

  useEffect(() => {
    if (!taskId) {
      setSteps([]);
      setObjective("---");
      setElapsedSeconds(0);
      setProgressPercent(0);
      setWorkflowStatus("idle");
      return;
    }

    // Initial fetch
    pollStatus();

    // Set polling interval every 1.5 seconds while active
    pollIntervalRef.current = setInterval(() => {
      pollStatus();
    }, 1500);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [taskId, pollStatus]);

  // Format seconds to "1m 42s" or "---" if 0 and idle
  const formatTime = (secs: number) => {
    if (!taskId && secs === 0) return "---";
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}m ${remainder < 10 ? "0" : ""}${remainder}s`;
  };

  // Selected step object
  const selectedStep = steps.find((s) => s.id === selectedStepId) || steps[0];

  // Handle Human Approval
  const handleApproveStep = async (stepId: string) => {
    if (!taskId) return;
    try {
      const res = await fetch(`${API_BASE}/api/workflow/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: taskId,
          decision: "accepted",
        }),
      });
      if (res.ok) {
        pollStatus();
      }
    } catch (err) {
      console.error("Failed to approve workflow step:", err);
    }
  };

  const handleRejectStep = async (stepId: string) => {
    if (!taskId) return;
    try {
      const res = await fetch(`${API_BASE}/api/workflow/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: taskId,
          decision: "rejected",
        }),
      });
      if (res.ok) {
        pollStatus();
      }
    } catch (err) {
      console.error("Failed to reject workflow step:", err);
    }
  };

  const handleSaveEdits = async (stepId: string, newBody: string) => {
    if (!taskId) return;
    try {
      const res = await fetch(`${API_BASE}/api/workflow/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task_id: taskId,
          decision: "updated",
          edited_body: newBody,
        }),
      });
      if (res.ok) {
        pollStatus();
      }
    } catch (err) {
      console.error("Failed to update workflow draft:", err);
    }
  };

  const handleRetryStep = async (stepId: string) => {
    pollStatus();
  };

  const handleTogglePause = async () => {
    if (!taskId) return;
    try {
      const endpoint = isPaused ? "resume" : "pause";
      const res = await fetch(`${API_BASE}/api/workflow/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId }),
      });
      if (res.ok) {
        setIsPaused(!isPaused);
        pollStatus();
      }
    } catch (err) {
      console.error("Failed to toggle pause:", err);
    }
  };

  const handleStopWorkflow = async () => {
    if (!taskId) return;
    try {
      await fetch(`${API_BASE}/api/workflow/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task_id: taskId }),
      });
      pollStatus();
    } catch (err) {
      console.error("Failed to stop workflow:", err);
    }
  };

  const isCompleted = workflowStatus === "completed";
  const isFailed = workflowStatus === "failed" || workflowStatus === "rejected";
  const isWaiting = workflowStatus === "waiting_approval";
  const isRunning = workflowStatus === "running";

  return (
    <div className="flex-1 flex flex-col justify-between py-2 md:py-4">
      {/* Top Objective Bar */}
      <div className="pb-4 border-b border-[#E06D53]/30">
        <div className="flex items-center justify-between gap-4">
          <div className="font-editorial text-2xl sm:text-3xl text-[#1A2F25] leading-tight">
            <span className="text-[#E06D53] mr-2">Objective:</span>
            <span>{objective || "---"}</span>
          </div>

          <button
            type="button"
            onClick={onResetWorkflow}
            className="text-xs font-mono text-[#526359] hover:text-[#E06D53] border border-[#1A2F25]/15 px-3 py-1.5 rounded-full bg-white hover:bg-white/80 transition-colors shrink-0 hidden sm:inline-block cursor-pointer"
          >
            + New Objective
          </button>
        </div>
      </div>

      {/* Status Bar & Controls */}
      <div className="my-5 flex flex-col items-center justify-center gap-3">
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm md:text-base font-editorial text-[#1A2F25]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3.5 w-3.5 items-center justify-center">
              {isRunning && !isPaused && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E06D53] opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  isCompleted
                    ? "bg-emerald-600"
                    : isFailed
                    ? "bg-red-500"
                    : isWaiting
                    ? "bg-[#E5A93C]"
                    : isRunning
                    ? "bg-[#E06D53]"
                    : "bg-gray-400"
                }`}
              ></span>
            </span>

            <span className="text-xl md:text-2xl text-[#1A2F25]">
              {!taskId ? (
                "no data available (---)"
              ) : isCompleted ? (
                `Workflow Completed · ${formatTime(elapsedSeconds)}`
              ) : isFailed ? (
                `Workflow Interrupted · ${formatTime(elapsedSeconds)}`
              ) : isWaiting ? (
                `Awaiting Human Review · Step ${currentRunningStepIndex + 1} of ${steps.length || 6}`
              ) : (
                `${isPaused ? "Paused" : "Running"} Step ${
                  steps.length > 0 ? currentRunningStepIndex + 1 : "---"
                } of ${steps.length || "---"} · ${formatTime(elapsedSeconds)}`
              )}
            </span>
          </div>

          {taskId && !isCompleted && !isFailed && (
            <div className="flex items-center gap-2 ml-2">
              <button
                type="button"
                onClick={handleTogglePause}
                className="px-4 py-1 bg-[#CD5B42] hover:bg-[#E06D53] text-white font-sans text-xs font-medium rounded-full transition-all shadow-xs cursor-pointer"
              >
                {isPaused ? "Resume" : "Pause"}
              </button>
              <button
                type="button"
                onClick={handleStopWorkflow}
                className="px-4 py-1 bg-[#1A2F25] hover:bg-[#2A4739] text-white font-sans text-xs font-medium rounded-full transition-all shadow-xs cursor-pointer"
              >
                Stop
              </button>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="w-full max-w-xl flex items-center gap-4">
          <div className="flex-1 bg-[#1A2F25]/10 h-2 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-[#E5A93C] to-[#E06D53] transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <span className="font-editorial text-xl text-[#1A2F25] shrink-0">
            {progressPercent} %
          </span>
        </div>
      </div>

      {/* Two Column Layout matching layout.png */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 my-4 min-h-[380px]">
        {/* Left Column: Timeline */}
        <div className="md:col-span-5 border-r-0 md:border-r border-[#1A2F25]/10 flex flex-col justify-start">
          {steps.length === 0 ? (
            <div className="py-16 px-4 text-center text-xs font-mono text-[#526359] border border-dashed border-[#1A2F25]/15 rounded-2xl flex flex-col items-center justify-center">
              <span className="text-xl mb-2">⚡</span>
              <p className="font-editorial text-lg text-[#1A2F25] mb-1">
                No active workflow data available
              </p>
              <p className="text-xs text-[#526359] mb-4">
                Initiate a business objective to stream real-time DAG steps.
              </p>
              <button
                type="button"
                onClick={onResetWorkflow}
                className="px-4 py-1.5 bg-[#E06D53] text-white text-xs font-sans rounded-full cursor-pointer hover:bg-[#CD5B42]"
              >
                Start Workflow &rarr;
              </button>
            </div>
          ) : (
            <StepTimeline
              steps={steps}
              selectedStepId={selectedStepId}
              onSelectStep={(id) => setSelectedStepId(id)}
            />
          )}
        </div>

        {/* Right Column: Step Detail */}
        <div className="md:col-span-7">
          {steps.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center p-8 text-center text-[#526359] border border-[#1A2F25]/10 rounded-2xl bg-white/40">
              <p className="font-editorial text-2xl text-[#1A2F25] mb-2">no data available (---)</p>
              <p className="font-sans text-xs text-[#526359] max-w-sm">
                Enter an objective in natural language to inspect live execution telemetry, model reasoning, and supervisory check-gates.
              </p>
            </div>
          ) : (
            <StepDetail
              step={selectedStep}
              emailDraft={emailDraft}
              calendarEvent={calendarEvent}
              sheetResult={sheetResult}
              onApproveStep={handleApproveStep}
              onRejectStep={handleRejectStep}
              onRetryStep={handleRetryStep}
              onSaveEdits={handleSaveEdits}
            />
          )}
        </div>
      </div>

      {/* Bottom Composer Bar */}
      <div className="w-full max-w-4xl mx-auto px-2 pt-4">
        <div className="relative flex items-center bg-white border border-[#E06D53] rounded-full shadow-[0_4px_24px_-6px_rgba(224,109,83,0.15)] p-2.5 pl-6">
          <div className="w-full font-editorial text-lg md:text-xl text-[#1A2F25] truncate select-none">
            {objective || "---"}
          </div>

          {/* Rotating spinner if active, or check if completed */}
          <div className="pr-2 shrink-0">
            {isRunning ? (
              <RadialDotsSpinner size={34} color="#E06D53" />
            ) : isCompleted ? (
              <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm">
                ✓
              </span>
            ) : (
              <span className="text-xs font-mono text-[#526359] px-2">---</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
