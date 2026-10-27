"use client";

import { useState } from "react";

interface ApprovalCardProps {
  subject?: string;
  to?: string[];
  body?: string;
  meetLink?: string;
  onApprove?: () => void;
  onReject?: () => void;
  onEdit?: () => void;
  onSaveEdits?: (newBody: string, newSubject?: string, newTo?: string) => void;
  approved?: boolean;
}

export function ApprovalCard({
  subject,
  to,
  body,
  meetLink,
  onApprove,
  onReject,
  onEdit,
  onSaveEdits,
  approved = false,
}: ApprovalCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedBody, setEditedBody] = useState(body || "");
  const [editedSubject, setEditedSubject] = useState(subject || "");
  const [editedTo, setEditedTo] = useState(to && to.length > 0 ? to.join(", ") : "");
  const [isDirty, setIsDirty] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  const displaySubject = editedSubject || subject || "---";
  const displayTo = editedTo || (to && to.length > 0 ? to.join(", ") : "---");
  const displayBody = editedBody || body || "---";

  const handleToggleEdit = () => {
    if (isEditing) {
      onSaveEdits?.(editedBody, editedSubject, editedTo);
    }
    setIsEditing(!isEditing);
    onEdit?.();
  };

  const handleBodyChange = (val: string) => {
    setEditedBody(val);
    setIsDirty(true);
  };

  const charCount = (editedBody || "").length;
  const wordCount = (editedBody || "").trim() ? (editedBody || "").trim().split(/\s+/).length : 0;

  return (
    <div className="my-3 border-2 border-[#E5A93C]/70 bg-white/95 rounded-2xl p-5 shadow-sm transition-all">
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#1A2F25]/10 mb-3 gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E5A93C] animate-pulse"></span>
          <span className="font-editorial text-xl text-[#1A2F25] font-semibold">
            Supervisory Review Required
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {isDirty && (
            <span className="text-[10px] font-mono bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-medium">
              Modified by Supervisor
            </span>
          )}
          <span className="text-[10px] font-mono text-[#526359] bg-[#F8F6F2] px-2 py-0.5 rounded border border-[#1A2F25]/10">
            GATEWAY: FR-14 // SIGN-OFF
          </span>
        </div>
      </div>

      <p className="text-xs text-[#526359] mb-3 leading-relaxed">
        Autonomous agent synthesized outgoing communication. Confirm or edit all fields below before automated transmission.
      </p>

      {/* Draft Review / Editing Container */}
      <div className={`border rounded-xl p-4 mb-3.5 text-xs font-mono transition-colors ${
        isEditing ? "border-[#E06D53] bg-amber-50/20" : "border-[#1A2F25]/10 bg-[#F8F6F2]/70"
      }`}>
        {/* Subject Line */}
        <div className="mb-2">
          <label className="text-[#526359] text-[11px] block font-semibold mb-0.5">
            Subject:
          </label>
          {isEditing ? (
            <input
              type="text"
              value={editedSubject}
              onChange={(e) => {
                setEditedSubject(e.target.value);
                setIsDirty(true);
              }}
              className="w-full bg-white border border-[#E06D53]/60 px-2.5 py-1.5 text-xs font-mono text-[#1A2F25] rounded focus:outline-none focus:border-[#E06D53]"
            />
          ) : (
            <div className="text-[#1A2F25] font-medium">{displaySubject}</div>
          )}
        </div>

        {/* Recipients */}
        <div className="mb-2.5">
          <label className="text-[#526359] text-[11px] block font-semibold mb-0.5">
            Recipients:
          </label>
          {isEditing ? (
            <input
              type="text"
              value={editedTo}
              onChange={(e) => {
                setEditedTo(e.target.value);
                setIsDirty(true);
              }}
              placeholder="e.g. contact@example.com"
              className="w-full bg-white border border-[#E06D53]/60 px-2.5 py-1.5 text-xs font-mono text-[#1A2F25] rounded focus:outline-none focus:border-[#E06D53]"
            />
          ) : (
            <div className="text-[#1A2F25]">{displayTo}</div>
          )}
        </div>

        {/* Meeting link if any */}
        {meetLink && (
          <div className="mb-2.5 pb-2 border-b border-[#1A2F25]/10">
            <span className="text-[#526359] text-[11px] font-semibold mr-1.5">Conference:</span>
            <a href={meetLink} target="_blank" rel="noreferrer" className="text-[#E06D53] underline font-sans">
              {meetLink}
            </a>
          </div>
        )}

        {/* Message Body */}
        <div className="pt-1">
          <div className="flex items-center justify-between text-[#526359] text-[11px] mb-1 font-semibold">
            <span>Email Message Body:</span>
            {isEditing && (
              <span className="text-[10px] text-[#526359] font-normal font-mono">
                {wordCount} words · {charCount} chars
              </span>
            )}
          </div>

          {isEditing ? (
            <textarea
              value={editedBody}
              onChange={(e) => handleBodyChange(e.target.value)}
              rows={6}
              className="w-full bg-white border border-[#E06D53] p-2.5 text-xs font-sans text-[#1A2F25] focus:outline-none rounded-lg leading-relaxed shadow-inner"
            />
          ) : (
            <div className="p-3 bg-white border border-[#1A2F25]/8 rounded-lg whitespace-pre-line text-[#1A2F25] text-xs font-sans leading-relaxed">
              {displayBody}
            </div>
          )}
        </div>
      </div>

      {/* Action Strip with Rigorous Visual Hierarchy */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <span className="text-[11px] font-mono text-[#526359]">
          Runtime paused pending supervisor clearance.
        </span>

        <div className="flex items-center gap-2">
          {approved ? (
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-mono font-medium rounded-full shadow-2xs">
              ✓ Approved by Supervisor · Dispatched via FastMCP
            </span>
          ) : (
            <>
              {/* Secondary Outline Edit Trigger */}
              <button
                type="button"
                onClick={handleToggleEdit}
                className="px-4 py-1.5 border border-[#1A2F25]/20 hover:border-[#1A2F25] bg-white text-[#1A2F25] font-sans text-xs font-medium transition-colors rounded-full cursor-pointer shadow-2xs"
              >
                {isEditing ? "Save & Close Editor" : "Edit Draft"}
              </button>

              {/* Subdued Ghost Reject Button with Confirmation Popover */}
              <div className="relative">
                {showRejectConfirm ? (
                  <div className="inline-flex items-center gap-1.5 bg-red-50 border border-red-300 rounded-full p-1 animate-in fade-in duration-150">
                    <span className="text-[11px] text-red-700 font-sans px-2 font-medium">Confirm Reject?</span>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRejectConfirm(false);
                        onReject?.();
                      }}
                      className="px-2.5 py-0.5 bg-red-600 hover:bg-red-700 text-white text-[11px] font-sans font-semibold rounded-full cursor-pointer"
                    >
                      Yes, Abort
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRejectConfirm(false)}
                      className="px-2 py-0.5 text-stone-500 hover:text-stone-800 text-[11px] font-sans cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowRejectConfirm(true)}
                    className="px-3 py-1.5 text-red-600 hover:bg-red-50 text-xs font-sans rounded-full transition-colors cursor-pointer"
                    title="Reject draft and abort pipeline"
                  >
                    Reject & Abort
                  </button>
                )}
              </div>

              {/* Bold Terracotta Primary Approve Action */}
              <button
                type="button"
                onClick={onApprove}
                className="px-6 py-1.5 bg-[#E06D53] hover:bg-[#CD5B42] text-white font-sans text-xs font-semibold tracking-wide transition-all shadow-sm rounded-full flex items-center gap-1.5 cursor-pointer hover:shadow"
              >
                <span>Approve & Send</span>
                <svg className="w-3.5 h-3.5 stroke-white" fill="none" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M5 13l4 4L19 7" />
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function MissingInfoCard({
  missingFields = ["attendee_email"],
  reason = "Missing attendee contact information in business registry.",
  onAddEmail,
  onSkip,
}: {
  missingFields?: string[];
  reason?: string;
  onAddEmail?: () => void;
  onSkip?: () => void;
}) {
  return (
    <div className="my-3 border border-[#E5A93C]/70 bg-[#FFFDF9] rounded-2xl p-4 text-xs shadow-xs">
      <div className="flex items-center gap-2 text-[#E5A93C] font-semibold mb-1">
        <svg className="w-4 h-4 text-[#E5A93C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span className="font-editorial text-base text-[#1A2F25]">Data Gap Detected (Zero-Hallucination Guard)</span>
      </div>

      <p className="text-[#526359] mb-2 font-sans">
        {reason} The agent adheres strictly to policy and will not guess parameters.
      </p>

      {missingFields.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {missingFields.map((field, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-mono rounded">
              Missing: {field}
            </span>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onAddEmail}
          className="px-3.5 py-1.5 bg-[#1A2F25] hover:bg-[#2A4739] text-white text-[11px] font-mono rounded-full transition-colors cursor-pointer"
        >
          + Provide Required Parameter
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="px-3.5 py-1.5 border border-[#1A2F25]/20 text-[#1A2F25] hover:bg-white text-[11px] font-mono rounded-full transition-colors cursor-pointer"
        >
          Skip Incomplete Records
        </button>
      </div>
    </div>
  );
}

export function ReplanNotice({
  message = "Plan dynamically updated based on live upstream tool execution status.",
}: {
  message?: string;
}) {
  return (
    <div className="my-3 p-3 bg-amber-50/80 border border-amber-200/90 rounded-xl flex items-start gap-2.5 text-xs shadow-2xs">
      <span className="px-2 py-0.5 bg-[#E5A93C] text-white font-mono text-[10px] uppercase font-bold rounded">
        RE-PLANNED
      </span>
      <div className="flex-1 text-[#526359] font-sans">
        <span className="text-[#1A2F25] font-semibold">Adaptive Pipeline Adjustment: </span>
        {message}
      </div>
    </div>
  );
}

export function FailureCard({
  error = "API endpoint rate limit encountered on external tool integration.",
  retryCount = 1,
  maxRetries = 2,
  onRetry,
  onEscalate,
}: {
  error?: string;
  retryCount?: number;
  maxRetries?: number;
  onRetry?: () => void;
  onEscalate?: () => void;
}) {
  return (
    <div className="my-3 p-4 bg-red-50/80 border border-red-300 rounded-2xl text-xs shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-red-700 font-semibold">
          <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="font-editorial text-base">Step Execution Interrupted</span>
        </div>
        <span className="font-mono text-[11px] text-red-700 bg-red-100 border border-red-200 px-2 py-0.5 rounded-full font-semibold">
          Attempt {retryCount} of {maxRetries}
        </span>
      </div>
      <p className="text-[#526359] mb-3 font-sans leading-relaxed">{error}</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="px-4 py-1.5 bg-[#E06D53] text-white hover:bg-[#CD5B42] font-sans text-xs font-medium rounded-full transition-colors cursor-pointer shadow-xs"
        >
          Retry Step Now
        </button>
        <button
          type="button"
          onClick={onEscalate}
          className="px-4 py-1.5 border border-[#1A2F25]/20 text-[#1A2F25] hover:bg-white font-sans text-xs rounded-full transition-colors cursor-pointer"
        >
          Escalate to Human Supervisor
        </button>
      </div>
    </div>
  );
}

export interface ClarificationCardProps {
  questions: string[];
  missingFields?: string[];
  reasoning?: string;
  onSubmitAnswers: (answers: Record<string, string>, rawAnswer?: string) => Promise<void> | void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

export function ClarificationCard({
  questions = [],
  missingFields = [],
  reasoning,
  onSubmitAnswers,
  onCancel,
  isSubmitting = false,
}: ClarificationCardProps) {
  // Mode: "structured" (per question) or "consolidated" (single natural language answer)
  const [mode, setMode] = useState<"structured" | "consolidated">("structured");
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [consolidatedText, setConsolidatedText] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAnswerChange = (qKey: string, val: string) => {
    setAnswers((prev) => ({ ...prev, [qKey]: val }));
    if (errorMsg) setErrorMsg(null);
  };

  const handleApplyQuickSuggestion = (qKey: string, suggestion: string) => {
    setAnswers((prev) => {
      const existing = prev[qKey]?.trim() || "";
      if (existing) {
        return { ...prev, [qKey]: `${existing}, ${suggestion}` };
      }
      return { ...prev, [qKey]: suggestion };
    });
    if (errorMsg) setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "consolidated") {
      if (!consolidatedText.trim()) {
        setErrorMsg("Please type your answers or instructions before submitting.");
        return;
      }
      // Populate answers map with the consolidated text
      const consolidatedAnswers: Record<string, string> = {
        "consolidated_response": consolidatedText.trim(),
      };
      questions.forEach((_q, idx) => {
        consolidatedAnswers[`question_${idx + 1}`] = consolidatedText.trim();
      });
      await onSubmitAnswers(consolidatedAnswers, consolidatedText.trim());
    } else {
      // Structured mode: check if at least one question has been answered
      const filledKeys = Object.keys(answers).filter((k) => answers[k]?.trim());
      if (filledKeys.length === 0) {
        setErrorMsg("Please provide answers to the clarification questions to proceed.");
        return;
      }
      // Clean answers map
      const cleaned: Record<string, string> = {};
      questions.forEach((q, idx) => {
        const key = `question_${idx + 1}`;
        cleaned[key] = answers[key]?.trim() || answers[q]?.trim() || "As per business defaults";
      });
      await onSubmitAnswers(cleaned);
    }
  };

  const getSmartPlaceholder = (question: string) => {
    const qLower = question.toLowerCase();
    if (qLower.includes("email") || qLower.includes("attendee") || qLower.includes("who")) {
      return "e.g., alex.smith@company.com, sarah.cfo@finance.org";
    }
    if (qLower.includes("time") || qLower.includes("date") || qLower.includes("when")) {
      return "e.g., Tomorrow at 3:30 PM IST (Duration: 45 minutes)";
    }
    if (qLower.includes("meet") || qLower.includes("link") || qLower.includes("url") || qLower.includes("platform")) {
      return "e.g., Auto-generate Google Meet conference link";
    }
    if (qLower.includes("agenda") || qLower.includes("body") || qLower.includes("topic") || qLower.includes("subject")) {
      return "e.g., Discuss Q4 milestones, resource planning, and deliverables";
    }
    return "Enter your response...";
  };

  const getSmartSuggestions = (question: string) => {
    const qLower = question.toLowerCase();
    const suggestions: string[] = [];
    if (qLower.includes("time") || qLower.includes("date") || qLower.includes("when")) {
      suggestions.push("Tomorrow at 3:00 PM IST", "Tomorrow at 4:30 PM IST", "Duration: 45 mins", "Duration: 1 hour");
    }
    if (qLower.includes("meet") || qLower.includes("link") || qLower.includes("url")) {
      suggestions.push("Auto-generate Google Meet link", "Virtual Google Meet only");
    }
    if (qLower.includes("agenda") || qLower.includes("subject") || qLower.includes("body")) {
      suggestions.push("Team Milestone Sync", "Quarterly Strategy Review", "Project Status Update");
    }
    return suggestions;
  };

  return (
    <div className="my-3 border-2 border-[#E5A93C]/80 bg-gradient-to-b from-white to-[#F8F6F2]/60 rounded-2xl p-4 sm:p-5 shadow-md transition-all">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between pb-3 border-b border-[#1A2F25]/10 mb-3.5 gap-2">
        <div className="flex items-center gap-2.5">
          <span className="flex h-3 w-3 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E5A93C] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-[#E5A93C]"></span>
          </span>
          <span className="font-editorial text-xl sm:text-2xl text-[#1A2F25] font-semibold">
            Clarification Required: Insufficient Information
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono uppercase bg-[#E5A93C]/15 text-[#B8771A] border border-[#E5A93C]/35 px-2.5 py-1 rounded-full font-semibold tracking-wider">
            SUPERVISOR_CLARIFICATION // INPUT_REQUIRED
          </span>
        </div>
      </div>

      {/* Description & Supervisor Rationale Callout */}
      <div className="mb-4">
        <p className="text-xs sm:text-sm text-[#526359] leading-relaxed mb-2.5">
          The Supervisor Agent evaluated your request and detected that critical parameters are missing for deterministic execution. Please provide answers to continue workflow execution.
        </p>

        {reasoning && (
          <div className="p-3 bg-amber-50/70 border border-amber-200/90 rounded-xl text-xs text-[#1A2F25] flex items-start gap-2.5 mb-2.5">
            <svg className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <span className="font-semibold text-amber-900 block mb-0.5">Supervisor Evaluation:</span>
              <span className="text-[#1A2F25]/85">{reasoning}</span>
            </div>
          </div>
        )}

        {/* Missing Fields Pill Badges */}
        {missingFields && missingFields.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-mono text-[#526359] uppercase tracking-wide mr-1">
              Missing Fields:
            </span>
            {missingFields.map((field, idx) => (
              <span
                key={idx}
                className="px-2.5 py-0.5 bg-[#E06D53]/10 text-[#CD5B42] border border-[#E06D53]/30 text-[10px] font-mono rounded-full font-semibold shadow-2xs"
              >
                {field}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Input Mode Switcher */}
      <div className="flex items-center justify-between border-b border-[#1A2F25]/10 pb-2 mb-3">
        <span className="text-xs font-mono text-[#526359] uppercase tracking-wider font-medium">
          Answer Method:
        </span>
        <div className="flex items-center gap-1 bg-[#1A2F25]/5 p-0.5 rounded-lg border border-[#1A2F25]/10 text-xs font-mono">
          <button
            type="button"
            onClick={() => setMode("structured")}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              mode === "structured"
                ? "bg-white text-[#1A2F25] shadow-xs font-semibold"
                : "text-[#526359] hover:text-[#1A2F25]"
            }`}
          >
            Structured Questions ({questions.length})
          </button>
          <button
            type="button"
            onClick={() => setMode("consolidated")}
            className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
              mode === "consolidated"
                ? "bg-white text-[#1A2F25] shadow-xs font-semibold"
                : "text-[#526359] hover:text-[#1A2F25]"
            }`}
          >
            Consolidated Answer
          </button>
        </div>
      </div>

      {/* Form Submission */}
      <form onSubmit={handleSubmit} className="space-y-3.5">
        {mode === "structured" ? (
          <div className="space-y-3">
            {questions.map((question, idx) => {
              const qKey = `question_${idx + 1}`;
              const currentVal = answers[qKey] || "";
              const suggestions = getSmartSuggestions(question);

              return (
                <div
                  key={idx}
                  className="p-3.5 bg-white border border-[#1A2F25]/12 rounded-xl shadow-2xs hover:border-[#E06D53]/40 transition-colors"
                >
                  <div className="flex items-start gap-2.5 mb-2">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#E5A93C]/20 border border-[#E5A93C]/50 text-[#B8771A] text-[10px] font-mono font-bold shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <label
                      htmlFor={`input-${qKey}`}
                      className="font-editorial text-base sm:text-lg text-[#1A2F25] font-medium leading-snug flex-1 cursor-pointer"
                    >
                      {question}
                    </label>
                  </div>

                  <div className="relative">
                    <textarea
                      id={`input-${qKey}`}
                      rows={2}
                      value={currentVal}
                      onChange={(e) => handleAnswerChange(qKey, e.target.value)}
                      placeholder={getSmartPlaceholder(question)}
                      disabled={isSubmitting}
                      className="w-full bg-[#F8F6F2]/60 border border-[#1A2F25]/15 focus:border-[#E06D53] focus:bg-white focus:ring-2 focus:ring-[#E06D53]/20 rounded-lg p-2.5 text-xs sm:text-sm font-sans text-[#1A2F25] placeholder-[#526359]/50 transition-all outline-none resize-y"
                    />
                  </div>

                  {/* Quick Clickable Suggestions */}
                  {suggestions.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                      <span className="text-[10px] font-mono text-[#526359]">Quick fill:</span>
                      {suggestions.map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          onClick={() => handleApplyQuickSuggestion(qKey, sug)}
                          className="text-[10px] font-sans px-2 py-0.5 rounded-md bg-[#F8F6F2] hover:bg-[#E06D53]/15 text-[#1A2F25] border border-[#1A2F25]/10 hover:border-[#E06D53]/30 transition-colors cursor-pointer"
                        >
                          + {sug}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-3.5 bg-white border border-[#1A2F25]/12 rounded-xl shadow-2xs">
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="consolidated-input"
                className="font-editorial text-base text-[#1A2F25] font-medium"
              >
                Provide All Missing Details in Natural Language:
              </label>
              <span className="text-[10px] font-mono text-[#526359]">
                {consolidatedText.length} characters
              </span>
            </div>

            <textarea
              id="consolidated-input"
              rows={4}
              value={consolidatedText}
              onChange={(e) => {
                setConsolidatedText(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="e.g., Please schedule the milestone meeting for tomorrow at 4:00 PM IST with dev-team@company.com and sarah@client.com. Generate a Google Meet link and set the agenda to review project deployment."
              disabled={isSubmitting}
              className="w-full bg-[#F8F6F2]/60 border border-[#1A2F25]/15 focus:border-[#E06D53] focus:bg-white focus:ring-2 focus:ring-[#E06D53]/20 rounded-lg p-3 text-xs sm:text-sm font-sans text-[#1A2F25] placeholder-[#526359]/50 transition-all outline-none resize-y"
            />
            <p className="text-[11px] text-[#526359] mt-2 font-sans">
              Tip: Include any specific timing, attendee email addresses, and topic overview. The Supervisor Agent will automatically extract these details for planning.
            </p>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2 animate-in fade-in duration-150">
            <svg className="w-4 h-4 shrink-0 text-red-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2">
          <div className="text-[11px] font-mono text-[#526359]">
            Workflow is paused awaiting your answers.
          </div>

          <div className="flex items-center gap-2">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                disabled={isSubmitting}
                className="px-4 py-2 border border-[#1A2F25]/20 hover:bg-[#1A2F25]/5 text-[#1A2F25] text-xs font-sans rounded-full transition-colors cursor-pointer"
              >
                Abort Workflow
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-[#E06D53] hover:bg-[#CD5B42] text-white text-xs font-sans font-medium rounded-full transition-all shadow-sm hover:shadow cursor-pointer flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-0.5 h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Submitting Answers...</span>
                </>
              ) : (
                <>
                  <span>Submit Answers & Continue Workflow</span>
                  <span>&rarr;</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export function ClarificationSummaryCard({
  questions = [],
  answers = {},
}: {
  questions?: string[];
  answers?: Record<string, string>;
}) {
  if (!answers || Object.keys(answers).length === 0) return null;

  return (
    <div className="my-3 border border-emerald-200/90 bg-emerald-50/50 rounded-2xl p-4 shadow-2xs">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-emerald-200/80">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
          </svg>
          <span className="font-editorial text-base text-[#1A2F25] font-semibold">
            Operator Clarifications Provided
          </span>
        </div>
        <span className="text-[10px] font-mono uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-semibold">
          RESOLVED
        </span>
      </div>

      <div className="space-y-2 text-xs font-mono">
        {questions.length > 0 ? (
          questions.map((q, idx) => {
            const key = `question_${idx + 1}`;
            const ans = answers[key] || answers[q] || answers["consolidated_response"] || "Provided";
            return (
              <div key={idx} className="bg-white/90 p-2.5 rounded-lg border border-emerald-100">
                <span className="text-[#526359] block text-[11px] mb-0.5">
                  Q{idx + 1}: {q}
                </span>
                <span className="text-[#1A2F25] font-medium block">
                  &rarr; {ans}
                </span>
              </div>
            );
          })
        ) : (
          Object.entries(answers).map(([k, v], idx) => (
            <div key={idx} className="bg-white/90 p-2.5 rounded-lg border border-emerald-100">
              <span className="text-[#526359] block text-[11px] mb-0.5">{k}:</span>
              <span className="text-[#1A2F25] font-medium block">&rarr; {v}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
