import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { edgeAuthConfig } from '@/core/lib/auth/edge-config';
import type { NextRequest } from 'next/server';
import { debugLog } from '@/core/infrastructure/monitoring/clientLogger';

const { auth } = NextAuth(edgeAuthConfig);

// Define path permissions for different roles
const rolePermissions = {
  admin: ['/'],
  user: ['/dashboard', '/profile', '/dictionary', '/settings', '/api-test'],
  editor: ['/dashboard', '/content', '/profile'],
} as const;

// Define public paths that don't require authentication
const publicPaths = ['/', '/login', '/signup'];

// Define API paths that need to be accessible
const apiPaths = [
  '/api/auth',
  '/api/user-dictionary',
  '/api/api-test',
  '/api/images',
];

// Custom middleware to enhance the default NextAuth middleware
function enhancedMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Log all API routes for debugging
  if (pathname.startsWith('/api/')) {
    debugLog('Middleware API request debug', {
      method: request.method,
      pathname,
      headers: Object.fromEntries(request.headers),
      cookies: request.cookies
        .getAll()
        .map((c) => `${c.name}=${c.value}`)
        .join('; '),
    });
  }

  return NextResponse.next();
}

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role || 'user';

  // First run our enhanced middleware
  enhancedMiddleware(req);

  // Allow API paths without redirection
  if (apiPaths.some((path) => nextUrl.pathname.startsWith(path))) {
    // Special handling for image API to ensure cookies are properly passed
    if (nextUrl.pathname.startsWith('/api/images/')) {
      const response = NextResponse.next();
      // Add CORS headers for image requests
      response.headers.set('Access-Control-Allow-Origin', '*');
      response.headers.set('Access-Control-Allow-Methods', 'GET');
      response.headers.set('Access-Control-Allow-Headers', 'Content-Type');
      return response;
    }
    return NextResponse.next();
  }

  // Allow public paths
  if (publicPaths.some((path) => nextUrl.pathname === path)) {
    return NextResponse.next();
  }

  // Check if user is logged in
  if (!isLoggedIn) {
    const redirectUrl = new URL('/login', nextUrl);
    redirectUrl.searchParams.set('callbackUrl', nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Check if user has permission to access the path
  const allowedPaths =
    rolePermissions[userRole as keyof typeof rolePermissions] || [];
  const isPathAllowed = allowedPaths.some((path) =>
    nextUrl.pathname.startsWith(path),
  );

  if (!isPathAllowed) {
    // Redirect to dashboard if user tries to access unauthorized path
    return NextResponse.redirect(new URL('/dashboard', nextUrl));
  }

  return NextResponse.next();
});

// Configure which paths should be handled by middleware
export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
    // Match API routes but exclude Next.js internals
    '/api/:path*',
  ],
};
