'use client';

import { useEffect, useRef, useState } from 'react';

interface UseScrollRevealOptions {
  /** Percentage of element visible before triggering (0-1). Default 0.1 */
  threshold?: number;
  /** If true, element stays visible once revealed. Default true */
  once?: boolean;
}

/**
 * Uses IntersectionObserver to detect when an element enters the viewport.
 *
 * @returns `ref` to attach to the target element and `isVisible` boolean.
 */
export function useScrollReveal<T extends HTMLElement>(
  options?: UseScrollRevealOptions,
): { ref: React.RefObject<T>; isVisible: boolean } {
  const { threshold = 0.1, once = true } = options ?? {};
  const ref = useRef<T>(null!);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.unobserve(element);
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, once]);

  return { ref, isVisible };
}
