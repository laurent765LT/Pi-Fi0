import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js middleware — Sprint 1 / T1.3.
 *
 * Auth strategy:
 *   1. New production cookie `strickin_access` (HttpOnly JWT, set by the
 *      NestJS API on /auth/login|register|refresh). This is the source of
 *      truth going forward.
 *   2. Legacy cookie `strickin-auth` (Zustand-persisted, demo mode). Kept
 *      working until T1.4 Wave A migrates every page to `useAuth`.
 *
 * For protected paths (`/app/*`, `/cgp/*`, `/assureur/*`, `/admin/*`), we
 * redirect to `/login?returnTo=<path>` when neither cookie yields a valid
 * session. Other routes keep their previous behaviour (public paths pass,
 * role-based redirects for authenticated users).
 */

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/demo',
  '/assureur-login',
  '/assureur-register',
  '/onboarding',
  '/cgu',
  '/confidentialite',
  '/mentions-legales',
  '/status',
  '/tokenisation',
  '/offline',
  '/api',
];

const ASSUREUR_PATHS = ['/assureur'];

/** Routes that must be protected per T1.3 spec. */
const STRICTLY_PROTECTED_PREFIXES = ['/app', '/cgp', '/assureur', '/admin'];

const NEW_AUTH_COOKIE = 'strickin_access';
const LEGACY_AUTH_COOKIE = 'strickin-auth';

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  );
  return response;
}

interface SessionState {
  isAuthenticated: boolean;
  userRole: string;
  /** True when the session comes from the legacy Zustand cookie only. */
  isLegacy: boolean;
}

/**
 * Very lightweight JWT payload peek — we do NOT verify the signature in the
 * middleware (it runs on every request, and secret-loading in edge runtime
 * is fragile). The backend verifies the signature on every API call. The
 * middleware only uses the payload to do role-based routing; a forged token
 * cannot authenticate any API call, so this is safe.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const base64 = (parts[1] ?? '').replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '==='.slice((base64.length + 3) % 4);
    if (typeof atob === 'function') {
      return JSON.parse(atob(padded)) as Record<string, unknown>;
    }
    // Fallback for Node runtime.
    return JSON.parse(
      Buffer.from(padded, 'base64').toString('utf8'),
    ) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function readSession(request: NextRequest): SessionState {
  // ── Prefer the new HttpOnly cookie set by the NestJS API.
  const accessCookie = request.cookies.get(NEW_AUTH_COOKIE);
  if (accessCookie?.value) {
    const payload = decodeJwtPayload(accessCookie.value);
    if (payload && typeof payload.exp === 'number') {
      const nowSec = Math.floor(Date.now() / 1000);
      if (payload.exp > nowSec) {
        return {
          isAuthenticated: true,
          userRole:
            typeof payload.role === 'string' ? (payload.role as string) : '',
          isLegacy: false,
        };
      }
    }
  }

  // ── Fall back to the legacy Zustand cookie.
  const legacyCookie = request.cookies.get(LEGACY_AUTH_COOKIE);
  if (legacyCookie?.value) {
    try {
      const raw = legacyCookie.value;
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = JSON.parse(decodeURIComponent(raw));
      }
      const shaped = parsed as {
        state?: { token?: string; user?: { role?: string } };
        token?: string;
        user?: { role?: string };
      } | null;
      const state = shaped?.state ?? shaped ?? {};
      const token = state?.token ?? null;
      const role = state?.user?.role ?? '';
      return {
        isAuthenticated: Boolean(token),
        userRole: typeof role === 'string' ? role : '',
        isLegacy: true,
      };
    } catch {
      return {
        isAuthenticated: legacyCookie.value.includes('token'),
        userRole: '',
        isLegacy: true,
      };
    }
  }

  return { isAuthenticated: false, userRole: '', isLegacy: false };
}

function buildLoginRedirect(
  request: NextRequest,
  basePath: '/login' | '/assureur-login',
): NextResponse {
  const url = new URL(basePath, request.url);
  const target = request.nextUrl.pathname + request.nextUrl.search;
  url.searchParams.set('returnTo', target);
  // Keep `redirect` for backward compatibility with existing login pages.
  url.searchParams.set('redirect', target);
  return NextResponse.redirect(url);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths.
  if (
    PUBLIC_PATHS.some(
      (p) => pathname === p || pathname.startsWith(p + '/'),
    )
  ) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Allow static assets and Next.js internals.
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.includes('.')
  ) {
    return addSecurityHeaders(NextResponse.next());
  }

  const session = readSession(request);
  const isProtected = STRICTLY_PROTECTED_PREFIXES.some((p) =>
    pathname.startsWith(p),
  );

  // For assureur routes, redirect to assureur login.
  if (ASSUREUR_PATHS.some((p) => pathname.startsWith(p))) {
    if (!session.isAuthenticated) {
      return addSecurityHeaders(
        buildLoginRedirect(request, '/assureur-login'),
      );
    }
  } else if (isProtected && !session.isAuthenticated) {
    // Sprint 1 / T1.3: `/app/*`, `/cgp/*`, `/admin/*` MUST redirect to /login
    // with the original path preserved in `returnTo`.
    return addSecurityHeaders(buildLoginRedirect(request, '/login'));
  } else if (!session.isAuthenticated) {
    // For all other protected routes (legacy behaviour) keep redirecting.
    return addSecurityHeaders(buildLoginRedirect(request, '/login'));
  }

  // --- Role-based routing (authenticated users only) ---

  // ORG_ADMIN (assureur) accessing CGP routes → redirect to assureur dashboard.
  if (
    session.userRole === 'ORG_ADMIN' &&
    !pathname.startsWith('/assureur') &&
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/api')
  ) {
    return addSecurityHeaders(
      NextResponse.redirect(new URL('/assureur/dashboard', request.url)),
    );
  }

  // VIEWER/MANAGER (CGP) accessing assureur routes → redirect to CGP dashboard.
  if (
    session.userRole !== 'ORG_ADMIN' &&
    session.userRole !== 'SUPER_ADMIN' &&
    pathname.startsWith('/assureur')
  ) {
    return addSecurityHeaders(
      NextResponse.redirect(new URL('/dashboard', request.url)),
    );
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
