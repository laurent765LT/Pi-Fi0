import type { ComponentType, ReactNode, SVGProps } from 'react';

/**
 * Loose type for a Lucide-style icon component. Accepts any component that
 * takes `SVGProps<SVGSVGElement>` (plus Lucide's `size` / `color` sugar).
 *
 * We mirror Lucide's signature rather than importing `LucideIcon` so the
 * design-system package has zero runtime deps on `lucide-react`.
 */
export type IconComponent = ComponentType<
  SVGProps<SVGSVGElement> & {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
  }
>;

export interface PageHeaderProps {
  icon: IconComponent;
  title: ReactNode;
  subtitle?: string;
  /** Gradient start color for the icon chip. Defaults to brand violet. */
  accentFrom?: string;
  /** Gradient end color for the icon chip. Defaults to ink. */
  accentTo?: string;
  /** Right-hand slot for action buttons. */
  children?: ReactNode;
  className?: string;
}
