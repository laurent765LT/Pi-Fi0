'use client';

import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'strickin-recent';

/**
 * Tracks recently viewed product IDs in localStorage.
 *
 * @param maxItems - Maximum number of items to keep (default 10).
 */
export function useRecentlyViewed(maxItems = 10): {
  items: string[];
  add: (id: string) => void;
  clear: () => void;
} {
  const [items, setItems] = useState<string[]>([]);

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setItems(parsed.filter((v): v is string => typeof v === 'string').slice(0, maxItems));
        }
      }
    } catch {
      // Corrupted data — ignore
    }
  }, [maxItems]);

  const persist = useCallback((next: string[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Storage full or unavailable — fail silently
    }
  }, []);

  const add = useCallback(
    (id: string) => {
      setItems((prev) => {
        const filtered = prev.filter((item) => item !== id);
        const next = [id, ...filtered].slice(0, maxItems);
        persist(next);
        return next;
      });
    },
    [maxItems, persist],
  );

  const clear = useCallback(() => {
    setItems([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // fail silently
    }
  }, []);

  return { items, add, clear };
}
