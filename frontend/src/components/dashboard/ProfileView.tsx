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
  const [businessId, setBusinessId] = useState<number | null>(() => {
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
    return null;
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [savingAll, setSavingAll] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<"corporate" | "admin">("corporate");

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
  const [initialBusinessData, setInitialBusinessData] = useState<BusinessProfileFields | null>(null);

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
  const [initialAdminData, setInitialAdminData] = useState<AdminProfileFields | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Auto-dismiss success message after 5 seconds
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
    fetch(`${API_BASE}/api/profile/full/${currentUserId}`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.detail || `Server returned status ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        if (data.business) {
          const bFields: BusinessProfileFields = {
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
          };
          setBusinessData(bFields);
          setInitialBusinessData(bFields);
          if (data.business.id) {
            setBusinessId(data.business.id);
          }
        }

        if (data.admin) {
          const aFields: AdminProfileFields = {
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
          };
          setAdminData(aFields);
          setInitialAdminData(aFields);
          if (data.admin.business_id) {
            setBusinessId(data.admin.business_id);
          }
        }
        setErrorMessage(null);
      })
      .catch((err: unknown) => {
        console.error("Failed to fetch profile details:", err);
        setErrorMessage(`Could not load profile from database: ${err instanceof Error ? err.message : String(err)}`);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [API_BASE, currentUserId]);

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

  // Determine dirty state
  const isDirty =
    (initialBusinessData && JSON.stringify(businessData) !== JSON.stringify(initialBusinessData)) ||
    (initialAdminData && JSON.stringify(adminData) !== JSON.stringify(initialAdminData));

  // Discard changes
  const handleDiscard = () => {
    if (initialBusinessData) setBusinessData(initialBusinessData);
    if (initialAdminData) setAdminData(initialAdminData);
  };

  // Update BOTH Profiles (Master update)
  const handleSaveAll = async () => {
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

      setSuccessMessage("Organization Profile Successfully Updated");
      setInitialBusinessData(businessData);
      setInitialAdminData(adminData);
      syncSessionCache(businessData.business_name, adminData.email);
    } catch (err: unknown) {
      console.error("Master update error:", err);
      setErrorMessage(`Failed to update profiles: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSavingAll(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col justify-start py-1 h-full overflow-hidden relative">
      {/* Fixed-Position Non-Disruptive Toast Alerts (Bottom-Right) */}
      {(successMessage || errorMessage) && (
        <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in slide-in-from-bottom-4 duration-300">
          {successMessage && (
            <div className="p-4 bg-white border-2 border-emerald-500 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs font-mono text-emerald-800">
              <div className="flex items-center gap-2">
                <span className="text-emerald-600 font-bold text-sm">✓</span>
                <span>{successMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setSuccessMessage(null)}
                className="text-emerald-700 hover:text-emerald-950 font-bold"
              >
                ✕
              </button>
            </div>
          )}
          {errorMessage && (
            <div className="p-4 bg-white border-2 border-red-500 rounded-2xl shadow-xl flex items-center justify-between gap-3 text-xs font-mono text-red-800">
              <div className="flex items-center gap-2">
                <span className="text-red-600 font-bold text-sm">✕</span>
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMessage(null)}
                className="text-red-700 hover:text-red-950 font-bold"
              >
                ✕
              </button>
            </div>
          )}
        </div>
      )}

      {/* Top Header Strip */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-[#1A2F25]/10 mb-4 gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs uppercase tracking-wider text-[#E06D53] font-bold">
              ORGANIZATION_GOVERNANCE
            </span>
            <span className="text-[10px] font-mono bg-[#1A2F25]/5 border border-[#1A2F25]/10 px-2 py-0.5 rounded-full text-[#526359]">
              ID: {currentUserId}
            </span>
          </div>
          <h2 className="font-editorial text-3xl md:text-4xl text-[#1A2F25] tracking-tight">
            Organization & Governance Records
          </h2>
          <p className="font-sans text-xs text-[#526359] mt-0.5">
            Configure statutory corporate entity credentials and administrator authorizations.
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

      {/* Segmented Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1A2F25]/10 mb-4 shrink-0">
        <button
          type="button"
          onClick={() => setActiveTab("corporate")}
          className={`pb-2.5 px-3 text-xs font-mono font-medium transition-all cursor-pointer relative flex items-center gap-2 ${
            activeTab === "corporate"
              ? "text-[#E06D53] font-semibold border-b-2 border-[#E06D53]"
              : "text-[#526359] hover:text-[#1A2F25]"
          }`}
        >
          <span>🏢 Corporate Entity Identity</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("admin")}
          className={`pb-2.5 px-3 text-xs font-mono font-medium transition-all cursor-pointer relative flex items-center gap-2 ${
            activeTab === "admin"
              ? "text-[#E06D53] font-semibold border-b-2 border-[#E06D53]"
              : "text-[#526359] hover:text-[#1A2F25]"
          }`}
        >
          <span>👤 Administrator & Security</span>
        </button>
      </div>

      {/* Tabbed Form Body */}
      <div className="flex-1 overflow-y-auto pr-1 pb-16">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-xs font-mono text-[#526359]">
            Loading statutory records from axiomflow_db...
          </div>
        ) : activeTab === "corporate" ? (
          /* Corporate Entity Identity Tab */
          <div className="bg-white/80 border border-[#1A2F25]/10 rounded-2xl p-5 sm:p-6 shadow-sm animate-in fade-in duration-150">
            <div className="mb-4 pb-3 border-b border-[#1A2F25]/10 flex items-center justify-between">
              <div>
                <h3 className="font-editorial text-2xl text-[#1A2F25]">Corporate Entity Profile</h3>
                <p className="text-xs font-sans text-[#526359]">
                  Statutory registration details used by autonomous agents for document headers and vendor agreements.
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#526359] bg-[#1A2F25]/5 px-2 py-0.5 rounded">
                TABLE: business_profile
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#526359] mb-1 font-medium">
                  Registered Business Name *
                </label>
                <input
                  type="text"
                  value={businessData.business_name}
                  onChange={(e) => setBusinessData({ ...businessData, business_name: e.target.value })}
                  placeholder="e.g. Axiomflow Technologies Pvt Ltd"
                  className="w-full bg-white border border-[#1A2F25]/15 focus:border-[#E06D53] rounded-xl p-2.5 text-xs font-sans text-[#1A2F25] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#526359] mb-1 font-medium">
                  Industry / Operating Sector
                </label>
                <input
                  type="text"
                  value={businessData.sector}
                  onChange={(e) => setBusinessData({ ...businessData, sector: e.target.value })}
                  placeholder="e.g. Autonomous Workflow & AI Systems"
                  className="w-full bg-white border border-[#1A2F25]/15 focus:border-[#E06D53] rounded-xl p-2.5 text-xs font-sans text-[#1A2F25] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#526359] mb-1 font-medium">
                  GSTIN (Tax Identifier)
                </label>
                <input
                  type="text"
                  value={businessData.gstin}
                  onChange={(e) => setBusinessData({ ...businessData, gstin: e.target.value.toUpperCase() })}
                  placeholder="27ABCDE1234F1Z5"
                  maxLength={15}
                  className="w-full bg-white border border-[#1A2F25]/15 focus:border-[#E06D53] rounded-xl p-2.5 text-xs font-mono uppercase text-[#1A2F25] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#526359] mb-1 font-medium">
                  CIN (Corporate Identification Number)
                </label>
                <input
                  type="text"
                  value={businessData.cin}
                  onChange={(e) => setBusinessData({ ...businessData, cin: e.target.value.toUpperCase() })}
                  placeholder="U72900MH2024PTC123456"
                  className="w-full bg-white border border-[#1A2F25]/15 focus:border-[#E06D53] rounded-xl p-2.5 text-xs font-mono uppercase text-[#1A2F25] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#526359] mb-1 font-medium">
                  Official Corporate Email
                </label>
                <input
                  type="email"
                  value={businessData.email}
                  onChange={(e) => setBusinessData({ ...businessData, email: e.target.value })}
                  placeholder="contact@axiomflow.ai"
                  className="w-full bg-white border border-[#1A2F25]/15 focus:border-[#E06D53] rounded-xl p-2.5 text-xs font-sans text-[#1A2F25] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#526359] mb-1 font-medium">
                  Corporate Phone Number
                </label>
                <input
                  type="text"
                  value={businessData.phone_no}
                  onChange={(e) => setBusinessData({ ...businessData, phone_no: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full bg-white border border-[#1A2F25]/15 focus:border-[#E06D53] rounded-xl p-2.5 text-xs font-mono text-[#1A2F25] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#526359] mb-1 font-medium">
                  Corporate Website URL
                </label>
                <input
                  type="url"
                  value={businessData.website_url}
                  onChange={(e) => setBusinessData({ ...businessData, website_url: e.target.value })}
                  placeholder="https://axiomflow.ai"
                  className="w-full bg-white border border-[#1A2F25]/15 focus:border-[#E06D53] rounded-xl p-2.5 text-xs font-mono text-[#1A2F25] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#526359] mb-1 font-medium">
                  Registered Statutory Address
                </label>
                <input
                  type="text"
                  value={businessData.address}
                  onChange={(e) => setBusinessData({ ...businessData, address: e.target.value })}
                  placeholder="Level 4, Cyber City, Bangalore 560001"
                  className="w-full bg-white border border-[#1A2F25]/15 focus:border-[#E06D53] rounded-xl p-2.5 text-xs font-sans text-[#1A2F25] focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-mono text-[#526359] mb-1 font-medium">
                  Business Purpose & Context Description
                </label>
                <textarea
                  rows={3}
                  value={businessData.description}
                  onChange={(e) => setBusinessData({ ...businessData, description: e.target.value })}
                  placeholder="Describe your organization's business lines and operations to calibrate autonomous agent planning..."
                  className="w-full bg-white border border-[#1A2F25]/15 focus:border-[#E06D53] rounded-xl p-2.5 text-xs font-sans text-[#1A2F25] focus:outline-none leading-relaxed"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Administrator & Security Tab */
          <div className="bg-white/80 border border-[#1A2F25]/10 rounded-2xl p-5 sm:p-6 shadow-sm animate-in fade-in duration-150">
            <div className="mb-4 pb-3 border-b border-[#1A2F25]/10 flex items-center justify-between">
              <div>
                <h3 className="font-editorial text-2xl text-[#1A2F25]">Administrator Credentials</h3>
                <p className="text-xs font-sans text-[#526359]">
                  Primary workspace administrator credentials for human-in-the-loop review approvals.
                </p>
              </div>
              <span className="text-[10px] font-mono text-[#526359] bg-[#1A2F25]/5 px-2 py-0.5 rounded">
                TABLE: users
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-mono text-[#526359] mb-1 font-medium">
                  First Name
                </label>
                <input
                  type="text"
                  value={adminData.first_name}
                  onChange={(e) => setAdminData({ ...adminData, first_name: e.target.value })}
                  placeholder="Yash"
                  className="w-full bg-white border border-[#1A2F25]/15 focus:border-[#E06D53] rounded-xl p-2.5 text-xs font-sans text-[#1A2F25] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#526359] mb-1 font-medium">
                  Last Name
                </label>
                <input
                  type="text"
                  value={adminData.last_name}
                  onChange={(e) => setAdminData({ ...adminData, last_name: e.target.value })}
                  placeholder="Chillal"
                  className="w-full bg-white border border-[#1A2F25]/15 focus:border-[#E06D53] rounded-xl p-2.5 text-xs font-sans text-[#1A2F25] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#526359] mb-1 font-medium">
                  Administrator Email *
                </label>
                <input
                  type="email"
                  value={adminData.email}
                  onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                  placeholder="admin@axiomflow.ai"
                  className="w-full bg-white border border-[#1A2F25]/15 focus:border-[#E06D53] rounded-xl p-2.5 text-xs font-mono text-[#1A2F25] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#526359] mb-1 font-medium">
                  Direct Mobile Number
                </label>
                <input
                  type="text"
                  value={adminData.mobile_no}
                  onChange={(e) => setAdminData({ ...adminData, mobile_no: e.target.value })}
                  placeholder="+91 91234 56789"
                  className="w-full bg-white border border-[#1A2F25]/15 focus:border-[#E06D53] rounded-xl p-2.5 text-xs font-mono text-[#1A2F25] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#526359] mb-1 font-medium">
                  Department
                </label>
                <input
                  type="text"
                  value={adminData.department}
                  onChange={(e) => setAdminData({ ...adminData, department: e.target.value })}
                  placeholder="e.g. Operations & Autonomous Engineering"
                  className="w-full bg-white border border-[#1A2F25]/15 focus:border-[#E06D53] rounded-xl p-2.5 text-xs font-sans text-[#1A2F25] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#526359] mb-1 font-medium">
                  Executive Role / Title
                </label>
                <input
                  type="text"
                  value={adminData.profession}
                  onChange={(e) => setAdminData({ ...adminData, profession: e.target.value })}
                  placeholder="e.g. Chief Operations Officer"
                  className="w-full bg-white border border-[#1A2F25]/15 focus:border-[#E06D53] rounded-xl p-2.5 text-xs font-sans text-[#1A2F25] focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Unified Floating Dirty-State Action Bar */}
      {isDirty && (
        <div className="absolute bottom-3 left-4 right-4 z-40 bg-white border-2 border-[#E06D53] rounded-2xl p-3.5 shadow-2xl flex items-center justify-between gap-4 animate-in slide-in-from-bottom-3 duration-200 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E06D53] animate-pulse"></span>
            <span className="text-xs font-mono text-[#1A2F25] font-semibold">
              You have unsaved changes in Organization Governance.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDiscard}
              disabled={savingAll}
              className="px-4 py-1.5 border border-[#1A2F25]/20 hover:border-[#1A2F25] text-[#1A2F25] text-xs font-mono rounded-full transition-colors cursor-pointer bg-white"
            >
              Discard Changes
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={savingAll}
              className="px-5 py-1.5 bg-[#E06D53] hover:bg-[#CD5B42] text-white text-xs font-mono font-semibold uppercase rounded-full transition-all shadow-xs cursor-pointer disabled:opacity-50"
            >
              {savingAll ? "Saving..." : "Save All Changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
