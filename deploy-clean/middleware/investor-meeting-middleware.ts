/**
 * Investor Meeting Middleware - Relaxed Authentication for Meeting Access
 * © 2025 AI Publishing International LLP
 * 
 * This middleware provides relaxed authentication specifically for investor meetings
 * while maintaining strict security for super admin access.
 */

import { NextFunction, Request, Response } from 'express';
import {
  getTokenFromRequest,
  validateCloudflareJWT,
  CloudflareJWTClaims,
  CloudflareUserContext,
  extractUserContext
} from '../services/cloudflare-jwt-service';

// Configuration for temporary access relaxation
const RELAXED_ACCESS_ENABLED = true;
const RELAXED_ACCESS_EXPIRES = new Date('2025-08-02T23:59:59Z'); // 48 hours from implementation

/**
 * Relaxed authentication middleware for investor meetings
 * Maintains strict auth for super admin while allowing broader access for meetings
 */
export const investorMeetingAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = getTokenFromRequest(req);

    // If no token and relaxed access is enabled, allow through with guest context
    if (!token && RELAXED_ACCESS_ENABLED && new Date() < RELAXED_ACCESS_EXPIRES) {
      console.log('Allowing guest access for investor meeting period');
      (req as any).user = {
        id: 'guest-' + Date.now(),
        email: 'guest@investor-meeting.temp',
        roles: ['guest', 'meeting_attendee'],
        userType: { name: 'Guest', level: 0 },
        authLevel: 0,
        authProvider: 'RELAXED_ACCESS'
      };
      return next();
    }

    // If token exists, validate it
    if (token) {
      const jwtClaims = await validateCloudflareJWT(token);

      if (jwtClaims) {
        // Check if token is expired - be lenient for non-admin users
        if (jwtClaims.exp && jwtClaims.exp < Math.floor(Date.now() / 1000)) {
          const userContext = extractUserContext(jwtClaims);
          
          // If user is admin/super_admin, enforce strict expiration
          if (userContext.roles.includes('super_admin') || userContext.roles.includes('admin')) {
            return res.status(401).json({
              error: 'Access denied: Admin token has expired',
              code: 'ADMIN_TOKEN_EXPIRED'
            });
          }
          
          // For non-admin users during meeting period, allow expired tokens
          if (RELAXED_ACCESS_ENABLED && new Date() < RELAXED_ACCESS_EXPIRES) {
            console.log('Allowing access with expired token for non-admin user during meeting period');
            (req as any).user = userContext;
            (req as any).cloudflareJWT = jwtClaims;
            return next();
          }
        }

        // Token is valid
        const userContext = extractUserContext(jwtClaims);
        (req as any).user = userContext;
        (req as any).cloudflareJWT = jwtClaims;
        return next();
      }
    }

    // No valid token and relaxed access not enabled or expired
    return res.status(401).json({
      error: 'Access denied: Valid authentication required',
      code: 'AUTH_REQUIRED'
    });

  } catch (error) {
    console.error('Investor meeting auth middleware error:', error);
    
    // During relaxed access period, log error but allow through for non-admin routes
    if (RELAXED_ACCESS_ENABLED && new Date() < RELAXED_ACCESS_EXPIRES) {
      console.log('Allowing access despite auth error during relaxed period');
      (req as any).user = {
        id: 'fallback-' + Date.now(),
        email: 'fallback@investor-meeting.temp',
        roles: ['guest'],
        userType: { name: 'Guest', level: 0 },
        authLevel: 0,
        authProvider: 'FALLBACK'
      };
      return next();
    }

    return res.status(401).json({
      error: 'Access denied: Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

/**
 * Strict admin middleware - always enforces full authentication
 */
export const strictAdminAuthMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = getTokenFromRequest(req);

    if (!token) {
      return res.status(401).json({
        error: 'Access denied: Admin authentication token required',
        code: 'ADMIN_TOKEN_REQUIRED'
      });
    }

    const jwtClaims = await validateCloudflareJWT(token);

    if (!jwtClaims) {
      return res.status(401).json({
        error: 'Access denied: Invalid admin token',
        code: 'INVALID_ADMIN_TOKEN'
      });
    }

    // Strict expiration check for admin
    if (jwtClaims.exp && jwtClaims.exp < Math.floor(Date.now() / 1000)) {
      return res.status(401).json({
        error: 'Access denied: Admin token has expired',
        code: 'ADMIN_TOKEN_EXPIRED'
      });
    }

    const userContext = extractUserContext(jwtClaims);

    // Verify user has admin privileges
    if (!(userContext.roles.includes('super_admin') || userContext.roles.includes('admin'))) {
      return res.status(403).json({
        error: 'Access denied: Admin privileges required',
        code: 'ADMIN_PRIVILEGES_REQUIRED'
      });
    }

    (req as any).user = userContext;
    (req as any).cloudflareJWT = jwtClaims;
    next();

  } catch (error) {
    console.error('Strict admin auth middleware error:', error);
    return res.status(401).json({
      error: 'Access denied: Admin authentication failed',
      code: 'ADMIN_AUTH_FAILED'
    });
  }
};

/**
 * Helper function to check if relaxed access is currently active
 */
export const isRelaxedAccessActive = (): boolean => {
  return RELAXED_ACCESS_ENABLED && new Date() < RELAXED_ACCESS_EXPIRES;
};

/**
 * Get remaining time for relaxed access period
 */
export const getRelaxedAccessTimeRemaining = (): number => {
  if (!RELAXED_ACCESS_ENABLED || new Date() >= RELAXED_ACCESS_EXPIRES) {
    return 0;
  }
  return RELAXED_ACCESS_EXPIRES.getTime() - Date.now();
};
