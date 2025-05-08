/**
 * Authentication Middleware for Aixtiv Symphony
 * Production implementation for request authentication
 */

const logger = require('../services/common/logger');
const sallyport = require('../services/sallyport/sallyport-client');

/**
 * Authenticate incoming requests
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
async function authenticateRequest(req, res, next) {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header missing',
      });
    }

    // Parse token from header
    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authorization format',
      });
    }

    const token = parts[1];

    // Verify token with SallyPort
    const session = await sallyport.getUserSession(token);

    // Check if session is valid
    if (!session.valid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session',
      });
    }

    // Attach user to request
    req.user = {
      uuid: session.userUuid,
      email: session.email,
      role: session.role,
      permissions: session.permissions,
    };

    // Continue to next middleware or route handler
    next();
  } catch (error) {
    logger.error(`Authentication error: ${error.message}`);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }
}

/**
 * Authorize user for specific permissions
 * @param {Array<string>} requiredPermissions - Permissions required for the route
 */
function authorizePermissions(requiredPermissions) {
  return async (req, res, next) => {
    try {
      // Ensure request is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      // If no permissions required, continue
      if (!requiredPermissions || requiredPermissions.length === 0) {
        return next();
      }

      // Check if user has all required permissions
      const userPermissions = req.user.permissions || [];
      const hasAllPermissions = requiredPermissions.every(permission =>
        userPermissions.includes(permission)
      );

      if (!hasAllPermissions) {
        logger.warn(
          `User ${req.user.uuid} lacks required permissions: ${requiredPermissions.join(', ')}`
        );
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions',
        });
      }

      // User has all required permissions
      next();
    } catch (error) {
      logger.error(`Authorization error: ${error.message}`);
      return res.status(403).json({
        success: false,
        message: 'Authorization failed',
      });
    }
  };
}

module.exports = {
  authenticateRequest,
  authorizePermissions,
};
