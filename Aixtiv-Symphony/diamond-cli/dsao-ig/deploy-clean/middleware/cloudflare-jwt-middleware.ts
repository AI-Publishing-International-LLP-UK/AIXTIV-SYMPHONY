/**
 * Cloudflare JWT Middleware for API Protection
 * Compatible with Express, Next.js, and Cloudflare Workers
 * 
 * This middleware:
 * - Verifies and validates Cloudflare Access JWTs in incoming requests
 * - Attaches user/session context and claims to the request object
 * - Denies access for expired/invalid tokens
 * - Supports multiple token sources (headers, cookies)
 */

import { NextFunction, Request, Response } from 'express';
import { NextRequest, NextResponse } from 'next/server';
import { UserAuthLevel, USER_TYPES } from '../../integrations/auth/user-auth-types';
import {
  getTokenFromRequest,
  validateCloudflareJWT,
  CloudflareJWTClaims,
  CloudflareUserContext,
  extractUserContext
} from '../services/cloudflare-jwt-service';

// Express middleware
export const cloudflareJwtMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({
        error: 'Access denied: No authentication token provided',
        code: 'NO_TOKEN'
      });
    }

    const jwtClaims = await validateCloudflareJWT(token);

    if (!jwtClaims) {
      return res.status(401).json({
        error: 'Access denied: Invalid or expired token',
        code: 'INVALID_TOKEN'
      });
    }

    // Check if token is expired
    if (jwtClaims.exp && jwtClaims.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({
        error: 'Access denied: Token has expired',
        code: 'TOKEN_EXPIRED'
      });
    }

// Extract user context and attach to request
    const userContext = extractUserContext(jwtClaims);
    (req as any).user = userContext;
    (req as any).cloudflareJWT = jwtClaims;

    // Temporarily relax access for non-admin roles
    if (!(userContext.roles.includes('super_admin') || userContext.roles.includes('admin'))) {
      console.log('Access temporarily relaxed for non-admin users');
      next();
      return;
    }

    next();
  } catch (error) {
    console.error('Cloudflare JWT middleware error:', error);
    return res.status(401).json({
      error: 'Access denied: Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

// Next.js middleware
export const nextJsCloudflareMiddleware = async (request: NextRequest) => {
  try {
    const token = getTokenFromNextRequest(request);

    if (!token) {
      return NextResponse.json(
        { error: 'Access denied: No authentication token provided', code: 'NO_TOKEN' },
        { status: 401 }
      );
    }

    const jwtClaims = await validateCloudflareJWT(token);

    if (!jwtClaims) {
      return NextResponse.json(
        { error: 'Access denied: Invalid or expired token', code: 'INVALID_TOKEN' },
        { status: 401 }
      );
    }

    // Check if token is expired
    if (jwtClaims.exp && jwtClaims.exp < Math.floor(Date.now() / 1000)) {
      return NextResponse.json(
        { error: 'Access denied: Token has expired', code: 'TOKEN_EXPIRED' },
        { status: 401 }
      );
    }

    // Create response and attach user context
    const response = NextResponse.next();
    const userContext = extractUserContext(jwtClaims);
    
    // Attach to headers for downstream use
    response.headers.set('x-user-context', JSON.stringify(userContext));
    response.headers.set('x-cloudflare-jwt', JSON.stringify(jwtClaims));

    return response;
  } catch (error) {
    console.error('Next.js Cloudflare JWT middleware error:', error);
    return NextResponse.json(
      { error: 'Access denied: Authentication failed', code: 'AUTH_FAILED' },
      { status: 401 }
    );
  }
};

// Cloudflare Workers middleware
export const cloudflareWorkerJwtMiddleware = async (request: Request): Promise<Response | null> => {
  try {
    const token = getTokenFromWorkerRequest(request);

    if (!token) {
      return new Response(
        JSON.stringify({
          error: 'Access denied: No authentication token provided',
          code: 'NO_TOKEN'
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const jwtClaims = await validateCloudflareJWT(token);

    if (!jwtClaims) {
      return new Response(
        JSON.stringify({
          error: 'Access denied: Invalid or expired token',
          code: 'INVALID_TOKEN'
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Check if token is expired
    if (jwtClaims.exp && jwtClaims.exp < Math.floor(Date.now() / 1000)) {
      return new Response(
        JSON.stringify({
          error: 'Access denied: Token has expired',
          code: 'TOKEN_EXPIRED'
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Attach user context to request (in Workers, we return null to continue)
    const userContext = extractUserContext(jwtClaims);
    (request as any).user = userContext;
    (request as any).cloudflareJWT = jwtClaims;

    return null; // Continue processing
  } catch (error) {
    console.error('Cloudflare Workers JWT middleware error:', error);
    return new Response(
      JSON.stringify({
        error: 'Access denied: Authentication failed',
        code: 'AUTH_FAILED'
      }),
      {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

// Helper function to get token from Next.js request
function getTokenFromNextRequest(request: NextRequest): string | null {
  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check CF-Access-Jwt-Assertion header (Cloudflare specific)
  const cfJwtHeader = request.headers.get('cf-access-jwt-assertion');
  if (cfJwtHeader) {
    return cfJwtHeader;
  }

  // Check cookies
  const cfAuthCookie = request.cookies.get('CF_Authorization');
  if (cfAuthCookie) {
    return cfAuthCookie.value;
  }

  return null;
}

// Helper function to get token from Cloudflare Workers request
function getTokenFromWorkerRequest(request: Request): string | null {
  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check CF-Access-Jwt-Assertion header (Cloudflare specific)
  const cfJwtHeader = request.headers.get('cf-access-jwt-assertion');
  if (cfJwtHeader) {
    return cfJwtHeader;
  }

  // Check cookies (in Workers)
  const cookieHeader = request.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';');
    const cfAuthCookie = cookies.find(cookie => 
      cookie.trim().startsWith('CF_Authorization=')
    );
    if (cfAuthCookie) {
      return cfAuthCookie.split('=')[1].trim();
    }
  }

  return null;
}

// Type augmentation for Express Request
declare global {
  namespace Express {
    interface Request {
      user?: CloudflareUserContext;
      cloudflareJWT?: CloudflareJWTClaims;
    }
  }
}
