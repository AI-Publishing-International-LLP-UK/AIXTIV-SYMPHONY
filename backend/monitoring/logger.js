const winston = require('winston');
const { format, createLogger, transports } = winston;
const { combine, timestamp, printf, colorize, json } = format;

/**
 * Define different log formats for different environments
 */
const developmentFormat = combine(
  colorize(),
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  printf(({ level, message, timestamp, ...metadata }) => {
    let metaStr = '';
    if (Object.keys(metadata).length > 0) {
      metaStr = JSON.stringify(metadata, null, 2);
    }
    return `[${timestamp}] ${level}: ${message} ${metaStr}`;
  })
);

const productionFormat = combine(timestamp(), json());

/**
 * Configure the logger based on the environment
 */
const getLoggerConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  const logLevel =
    process.env.LOG_LEVEL || (env === 'production' ? 'info' : 'debug');

  const options = {
    level: logLevel,
    format: env === 'production' ? productionFormat : developmentFormat,
    defaultMeta: { service: process.env.SERVICE_NAME || 'api-service' },
    transports: [new transports.Console()],
  };

  // Add file transport in production
  if (env === 'production') {
    options.transports.push(
      new transports.File({
        filename: 'error.log',
        level: 'error',
        dirname: process.env.LOG_DIR || 'logs',
      }),
      new transports.File({
        filename: 'combined.log',
        dirname: process.env.LOG_DIR || 'logs',
      })
    );
  }

  return options;
};

/**
 * Create and configure the logger
 */
const logger = createLogger(getLoggerConfig());

/**
 * Add request context for HTTP request logging
 */
logger.addRequestContext = req => {
  return {
    requestId: req.id || req.headers['x-request-id'],
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.headers['user-agent'],
  };
};

/**
 * Log HTTP requests (to be used with morgan)
 */
logger.stream = {
  write: message => {
    logger.info(message.trim());
  },
};

// Export the configured logger
module.exports = logger;

/**
 * logger.js - Simple logging utility
 */

const logger = {
  info: message => {
    console.log(`[INFO] ${message}`);
  },
  error: message => {
    console.error(`[ERROR] ${message}`);
  },
  warn: message => {
    console.warn(`[WARN] ${message}`);
  },
  debug: message => {
    if (process.env.DEBUG) {
      console.debug(`[DEBUG] ${message}`);
    }
  },
};

module.exports = logger;
