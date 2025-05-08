# ASOOS SallyPort Enhancement Guide

This guide provides step-by-step instructions for enhancing the SallyPort authentication with additional security features.

## 1. Role-Based Access Control (RBAC)

### Implementation Steps:

1. Install required packages:
```bash
npm install jsonwebtoken
```

2. Create a roles configuration file:
```javascript
// roles.js
module.exports = {
  roles: {
    admin: ['read:all', 'write:all', 'delete:all'],
    manager: ['read:all', 'write:own'],
    user: ['read:own', 'write:own'],
    guest: ['read:public']
  }
};
```

3. Implement permission checking in your authentication middleware:
```javascript
// Check if user has required permissions
function hasPermission(user, requiredPermission) {
  if (!user || !user.roles) return false;
  
  // Get user's role permissions
  const userPermissions = [];
  user.roles.forEach(role => {
    if (roles[role]) {
      userPermissions.push(...roles[role]);
    }
  });
  
  // Check if user has the required permission
  return userPermissions.includes(requiredPermission);
}
```

## 2. Rate Limiting

### Implementation Steps:

1. Create a simple in-memory rate limiter:
```javascript
// rate-limiter.js
const ipRequests = new Map();

function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const now = Date.now();
  
  // Get request history for this IP
  const requests = ipRequests.get(ip) || [];
  
  // Filter requests in the last minute
  const recentRequests = requests.filter(time => time > now - 60000);
  
  // Add current request
  recentRequests.push(now);
  ipRequests.set(ip, recentRequests);
  
  // Check if too many requests
  if (recentRequests.length > 100) {
    res.status(429).send('Too many requests, please try again later');
    return;
  }
  
  next();
}
```

2. Add to your server:
```javascript
// Use rate limiter middleware
app.use(rateLimiter);
```

## 3. Enhanced Token Validation

### Implementation Steps:

1. Create an enhanced token validator:
```javascript
// token-validator.js
const jwt = require('jsonwebtoken');

// Store revoked tokens (would use Redis in production)
const revokedTokens = new Set();

function validateToken(token) {
  try {
    // Check if token is revoked
    if (revokedTokens.has(token)) {
      return { valid: false, error: 'Token revoked' };
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Additional validations
    if (decoded.exp < Date.now() / 1000) {
      return { valid: false, error: 'Token expired' };
    }
    
    return {
      valid: true,
      userId: decoded.sub,
      roles: decoded.roles || []
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}
```

2. Add token revocation:
```javascript
// Add token to revoked list
function revokeToken(token) {
  revokedTokens.add(token);
}
```

## Testing

### Test RBAC
```bash
# Get an admin token
TOKEN=$(curl -s https://your-service.com/token?role=admin | jq -r .token)

# Access protected admin endpoint
curl -H "Authorization: Bearer $TOKEN" https://your-service.com/admin
```

### Test Rate Limiting
```bash
# Send many requests to trigger rate limiting
for i in {1..120}; do
  curl -s https://your-service.com/health
done
```

## Deployment

After implementing these enhancements:

1. Test locally:
```bash
npm start
```

2. Deploy:
```bash
./deploy.sh
```
