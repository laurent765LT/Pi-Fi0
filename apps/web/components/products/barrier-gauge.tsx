'use client';

import { cn } from '@/lib/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

interface BarrierGaugeProps {
  /** Barrier level as percentage of initial price (e.g. 60 means 60%) */
  barrierPct: number;
  /** Current underlying position as percentage of initial price (e.g. 95 = -5%) */
  currentPct: number;
  /** Diameter of the SVG in px, defaults to 200 */
  size?: number;
  className?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Convert a value on the gauge scale [0, MAX_DISPLAY] to a rotation angle
 * on a 270° arc, where the arc starts at 225° (bottom-left) and ends at 135°
 * going clockwise.
 *   angle = 225 + (value / MAX_DISPLAY) * 270   (mod 360)
 */
const MAX_DISPLAY = 150; // show up to 150% of initial
const ARC_START_DEG = 225; // leftmost point (0%)
const ARC_TOTAL_DEG = 270; // full sweep

function valueToDeg(value: number): number {
  const clamped = Math.min(MAX_DISPLAY, Math.max(0, value));
  return ARC_START_DEG + (clamped / MAX_DISPLAY) * ARC_TOTAL_DEG;
}

function degToRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Compute a point on the arc given a degree and a radius from center. */
function arcPoint(
  cx: number,
  cy: number,
  radius: number,
  deg: number,
): [number, number] {
  const rad = degToRad(deg);
  return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
}

/**
 * Build an SVG arc path between two degree angles (clockwise on screen).
 * Uses large-arc-flag=1 when the arc spans > 180°.
 */
function arcPath(
  cx: number,
  cy: number,
  radius: number,
  startDeg: number,
  endDeg: number,
): string {
  // Normalise to [0, 360)
  const normalise = (d: number) => ((d % 360) + 360) % 360;
  const s = normalise(startDeg);
  let e = normalise(endDeg);
  // If end == start after normalisation, treat as a full circle (360°)
  if (e === s) e = s + 0.001;

  const [sx, sy] = arcPoint(cx, cy, radius, s);
  const [ex, ey] = arcPoint(cx, cy, radius, e);

  // Determine sweep (always clockwise = sweep-flag 1)
  let sweep = e - s;
  if (sweep < 0) sweep += 360;
  const largeArc = sweep > 180 ? 1 : 0;

  return `M ${sx} ${sy} A ${radius} ${radius} 0 ${largeArc} 1 ${ex} ${ey}`;
}

// ─── Component ───────────────────────────────────────────────────────────────

export function BarrierGauge({
  barrierPct,
  currentPct,
  size = 200,
  className,
}: BarrierGaugeProps) {
  const cx = size / 2;
  const cy = size / 2;
  const outerR = size * 0.4;
  const trackWidth = size * 0.09;
  const innerR = outerR - trackWidth;
  const midR = (outerR + innerR) / 2;

  // Degree positions for key values
  const startDeg = ARC_START_DEG; // 0% of initial
  const barrierDeg = valueToDeg(barrierPct); // barrier level
  const hundredDeg = valueToDeg(100); // initial price = 100%
  const endDeg = ARC_START_DEG + ARC_TOTAL_DEG; // 135°, MAX_DISPLAY

  const needleDeg = valueToDeg(currentPct);
  const needleLen = outerR + size * 0.04;
  const needleBase = innerR - size * 0.04;
  const [needleTipX, needleTipY] = arcPoint(cx, cy, needleLen, needleDeg);
  const [needleBaseX, needleBaseY] = arcPoint(cx, cy, needleBase, needleDeg);

  // Perpendicular points for needle width
  const needleHalfW = size * 0.012;
  const perpDeg = needleDeg + 90;
  const perpRad = degToRad(perpDeg);
  const p1x = needleBaseX + needleHalfW * Math.cos(perpRad);
  const p1y = needleBaseY + needleHalfW * Math.sin(perpRad);
  const p2x = needleBaseX - needleHalfW * Math.cos(perpRad);
  const p2y = needleBaseY - needleHalfW * Math.sin(perpRad);

  // Zone arc paths (ring segments using clip with thick stroke)
  const redPath = arcPath(cx, cy, midR, startDeg, barrierDeg);
  const orangePath = arcPath(cx, cy, midR, barrierDeg, hundredDeg);
  const greenPath = arcPath(cx, cy, midR, hundredDeg, endDeg);

  const strokeW = trackWidth;

  // Label positions
  const barrierLabelR = outerR + size * 0.12;
  const [bLabelX, bLabelY] = arcPoint(cx, cy, barrierLabelR, barrierDeg);
  const currentLabelR = outerR + size * 0.18;
  const [cLabelX, cLabelY] = arcPoint(cx, cy, currentLabelR, needleDeg);

  const fontSize = size * 0.065;
  const labelFontSize = size * 0.055;

  return (
    <div className={cn('inline-flex flex-col items-center gap-2', className)}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        aria-label={`Jauge barrière : barrière à ${barrierPct}%, position actuelle ${currentPct}%`}
        role="img"
      >
        {/* ── Background track ──────────────────────────────── */}
        <path
          d={arcPath(cx, cy, midR, startDeg, endDeg)}
          fill="none"
          stroke="#E2DFF5"
          strokeWidth={strokeW}
          strokeLinecap="round"
        />

        {/* ── Red zone: 0% → barrier ────────────────────────── */}
        <path
          d={redPath}
          fill="none"
          stroke="#E8334A"
          strokeWidth={strokeW}
          strokeLinecap="round"
        />

        {/* ── Orange zone: barrier → 100% ───────────────────── */}
        <path
          d={orangePath}
          fill="none"
          stroke="#F2994A"
          strokeWidth={strokeW}
          strokeLinecap="round"
        />

        {/* ── Green zone: 100% → max ────────────────────────── */}
        <path
          d={greenPath}
          fill="none"
          stroke="#00B894"
          strokeWidth={strokeW}
          strokeLinecap="round"
        />

        {/* ── Barrier tick mark ─────────────────────────────── */}
        {(() => {
          const [tx1, ty1] = arcPoint(cx, cy, innerR - size * 0.02, barrierDeg);
          const [tx2, ty2] = arcPoint(cx, cy, outerR + size * 0.02, barrierDeg);
          return (
            <line
              x1={tx1}
              y1={ty1}
              x2={tx2}
              y2={ty2}
              stroke="#E8334A"
              strokeWidth={size * 0.015}
              strokeLinecap="round"
            />
          );
        })()}

        {/* ── 100% tick mark ────────────────────────────────── */}
        {(() => {
          const [tx1, ty1] = arcPoint(cx, cy, innerR - size * 0.01, hundredDeg);
          const [tx2, ty2] = arcPoint(cx, cy, outerR + size * 0.01, hundredDeg);
          return (
            <line
              x1={tx1}
              y1={ty1}
              x2={tx2}
              y2={ty2}
              stroke="#7B6FA0"
              strokeWidth={size * 0.01}
              strokeLinecap="round"
            />
          );
        })()}

        {/* ── Needle ────────────────────────────────────────── */}
        <polygon
          points={`${needleTipX},${needleTipY} ${p1x},${p1y} ${p2x},${p2y}`}
          fill="#3B1FA8"
          opacity="0.92"
        />

        {/* ── Needle pivot circle ───────────────────────────── */}
        <circle
          cx={cx}
          cy={cy}
          r={size * 0.045}
          fill="#3B1FA8"
        />
        <circle
          cx={cx}
          cy={cy}
          r={size * 0.025}
          fill="white"
        />

        {/* ── Barrier label ─────────────────────────────────── */}
        <text
          x={bLabelX}
          y={bLabelY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={labelFontSize}
          fill="#E8334A"
          fontFamily="DM Mono, monospace"
          fontWeight="600"
        >
          {barrierPct}%
        </text>

        {/* ── Current value label ───────────────────────────── */}
        {Math.abs(needleDeg - barrierDeg) > 15 && (
          <text
            x={cLabelX}
            y={cLabelY}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={labelFontSize}
            fill="#3B1FA8"
            fontFamily="DM Mono, monospace"
            fontWeight="700"
          >
            {currentPct}%
          </text>
        )}

        {/* ── Center value display ──────────────────────────── */}
        <text
          x={cx}
          y={cy + size * 0.1}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={fontSize * 1.3}
          fill="#1A0A3E"
          fontFamily="Syne, sans-serif"
          fontWeight="700"
        >
          {currentPct.toFixed(1)}%
        </text>
        <text
          x={cx}
          y={cy + size * 0.22}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={fontSize * 0.7}
          fill="#7B6FA0"
          fontFamily="DM Sans, sans-serif"
        >
          de l&apos;initial
        </text>
      </svg>

      {/* ── Legend ─────────────────────────────────────────── */}
      <div className="flex items-center gap-3 text-[11px] font-body text-ink-3">
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: '#E8334A' }}
          />
          Zone de risque
        </span>
        <span className="flex items-center gap-1">
          <span
            className="inline-block h-2 w-2 rounded-full"
            style={{ background: '#00B894' }}
          />
          Zone de sécurité
        </span>
      </div>
    </div>
  );
}
