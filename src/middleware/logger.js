/**
 * Logger Middleware
 *
 * This middleware provides request logging with contextual information
 * to help with debugging and monitoring.
 */

// Get a unique request ID
const getRequestId = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

// Format log message with timestamp and request details
const formatLogMessage = (req, message, level = 'info') => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const path = req.path;
  const requestId = req.requestId;
  const userId = req.user ? req.user.id : 'anonymous';

  return {
    timestamp,
    level,
    message,
    request: {
      id: requestId,
      method,
      path,
    },
    user: userId,
  };
};

// Create the middleware
const loggerMiddleware = (options = {}) => {
  const { logLevel = 'info', logBody = false } = options;

  return (req, res, next) => {
    // Assign a unique ID to this request
    req.requestId = getRequestId();

    // Log the incoming request
    const startTime = Date.now();

    // Add logging methods to the request object
    req.log = {
      info: message =>
        console.log(JSON.stringify(formatLogMessage(req, message, 'info'))),
      warn: message =>
        console.warn(JSON.stringify(formatLogMessage(req, message, 'warn'))),
      error: (message, error) => {
        const logObj = formatLogMessage(req, message, 'error');
        if (error) {
          logObj.error = {
            message: error.message,
            stack: error.stack,
          };
        }
        console.error(JSON.stringify(logObj));
      },
    };

    // Log request start
    req.log.info(`Request started: ${req.method} ${req.path}`);

    // Log request body if enabled and present
    if (logBody && req.method !== 'GET' && req.body) {
      // Mask sensitive fields
      const maskedBody = { ...req.body };
      ['password', 'token', 'secret', 'apiKey'].forEach(field => {
        if (maskedBody[field]) {
          maskedBody[field] = '********';
        }
      });

      req.log.info(`Request body: ${JSON.stringify(maskedBody)}`);
    }

    // Capture the original end method
    const originalEnd = res.end;

    // Override the end method to log response
    res.end = function (chunk, encoding) {
      // Calculate request duration
      const duration = Date.now() - startTime;

      // Log the response
      const logObj = formatLogMessage(
        req,
        `Request completed: ${req.method} ${req.path}`,
        'info'
      );
      logObj.response = {
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      };

      // Log based on status code
      if (res.statusCode >= 500) {
        console.error(JSON.stringify(logObj));
      } else if (res.statusCode >= 400) {
        console.warn(JSON.stringify(logObj));
      } else {
        console.log(JSON.stringify(logObj));
      }

      // Call the original end method
      originalEnd.call(this, chunk, encoding);
    };

    next();
  };
};

module.exports = loggerMiddleware;
