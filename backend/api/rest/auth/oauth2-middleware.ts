/**
 * OAuth2 Middleware for REST API Authentication
 * Provides Express middleware for validating OAuth2 tokens on API requests
 */

import { Request, Response, NextFunction } from 'express';
import { oauth2Service, TokenPayload } from './oauth2-service';

// Extend Express Request to include user information from token
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      token?: string;
    }
  }
}

/**
 * Permission Check Options Interface
 */
interface PermissionCheckOptions {
  requiredScopes?: string[];
  allowAnonymous?: boolean;
}

/**
 * Middleware to authenticate requests using OAuth2 Bearer tokens
 */
export function authenticateRequest(options: PermissionCheckOptions = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      if (options.allowAnonymous) {
        return next();
      }
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    // Extract token from header
    const [type, token] = authHeader.split(' ');
    if (type !== 'Bearer' || !token) {
      return res.status(401).json({ error: 'Invalid authorization header format' });
    }

    // Validate the token
    const payload = oauth2Service.validateToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Check required scopes if specified
    if (options.requiredScopes && options.requiredScopes.length > 0) {
      const tokenScopes = payload.scope ? payload.scope.split(' ') : [];
      const hasRequiredScopes = options.requiredScopes.every(scope => 
        tokenScopes.includes(scope)
      );

      if (!hasRequiredScopes) {
        return res.status(403).json({ 
          error: 'Insufficient permissions',
          requiredScopes: options.requiredScopes,
          providedScopes: tokenScopes
        });
      }
    }

    // Add user and token to request for use in route handlers
    req.user = payload;
    req.token = token;
    
    next();
  };
}

/**
 * Create middleware with specific scope requirements
 */
export function requireScopes(scopes: string[]) {
  return authenticateRequest({ requiredScopes: scopes });
}

/**
 * Middleware factory functions for common API permissions
 */
export const requirePermissions = {
  products: {
    read: requireScopes(['api.products.read']),
    write: requireScopes(['api.products.write'])
  },
  video: {
    read: requireScopes(['api.video.read']),
    write: requireScopes(['api.video.write'])
  },
  speech: {
    read: requireScopes(['api.speech.read']),
    write: requireScopes(['api.speech.write'])
  },
  admin: requireScopes(['api.admin'])
};

/**
 * Optional authentication middleware that doesn't reject anonymous requests
 */
export const optionalAuthentication = authenticateRequest({ allowAnonymous: true });

/**
 * Helper middleware to check client ID for service-to-service requests
 */
export function validateClientId(allowedClientIds: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if the client ID is in the allowed list
    const clientId = req.user.aud && Array.isArray(req.user.aud) 
      ? req.user.aud[0] 
      : (req.user.aud as string);

    if (!clientId || !allowedClientIds.includes(clientId)) {
      return res.status(403).json({ error: 'Unauthorized client' });
    }

    next();
  };
}