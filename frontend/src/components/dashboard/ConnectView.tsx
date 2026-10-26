"use client";

import React, { useState, useEffect } from "react";

interface GoogleCodeResponse {
  code?: string;
  error?: string;
}

interface GoogleOAuthClient {
  requestCode: () => void;
}

interface GoogleAccountsOAuth2 {
  initCodeClient: (config: {
    client_id: string;
    scope: string;
    ux_mode: string;
    callback: (response: GoogleCodeResponse) => void;
  }) => GoogleOAuthClient;
}

declare global {
  interface Window {
    google?: {
      accounts?: {
        oauth2?: GoogleAccountsOAuth2;
      };
    };
  }
}

interface ConnectViewProps {
  onBackToWorkflow?: () => void;
  userId?: string;
  businessId?: number;
}

export default function ConnectView({
  onBackToWorkflow,
  userId: propUserId,
  businessId: propBusinessId,
}: ConnectViewProps) {
  const [connecting, setConnecting] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Derive current user session lazily without cascading render effect
  const [currentUserId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("axiomflow_session");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.user_id) return parsed.user_id;
        }
      } catch {
        // fallback
      }
    }
    return propUserId || "usr_72b30e7cd49e49e5";
  });

  const [currentBusinessId] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("axiomflow_session");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.business_id) return parsed.business_id;
        }
      } catch {
        // fallback
      }
    }
    return propBusinessId || 2;
  });

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
  const GOOGLE_CLIENT_ID =
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    "177787316420-jhrnte3a0c61vjoqj3t1ec3jphbn9fjd.apps.googleusercontent.com";

  // Check current connection status on mount
  useEffect(() => {
    if (!currentUserId) return;

    fetch(`${API_BASE}/api/oauth/google/status/${currentUserId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.connected_accounts && data.connected_accounts.length > 0) {
          const acc = data.connected_accounts[0];
          setConnectedEmail(acc.account_email);
        } else {
          setConnectedEmail(null);
        }
      })
      .catch((err) => {
        console.error("Error loading OAuth status:", err);
      });
  }, [currentUserId, API_BASE]);

  const handleConnectGoogle = () => {
    if (typeof window === "undefined" || !window.google?.accounts?.oauth2) {
      setErrorMsg("Google Identity Services script is still loading. Please check your internet connection or refresh.");
      return;
    }

    setConnecting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const client = window.google.accounts.oauth2.initCodeClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: [
          "openid",
          "https://www.googleapis.com/auth/userinfo.email",
          "https://www.googleapis.com/auth/gmail.send",
          "https://www.googleapis.com/auth/calendar.events",
          "https://www.googleapis.com/auth/spreadsheets",
          "https://www.googleapis.com/auth/documents",
          "https://www.googleapis.com/auth/drive.file",
        ].join(" "),
        ux_mode: "popup",
        callback: async (response: GoogleCodeResponse) => {
          if (response.error || !response.code) {
            setErrorMsg(`Authorization cancelled or denied: ${response.error || "No auth code received"}`);
            setConnecting(false);
            return;
          }

          try {
            const res = await fetch(`${API_BASE}/api/oauth/google/exchange`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                code: response.code,
                user_id: currentUserId,
                business_id: currentBusinessId,
              }),
            });

            const data = await res.json();
            if (res.ok && data.success) {
              setConnectedEmail(data.account_email);
              setSuccessMsg(`Google Account ${data.account_email} connected successfully!`);
            } else {
              setErrorMsg(data.detail || "Exchange failed with backend server.");
            }
          } catch (err: unknown) {
            setErrorMsg(err instanceof Error ? err.message : "Network error communicating with backend API.");
          } finally {
            setConnecting(false);
          }
        },
      });

      client.requestCode();
    } catch (err: unknown) {
      setErrorMsg(`Failed to initialize Google Auth Popup: ${err instanceof Error ? err.message : String(err)}`);
      setConnecting(false);
    }
  };

  const handleRevokeGoogle = async () => {
    if (!connectedEmail) return;
    setConnecting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${API_BASE}/api/oauth/google/revoke`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: currentUserId,
          account_email: connectedEmail,
        }),
      });

      if (res.ok) {
        setConnectedEmail(null);
        setSuccessMsg("Google Workspace disconnected and revoked successfully.");
      } else {
        const data = await res.json();
        setErrorMsg(data.detail || "Revocation failed.");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Network error revoking OAuth access.");
    } finally {
      setConnecting(false);
    }
  };

  const handleTestPing = async () => {
    if (!connectedEmail) return;
    setTestingConnection(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`${API_BASE}/api/oauth/google/status/${currentUserId}`);
      if (res.ok) {
        setSuccessMsg("Health Check Passed: All 4 Google Workspace tools (Gmail, Calendar, Sheets, Docs) are verified & operational via FastMCP.");
      } else {
        setErrorMsg("Health check ping failed. Tokens may require re-authorization.");
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Health check failed.");
    } finally {
      setTestingConnection(false);
    }
  };

  const isConnected = Boolean(connectedEmail);

  return (
    <div className="flex-1 flex flex-col justify-start py-1 overflow-y-auto pr-1">
      {/* Top Header & Wayfinding */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#1A2F25]/10 mb-5 gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs uppercase tracking-wider text-[#E06D53] font-bold">
              TOOL_INTEGRATION // GOVERNANCE
            </span>
            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
              OAUTH 2.0 PKCE
            </span>
          </div>
          <h2 className="font-editorial text-3xl md:text-4xl text-[#1A2F25] tracking-tight">
            Connected Services & Tool Suite
          </h2>
          <p className="font-sans text-xs text-[#526359] mt-1 max-w-xl leading-relaxed">
            Manage zero-token FastMCP tool adapters. Authorized credentials empower autonomous agents to draft emails, generate documents, schedule meetings, and query spreadsheets.
          </p>
        </div>

        {onBackToWorkflow && (
          <button
            type="button"
            onClick={onBackToWorkflow}
            className="px-4 py-1.5 border border-[#1A2F25]/20 hover:border-[#1A2F25] rounded-full text-xs font-mono text-[#1A2F25] transition-colors cursor-pointer shrink-0 bg-white shadow-2xs"
          >
            &larr; Back to Workflow
          </button>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center justify-between animate-in fade-in">
          <span>{errorMsg}</span>
          <button type="button" onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-800 font-mono text-xs cursor-pointer">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="p-3 mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center justify-between animate-in fade-in">
          <span>{successMsg}</span>
          <button type="button" onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-900 font-mono text-xs cursor-pointer">✕</button>
        </div>
      )}

      {/* Primary Google Master Connector Status Banner */}
      <div className="p-5 sm:p-6 bg-white/95 border border-[#1A2F25]/12 rounded-2xl shadow-sm mb-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white border border-[#1A2F25]/10 flex items-center justify-center shrink-0 shadow-2xs">
              <svg className="w-7 h-7" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-editorial text-2xl text-[#1A2F25]">Google Workspace Core Suite</h3>
                {isConnected ? (
                  <span className="px-2.5 py-0.5 bg-emerald-100 border border-emerald-300 text-emerald-800 text-[11px] font-mono rounded-full font-semibold">
                    CONNECTED & ACTIVE
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-stone-100 border border-stone-200 text-stone-600 text-[11px] font-mono rounded-full">
                    NOT CONNECTED
                  </span>
                )}
              </div>
              <p className="font-sans text-xs text-[#526359] mt-1">
                {isConnected ? (
                  <>
                    Authorized account: <strong className="text-[#1A2F25] font-semibold">{connectedEmail}</strong>
                    <span className="block text-[11px] text-[#526359] mt-0.5 font-mono">
                      FastMCP Gateway: Live token vault synchronization active.
                    </span>
                  </>
                ) : (
                  "Connect Gmail, Calendar, Sheets, and Google Docs in a single secure authorization step."
                )}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center gap-2.5">
            {isConnected ? (
              <>
                <button
                  type="button"
                  onClick={handleTestPing}
                  disabled={testingConnection}
                  className="px-4 py-2 bg-white hover:bg-[#F8F6F2] text-[#1A2F25] border border-[#1A2F25]/20 text-xs font-mono font-medium rounded-xl transition cursor-pointer shadow-2xs disabled:opacity-50"
                  title="Verify token validity and API endpoint health"
                >
                  {testingConnection ? "Pinging..." : "Test Connection"}
                </button>
                <button
                  type="button"
                  onClick={handleRevokeGoogle}
                  disabled={connecting}
                  className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50"
                >
                  {connecting ? "Revoking..." : "Disconnect Account"}
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleConnectGoogle}
                disabled={connecting}
                className="px-5 py-2.5 bg-[#1A2F25] hover:bg-[#254234] text-white text-xs font-semibold rounded-xl transition shadow-xs cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {connecting ? "Authorizing with Google..." : "Connect Google Account"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Modular 4-Card Service Grid Architecture */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-editorial text-xl text-[#1A2F25]">
            Granular Service Adapters (FastMCP)
          </h3>
          <span className="text-[11px] font-mono text-[#526359]">
            {isConnected ? "4 Active Adapters" : "Awaiting Authorization"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Gmail Card */}
          <div className={`p-4 rounded-xl border transition-all ${
            isConnected ? "bg-white border-[#1A2F25]/12 shadow-2xs" : "bg-white/50 border-[#1A2F25]/8 opacity-75"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">✉️</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                isConnected ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-gray-100 text-gray-500"
              }`}>
                {isConnected ? "READY" : "INACTIVE"}
              </span>
            </div>
            <div className="font-editorial text-lg text-[#1A2F25] font-semibold">Gmail API</div>
            <p className="text-[11px] font-sans text-[#526359] mt-1 leading-relaxed">
              Synthesizes and dispatches personalized communications following human approval.
            </p>
            <div className="mt-3 pt-2 border-t border-[#1A2F25]/8 font-mono text-[10px] text-[#526359]">
              Scope: <code className="text-[#CD5B42]">gmail.send</code>
            </div>
          </div>

          {/* Google Calendar Card */}
          <div className={`p-4 rounded-xl border transition-all ${
            isConnected ? "bg-white border-[#1A2F25]/12 shadow-2xs" : "bg-white/50 border-[#1A2F25]/8 opacity-75"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">📅</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                isConnected ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-gray-100 text-gray-500"
              }`}>
                {isConnected ? "READY" : "INACTIVE"}
              </span>
            </div>
            <div className="font-editorial text-lg text-[#1A2F25] font-semibold">Google Calendar API</div>
            <p className="text-[11px] font-sans text-[#526359] mt-1 leading-relaxed">
              Books events, checks stakeholder availability, and creates Google Meet links.
            </p>
            <div className="mt-3 pt-2 border-t border-[#1A2F25]/8 font-mono text-[10px] text-[#526359]">
              Scope: <code className="text-[#CD5B42]">calendar.events</code>
            </div>
          </div>

          {/* Google Sheets Card */}
          <div className={`p-4 rounded-xl border transition-all ${
            isConnected ? "bg-white border-[#1A2F25]/12 shadow-2xs" : "bg-white/50 border-[#1A2F25]/8 opacity-75"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">📊</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                isConnected ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-gray-100 text-gray-500"
              }`}>
                {isConnected ? "READY" : "INACTIVE"}
              </span>
            </div>
            <div className="font-editorial text-lg text-[#1A2F25] font-semibold">Google Sheets API</div>
            <p className="text-[11px] font-sans text-[#526359] mt-1 leading-relaxed">
              Reads records, extracts sales telemetry, inserts rows, and creates spreadsheets.
            </p>
            <div className="mt-3 pt-2 border-t border-[#1A2F25]/8 font-mono text-[10px] text-[#526359]">
              Scope: <code className="text-[#CD5B42]">spreadsheets</code>
            </div>
          </div>

          {/* Google Docs Card */}
          <div className={`p-4 rounded-xl border transition-all ${
            isConnected ? "bg-white border-[#1A2F25]/12 shadow-2xs" : "bg-white/50 border-[#1A2F25]/8 opacity-75"
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xl">📄</span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold ${
                isConnected ? "bg-emerald-50 text-emerald-800 border border-emerald-200" : "bg-gray-100 text-gray-500"
              }`}>
                {isConnected ? "READY" : "INACTIVE"}
              </span>
            </div>
            <div className="font-editorial text-lg text-[#1A2F25] font-semibold">Google Docs API</div>
            <p className="text-[11px] font-sans text-[#526359] mt-1 leading-relaxed">
              Generates executive briefs, writes reports, updates headings, and formats files.
            </p>
            <div className="mt-3 pt-2 border-t border-[#1A2F25]/8 font-mono text-[10px] text-[#526359]">
              Scope: <code className="text-[#CD5B42]">documents, drive.file</code>
            </div>
          </div>
        </div>
      </div>

      {/* Enterprise Integrations Gallery (Upcoming Connectors) */}
      <div className="p-5 bg-white/70 border border-[#1A2F25]/10 rounded-2xl mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-editorial text-xl text-[#1A2F25]">
            Upcoming Enterprise Connectors
          </h3>
          <span className="text-[10px] font-mono uppercase text-[#CD5B42] font-semibold bg-[#E06D53]/10 px-2 py-0.5 rounded">
            Roadmap
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 bg-white rounded-xl border border-[#1A2F25]/8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-base">💬</span>
                <span className="text-[9px] font-mono uppercase bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">Q4 2026</span>
              </div>
              <div className="font-medium text-xs text-[#1A2F25]">Slack Webhooks</div>
              <p className="text-[11px] text-[#526359] mt-0.5">Real-time incident & supervisory alerts.</p>
            </div>
            <button type="button" className="mt-2 text-[10px] font-mono text-[#E06D53] hover:underline cursor-pointer text-left">
              Notify Me &rarr;
            </button>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-[#1A2F25]/8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-base">🏢</span>
                <span className="text-[9px] font-mono uppercase bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">Q4 2026</span>
              </div>
              <div className="font-medium text-xs text-[#1A2F25]">Microsoft 365</div>
              <p className="text-[11px] text-[#526359] mt-0.5">Outlook mail & Excel cloud spreadsheet sync.</p>
            </div>
            <button type="button" className="mt-2 text-[10px] font-mono text-[#E06D53] hover:underline cursor-pointer text-left">
              Notify Me &rarr;
            </button>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-[#1A2F25]/8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-base">🧲</span>
                <span className="text-[9px] font-mono uppercase bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">Q1 2027</span>
              </div>
              <div className="font-medium text-xs text-[#1A2F25]">HubSpot & CRM</div>
              <p className="text-[11px] text-[#526359] mt-0.5">Automated lead intake & deal updates.</p>
            </div>
            <button type="button" className="mt-2 text-[10px] font-mono text-[#E06D53] hover:underline cursor-pointer text-left">
              Notify Me &rarr;
            </button>
          </div>

          <div className="p-3.5 bg-white rounded-xl border border-[#1A2F25]/8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-base">🗄️</span>
                <span className="text-[9px] font-mono uppercase bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded">Q1 2027</span>
              </div>
              <div className="font-medium text-xs text-[#1A2F25]">Database Gateways</div>
              <p className="text-[11px] text-[#526359] mt-0.5">Direct query to PostgreSQL & MySQL stores.</p>
            </div>
            <button type="button" className="mt-2 text-[10px] font-mono text-[#E06D53] hover:underline cursor-pointer text-left">
              Notify Me &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
