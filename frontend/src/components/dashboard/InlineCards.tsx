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
  onSaveEdits?: (newBody: string) => void;
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
  const initialText = body || "---";
  const [editedBody, setEditedBody] = useState(initialText);

  const displaySubject = subject || "---";
  const displayTo = to && to.length > 0 ? to.join(", ") : "---";

  const handleToggleEdit = () => {
    if (isEditing) {
      onSaveEdits?.(editedBody);
    }
    setIsEditing(!isEditing);
    onEdit?.();
  };

  return (
    <div className="my-4 border border-[#E06D53]/40 bg-white/95 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-[#1A2F25]/10 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#E5A93C] animate-pulse"></span>
          <span className="font-editorial text-lg text-[#1A2F25] font-normal">
            Human-in-the-Loop Review Required
          </span>
        </div>
        <span className="text-[11px] font-mono text-[#526359] bg-[#F8F6F2] px-2 py-0.5 border border-[#1A2F25]/10">
          GATEWAY: FR-14 // SUPERVISORY SIGN-OFF
        </span>
      </div>

      <div className="text-xs text-[#526359] mb-3 leading-relaxed">
        The agent has prepared an outgoing communication. Please review the real-time generated template before automated dispatch.
      </div>

      <div className="border border-[#1A2F25]/10 bg-[#F8F6F2] rounded-lg p-3.5 mb-4 text-xs font-mono">
        <div className="text-[#526359] text-[11px] mb-1">
          <strong>Subject:</strong> {displaySubject}
        </div>
        <div className="text-[#526359] text-[11px] mb-1 pb-1">
          <strong>Recipients:</strong> {displayTo}
        </div>
        {meetLink && (
          <div className="text-[#526359] text-[11px] mb-2 pb-2 border-b border-[#1A2F25]/10">
            <strong>Conference:</strong> <a href={meetLink} target="_blank" rel="noreferrer" className="text-[#E06D53] underline">{meetLink}</a>
          </div>
        )}
        {!meetLink && <div className="border-b border-[#1A2F25]/10 mb-2"></div>}

        {isEditing ? (
          <textarea
            value={editedBody}
            onChange={(e) => setEditedBody(e.target.value)}
            rows={5}
            className="w-full bg-white border border-[#E06D53] p-2 text-xs font-mono text-[#1A2F25] focus:outline-none rounded"
          />
        ) : (
          <p className="whitespace-pre-line text-[#1A2F25] text-xs font-sans leading-relaxed">
            {editedBody}
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <span className="text-[11px] font-mono text-[#526359]">
          Paused pending supervisory clearance.
        </span>

        <div className="flex items-center gap-2">
          {approved ? (
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-100 text-emerald-800 text-xs font-mono font-medium rounded-full">
              ✓ Approved & Queued for Dispatch
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={handleToggleEdit}
                className="px-3.5 py-1.5 border border-[#1A2F25]/20 hover:border-[#1A2F25] bg-white text-[#1A2F25] font-sans text-xs transition-colors rounded-full"
              >
                {isEditing ? "Save Edits" : "Edit Draft"}
              </button>
              <button
                type="button"
                onClick={onReject}
                className="px-3.5 py-1.5 border border-red-300 hover:bg-red-50 text-red-600 font-sans text-xs transition-colors rounded-full"
              >
                Reject & Abort
              </button>
              <button
                type="button"
                onClick={onApprove}
                className="px-5 py-1.5 bg-[#E06D53] hover:bg-[#CD5B42] text-white font-sans text-xs font-medium tracking-wide transition-all shadow-sm rounded-full flex items-center gap-1.5"
              >
                <span>Approve & Send</span>
                <svg className="w-3.5 h-3.5 stroke-white" fill="none" viewBox="0 0 24 24" strokeWidth="2">
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
  onAddEmail,
  onSkip,
}: {
  onAddEmail?: () => void;
  onSkip?: () => void;
}) {
  return (
    <div className="my-3 border border-[#E5A93C]/60 bg-[#FFFDF9] rounded-xl p-4 text-xs">
      <div className="flex items-center gap-2 text-[#E5A93C] font-semibold mb-1">
        <svg className="w-4 h-4 text-[#E5A93C]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>Data Gap Detected (Zero-Hallucination Guard)</span>
      </div>
      <p className="text-[#526359] mb-3">
        3 contacts in the investor registry have no email address configured. The agent does not invent fallback addresses.
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onAddEmail}
          className="px-3 py-1 bg-[#1A2F25] text-white text-[11px] font-mono hover:bg-[#526359] rounded"
        >
          + Provide Missing Email
        </button>
        <button
          type="button"
          onClick={onSkip}
          className="px-3 py-1 border border-[#1A2F25]/20 text-[#1A2F25] text-[11px] font-mono hover:bg-white rounded"
        >
          Skip Incomplete Records
        </button>
      </div>
    </div>
  );
}

export function ReplanNotice({
  message = "Plan updated. INV-204 was paid, so its reminder was removed. Source: inbox, 10:44.",
}: {
  message?: string;
}) {
  return (
    <div className="my-3 p-3 bg-amber-50/80 border border-amber-200/90 rounded-lg flex items-start gap-2.5 text-xs">
      <span className="px-1.5 py-0.5 bg-[#E5A93C] text-white font-mono text-[10px] uppercase font-bold rounded">
        RE-PLANNED
      </span>
      <div className="flex-1 text-[#526359] font-sans">
        <span className="text-[#1A2F25] font-medium">Adaptive Pipeline Adjustment: </span>
        {message}
      </div>
    </div>
  );
}

export function FailureCard({
  error = "API endpoint rate limit encountered on calendar integration (HTTP 429).",
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
    <div className="my-3 p-4 bg-red-50/70 border border-red-300 rounded-xl text-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-red-700 font-semibold">
          <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span>Step Execution Interrupted</span>
        </div>
        <span className="font-mono text-[11px] text-red-600 bg-red-100 px-2 py-0.5 rounded">
          Retry {retryCount} of {maxRetries}
        </span>
      </div>
      <p className="text-[#526359] mb-3">{error}</p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="px-3.5 py-1.5 bg-[#E06D53] text-white hover:bg-[#CD5B42] font-mono text-xs rounded-full"
        >
          Retry Step Now
        </button>
        <button
          type="button"
          onClick={onEscalate}
          className="px-3.5 py-1.5 border border-[#1A2F25]/20 text-[#1A2F25] hover:bg-white font-mono text-xs rounded-full"
        >
          Escalate to Human Supervisor
        </button>
      </div>
    </div>
  );
}
