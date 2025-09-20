#!/usr/bin/env node
/**
 * 🛡️ Victory36 MCP Orchestrator Monitoring & Self-Healing Script
 * Diamond CLI Production Monitoring for 20M Agents System
 */

const https = require('https');
const { exec } = require('child_process');

class Victory36Monitor {
  constructor() {
    this.workerUrl = 'https://wfa-orchestration-worker-production-production.pr-aef.workers.dev';
    this.checkInterval = 30000; // 30 seconds
    this.maxRetries = 3;
    this.isRunning = true;
    
    console.log('🛡️ Victory36 Monitor initialized');
    console.log(`📊 Monitoring: ${this.workerUrl}`);
    console.log(`⏰ Check interval: ${this.checkInterval}ms`);
  }

  async start() {
    console.log('🚀 Starting Victory36 MCP monitoring...');
    
    while (this.isRunning) {
      try {
        await this.performHealthCheck();
        await this.checkOrchestration();
        await this.verifyDNSResolution();
        
        console.log(`✅ ${new Date().toISOString()} - All systems operational`);
        
      } catch (error) {
        console.error(`🚨 ${new Date().toISOString()} - Error detected:`, error.message);
        await this.attemptSelfHealing(error);
      }
      
      // Wait before next check
      await this.sleep(this.checkInterval);
    }
  }

  async performHealthCheck() {
    return new Promise((resolve, reject) => {
      const request = https.get(`${this.workerUrl}/health`, (response) => {
        let data = '';
        
        response.on('data', chunk => {
          data += chunk;
        });
        
        response.on('end', () => {
          try {
            const health = JSON.parse(data);
            
            if (health.status !== 'healthy') {
              reject(new Error(`Health check failed: ${health.status}`));
              return;
            }
            
            if (health.agentCapacity !== 20000000) {
              reject(new Error(`Agent capacity mismatch: ${health.agentCapacity}`));
              return;
            }
            
            if (health.sectors !== 200) {
              reject(new Error(`Sector count mismatch: ${health.sectors}`));
              return;
            }
            
            resolve(health);
            
          } catch (parseError) {
            reject(new Error(`Health check parse error: ${parseError.message}`));
          }
        });
      });
      
      request.on('error', (error) => {
        reject(new Error(`Health check request failed: ${error.message}`));
      });
      
      request.setTimeout(5000, () => {
        request.destroy();
        reject(new Error('Health check timeout'));
      });
    });
  }

  async checkOrchestration() {
    return new Promise((resolve, reject) => {
      const request = https.get(`${this.workerUrl}/mcp/orchestrate`, (response) => {
        let data = '';
        
        response.on('data', chunk => {
          data += chunk;
        });
        
        response.on('end', () => {
          try {
            const orchestration = JSON.parse(data);
            
            if (orchestration.status !== 'operational') {
              reject(new Error(`Orchestration not operational: ${orchestration.status}`));
              return;
            }
            
            if (!orchestration.healingMode) {
              reject(new Error('Self-healing mode disabled'));
              return;
            }
            
            resolve(orchestration);
            
          } catch (parseError) {
            reject(new Error(`Orchestration check parse error: ${parseError.message}`));
          }
        });
      });
      
      request.on('error', (error) => {
        reject(new Error(`Orchestration check failed: ${error.message}`));
      });
      
      request.setTimeout(5000, () => {
        request.destroy();
        reject(new Error('Orchestration check timeout'));
      });
    });
  }

  async verifyDNSResolution() {
    const testDomain = 'mcp.aipub.2100.cool';
    
    return new Promise((resolve, reject) => {
      const request = https.get(`${this.workerUrl}/mcp/dns/resolve?domain=${testDomain}`, (response) => {
        let data = '';
        
        response.on('data', chunk => {
          data += chunk;
        });
        
        response.on('end', () => {
          try {
            const dns = JSON.parse(data);
            
            if (!dns.resolved) {
              reject(new Error(`DNS resolution failed for ${testDomain}`));
              return;
            }
            
            if (!dns.mcpEnabled) {
              reject(new Error(`MCP not enabled for ${testDomain}`));
              return;
            }
            
            resolve(dns);
            
          } catch (parseError) {
            reject(new Error(`DNS check parse error: ${parseError.message}`));
          }
        });
      });
      
      request.on('error', (error) => {
        reject(new Error(`DNS check failed: ${error.message}`));
      });
      
      request.setTimeout(5000, () => {
        request.destroy();
        reject(new Error('DNS check timeout'));
      });
    });
  }

  async attemptSelfHealing(error) {
    console.log('🔧 Attempting self-healing procedures...');
    
    // 1. Try to redeploy if the worker is completely down
    if (error.message.includes('request failed') || error.message.includes('timeout')) {
      console.log('🚀 Attempting worker redeployment...');
      await this.redeployWorker();
    }
    
    // 2. Wait longer before next check after an error
    console.log('⏳ Extended wait period after error...');
    await this.sleep(60000); // 1 minute
  }

  async redeployWorker() {
    return new Promise((resolve, reject) => {
      exec('wrangler deploy --config wrangler-production-simple.toml --env production', 
        { cwd: __dirname }, 
        (error, stdout, stderr) => {
          if (error) {
            console.error('❌ Redeployment failed:', error.message);
            reject(error);
            return;
          }
          
          if (stderr) {
            console.warn('⚠️ Redeployment warnings:', stderr);
          }
          
          console.log('✅ Worker redeployed successfully');
          console.log(stdout);
          resolve();
        }
      );
    });
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  stop() {
    console.log('🛑 Stopping Victory36 Monitor...');
    this.isRunning = false;
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\\n📋 Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\\n📋 Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

// Start monitoring
const monitor = new Victory36Monitor();
monitor.start().catch(error => {
  console.error('🚨 Monitor crashed:', error);
  process.exit(1);
});
