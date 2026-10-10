import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import MetricsStrip from "@/components/MetricsStrip";
import ArchitectureShowcase from "@/components/ArchitectureShowcase";
import CapabilitiesGrid from "@/components/CapabilitiesGrid";
import InteractiveSandbox from "@/components/InteractiveSandbox";
import CtaSection from "@/components/CtaSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col bg-[#F8F6F2] text-[#1A2F25]">
      {/* Fixed Header & Navigation Ribbon */}
      <Navbar />

      {/* Hero Section with Ambient Fluid Mesh & Glassmorphic Orchestration Canvas */}
      <HeroSection />

      {/* 4-Block Operational Proof & Telemetry Strip */}
      <MetricsStrip />

      {/* Core Engine Architecture & Real Workflow Walkthrough (Overdue Invoice & Compliance) */}
      <ArchitectureShowcase />

      {/* Enterprise Capabilities Grid */}
      <CapabilitiesGrid />

      {/* Live Interactive Sandbox with Human-in-the-Loop Simulation & Audit Logging */}
      <InteractiveSandbox />

      {/* Monolithic Glass Conversion Module */}
      <CtaSection />

      {/* System Status & Architectural Footer */}
      <Footer />
    </main>
  );
}
