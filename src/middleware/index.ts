/**
 * Cloudflare JWT Middleware for API Protection
 * 
 * This module provides JWT authentication middleware compatible with:
 * - Express.js applications
 * - Next.js applications  
 * - Cloudflare Workers
 * 
 * Usage:
 * import { cloudflareJwtMiddleware, nextJsCloudflareMiddleware, cloudflareWorkerJwtMiddleware } from '@asoos/cloudflare-jwt-middleware';
 */

// Export middleware functions
export {
  cloudflareJwtMiddleware,
  nextJsCloudflareMiddleware, 
  cloudflareWorkerJwtMiddleware
} from './cloudflare-jwt-middleware';

// Export agent authentication middleware
export { agentAuthMiddleware } from './agent-auth';
export { batchOperationsMiddleware } from './batch-operations';
export { hqrixComplianceMiddleware } from './hqrix-compliance-middleware';

// Export service functions and types
export {
  validateCloudflareJWT,
  getTokenFromRequest,
  extractUserContext,
  CloudflareJWTClaims,
  CloudflareUserContext
} from '../services/cloudflare-jwt-service';

// Export auth types for convenience
export {
  User,
  UserType,
  AuthProvider,
  UserAuthLevel,
  USER_TYPES
} from '../../integrations/auth/user-auth-types';

// Re-export the old service for backwards compatibility
export * from '../services/cloudflare-service';

// Export SallyPort Security Layer
export {
  protect,
  authenticate,
  authorize,
  hasClaim,
  getSubscriptionLevel,
  requireDelegate,
  requireCopilotAdmin,
  requireVisionAccess,
  requireSubscription,
  SallyPortUser
} from '../sallyport';

// Export Investor Meeting Middleware (Temporary)
export {
  investorMeetingAuthMiddleware,
  strictAdminAuthMiddleware,
  isRelaxedAccessActive,
  getRelaxedAccessTimeRemaining
} from './investor-meeting-middleware';
