"use client";

import { useState, useEffect } from "react";

interface WorkflowBeforeExecutionProps {
  onStartWorkflow: (objective: string) => void;
  initialBusinessName?: string;
}

const WELCOME_TEMPLATES = [
  (name: string) => `Welcome ${name}, what’s your objective today?`,
  (name: string) => `Hello ${name}, what would you like to automate today?`,
  (name: string) => `Good day ${name}, what workflow shall we coordinate today?`,
  (name: string) => `Greetings ${name}, how can we accelerate your operations today?`,
  (name: string) => `Welcome back ${name}, what task can we execute for you today?`,
];

export default function WorkflowBeforeExecution({
  onStartWorkflow,
  initialBusinessName,
}: WorkflowBeforeExecutionProps) {
  const [inputValue, setInputValue] = useState("");
  const [businessName, setBusinessName] = useState<string>(
    initialBusinessName || "Axiomflow Pvt Ltd"
  );
  const [welcomeIndex, setWelcomeIndex] = useState<number>(0);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    // Pick 1 of 5 welcome messages randomly whenever workspace is loaded or reset
    const randIdx = Math.floor(Math.random() * WELCOME_TEMPLATES.length);
    setWelcomeIndex(randIdx);

    // Fetch registered business name directly from business_profile table in axiomflow_db
    let userId = "usr_72b30e7cd49e49e5";
    try {
      const stored = localStorage.getItem("axiomflow_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.business_name) {
          setBusinessName(parsed.business_name);
        }
        if (parsed.user_id) {
          userId = parsed.user_id;
        }
      }
    } catch {
      // Ignore parse errors and use fallback
    }

    fetch(`${API_BASE}/api/user/profile/${userId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.business_name && data.business_name !== "---") {
          setBusinessName(data.business_name);
        }
      })
      .catch(() => null);
  }, [API_BASE]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = inputValue.trim();
    if (!query) {
      return;
    }
    onStartWorkflow(query);
  };

  const welcomeHeadline = WELCOME_TEMPLATES[welcomeIndex](businessName);

  return (
    <div className="flex-1 flex flex-col justify-between py-8 md:py-16">
      {/* Centered Welcome Headline */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 max-w-4xl mx-auto my-auto">
        <h1 className="font-editorial text-4xl sm:text-5xl md:text-6xl text-[#E06D53] font-normal leading-[1.15] tracking-tight">
          {welcomeHeadline}
        </h1>
        <p className="font-sans text-sm md:text-base text-[#526359] mt-4 max-w-xl leading-relaxed">
          State your operational intent in natural language. The deterministic runtime decomposes it into verified DAG steps with strict audit gates.
        </p>
      </div>

      {/* Bottom Composer Bar */}
      <div className="w-full max-w-4xl mx-auto px-2 pt-6">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center bg-white border border-[#E06D53] rounded-full shadow-[0_4px_24px_-6px_rgba(224,109,83,0.15)] focus-within:shadow-[0_6px_28px_-4px_rgba(224,109,83,0.25)] transition-all p-1.5 pl-6"
        >
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="ask query"
            className="w-full bg-transparent font-editorial text-lg md:text-xl text-[#1A2F25] placeholder:text-[#526359]/60 focus:outline-none pr-3"
          />

          <button
            type="submit"
            aria-label="Submit objective"
            className="w-12 h-12 rounded-full bg-[#E06D53] hover:bg-[#CD5B42] text-white flex items-center justify-center shrink-0 shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            {/* Paper Airplane Send Icon - correctly oriented pointing upright to top-right */}
            <svg
              className="w-5 h-5 fill-current transform -rotate-45 translate-x-0.5 -translate-y-0.5"
              viewBox="0 0 24 24"
            >
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
