'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScrollProgressProps {
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function ScrollProgress({ className }: ScrollProgressProps) {
  const [progress, setProgress] = React.useState(0);
  const rafRef = React.useRef<number>(0);
  const tickingRef = React.useRef(false);

  React.useEffect(() => {
    const updateProgress = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;

      if (docHeight <= 0) {
        setProgress(0);
      } else {
        setProgress(Math.min(100, Math.max(0, (scrollTop / docHeight) * 100)));
      }
      tickingRef.current = false;
    };

    const handleScroll = () => {
      if (!tickingRef.current) {
        tickingRef.current = true;
        rafRef.current = requestAnimationFrame(updateProgress);
      }
    };

    // Initial calculation
    updateProgress();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Scroll progress"
      className={cn(
        'fixed top-0 left-0 w-full h-[3px] z-50 pointer-events-none',
        className,
      )}
    >
      <div
        className="h-full transition-[width] duration-100 ease-out"
        style={{
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #3B1FA8, #5535C4, #3D63F5)',
        }}
      />
    </div>
  );
}

export { ScrollProgress };
export type { ScrollProgressProps };
