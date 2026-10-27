"use client";

import { useState } from "react";
import Link from "next/link";

interface FaqItem {
  question: string;
  answer: string;
}

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    {
      question: "Will Axiomflow ever send an email or modify records without my explicit approval?",
      answer:
        "Never. Axiomflow's core architecture enforces mandatory Human-in-the-Loop (HITL) approval gates. All external communications, financial notices, and database updates are held in an isolated staging tray. An authorized operator must inspect and click 'Approve' before any API dispatch occurs.",
    },
    {
      question: "How does Axiomflow differ from traditional automation like Zapier or Make?",
      answer:
        "Traditional tools rely on rigid if-then triggers that fail when multi-source synthesis, dynamic reasoning, or in-flight adaptation is required. Axiomflow accepts natural language business goals, queries multiple sources simultaneously (Google Sheets + Gmail + Databases), constructs multi-step plans, and dynamically re-plans in real time when ground truth changes.",
    },
    {
      question: "What permissions does Axiomflow require for Google Workspace?",
      answer:
        "We connect using Google OAuth 2.0 PKCE with granular least-privilege scopes: gmail.send (to draft and dispatch approved notices), spreadsheets (to query registers and update payment status), documents & drive.file (to compile executive memos), and calendar.events (to check availability and schedule meetings). We never see or store master account credentials, and access can be revoked in one click.",
    },
    {
      question: "How does Axiomflow eliminate AI hallucinations in business calculations?",
      answer:
        "Large language models are strictly restricted to semantic objective parsing and text drafting. All numeric calculations, invoice aging math, policy rules (e.g. 15d notice vs 30d escalation), and database queries are executed by deterministic Python microservices and verified against strict schemas before execution.",
    },
    {
      question: "What happens if a customer pays while a reminder is waiting for approval?",
      answer:
        "Axiomflow features Dynamic In-Flight Re-planning. Before executing any approved batch, the agent re-checks ground truth across your bank ledger and Gmail inbox. If a payment was recorded moments earlier, the reminder draft is automatically evicted from the dispatch queue and logged safely.",
    },
    {
      question: "How quickly can my business get onboarded?",
      answer:
        "Onboarding takes under 2 minutes. Complete the self-serve business registration at /signup, connect your Google Workspace account with a single Google sign-in popup, and run your first automated workflow immediately from the workspace dashboard.",
    },
  ];

  return (
    <section id="faq" className="py-24 px-6 md:px-12 max-w-5xl mx-auto scroll-mt-20">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#1A2F25]/20 bg-white/70 text-xs font-mono tracking-widest uppercase mb-4 text-[#1A2F25] shadow-2xs">
          <span>FREQUENTLY ASKED QUESTIONS</span>
        </div>
        <h2 className="font-editorial text-4xl sm:text-5xl md:text-6xl text-[#1A2F25] font-normal leading-tight">
          Everything you need to know about Axiomflow.
        </h2>
        <p className="mt-4 font-sans text-base text-[#526359] leading-relaxed">
          Clear answers on how autonomous workflows operate, our safety verification gates, and how your team maintains complete control.
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className={`border transition-all duration-200 ${
                isOpen
                  ? "border-[#E06D53] bg-white/95 shadow-sm"
                  : "border-[#1A2F25]/15 bg-white/70 hover:bg-white"
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer"
              >
                <span className="font-sans font-bold text-sm sm:text-base text-[#1A2F25]">
                  {faq.question}
                </span>
                <span className="font-mono text-sm sm:text-base text-[#E06D53] shrink-0 font-bold">
                  {isOpen ? "−" : "+"}
                </span>
              </button>

              {isOpen && (
                <div className="px-5 pb-6 sm:px-6 font-sans text-xs sm:text-sm text-[#526359] leading-relaxed border-t border-[#1A2F25]/8 pt-4">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-12 text-center p-6 bg-white/50 border border-[#1A2F25]/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-left">
          <div className="font-sans font-bold text-sm text-[#1A2F25]">Have a specific integration requirement?</div>
          <div className="font-sans text-xs text-[#526359]">Our team can review your custom ERP or database schema.</div>
        </div>
        <Link
          href="/signup"
          className="px-5 py-2.5 bg-[#1A2F25] hover:bg-black text-white font-sans text-xs font-semibold uppercase tracking-wider transition-colors shrink-0"
        >
          Contact Solution Architect &rarr;
        </Link>
      </div>
    </section>
  );
}
