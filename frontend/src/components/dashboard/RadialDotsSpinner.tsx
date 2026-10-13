"use client";

interface RadialDotsSpinnerProps {
  size?: number;
  className?: string;
  color?: string;
}

export default function RadialDotsSpinner({
  size = 36,
  className = "",
  color = "#E06D53",
}: RadialDotsSpinnerProps) {
  // 8 dots arranged in a circle with graded opacities matching the mockup
  const dotCount = 8;
  const radius = 12;
  const center = 18;
  const dotRadius = 2.4;

  return (
    <div
      className={`inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Workflow actively processing"
    >
      <svg
        viewBox="0 0 36 36"
        width={size}
        height={size}
        className="animate-spin"
        style={{ animationDuration: "1.2s", animationTimingFunction: "steps(8, end)" }}
      >
        {Array.from({ length: dotCount }).map((_, index) => {
          const angle = (index * 360) / dotCount - 90;
          const rad = (angle * Math.PI) / 180;
          const cx = center + radius * Math.cos(rad);
          const cy = center + radius * Math.sin(rad);
          const opacity = (index + 1) / dotCount; // from ~0.125 to 1.0

          return (
            <circle
              key={index}
              cx={cx}
              cy={cy}
              r={dotRadius}
              fill={color}
              opacity={opacity}
            />
          );
        })}
      </svg>
    </div>
  );
}
