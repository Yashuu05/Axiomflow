"use client";

import { useState, useEffect, useRef } from "react";

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

const QUICK_PROMPT_CHIPS = [
  {
    icon: "📊",
    title: "Analyze Sales Sheet",
    prompt: "Analyze sales sheet 'sales_q3.xlsx', detect negative margin trends, and export summary.",
  },
  {
    icon: "📝",
    title: "Executive Brief in Docs",
    prompt: "Draft an executive progress brief in Google Docs and email the board.",
  },
  {
    icon: "📅",
    title: "Schedule Team Sync",
    prompt: "Coordinate team milestone sync on Google Calendar with Meet conference link.",
  },
  {
    icon: "🔄",
    title: "Cross-App Sync",
    prompt: "Extract invoice status from Gmail and update central master spreadsheet.",
  },
];

export default function WorkflowBeforeExecution({
  onStartWorkflow,
  initialBusinessName,
}: WorkflowBeforeExecutionProps) {
  const [inputValue, setInputValue] = useState("");
  const [businessName, setBusinessName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("axiomflow_session");
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.business_name) return parsed.business_name;
        }
      } catch {
        // fallback
      }
    }
    return initialBusinessName || "Axiomflow Pvt Ltd";
  });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  useEffect(() => {
    let userId = "usr_72b30e7cd49e49e5";
    try {
      const stored = localStorage.getItem("axiomflow_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.user_id) {
          userId = parsed.user_id;
        }
      }
    } catch {
      // Ignore
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

  // Adjust textarea height dynamically as content changes
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputValue.trim();
    if (!query) {
      return;
    }
    onStartWorkflow(query);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSelectChip = (promptText: string) => {
    setInputValue(promptText);
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const welcomeIndex = businessName.length % WELCOME_TEMPLATES.length;
  const welcomeHeadline = WELCOME_TEMPLATES[welcomeIndex](businessName);

  return (
    <div className="flex-1 flex flex-col justify-between py-6 md:py-10 max-w-4xl mx-auto w-full">
      {/* Centered Welcome Headline */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4 my-auto">
        <h1 className="font-editorial text-4xl sm:text-5xl md:text-6xl text-[#E06D53] font-normal leading-[1.12] tracking-tight max-w-3xl">
          {welcomeHeadline}
        </h1>
        <p className="font-sans text-sm md:text-base text-[#526359] mt-3.5 max-w-xl leading-relaxed">
          State your operational intent in natural language. The deterministic runtime decomposes it into verified DAG steps with strict audit gates.
        </p>

        {/* Curated Quick-Start Prompt Chips */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full max-w-2xl text-left">
          {QUICK_PROMPT_CHIPS.map((chip, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectChip(chip.prompt)}
              className="p-3 bg-white/70 hover:bg-white border border-[#1A2F25]/10 hover:border-[#E06D53]/60 rounded-xl transition-all shadow-2xs hover:shadow-xs group cursor-pointer text-left flex items-start gap-2.5"
            >
              <span className="text-lg shrink-0 mt-0.5">{chip.icon}</span>
              <div className="min-w-0">
                <div className="font-editorial text-base text-[#1A2F25] group-hover:text-[#E06D53] transition-colors leading-snug">
                  {chip.title}
                </div>
                <div className="text-[11px] font-sans text-[#526359] line-clamp-1 mt-0.5">
                  {chip.prompt}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Expandable Multi-Line Prompt Composer Bar */}
      <div className="w-full px-2 pt-6">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center bg-white border border-[#E06D53]/80 rounded-2xl sm:rounded-full shadow-[0_4px_24px_-6px_rgba(224,109,83,0.18)] focus-within:shadow-[0_6px_32px_-4px_rgba(224,109,83,0.3)] focus-within:border-[#E06D53] focus-within:ring-2 focus-within:ring-[#E06D53]/20 transition-all p-2 pl-5 sm:pl-6"
        >
          <textarea
            ref={textareaRef}
            rows={1}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type business intent or select a quick-start chip above..."
            className="w-full bg-transparent font-editorial text-lg md:text-xl text-[#1A2F25] placeholder:text-[#526359]/60 focus:outline-none pr-3 resize-none max-h-32 leading-relaxed py-1"
          />

          <div className="flex items-center gap-2 shrink-0 pr-1">
            <span className="hidden sm:inline-block text-[10px] font-mono uppercase text-[#526359]/75 bg-[#1A2F25]/5 px-2 py-1 rounded">
              ⌘ + ↵ run
            </span>

            <button
              type="submit"
              aria-label="Submit objective"
              className="w-11 h-11 rounded-full bg-[#E06D53] hover:bg-[#CD5B42] text-white flex items-center justify-center shrink-0 shadow-sm transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            >
              <svg
                className="w-5 h-5 fill-current transform -rotate-45 translate-x-0.5 -translate-y-0.5"
                viewBox="0 0 24 24"
              >
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
