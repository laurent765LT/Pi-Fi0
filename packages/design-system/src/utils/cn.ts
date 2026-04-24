import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind class names while resolving conflicts.
 *
 * `clsx` handles conditional classes (arrays, objects, falsy values).
 * `twMerge` resolves Tailwind collisions so that the last relevant class wins
 * (e.g. `cn('p-4', condition && 'p-6')` keeps `p-6`).
 *
 * @example
 * cn('px-2 py-1', isActive && 'bg-violet text-white', customClass)
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

export type { ClassValue };
