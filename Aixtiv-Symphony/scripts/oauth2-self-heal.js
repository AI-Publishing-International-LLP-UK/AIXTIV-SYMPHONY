#!/usr/bin/env node

/**
 * AIXTIV SYMPHONY - OAuth2 Self-Healing System
 * Professional Co-Pilot (PCP) - Diamond SAO Integration
 * 
 * This script implements the self-healing OAuth2 key management system
 * that prevents API key popups by automatically fetching replacement keys
 * from Google Secret Manager when keys are missing or invalid.
 */

import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import winston from 'winston';
import { execSync } from 'child_process';

class OAuth2SelfHealingSystem {
    constructor() {
        this.secretClient = new SecretManagerServiceClient();
        this.projectId = 'api-for-warp-drive';
        
        // Configure Winston logger
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.printf(({ timestamp, level, message }) => {
                    return `🔐 [${timestamp}] OAUTH2-HEAL: ${level.toUpperCase()} - ${message}`;
                })
            ),
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({ filename: '/var/log/oauth2-healing.log' })
            ]
        });
    }

    /**
     * Get current OAuth2 key from Secret Manager
     */
    async getSecretValue(secretName) {
        try {
            const name = `projects/${this.projectId}/secrets/${secretName}/versions/latest`;
            const [version] = await this.secretClient.accessSecretVersion({ name });
            return version.payload.data.toString();
        } catch (error) {
            this.logger.error(`Failed to retrieve secret ${secretName}: ${error.message}`);
            throw error;
        }
    }

    /**
     * Validate OAuth2 key by testing authentication
     */
    async validateOAuth2Key(key, endpoint) {
        try {
            const response = await fetch(endpoint, {
                headers: {
                    'Authorization': `Bearer ${key}`,
                    'Content-Type': 'application/json'
                }
            });
            
            return response.ok;
        } catch (error) {
            this.logger.warn(`OAuth2 key validation failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Refresh OAuth2 keys for SallyPort services
     */
    async refreshSallyPortKeys() {
        this.logger.info('🔄 Starting SallyPort OAuth2 key refresh...');
        
        const keyMappings = {
            'oauth-cloudflare-client': 'CLOUDFLARE_OAUTH_CLIENT_ID',
            'oauth-client-secret': 'OAUTH_CLIENT_SECRET',
            'oauth-integration-gateway-cloudflare': 'INTEGRATION_GATEWAY_OAUTH'
        };

        const refreshedKeys = {};

        for (const [secretName, envVar] of Object.entries(keyMappings)) {
            try {
                const keyValue = await this.getSecretValue(secretName);
                
                // Validate the key
                const isValid = await this.validateOAuth2Key(keyValue, 'https://sallyport.2100.cool/api/validate');
                
                if (isValid) {
                    refreshedKeys[envVar] = keyValue;
                    this.logger.info(`✅ Successfully refreshed ${secretName}`);
                } else {
                    this.logger.warn(`⚠️  Key ${secretName} appears invalid, will attempt backup`);
                    // Attempt to get previous version
                    const backupKey = await this.getBackupKey(secretName);
                    if (backupKey) {
                        refreshedKeys[envVar] = backupKey;
                        this.logger.info(`✅ Using backup key for ${secretName}`);
                    }
                }
            } catch (error) {
                this.logger.error(`❌ Failed to refresh ${secretName}: ${error.message}`);
            }
        }

        return refreshedKeys;
    }

    /**
     * Get backup OAuth2 key (previous version)
     */
    async getBackupKey(secretName) {
        try {
            const name = `projects/${this.projectId}/secrets/${secretName}/versions/1`;
            const [version] = await this.secretClient.accessSecretVersion({ name });
            return version.payload.data.toString();
        } catch (error) {
            this.logger.error(`No backup key available for ${secretName}`);
            return null;
        }
    }

    /**
     * Deploy refreshed keys to Cloud Run services
     */
    async deployRefreshedKeys(keys) {
        this.logger.info('🚀 Deploying refreshed OAuth2 keys to services...');
        
        const services = [
            'sallyport-cloudflare-auth',
            'oauth2-gateway-cloudflare',
            'integration-gateway-js'
        ];

        // execSync already imported at top

        for (const service of services) {
            try {
                // Update environment variables for the service
                const envVars = Object.entries(keys)
                    .map(([key, value]) => `${key}=${value}`)
                    .join(',');

                const deployCommand = `gcloud run services update ${service} ` +
                    `--update-env-vars="${envVars}" ` +
                    `--region=us-west1 ` +
                    `--project=${this.projectId}`;

                execSync(deployCommand, { stdio: 'inherit' });
                this.logger.info(`✅ Updated ${service} with refreshed OAuth2 keys`);
            } catch (error) {
                this.logger.error(`❌ Failed to update ${service}: ${error.message}`);
            }
        }
    }

    /**
     * Main healing process
     */
    async performSelfHealing() {
        this.logger.info('🏥 OAUTH2 SELF-HEALING INITIATED - PCP System Active');
        
        try {
            // Step 1: Refresh keys from Secret Manager
            const refreshedKeys = await this.refreshSallyPortKeys();
            
            if (Object.keys(refreshedKeys).length === 0) {
                throw new Error('No valid OAuth2 keys could be refreshed');
            }

            // Step 2: Deploy refreshed keys
            await this.deployRefreshedKeys(refreshedKeys);

            // Step 3: Wait for deployment to complete
            await this.waitForDeployment();

            // Step 4: Validate healing
            const isHealed = await this.validateHealing();
            
            if (isHealed) {
                this.logger.info('🎉 ✅ OAuth2 Self-Healing COMPLETED Successfully!');
                return true;
            } else {
                this.logger.error('❌ OAuth2 Self-Healing verification failed');
                return false;
            }
            
        } catch (error) {
            this.logger.error(`🚨 OAuth2 Self-Healing FAILED: ${error.message}`);
            throw error;
        }
    }

    /**
     * Wait for Cloud Run deployment to complete
     */
    async waitForDeployment() {
        this.logger.info('⏳ Waiting for deployment to complete...');
        await new Promise(resolve => setTimeout(resolve, 30000)); // 30 second wait
    }

    /**
     * Validate that the healing process worked
     */
    async validateHealing() {
        this.logger.info('🔍 Validating OAuth2 healing...');
        
        try {
            const response = await fetch('https://sallyport.2100.cool/api/health');
            return response.ok;
        } catch (error) {
            this.logger.error(`Healing validation failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Set up automated monitoring
     */
    setupAutomatedMonitoring() {
        this.logger.info('📊 Setting up automated OAuth2 monitoring...');
        
        // Run healing check every 30 minutes
        setInterval(async () => {
            try {
                const needsHealing = await this.checkIfHealingNeeded();
                if (needsHealing) {
                    this.logger.info('🚨 OAuth2 issues detected, initiating self-healing...');
                    await this.performSelfHealing();
                }
            } catch (error) {
                this.logger.error(`Automated monitoring error: ${error.message}`);
            }
        }, 30 * 60 * 1000); // 30 minutes
    }

    /**
     * Check if healing is needed
     */
    async checkIfHealingNeeded() {
        try {
            const response = await fetch('https://sallyport.2100.cool/api/validate');
            return !response.ok;
        } catch (error) {
            return true; // If we can't connect, assume healing is needed
        }
    }
}

// CLI Interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const healingSystem = new OAuth2SelfHealingSystem();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'heal':
            healingSystem.performSelfHealing()
                .then(() => process.exit(0))
                .catch(() => process.exit(1));
            break;
        case 'monitor':
            healingSystem.setupAutomatedMonitoring();
            console.log('🔄 OAuth2 monitoring started...');
            break;
        case 'validate':
            healingSystem.validateHealing()
                .then(isValid => {
                    console.log(isValid ? '✅ OAuth2 system is healthy' : '❌ OAuth2 system needs healing');
                    process.exit(isValid ? 0 : 1);
                });
            break;
        default:
            console.log(`
🔐 AIXTIV SYMPHONY - OAuth2 Self-Healing System

Usage: node oauth2-self-heal.js <command>

Commands:
  heal     - Perform immediate OAuth2 self-healing
  monitor  - Start continuous monitoring
  validate - Check current OAuth2 health status

Examples:
  node oauth2-self-heal.js heal
  node oauth2-self-heal.js monitor
  node oauth2-self-heal.js validate
            `);
    }
}

export default OAuth2SelfHealingSystem;
