import { NextResponse } from 'next/server';
import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth/auth.config';

const { auth } = NextAuth(authConfig);

// Define path permissions for different roles
const rolePermissions = {
    admin: ['/dashboard', '/users', '/settings', '/profile'],
    user: ['/dashboard', '/profile', '/dictionary', '/settings'],
    editor: ['/dashboard', '/content', '/profile'],
} as const;

// Define public paths that don't require authentication
const publicPaths = ['/', '/login', '/signup'];

// Define API paths that need to be accessible
const apiPaths = ['/api/auth'];

export default auth((req) => {
    const { nextUrl } = req;
    const isLoggedIn = !!req.auth;
    const userRole = req.auth?.user?.role || 'user';

    // Allow API paths without redirection
    if (apiPaths.some((path) => nextUrl.pathname.startsWith(path))) {
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
        nextUrl.pathname.startsWith(path)
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
    ],
};
