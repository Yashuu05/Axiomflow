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
