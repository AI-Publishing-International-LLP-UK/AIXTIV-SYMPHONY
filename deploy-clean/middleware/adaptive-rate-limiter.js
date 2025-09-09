// /Users/as/asoos/integration-gateway/middleware/adaptive-rate-limiter.js
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

const getLimit = (req) => {
  const userType = req.headers['x-user-type']; // e.g., 'anonymous', 'authenticated'
  const agentType = req.headers['x-agent-type']; // e.g., 'rix', 'crx', 'qrix'

  if (agentType) {
    switch (agentType) {
    case 'rix':
      return 5000;
    case 'crx':
      return 10000;
    case 'qrix':
      return 20000;
    default:
      return 500;
    }
  } else {
    switch (userType) {
    case 'authenticated':
      return 2000;
    case 'anonymous':
    default:
      return 200;
    }
  }
};

const adaptiveRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: (req) => getLimit(req),
  message: (req) => {
    return 'Too many requests, please try again later.';
  },
  headers: true,
  keyGenerator: (req) => {
    // Use a combination of IP and user/agent identifier for more granular limiting
    const userIdentifier = req.headers['x-user-id'] || req.headers['x-agent-id'];
    if (userIdentifier) {
      return userIdentifier;
    }
    // Fallback to IPv6-compatible IP key generator
    return ipKeyGenerator(req);
  }
});

module.exports = { adaptiveRateLimiter };
