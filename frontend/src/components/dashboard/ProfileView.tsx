"use client";

import React, { useState, useEffect } from "react";

interface ProfileViewProps {
  onBackToWorkflow?: () => void;
  userId?: string;
}

interface BusinessProfileFields {
  id?: number;
  business_name: string;
  sector: string;
  gstin: string;
  cin: string;
  phone_no: string;
  email: string;
  website_url: string;
  address: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

interface AdminProfileFields {
  user_id?: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile_no: string;
  department: string;
  profession: string;
  role: string;
  business_id?: number;
  created_at?: string;
  updated_at?: string;
}

export default function ProfileView({
  onBackToWorkflow,
  userId: propUserId,
}: ProfileViewProps) {
  const [currentUserId, setCurrentUserId] = useState<string>(
    propUserId || "usr_72b30e7cd49e49e5"
  );
  const [businessId, setBusinessId] = useState<number | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [savingBusiness, setSavingBusiness] = useState<boolean>(false);
  const [savingAdmin, setSavingAdmin] = useState<boolean>(false);
  const [savingAll, setSavingAll] = useState<boolean>(false);

  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Business Section State
  const [businessData, setBusinessData] = useState<BusinessProfileFields>({
    business_name: "",
    sector: "",
    gstin: "",
    cin: "",
    phone_no: "",
    email: "",
    website_url: "",
    address: "",
    description: "",
  });

  // Admin Section State
  const [adminData, setAdminData] = useState<AdminProfileFields>({
    first_name: "",
    last_name: "",
    email: "",
    mobile_no: "",
    department: "",
    profession: "",
    role: "admin",
  });

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Auto-dismiss success message after exactly 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Load initial profile from database
  useEffect(() => {
    let resolvedUserId = propUserId || "usr_72b30e7cd49e49e5";
    try {
      const stored = localStorage.getItem("axiomflow_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.user_id) {
          resolvedUserId = parsed.user_id;
          setCurrentUserId(parsed.user_id);
        }
        if (parsed.business_id) {
          setBusinessId(parsed.business_id);
        }
      }
    } catch {
      // Use fallback
    }

    setLoading(true);
    fetch(`${API_BASE}/api/profile/full/${resolvedUserId}`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || `Server returned status ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.business) {
          setBusinessData({
            id: data.business.id,
            business_name: data.business.business_name || "",
            sector: data.business.sector || "",
            gstin: data.business.gstin || "",
            cin: data.business.cin || "",
            phone_no: data.business.phone_no || "",
            email: data.business.email || "",
            website_url: data.business.website_url || "",
            address: data.business.address || "",
            description: data.business.description || "",
            created_at: data.business.created_at || "",
            updated_at: data.business.updated_at || "",
          });
          if (data.business.id) {
            setBusinessId(data.business.id);
          }
        }

        if (data.admin) {
          setAdminData({
            user_id: data.admin.user_id,
            first_name: data.admin.first_name || "",
            last_name: data.admin.last_name || "",
            email: data.admin.email || "",
            mobile_no: data.admin.mobile_no || "",
            department: data.admin.department || "",
            profession: data.admin.profession || "",
            role: data.admin.role || "admin",
            business_id: data.admin.business_id,
            created_at: data.admin.created_at || "",
            updated_at: data.admin.updated_at || "",
          });
          if (data.admin.business_id && !businessId) {
            setBusinessId(data.admin.business_id);
          }
        }
        setErrorMessage(null);
      })
      .catch((err: any) => {
        console.error("Failed to fetch profile details:", err);
        setErrorMessage(`Could not load profile from database: ${err.message}`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [API_BASE, propUserId]);

  // Sync updated business name to localStorage session so navbar reflects it
  const syncSessionCache = (newBizName?: string, newAdminEmail?: string) => {
    try {
      const stored = localStorage.getItem("axiomflow_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (newBizName) parsed.business_name = newBizName;
        if (newAdminEmail) parsed.admin_email = newAdminEmail;
        localStorage.setItem("axiomflow_session", JSON.stringify(parsed));
      }
    } catch {
      // Ignore
    }
  };

  // 1. Update ONLY Business Profile
  const handleUpdateBusiness = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingBusiness(true);
    setErrorMessage(null);

    try {
      const payload = {
        user_id: currentUserId,
        business_id: businessId || undefined,
        business: {
          business_name: businessData.business_name,
          sector: businessData.sector,
          gstin: businessData.gstin,
          cin: businessData.cin,
          phone_no: businessData.phone_no,
          email: businessData.email,
          website_url: businessData.website_url,
          address: businessData.address,
          description: businessData.description,
        },
      };

      const res = await fetch(`${API_BASE}/api/profile/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result.detail || `Update failed with HTTP ${res.status}`);
      }

      setSuccessMessage("Successfully Updated");
      syncSessionCache(businessData.business_name);
    } catch (err: any) {
      console.error("Business profile update error:", err);
      setErrorMessage(`Failed to update business profile: ${err.message}`);
    } finally {
      setSavingBusiness(false);
    }
  };

  // 2. Update ONLY Admin Profile
  const handleUpdateAdmin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingAdmin(true);
    setErrorMessage(null);

    try {
      const payload = {
        user_id: currentUserId,
        business_id: businessId || undefined,
        admin: {
          first_name: adminData.first_name,
          last_name: adminData.last_name,
          email: adminData.email,
          mobile_no: adminData.mobile_no,
          department: adminData.department,
          profession: adminData.profession,
        },
      };

      const res = await fetch(`${API_BASE}/api/profile/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result.detail || `Update failed with HTTP ${res.status}`);
      }

      setSuccessMessage("Successfully Updated");
      syncSessionCache(undefined, adminData.email);
    } catch (err: any) {
      console.error("Admin profile update error:", err);
      setErrorMessage(`Failed to update admin profile: ${err.message}`);
    } finally {
      setSavingAdmin(false);
    }
  };

  // 3. Update BOTH Profiles (Master update)
  const handleUpdateAll = async () => {
    setSavingAll(true);
    setErrorMessage(null);

    try {
      const payload = {
        user_id: currentUserId,
        business_id: businessId || undefined,
        business: {
          business_name: businessData.business_name,
          sector: businessData.sector,
          gstin: businessData.gstin,
          cin: businessData.cin,
          phone_no: businessData.phone_no,
          email: businessData.email,
          website_url: businessData.website_url,
          address: businessData.address,
          description: businessData.description,
        },
        admin: {
          first_name: adminData.first_name,
          last_name: adminData.last_name,
          email: adminData.email,
          mobile_no: adminData.mobile_no,
          department: adminData.department,
          profession: adminData.profession,
        },
      };

      const res = await fetch(`${API_BASE}/api/profile/update`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(result.detail || `Update failed with HTTP ${res.status}`);
      }

      setSuccessMessage("Successfully Updated Profile");
      syncSessionCache(businessData.business_name, adminData.email);
    } catch (err: any) {
      console.error("Profile update error:", err);
      setErrorMessage(`Failed to update profile: ${err.message}`);
    } finally {
      setSavingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20">
        <div className="w-10 h-10 border-3 border-[#E06D53] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="font-mono text-sm text-[#526359]">
          Retrieving profile records from axiomflow_db...
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col max-w-6xl w-full mx-auto pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-[#1A2F25]/10 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-editorial text-3xl sm:text-4xl text-[#1A2F25] font-normal tracking-tight">
              Organization & Profile Management
            </h1>
            <span className="text-[11px] font-mono uppercase px-2.5 py-1 rounded bg-[#E06D53]/15 text-[#E06D53] font-semibold border border-[#E06D53]/30">
              AWS RDS MySQL
            </span>
          </div>
          <p className="font-sans text-xs sm:text-sm text-[#526359] mt-1.5">
            Modify registered business details and administrative account parameters in real time.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {onBackToWorkflow && (
            <button
              type="button"
              onClick={onBackToWorkflow}
              className="px-4 py-2 bg-[#F8F6F2] hover:bg-[#EBE7DF] text-[#1A2F25] text-xs font-mono rounded-full border border-[#1A2F25]/15 transition-all cursor-pointer"
            >
              ← Back to Workflow
            </button>
          )}

          <button
            type="button"
            onClick={handleUpdateAll}
            disabled={savingAll || savingBusiness || savingAdmin}
            className="px-6 py-2.5 bg-[#E06D53] hover:bg-[#CD5B42] disabled:opacity-50 text-white font-sans text-xs uppercase tracking-wider font-semibold rounded-full shadow-md transition-all cursor-pointer flex items-center gap-2"
          >
            {savingAll ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving All...</span>
              </>
            ) : (
              <span>Update Profile</span>
            )}
          </button>
        </div>
      </div>

      {/* Floating Alerts Container */}
      <div className="sticky top-2 z-40 mb-6 space-y-3">
        {/* 5-Second Dismissing Success Alert */}
        {successMessage && (
          <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm">{successMessage}</p>
                <p className="text-xs text-emerald-700 font-mono mt-0.5">
                  Database changes committed to axiomflow_db (Dismissing in 5s)
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-900 text-sm font-mono px-2 py-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Failed Error Alert */}
        {errorMessage && (
          <div className="p-4 bg-red-50 border border-red-300 text-red-900 rounded-2xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-sm">Failed to update database</p>
                <p className="text-xs text-red-700 font-mono mt-0.5">{errorMessage}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setErrorMessage(null)}
              className="text-red-700 hover:text-red-900 text-sm font-mono px-2 py-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* Two Dedicated Sections Grid */}
      <div className="space-y-8">
        {/* ==================================================================== */}
        {/* SECTION 1: BUSINESS PROFILE (business_profile table)                 */}
        {/* ==================================================================== */}
        <section className="bg-white border border-[#E06D53]/30 rounded-3xl p-6 sm:p-8 shadow-sm transition-all hover:shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-6 border-b border-[#1A2F25]/10 gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#E06D53]" />
                <h2 className="font-editorial text-2xl text-[#1A2F25]">Business Profile</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1A2F25]/5 text-[#1A2F25] font-semibold border border-[#1A2F25]/10">
                  table: business_profile
                </span>
              </div>
              <p className="font-sans text-xs text-[#526359] mt-1">
                Update statutory entity records, trade identities, and corporate communications.
              </p>
            </div>

            <button
              type="button"
              onClick={handleUpdateBusiness}
              disabled={savingBusiness || savingAll}
              className="px-5 py-2 bg-[#1A2F25] hover:bg-[#2A4537] disabled:opacity-50 text-white font-sans text-xs uppercase tracking-wider font-semibold rounded-full transition-all cursor-pointer self-start sm:self-auto shrink-0 shadow-xs flex items-center gap-2"
            >
              {savingBusiness ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update Business Profile</span>
              )}
            </button>
          </div>

          <form onSubmit={handleUpdateBusiness} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Business Name */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#526359] mb-1.5 font-semibold">
                  Business Name *
                </label>
                <input
                  type="text"
                  value={businessData.business_name}
                  onChange={(e) =>
                    setBusinessData({ ...businessData, business_name: e.target.value })
                  }
                  required
                  placeholder="e.g. Axiomflow Pvt Ltd"
                  className="w-full px-4 py-2.5 bg-[#F8F6F2] border border-[#1A2F25]/15 focus:border-[#E06D53] focus:bg-white rounded-xl text-sm font-sans text-[#1A2F25] transition-all outline-none"
                />
              </div>

              {/* Industry Sector */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#526359] mb-1.5 font-semibold">
                  Industry Sector
                </label>
                <input
                  type="text"
                  value={businessData.sector}
                  onChange={(e) =>
                    setBusinessData({ ...businessData, sector: e.target.value })
                  }
                  placeholder="e.g. IT & Software Services"
                  className="w-full px-4 py-2.5 bg-[#F8F6F2] border border-[#1A2F25]/15 focus:border-[#E06D53] focus:bg-white rounded-xl text-sm font-sans text-[#1A2F25] transition-all outline-none"
                />
              </div>

              {/* GSTIN */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#526359] mb-1.5 font-semibold">
                  GSTIN
                </label>
                <input
                  type="text"
                  value={businessData.gstin}
                  onChange={(e) =>
                    setBusinessData({ ...businessData, gstin: e.target.value })
                  }
                  placeholder="e.g. 27ABCDE1234F1Z5"
                  className="w-full px-4 py-2.5 bg-[#F8F6F2] border border-[#1A2F25]/15 focus:border-[#E06D53] focus:bg-white rounded-xl text-sm font-sans text-[#1A2F25] transition-all outline-none"
                />
              </div>

              {/* CIN */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#526359] mb-1.5 font-semibold">
                  Corporate Identification Number (CIN)
                </label>
                <input
                  type="text"
                  value={businessData.cin}
                  onChange={(e) =>
                    setBusinessData({ ...businessData, cin: e.target.value })
                  }
                  placeholder="e.g. U12345MH2020PTC098765"
                  className="w-full px-4 py-2.5 bg-[#F8F6F2] border border-[#1A2F25]/15 focus:border-[#E06D53] focus:bg-white rounded-xl text-sm font-sans text-[#1A2F25] transition-all outline-none"
                />
              </div>

              {/* Telephone */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#526359] mb-1.5 font-semibold">
                  Official Telephone
                </label>
                <input
                  type="text"
                  value={businessData.phone_no}
                  onChange={(e) =>
                    setBusinessData({ ...businessData, phone_no: e.target.value })
                  }
                  placeholder="e.g. +919850665111"
                  className="w-full px-4 py-2.5 bg-[#F8F6F2] border border-[#1A2F25]/15 focus:border-[#E06D53] focus:bg-white rounded-xl text-sm font-sans text-[#1A2F25] transition-all outline-none"
                />
              </div>

              {/* Official Business Email */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#526359] mb-1.5 font-semibold">
                  Business Email
                </label>
                <input
                  type="email"
                  value={businessData.email}
                  onChange={(e) =>
                    setBusinessData({ ...businessData, email: e.target.value })
                  }
                  placeholder="e.g. contact@axiomflow.ai"
                  className="w-full px-4 py-2.5 bg-[#F8F6F2] border border-[#1A2F25]/15 focus:border-[#E06D53] focus:bg-white rounded-xl text-sm font-sans text-[#1A2F25] transition-all outline-none"
                />
              </div>

              {/* Website URL */}
              <div className="md:col-span-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#526359] mb-1.5 font-semibold">
                  Corporate Website URL
                </label>
                <input
                  type="url"
                  value={businessData.website_url}
                  onChange={(e) =>
                    setBusinessData({ ...businessData, website_url: e.target.value })
                  }
                  placeholder="e.g. https://www.axiomflow.ai"
                  className="w-full px-4 py-2.5 bg-[#F8F6F2] border border-[#1A2F25]/15 focus:border-[#E06D53] focus:bg-white rounded-xl text-sm font-sans text-[#1A2F25] transition-all outline-none"
                />
              </div>

              {/* Registered Address */}
              <div className="md:col-span-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#526359] mb-1.5 font-semibold">
                  Registered Business Address
                </label>
                <textarea
                  rows={2}
                  value={businessData.address}
                  onChange={(e) =>
                    setBusinessData({ ...businessData, address: e.target.value })
                  }
                  placeholder="e.g. SR. NO 40/1 lane no. 3, Dattanagar Ambegaon B.K Pune 411046"
                  className="w-full px-4 py-2.5 bg-[#F8F6F2] border border-[#1A2F25]/15 focus:border-[#E06D53] focus:bg-white rounded-xl text-sm font-sans text-[#1A2F25] transition-all outline-none resize-y"
                />
              </div>

              {/* Business Description */}
              <div className="md:col-span-2">
                <label className="block text-xs font-mono uppercase tracking-wider text-[#526359] mb-1.5 font-semibold">
                  Company Description & Automation Scope
                </label>
                <textarea
                  rows={3}
                  value={businessData.description}
                  onChange={(e) =>
                    setBusinessData({ ...businessData, description: e.target.value })
                  }
                  placeholder="Brief summary of core business operations, automation goals, and services"
                  className="w-full px-4 py-2.5 bg-[#F8F6F2] border border-[#1A2F25]/15 focus:border-[#E06D53] focus:bg-white rounded-xl text-sm font-sans text-[#1A2F25] transition-all outline-none resize-y"
                />
              </div>
            </div>

            {/* Business Audit Metadata */}
            <div className="pt-3 border-t border-[#1A2F25]/8 flex flex-wrap items-center justify-between text-[11px] font-mono text-[#526359]">
              <span>Record ID: {businessData.id || businessId || "---"}</span>
              <span>Created: {businessData.created_at || "---"}</span>
              <span>Last Updated: {businessData.updated_at || "---"}</span>
            </div>
          </form>
        </section>

        {/* ==================================================================== */}
        {/* SECTION 2: ADMIN PROFILE (users table)                               */}
        {/* ==================================================================== */}
        <section className="bg-white border border-[#1A2F25]/15 rounded-3xl p-6 sm:p-8 shadow-sm transition-all hover:shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 mb-6 border-b border-[#1A2F25]/10 gap-3">
            <div>
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-[#1A2F25]" />
                <h2 className="font-editorial text-2xl text-[#1A2F25]">Admin Profile</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1A2F25]/5 text-[#1A2F25] font-semibold border border-[#1A2F25]/10">
                  table: users
                </span>
              </div>
              <p className="font-sans text-xs text-[#526359] mt-1">
                Maintain administrative credentials, departmental associations, and mobile alerts.
              </p>
            </div>

            <button
              type="button"
              onClick={handleUpdateAdmin}
              disabled={savingAdmin || savingAll}
              className="px-5 py-2 bg-[#1A2F25] hover:bg-[#2A4537] disabled:opacity-50 text-white font-sans text-xs uppercase tracking-wider font-semibold rounded-full transition-all cursor-pointer self-start sm:self-auto shrink-0 shadow-xs flex items-center gap-2"
            >
              {savingAdmin ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <span>Update Admin Profile</span>
              )}
            </button>
          </div>

          <form onSubmit={handleUpdateAdmin} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#526359] mb-1.5 font-semibold">
                  First Name *
                </label>
                <input
                  type="text"
                  value={adminData.first_name}
                  onChange={(e) =>
                    setAdminData({ ...adminData, first_name: e.target.value })
                  }
                  required
                  placeholder="e.g. Yash"
                  className="w-full px-4 py-2.5 bg-[#F8F6F2] border border-[#1A2F25]/15 focus:border-[#E06D53] focus:bg-white rounded-xl text-sm font-sans text-[#1A2F25] transition-all outline-none"
                />
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#526359] mb-1.5 font-semibold">
                  Last Name
                </label>
                <input
                  type="text"
                  value={adminData.last_name}
                  onChange={(e) =>
                    setAdminData({ ...adminData, last_name: e.target.value })
                  }
                  placeholder="e.g. Chillal"
                  className="w-full px-4 py-2.5 bg-[#F8F6F2] border border-[#1A2F25]/15 focus:border-[#E06D53] focus:bg-white rounded-xl text-sm font-sans text-[#1A2F25] transition-all outline-none"
                />
              </div>

              {/* Admin Email */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#526359] mb-1.5 font-semibold">
                  Administrative Email *
                </label>
                <input
                  type="email"
                  value={adminData.email}
                  onChange={(e) =>
                    setAdminData({ ...adminData, email: e.target.value })
                  }
                  required
                  placeholder="e.g. chillalyash2005@gmail.com"
                  className="w-full px-4 py-2.5 bg-[#F8F6F2] border border-[#1A2F25]/15 focus:border-[#E06D53] focus:bg-white rounded-xl text-sm font-sans text-[#1A2F25] transition-all outline-none"
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#526359] mb-1.5 font-semibold">
                  Admin Mobile Number
                </label>
                <input
                  type="text"
                  value={adminData.mobile_no}
                  onChange={(e) =>
                    setAdminData({ ...adminData, mobile_no: e.target.value })
                  }
                  placeholder="e.g. +917775065511"
                  className="w-full px-4 py-2.5 bg-[#F8F6F2] border border-[#1A2F25]/15 focus:border-[#E06D53] focus:bg-white rounded-xl text-sm font-sans text-[#1A2F25] transition-all outline-none"
                />
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#526359] mb-1.5 font-semibold">
                  Department
                </label>
                <input
                  type="text"
                  value={adminData.department}
                  onChange={(e) =>
                    setAdminData({ ...adminData, department: e.target.value })
                  }
                  placeholder="e.g. IT & Automation"
                  className="w-full px-4 py-2.5 bg-[#F8F6F2] border border-[#1A2F25]/15 focus:border-[#E06D53] focus:bg-white rounded-xl text-sm font-sans text-[#1A2F25] transition-all outline-none"
                />
              </div>

              {/* Profession / Role Title */}
              <div>
                <label className="block text-xs font-mono uppercase tracking-wider text-[#526359] mb-1.5 font-semibold">
                  Profession / Designation
                </label>
                <input
                  type="text"
                  value={adminData.profession}
                  onChange={(e) =>
                    setAdminData({ ...adminData, profession: e.target.value })
                  }
                  placeholder="e.g. Senior Project Manager"
                  className="w-full px-4 py-2.5 bg-[#F8F6F2] border border-[#1A2F25]/15 focus:border-[#E06D53] focus:bg-white rounded-xl text-sm font-sans text-[#1A2F25] transition-all outline-none"
                />
              </div>
            </div>

            {/* Admin Audit Metadata */}
            <div className="pt-3 border-t border-[#1A2F25]/8 flex flex-wrap items-center justify-between text-[11px] font-mono text-[#526359]">
              <span>User ID: {adminData.user_id || currentUserId}</span>
              <span>Role: {adminData.role}</span>
              <span>Created: {adminData.created_at || "---"}</span>
              <span>Last Updated: {adminData.updated_at || "---"}</span>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
