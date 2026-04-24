'use client';

// ─── <AuthGuard /> — UI-level role gate ──────────────────────────────────────
// Wraps a subtree and renders it only if the current user is authenticated
// (and, optionally, holds one of the required roles). For full page-level
// redirection use `middleware.ts` — this component is for in-page widgets.

import * as React from 'react';
import { useAuth } from '../../hooks/use-auth';
import type { UserRole } from '@strickin/shared';

type RoleLike = UserRole | string;

interface AuthGuardProps {
  children: React.ReactNode;
  /** Allow only these roles. Accepts the shared enum or legacy string values. */
  requiredRole?: RoleLike | RoleLike[];
  /** Rendered when the user fails the check. Defaults to `null`. */
  fallback?: React.ReactNode;
}

export function AuthGuard({
  children,
  requiredRole,
  fallback = null,
}: AuthGuardProps): React.ReactElement {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) return <>{fallback}</>;

  if (requiredRole !== undefined) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    const userRole = (user as { role?: RoleLike } | null)?.role;
    if (!userRole || !roles.includes(userRole)) return <>{fallback}</>;
  }

  return <>{children}</>;
}
