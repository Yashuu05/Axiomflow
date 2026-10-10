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
    tileFill: "rgba(255, 255, 255, 0.75)",
    tileStroke: "rgba(26, 47, 37, 0.16)",
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

interface AxiomflowLogoProps {
  variant?: "full" | "mark";
  theme?: "light" | "dark";
  size?: number;
  className?: string;
  title?: string;
}

export default function AxiomflowLogo({
  variant = "full",
  theme = "light",
  size = 32,
  className = "",
  title = "Axiomflow",
}: AxiomflowLogoProps) {
  const uid = useId().replace(/:/g, "");
  const colors = THEMES[theme] ?? THEMES.light;
  const flowGradientId = `axf-flow-${uid}`;
  const tileGradientId = `axf-tile-${uid}`;

  const mark = (
    <g>
      <defs>
        <linearGradient id={flowGradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={AXIOMFLOW_PALETTE.earthyOchre} />
          <stop offset="100%" stopColor={AXIOMFLOW_PALETTE.amberClay} />
        </linearGradient>
        <linearGradient id={tileGradientId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFF6EE" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#F5F9F7" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#FAF5F0" stopOpacity="0.8" />
        </linearGradient>
      </defs>

      {/* Glass tile: structural container with crisp 0 radius or soft rect */}
      <rect
        x="4"
        y="4"
        width="56"
        height="56"
        rx="2"
        fill={colors.tileFill}
        stroke={colors.tileStroke}
        strokeWidth="1.5"
      />
      <rect x="4" y="4" width="56" height="56" rx="2" fill={`url(#${tileGradientId})`} />

      {/* Axiom: vertical pillar, the fixed foundation */}
      <line
        x1="22"
        y1="17"
        x2="22"
        y2="47"
        stroke={colors.ink}
        strokeWidth="4"
        strokeLinecap="square"
      />

      {/* Base anchor point on the pillar */}
      <rect x="19.5" y="44.5" width="5" height="5" fill={colors.ink} />

      {/* Flow: branching curved trajectory leading to the critical node */}
      <path
        d="M 22 34 C 27 34, 32 30, 36 24 C 38.5 20, 42 18, 46 18"
        fill="none"
        stroke={`url(#${flowGradientId})`}
        strokeWidth="3.5"
        strokeLinecap="square"
      />

      {/* Minor pulse accent */}
      <path
        d="M 22 26 C 26 26, 29 23, 33 19"
        fill="none"
        stroke={colors.subInk}
        strokeWidth="1.5"
        strokeDasharray="2 3"
        strokeOpacity="0.6"
      />

      {/* Critical Node */}
      <circle cx="46" cy="18" r="5" fill={colors.node} />
      <circle cx="46" cy="18" r="2.2" fill={colors.nodeRing} />
    </g>
  );

  if (variant === "mark") {
    return (
      <svg
        viewBox="0 0 64 64"
        width={size}
        height={size}
        className={className}
        role="img"
        aria-label={title}
      >
        <title>{title}</title>
        {mark}
      </svg>
    );
  }

  const height = size;
  const width = Math.round(size * 4.9);

  return (
    <svg
      viewBox="0 0 245 50"
      width={width}
      height={height}
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <g transform="translate(-4, -7)">{mark}</g>
      <text
        x="66"
        y="33"
        fontFamily="var(--font-heading, 'Instrument Serif', Georgia, serif)"
        fontSize="29"
        fontWeight="400"
        letterSpacing="-0.02em"
        fill={colors.ink}
      >
        Axiom
        <tspan
          fontFamily="var(--font-sans, 'Plus Jakarta Sans', system-ui, sans-serif)"
          fontWeight="600"
          fontSize="24"
          letterSpacing="-0.03em"
          fill={AXIOMFLOW_PALETTE.amberClay}
        >
          flow
        </tspan>
      </text>
      <text
        x="67"
        y="45"
        fontFamily="var(--font-sans, 'Plus Jakarta Sans', system-ui, sans-serif)"
        fontSize="7.5"
        fontWeight="600"
        letterSpacing="0.24em"
        fill={colors.subInk}
      >
        DETERMINISTIC RUNTIME
      </text>
    </svg>
  );
}
