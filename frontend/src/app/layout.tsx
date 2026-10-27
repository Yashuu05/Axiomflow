import type { Metadata } from "next";
import { Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const instrumentSerif = Instrument_Serif({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Axiomflow | Autonomous Business Workflow Runtime",
  description:
    "Autonomous operations for modern business with strict human control. Coordinate agentic workflows across Google Workspace, spreadsheets, and databases with mandatory human-in-the-loop verification gates and zero hallucinations.",
  keywords: [
    "Agentic AI",
    "Business Workflow Automation",
    "Google Workspace AI",
    "Human-in-the-loop AI",
    "Deterministic Workflow Runtime",
    "FastMCP",
    "Axiomflow",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${plusJakartaSans.variable} scroll-smooth antialiased`}
    >
      <head>
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
        />
      </head>
      <body className="min-h-screen flex flex-col bg-[#F8F6F2] text-[#1A2F25] selection:bg-[#E06D53] selection:text-white">
        {children}
      </body>
    </html>
  );
}
