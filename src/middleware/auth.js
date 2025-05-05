/**
 * Authentication Middleware
 * 
 * This middleware provides a simple authentication layer that can be
 * enhanced with the proper Sally Port integration in production.
 */

const authMiddleware = (options = {}) => {
  const {
    requireAuth = true,
    roles = []
  } = options;

  return (req, res, next) => {
    // For development, we'll use a simple token-based authentication
    const authHeader = req.headers.authorization;
    
    if (!authHeader && requireAuth) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Authorization header missing'
      });
    }
    
    if (authHeader) {
      // Format: "Bearer <token>"
      const parts = authHeader.split(' ');
      if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({
          error: 'Invalid authorization format',
          message: 'Authorization header must be in format: Bearer <token>'
        });
      }
      
      const token = parts[1];
      
      // In development, we'll use a very simple validation
      // In production, this would verify with Sally Port
      if (token === 'INVALID_TOKEN') {
        return res.status(401).json({
          error: 'Invalid token',
          message: 'The provided authentication token is invalid'
        });
      }
      
      // For demonstration, use a simple role check
      if (roles.length > 0) {
        // In development, we'll extract role from token format: role:userId
        const tokenParts = token.split(':');
        if (tokenParts.length === 2) {
          const userRole = tokenParts[0];
          if (!roles.includes(userRole)) {
            return res.status(403).json({
              error: 'Insufficient permissions',
              message: `Required role: ${roles.join(' or ')}`
            });
          }
          
          // Add user information to the request
          req.user = {
            id: tokenParts[1],
            role: userRole
          };
        }
      } else {
        // No role required, just set a default user
        req.user = {
          id: 'anonymous',
          role: 'guest'
        };
      }
    }
    
    next();
  };
};

module.exports = authMiddleware;