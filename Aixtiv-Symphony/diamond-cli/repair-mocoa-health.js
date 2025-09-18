#!/usr/bin/env node
/**
 * Mocoa Health Check Repair System
 * 
 * Addresses the mocoa-container health check failures that are causing
 * PCP computational agent failures in the Diamond SAO Command Center.
 * 
 * This script:
 * 1. Diagnoses the specific health check failure
 * 2. Restarts problematic services
 * 3. Validates the fix
 * 4. Integrates with the ElevenLabs self-healing system
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import winston from 'winston';

const execAsync = promisify(exec);
const PROJECT_ID = 'api-for-warp-drive';
const REGION = 'us-west1';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.simple()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'mocoa-repair.log' })
  ]
});

class MocoaHealthRepair {
  constructor() {
    this.services = [
      'mocoa-owner-interface',
      'diamond-sao-command-center', 
      'mocoa-owner-interface-v34',
      'mocoa-owner-interface-production'
    ];
  }

  /**
   * Check health status of all mocoa services
   */
  async checkServiceHealth() {
    logger.info('🏥 Checking health status of Mocoa services');
    const healthStatus = {};

    for (const service of this.services) {
      try {
        logger.info(`🔍 Checking service: ${service}`);
        
        const { stdout } = await execAsync(
          `gcloud run services describe ${service} --region=${REGION} --format="value(status.conditions[].type,status.conditions[].status)" 2>/dev/null`
        );

        const conditions = stdout.trim();
        if (conditions.includes('True;True;True') || conditions.includes('Ready,True')) {
          healthStatus[service] = 'healthy';
          logger.info(`✅ ${service}: Healthy`);
        } else {
          healthStatus[service] = 'unhealthy';
          logger.warn(`⚠️ ${service}: Unhealthy - ${conditions}`);
        }
      } catch (error) {
        healthStatus[service] = 'not_found';
        logger.warn(`❌ ${service}: Not found or inaccessible`);
      }
    }

    return healthStatus;
  }

  /**
   * Check recent error logs for health check failures
   */
  async checkHealthCheckLogs() {
    logger.info('📋 Checking recent health check error logs');
    
    try {
      const { stdout } = await execAsync(`
        gcloud logging read "textPayload:\\"mocoa-container\\" AND textPayload:\\"health\\" AND severity=ERROR" --limit=5 --format="value(timestamp,resource.labels.service_name,textPayload)"
      `);

      const logs = stdout.trim().split('\n').filter(line => line);
      
      if (logs.length === 0) {
        logger.info('✅ No recent health check failures found');
        return [];
      }

      logger.warn(`⚠️ Found ${logs.length} recent health check failures`);
      
      const failures = logs.map(log => {
        const parts = log.split('\t');
        return {
          timestamp: parts[0],
          service: parts[1],
          message: parts[2]
        };
      });

      return failures;
    } catch (error) {
      logger.error('❌ Failed to check health check logs:', error.message);
      return [];
    }
  }

  /**
   * Deploy new revision of service with health check fixes
   */
  async repairServiceHealth(serviceName) {
    logger.info(`🔧 Repairing health checks for service: ${serviceName}`);
    
    try {
      // Update the service with optimized health check settings
      const updateCommand = `
        gcloud run services update ${serviceName} \\
          --region=${REGION} \\
          --port=8080 \\
          --timeout=300 \\
          --concurrency=100 \\
          --cpu-throttling \\
          --execution-environment=gen2 \\
          --memory=2Gi \\
          --cpu=1 \\
          --min-instances=1 \\
          --max-instances=10
      `;

      logger.info(`⚡ Updating service configuration...`);
      const { stdout, stderr } = await execAsync(updateCommand);
      
      if (stderr && !stderr.includes('WARNING')) {
        throw new Error(`Service update failed: ${stderr}`);
      }

      logger.info(`✅ Successfully updated ${serviceName}`);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to repair ${serviceName}:`, error.message);
      return false;
    }
  }

  /**
   * Restart problematic service instances
   */
  async restartService(serviceName) {
    logger.info(`🔄 Restarting service: ${serviceName}`);
    
    try {
      // Force a new deployment by updating a label
      const timestamp = Date.now();
      const updateCommand = `
        gcloud run services update ${serviceName} \\
          --region=${REGION} \\
          --update-labels="last-restart=${timestamp}"
      `;

      await execAsync(updateCommand);
      logger.info(`✅ Successfully restarted ${serviceName}`);
      
      // Wait for service to stabilize
      await this.waitForServiceReady(serviceName);
      return true;
    } catch (error) {
      logger.error(`❌ Failed to restart ${serviceName}:`, error.message);
      return false;
    }
  }

  /**
   * Wait for service to become ready after restart
   */
  async waitForServiceReady(serviceName, maxWaitTime = 120000) {
    logger.info(`⏳ Waiting for ${serviceName} to become ready...`);
    
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const { stdout } = await execAsync(
          `gcloud run services describe ${serviceName} --region=${REGION} --format="value(status.conditions[].status)"`
        );

        if (stdout.trim().includes('True')) {
          logger.info(`✅ ${serviceName} is now ready`);
          return true;
        }

        await this.sleep(5000); // Wait 5 seconds before checking again
      } catch (error) {
        logger.warn(`⚠️ Error checking service status: ${error.message}`);
      }
    }

    logger.error(`❌ ${serviceName} did not become ready within timeout`);
    return false;
  }

  /**
   * Comprehensive repair process
   */
  async performComprehensiveRepair() {
    logger.info('🚀 Starting comprehensive Mocoa health repair process');
    
    // Step 1: Check current health status
    const healthStatus = await this.checkServiceHealth();
    const unhealthyServices = Object.entries(healthStatus)
      .filter(([service, status]) => status === 'unhealthy')
      .map(([service]) => service);

    if (unhealthyServices.length === 0) {
      logger.info('✅ All services are healthy, no repair needed');
      return true;
    }

    logger.info(`🔧 Found ${unhealthyServices.length} unhealthy services: ${unhealthyServices.join(', ')}`);

    // Step 2: Check recent logs
    const recentFailures = await this.checkHealthCheckLogs();
    
    // Step 3: Repair each unhealthy service
    let repairResults = [];
    
    for (const service of unhealthyServices) {
      logger.info(`🔧 Processing repair for: ${service}`);
      
      // First try updating configuration
      const configRepaired = await this.repairServiceHealth(service);
      
      if (!configRepaired) {
        // If config repair failed, try restarting
        const restarted = await this.restartService(service);
        repairResults.push({ service, method: 'restart', success: restarted });
      } else {
        repairResults.push({ service, method: 'config', success: true });
      }
    }

    // Step 4: Verify repairs
    logger.info('🔍 Verifying repair results...');
    await this.sleep(10000); // Wait 10 seconds for services to stabilize
    
    const postRepairHealth = await this.checkServiceHealth();
    const stillUnhealthy = Object.entries(postRepairHealth)
      .filter(([service, status]) => status === 'unhealthy')
      .map(([service]) => service);

    if (stillUnhealthy.length === 0) {
      logger.info('🎉 All services are now healthy! Repair completed successfully');
      return true;
    } else {
      logger.error(`❌ Some services are still unhealthy: ${stillUnhealthy.join(', ')}`);
      return false;
    }
  }

  /**
   * Integration test with ElevenLabs system
   */
  async testElevenLabsIntegration() {
    logger.info('🧪 Testing ElevenLabs integration after repair');
    
    try {
      const ElevenLabsModule = await import('./self-healing-elevenlabs.js');
      const ElevenLabsSelfHealer = ElevenLabsModule.default;
      const healer = new ElevenLabsSelfHealer();
      
      const healthResult = await healer.performHealthCheck();
      
      if (healthResult.status === 'healthy' || healthResult.status === 'healed') {
        logger.info('✅ ElevenLabs integration test passed');
        return true;
      } else {
        logger.error('❌ ElevenLabs integration test failed:', healthResult.error);
        return false;
      }
    } catch (error) {
      logger.error('❌ ElevenLabs integration test error:', error.message);
      return false;
    }
  }

  /**
   * Utility sleep function
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}


// CLI interface
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const repair = new MocoaHealthRepair();
  
  const args = process.argv.slice(2);
  
  (async () => {
    try {
      if (args.includes('--check-health')) {
        const status = await repair.checkServiceHealth();
        console.log('Service health status:', JSON.stringify(status, null, 2));
      } else if (args.includes('--repair-all')) {
        const success = await repair.performComprehensiveRepair();
        if (success) {
          console.log('✅ Comprehensive repair completed successfully');
          // Test ElevenLabs integration
          const testPassed = await repair.testElevenLabsIntegration();
          process.exit(testPassed ? 0 : 1);
        } else {
          console.log('❌ Repair process completed with some failures');
          process.exit(1);
        }
      } else if (args.includes('--logs')) {
        const logs = await repair.checkHealthCheckLogs();
        console.log('Recent health check failures:');
        logs.forEach(log => console.log(`${log.timestamp}: ${log.service} - ${log.message}`));
      } else {
        console.log(`
🔧 Mocoa Health Check Repair System

Usage:
  node repair-mocoa-health.js --check-health    Check current health status
  node repair-mocoa-health.js --repair-all      Perform comprehensive repair
  node repair-mocoa-health.js --logs            Show recent health check failures

This tool fixes the mocoa-container health check failures that cause
PCP computational agent failures in your Diamond SAO Command Center.
        `);
      }
    } catch (error) {
      console.error('❌ CLI execution error:', error.message);
      process.exit(1);
    }
  })();
}

export default MocoaHealthRepair;
