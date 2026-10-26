"use client";

import { useState, useEffect, useRef } from "react";

interface DashboardSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface UserSettings {
  model: string;
  speed: string;
  autoScroll: boolean;
  deterministicGates: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  model: "gemini-2.5-flash",
  speed: "normal",
  autoScroll: true,
  deterministicGates: true,
};

export default function DashboardSettingsModal({
  isOpen,
  onClose,
}: DashboardSettingsModalProps) {
  const [settings, setSettings] = useState<UserSettings>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("axiomflow_settings");
        if (stored) {
          return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        }
      } catch {
        // Use defaults
      }
    }
    return DEFAULT_SETTINGS;
  });
  const overlayRef = useRef<HTMLDivElement>(null);

  // Keyboard Escape listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleApplyChanges = () => {
    try {
      localStorage.setItem("axiomflow_settings", JSON.stringify(settings));
    } catch {
      // Ignore
    }
    onClose();
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className="fixed inset-0 z-50 bg-[#1A2F25]/45 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
    >
      <div className="bg-white border border-[#1A2F25]/15 rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative animate-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#526359] hover:text-[#1A2F25] w-8 h-8 rounded-full border border-[#1A2F25]/10 flex items-center justify-center cursor-pointer transition-colors"
        >
          ✕
        </button>

        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs text-[#E06D53] font-bold">
            SYSTEM_SETTINGS // RUNTIME
          </span>
        </div>

        <h3 className="font-editorial text-2xl sm:text-3xl text-[#1A2F25] mb-5 tracking-tight">
          Runtime System Preferences
        </h3>

        <div className="space-y-4">
          {/* Primary LLM Engine Selector */}
          <div>
            <label className="block text-xs font-mono uppercase text-[#526359] mb-1.5 font-medium">
              Primary LLM Engine & Reasoning Backend
            </label>
            <select
              value={settings.model}
              onChange={(e) => setSettings({ ...settings, model: e.target.value })}
              className="w-full bg-[#F8F6F2] border border-[#1A2F25]/20 focus:border-[#E06D53] rounded-xl p-3 text-xs font-mono text-[#1A2F25] focus:outline-none"
            >
              <option value="gemini-2.5-flash">Google Gemini 2.5 Flash — Sub-500ms, Low Latency, High Throughput</option>
              <option value="gemini-1.5-pro">Google Gemini 1.5 Pro — Deep Reasoning & Complex DAG Planning</option>
              <option value="claude-3-5-sonnet">Claude 3.5 Sonnet — Nuanced Logic & Code Synthesis</option>
            </select>
            <div className="mt-1.5 flex items-center gap-2 text-[10px] font-mono text-[#526359]">
              <span className="px-1.5 py-0.5 rounded bg-[#1A2F25]/5 border border-[#1A2F25]/10">Groq / Google Cloud</span>
              <span>• Zero-hallucination policy enforced across all models</span>
            </div>
          </div>

          {/* Simulation Playback Velocity */}
          <div>
            <label className="block text-xs font-mono uppercase text-[#526359] mb-1.5 font-medium">
              Execution Velocity Multiplier
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: "normal", label: "Realtime (1x)" },
                { id: "fast", label: "Accelerated (4x)" },
                { id: "step", label: "Step-by-Step" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSettings({ ...settings, speed: s.id })}
                  className={`py-2 px-1 text-center font-mono text-xs rounded-xl border transition-all cursor-pointer ${
                    settings.speed === s.id
                      ? "border-[#E06D53] bg-[#E06D53]/10 text-[#CD5B42] font-semibold shadow-2xs"
                      : "border-[#1A2F25]/15 bg-white text-[#526359] hover:bg-[#F8F6F2]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom iOS-Style Tactile Toggles */}
          <div className="pt-3 border-t border-[#1A2F25]/10 space-y-3.5">
            {/* Zero-Hallucination Gateways Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-xs font-sans font-medium text-[#1A2F25]">
                  Strict Zero-Hallucination Gateways
                </span>
                <span className="block text-[11px] font-sans text-[#526359]">
                  Require human sign-off on all external outbound messages
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={settings.deterministicGates}
                  onChange={(e) => setSettings({ ...settings, deterministicGates: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#1A2F25]/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E06D53]"></div>
              </label>
            </div>

            {/* Auto-Follow Live Activity Stream */}
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-xs font-sans font-medium text-[#1A2F25]">
                  Auto-Follow Live Activity Console
                </span>
                <span className="block text-[11px] font-sans text-[#526359]">
                  Automatically scroll telemetry logs to the newest event
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={settings.autoScroll}
                  onChange={(e) => setSettings({ ...settings, autoScroll: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-[#1A2F25]/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E06D53]"></div>
              </label>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-3 border-t border-[#1A2F25]/10 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setSettings(DEFAULT_SETTINGS)}
            className="text-xs font-mono text-[#526359] hover:text-[#1A2F25] cursor-pointer"
          >
            Reset Defaults
          </button>
          <button
            type="button"
            onClick={handleApplyChanges}
            className="px-5 py-2 bg-[#E06D53] hover:bg-[#CD5B42] text-white text-xs font-mono uppercase font-semibold rounded-full transition-colors cursor-pointer shadow-xs"
          >
            Apply & Save
          </button>
        </div>
      </div>
    </div>
  );
}
