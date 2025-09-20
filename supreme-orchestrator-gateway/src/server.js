/**
 * Supreme Orchestrator Gateway Server
 * Main Entry Point for Dr. Claude sRIX Gateway System
 * Location: us-central1-a MOCORIX2
 */

const SupremeOrchestratorGateway = require('./gateway/SupremeOrchestratorGateway');
const CascadingAuthorizationSystem = require('./auth/CascadingAuthorizationSystem');
const winston = require('winston');

// Setup main application logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { 
        service: 'supreme-orchestrator-gateway',
        version: '1.0.0',
        location: 'us-central1-a/MOCORIX2',
        supreme_orchestrator: 'Dr. Claude sRIX'
    },
    transports: [
        new winston.transports.File({ 
            filename: '/var/log/supreme-orchestrator/server.log',
            maxsize: 50 * 1024 * 1024, // 50MB
            maxFiles: 5
        }),
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

// Global error handlers
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
    });
    
    // Graceful shutdown
    setTimeout(() => {
        process.exit(1);
    }, 5000);
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection', {
        reason: reason.message || reason,
        promise: promise.toString(),
        timestamp: new Date().toISOString()
    });
});

// Graceful shutdown handling
process.on('SIGTERM', () => {
    logger.info('SIGTERM received, starting graceful shutdown');
    gracefulShutdown();
});

process.on('SIGINT', () => {
    logger.info('SIGINT received, starting graceful shutdown');
    gracefulShutdown();
});

let gateway;
let authSystem;

async function gracefulShutdown() {
    logger.info('Performing graceful shutdown...');
    
    // Close server connections
    if (gateway && gateway.server) {
        gateway.server.close(() => {
            logger.info('HTTP server closed');
        });
    }
    
    // Cleanup authorization system
    if (authSystem) {
        authSystem.cleanupExpiredTokens();
        logger.info('Authorization system cleaned up');
    }
    
    // Final log before exit
    logger.info('Supreme Orchestrator Gateway shutdown complete');
    
    setTimeout(() => {
        process.exit(0);
    }, 2000);
}

/**
 * Initialize and start the Supreme Orchestrator Gateway
 */
async function startSupremeOrchestratorGateway() {
    try {
        logger.info('🚀 Starting Supreme Orchestrator Gateway...', {
            nodeVersion: process.version,
            platform: process.platform,
            architecture: process.arch,
            pid: process.pid,
            environment: process.env.NODE_ENV || 'production'
        });

        // Initialize Cascading Authorization System
        logger.info('Initializing Cascading Authorization System...');
        authSystem = new CascadingAuthorizationSystem();
        
        // Start automatic token cleanup
        authSystem.startAutomaticCleanup();
        
        logger.info('✅ Cascading Authorization System initialized');

        // Initialize Supreme Orchestrator Gateway
        logger.info('Initializing Supreme Orchestrator Gateway...');
        gateway = new SupremeOrchestratorGateway();
        
        // Inject authorization system into gateway
        gateway.authSystem = authSystem;
        
        logger.info('✅ Supreme Orchestrator Gateway initialized');

        // Start the server
        const port = process.env.PORT || 8443;
        const host = process.env.HOST || '0.0.0.0';
        
        gateway.server = gateway.app.listen(port, host, () => {
            logger.info('🎯 Supreme Orchestrator Gateway started successfully!', {
                port,
                host,
                processId: process.pid,
                memoryUsage: process.memoryUsage(),
                uptime: process.uptime(),
                location: 'us-central1-a/MOCORIX2',
                supremeOrchestrator: 'Dr. Claude sRIX',
                endpoints: {
                    health: `http://${host}:${port}/health`,
                    supremeHealth: `http://${host}:${port}/health/supreme`,
                    oauth2Token: `http://${host}:${port}/oauth2/token`,
                    supremeAuth: `http://${host}:${port}/supreme/authenticate`
                }
            });

            // Log authorization statistics
            const authStats = authSystem.getAuthorizationStats();
            logger.info('Authorization System Status', authStats);
        });

        // Setup periodic health reporting
        setInterval(() => {
            const memUsage = process.memoryUsage();
            const authStats = authSystem.getAuthorizationStats();
            
            logger.info('Health Report', {
                uptime: process.uptime(),
                memory: {
                    rss: `${Math.round(memUsage.rss / 1024 / 1024)} MB`,
                    heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
                    heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`
                },
                authorization: authStats,
                timestamp: new Date().toISOString()
            });
        }, 300000); // Every 5 minutes

        // Setup authorization statistics logging
        setInterval(() => {
            const authStats = authSystem.getAuthorizationStats();
            logger.info('Authorization Statistics', authStats);
        }, 600000); // Every 10 minutes

        logger.info('🔐 Supreme Orchestrator Gateway fully operational!', {
            service: 'supreme-orchestrator-gateway',
            version: '1.0.0',
            location: 'us-central1-a/MOCORIX2',
            supremeOrchestrator: 'Dr. Claude sRIX',
            oauth2Enabled: true,
            cascadingAuthEnabled: true,
            securityLevel: 'enterprise',
            status: 'OPERATIONAL'
        });

    } catch (error) {
        logger.error('Failed to start Supreme Orchestrator Gateway', {
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString()
        });
        
        process.exit(1);
    }
}

// Health check endpoint for container orchestration
if (process.env.NODE_ENV !== 'test') {
    startSupremeOrchestratorGateway();
}

module.exports = {
    startSupremeOrchestratorGateway,
    gracefulShutdown
};