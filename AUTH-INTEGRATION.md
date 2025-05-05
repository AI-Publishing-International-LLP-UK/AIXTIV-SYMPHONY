# Authentication Integration Guide

This document outlines the authentication system implemented in the Aixtiv Symphony Opus Operating System (ASOOS) and provides guidance for integrating with external systems.

## Overview

The authentication system in ASOOS provides:

1. User registration and authentication
2. Role-based access control
3. Token-based authentication flow
4. Integration with the Sally Port security layer (in production)

## Authentication Flow

1. **Registration**: New users are registered in the system
2. **Login**: Users authenticate with email/password and receive a token
3. **Token Usage**: The token is included in subsequent API requests
4. **Verification**: The token is verified on protected routes
5. **Logout**: The token is invalidated (client-side)

## Integration with External Systems

### Sally Port Integration

In production, the authentication system will integrate with the Sally Port security layer. This requires:

1. Configure environment variables for Sally Port integration
2. Replace the mock authentication logic with Sally Port API calls
3. Update token verification to use Sally Port

Example configuration:

```
SALLY_PORT_API_URL=https://api.sallyport.security
SALLY_PORT_CLIENT_ID=your-client-id
SALLY_PORT_CLIENT_SECRET=your-client-secret
```

### JWT Configuration

For production, the system should be updated to use proper JWT tokens with:

1. Signing and verification with a secure key
2. Expiration and refresh token functionality
3. Claims with user role and permissions

Example JWT configuration:

```javascript
// JWT configuration
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';
const JWT_EXPIRES_IN = '1h';

// Generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      role: user.role,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Verify JWT token
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};
```

## Authentication Middleware

The authentication middleware in `src/middleware/auth.js` can be used to protect routes:

```javascript
// Require authentication
app.get('/api/protected', 
  authMiddleware({ requireAuth: true }),
  (req, res) => {
    res.json({ message: 'Protected data', user: req.user });
  }
);

// Require specific role
app.get('/api/admin', 
  authMiddleware({ requireAuth: true, roles: ['admin'] }),
  (req, res) => {
    res.json({ message: 'Admin data', user: req.user });
  }
);
```

## User Database Schema

The User model provides a simple interface for working with user data. The schema includes:

- `id`: Unique identifier
- `email`: User email (unique)
- `passwordHash`: Hashed password
- `role`: User role (admin, user, etc.)
- `name`: Display name
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp

## Testing Authentication

For development and testing, the system includes two default users:

1. **Admin User**:
   - Email: admin@example.com
   - Password: admin
   - Role: admin

2. **Regular User**:
   - Email: user@example.com
   - Password: user123
   - Role: user

Example API requests:

```bash
# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin"}'

# Access protected endpoint
curl -X GET http://localhost:8080/api/protected \
  -H "Authorization: Bearer admin:user-123"
```

## Next Steps for Production

1. Implement proper JWT tokens
2. Integrate with Sally Port
3. Add refresh token functionality
4. Implement rate limiting for authentication endpoints
5. Add two-factor authentication
6. Set up secure password reset flow
7. Implement account lockout after failed attempts
8. Add comprehensive logging and monitoring