import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import IntegrationsSection from "@/components/IntegrationsSection";
import MetricsStrip from "@/components/MetricsStrip";
import HowItWorks from "@/components/HowItWorks";
import ArchitectureShowcase from "@/components/ArchitectureShowcase";
import CapabilitiesGrid from "@/components/CapabilitiesGrid";
import InteractiveSandbox from "@/components/InteractiveSandbox";
import SecuritySection from "@/components/SecuritySection";
import FaqSection from "@/components/FaqSection";
import CtaSection from "@/components/CtaSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-[#F8F6F2] text-[#1A2F25]">
      {/* 1. Fixed Header & Navigation Ribbon */}
      <Navbar />

      {/* 2. High-Impact Hero with Realistic Glassmorphic Workspace Canvas */}
      <HeroSection />

      {/* 3. Native Connected Tool Suite (Google Workspace FastMCP & Databases) */}
      <IntegrationsSection />

      {/* 4. Quantified Business Impact & Operational Proof Metrics */}
      <MetricsStrip />

      {/* 5. How Axiomflow Works: 4-Stage Operational Pipeline */}
      <HowItWorks />

      {/* 6. Deep-Dive Architecture & Real Business Workflow Walkthrough */}
      <ArchitectureShowcase />

      {/* 7. Core Architectural Precision Guarantees */}
      <CapabilitiesGrid />

      {/* 8. Live Interactive Sandbox with Human-in-the-Loop Simulation */}
      <InteractiveSandbox />

      {/* 9. Enterprise Governance, Security & Compliance */}
      <SecuritySection />

      {/* 10. Frequently Asked Questions (Overcoming Customer Objections) */}
      <FaqSection />

      {/* 11. High-Impact Self-Serve Conversion Module */}
      <CtaSection />

      {/* 12. Modern Enterprise B2B SaaS Footer */}
      <Footer />
    </main>
  );
}
