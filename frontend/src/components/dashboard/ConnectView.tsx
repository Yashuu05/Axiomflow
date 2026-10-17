"use client";

import React, { useState, useEffect } from "react";

declare global {
  interface Window {
    google?: any;
  }
}

interface ConnectViewProps {
  onBackToWorkflow: () => void;
  userId?: string;
  businessId?: number;
}

export default function ConnectView({
  onBackToWorkflow,
  userId: propUserId,
  businessId: propBusinessId,
}: ConnectViewProps) {
  const [connecting, setConnecting] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [scopes, setScopes] = useState<string[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Derive current user session from props or localStorage
  const [currentUserId, setCurrentUserId] = useState<string>(propUserId || "usr_72b30e7cd49e49e5");
  const [currentBusinessId, setCurrentBusinessId] = useState<number>(propBusinessId || 2);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("axiomflow_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.user_id) setCurrentUserId(parsed.user_id);
        if (parsed.business_id) setCurrentBusinessId(parsed.business_id);
      }
    } catch {
      // Keep defaults
    }
  }, []);

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
          if (acc.scopes) {
            setScopes(acc.scopes.split(" "));
          }
        } else {
          setConnectedEmail(null);
          setScopes([]);
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
        ].join(" "),
        ux_mode: "popup",
        callback: async (response: any) => {
          if (response.error) {
            setErrorMsg(`Authorization cancelled or denied: ${response.error}`);
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
              setScopes(data.scopes || []);
              setSuccessMsg(`Google Account ${data.account_email} connected successfully!`);
            } else {
              setErrorMsg(data.detail || "Exchange failed with backend server.");
            }
          } catch (err: any) {
            setErrorMsg(err.message || "Network error communicating with backend API.");
          } finally {
            setConnecting(false);
          }
        },
      });

      client.requestCode();
    } catch (err: any) {
      setErrorMsg(`Failed to initialize Google Auth Popup: ${err.message}`);
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
        setScopes([]);
        setSuccessMsg("Google Workspace disconnected and revoked successfully.");
      } else {
        const data = await res.json();
        setErrorMsg(data.detail || "Revocation failed.");
      }
    } catch (err: any) {
      setErrorMsg(`Revoke error: ${err.message}`);
    } finally {
      setConnecting(false);
    }
  };

  const plannedConnectors = [
    {
      title: "Relational Databases",
      description: "Direct JDBC/SQL connection to MySQL (axiomflow_db), PostgreSQL, or Oracle instances.",
      tag: "READY (RDS MYSQL)",
      icon: "🗄️",
    },
    {
      title: "Excel & CSV Spreadsheets",
      description: "Upload financial statements, vendor directories, or investor contact sheets (.xlsx, .csv).",
      tag: "IN SPECIFICATION",
      icon: "📊",
    },
    {
      title: "Accounting & ERP Gateways",
      description: "Two-way synchronization with Tally, SAP, QuickBooks, and Stripe billing engines.",
      tag: "QUEUED",
      icon: "⚡",
    },
  ];

  return (
    <div className="flex-1 flex flex-col justify-between py-4 max-w-4xl mx-auto w-full">
      <div className="text-center mb-6">
        <span className="inline-block px-3 py-1 bg-[#E06D53]/10 border border-[#E06D53]/30 text-[#E06D53] font-mono text-xs tracking-wider uppercase rounded-full mb-3">
          SECURITY-FIRST OAUTH 2.0 CONNECTORS
        </span>
        <h2 className="font-editorial text-3xl sm:text-4xl text-[#1A2F25] mb-2">
          Connect External Services & Tools
        </h2>
        <p className="font-sans text-sm text-[#526359] max-w-xl mx-auto leading-relaxed">
          Grant scoped permissions to your enterprise Google workspace to allow real-time AI tool execution (meeting scheduling, investor emailing, and spreadsheet management).
        </p>
      </div>

      {errorMsg && (
        <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl text-center">
          {errorMsg}
        </div>
      )}

      {successMsg && (
        <div className="p-3 mb-4 bg-green-50 border border-green-200 text-green-800 text-xs rounded-xl text-center">
          {successMsg}
        </div>
      )}

      {/* Google Workspace Active Connector Card */}
      <div className="p-6 bg-white/95 border border-[#1A2F25]/12 rounded-2xl shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
              <svg className="w-7 h-7" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-editorial text-xl text-[#1A2F25]">Google Workspace Core Suite</h3>
                {connectedEmail ? (
                  <span className="px-2.5 py-0.5 bg-green-100 border border-green-200 text-green-800 text-[10px] font-mono rounded-full font-semibold">
                    CONNECTED
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 bg-gray-100 border border-gray-200 text-gray-600 text-[10px] font-mono rounded-full">
                    DISCONNECTED
                  </span>
                )}
              </div>
              <p className="font-sans text-xs text-[#526359] mt-1">
                {connectedEmail ? (
                  <>
                    Authorized account: <strong className="text-[#1A2F25]">{connectedEmail}</strong>
                    <br />
                    <span className="text-[11px] text-[#526359]/90 font-mono">
                      Active Scopes: Gmail (Send), Calendar (Events), Sheets (Read/Write)
                    </span>
                  </>
                ) : (
                  "Connect Gmail (Send), Calendar (Events), and Google Sheets for real-time agent execution."
                )}
              </p>
            </div>
          </div>

          <div className="shrink-0 flex items-center">
            {connectedEmail ? (
              <button
                type="button"
                onClick={handleRevokeGoogle}
                disabled={connecting}
                className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold rounded-xl transition cursor-pointer disabled:opacity-50"
              >
                {connecting ? "Revoking..." : "Disconnect Account"}
              </button>
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

      {/* Planned Connectors Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {plannedConnectors.map((item, index) => (
          <div
            key={index}
            className="p-5 bg-white/80 border border-[#1A2F25]/10 rounded-2xl shadow-xs relative overflow-hidden"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-2xl">{item.icon}</span>
              <span className="font-mono text-[9px] uppercase tracking-wider text-[#526359] bg-[#F8F6F2] px-2 py-0.5 rounded border border-[#1A2F25]/8 font-medium">
                {item.tag}
              </span>
            </div>
            <h3 className="font-editorial text-lg text-[#1A2F25] mb-1">
              {item.title}
            </h3>
            <p className="font-sans text-xs text-[#526359] leading-relaxed">
              {item.description}
            </p>
          </div>
        ))}
      </div>

      <div className="text-center pt-4">
        <button
          type="button"
          onClick={onBackToWorkflow}
          className="px-6 py-2.5 bg-[#E06D53] hover:bg-[#CD5B42] text-white font-sans text-xs uppercase tracking-wider font-semibold rounded-full transition-all shadow-sm cursor-pointer"
        >
          &larr; Return to Active Workflow
        </button>
      </div>
    </div>
  );
}
