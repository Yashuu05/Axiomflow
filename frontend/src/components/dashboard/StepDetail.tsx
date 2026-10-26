"use client";

import { useState, useRef, useEffect } from "react";
import { WorkflowStep } from "./StepTimeline";
import { ApprovalCard, FailureCard, ReplanNotice } from "./InlineCards";

export interface DocsResult {
  document_id?: string;
  title?: string;
  document_url?: string;
  word_count?: number;
  operation?: string;
}

interface StepDetailProps {
  step: WorkflowStep | undefined;
  emailDraft?: {
    subject?: string;
    to?: string[];
    body?: string;
    meet_link?: string;
  };
  calendarEvent?: {
    event_id?: string;
    summary?: string;
    start_time?: string;
    end_time?: string;
    meet_link?: string;
    attendees?: string[];
  };
  sheetResult?: {
    spreadsheet_id?: string;
    title?: string;
    spreadsheet_url?: string;
    row_count?: number;
    headers?: string[];
  };
  docsResult?: DocsResult;
  onApproveStep?: (stepId: string) => void;
  onRejectStep?: (stepId: string) => void;
  onRetryStep?: (stepId: string) => void;
  onSaveEdits?: (stepId: string, newBody: string) => void;
}

export default function StepDetail({
  step,
  emailDraft,
  calendarEvent,
  sheetResult,
  docsResult,
  onApproveStep,
  onRejectStep,
  onRetryStep,
  onSaveEdits,
}: StepDetailProps) {
  const [autoScroll, setAutoScroll] = useState(true);
  const [copiedLogs, setCopiedLogs] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [step?.activityLogs, autoScroll]);

  if (!step) {
    return (
      <div className="h-full flex items-center justify-center p-8 text-center text-[#526359]">
        <p className="font-editorial text-xl">Select a step from the timeline to view execution details</p>
      </div>
    );
  }

  // Derive Google Docs result from props or fallback to step logs
  const inferredDoc: DocsResult | null = (() => {
    if (docsResult && (docsResult.title || docsResult.document_url || docsResult.document_id)) {
      return docsResult;
    }
    const urlLog = step.activityLogs.find((l) => l.message.includes("Document URL:"));
    const titleLog = step.activityLogs.find((l) => l.message.includes("Google Doc processed:"));
    if (urlLog || titleLog) {
      const rawUrl = urlLog?.message.replace("Document URL:", "").trim();
      const titleMatch = titleLog?.message.match(/Google Doc processed: '([^']+)'/);
      return {
        title: titleMatch ? titleMatch[1] : "Generated Google Document",
        document_url: rawUrl,
        document_id: rawUrl?.includes("/d/") ? rawUrl.split("/d/")[1]?.split("/")[0] : undefined,
      };
    }
    return null;
  })();

  const handleCopyLogs = () => {
    if (!step?.activityLogs?.length) return;
    const text = step.activityLogs.map((l) => `[${l.time}] ${l.message}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  const getStatusBadge = () => {
    switch (step.status) {
      case "completed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-mono rounded-full font-medium shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            Completed ({step.duration || "instant"})
          </span>
        );
      case "running":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E06D53]/10 text-[#CD5B42] border border-[#E06D53]/30 text-xs font-mono rounded-full font-medium animate-pulse shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#E06D53]"></span>
            Live Processing
          </span>
        );
      case "waiting":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#E5A93C]/15 text-[#B8771A] border border-[#E5A93C]/35 text-xs font-mono rounded-full font-medium shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-[#E5A93C] animate-ping"></span>
            Supervisory Review Required
          </span>
        );
      case "failed":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-50 text-red-600 border border-red-200 text-xs font-mono rounded-full font-medium shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            Execution Interrupted
          </span>
        );
      case "replanned":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 text-[#526359] border border-gray-200 text-xs font-mono rounded-full">
            Pipeline Adapted (Re-planned)
          </span>
        );
      case "pending":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white text-[#526359] border border-[#1A2F25]/15 text-xs font-mono rounded-full">
            Queued
          </span>
        );
    }
  };

  const hasArtifacts = Boolean(calendarEvent || sheetResult || inferredDoc);

  return (
    <div className="flex flex-col h-full bg-white/85 border border-[#1A2F25]/10 rounded-2xl p-5 md:p-6 backdrop-blur-md shadow-sm overflow-hidden">
      {/* Top Header of Step */}
      <div className="pb-3 border-b border-[#1A2F25]/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-[#526359] block">
            Step {step.number} of Active DAG
          </span>
          <h3 className="font-editorial text-2xl md:text-3xl text-[#1A2F25] tracking-tight">
            {step.title}
          </h3>
        </div>
        <div>{getStatusBadge()}</div>
      </div>

      {/* Prominent Deterministic Reasoning Callout — Moved above logs for instant explainability */}
      <div className="my-3 p-3.5 bg-amber-50/70 border border-amber-200/90 rounded-xl shrink-0">
        <div className="flex items-center gap-2 mb-1.5">
          <svg className="w-4 h-4 text-amber-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span className="font-editorial text-base text-[#1A2F25] font-semibold">
            Deterministic Reasoning & Intent
          </span>
          <span className="text-[9px] font-mono uppercase bg-amber-200/80 text-amber-900 px-1.5 py-0.5 rounded font-bold ml-auto">
            EXPLAINABILITY
          </span>
        </div>
        <p className="font-sans text-xs text-[#1A2F25]/85 leading-relaxed">
          {step.reasoning || "Evaluating context and enforcing zero-hallucination governance rules."}
        </p>
      </div>

      {/* Interruption cards */}
      {step.status === "waiting" && (
        <div className="shrink-0">
          <ApprovalCard
            subject={emailDraft?.subject}
            to={emailDraft?.to}
            body={emailDraft?.body}
            meetLink={emailDraft?.meet_link || calendarEvent?.meet_link}
            onApprove={() => onApproveStep?.(step.id)}
            onReject={() => onRejectStep?.(step.id)}
            onSaveEdits={(newBody) => onSaveEdits?.(step.id, newBody)}
          />
        </div>
      )}

      {step.status === "failed" && (
        <div className="shrink-0">
          <FailureCard
            retryCount={step.retryCount || 1}
            maxRetries={2}
            onRetry={() => onRetryStep?.(step.id)}
          />
        </div>
      )}

      {step.status === "replanned" && (
        <div className="shrink-0">
          <ReplanNotice />
        </div>
      )}

      {/* Generated Artifacts Section — Full Google Workspace Suite (Calendar, Sheets, Docs) */}
      {hasArtifacts && (
        <div className="my-2.5 p-3.5 border border-[#1A2F25]/12 bg-white/95 rounded-xl shadow-xs shrink-0">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#1A2F25]/10">
            <div className="flex items-center gap-2">
              <span className="font-editorial text-base text-[#1A2F25]">Verified Artifacts</span>
              <span className="text-[10px] font-mono text-[#526359]">
                (Google Workspace FastMCP)
              </span>
            </div>
            <span className="text-[10px] font-mono uppercase bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-semibold">
              VERIFIED_RESOURCE
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {/* Google Docs Card */}
            {inferredDoc && (
              <div className="border border-blue-200 bg-blue-50/70 rounded-xl p-3 text-xs font-mono flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-blue-900 font-semibold mb-1">
                    <svg className="w-4 h-4 text-blue-600 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                    </svg>
                    <span className="truncate">{inferredDoc.title || "Google Document"}</span>
                  </div>
                  <div className="text-[11px] text-[#526359] mb-1">
                    <strong>Type:</strong> Google Docs (.docx)
                  </div>
                  {inferredDoc.document_id && (
                    <div className="text-[10px] text-[#526359]/90 truncate">
                      <strong>ID:</strong> {inferredDoc.document_id.slice(0, 16)}...
                    </div>
                  )}
                </div>
                {inferredDoc.document_url && (
                  <div className="mt-2.5 pt-2 border-t border-blue-200/80">
                    <a
                      href={inferredDoc.document_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-between w-full px-3 py-1 bg-blue-700 hover:bg-blue-800 text-white rounded-full text-[11px] font-sans font-medium transition-colors cursor-pointer shadow-xs"
                    >
                      <span>Open in Google Docs</span>
                      <span>↗</span>
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Google Calendar Card */}
            {calendarEvent && (
              <div className="border border-emerald-200 bg-emerald-50/70 rounded-xl p-3 text-xs font-mono flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-emerald-900 font-semibold mb-1">
                    <span className="text-sm">📅</span>
                    <span className="truncate">{calendarEvent.summary || "Google Calendar Event"}</span>
                  </div>
                  <div className="text-[11px] text-[#526359] mb-1">
                    <strong>ID:</strong> {calendarEvent.event_id?.slice(0, 14)}...
                  </div>
                </div>
                {calendarEvent.meet_link && (
                  <div className="mt-2.5 pt-2 border-t border-emerald-200/80">
                    <a
                      href={calendarEvent.meet_link}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-between w-full px-3 py-1 bg-[#E06D53] hover:bg-[#CD5B42] text-white rounded-full text-[11px] font-sans font-medium transition-colors cursor-pointer shadow-xs"
                    >
                      <span>Join Google Meet</span>
                      <span>&rarr;</span>
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Google Sheets Card */}
            {sheetResult && (
              <div className="border border-teal-200 bg-teal-50/70 rounded-xl p-3 text-xs font-mono flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1.5 text-teal-900 font-semibold mb-1">
                    <span className="text-sm">📊</span>
                    <span className="truncate">{sheetResult.title || "Google Spreadsheet"}</span>
                  </div>
                  <div className="text-[11px] text-[#526359] mb-1">
                    <strong>Records:</strong> {sheetResult.row_count || 0} rows synced
                  </div>
                </div>
                {sheetResult.spreadsheet_url && (
                  <div className="mt-2.5 pt-2 border-t border-teal-200/80">
                    <a
                      href={sheetResult.spreadsheet_url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-between w-full px-3 py-1 bg-[#1A2F25] hover:bg-[#2A4739] text-white rounded-full text-[11px] font-sans font-medium transition-colors cursor-pointer shadow-xs"
                    >
                      <span>Open Spreadsheet</span>
                      <span>&rarr;</span>
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Terminal-Grade Streaming Activity Console */}
      <div className="mt-2 flex-1 flex flex-col min-h-0 overflow-hidden">
        <div className="flex items-center justify-between mb-2 shrink-0">
          <div className="flex items-center gap-2">
            <h4 className="font-editorial text-xl text-[#1A2F25]">Execution Telemetry</h4>
            <span className="text-[11px] font-mono text-[#526359]">
              ({step.activityLogs.length} events)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAutoScroll(!autoScroll)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                autoScroll
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-gray-100 text-gray-600 border border-gray-300"
              }`}
              title="Toggle automatic scrolling to latest log output"
            >
              Auto-scroll: {autoScroll ? "ON" : "OFF"}
            </button>

            <button
              type="button"
              onClick={handleCopyLogs}
              disabled={step.activityLogs.length === 0}
              className="px-2.5 py-0.5 bg-white hover:bg-[#F8F6F2] border border-[#1A2F25]/20 text-[#1A2F25] text-[10px] font-mono rounded transition-colors cursor-pointer disabled:opacity-40"
              title="Copy all step logs to clipboard"
            >
              {copiedLogs ? "Copied ✓" : "Copy Logs"}
            </button>
          </div>
        </div>

        {step.activityLogs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 border border-dashed border-[#1A2F25]/12 rounded-xl text-center text-xs font-mono text-[#526359] bg-[#F8F6F2]/40">
            <span className="text-xl mb-1 opacity-60">⏳</span>
            <span>Awaiting step telemetry events from FastMCP...</span>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 border border-[#1A2F25]/10 bg-[#1A2F25]/[0.03] rounded-xl p-3.5 font-mono text-xs shadow-inner">
            {step.activityLogs.map((log, index) => (
              <div
                key={index}
                className="flex items-start gap-2.5 leading-relaxed hover:bg-white/50 p-1 rounded transition-colors"
              >
                <span className="text-[#526359] select-none text-[11px] pt-0.5 shrink-0">
                  {log.time}
                </span>
                <span className="text-[#1A2F25] font-sans text-xs break-words">
                  {log.message}
                </span>
              </div>
            ))}
            <div ref={logsEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}
