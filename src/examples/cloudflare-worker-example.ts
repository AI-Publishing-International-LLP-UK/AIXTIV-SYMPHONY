/**
 * Cloudflare Worker Usage Example
 * 
 * This example shows how to use the Cloudflare JWT middleware 
 * with a Cloudflare Worker for API protection.
 */

import { cloudflareWorkerJwtMiddleware } from '../middleware/cloudflare-jwt-middleware';
import { CloudflareUserContext, CloudflareJWTClaims } from '../services/cloudflare-jwt-service';

interface Env {
  // Define environment variables if any
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);

    // Public route
    if (url.pathname === '/api/public') {
      return new Response(JSON.stringify({ message: 'Public worker endpoint' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Protected route
    if (url.pathname.startsWith('/api/protected')) {
      // Apply middleware
      const authResponse = await cloudflareWorkerJwtMiddleware(request);
      if (authResponse) {
        // Authentication failed, return response from middleware
        return authResponse;
      }

      // Authentication successful, user context is attached to the request
      const user = (request as any).user as CloudflareUserContext;
      const jwt = (request as any).cloudflareJWT as CloudflareJWTClaims;

      // Example: Admin-only endpoint
      if (url.pathname === '/api/protected/admin') {
        if (!user.roles.includes('admin')) {
          return new Response(
            JSON.stringify({ 
              error: 'Access denied: Admin role required',
              code: 'INSUFFICIENT_PRIVILEGES' 
            }),
            {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            }
          );
        }
        
        return new Response(JSON.stringify({ 
          message: 'Admin-only worker endpoint',
          adminData: 'sensitive worker information'
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // Default protected endpoint response
      return new Response(
        JSON.stringify({
          message: 'Protected worker endpoint',
          user: {
            id: user.id,
            email: user.email,
            roles: user.roles,
            userType: user.userType.name,
            authLevel: user.authLevel
          },
          tokenInfo: {
            issued: new Date(jwt.iat! * 1000),
            expires: new Date(jwt.exp! * 1000),
            audience: jwt.aud
          }
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Default not found response
    return new Response('Not Found', { status: 404 });
  },
};

