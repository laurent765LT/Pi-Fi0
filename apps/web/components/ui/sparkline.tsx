'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SparklineProps {
  /** Array of numeric values to plot */
  data: number[];
  /** SVG width in px (default 60) */
  width?: number;
  /** SVG height in px (default 20) */
  height?: number;
  /** Stroke / fill color (default teal #00B894) */
  color?: string;
  /** Stroke width (default 1.5) */
  strokeWidth?: number;
  /** Additional className for the wrapper */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function Sparkline({
  data,
  width = 60,
  height = 20,
  color = '#00B894',
  strokeWidth = 1.5,
  className,
}: SparklineProps) {
  const gradientId = React.useId();

  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const padY = 2;
  const chartH = height - padY * 2;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = padY + chartH - ((val - min) / range) * chartH;
    return `${x},${y}`;
  });

  const polylinePoints = points.join(' ');

  // Closed polygon for gradient fill area
  const fillPoints = [...points, `${width},${height}`, `0,${height}`].join(' ');

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className={cn('inline-block shrink-0', className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Gradient fill below the line */}
      <polygon points={fillPoints} fill={`url(#${gradientId})`} />

      {/* Line */}
      <polyline
        points={polylinePoints}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export { Sparkline };
export type { SparklineProps };
