/**
 * SallyPort Security Layer
 * © 2025 AI Publishing International LLP
 *
 * This layer integrates Cloudflare JWT authentication with the RBAC system
 * to provide fine-grained access control for Express.js routes.
 */

import { Request, Response, NextFunction } from 'express';
import { cloudflareJwtMiddleware } from './middleware/cloudflare-jwt-middleware';
import { authorize as rbacAuthorize } from './rbac/middleware';
import { AuthorizeOptions } from './rbac/types';
import { CloudflareUserContext } from './services/cloudflare-jwt-service';

/**
 * Extends the Cloudflare user context with SallyPort-specific claims.
 */
export interface SallyPortUser extends CloudflareUserContext {
  delegate?: boolean;
  copilot_admin?: boolean;
  vision_access?: boolean;
  subscription_level?: string;
}

/**
 * Middleware to protect routes with authentication and authorization.
 *
 * 1. Verifies the Cloudflare JWT.
 * 2. Attaches the SallyPortUser context to the request.
 * 3. Enforces RBAC rules based on the provided options.
 *
 * @param options - RBAC authorization options.
 */
export const protect = (options: AuthorizeOptions) => {
  return [
    // 1. Authenticate the request using the Cloudflare JWT middleware.
    cloudflareJwtMiddleware,

    // 2. Authorize the request using the RBAC middleware.
    rbacAuthorize(options),
  ];
};

/**
 * Standalone authentication middleware that only validates the JWT and attaches user context.
 * Does not enforce any authorization rules.
 */
export const authenticate = cloudflareJwtMiddleware;

/**
 * Create a custom authorization middleware with specific permission requirements.
 * @param options - RBAC authorization options.
 */
export const authorize = (options: AuthorizeOptions) => rbacAuthorize(options);

/**
 * Helper function to check if a user has a specific SallyPort claim.
 * @param req - Express request object
 * @param claim - The claim to check
 */
export const hasClaim = (req: Request, claim: keyof SallyPortUser): boolean => {
  if (!req.user) return false;
  return !!(req.user as SallyPortUser)[claim];
};

/**
 * Helper function to get the user's subscription level.
 * @param req - Express request object
 */
export const getSubscriptionLevel = (req: Request): string | null => {
  if (!req.user) return null;
  return (req.user as SallyPortUser).subscription_level || null;
};

/**
 * Convenience middleware for common SallyPort feature checks.
 */
export const requireDelegate = protect({ any: ['delegate'] });
export const requireCopilotAdmin = protect({ any: ['copilot_admin'] });
export const requireVisionAccess = protect({ any: ['vision_access'] });
export const requireSubscription = protect({ any: ['subscription_access'] });

// Augment the Express Request type to include the SallyPortUser.
declare global {
  namespace Express {
    interface Request {
      user?: SallyPortUser;
    }
  }
}

