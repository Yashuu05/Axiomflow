"use client";

import { useState } from "react";
import Link from "next/link";
import AxiomflowLogo from "@/components/AxiomflowLogo";

interface AdminFormData {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  confirm_password: string;
  department: string;
  profession: string;
  mobile_no: string;
}

interface BusinessFormData {
  business_name: string;
  sector: string;
  gstin: string;
  cin: string;
  phone_no: string;
  email: string;
  website_url: string;
  location_address: string;
  time_zone: string;
  country: string;
  description: string;
}

const SECTOR_OPTIONS = [
  "IT & Software Services",
  "Financial Technology & Banking",
  "E-Commerce & Retail",
  "Healthcare & Life Sciences",
  "Logistics & Supply Chain",
  "Manufacturing & Industrial",
  "Consulting & Professional Services",
  "Education & EdTech",
  "Other"
];

export default function SignupPage() {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    business_id: number;
    user_id: string;
    business_name: string;
    admin_email: string;
  } | null>(null);

  // Admin Representative Form State
  const [adminData, setAdminData] = useState<AdminFormData>({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    confirm_password: "",
    department: "Executive & Operations",
    profession: "Managing Director / Admin",
    mobile_no: "",
  });

  // Business Profile Form State
  const [businessData, setBusinessData] = useState<BusinessFormData>({
    business_name: "",
    sector: "IT & Software Services",
    gstin: "",
    cin: "",
    phone_no: "",
    email: "",
    website_url: "",
    location_address: "",
    time_zone: "Asia/Kolkata",
    country: "INDIA",
    description: "",
  });

  // Handle Admin Input Change
  const handleAdminChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setAdminData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (errorMsg) setErrorMsg(null);
  };

  // Handle Business Input Change
  const handleBusinessChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setBusinessData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    if (errorMsg) setErrorMsg(null);
  };

  // Validate Step 1 (Admin)
  const validateStep1 = () => {
    if (!adminData.first_name.trim()) {
      setErrorMsg("Please provide your First Name.");
      return false;
    }
    if (!adminData.email.trim() || !adminData.email.includes("@")) {
      setErrorMsg("Please provide a valid official corporate Email address.");
      return false;
    }
    if (adminData.password.length < 6) {
      setErrorMsg("Password must contain at least 6 characters.");
      return false;
    }
    if (adminData.password !== adminData.confirm_password) {
      setErrorMsg("Password confirmation does not match.");
      return false;
    }
    return true;
  };

  // Proceed to Step 2
  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep1()) {
      setErrorMsg(null);
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Submit Final Registration (Step 2)
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!businessData.business_name.trim()) {
      setErrorMsg("Please provide the legal Business Name.");
      return;
    }
    if (!businessData.gstin.trim() || businessData.gstin.trim().length < 5) {
      setErrorMsg("Please provide a valid statutory GSTIN number (e.g. 29ABCDE1234F1Z5).");
      return;
    }
    if (!businessData.cin.trim() || businessData.cin.trim().length < 5) {
      setErrorMsg("Please provide a valid Corporate Identification Number (CIN).");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

    const payload = {
      admin: {
        first_name: adminData.first_name.trim(),
        last_name: adminData.last_name.trim() || null,
        email: adminData.email.trim().toLowerCase(),
        password: adminData.password,
        department: adminData.department.trim() || "Executive",
        profession: adminData.profession.trim() || "Admin",
        mobile_no: adminData.mobile_no.trim() || null,
      },
      business: {
        business_name: businessData.business_name.trim(),
        sector: businessData.sector.trim() || "General Services",
        gstin: businessData.gstin.trim().toUpperCase(),
        cin: businessData.cin.trim().toUpperCase(),
        phone_no: businessData.phone_no.trim() || null,
        email: businessData.email.trim() ? businessData.email.trim().toLowerCase() : null,
        website_url: businessData.website_url.trim() || null,
        location_address: businessData.location_address.trim() || null,
        address: businessData.location_address.trim() || null,
        time_zone: businessData.time_zone.trim() || "Asia/Kolkata",
        country: businessData.country.trim() || "INDIA",
        description: businessData.description.trim() || null,
      }
    };

    try {
      const response = await fetch(`${apiBase}/api/register-business`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Registration failed. Please check your credentials.");
      }

      const sessionObj = {
        admin_name: `${adminData.first_name} ${adminData.last_name}`.trim() || data.business_name,
        admin_email: data.admin_email,
        business_name: data.business_name,
        role: "ADMINISTRATOR",
        user_id: data.user_id,
        business_id: data.business_id,
      };
      try {
        localStorage.setItem("axiomflow_session", JSON.stringify(sessionObj));
      } catch {
        // ignore
      }

      setSuccessData({
        business_id: data.business_id,
        user_id: data.user_id,
        business_name: data.business_name,
        admin_email: data.admin_email,
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("Failed to communicate with the Axiomflow API service. Verify backend is running.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F6F2] text-[#1A2F25] selection:bg-[#E06D53] selection:text-white flex flex-col justify-between">
      {/* Top System Ribbon */}
      <header className="border-b border-[#1A2F25]/10 bg-[#F8F6F2]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group" aria-label="Axiomflow Home">
            <AxiomflowLogo variant="full" size={28} />
          </Link>

          <div className="flex items-center gap-4 text-xs font-mono">
            <Link
              href="/"
              className="text-[#526359] hover:text-[#1A2F25] px-3.5 py-1.5 border border-[#1A2F25]/15 bg-white/60 hover:bg-white transition-colors shadow-2xs"
            >
              &larr; Return to Home
            </Link>
          </div>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="w-full bg-[#1A2F25]/10 h-1 relative overflow-hidden">
          <div
            className="h-full bg-[#E06D53] transition-all duration-500 ease-out"
            style={{ width: successData ? "100%" : currentStep === 1 ? "50%" : "95%" }}
          />
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 md:py-16">
        {/* Step Indicator Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono tracking-widest uppercase text-[#526359]">
              BUSINESS REGISTRATION WIZARD
            </span>
            <span className="text-xs font-mono text-[#E06D53] font-semibold">
              {successData ? "STATUS: PROVISIONED" : `STAGE 0${currentStep} / 02`}
            </span>
          </div>

          <h1 className="font-editorial text-4xl sm:text-5xl text-[#1A2F25] font-normal leading-tight">
            {successData
              ? "Organization Profile Provisioned."
              : currentStep === 1
              ? "Initialize Administrative Representative."
              : "Register Statutory Business Identity."}
          </h1>

          <p className="font-sans text-sm sm:text-base text-[#526359] mt-3 max-w-3xl leading-relaxed">
            {successData
              ? "Your corporate credentials and primary administrative representative have been successfully written to the Axiomflow core registry."
              : currentStep === 1
              ? "NOTE: Admin account has full control over system having access to run workflows, connect google services (like Gmail, Calendar, Sheets etc), logs and audit and overall system controls."
              : "Supply legal identity credentials, statutory GSTIN/CIN records, location address, and communication endpoints for relational business pairing."}
          </p>

          {/* Stepper Navigation Pills */}
          {!successData && (
            <div className="grid grid-cols-2 gap-3 mt-8">
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 2) setCurrentStep(1);
                }}
                className={`flex items-center gap-3 p-3.5 border text-left transition-all cursor-pointer ${
                  currentStep === 1
                    ? "border-[#E06D53] bg-white shadow-xs"
                    : "border-[#1A2F25]/15 bg-white/50 opacity-80 hover:opacity-100"
                }`}
              >
                <div
                  className={`w-6 h-6 flex items-center justify-center font-mono text-xs font-bold ${
                    currentStep === 1 ? "bg-[#E06D53] text-white" : "bg-[#1A2F25]/10 text-[#1A2F25]"
                  }`}
                >
                  01
                </div>
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-[#1A2F25] font-semibold">
                    Admin Account
                  </div>
                  <div className="text-[11px] text-[#526359]">Representative &amp; Credentials</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (validateStep1()) setCurrentStep(2);
                }}
                className={`flex items-center gap-3 p-3.5 border text-left transition-all cursor-pointer ${
                  currentStep === 2
                    ? "border-[#E06D53] bg-white shadow-xs"
                    : "border-[#1A2F25]/15 bg-white/50 opacity-80"
                }`}
              >
                <div
                  className={`w-6 h-6 flex items-center justify-center font-mono text-xs font-bold ${
                    currentStep === 2 ? "bg-[#E06D53] text-white" : "bg-[#1A2F25]/10 text-[#1A2F25]"
                  }`}
                >
                  02
                </div>
                <div>
                  <div className="text-xs font-mono uppercase tracking-wider text-[#1A2F25] font-semibold">
                    Business Profile
                  </div>
                  <div className="text-[11px] text-[#526359]">Entity, Location &amp; GSTIN / CIN</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* Error Alert Banner */}
        {errorMsg && (
          <div className="mb-8 p-4 border border-[#E06D53] bg-[#E06D53]/10 text-[#1A2F25] flex items-start gap-3 animate-shake">
            <svg className="w-5 h-5 text-[#E06D53] shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="text-xs font-mono leading-relaxed">
              <strong className="block text-[#E06D53] uppercase mb-0.5">VALIDATION_FAULT:</strong>
              {errorMsg}
            </div>
          </div>
        )}

        {/* Success Confirmation Card */}
        {successData ? (
          <div className="border border-[#1A2F25]/20 bg-white p-8 md:p-12 shadow-sm relative overflow-hidden">
            <div className="w-12 h-12 bg-emerald-600/10 border border-emerald-600/20 text-emerald-700 flex items-center justify-center mb-6">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="square" strokeLinejoin="miter" d="M5 13l4 4L19 7" />
              </svg>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 font-mono text-xs tracking-wider uppercase mb-4">
              PROVISIONING_COMPLETE // SYSTEM_ACTIVE
            </div>

            <h2 className="font-editorial text-3xl sm:text-4xl text-[#1A2F25] mb-4">
              Welcome to Axiomflow, {successData.business_name}.
            </h2>

            <p className="text-sm font-sans text-[#526359] leading-relaxed mb-8 max-w-xl">
              Your administrative credentials have been bound to database entity record{" "}
              <code className="bg-[#1A2F25]/5 px-1.5 py-0.5 font-mono text-[#1A2F25]">
                business_id: #{successData.business_id}
              </code>
              . You now hold administrative access to deploy deterministic agent routines.
            </p>

            <div className="border border-[#1A2F25]/10 bg-[#F8F6F2] p-6 mb-8 font-mono text-xs space-y-2">
              <div className="flex justify-between border-b border-[#1A2F25]/10 pb-2">
                <span className="text-[#526359]">Entity Identifier:</span>
                <span className="text-[#1A2F25] font-semibold">#{successData.business_id}</span>
              </div>
              <div className="flex justify-between border-b border-[#1A2F25]/10 pb-2">
                <span className="text-[#526359]">Admin User Key:</span>
                <span className="text-[#1A2F25] font-semibold">{successData.user_id}</span>
              </div>
              <div className="flex justify-between border-b border-[#1A2F25]/10 pb-2">
                <span className="text-[#526359]">Registered Organization:</span>
                <span className="text-[#1A2F25] font-semibold">{successData.business_name}</span>
              </div>
              <div className="flex justify-between pt-1">
                <span className="text-[#526359]">Admin Email Address:</span>
                <span className="text-[#1A2F25] font-semibold">{successData.admin_email}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/dashboard"
                className="px-6 py-3.5 bg-[#E06D53] hover:bg-[#CD5B42] text-white font-sans text-xs tracking-wider uppercase font-semibold transition-all text-center"
              >
                Launch Dashboard Runtime &rarr;
              </Link>
              <button
                type="button"
                onClick={() => {
                  setSuccessData(null);
                  setCurrentStep(1);
                  setAdminData({
                    first_name: "",
                    last_name: "",
                    email: "",
                    password: "",
                    confirm_password: "",
                    department: "Executive & Operations",
                    profession: "Managing Director / Admin",
                    mobile_no: "",
                  });
                  setBusinessData({
                    business_name: "",
                    sector: "IT & Software Services",
                    gstin: "",
                    cin: "",
                    phone_no: "",
                    email: "",
                    website_url: "",
                    location_address: "",
                    time_zone: "Asia/Kolkata",
                    country: "INDIA",
                    description: "",
                  });
                }}
                className="px-6 py-3.5 border border-[#1A2F25]/20 hover:bg-white text-[#1A2F25] font-sans text-xs tracking-wider uppercase font-medium transition-all text-center cursor-pointer"
              >
                Register Another Entity
              </button>
            </div>
          </div>
        ) : (
          /* Multi-Step Registration Form */
          <div className="border border-[#1A2F25]/20 bg-white p-6 sm:p-10 md:p-12 shadow-sm">
            {/* Step 1: Admin Representative Setup */}
            {currentStep === 1 && (
              <form onSubmit={handleNextStep} className="space-y-6">
                <div className="border-b border-[#1A2F25]/10 pb-4 mb-6">
                  <span className="font-mono text-xs text-[#E06D53] tracking-widest uppercase block mb-1">
                    SECTION 01 // IDENTITY &amp; AUTHENTICATION
                  </span>
                  <h2 className="font-editorial text-2xl text-[#1A2F25]">
                    Administrative Representative Details
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-[#1A2F25] mb-2">
                      First Name <span className="text-[#E06D53]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      name="first_name"
                      value={adminData.first_name}
                      onChange={handleAdminChange}
                      placeholder="e.g. Yash"
                      className="w-full px-4 py-3 bg-[#F8F6F2] border border-[#1A2F25]/20 text-sm font-sans text-[#1A2F25] placeholder:text-[#526359]/60 focus:outline-none focus:border-[#E06D53] focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-[#1A2F25] mb-2">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={adminData.last_name}
                      onChange={handleAdminChange}
                      placeholder="e.g. Sharma"
                      className="w-full px-4 py-3 bg-[#F8F6F2] border border-[#1A2F25]/20 text-sm font-sans text-[#1A2F25] placeholder:text-[#526359]/60 focus:outline-none focus:border-[#E06D53] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-[#1A2F25] mb-2">
                      Official Admin Email <span className="text-[#E06D53]">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      name="email"
                      value={adminData.email}
                      onChange={handleAdminChange}
                      placeholder="e.g. admin@axiomflow.ai"
                      className="w-full px-4 py-3 bg-[#F8F6F2] border border-[#1A2F25]/20 text-sm font-sans text-[#1A2F25] placeholder:text-[#526359]/60 focus:outline-none focus:border-[#E06D53] focus:bg-white transition-all"
                    />
                    <p className="mt-1 font-mono text-[11px] text-[#526359]">
                      Will serve as the primary supervisory login identifier.
                    </p>
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-[#1A2F25] mb-2">
                      Mobile Contact Number
                    </label>
                    <input
                      type="tel"
                      name="mobile_no"
                      value={adminData.mobile_no}
                      onChange={handleAdminChange}
                      placeholder="e.g. +91 98765 43210"
                      className="w-full px-4 py-3 bg-[#F8F6F2] border border-[#1A2F25]/20 text-sm font-sans text-[#1A2F25] placeholder:text-[#526359]/60 focus:outline-none focus:border-[#E06D53] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-[#1A2F25] mb-2">
                      Department Assignment
                    </label>
                    <input
                      type="text"
                      name="department"
                      value={adminData.department}
                      onChange={handleAdminChange}
                      placeholder="e.g. Executive Operations / IT"
                      className="w-full px-4 py-3 bg-[#F8F6F2] border border-[#1A2F25]/20 text-sm font-sans text-[#1A2F25] placeholder:text-[#526359]/60 focus:outline-none focus:border-[#E06D53] focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-[#1A2F25] mb-2">
                      Profession / Role Title
                    </label>
                    <input
                      type="text"
                      name="profession"
                      value={adminData.profession}
                      onChange={handleAdminChange}
                      placeholder="e.g. VP Operations / CTO"
                      className="w-full px-4 py-3 bg-[#F8F6F2] border border-[#1A2F25]/20 text-sm font-sans text-[#1A2F25] placeholder:text-[#526359]/60 focus:outline-none focus:border-[#E06D53] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-[#1A2F25]/10">
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-[#1A2F25] mb-2">
                      Admin Password <span className="text-[#E06D53]">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      name="password"
                      value={adminData.password}
                      onChange={handleAdminChange}
                      placeholder="Minimum 6 characters"
                      className="w-full px-4 py-3 bg-[#F8F6F2] border border-[#1A2F25]/20 text-sm font-sans text-[#1A2F25] placeholder:text-[#526359]/60 focus:outline-none focus:border-[#E06D53] focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-[#1A2F25] mb-2">
                      Confirm Password <span className="text-[#E06D53]">*</span>
                    </label>
                    <input
                      type="password"
                      required
                      name="confirm_password"
                      value={adminData.confirm_password}
                      onChange={handleAdminChange}
                      placeholder="Re-enter password"
                      className="w-full px-4 py-3 bg-[#F8F6F2] border border-[#1A2F25]/20 text-sm font-sans text-[#1A2F25] placeholder:text-[#526359]/60 focus:outline-none focus:border-[#E06D53] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end pt-6 border-t border-[#1A2F25]/10">
                  <button
                    type="submit"
                    className="px-8 py-3.5 bg-[#E06D53] hover:bg-[#CD5B42] text-white font-sans text-xs tracking-wider uppercase font-semibold transition-all flex items-center gap-2 group cursor-pointer shadow-xs"
                  >
                    <span>Proceed to Business Profile</span>
                    <svg
                      className="w-3.5 h-3.5 stroke-white group-hover:translate-x-1 transition-transform"
                      fill="none"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="square" strokeLinejoin="miter" d="M5 12h14m-6-6l6 6-6 6" />
                    </svg>
                  </button>
                </div>
              </form>
            )}

            {/* Step 2: Business & Statutory Profile */}
            {currentStep === 2 && (
              <form onSubmit={handleFinalSubmit} className="space-y-6">
                <div className="border-b border-[#1A2F25]/10 pb-4 mb-6">
                  <span className="font-mono text-xs text-[#E06D53] tracking-widest uppercase block mb-1">
                    SECTION 02 // STATUTORY &amp; CORPORATE DETAILS
                  </span>
                  <h2 className="font-editorial text-2xl text-[#1A2F25]">
                    Business Profile &amp; Statutory Credentials
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-[#1A2F25] mb-2">
                      Legal Business / Company Name <span className="text-[#E06D53]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      name="business_name"
                      value={businessData.business_name}
                      onChange={handleBusinessChange}
                      placeholder="e.g. Axiom Logistics Solutions Pvt Ltd"
                      className="w-full px-4 py-3 bg-[#F8F6F2] border border-[#1A2F25]/20 text-sm font-sans text-[#1A2F25] placeholder:text-[#526359]/60 focus:outline-none focus:border-[#E06D53] focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-[#1A2F25] mb-2">
                      Industry Sector
                    </label>
                    <select
                      name="sector"
                      value={businessData.sector}
                      onChange={handleBusinessChange}
                      className="w-full px-4 py-3 bg-[#F8F6F2] border border-[#1A2F25]/20 text-sm font-sans text-[#1A2F25] focus:outline-none focus:border-[#E06D53] focus:bg-white transition-all cursor-pointer"
                    >
                      {SECTOR_OPTIONS.map(sec => (
                        <option key={sec} value={sec}>{sec}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-[#1A2F25] mb-2">
                      GSTIN (Goods &amp; Services Tax ID) <span className="text-[#E06D53]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      name="gstin"
                      value={businessData.gstin}
                      onChange={handleBusinessChange}
                      placeholder="e.g. 29ABCDE1234F1Z5"
                      className="w-full px-4 py-3 bg-[#F8F6F2] border border-[#1A2F25]/20 font-mono text-sm text-[#1A2F25] uppercase placeholder:text-[#526359]/60 focus:outline-none focus:border-[#E06D53] focus:bg-white transition-all"
                    />
                    <p className="mt-1 font-mono text-[11px] text-[#526359]">
                      15-character statutory tax registration code.
                    </p>
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-[#1A2F25] mb-2">
                      CIN (Corporate Identification Number) <span className="text-[#E06D53]">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      name="cin"
                      value={businessData.cin}
                      onChange={handleBusinessChange}
                      placeholder="e.g. U72200KA2020PTC134567"
                      className="w-full px-4 py-3 bg-[#F8F6F2] border border-[#1A2F25]/20 font-mono text-sm text-[#1A2F25] uppercase placeholder:text-[#526359]/60 focus:outline-none focus:border-[#E06D53] focus:bg-white transition-all"
                    />
                    <p className="mt-1 font-mono text-[11px] text-[#526359]">
                      21-character MCA corporate registration code.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-[#1A2F25] mb-2">
                      Corporate Phone / PBX
                    </label>
                    <input
                      type="tel"
                      name="phone_no"
                      value={businessData.phone_no}
                      onChange={handleBusinessChange}
                      placeholder="e.g. +91 80 4123 4567"
                      className="w-full px-4 py-3 bg-[#F8F6F2] border border-[#1A2F25]/20 text-sm font-sans text-[#1A2F25] placeholder:text-[#526359]/60 focus:outline-none focus:border-[#E06D53] focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-[#1A2F25] mb-2">
                      Corporate Official Email
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={businessData.email}
                      onChange={handleBusinessChange}
                      placeholder="e.g. contact@axiomlogistics.in"
                      className="w-full px-4 py-3 bg-[#F8F6F2] border border-[#1A2F25]/20 text-sm font-sans text-[#1A2F25] placeholder:text-[#526359]/60 focus:outline-none focus:border-[#E06D53] focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider text-[#1A2F25] mb-2">
                    Official Website URL
                  </label>
                  <input
                    type="url"
                    name="website_url"
                    value={businessData.website_url}
                    onChange={handleBusinessChange}
                    placeholder="e.g. https://www.axiomlogistics.in"
                    className="w-full px-4 py-3 bg-[#F8F6F2] border border-[#1A2F25]/20 text-sm font-sans text-[#1A2F25] placeholder:text-[#526359]/60 focus:outline-none focus:border-[#E06D53] focus:bg-white transition-all"
                  />
                </div>

                {/* New Field A: Location Address */}
                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider text-[#1A2F25] mb-2">
                    Location Address
                  </label>
                  <textarea
                    rows={2}
                    name="location_address"
                    value={businessData.location_address}
                    onChange={handleBusinessChange}
                    placeholder="e.g. SR. NO 40/1 Lane No. 3, Dattanagar, Ambegaon B.K, Pune 411046"
                    className="w-full px-4 py-3 bg-[#F8F6F2] border border-[#1A2F25]/20 text-sm font-sans text-[#1A2F25] placeholder:text-[#526359]/60 focus:outline-none focus:border-[#E06D53] focus:bg-white transition-all resize-none"
                  />
                  <p className="mt-1 font-mono text-[11px] text-[#526359]">
                    Registered statutory or primary corporate facility address.
                  </p>
                </div>

                {/* New Fields B & C: Time Zone and Country */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-[#1A2F25] mb-2">
                      Time Zone
                    </label>
                    <input
                      type="text"
                      name="time_zone"
                      value={businessData.time_zone}
                      onChange={handleBusinessChange}
                      placeholder="e.g. Asia/Kolkata"
                      className="w-full px-4 py-3 bg-[#F8F6F2] border border-[#1A2F25]/20 text-sm font-sans text-[#1A2F25] placeholder:text-[#526359]/60 focus:outline-none focus:border-[#E06D53] focus:bg-white transition-all"
                    />
                    <p className="mt-1 font-mono text-[11px] text-[#526359]">
                      Operating business time zone (e.g. Asia/Kolkata, UTC, America/New_York).
                    </p>
                  </div>

                  <div>
                    <label className="block font-mono text-xs uppercase tracking-wider text-[#1A2F25] mb-2">
                      Country
                    </label>
                    <input
                      type="text"
                      name="country"
                      value={businessData.country}
                      onChange={handleBusinessChange}
                      placeholder="e.g. INDIA"
                      className="w-full px-4 py-3 bg-[#F8F6F2] border border-[#1A2F25]/20 text-sm font-sans text-[#1A2F25] placeholder:text-[#526359]/60 focus:outline-none focus:border-[#E06D53] focus:bg-white transition-all"
                    />
                    <p className="mt-1 font-mono text-[11px] text-[#526359]">
                      Country of legal entity incorporation (e.g. INDIA, United States).
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block font-mono text-xs uppercase tracking-wider text-[#1A2F25] mb-2">
                    Business Scope &amp; Brief Description
                  </label>
                  <textarea
                    rows={3}
                    name="description"
                    value={businessData.description}
                    onChange={handleBusinessChange}
                    placeholder="Brief description of operations, target workflows, and automated service nodes..."
                    className="w-full px-4 py-3 bg-[#F8F6F2] border border-[#1A2F25]/20 text-sm font-sans text-[#1A2F25] placeholder:text-[#526359]/60 focus:outline-none focus:border-[#E06D53] focus:bg-white transition-all resize-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-[#1A2F25]/10">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep(1);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="px-6 py-3.5 border border-[#1A2F25]/20 hover:bg-[#F8F6F2] text-[#1A2F25] font-sans text-xs tracking-wider uppercase font-semibold transition-all cursor-pointer"
                  >
                    &larr; Back to Admin Step
                  </button>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-3.5 bg-[#E06D53] hover:bg-[#CD5B42] disabled:opacity-50 text-white font-sans text-xs tracking-wider uppercase font-semibold transition-all flex items-center gap-2 group shadow-sm cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>Provisioning Organization...</span>
                      </>
                    ) : (
                      <>
                        <span>Complete Registration</span>
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
                </div>
              </form>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[#1A2F25]/10 py-6 bg-[#F8F6F2]">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-[#526359]">
          <div>
            &copy; 2026 Axiomflow System Runtime. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
