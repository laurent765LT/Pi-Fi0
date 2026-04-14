import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = [
  '/',
  '/login',
  '/assureur-login',
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
    return addSecurityHeaders(NextResponse.next());
  }

  // For all other protected routes, redirect to login
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return addSecurityHeaders(NextResponse.redirect(loginUrl));
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
