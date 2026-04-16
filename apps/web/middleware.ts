import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/assureur-login',
  '/assureur-register',
  '/onboarding',
  '/api',
];

const ASSUREUR_PATHS = ['/assureur'];

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Allow static assets and Next.js internals
  if (pathname.startsWith('/_next') || pathname.startsWith('/favicon') || pathname.includes('.')) {
    return addSecurityHeaders(NextResponse.next());
  }

  // Check auth cookie/localStorage token via cookie
  // In demo mode we rely on zustand persisted state, so we check for the cookie
  const authCookie = request.cookies.get('strickin-auth');
  let isAuthenticated = false;
  let userRole = '';

  if (authCookie?.value) {
    try {
      const raw = authCookie.value;
      let parsed: any;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = JSON.parse(decodeURIComponent(raw));
      }
      isAuthenticated = !!(parsed?.state?.token || parsed?.token);

      // Extract user role from cookie
      try {
        const state = parsed?.state ?? parsed;
        userRole = state?.user?.role ?? '';
      } catch {}
    } catch {
      // Cookie exists but malformed — check if it contains a token string
      isAuthenticated = authCookie.value.includes('token');
    }
  }

  // For assureur routes, redirect to assureur login
  if (ASSUREUR_PATHS.some(p => pathname.startsWith(p))) {
    if (!isAuthenticated) {
      return addSecurityHeaders(NextResponse.redirect(new URL('/assureur-login', request.url)));
    }
  }

  // For all other protected routes, redirect to login
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return addSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  // --- Role-based routing (authenticated users only) ---

  // ORG_ADMIN (assureur) trying to access CGP routes → redirect to assureur dashboard
  if (
    userRole === 'ORG_ADMIN' &&
    !pathname.startsWith('/assureur') &&
    !pathname.startsWith('/admin') &&
    !pathname.startsWith('/api')
  ) {
    return addSecurityHeaders(NextResponse.redirect(new URL('/assureur/dashboard', request.url)));
  }

  // VIEWER/MANAGER (CGP) trying to access assureur routes → redirect to CGP dashboard
  // SUPER_ADMIN can access both portals, so we skip them here
  if (
    userRole !== 'ORG_ADMIN' &&
    userRole !== 'SUPER_ADMIN' &&
    pathname.startsWith('/assureur')
  ) {
    return addSecurityHeaders(NextResponse.redirect(new URL('/dashboard', request.url)));
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
