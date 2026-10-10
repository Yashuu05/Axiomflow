/**
 * Axiomflow logo
 *
 * Concept: an "axiom" is a fixed foundation, and "flow" is motion.
 * The mark is a vertical pillar (the axiom) from which a curved path (the flow)
 * branches out and ends in an Amber Clay node, the critical point of the workflow.
 *
 * Works in Next.js, Vite + React, or any React 18+ project with Tailwind CSS.
 * Uses the Axiomflow palette directly, so it stays consistent across the landing page
 * and the dashboard.
 *
 * Usage:
 *   <AxiomflowLogo />                          // full lockup (mark + wordmark)
 *   <AxiomflowLogo variant="mark" size={40} /> // icon only, e.g. favicon or sidebar
 *   <AxiomflowLogo theme="dark" />             // for dark surfaces
 */

import { useId } from "react";

export const AXIOMFLOW_PALETTE = {
  canvas: "#F8F6F2",
  deepForest: "#1A2F25",
  slateOlive: "#526359",
  amberClay: "#E06D53",
  earthyOchre: "#E5A93C",
};

const THEMES = {
  light: {
    ink: AXIOMFLOW_PALETTE.deepForest,
    subInk: AXIOMFLOW_PALETTE.slateOlive,
    tileFill: "rgba(255, 255, 255, 0.65)",
    tileStroke: "rgba(26, 47, 37, 0.14)",
    node: AXIOMFLOW_PALETTE.amberClay,
    nodeRing: "#FFFFFF",
  },
  dark: {
    ink: "#F8F6F2",
    subInk: "#B9C4BD",
    tileFill: "rgba(248, 246, 242, 0.08)",
    tileStroke: "rgba(248, 246, 242, 0.18)",
    node: AXIOMFLOW_PALETTE.earthyOchre,
    nodeRing: "#1A2F25",
  },
};

export default function AxiomflowLogo({
  variant = "full", // "full" | "mark"
  theme = "light", // "light" | "dark"
  size = 32, // height in px for the mark (full lockup scales from this)
  className = "",
  title = "Axiomflow",
}) {
  const uid = useId().replace(/:/g, "");
  const colors = THEMES[theme] ?? THEMES.light;
  const flowGradientId = `axf-flow-${uid}`;
  const tileGradientId = `axf-tile-${uid}`;

  const mark = (
    <g>
      <defs>
        {/* Flow stroke: Earthy Ochre blending into Amber Clay */}
        <linearGradient id={flowGradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={AXIOMFLOW_PALETTE.earthyOchre} />
          <stop offset="100%" stopColor={AXIOMFLOW_PALETTE.amberClay} />
        </linearGradient>
        {/* Subtle ambient sheen on the glass tile, following the Liquid Surface direction */}
        <linearGradient id={tileGradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFF6EE" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#F5F9F7" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#FAF5F0" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {/* Glass tile: structural container with sharp, defined border */}
      <rect
        x="4"
        y="4"
        width="56"
        height="56"
        rx="16"
        fill={colors.tileFill}
        stroke={colors.tileStroke}
        strokeWidth="1.5"
      />
      <rect x="4" y="4" width="56" height="56" rx="16" fill={`url(#${tileGradientId})`} />

      {/* Axiom: vertical pillar, the fixed foundation */}
      <line
        x1="22"
        y1="17"
        x2="22"
        y2="47"
        stroke={colors.ink}
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Base anchor point on the pillar */}
      <circle cx="22" cy="47" r="2.6" fill={colors.ink} />

      {/* Flow: a curve branching from the pillar toward the upper right */}
      <path
        d="M22 32 C 30 32, 32 21, 42 21"
        fill="none"
        stroke={`url(#${flowGradientId})`}
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* Critical node: where the workflow resolves */}
      <circle cx="44" cy="21" r="6" fill={colors.nodeRing} />
      <circle cx="44" cy="21" r="4.2" fill={colors.node} />
    </g>
  );

  if (variant === "mark") {
    return (
      <svg
        role="img"
        aria-label={title}
        viewBox="0 0 64 64"
        width={size}
        height={size}
        className={className}
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>{title}</title>
        {mark}
      </svg>
    );
  }

  // Full lockup: mark + wordmark. Wordmark height is tuned to match the mark.
  const width = size * 4.6;
  return (
    <svg
      role="img"
      aria-label={title}
      viewBox="0 0 296 64"
      width={width}
      height={size}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>{title}</title>
      {mark}
      <text
        x="76"
        y="41"
        fontFamily="Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif"
        fontSize="30"
        letterSpacing="-0.6"
        fill={colors.ink}
      >
        <tspan fontWeight="700">Axiom</tspan>
        <tspan fontWeight="400" fill={colors.subInk}>
          flow
        </tspan>
      </text>
    </svg>
  );
}