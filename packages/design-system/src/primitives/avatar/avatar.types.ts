import type { HTMLAttributes } from 'react';

export type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

export type AvatarShape = 'circle' | 'rounded';

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  /** Image URL. If missing, `initials` or a fallback glyph is shown. */
  src?: string;
  /** Alt text for the image. Always set for a11y. */
  alt?: string;
  /** Used as a fallback when `src` is absent/fails. */
  initials?: string;
  size?: AvatarSize;
  shape?: AvatarShape;
  /** Status dot overlay (online / busy / etc.). */
  status?: 'online' | 'offline' | 'busy' | 'away';
}
