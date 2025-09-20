/**
 * Security Middleware Configuration
 *
 * Include this in your Express.js application for enhanced security
 */

const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const cors = require("cors");

// Helmet configuration for security headers
const helmetConfig = {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: [
        "'self'",
        "https://api.elevenlabs.io",
        "https://*.googleapis.com",
      ],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
};

// Rate limiting configuration
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: "Too many requests from this IP",
    retryAfter: "15 minutes",
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for trusted IPs (if needed)
  skip: (req) => {
    // Add your trusted IPs here
    const trustedIPs = ["127.0.0.1", "::1"];
    return trustedIPs.includes(req.ip);
  },
};

// CORS configuration
const corsConfig = {
  origin: process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",")
    : ["http://localhost:3000", "https://yourdomain.com"],
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

// Apply security middleware to Express app
function applySecurityMiddleware(app) {
  // Security headers
  app.use(helmet(helmetConfig));

  // CORS
  app.use(cors(corsConfig));

  // Rate limiting
  app.use("/api/", rateLimit(rateLimitConfig));

  // Additional security measures
  app.disable("x-powered-by");

  // Request logging for security monitoring
  app.use((req, res, next) => {
    // Log suspicious patterns
    const suspiciousPatterns = [
      /\.\.\//, // Path traversal
      /<script/i, // XSS attempts
      /union.*select/i, // SQL injection
      /javascript:/i, // JavaScript injection
    ];

    const requestData = `${req.method} ${req.url} ${req.get("User-Agent")}`;

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(requestData)) {
        console.warn(
          `Suspicious request detected: ${requestData} from IP: ${req.ip}`,
        );
        break;
      }
    }

    next();
  });
}

module.exports = {
  applySecurityMiddleware,
  helmetConfig,
  rateLimitConfig,
  corsConfig,
};
