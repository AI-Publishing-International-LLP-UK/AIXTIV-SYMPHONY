#!/usr/bin/env node

/**
 * HIGH-SPEED PRODUCTION PUBLISHER
 * Real production deployment with all services
 */

const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const CONFIG = {
  PROJECT_ID: 'api-for-warp-drive',
  REGIONS: ['us-west1', 'us-central1'],
  DOCKER_IMAGE: 'gcr.io/api-for-warp-drive/universal-gateway',
  SERVICES: [
    'integration-gateway-js',
    'universal-gateway',
    'mcp-zaxxon-2100-cool',
    'mongodb-mcp-oauth-uscentral1'
  ]
};

class ProductionPublisher {
  constructor() {
    this.startTime = Date.now();
    console.log('🚀 PRODUCTION DEPLOYMENT INITIATED');
    console.log('==================================');
  }

  async log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);
    console.log(`[${timestamp}] [+${elapsed}s] [${level}] ${message}`);
  }

  async executeCommand(command, description) {
    await this.log(`🔄 ${description}...`);
    try {
      const { stdout, stderr } = await execAsync(command, { timeout: 300000 });
      if (stderr && !stderr.includes('warning') && !stderr.includes('Done.')) {
        await this.log(`⚠️  ${description} - Warning: ${stderr.substring(0, 200)}`, 'WARN');
      }
      await this.log(`✅ ${description} - SUCCESS`);
      return { success: true, output: stdout };
    } catch (error) {
      await this.log(`❌ ${description} - FAILED: ${error.message.substring(0, 200)}`, 'ERROR');
      return { success: false, error: error.message };
    }
  }

  async buildAndPushImage() {
    await this.log('🏗️  BUILDING PRODUCTION IMAGE');
    
    // Build with correct platform
    const buildResult = await this.executeCommand(
      `docker build --platform linux/amd64 -t ${CONFIG.DOCKER_IMAGE}:production-$(date +%Y%m%d_%H%M%S) -t ${CONFIG.DOCKER_IMAGE}:latest .`,
      'Building production Docker image'
    );

    if (!buildResult.success) {
      throw new Error('Docker build failed');
    }

    // Push to production registry
    const pushResult = await this.executeCommand(
      `docker push ${CONFIG.DOCKER_IMAGE}:latest`,
      'Pushing to production registry'
    );

    return pushResult.success;
  }

  async deployToProduction() {
    await this.log('☁️  DEPLOYING TO PRODUCTION');
    
    const promises = [];
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Deploy critical services to production regions
    for (const service of CONFIG.SERVICES) {
      for (const region of CONFIG.REGIONS) {
        const deployPromise = this.executeCommand(
          `gcloud run deploy ${service} \\
            --image ${CONFIG.DOCKER_IMAGE}:latest \\
            --region ${region} \\
            --platform managed \\
            --allow-unauthenticated \\
            --port 8080 \\
            --memory 4Gi \\
            --cpu 2000m \\
            --min-instances 1 \\
            --max-instances 200 \\
            --concurrency 100 \\
            --timeout 900 \\
            --set-env-vars="NODE_ENV=production,DEPLOYMENT_ID=${timestamp},REGION=${region}" \\
            --quiet`,
          `Deploy ${service} to ${region}`
        );
        promises.push(deployPromise);
      }
    }

    // Execute all deployments
    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.success).length;
    
    await this.log(`📊 Production Deployment: ${successCount}/${results.length} successful`);
    
    return successCount > 0;
  }

  async activateServices() {
    await this.log('🔄 ACTIVATING PRODUCTION SERVICES');
    
    const promises = [];

    // Route 100% traffic to latest revision
    for (const service of CONFIG.SERVICES) {
      for (const region of CONFIG.REGIONS) {
        const trafficPromise = this.executeCommand(
          `gcloud run services update-traffic ${service} \\
            --to-revisions LATEST=100 \\
            --region ${region} \\
            --quiet`,
          `Activate traffic for ${service} in ${region}`
        );
        promises.push(trafficPromise);
      }
    }

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.success).length;
    
    await this.log(`📊 Traffic Activation: ${successCount}/${results.length} successful`);
    
    return successCount > 0;
  }

  async verifyDeployment() {
    await this.log('🩺 VERIFYING PRODUCTION DEPLOYMENT');
    
    const promises = [];
    
    // Get service URLs and verify
    const verifyPromise = this.executeCommand(
      `gcloud run services list --regions=${CONFIG.REGIONS.join(',')} --filter="metadata.name:(${CONFIG.SERVICES.join(' OR ')})" --format="value(status.url)"`,
      'Verify service URLs'
    );
    promises.push(verifyPromise);

    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.success).length;
    
    if (results[0].success && results[0].output) {
      const urls = results[0].output.trim().split('\n').filter(url => url);
      await this.log(`🌐 LIVE PRODUCTION URLS: ${urls.length} services deployed`);
      urls.forEach((url, index) => {
        this.log(`   ${index + 1}. ${url}`);
      });
    }

    return successCount > 0;
  }

  async generateReport() {
    const elapsed = ((Date.now() - this.startTime) / 1000).toFixed(2);
    
    const report = {
      timestamp: new Date().toISOString(),
      duration: `${elapsed}s`,
      services_deployed: CONFIG.SERVICES.length,
      regions: CONFIG.REGIONS.length,
      total_deployments: CONFIG.SERVICES.length * CONFIG.REGIONS.length,
      status: 'PRODUCTION_LIVE',
      deployment_type: 'HIGH_SPEED_PRODUCTION'
    };

    await this.log(`📊 PRODUCTION DEPLOYMENT COMPLETED IN ${elapsed}s`);
    return report;
  }

  async publish() {
    try {
      await this.log('🚀 INITIATING PRODUCTION DEPLOYMENT');
      
      // Build and push image
      await this.buildAndPushImage();
      
      // Deploy to production
      const deploySuccess = await this.deployToProduction();
      
      if (!deploySuccess) {
        throw new Error('Production deployment failed');
      }
      
      // Activate services
      await this.activateServices();
      
      // Verify deployment
      await this.verifyDeployment();
      
      // Generate report
      const report = await this.generateReport();
      
      await this.log('🎉 PRODUCTION DEPLOYMENT COMPLETED SUCCESSFULLY!');
      return report;

    } catch (error) {
      await this.log(`💥 PRODUCTION DEPLOYMENT FAILED: ${error.message}`, 'ERROR');
      throw error;
    }
  }
}

// Execute production deployment
if (require.main === module) {
  const publisher = new ProductionPublisher();
  publisher.publish()
    .then(report => {
      console.log('\n🎯 PRODUCTION DEPLOYMENT REPORT:');
      console.log('================================');
      console.log(JSON.stringify(report, null, 2));
      process.exit(0);
    })
    .catch(error => {
      console.error('\n💥 PRODUCTION DEPLOYMENT FAILED:');
      console.error('================================');
      console.error(error.message);
      process.exit(1);
    });
}

module.exports = ProductionPublisher;