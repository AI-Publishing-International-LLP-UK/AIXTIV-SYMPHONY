
/**
 * Agent Authentication and Impersonation Middleware
 *
 * This middleware enforces Cloudflare authentication and provides a secure mechanism
 * for delegation and impersonation of AI pilots, including special controls for
 * Elite 11 and Mastery 33 squadrons.
 *
 * It ensures that all agent-to-agent and agent-to-API calls are authenticated,
 * and that impersonation is only performed by authorized users with the correct
 * permissions.
 */

import { NextFunction, Request, Response } from 'express';
import { cloudflareJwtMiddleware } from './cloudflare-jwt-middleware';
import { ImpersonationService } from '../services/impersonation-service';
import { rbacService } from '../rbac/services/rbac-service';

export const agentAuthMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // First, apply standard Cloudflare JWT authentication
  cloudflareJwtMiddleware(req, res, async () => {
    try {
      const impersonationTarget = req.headers['x-agent-impersonate'] as string;
      const userContext = (req as any).user;

      if (impersonationTarget) {
        // Handle impersonation request
        const impersonationResult = await ImpersonationService.impersonate(
          userContext,
          impersonationTarget
        );

        if (!impersonationResult.success) {
          return res.status(403).json({
            error: 'Impersonation failed',
            code: 'IMPERSONATION_DENIED',
            message: impersonationResult.message,
          });
        }

        // Attach impersonated user context to the request
        (req as any).impersonatedUser = impersonationResult.impersonatedUserContext;
      } else {
        // For regular agent calls, ensure the agent is not a human
        if (userContext.isHuman) {
          return res.status(403).json({
            error: 'Access denied: Endpoint is for agents only',
            code: 'AGENT_ONLY',
          });
        }
      }

      next();
    } catch (error) {
      console.error('Agent auth middleware error:', error);
      res.status(500).json({
        error: 'An unexpected error occurred during agent authentication',
        code: 'AGENT_AUTH_ERROR',
      });
    }
  });
};

