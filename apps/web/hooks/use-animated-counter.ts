'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Animates a number from 0 to `target` using requestAnimationFrame with ease-out-cubic easing.
 *
 * @param target  - The value to animate towards.
 * @param duration - Animation duration in milliseconds (default 800).
 * @param enabled  - When false the counter stays at 0; set to true to start (default true).
 */
export function useAnimatedCounter(
  target: number,
  duration = 800,
  enabled = true,
): number {
  const [value, setValue] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) {
      setValue(0);
      return;
    }

    // Reset on new animation
    startTimeRef.current = null;

    const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);

    const animate = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }

      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);

      // Preserve integer output when target is an integer
      const current = Number.isInteger(target)
        ? Math.round(easedProgress * target)
        : parseFloat((easedProgress * target).toFixed(2));

      setValue(current);

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [target, duration, enabled]);

  return value;
}
