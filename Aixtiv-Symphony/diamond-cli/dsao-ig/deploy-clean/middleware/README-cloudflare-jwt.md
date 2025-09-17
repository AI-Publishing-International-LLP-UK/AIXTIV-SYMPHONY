# Cloudflare JWT Middleware for API Protection

This document provides comprehensive guidance on implementing Cloudflare JWT middleware for securing APIs across Express, Next.js, and Cloudflare Workers.

## Overview

The middleware provides universal API protection by:
- Verifying and validating Cloudflare Access JWTs from multiple sources (headers, cookies)
- Attaching rich user/session context with roles and permissions to request objects
- Denying access for expired, invalid, or missing tokens
- Supporting role-based access control (RBAC)

## Architecture

### Core Components

```
src/
├── middleware/
│   └── cloudflare-jwt-middleware.ts    # Multi-platform middleware implementations
├── services/
│   └── cloudflare-jwt-service.ts       # JWT validation and user context extraction
├── examples/
│   ├── express-example.ts              # Express.js integration example
│   ├── nextjs-example.ts               # Next.js middleware example
│   └── cloudflare-worker-example.ts    # Cloudflare Workers example
└── config/
    └── cloudflare-jwt.env.template     # Environment configuration
```

## Installation

```bash
# Install required dependencies
npm install express jsonwebtoken jwks-rsa cookie-parser
npm install -D @types/express @types/cookie-parser @types/jsonwebtoken

# For Next.js applications, also install:
npm install next

# For Cloudflare Workers, no additional dependencies needed
```

## Configuration

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Your Cloudflare for Teams domain
CLOUDFLARE_TEAM_DOMAIN=your-team.cloudflareaccess.com

# Application audience (AUD tag from Cloudflare Zero Trust)
CLOUDFLARE_AUDIENCE=your-application-aud-tag

# Optional: Custom application domain
CLOUDFLARE_APP_DOMAIN=your-app.example.com

NODE_ENV=development
PORT=3000
```

### Cloudflare Zero Trust Setup

1. **Create an Application** in Cloudflare Zero Trust dashboard
2. **Configure Access Policies** for your application
3. **Note the AUD tag** - this becomes your `CLOUDFLARE_AUDIENCE`
4. **Set up Identity Providers** (Google, Microsoft, etc.)

## Usage Examples

### Express.js Implementation

```typescript
import express from 'express';
import cookieParser from 'cookie-parser';
import { cloudflareJwtMiddleware } from './middleware/cloudflare-jwt-middleware';

const app = express();

app.use(express.json());
app.use(cookieParser());

// Public routes
app.get('/api/public', (req, res) => {
  res.json({ message: 'Public endpoint' });
});

// Protected routes
app.use('/api/protected', cloudflareJwtMiddleware);

app.get('/api/protected/profile', (req, res) => {
  const user = req.user;
  res.json({
    user: {
      id: user?.id,
      email: user?.email,
      roles: user?.roles,
      userType: user?.userType.name,
      authLevel: user?.authLevel
    }
  });
});
```

### Next.js Implementation

**middleware.ts** (in your app root):

```typescript
import { NextRequest } from 'next/server';
import { nextJsCloudflareMiddleware } from './src/middleware/cloudflare-jwt-middleware';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public routes
  if (pathname.startsWith('/api/public')) {
    return NextResponse.next();
  }

  // Apply JWT middleware to protected routes
  if (pathname.startsWith('/api/protected')) {
    return await nextJsCloudflareMiddleware(request);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/protected/:path*', '/dashboard/:path*']
};
```

**API Route Example** (`app/api/protected/profile/route.ts`):

```typescript
export async function GET(request: NextRequest) {
  const userContextHeader = request.headers.get('x-user-context');
  const userContext = JSON.parse(userContextHeader!);

  return NextResponse.json({
    user: userContext,
    message: 'Protected Next.js endpoint'
  });
}
```

### Cloudflare Workers Implementation

```typescript
import { cloudflareWorkerJwtMiddleware } from './middleware/cloudflare-jwt-middleware';

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Public route
    if (url.pathname === '/api/public') {
      return new Response(JSON.stringify({ message: 'Public worker endpoint' }));
    }

    // Protected route
    if (url.pathname.startsWith('/api/protected')) {
      const authResponse = await cloudflareWorkerJwtMiddleware(request);
      if (authResponse) {
        return authResponse; // Authentication failed
      }

      // Access user context
      const user = (request as any).user;
      return new Response(JSON.stringify({
        message: 'Protected worker endpoint',
        user: user
      }));
    }

    return new Response('Not Found', { status: 404 });
  }
};
```

## Advanced Features

### Role-Based Access Control

```typescript
// Express middleware for role checking
const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user?.roles.includes(role)) {
      return res.status(403).json({
        error: `Access denied: ${role} role required`,
        code: 'INSUFFICIENT_PRIVILEGES'
      });
    }
    next();
  };
};

// Usage
app.get('/api/protected/admin', 
  cloudflareJwtMiddleware, 
  requireRole('admin'), 
  (req, res) => {
    res.json({ message: 'Admin-only content' });
  }
);
```

### Custom User Types

Modify `user-auth-types.ts` to define your application's user types:

```typescript
export const USER_TYPES = {
  guest: {
    id: 'guest',
    level: UserAuthLevel.NON_AUTHENTICATED,
    name: 'Guest',
    privileges: ['view_public_content'],
    allowedOperations: ['read_public']
  },
  premium: {
    id: 'premium',
    level: UserAuthLevel.FULLY_REGISTERED,
    name: 'Premium User',
    privileges: ['view_public_content', 'access_premium_features'],
    allowedOperations: ['read_public', 'read_premium', 'write_comments']
  }
};
```

## Token Sources

The middleware automatically checks for tokens in:

1. **Authorization Header**: `Bearer <token>`
2. **Cloudflare Header**: `CF-Access-Jwt-Assertion: <token>`
3. **Cookies**: `CF_Authorization=<token>`

## Error Responses

The middleware provides standardized error responses:

- **NO_TOKEN**: No authentication token provided
- **INVALID_TOKEN**: Token is malformed or signature verification failed
- **TOKEN_EXPIRED**: Token has expired
- **AUTH_FAILED**: General authentication failure

## Security Considerations

1. **JWKS Validation**: The middleware uses Cloudflare's JWKS endpoint for signature verification
2. **Token Expiration**: Automatic validation of `exp` claim
3. **Audience Verification**: Ensures tokens are intended for your application
4. **Issuer Verification**: Validates tokens come from your Cloudflare team

## Testing

```typescript
// Example test setup
describe('Cloudflare JWT Middleware', () => {
  it('should allow access with valid token', async () => {
    const mockToken = 'valid.jwt.token';
    const response = await request(app)
      .get('/api/protected/profile')
      .set('Authorization', `Bearer ${mockToken}`)
      .expect(200);
    
    expect(response.body.user).toBeDefined();
  });

  it('should deny access without token', async () => {
    const response = await request(app)
      .get('/api/protected/profile')
      .expect(401);
    
    expect(response.body.code).toBe('NO_TOKEN');
  });
});
```

## Troubleshooting

### Common Issues

1. **"No KID in JWT header"**: Ensure your Cloudflare application is properly configured
2. **"Invalid audience"**: Check `CLOUDFLARE_AUDIENCE` matches your application's AUD tag
3. **"Token validation failed"**: Verify `CLOUDFLARE_TEAM_DOMAIN` is correct

### Debug Mode

Enable detailed logging:

```typescript
process.env.DEBUG = 'cloudflare-jwt:*';
```

## Performance Considerations

- **JWKS Caching**: The middleware caches public keys to avoid repeated fetches
- **Token Parsing**: Lightweight JWT parsing with signature verification
- **Memory Usage**: User context objects are ephemeral and garbage collected

## Integration with ASOOS

This middleware integrates seamlessly with the Aixtiv Symphony Orchestrating Operating System (ASOOS):

- **User Types**: Aligns with ASOOS pilot classification system
- **Permissions**: Supports ASOOS role-based access patterns
- **Agent Context**: Provides user context for AI agent interactions

For questions or support, consult the ASOOS Integration Gateway documentation or reach out to the development team.
