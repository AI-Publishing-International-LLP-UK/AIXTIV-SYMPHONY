/**
 * Express.js Usage Example
 * 
 * This example shows how to use the Cloudflare JWT middleware 
 * with an Express.js application for API protection.
 */

import express from 'express';
import cookieParser from 'cookie-parser';
import { cloudflareJwtMiddleware } from '../middleware/cloudflare-jwt-middleware';

const app = express();

// Required middleware
app.use(express.json());
app.use(cookieParser());

// Public routes (no authentication required)
app.get('/api/public', (req, res) => {
  res.json({ message: 'This is a public endpoint' });
});

// Protected routes (authentication required)
app.use('/api/protected', cloudflareJwtMiddleware);

app.get('/api/protected/profile', (req, res) => {
  // Access user context from req.user
  const user = req.user;
  const jwt = req.cloudflareJWT;
  
  res.json({
    message: 'This is a protected endpoint',
    user: {
      id: user?.id,
      email: user?.email,
      roles: user?.roles,
      userType: user?.userType.name,
      authLevel: user?.authLevel
    },
    tokenInfo: {
      issued: new Date(jwt?.iat! * 1000),
      expires: new Date(jwt?.exp! * 1000),
      audience: jwt?.aud
    }
  });
});

app.get('/api/protected/admin', cloudflareJwtMiddleware, (req, res) => {
  const user = req.user;
  
  // Check if user has admin role
  if (!user?.roles.includes('admin')) {
    return res.status(403).json({
      error: 'Access denied: Admin role required',
      code: 'INSUFFICIENT_PRIVILEGES'
    });
  }
  
  res.json({
    message: 'Admin-only endpoint',
    adminData: 'sensitive information'
  });
});

// Role-based access control middleware
const requireRole = (role: string) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const user = req.user;
    
    if (!user?.roles.includes(role)) {
      return res.status(403).json({
        error: `Access denied: ${role} role required`,
        code: 'INSUFFICIENT_PRIVILEGES'
      });
    }
    
    next();
  };
};

// Usage with role-based access
app.get('/api/protected/premium', 
  cloudflareJwtMiddleware, 
  requireRole('premium'), 
  (req, res) => {
    res.json({
      message: 'Premium content',
      user: req.user?.email
    });
  }
);

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Express error:', err);
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Express server running on port ${PORT}`);
  console.log('Cloudflare JWT middleware enabled for /api/protected routes');
});

export default app;
