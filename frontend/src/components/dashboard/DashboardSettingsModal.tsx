"use client";

import { useState } from "react";

interface DashboardSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DashboardSettingsModal({
  isOpen,
  onClose,
}: DashboardSettingsModalProps) {
  const [model, setModel] = useState("gemini-3.8-flash");
  const [speed, setSpeed] = useState("normal");
  const [autoScroll, setAutoScroll] = useState(true);
  const [deterministicGates, setDeterministicGates] = useState(true);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#1A2F25]/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-[#E06D53] rounded-2xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in-95 duration-150">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-[#526359] hover:text-[#1A2F25] w-8 h-8 rounded-full border border-[#1A2F25]/10 flex items-center justify-center cursor-pointer"
        >
          ✕
        </button>

        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs text-[#E06D53] font-bold">
            SYSTEM_SETTINGS // PREFERENCES
          </span>
        </div>

        <h3 className="font-editorial text-2xl text-[#1A2F25] mb-5">
          Runtime Execution Preferences
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase text-[#526359] mb-1.5">
              Primary LLM Engine
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-[#F8F6F2] border border-[#1A2F25]/20 rounded-lg p-2.5 text-xs font-mono text-[#1A2F25] focus:outline-none focus:border-[#E06D53]"
            >
              <option value="gemini-3.8-flash">Google Gemini 3.8 Flash (Deterministic Fast)</option>
              <option value="gemini-1.5-pro">Google Gemini 1.5 Pro (Deep Reasoning)</option>
              <option value="claude-3-5-sonnet">Claude 3.5 Sonnet</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[#526359] mb-1.5">
              Simulation Playback Velocity
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
                  onClick={() => setSpeed(s.id)}
                  className={`py-2 px-1 text-center font-mono text-xs rounded-lg border transition-all ${
                    speed === s.id
                      ? "border-[#E06D53] bg-[#E06D53]/10 text-[#E06D53] font-semibold"
                      : "border-[#1A2F25]/15 bg-white text-[#526359]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-[#1A2F25]/10 space-y-3">
            <label className="flex items-center justify-between text-xs font-sans text-[#1A2F25] cursor-pointer">
              <span>Strict Zero-Hallucination Gateways</span>
              <input
                type="checkbox"
                checked={deterministicGates}
                onChange={(e) => setDeterministicGates(e.target.checked)}
                className="accent-[#E06D53] w-4 h-4 cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between text-xs font-sans text-[#1A2F25] cursor-pointer">
              <span>Auto-Follow Live Activity Stream</span>
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={(e) => setAutoScroll(e.target.checked)}
                className="accent-[#E06D53] w-4 h-4 cursor-pointer"
              />
            </label>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#E06D53] hover:bg-[#CD5B42] text-white text-xs font-mono uppercase font-semibold rounded-full"
          >
            Apply Changes
          </button>
        </div>
      </div>
    </div>
  );
}
