import type { IconComponent } from '../page-header/page-header.types';

export interface EmptyStateProps {
  icon: IconComponent;
  title: string;
  description?: string;
  /** Visible label for the primary action. */
  actionLabel?: string;
  /** If set, the action renders as a `<Link>` to this URL. */
  actionHref?: string;
  /** If set (and no `actionHref`), the action renders as a button. */
  onAction?: () => void;
  /** Accent colour for the icon gradient background. Default: brand violet. */
  accentColor?: string;
  className?: string;
}
