"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import StepTimeline, { WorkflowStep } from "./StepTimeline";
import StepDetail, { DocsResult } from "./StepDetail";

interface EmailDraft {
  subject?: string;
  to?: string[];
  body?: string;
  meet_link?: string;
}

interface CalendarEvent {
  event_id?: string;
  summary?: string;
  start_time?: string;
  end_time?: string;
  meet_link?: string;
  attendees?: string[];
}

interface SheetResult {
  spreadsheet_id?: string;
  title?: string;
  spreadsheet_url?: string;
  row_count?: number;
  headers?: string[];
}

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
  const [emailDraft, setEmailDraft] = useState<EmailDraft | null>(null);
  const [calendarEvent, setCalendarEvent] = useState<CalendarEvent | null>(null);
  const [sheetResult, setSheetResult] = useState<SheetResult | null>(null);
  const [docsResult, setDocsResult] = useState<DocsResult | null>(null);
  const [objective, setObjective] = useState<string>(initialObjective || "---");

  // Safety confirmation for stopping a running workflow
  const [confirmStop, setConfirmStop] = useState<boolean>(false);
  const stopTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Monotonic, drift-free execution stopwatch hook
  useEffect(() => {
    const isCurrentlyActive =
      (workflowStatus === "running" ||
        workflowStatus === "waiting_approval" ||
        workflowStatus === "initializing") &&
      !isPaused &&
      !!taskId;

    if (isCurrentlyActive) {
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now() - elapsedSeconds * 1000;
      }
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const monotonic = Math.max(0, Math.floor((Date.now() - startTimeRef.current) / 1000));
          setElapsedSeconds(monotonic);
        }
      }, 500);
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
  }, [workflowStatus, isPaused, taskId, elapsedSeconds]);

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
          // If current selection is waiting or running, ensure it stays in focus
          const waiting = data.steps.find((s: WorkflowStep) => s.status === "waiting");
          const running = data.steps.find((s: WorkflowStep) => s.status === "running");
          const target = waiting || running;
          if (target) {
            setSelectedStepId((prev) => {
              const stillExists = data.steps.some((s: WorkflowStep) => s.id === prev);
              return stillExists ? prev : target.id;
            });
          }
        }

        if (typeof data.elapsed_seconds === "number") {
          // If terminal status, freeze directly to server total
          if (
            data.status === "completed" ||
            data.status === "failed" ||
            data.status === "rejected"
          ) {
            setElapsedSeconds(data.elapsed_seconds);
            startTimeRef.current = null;
          } else {
            // While running, only perform drift correction if divergence exceeds 3s
            const currentComputed = startTimeRef.current
              ? Math.floor((Date.now() - startTimeRef.current) / 1000)
              : 0;
            if (!startTimeRef.current || Math.abs(currentComputed - data.elapsed_seconds) > 3) {
              startTimeRef.current = Date.now() - data.elapsed_seconds * 1000;
              setElapsedSeconds(data.elapsed_seconds);
            }
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
        if (data.docs_result) {
          setDocsResult(data.docs_result);
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
    if (!taskId) return;

    // Initial asynchronous fetch
    const initTimer = setTimeout(() => {
      pollStatus();
    }, 0);

    // Set polling interval every 1.5 seconds while active
    pollIntervalRef.current = setInterval(() => {
      pollStatus();
    }, 1500);

    return () => {
      clearTimeout(initTimer);
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

  // Waiting step for supervisory banner
  const waitingStep = steps.find((s) => s.status === "waiting");

  // Handle Human Approval
  const handleApproveStep = async () => {
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

  const handleRejectStep = async () => {
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

  const handleSaveEdits = async (_stepId: string, newBody: string) => {
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

  const handleRetryStep = async () => {
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

  const onStopButtonClick = () => {
    if (!confirmStop) {
      setConfirmStop(true);
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = setTimeout(() => {
        setConfirmStop(false);
      }, 3500);
    } else {
      setConfirmStop(false);
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
      handleStopWorkflow();
    }
  };

  const isCompleted = workflowStatus === "completed";
  const isFailed = workflowStatus === "failed" || workflowStatus === "rejected";
  const isWaiting = workflowStatus === "waiting_approval" || !!waitingStep;
  const isRunning = workflowStatus === "running";

  return (
    <div className="flex-1 flex flex-col justify-between py-1 md:py-2 h-full overflow-hidden">
      {/* Top Objective Bar */}
      <div className="pb-3 border-b border-[#E06D53]/25 shrink-0">
        <div className="flex items-center justify-between gap-4">
          <div className="font-editorial text-2xl sm:text-3xl text-[#1A2F25] leading-tight flex items-baseline gap-2 truncate">
            <span className="text-[#E06D53] shrink-0 font-normal">Objective:</span>
            <span className="truncate font-normal">{objective || "---"}</span>
          </div>

          <button
            type="button"
            onClick={onResetWorkflow}
            className="text-xs font-mono text-[#526359] hover:text-[#E06D53] border border-[#1A2F25]/15 px-3 py-1.5 rounded-full bg-white hover:bg-white/80 transition-colors shrink-0 cursor-pointer shadow-2xs"
          >
            + New Objective
          </button>
        </div>
      </div>

      {/* Persistent Sticky Supervisory Hold Banner — Visible regardless of active tab/step */}
      {isWaiting && (
        <div className="mt-3 px-4 py-2.5 bg-amber-500/10 border border-[#E5A93C] rounded-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E5A93C] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#E5A93C]"></span>
            </span>
            <span className="text-xs sm:text-sm font-sans font-semibold text-[#1A2F25]">
              Supervisory Sign-Off Required: Outgoing communication waiting for review in Step {waitingStep?.number || 4}.
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              if (waitingStep) setSelectedStepId(waitingStep.id);
            }}
            className="px-3.5 py-1 bg-[#E5A93C] hover:bg-[#D4982E] text-white text-xs font-sans font-medium rounded-full transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span>Review Draft Now</span>
            <span>&rarr;</span>
          </button>
        </div>
      )}

      {/* Status Bar & Controls */}
      <div className="my-3 flex flex-col items-center justify-center gap-2.5 shrink-0">
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
                className={`px-3.5 py-1 text-white font-sans text-xs font-medium rounded-full transition-all shadow-xs cursor-pointer flex items-center gap-1.5 ${
                  isPaused ? "bg-amber-600 hover:bg-amber-700 animate-pulse" : "bg-[#CD5B42] hover:bg-[#E06D53]"
                }`}
              >
                <span>{isPaused ? "▶ Resume" : "⏸ Pause"}</span>
              </button>

              <button
                type="button"
                onClick={onStopButtonClick}
                className={`px-3.5 py-1 text-xs font-sans font-medium rounded-full transition-all shadow-xs cursor-pointer ${
                  confirmStop
                    ? "bg-red-600 hover:bg-red-700 text-white animate-bounce"
                    : "bg-[#1A2F25] hover:bg-[#2A4739] text-white"
                }`}
                title={confirmStop ? "Click again to confirm immediate abort" : "Stop active workflow"}
              >
                {confirmStop ? "Confirm Abort?" : "Stop"}
              </button>
            </div>
          )}
        </div>

        {/* Milestone-Segmented Progress Bar */}
        <div className="w-full max-w-xl flex flex-col gap-1">
          <div className="flex items-center justify-between text-[11px] font-mono text-[#526359] px-0.5">
            <span>
              Step {steps.length > 0 ? Math.min(currentRunningStepIndex + 1, steps.length) : 0} of {steps.length || 6}
            </span>
            <span className="font-semibold text-[#1A2F25]">{progressPercent}% Complete</span>
          </div>
          <div className="w-full bg-[#1A2F25]/10 h-2.5 rounded-full overflow-hidden relative">
            <div
              className="h-full bg-gradient-to-r from-[#E5A93C] via-[#E06D53] to-[#CD5B42] transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
            {/* Discrete step milestone tick marks */}
            {steps.length > 1 && (
              <div className="absolute inset-0 flex justify-between px-1 pointer-events-none">
                {steps.map((_, i) => (
                  <span
                    key={i}
                    className="w-0.5 h-full bg-white/50"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Two Column Layout matching layout.png */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-5 my-2 min-h-0 overflow-hidden">
        {/* Left Column: Timeline */}
        <div className="md:col-span-5 border-r-0 md:border-r border-[#1A2F25]/10 flex flex-col justify-start overflow-y-auto pr-1">
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
        <div className="md:col-span-7 flex flex-col min-h-0 overflow-hidden">
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
              emailDraft={emailDraft || undefined}
              calendarEvent={calendarEvent || undefined}
              sheetResult={sheetResult || undefined}
              docsResult={docsResult || undefined}
              onApproveStep={handleApproveStep}
              onRejectStep={handleRejectStep}
              onRetryStep={handleRetryStep}
              onSaveEdits={handleSaveEdits}
            />
          )}
        </div>
      </div>
    </div>
  );
}
