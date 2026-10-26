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
          <span className="w-6 h-6 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs z-10 bg-white">
            <svg className="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </span>
        );
      case "running":
        return (
          <span className="relative flex h-6 w-6 items-center justify-center shrink-0 z-10">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E06D53] opacity-40"></span>
            <span className="relative inline-flex rounded-full h-5 w-5 bg-[#E06D53] items-center justify-center text-white shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-white"></span>
            </span>
          </span>
        );
      case "waiting":
        return (
          <span className="w-6 h-6 rounded-full bg-amber-100 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0 shadow-2xs z-10 bg-white">
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
              <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
            </svg>
          </span>
        );
      case "failed":
        return (
          <span className="w-6 h-6 rounded-full bg-red-100 border border-red-300 text-red-700 flex items-center justify-center shrink-0 shadow-2xs z-10 bg-white">
            <svg className="w-3 h-3 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </span>
        );
      case "replanned":
        return (
          <span className="w-6 h-6 rounded-full bg-slate-100 border border-slate-300 text-slate-700 flex items-center justify-center shrink-0 z-10 bg-white">
            <svg className="w-3.5 h-3.5 fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a5 5 0 015 5v2M3 10l5-5m-5 5l5 5" />
            </svg>
          </span>
        );
      case "pending":
      default:
        return (
          <span className="w-6 h-6 rounded-full border-2 border-dashed border-[#1A2F25]/20 flex items-center justify-center shrink-0 z-10 bg-white">
            <span className="w-1.5 h-1.5 rounded-full bg-[#1A2F25]/30"></span>
          </span>
        );
    }
  };

  if (!steps || steps.length === 0) {
    return (
      <div className="py-12 px-4 text-center text-xs font-mono text-[#526359] border border-dashed border-[#1A2F25]/15 rounded-xl">
        No workflow steps available (---)
      </div>
    );
  }

  return (
    <div className="relative flex flex-col py-1 pr-2 md:pr-4">
      {steps.map((step, idx) => {
        const isSelected = step.id === selectedStepId;
        const isReplanned = step.status === "replanned";
        const isLast = idx === steps.length - 1;

        return (
          <div key={step.id} className="relative flex items-stretch">
            {/* Continuous Vertical SVG Thread Line connecting DAG nodes */}
            {!isLast && (
              <div
                className={`absolute left-3 top-7 bottom-0 w-0.5 -translate-x-1/2 z-0 ${
                  step.status === "completed"
                    ? "bg-emerald-500"
                    : step.status === "running"
                    ? "bg-gradient-to-b from-[#E06D53] to-[#1A2F25]/10 animate-pulse"
                    : "bg-[#1A2F25]/10"
                }`}
              />
            )}

            <button
              type="button"
              onClick={() => onSelectStep(step.id)}
              className={`w-full text-left transition-all duration-150 p-3 mb-2.5 rounded-xl border flex items-start gap-3 group cursor-pointer relative z-10 ${
                isSelected
                  ? "bg-white border-l-4 border-l-[#E06D53] border-t border-r border-b border-[#1A2F25]/12 shadow-sm"
                  : "bg-white/40 hover:bg-white/75 border-[#1A2F25]/8 hover:border-[#1A2F25]/15"
              }`}
            >
              {/* Status Icon */}
              <div className="pt-0.5 shrink-0">{renderStatusNode(step.status)}</div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-1.5">
                  <span
                    className={`font-editorial text-base sm:text-lg tracking-tight leading-snug line-clamp-2 ${
                      isReplanned
                        ? "line-through text-[#526359]/70"
                        : step.status === "pending"
                        ? "text-[#526359]/80"
                        : "text-[#1A2F25]"
                    } ${isSelected ? "text-[#1A2F25] font-semibold" : ""}`}
                  >
                    {step.title}
                  </span>

                  {isSelected && (
                    <span className="text-[9px] font-mono uppercase bg-[#E06D53]/10 text-[#CD5B42] px-1.5 py-0.5 rounded font-bold shrink-0">
                      Active
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between mt-1 text-xs font-sans">
                  <span
                    className={`line-clamp-1 ${
                      step.status === "completed"
                        ? "text-emerald-700 font-medium"
                        : step.status === "running"
                        ? "text-[#E06D53] font-semibold animate-pulse"
                        : step.status === "waiting"
                        ? "text-[#B8771A] font-medium"
                        : "text-[#526359]/70"
                    }`}
                  >
                    {step.subtitle || `Step ${step.number}`}
                  </span>

                  {step.duration && step.duration !== "---" && (
                    <span className="text-[10px] font-mono text-[#526359] shrink-0 ml-2">
                      {step.duration}
                    </span>
                  )}
                </div>
              </div>
            </button>
          </div>
        );
      })}
    </div>
  );
}
