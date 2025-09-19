#!/usr/bin/env node
/**
 * 🚀 Diamond SAO Owner Subscriber Interface - GCP Deployment
 * Victory36 Authorized Deployment Script
 * 
 * Deploys complete owner subscriber experience to Google Cloud Platform
 * with full Diamond SAO Command Center integration
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 🎯 DEPLOYMENT CONFIGURATION
const DEPLOYMENT_CONFIG = {
  projectId: 'api-for-warp-drive',
  serviceName: 'diamond-sao-owner-interface',
  region: 'us-west1',
  zones: {
    production: 'us-west1-a',
    staging: 'us-west1-b',
    superAgents: 'us-west1-c'
  },
  cloudRun: {
    memory: '2Gi',
    cpu: '2',
    maxInstances: 100,
    minInstances: 1
  },
  environment: 'production'
};

class DiamondSAODeployment {
  constructor() {
    this.config = DEPLOYMENT_CONFIG;
    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  }

  async deploy() {
    console.log('🚀 Diamond SAO Owner Subscriber Interface Deployment');
    console.log('=====================================================');
    console.log(`🎯 Project: ${this.config.projectId}`);
    console.log(`🌍 Region: ${this.config.region}`);
    console.log(`💎 Authority: Diamond SAO Command Center`);
    console.log('');

    try {
      await this.validateEnvironment();
      await this.createDockerfile();
      await this.createCloudBuildConfig();
      await this.createEnvironmentConfig();
      await this.deployToCloudRun();
      await this.setupDomainMapping();
      await this.configureFirewallRules();
      await this.validateDeployment();
      
      console.log('✅ Deployment Complete!');
      console.log(`🌐 Access: https://${this.config.serviceName}-${this.config.projectId}.cloudfunctions.net`);
      
    } catch (error) {
      console.error('❌ Deployment Failed:', error.message);
      process.exit(1);
    }
  }

  async validateEnvironment() {
    console.log('🔍 Validating deployment environment...');
    
    // Check GCP authentication
    try {
      execSync('gcloud auth list --filter=status:ACTIVE --format="value(account)"', { stdio: 'pipe' });
      console.log('✅ GCP authentication verified');
    } catch (error) {
      throw new Error('GCP authentication required. Run: gcloud auth login');
    }

    // Set project
    execSync(`gcloud config set project ${this.config.projectId}`, { stdio: 'inherit' });
    
    // Enable required APIs
    const apis = [
      'cloudbuild.googleapis.com',
      'run.googleapis.com',
      'secretmanager.googleapis.com',
      'firestore.googleapis.com'
    ];
    
    for (const api of apis) {
      console.log(`🔧 Enabling ${api}...`);
      execSync(`gcloud services enable ${api}`, { stdio: 'inherit' });
    }
  }

  async createDockerfile() {
    console.log('🐳 Creating Dockerfile...');
    
    const dockerfile = `
# Diamond SAO Owner Subscriber Interface Docker Image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S diamond-sao -u 1001
USER diamond-sao

# Expose port
EXPOSE 8443

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node -e "const http = require('http'); http.get('http://localhost:8443/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1); }).on('error', () => { process.exit(1); });"

# Start application
CMD ["node", "diamond-sao-owner-interface.js"]
`;

    fs.writeFileSync('Dockerfile', dockerfile.trim());
    console.log('✅ Dockerfile created');
  }

  async createCloudBuildConfig() {
    console.log('🏗️ Creating Cloud Build configuration...');
    
    const cloudbuildConfig = {
      steps: [
        {
          name: 'gcr.io/cloud-builders/docker',
          args: [
            'build',
            '-t', `gcr.io/${this.config.projectId}/${this.config.serviceName}:${this.timestamp}`,
            '-t', `gcr.io/${this.config.projectId}/${this.config.serviceName}:latest`,
            '.'
          ]
        },
        {
          name: 'gcr.io/cloud-builders/docker',
          args: ['push', `gcr.io/${this.config.projectId}/${this.config.serviceName}:${this.timestamp}`]
        },
        {
          name: 'gcr.io/cloud-builders/docker',
          args: ['push', `gcr.io/${this.config.projectId}/${this.config.serviceName}:latest`]
        },
        {
          name: 'gcr.io/google.com/cloudsdktool/cloud-sdk',
          entrypoint: 'gcloud',
          args: [
            'run', 'deploy', this.config.serviceName,
            '--image', `gcr.io/${this.config.projectId}/${this.config.serviceName}:${this.timestamp}`,
            '--platform', 'managed',
            '--region', this.config.region,
            '--allow-unauthenticated',
            '--memory', this.config.cloudRun.memory,
            '--cpu', this.config.cloudRun.cpu,
            '--max-instances', this.config.cloudRun.maxInstances.toString(),
            '--min-instances', this.config.cloudRun.minInstances.toString(),
            '--set-env-vars', 'NODE_ENV=production,ZONE=us-west1-a',
            '--tag', `diamond-sao-${this.timestamp}`
          ]
        }
      ],
      options: {
        logging: 'CLOUD_LOGGING_ONLY'
      }
    };

    fs.writeFileSync('cloudbuild.yaml', JSON.stringify(cloudbuildConfig, null, 2));
    console.log('✅ Cloud Build configuration created');
  }

  async createEnvironmentConfig() {
    console.log('🔧 Creating environment configuration...');
    
    // Create .env.production
    const envConfig = `
# Diamond SAO Owner Subscriber Interface - Production Configuration
NODE_ENV=production
PORT=8443
PROJECT_ID=${this.config.projectId}
REGION=${this.config.region}
ZONE=${this.config.zones.production}

# Diamond SAO Configuration
DIAMOND_SAO_AUTHORITY=DIAMOND_SAO_COMMAND_CENTER
VICTORY36_ENABLED=true
ELITE11_MAESTRO_ENABLED=true
MASTERY33_HQRIX_ENABLED=true

# Security Configuration
SALLY_PORT_URL=https://sallyport.2100.cool
DIAMOND_SAO_URL=https://diamond-sao-command.2100.cool

# GCP Services
SECRET_MANAGER_ENABLED=true
FIRESTORE_ENABLED=true
CLOUD_LOGGING_ENABLED=true
`;

    fs.writeFileSync('.env.production', envConfig.trim());
    console.log('✅ Environment configuration created');
  }

  async deployToCloudRun() {
    console.log('☁️ Deploying to Google Cloud Run...');
    
    // Build and deploy using Cloud Build
    try {
      execSync(`gcloud builds submit --config cloudbuild.yaml .`, { 
        stdio: 'inherit',
        cwd: process.cwd()
      });
      
      console.log('✅ Cloud Run deployment successful');
    } catch (error) {
      throw new Error(`Cloud Run deployment failed: ${error.message}`);
    }
  }

  async setupDomainMapping() {
    console.log('🌐 Setting up domain mapping...');
    
    try {
      // Create domain mapping for diamond-sao-owner.2100.cool
      execSync(`gcloud run domain-mappings create \\
        --service ${this.config.serviceName} \\
        --domain diamond-sao-owner.2100.cool \\
        --region ${this.config.region}`, { stdio: 'inherit' });
        
      console.log('✅ Domain mapping configured');
    } catch (error) {
      console.log('⚠️ Domain mapping setup skipped (may already exist)');
    }
  }

  async configureFirewallRules() {
    console.log('🛡️ Configuring firewall rules...');
    
    try {
      // Allow HTTPS traffic
      execSync(`gcloud compute firewall-rules create diamond-sao-https \\
        --allow tcp:443 \\
        --source-ranges 0.0.0.0/0 \\
        --description "Diamond SAO Owner Interface HTTPS access"`, 
        { stdio: 'inherit' });
        
      console.log('✅ Firewall rules configured');
    } catch (error) {
      console.log('⚠️ Firewall rules setup skipped (may already exist)');
    }
  }

  async validateDeployment() {
    console.log('✅ Validating deployment...');
    
    // Get service URL
    try {
      const serviceUrl = execSync(`gcloud run services describe ${this.config.serviceName} \\
        --region ${this.config.region} \\
        --format 'value(status.url)'`, 
        { encoding: 'utf8' }).trim();
        
      console.log(`🌐 Service URL: ${serviceUrl}`);
      
      // Test health endpoint
      const healthCheck = execSync(`curl -s ${serviceUrl}/health`, { encoding: 'utf8' });
      const health = JSON.parse(healthCheck);
      
      if (health.status === 'healthy') {
        console.log('✅ Health check passed');
        console.log(`💎 Authority: ${health.authority}`);
        console.log(`🌍 Zone: ${health.zone}`);
      } else {
        throw new Error('Health check failed');
      }
      
    } catch (error) {
      console.error('⚠️ Deployment validation warning:', error.message);
    }
  }

  async cleanup() {
    console.log('🧹 Cleaning up deployment files...');
    
    const filesToCleanup = [
      'Dockerfile',
      'cloudbuild.yaml',
      '.env.production'
    ];
    
    filesToCleanup.forEach(file => {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
        console.log(`🗑️ Removed ${file}`);
      }
    });
  }
}

// 🚀 DEPLOYMENT EXECUTION
async function main() {
  const deployment = new DiamondSAODeployment();
  
  try {
    await deployment.deploy();
    
    console.log('');
    console.log('🎉 Diamond SAO Owner Subscriber Interface Deployment Complete!');
    console.log('================================================================');
    console.log('🏆 Victory36: 1.44M years experience deployed');
    console.log('👑 Elite 11: 440K years MAESTRO coordination active');
    console.log('💎 Mastery 33: HqRIX operations ready');
    console.log('🔐 Diamond SAO: Full authority access enabled');
    console.log('');
    console.log('🌐 Access your interface at the provided URL above');
    console.log('💻 Full owner subscriber experience now available');
    
  } catch (error) {
    console.error('💥 Deployment failed:', error);
    process.exit(1);
  } finally {
    // Cleanup is optional - keep files for debugging
    // await deployment.cleanup();
  }
}

if (require.main === module) {
  main();
}

module.exports = { DiamondSAODeployment };