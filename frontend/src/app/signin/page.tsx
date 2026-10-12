"use client";

import { useState } from "react";
import Link from "next/link";

export default function SigninPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<{
    admin_name: string;
    admin_email: string;
    business_name: string | null;
    role: string;
    user_id: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Client validation
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMsg("Please enter your registered admin email address.");
      return;
    }
    if (!trimmedEmail.includes("@") || !trimmedEmail.includes(".")) {
      setErrorMsg("Invalid email format. Please provide a valid email address.");
      return;
    }
    if (!password) {
      setErrorMsg("Please enter your account password.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: trimmedEmail.toLowerCase(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Authentication failed. Please verify your credentials.");
      }

      setAuthSuccess({
        admin_name: data.admin_name,
        admin_email: data.admin_email,
        business_name: data.business_name,
        role: data.role,
        user_id: data.user_id,
      });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Failed to communicate with authentication gateway. Verify backend server is running.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#1A2F25] selection:bg-[#E06D53] selection:text-white flex flex-col justify-between">
      {/* Top Ribbon */}
      <header className="border-b border-[#1A2F25]/10 bg-[#F8F6F2]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-5 h-5 bg-[#1A2F25] flex items-center justify-center font-mono text-[10px] text-[#F8F6F2] font-semibold">
              AX
            </div>
            <span className="font-editorial text-2xl tracking-tight text-[#1A2F25] group-hover:text-[#E06D53] transition-colors">
              Axiomflow
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#526359] border border-[#1A2F25]/10 px-1.5 py-0.5 ml-2 hidden sm:inline-block">
              AUTH_GATEWAY // SECURE
            </span>
          </Link>

          <div className="flex items-center gap-4 text-xs font-mono">
            <span className="hidden md:inline-flex items-center gap-1.5 text-[#526359]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
              RDS_MYSQL: CONNECTED
            </span>
            <Link
              href="/"
              className="text-[#526359] hover:text-[#1A2F25] px-3 py-1.5 border border-[#1A2F25]/15 transition-colors"
            >
              &larr; Return to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Main Center Module */}
      <main className="flex-1 flex items-center justify-center px-6 py-12 md:py-16">
        <div className="max-w-md w-full">
          {/* Header Label */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#1A2F25]/15 bg-white/70 text-[11px] font-mono tracking-widest uppercase mb-4 text-[#526359]">
              <span>ADMINISTRATIVE ACCESS // SESSION KEY</span>
            </div>
            <h1 className="font-editorial text-4xl sm:text-5xl text-[#1A2F25] font-normal leading-tight">
              Sign In to Axiomflow
            </h1>
            <p className="font-sans text-sm text-[#526359] mt-3 leading-relaxed">
              Authenticate using your registered administrator credentials to supervise deterministic runtime workflows.
            </p>
          </div>

          {/* Error Alert Box */}
          {errorMsg && (
            <div className="mb-6 p-4 border border-[#E06D53] bg-[#E06D53]/10 text-[#1A2F25] flex items-start gap-3">
              <svg className="w-5 h-5 text-[#E06D53] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="text-xs font-mono leading-relaxed">
                <strong className="block text-[#E06D53] uppercase mb-0.5">AUTHENTICATION_ERROR:</strong>
                {errorMsg}
              </div>
            </div>
          )}

          {/* Successful Authentication Screen */}
          {authSuccess ? (
            <div className="border border-[#1A2F25]/20 bg-white p-8 shadow-sm text-center">
              <div className="w-12 h-12 bg-emerald-600/10 border border-emerald-600/20 text-emerald-700 flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="square" strokeLinejoin="miter" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <span className="inline-block px-3 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 font-mono text-xs tracking-wider uppercase mb-3">
                SESSION_INITIALIZED
              </span>

              <h2 className="font-editorial text-2xl sm:text-3xl text-[#1A2F25] mb-2">
                Welcome back, {authSuccess.admin_name}
              </h2>

              <p className="font-sans text-xs text-[#526359] mb-6">
                Connected to <strong className="text-[#1A2F25]">{authSuccess.business_name || "Axiomflow Core"}</strong> with role <code className="bg-[#1A2F25]/5 px-1 font-mono text-[#E06D53]">{authSuccess.role}</code>.
              </p>

              <div className="border border-[#1A2F25]/10 bg-[#F8F6F2] p-4 font-mono text-xs text-left mb-6 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-[#526359]">User Key:</span>
                  <span className="text-[#1A2F25] font-semibold">{authSuccess.user_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#526359]">Email:</span>
                  <span className="text-[#1A2F25]">{authSuccess.admin_email}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Link
                  href="/"
                  className="w-full py-3 bg-[#E06D53] hover:bg-[#CD5B42] text-white font-sans text-xs tracking-wider uppercase font-semibold transition-all text-center"
                >
                  Enter Operational Dashboard &rarr;
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setAuthSuccess(null);
                    setPassword("");
                  }}
                  className="w-full py-2.5 border border-[#1A2F25]/20 hover:bg-[#F8F6F2] text-[#1A2F25] font-sans text-xs tracking-wider uppercase font-medium transition-all"
                >
                  Sign In to Different Account
                </button>
              </div>
            </div>
          ) : (
            /* Sign In Form */
            <div className="border border-[#1A2F25]/20 bg-white p-6 sm:p-8 shadow-sm">
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Email field */}
                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider text-[#1A2F25] mb-2">
                    Admin Email Address <span className="text-[#E06D53]">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="e.g. admin@apexsystems.io"
                    className="w-full px-4 py-3 bg-[#F8F6F2] border border-[#1A2F25]/20 text-sm font-sans text-[#1A2F25] placeholder:text-[#526359]/60 focus:outline-none focus:border-[#E06D53] focus:bg-white transition-all"
                  />
                  <p className="mt-1 font-mono text-[11px] text-[#526359]">
                    The official email registered during business setup.
                  </p>
                </div>

                {/* Password field with Hide/Show toggle */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block font-mono text-xs uppercase tracking-wider text-[#1A2F25]">
                      Account Password <span className="text-[#E06D53]">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-[11px] font-mono text-[#E06D53] hover:text-[#CD5B42] flex items-center gap-1 transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.75" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                          </svg>
                          <span>HIDE</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.75" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="1.75" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          <span>SHOW</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errorMsg) setErrorMsg(null);
                      }}
                      placeholder="••••••••••••"
                      className="w-full px-4 py-3 bg-[#F8F6F2] border border-[#1A2F25]/20 text-sm font-sans text-[#1A2F25] placeholder:text-[#526359]/60 focus:outline-none focus:border-[#E06D53] focus:bg-white transition-all pr-12"
                    />
                  </div>
                </div>

                {/* Sign In CTA button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 bg-[#E06D53] hover:bg-[#CD5B42] disabled:opacity-50 text-white font-sans text-xs tracking-wider uppercase font-semibold transition-all flex items-center justify-center gap-2 group shadow-sm mt-2"
                >
                  {isSubmitting ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                      <span>Verifying Credentials...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In</span>
                      <svg
                        className="w-3.5 h-3.5 stroke-white group-hover:translate-x-1 transition-transform"
                        fill="none"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="square" strokeLinejoin="miter" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              {/* Hyperlink to Signup */}
              <div className="mt-6 pt-6 border-t border-[#1A2F25]/10 text-center font-sans text-xs text-[#526359]">
                <span>Don&apos;t have account? </span>
                <Link
                  href="/signup"
                  className="font-semibold text-[#E06D53] hover:text-[#CD5B42] hover:underline transition-colors"
                >
                  Create now &rarr;
                </Link>
              </div>
            </div>
          )}

          {/* Security badge footer */}
          <div className="mt-8 text-center font-mono text-[11px] text-[#526359]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
              SECURE TLS // 256-BIT ENCRYPTION // RDS MYSQL
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1A2F25]/10 py-6 bg-[#F8F6F2]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-[#526359]">
          <div>
            &copy; 2026 Axiomflow System Runtime. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <Link href="/" className="hover:text-[#1A2F25]">
              Homepage
            </Link>
            <span>&bull;</span>
            <Link href="/signup" className="hover:text-[#1A2F25]">
              Sign Up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
