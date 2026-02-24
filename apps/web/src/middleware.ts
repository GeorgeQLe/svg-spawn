import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_PATHS = ['/login', '/api/auth'];
const STATIC_PREFIXES = ['/_next', '/favicon.ico'];

export function middleware(request: NextRequest) {
  // Skip when auth is disabled (no DATABASE_URL)
  if (!process.env.DATABASE_URL) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;

  // Allow public paths and static assets
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    STATIC_PREFIXES.some((p) => pathname.startsWith(p)) ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Check for session cookie (Edge-safe — no heavy imports)
  const sessionCookie = request.cookies.get('better-auth.session_token');
  if (sessionCookie?.value) {
    return NextResponse.next();
  }

  // Redirect to login
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('callbackUrl', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
