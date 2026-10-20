"use client";

import { WorkflowStep } from "./StepTimeline";
import { ApprovalCard, FailureCard, ReplanNotice } from "./InlineCards";

interface StepDetailProps {
  step: WorkflowStep | undefined;
  emailDraft?: {
    subject?: string;
    to?: string[];
    body?: string;
    meet_link?: string;
  };
  onApproveStep?: (stepId: string) => void;
  onRejectStep?: (stepId: string) => void;
  onRetryStep?: (stepId: string) => void;
  onSaveEdits?: (stepId: string, newBody: string) => void;
}

export default function StepDetail({
  step,
  emailDraft,
  onApproveStep,
  onRejectStep,
  onRetryStep,
  onSaveEdits,
}: StepDetailProps) {
  if (!step) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center text-[#526359]">
        <p className="font-editorial text-xl">Select a step from the timeline to view execution details</p>
      </div>
    );
  }

  const getStatusBadge = () => {
    switch (step.status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-mono rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            Completed ({step.duration || "instant"})
          </span>
        );
      case "running":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#E06D53]/10 text-[#E06D53] border border-[#E06D53]/25 text-xs font-mono rounded-full animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E06D53]"></span>
            Running
          </span>
        );
      case "waiting":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-[#E5A93C]/15 text-[#B8771A] border border-[#E5A93C]/30 text-xs font-mono rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E5A93C]"></span>
            Waiting for human approval
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-red-50 text-red-600 border border-red-200 text-xs font-mono rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
            Interrupted / Failed
          </span>
        );
      case "replanned":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-gray-100 text-[#526359] border border-gray-200 text-xs font-mono rounded-full">
            Re-planned
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-white text-[#526359] border border-[#1A2F25]/10 text-xs font-mono rounded-full">
            Queued
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/70 border border-[#1A2F25]/10 rounded-2xl p-5 md:p-6 backdrop-blur-md">
      {/* Top Header of Step */}
      <div className="pb-4 border-b border-[#1A2F25]/10 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h3 className="font-editorial text-2xl md:text-3xl text-[#1A2F25] tracking-tight">
            {step.number} · {step.title}
          </h3>
        </div>
        <div>{getStatusBadge()}</div>
      </div>

      {/* Interruption cards */}
      {step.status === "waiting" && (
        <ApprovalCard
          subject={emailDraft?.subject}
          to={emailDraft?.to}
          body={emailDraft?.body}
          meetLink={emailDraft?.meet_link}
          onApprove={() => onApproveStep?.(step.id)}
          onReject={() => onRejectStep?.(step.id)}
          onSaveEdits={(newBody) => onSaveEdits?.(step.id, newBody)}
        />
      )}

      {step.status === "failed" && (
        <FailureCard
          retryCount={step.retryCount || 1}
          maxRetries={2}
          onRetry={() => onRetryStep?.(step.id)}
        />
      )}

      {step.status === "replanned" && <ReplanNotice />}

      {/* Activity Section */}
      <div className="mt-5 flex-1 overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-editorial text-xl text-[#1A2F25]">Activity</h4>
          <span className="text-[11px] font-mono text-[#526359]">
            {step.activityLogs.length} events emitted
          </span>
        </div>

        {step.activityLogs.length === 0 ? (
          <div className="p-4 border border-dashed border-[#1A2F25]/10 rounded-lg text-center text-xs font-mono text-[#526359]">
            Awaiting step telemetry... (---)
          </div>
        ) : (
          <div className="space-y-2 border border-[#1A2F25]/8 bg-[#F8F6F2]/80 rounded-xl p-3.5 max-h-56 overflow-y-auto">
            {step.activityLogs.map((log, index) => (
              <div
                key={index}
                className="flex items-start gap-3 text-xs font-mono text-[#526359] leading-relaxed"
              >
                <span className="text-[#1A2F25]/60 shrink-0 select-none">
                  {log.time}
                </span>
                <span className="text-[#1A2F25] font-sans">{log.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Why / Agent Reasoning */}
        <div className="mt-5 pt-4 border-t border-[#1A2F25]/10">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-editorial text-xl text-[#1A2F25]">Why</span>
            <span className="text-[10px] font-mono uppercase bg-[#1A2F25]/5 text-[#526359] px-1.5 py-0.5 rounded">
              DETERMINISTIC_REASONING
            </span>
          </div>
          <p className="font-sans text-xs text-[#526359] leading-relaxed bg-[#F8F6F2]/60 p-3 rounded-lg border border-[#1A2F25]/8">
            {step.reasoning || "---"}
          </p>
        </div>
      </div>
    </div>
  );
}
