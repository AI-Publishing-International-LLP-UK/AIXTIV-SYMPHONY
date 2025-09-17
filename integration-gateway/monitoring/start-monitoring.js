#!/usr/bin/env node

/**
 * Diamond SAO Command Center - Comprehensive Monitoring System Startup
 * Launches Master Orchestrator with all subsystems
 * Professional Co-Pilot (PCP) Autonomous Operations
 */

const MasterOrchestrator = require('./master-orchestrator');
const winston = require('winston');

// Startup logger
const startupLogger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.simple()
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: '/var/log/monitoring-startup.log' })
    ]
});

async function startMonitoringSystem() {
    startupLogger.info('🚀 Diamond SAO Command Center - Starting Comprehensive Monitoring System');
    startupLogger.info('═══════════════════════════════════════════════════════════════════════');
    startupLogger.info('Professional Co-Pilot (PCP) Autonomous Operations Hub');
    startupLogger.info('Version 34.0 - Diamond SAO Standards');
    startupLogger.info('OAuth2 Compliant | Multi-Region | Self-Healing | Predictive Analytics');
    startupLogger.info('═══════════════════════════════════════════════════════════════════════');

    try {
        // Validate environment
        await validateEnvironment();
        
        // Create monitoring directories
        await setupMonitoringEnvironment();
        
        // Initialize Master Orchestrator
        const orchestrator = new MasterOrchestrator();
        await orchestrator.initialize();
        
        startupLogger.info('✅ Diamond SAO Monitoring System Fully Operational');
        startupLogger.info('📊 Dashboard URL: https://mocoa-owner-interface/dashboard');
        startupLogger.info('🔒 Security Level: Diamond SAO');
        startupLogger.info('🤖 Autonomous Operations: ACTIVE');
        
        // Setup graceful shutdown
        setupGracefulShutdown(orchestrator);
        
        return orchestrator;
        
    } catch (error) {
        startupLogger.error('❌ Failed to start monitoring system:', error.message);
        process.exit(1);
    }
}

async function validateEnvironment() {
    startupLogger.info('🔍 Validating environment...');
    
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 18) {
        throw new Error(`Node.js version ${majorVersion} is not supported. Please upgrade to Node.js 18 or higher.`);
    }
    
    startupLogger.info(`✅ Node.js version: ${nodeVersion}`);
    
    // Check required environment variables
    const requiredEnvVars = [
        'GOOGLE_CLOUD_PROJECT',
        'CLOUD_ML_REGION'
    ];
    
    for (const envVar of requiredEnvVars) {
        if (!process.env[envVar]) {
            startupLogger.warn(`⚠️ Environment variable ${envVar} is not set`);
        } else {
            startupLogger.info(`✅ ${envVar}: ${process.env[envVar]}`);
        }
    }
    
    // Check kubectl availability
    try {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        const { stdout } = await execAsync('/opt/homebrew/bin/kubectl version --client --short');
        startupLogger.info(`✅ kubectl: ${stdout.trim()}`);
    } catch (error) {
        startupLogger.warn(`⚠️ kubectl not available: ${error.message}`);
    }
    
    // Check gcloud availability
    try {
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        const { stdout } = await execAsync('gcloud --version | head -1');
        startupLogger.info(`✅ gcloud: ${stdout.trim()}`);
    } catch (error) {
        startupLogger.warn(`⚠️ gcloud not available: ${error.message}`);
    }
}

async function setupMonitoringEnvironment() {
    startupLogger.info('📁 Setting up monitoring environment...');
    
    const fs = require('fs').promises;
    const path = require('path');
    
    // Create all necessary directories
    const directories = [
        '/var/log/cig-monitoring',
        '/var/log/cig-monitoring/metrics',
        '/var/log/cig-monitoring/alerts',
        '/var/log/cig-monitoring/predictions',
        '/var/log/security',
        '/var/log/security/oauth2',
        '/var/log/security/threats',
        '/var/log/security/audit',
        '/var/log/security/compliance',
        '/var/log/monitoring'
    ];
    
    for (const dir of directories) {
        try {
            await fs.mkdir(dir, { recursive: true, mode: 0o755 });
            startupLogger.debug(`Created directory: ${dir}`);
        } catch (error) {
            if (error.code !== 'EEXIST') {
                startupLogger.warn(`Failed to create directory ${dir}: ${error.message}`);
            }
        }
    }
    
    startupLogger.info('✅ Monitoring environment setup complete');
}

function setupGracefulShutdown(orchestrator) {
    startupLogger.info('🛡️ Setting up graceful shutdown handlers...');
    
    const shutdownHandler = async (signal) => {
        startupLogger.info(`Received ${signal} signal, initiating graceful shutdown...`);
        
        try {
            await orchestrator.shutdown();
            startupLogger.info('✅ Graceful shutdown complete');
            process.exit(0);
        } catch (error) {
            startupLogger.error('❌ Error during shutdown:', error.message);
            process.exit(1);
        }
    };
    
    // Handle different shutdown signals
    process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
    process.on('SIGINT', () => shutdownHandler('SIGINT'));
    process.on('SIGUSR2', () => shutdownHandler('SIGUSR2')); // For nodemon
    
    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
        startupLogger.error('❌ Uncaught Exception:', error.message);
        startupLogger.error(error.stack);
        process.exit(1);
    });
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
        startupLogger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
        process.exit(1);
    });
    
    startupLogger.info('✅ Graceful shutdown handlers configured');
}

// Main execution
if (require.main === module) {
    startMonitoringSystem().catch((error) => {
        startupLogger.error('❌ Critical startup error:', error.message);
        process.exit(1);
    });
}

module.exports = { startMonitoringSystem };