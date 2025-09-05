/**
 * Batch Operations Authentication Middleware
 *
 * This middleware provides enhanced authentication and authorization for batch/bulk operations,
 * ensuring that all batch operations are properly authenticated through Cloudflare and that
 * users have the appropriate permissions for bulk operations.
 *
 * Bulk operations require special permissions due to their potential for system-wide impact.
 */

import { NextFunction, Request, Response } from 'express';
import { agentAuthMiddleware } from './agent-auth';
import { rbacService } from '../rbac/services/rbac-service';
import { UserContext } from '../rbac/types';

export const batchOperationsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // First, apply agent authentication
  agentAuthMiddleware(req, res, async () => {
    try {
      const userContext = (req as any).user as UserContext;
      const impersonatedUser = (req as any).impersonatedUser as UserContext;
      const effectiveUser = impersonatedUser || userContext;

      // Check if the user has permissions for batch operations
      if (!canPerformBatchOperations(effectiveUser)) {
        return res.status(403).json({
          error: 'Insufficient permissions for batch operations',
          code: 'BATCH_OPERATIONS_DENIED',
          message: 'Batch operations require elevated permissions',
        });
      }

      // Additional logging for batch operations
      console.log(
        `Batch operation authorized for user ${effectiveUser.id}${
          impersonatedUser ? ` (impersonated by ${userContext.id})` : ''
        }`
      );

      next();
    } catch (error) {
      console.error('Batch operations middleware error:', error);
      res.status(500).json({
        error: 'An unexpected error occurred during batch operations authentication',
        code: 'BATCH_AUTH_ERROR',
      });
    }
  });
};

/**
 * Checks if a user can perform batch operations.
 */
function canPerformBatchOperations(userContext: UserContext): boolean {
  // Owners and admins can always perform batch operations
  if (rbacService.hasPermission(userContext, 'all_access')) {
    return true;
  }

  // Elite 11 and Mastery 33 can perform batch operations
  if (userContext.squadron === 'elite_11' || userContext.squadron === 'mastery_33') {
    return true;
  }

  // Users with specific batch operation permissions
  if (rbacService.hasPermission(userContext, 'manage_agents')) {
    return true;
  }

  return false;
}
