/**
 * Next.js Usage Example
 * 
 * This example shows how to use the Cloudflare JWT middleware 
 * with Next.js applications for API protection.
 * 
 * Place this file as middleware.ts in your Next.js app directory.
 */

import { NextRequest, NextResponse } from 'next/server';
import { nextJsCloudflareMiddleware } from '../middleware/cloudflare-jwt-middleware';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for public routes
  if (
    pathname.startsWith('/api/public') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/'
  ) {
    return NextResponse.next();
  }

  // Apply JWT middleware to protected routes
  if (pathname.startsWith('/api/protected') || pathname.startsWith('/dashboard')) {
    const response = await nextJsCloudflareMiddleware(request);
    
    // If response is not NextResponse.next(), it means authentication failed
    if (response.status !== 200) {
      return response;
    }
    
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/protected/:path*',
    '/dashboard/:path*'
  ]
};

/**
 * Example API route that uses the middleware
 * File: app/api/protected/profile/route.ts
 */
export async function GET(request: NextRequest) {
  // Extract user context from headers (set by middleware)
  const userContextHeader = request.headers.get('x-user-context');
  const jwtHeader = request.headers.get('x-cloudflare-jwt');
  
  if (!userContextHeader) {
    return NextResponse.json(
      { error: 'User context not found' },
      { status: 401 }
    );
  }

  const userContext = JSON.parse(userContextHeader);
  const jwtClaims = jwtHeader ? JSON.parse(jwtHeader) : null;

  return NextResponse.json({
    message: 'Protected Next.js API route',
    user: {
      id: userContext.id,
      email: userContext.email,
      roles: userContext.roles,
      userType: userContext.userType.name,
      authLevel: userContext.authLevel
    },
    tokenInfo: jwtClaims ? {
      issued: new Date(jwtClaims.iat * 1000),
      expires: new Date(jwtClaims.exp * 1000),
      audience: jwtClaims.aud
    } : null
  });
}

/**
 * Example page component that checks authentication
 * File: app/dashboard/page.tsx
 */
import { headers } from 'next/headers';

export default function DashboardPage() {
  const headersList = headers();
  const userContextHeader = headersList.get('x-user-context');
  
  if (!userContextHeader) {
    return <div>Access denied</div>;
  }

  const userContext = JSON.parse(userContextHeader);

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome, {userContext.email}!</p>
      <p>User Type: {userContext.userType.name}</p>
      <p>Auth Level: {userContext.authLevel}</p>
      <p>Roles: {userContext.roles.join(', ')}</p>
    </div>
  );
}

/**
 * Client-side hook for accessing user context
 * File: hooks/useAuth.ts
 */
import { useEffect, useState } from 'react';

interface UserContext {
  id: string;
  email: string;
  roles: string[];
  userType: { name: string };
  authLevel: number;
}

export function useAuth() {
  const [user, setUser] = useState<UserContext | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      try {
        const response = await fetch('/api/protected/profile');
        if (response.ok) {
          const data = await response.json();
          setUser(data.user);
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUser();
  }, []);

  return { user, loading };
}
