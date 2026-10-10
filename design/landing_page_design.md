# TECH STACK:

| SR.NO | Tech Layer | Framework / packages | Description |
| ----- | ----- | ----- | ----- |
|  | frontend | [React.js](http://React.js) \+ [Next.js](http://Next.js) \+ tailwind CSS, | High responsiveness with visually appealing elements |
|  | backend | fastapi , python\>=3.11, uvicorn | A backend AWSGI server, REST API, page routing, performance |
|  | LLM provider | Gemini, Groq, Ollama | Frontier models, limited free access, open-weight models (ollama) |
|  | Database | AWS RDS , Aura DB | Scalable, large storage capacity, data backup, high availability |
|  | AI orchestration | Langchain, LangGraph | Open source, widely used, large community support, agentic ai, LLM orchestration support |
| 6\. | External APIs | Google calendar, Gmail, Spreadsheets, Docs, database (future scope) | Free limited usage, widely used google services, developer support, ease of use |
| 7\. | Version control | Github, Git | Common and industry standard |
| 8\.  | IDE | Visual Studio Code | Industry standard, easy to use |
| 9\. | containerization | Docker | Easy to use, compact, already installed in machine |

### Technology Considerations:

1. Tech stack has been chosen on the basis of performance, responsiveness, open source availability, huge community support, already experienced and widely used.  
2. The project should only use free tier or freely available services, tools and dependencies.  
3. Technology must support responsiveness, high availability, performance, and user-friendly.

---

# **Design Specification: AI Workflow Engine Landing Page**

### **Design Philosophy & Visual Language**

To move away from standard AI aesthetics, this design adopts **Architectural Glassmorphism with Sharp Geometric Precision**. Instead of dark mode neon grids and pill buttons, the design relies on an airy, editorial light aesthetic paired with warm atmospheric gradients, frosted translucent panels, and strict rectangular geometry.

* **Geometry:** Zero corner radii (rounded-none). All cards, buttons, badges, and modals use pure 90-degree right angles with delicate hairline borders.  
* **Surface Styling:** Multi-layered frosted glass with backdrop blur filters, paired with subtle inner reflections and hard edge lines.  
* **Typography:** Editorial typography blending a high-contrast serif for narrative titles (e.g., Cormorant Garamond or Instrument Serif) and an ultra-clean geometric sans-serif for UI labels and technical details (e.g., Plus Jakarta Sans or General Sans).

### **Unique Color Palette**

| Token Name | Hex Code | Visual Application |
| :---- | :---- | :---- |
| **Canvas Alabaster** | \#F8F6F2 | Primary page foundation |
| **Frosted Quartz** | rgba(255, 255, 255, 0.65) | Glassmorphism base with backdrop-blur(16px) |
| **Amber Clay** | \#E06D53 | Primary accent for CTAs and critical nodes |
| **Earthy Ochre** | \#E5A93C | Secondary gradient blend |
| **Deep Forest** | \#1A2F25 | Primary text and sharp structural borders |
| **Slate Olive** | \#526359 | Secondary text, captions, and tooltips |
| **Liquid Surface** | linear-gradient(135deg, \#FFF6EE 0%, \#F5F9F7 50%, \#FAF5F0 100%) | Ambient light fluid backdrop |

### **Micro-Interactions & Animation Guidelines**

* **Ambient Aurora Mesh:** A slow, continuous SVG gradient mesh animating behind the glass panels at a 20-second loop duration.  
* **Refractive Hover States:** Interactive panels reveal a shifting radial white sheen following the cursor position via pointer-events: none.  
* **Mechanical Easing:** All transitions use cubic-bezier(0.16, 1, 0.3, 1\) (out-expo) over 300ms, creating crisp, decisive UI movements instead of floaty transitions.  
* **Live Node Flow:** Interactive canvas components display animated SVG stroke dashes that mimic live pipeline executions.

### **Landing Page Structural Architecture**

#### **1\. Header & Global Navigation**

* **Container:** Fixed glass ribbon spanning full width, bounded by a 1px solid Deep Forest border at 10% opacity.  
* **Brand Identity:** Sharp architectural wordmark accompanied by a geometric polyline SVG monogram.  
* **Navigation Links:** Minimal typographic links displaying a bottom hairline indicator on hover.  
* **Primary Trigger:** Rectangular button with Amber Clay solid fill, crisp Deep Forest text, and an SVG arrow icon that shifts right by 4px on hover.

#### **2\. Hero Section**

* **Editorial Eyebrow:** Deep Forest all-caps badge framed by a 1px border, holding a status SVG indicator.  
* **Headline:** Bold, high-contrast serif typography communicating operational orchestration without buzzwords.  
* **Sub-headline:** Two balanced lines in Slate Olive detailing deterministic agentic processes.  
* **Interactive Hero Asset:** A live glassmorphic orchestration canvas showing connected workflow nodes with zero border radius. Each node reveals data inputs, execution triggers, and verification checkpoints using custom SVG icons for webhooks, databases, and message gateways.

#### **3\. Operational Proof Strip**

* **Layout:** Four border-separated rectangular blocks displaying throughput metrics, SLA response benchmarks, and execution reliability figures.  
* **Visual Anchor:** Custom monochrome SVG line art representing real-time enterprise telemetry.

#### **4\. Architecture Showcase (Interactive Workflow Canvas)**

* **Canvas Component:** An interactive builder simulation showing three functional tiers:  
  * Ingestion Stage with inputs from communications and webhooks.  
  * Deterministic Logic Stage with logic gates and verification parameters.  
  * Action Stage with auto-executing tasks and database commits.  
* **Glass Stack:** Overlapping rectangular glass panes with varying opacity levels (0.85 for active layers, 0.40 for inactive layers).

#### **5\. Enterprise Capabilities Grid**

* **Structure:** A four-column grid of sharp rectangular glass slabs.  
* **Card Anatomy:**  
  * Top: 24px inline SVG technical icon inside a square bordered box.  
  * Center: Bold structural heading in Deep Forest.  
  * Body: Concise description of capabilities including guardrails, audit logging, and bi-directional integration.  
  * Bottom: Hairline-bordered interactive micro-tag highlighting latency or execution speed.

#### **6\. Final Conversion Module**

* **Surface:** Monolithic frosted glass block anchored over a concentrated Amber Clay and Earthy Ochre radial blend.  
* **Action:** Direct input field for business deployment inquiries alongside an Amber Clay execution button with an integrated SVG bolt symbol.

### **Design System Asset Tokens**

* **SVG Icon Standards:** 1.5px stroke width, square caps (stroke-linecap="square"), sharp joins (stroke-linejoin="miter"), 24x24 pixel grid.  
* **Glass Border Standard:** border: 1px solid rgba(26, 47, 37, 0.08);  
* **Card Elevation:** box-shadow: 0 8px 32px 0 rgba(26, 47, 37, 0.05);

### **1\. Tailwind Configuration Extension**

Add these custom utilities and theme extensions to your `tailwind.config.js`:

JavaScript  
/\*\* @type {import('tailwindcss').Config} \*/  
module.exports \= {  
  theme: {  
    extend: {  
      colors: {  
        canvas: '\#F8F6F2',  
        forest: {  
          DEFAULT: '\#1A2F25',  
          muted: '\#526359',  
          border: 'rgba(26, 47, 37, 0.12)',  
          light: 'rgba(26, 47, 37, 0.04)'  
        },  
        clay: {  
          DEFAULT: '\#E06D53',  
          hover: '\#CD5B42'  
        },  
        ochre: '\#E5A93C'  
      },  
      fontFamily: {  
        serif: \['Instrument Serif', 'Cormorant Garamond', 'serif'\],  
        sans: \['Plus Jakarta Sans', 'Inter', 'sans-serif'\]  
      },  
      boxShadow: {  
        glass: '0 20px 40px \-15px rgba(26, 47, 37, 0.07)',  
        'glass-node': '0 10px 25px \-5px rgba(26, 47, 37, 0.05)'  
      }  
    }  
  }  
};

### **2\. Hero Canvas Component (HTML \+ Tailwind)**

This layout adheres strictly to the architectural glassmorphism rules: zero corner radii, hairline borders, custom SVG line icons, editorial typography, and the warm Ochre/Clay palette.

HTML  
\<section class="relative min-h-screen w-full bg-canvas text-forest overflow-hidden flex flex-col justify-between pt-24 pb-16 px-6 md:px-12 selection:bg-clay selection:text-white"\>

  \<\!-- Ambient Fluid Mesh Background \--\>  
  \<div class="absolute inset-0 pointer-events-none z-0"\>  
    \<div class="absolute top-1/4 left-1/2 \-translate-x-1/2 \-translate-y-1/2 w-\[700px\] h-\[500px\] bg-gradient-to-tr from-ochre/25 via-clay/20 to-transparent blur-3xl opacity-70"\>\</div\>  
    \<div class="absolute bottom-10 right-1/4 w-\[500px\] h-\[350px\] bg-gradient-to-bl from-ochre/20 via-forest/5 to-transparent blur-3xl opacity-60"\>\</div\>  
  \</div\>

  \<\!-- Hero Content Stack \--\>  
  \<div class="relative z-10 max-w-5xl mx-auto w-full text-center flex flex-col items-center"\>  
      
    \<\!-- Status / Eyebrow Badge \--\>  
    \<div class="inline-flex items-center gap-3 px-3 py-1.5 border border-forest/20 bg-white/40 backdrop-blur-md mb-8"\>  
      \<span class="w-2 h-2 bg-clay inline-block"\>\</span\>  
      \<span class="font-sans text-xs tracking-widest uppercase font-semibold text-forest"\>Autonomous Runtime Architecture\</span\>  
    \</div\>

    \<\!-- Editorial Headline \--\>  
    \<h1 class="font-serif text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-normal tracking-tight leading-\[0.95\] text-forest max-w-4xl"\>  
      Deterministic execution for complex service operations.  
    \</h1\>

    \<\!-- Subtitle \--\>  
    \<p class="font-sans text-base sm:text-lg text-forest-muted max-w-2xl mt-8 font-normal leading-relaxed"\>  
      Coordinate agentic workflows across ticketing, financial reconciliation, and onboarding with strict verification gates and zero hallucinations.  
    \</p\>

    \<\!-- Action Triggers \--\>  
    \<div class="flex flex-col sm:flex-row items-center gap-4 mt-10 w-full sm:w-auto"\>  
      \<a href="\#pipeline" class="w-full sm:w-auto px-8 py-4 bg-clay hover:bg-clay-hover text-white font-sans text-sm tracking-wide font-medium transition-all duration-200 flex items-center justify-center gap-3 border border-clay shadow-sm"\>  
        \<span\>Deploy First Agent\</span\>  
        \<svg class="w-4 h-4 stroke-white stroke-\[1.75\]" fill="none" viewBox="0 0 24 24"\>  
          \<path stroke-linecap="square" stroke-linejoin="miter" d="M5 12h14m-6-6l6 6-6 6"/\>  
        \</svg\>  
      \</a\>  
      \<a href="\#demo" class="w-full sm:w-auto px-8 py-4 bg-white/60 hover:bg-white text-forest font-sans text-sm tracking-wide font-medium transition-all duration-200 flex items-center justify-center gap-3 border border-forest/15 backdrop-blur-md"\>  
        \<span\>Inspect System Traces\</span\>  
      \</a\>  
    \</div\>  
  \</div\>

  \<\!-- Glassmorphic Orchestration Canvas (Mock Engine) \--\>  
  \<div class="relative z-10 max-w-6xl mx-auto w-full mt-16"\>  
    \<div class="w-full border border-forest/15 bg-white/45 backdrop-blur-xl shadow-glass p-6 md:p-8 relative"\>  
        
      \<\!-- Top Window Metadata Bar \--\>  
      \<div class="flex items-center justify-between border-b border-forest/10 pb-4 mb-8 text-xs font-mono text-forest-muted"\>  
        \<div class="flex items-center gap-4"\>  
          \<span class="flex items-center gap-2"\>  
            \<span class="w-2 h-2 bg-emerald-700"\>\</span\>  
            CLUSTER ACTIVE: IN-MUM-01  
          \</span\>  
          \<span class="hidden md:inline"\>SYNC LATENCY: 24MS\</span\>  
        \</div\>  
        \<div class="flex items-center gap-2 tracking-wider"\>  
          RUN\_ID: 8F92A  
        \</div\>  
      \</div\>

      \<\!-- Pipeline Node Visualizer \--\>  
      \<div class="grid grid-cols-1 md:grid-cols-3 gap-6 relative"\>

        \<\!-- Stage 1: Ingestion Node \--\>  
        \<div class="border border-forest/15 bg-white/70 backdrop-blur-md p-6 shadow-glass-node flex flex-col justify-between"\>  
          \<div\>  
            \<div class="flex items-center justify-between mb-4"\>  
              \<span class="font-mono text-xs text-forest-muted uppercase"\>01 / Ingestion\</span\>  
              \<div class="p-1.5 border border-forest/15 bg-white"\>  
                \<svg class="w-4 h-4 stroke-forest stroke-\[1.5\]" fill="none" viewBox="0 0 24 24"\>  
                  \<path stroke-linecap="square" stroke-linejoin="miter" d="M4 4h16v16H4zM4 9h16M9 4v16"/\>  
                \</svg\>  
              \</div\>  
            \</div\>  
            \<h4 class="font-sans font-semibold text-sm text-forest mb-2"\>Multichannel Inbound\</h4\>  
            \<p class="font-sans text-xs text-forest-muted leading-relaxed"\>  
              Consumes incoming tickets from WhatsApp Gateway and email webhooks into an indexed state object.  
            \</p\>  
          \</div\>  
          \<div class="mt-6 pt-4 border-t border-forest/10 flex items-center justify-between text-\[11px\] font-mono text-forest-muted"\>  
            \<span\>PARSER\</span\>  
            \<span class="text-forest font-semibold"\>VALIDATED\</span\>  
          \</div\>  
        \</div\>

        \<\!-- Stage 2: Deterministic Logic Node (Active State) \--\>  
        \<div class="border border-clay bg-white/90 backdrop-blur-md p-6 shadow-glass-node flex flex-col justify-between relative"\>  
          \<div class="absolute \-top-3 left-4 px-2 py-0.5 bg-clay text-white font-mono text-\[10px\] tracking-wider uppercase font-semibold"\>  
            Active Evaluation  
          \</div\>  
          \<div\>  
            \<div class="flex items-center justify-between mb-4"\>  
              \<span class="font-mono text-xs text-clay uppercase"\>02 / Policy Logic\</span\>  
              \<div class="p-1.5 border border-clay bg-clay/10"\>  
                \<svg class="w-4 h-4 stroke-clay stroke-\[1.5\]" fill="none" viewBox="0 0 24 24"\>  
                  \<path stroke-linecap="square" stroke-linejoin="miter" d="M12 2l10 6.5v7L12 22 2 15.5v-7L12 2zM12 22V12m10-3.5L12 12 2 8.5"/\>  
                \</svg\>  
              \</div\>  
            \</div\>  
            \<h4 class="font-sans font-semibold text-sm text-forest mb-2"\>Guardrail & Context Engine\</h4\>  
            \<p class="font-sans text-xs text-forest-muted leading-relaxed"\>  
              Verifies account entitlement and checks spend limits before invoking downstream mutation tools.  
            \</p\>  
          \</div\>  
          \<div class="mt-6 pt-4 border-t border-forest/10 flex items-center justify-between text-\[11px\] font-mono text-forest-muted"\>  
            \<span\>HITL GATE\</span\>  
            \<span class="text-clay font-semibold"\>PASS (AUTO)\</span\>  
          \</div\>  
        \</div\>

        \<\!-- Stage 3: Execution / Commit Node \--\>  
        \<div class="border border-forest/15 bg-white/70 backdrop-blur-md p-6 shadow-glass-node flex flex-col justify-between"\>  
          \<div\>  
            \<div class="flex items-center justify-between mb-4"\>  
              \<span class="font-mono text-xs text-forest-muted uppercase"\>03 / Execution\</span\>  
              \<div class="p-1.5 border border-forest/15 bg-white"\>  
                \<svg class="w-4 h-4 stroke-forest stroke-\[1.5\]" fill="none" viewBox="0 0 24 24"\>  
                  \<path stroke-linecap="square" stroke-linejoin="miter" d="M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3"/\>  
                \</svg\>  
              \</div\>  
            \</div\>  
            \<h4 class="font-sans font-semibold text-sm text-forest mb-2"\>Database & Gateway Commit\</h4\>  
            \<p class="font-sans text-xs text-forest-muted leading-relaxed"\>  
              Dispatches receipt via payment API and syncs resolution status back to internal tracking systems.  
            \</p\>  
          \</div\>  
          \<div class="mt-6 pt-4 border-t border-forest/10 flex items-center justify-between text-\[11px\] font-mono text-forest-muted"\>  
            \<span\>OUTCOME\</span\>  
            \<span class="text-forest font-semibold"\>200 OK\</span\>  
          \</div\>  
        \</div\>

      \</div\>

      \<\!-- Bottom Telemetry Bar \--\>  
      \<div class="mt-6 pt-4 border-t border-forest/10 flex flex-col sm:flex-row items-center justify-between text-xs font-mono text-forest-muted gap-2"\>  
        \<span\>TELEMETRY: ZERO HALLUCINATION ASSERTION ENABLED\</span\>  
        \<span\>VERIFICATION RUNTIME: 312MS\</span\>  
      \</div\>

    \</div\>  
  \</div\>

\</section\>

### **Implementation Notes for Clean Vibe-Coding**

* **Google Fonts Import:** Place this link in your document head to pull in the serif and geometric typography:  
* HTML

\<link rel="preconnect" href="https\://fonts.googleapis.com"\>  
\<link rel="preconnect" href="https\://fonts.gstatic.com" crossorigin\>  
\<link href="https\://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1\&family=Plus+Jakarta+Sans:wght@400;500;600\&display=swap" rel="stylesheet"\>

*   
*   
* **No `border-radius`:** Keep all containers, tags, and inputs with strict 90-degree corners to maintain the architectural look.  
* **SVG Rigor:** Every icon relies solely on `stroke-linecap="square"` and `stroke-linejoin="miter"` to eliminate curved pill ends.

---