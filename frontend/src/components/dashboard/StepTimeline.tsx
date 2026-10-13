"use client";

export type StepStatus =
  | "completed"
  | "running"
  | "waiting"
  | "pending"
  | "failed"
  | "replanned";

export interface WorkflowStep {
  id: string;
  number: number;
  title: string;
  subtitle?: string;
  status: StepStatus;
  duration?: string;
  activityLogs: { time: string; message: string }[];
  reasoning: string;
  replacedBy?: string;
  retryCount?: number;
}

interface StepTimelineProps {
  steps: WorkflowStep[];
  selectedStepId: string;
  onSelectStep: (id: string) => void;
}

export default function StepTimeline({
  steps,
  selectedStepId,
  onSelectStep,
}: StepTimelineProps) {
  const renderStatusNode = (status: StepStatus) => {
    switch (status) {
      case "completed":
        return (
          <span className="w-5 h-5 flex items-center justify-center text-emerald-700 font-bold text-base shrink-0">
            ✓
          </span>
        );
      case "running":
        return (
          <span className="relative flex h-4 w-4 items-center justify-center shrink-0 my-0.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E06D53] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-[#E06D53]"></span>
          </span>
        );
      case "waiting":
        return (
          <span className="w-4 h-4 rounded-full border-2 border-[#E5A93C] flex items-center justify-center text-[#E5A93C] text-[10px] font-bold shrink-0">
            ⏸
          </span>
        );
      case "failed":
        return (
          <span className="w-4 h-4 rounded-full bg-[#CD5B42] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
            ✕
          </span>
        );
      case "replanned":
        return (
          <span className="w-4 h-4 rounded-full border border-dashed border-[#526359] flex items-center justify-center text-[#526359] text-[9px] shrink-0">
            ⟲
          </span>
        );
      case "pending":
      default:
        return (
          <span className="w-4 h-4 rounded-full border border-[#526359]/50 shrink-0 my-0.5"></span>
        );
    }
  };

  return (
    <div className="flex flex-col gap-3 py-2 pr-2 md:pr-4">
      {steps.map((step) => {
        const isSelected = step.id === selectedStepId;
        const isReplanned = step.status === "replanned";

        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onSelectStep(step.id)}
            className={`w-full text-left transition-all duration-150 p-3 rounded-xl border flex items-start gap-3.5 group cursor-pointer ${
              isSelected
                ? "bg-white/95 border-[#E06D53]/60 shadow-xs"
                : "bg-white/40 hover:bg-white/70 border-transparent hover:border-[#1A2F25]/10"
            }`}
          >
            {/* Status Icon */}
            <div className="pt-0.5">{renderStatusNode(step.status)}</div>

            {/* Step Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline justify-between gap-2">
                <span
                  className={`font-editorial text-lg md:text-xl tracking-tight leading-snug truncate ${
                    isReplanned
                      ? "line-through text-[#526359]/70"
                      : step.status === "pending"
                      ? "text-[#526359]/80"
                      : "text-[#1A2F25]"
                  } ${isSelected ? "text-[#1A2F25] font-normal" : ""}`}
                >
                  {step.title}
                </span>

                {step.status === "waiting" && (
                  <span className="text-[10px] font-mono uppercase bg-[#E5A93C]/15 text-[#B8771A] px-1.5 py-0.5 rounded shrink-0">
                    Needs approval
                  </span>
                )}
                {step.status === "running" && (
                  <span className="text-[10px] font-mono uppercase bg-[#E06D53]/15 text-[#E06D53] px-1.5 py-0.5 rounded shrink-0 animate-pulse">
                    Live
                  </span>
                )}
              </div>

              {step.subtitle && (
                <div
                  className={`text-xs font-sans mt-0.5 truncate ${
                    step.status === "completed"
                      ? "text-[#526359]"
                      : step.status === "running"
                      ? "text-[#E06D53] font-medium"
                      : "text-[#526359]/70"
                  }`}
                >
                  {step.subtitle}
                </div>
              )}

              {isReplanned && step.replacedBy && (
                <div className="text-[11px] font-mono text-[#526359] mt-1">
                  Replaced by: {step.replacedBy}
                </div>
              )}
            </div>

            {/* Right selected arrow hint */}
            {isSelected && (
              <span className="text-[#E06D53] text-sm shrink-0 self-center hidden sm:inline">
                ◀
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
