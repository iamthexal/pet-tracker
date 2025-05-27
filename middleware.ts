import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import isMobile from 'is-mobile';

// List of all public paths
const publicPaths = [
  '/signin',
  '/signup',
  '/reset-password',
  '/mobile-not-supported',
  '/mobile-not-supported/why-desktop',
  '/',
  '/__/auth', // Updated to catch all auth paths
];

// List of paths that should redirect to dashboard if authenticated
const authPaths = ['/signin', '/signup'];

// List of protected paths that require authentication
const protectedPaths = [
  '/dashboard',
  '/settings',
  '/pets',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow Firebase auth paths
  if (pathname.startsWith('/__/auth')) {
    return NextResponse.next();
  }

  // Allow favicon.ico explicitly
  if (pathname === '/favicon.ico') {
    return NextResponse.next();
  }

  // Handle API routes and static files
  if (
    pathname.startsWith('/_next') || // Static files
    pathname.startsWith('/api') ||  // API routes
    pathname.startsWith('/static') || // Other static content
    pathname.includes('.') // Files with extensions like .js, .css, .png
  ) {
    return NextResponse.next();
  }

  // Detect mobile user agents
  const userAgent = request.headers.get('user-agent') || '';

  if (isMobile({ ua: userAgent })) {
    // Allow access to specific mobile-supported pages
    if (publicPaths.some(path => pathname.startsWith(path))) {
      return NextResponse.next();
    }

    // Redirect all other mobile requests to /mobile-not-supported
    return NextResponse.redirect(new URL('/mobile-not-supported', request.url));
  }

  // Get the token from cookies
  const token = request.cookies.get('__session')?.value;

  // Check if the path is public
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path));

  // Check if the path is an auth path that should redirect when authenticated
  const isAuthPath = authPaths.some(path => pathname.startsWith(path));

  // Check if the path requires authentication
  const isProtectedPath = protectedPaths.some(path => pathname.startsWith(path));

  // Allow access to public paths regardless of authentication status
  if (isPublicPath && !isAuthPath) {
    return NextResponse.next();
  }

  // If user is authenticated and trying to access auth paths, redirect to dashboard
  if (token && isAuthPath) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If path is protected and user is not authenticated, redirect to signin
  if (isProtectedPath && !token) {
    const redirectUrl = new URL('/signin', request.url);
    redirectUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Allow access to all other routes
  return NextResponse.next();
}

// Configure matcher
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|static|.*\\..*$).*)',
    '/__/auth/:path*'  // Updated matcher for all auth paths
  ],
};