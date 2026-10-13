"use client";

import { useState, useEffect } from "react";
import StepTimeline, { WorkflowStep } from "./StepTimeline";
import StepDetail from "./StepDetail";
import RadialDotsSpinner from "./RadialDotsSpinner";

interface WorkflowRunningViewProps {
  objective: string;
  onResetWorkflow: () => void;
}

const INITIAL_STEPS: WorkflowStep[] = [
  {
    id: "s1",
    number: 1,
    title: "Understand Objective",
    subtitle: "plan created · 4s",
    status: "completed",
    duration: "4s",
    activityLogs: [
      { time: "10:41:40", message: "Parsed objective query via Deterministic Intent Parser" },
      { time: "10:41:42", message: "Identified target entities: [Finance Team, Calendar, Email]" },
      { time: "10:41:44", message: "Generated 6-node DAG execution blueprint with verification gates" },
    ],
    reasoning: "Decomposing natural language prompt into atomic, reversible execution phases with human check-gates.",
  },
  {
    id: "s2",
    number: 2,
    title: "Load finance team list",
    subtitle: "2 contacts · 1.2s",
    status: "completed",
    duration: "1.2s",
    activityLogs: [
      { time: "10:41:45", message: "Connected to internal directory registry (SQL: SELECT * FROM team WHERE dept='finance')" },
      { time: "10:41:46", message: "Queried 2 confirmed members: Sarah Lin (Lead), Marcus Chen (Controller)" },
      { time: "10:41:46", message: "Validated email syntax and calendar permission tokens" },
    ],
    reasoning: "Acquiring verified participant roster prior to generating agenda invites.",
  },
  {
    id: "s3",
    number: 3,
    title: "Draft emails",
    subtitle: "18 of 42 drafted",
    status: "running",
    duration: "live",
    activityLogs: [
      { time: "10:42:03", message: "Read meeting template: revenue_sync_v2.mustache" },
      { time: "10:42:05", message: "Drafted 18 of 42 (Personalizing recipient tokens)" },
      { time: "10:42:11", message: "Embedded calendar payload for 20/10/2026 @ 10:00 AM IST" },
      { time: "10:42:16", message: "Attached Q3 variance summary sheet (confidential_variance.pdf)" },
    ],
    reasoning: "Personalizing each email with the recipient's role and synchronizing calendar availability.",
  },
  {
    id: "s4",
    number: 4,
    title: "Human approval",
    subtitle: "Needs your approval",
    status: "waiting",
    activityLogs: [
      { time: "10:42:20", message: "Dispatched payload to Human-in-the-Loop Supervisory Gateway" },
      { time: "10:42:21", message: "Paused automated dispatch pending supervisor confirmation (FR-14)" },
    ],
    reasoning: "Statutory outbound emails require manual sign-off to ensure 100% verification and prevent unauthorized dispatches.",
  },
  {
    id: "s5",
    number: 5,
    title: "Send emails",
    subtitle: "Pending",
    status: "pending",
    activityLogs: [],
    reasoning: "Queues SMTP dispatch via AWS SES once supervisory clearance is recorded.",
  },
  {
    id: "s6",
    number: 6,
    title: "Log and confirm",
    subtitle: "Pending",
    status: "pending",
    activityLogs: [],
    reasoning: "Appends deterministic cryptographic hash to audit trail and writes task state to MySQL axiomflow_db.",
  },
];

export default function WorkflowRunningView({
  objective,
  onResetWorkflow,
}: WorkflowRunningViewProps) {
  const [steps, setSteps] = useState<WorkflowStep[]>(INITIAL_STEPS);
  const [selectedStepId, setSelectedStepId] = useState<string>("s3");
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(102); // 1m 42s initially
  const [currentRunningStepIndex, setCurrentRunningStepIndex] = useState<number>(2); // 0-indexed, s3 is index 2

  // Live timer tick
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused]);

  // Format seconds to "1m 42s"
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}m ${remainder < 10 ? "0" : ""}${remainder}s`;
  };

  // Selected step object
  const selectedStep = steps.find((s) => s.id === selectedStepId);

  // Calculate overall progress percentage
  const completedCount = steps.filter((s) => s.status === "completed").length;
  const runningBonus = steps.some((s) => s.status === "running") ? 0.5 : 0;
  const progressPercent = Math.min(
    100,
    Math.round(((completedCount + runningBonus) / steps.length) * 100)
  );

  // Handle simulation advance
  const handleAdvanceStep = () => {
    setSteps((prevSteps) => {
      const next = [...prevSteps];
      if (currentRunningStepIndex < next.length) {
        // Mark current running as completed
        next[currentRunningStepIndex] = {
          ...next[currentRunningStepIndex],
          status: "completed",
          subtitle: "Completed successfully",
        };

        const nextIndex = currentRunningStepIndex + 1;
        if (nextIndex < next.length) {
          setCurrentRunningStepIndex(nextIndex);
          setSelectedStepId(next[nextIndex].id);

          if (next[nextIndex].id === "s4") {
            next[nextIndex] = {
              ...next[nextIndex],
              status: "waiting",
              subtitle: "Needs your approval",
            };
          } else {
            next[nextIndex] = {
              ...next[nextIndex],
              status: "running",
              subtitle: "In progress...",
              activityLogs: [
                {
                  time: new Date().toLocaleTimeString(),
                  message: `Initiated ${next[nextIndex].title}`,
                },
              ],
            };
          }
        }
      }
      return next;
    });
  };

  // Handle Human Approval
  const handleApproveStep = (stepId: string) => {
    setSteps((prev) =>
      prev.map((step) => {
        if (step.id === stepId) {
          return {
            ...step,
            status: "completed",
            subtitle: "Approved by administrator",
            activityLogs: [
              ...step.activityLogs,
              {
                time: new Date().toLocaleTimeString(),
                message: "Human supervisor authorized dispatch via cryptographic signature",
              },
            ],
          };
        }
        return step;
      })
    );

    // Advance to step 5 (Send emails)
    setTimeout(() => {
      setSteps((prev) =>
        prev.map((step) => {
          if (step.id === "s5") {
            return {
              ...step,
              status: "running",
              subtitle: "Transmitting 2 emails via SES...",
              activityLogs: [
                {
                  time: new Date().toLocaleTimeString(),
                  message: "Connecting to secure SMTP endpoint (TLS 1.3)",
                },
                {
                  time: new Date().toLocaleTimeString(),
                  message: "Queued message 1 of 2: finance.lead@axiomflow.internal",
                },
              ],
            };
          }
          return step;
        })
      );
      setSelectedStepId("s5");
      setCurrentRunningStepIndex(4);
    }, 600);
  };

  const handleRejectStep = (stepId: string) => {
    setSteps((prev) =>
      prev.map((step) => {
        if (step.id === stepId) {
          return {
            ...step,
            status: "failed",
            subtitle: "Rejected by human supervisor",
            activityLogs: [
              ...step.activityLogs,
              {
                time: new Date().toLocaleTimeString(),
                message: "Supervisor rejected draft. Automated workflow halted safely.",
              },
            ],
          };
        }
        return step;
      })
    );
  };

  const handleRetryStep = (stepId: string) => {
    setSteps((prev) =>
      prev.map((step) => {
        if (step.id === stepId) {
          return {
            ...step,
            status: "running",
            subtitle: "Retrying step...",
            retryCount: (step.retryCount || 1) + 1,
            activityLogs: [
              ...step.activityLogs,
              {
                time: new Date().toLocaleTimeString(),
                message: "Retrying step with exponential backoff...",
              },
            ],
          };
        }
        return step;
      })
    );
  };

  return (
    <div className="flex-1 flex flex-col justify-between py-2 md:py-4">
      {/* Top Objective Bar matching running_agent_workflow.png */}
      <div className="pb-4 border-b border-[#E06D53]/30">
        <div className="flex items-center justify-between gap-4">
          <div className="font-editorial text-2xl sm:text-3xl text-[#1A2F25] leading-tight">
            <span className="text-[#E06D53] mr-2">Objective:</span>
            <span>{objective}</span>
          </div>

          <button
            type="button"
            onClick={onResetWorkflow}
            className="text-xs font-mono text-[#526359] hover:text-[#E06D53] border border-[#1A2F25]/15 px-3 py-1.5 rounded-full bg-white hover:bg-white/80 transition-colors shrink-0 hidden sm:inline-block"
          >
            + New Objective
          </button>
        </div>
      </div>

      {/* Status Bar & Controls matching running_agent_workflow.png */}
      <div className="my-5 flex flex-col items-center justify-center gap-3">
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm md:text-base font-editorial text-[#1A2F25]">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3.5 w-3.5 items-center justify-center">
              {!isPaused && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E06D53] opacity-75"></span>
              )}
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#E06D53]"></span>
            </span>
            <span className="text-xl md:text-2xl text-[#1A2F25]">
              {isPaused ? "Paused" : "Running"} Step {currentRunningStepIndex + 1} of{" "}
              {steps.length} · {formatTime(elapsedSeconds)}
            </span>
          </div>

          <div className="flex items-center gap-2 ml-2">
            <button
              type="button"
              onClick={() => setIsPaused(!isPaused)}
              className="px-4 py-1 bg-[#CD5B42] hover:bg-[#E06D53] text-white font-sans text-xs font-medium rounded-full transition-all shadow-xs cursor-pointer"
            >
              {isPaused ? "Resume" : "Pause"}
            </button>
            <button
              type="button"
              onClick={onResetWorkflow}
              className="px-4 py-1 bg-[#CD5B42] hover:bg-[#E06D53] text-white font-sans text-xs font-medium rounded-full transition-all shadow-xs cursor-pointer"
            >
              Stop
            </button>
            <button
              type="button"
              onClick={handleAdvanceStep}
              title="Fast-forward simulation to next step"
              className="px-3 py-1 border border-[#E06D53]/40 bg-white hover:bg-[#F8F6F2] text-[#CD5B42] font-mono text-xs rounded-full transition-colors hidden md:inline-block"
            >
              Next Step &rarr;
            </button>
          </div>
        </div>

        {/* Progress Bar matching mockup */}
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

      {/* Two Column Layout matching running_agent_workflow.png */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 my-4 min-h-[380px]">
        {/* Left Column: Timeline */}
        <div className="md:col-span-5 border-r-0 md:border-r border-[#1A2F25]/10 flex flex-col justify-start">
          <StepTimeline
            steps={steps}
            selectedStepId={selectedStepId}
            onSelectStep={(id) => setSelectedStepId(id)}
          />
        </div>

        {/* Right Column: Step Detail */}
        <div className="md:col-span-7">
          <StepDetail
            step={selectedStep}
            onApproveStep={handleApproveStep}
            onRejectStep={handleRejectStep}
            onRetryStep={handleRetryStep}
          />
        </div>
      </div>

      {/* Bottom Composer Bar matching running_agent_workflow.png */}
      <div className="w-full max-w-4xl mx-auto px-2 pt-4">
        <div className="relative flex items-center bg-white border border-[#E06D53] rounded-full shadow-[0_4px_24px_-6px_rgba(224,109,83,0.15)] p-2.5 pl-6">
          <div className="w-full font-editorial text-lg md:text-xl text-[#1A2F25] truncate select-none">
            {objective}
          </div>

          {/* Rotating 8-dot spinner matching running_agent_workflow.png */}
          <div className="pr-2 shrink-0">
            <RadialDotsSpinner size={34} color="#E06D53" />
          </div>
        </div>
      </div>
    </div>
  );
}
