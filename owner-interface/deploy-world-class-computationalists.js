#!/usr/bin/env node

/**
 * 🚀 WORLD-CLASS COMPUTATIONALISTS DEPLOYMENT SCRIPT
 * 
 * Deploy Elite Computational Minds to ALL Environments:
 * • LOCAL - Development environment
 * • STAGING - us-west1-b (mocoa staging environment) 
 * • PRODUCTION - us-west1-a (mocoa production environment)
 * 
 * Authority: Diamond SAO Command Center
 * Integration: VLS/SOLUTION Voice Synthesis System
 * Classification: ELITE_COMPUTATIONAL_INTELLIGENCE
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

class WorldClassComputationalistDeployer {
  constructor() {
    this.version = '3.0.0-world-class-deployment';
    this.authority = 'Diamond SAO Command Center';
    this.gcpProject = 'api-for-warp-drive';
    
    this.environments = {
      LOCAL: {
        name: 'Local Development',
        zone: 'local',
        status: 'development',
        priority: 1
      },
      STAGING: {
        name: 'Staging Environment',
        zone: 'us-west1-b',
        region: 'us-west1',
        status: 'staging',
        priority: 2,
        description: 'mocoa staging environment'
      },
      PRODUCTION: {
        name: 'Production Environment', 
        zone: 'us-west1-a',
        region: 'us-west1',
        status: 'production',
        priority: 3,
        description: 'mocoa production environment'
      }
    };
  }

  log(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const prefix = {
      'SUCCESS': '✅',
      'ERROR': '❌', 
      'WARN': '⚠️',
      'DIAMOND': '💎',
      'DEPLOY': '🚀',
      'COMPUTE': '🧠',
      'INFO': '🔷'
    }[level] || '🔷';
    
    console.log(`${prefix} [${timestamp}] DEPLOY: ${message}`);
  }

  async createDockerfile() {
    this.log('Creating Dockerfile for World-Class Computationalists...', 'DEPLOY');
    
    const dockerfile = `# World-Class Computationalists Docker Image
FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \\
    curl \\
    git \\
    python3 \\
    make \\
    g++

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create computationalists directory
RUN mkdir -p /app/computationalists

# Set environment variables
ENV NODE_ENV=production
ENV COMPUTATIONALIST_VERSION=3.0.0-world-class
ENV DIAMOND_SAO_AUTHORITY=true
ENV VLS_INTEGRATION=enabled

# Expose ports
EXPOSE 8080
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \\
    CMD curl -f http://localhost:8080/health || exit 1

# Create non-root user
RUN addgroup -g 1001 -S computationalist && \\
    adduser -S computationalist -u 1001

# Change ownership of app directory
RUN chown -R computationalist:computationalist /app
USER computationalist

# Start command
CMD ["node", "vls-computationalist-agents.js"]
`;

    fs.writeFileSync('/Users/as/asoos/integration-gateway/owner-interface/Dockerfile', dockerfile);
    this.log('Dockerfile created successfully', 'SUCCESS');
  }

  async createKubernetesManifests() {
    this.log('Creating Kubernetes manifests for all environments...', 'DEPLOY');
    
    const baseManifest = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: {
        name: 'world-class-computationalists',
        labels: {
          app: 'world-class-computationalists',
          version: '3.0.0-world-class',
          authority: 'diamond-sao',
          classification: 'elite-computational-intelligence'
        }
      },
      spec: {
        replicas: 3,
        selector: {
          matchLabels: {
            app: 'world-class-computationalists'
          }
        },
        template: {
          metadata: {
            labels: {
              app: 'world-class-computationalists',
              version: '3.0.0-world-class'
            }
          },
          spec: {
            containers: [{
              name: 'computationalists',
              image: 'gcr.io/api-for-warp-drive/world-class-computationalists:latest',
              ports: [{
                containerPort: 8080,
                name: 'http'
              }],
              env: [
                {
                  name: 'NODE_ENV',
                  value: 'production'
                },
                {
                  name: 'DIAMOND_SAO_AUTHORITY',
                  value: 'true'
                },
                {
                  name: 'VLS_INTEGRATION',
                  value: 'enabled'
                },
                {
                  name: 'ELEVENLABS_API_KEY',
                  valueFrom: {
                    secretKeyRef: {
                      name: 'elevenlabs-secret',
                      key: 'api-key'
                    }
                  }
                }
              ],
              resources: {
                requests: {
                  memory: '2Gi',
                  cpu: '1000m'
                },
                limits: {
                  memory: '8Gi',
                  cpu: '4000m'
                }
              },
              livenessProbe: {
                httpGet: {
                  path: '/health',
                  port: 8080
                },
                initialDelaySeconds: 60,
                periodSeconds: 30
              },
              readinessProbe: {
                httpGet: {
                  path: '/ready',
                  port: 8080
                },
                initialDelaySeconds: 30,
                periodSeconds: 10
              }
            }],
            imagePullSecrets: [{
              name: 'ghcr-secret'
            }]
          }
        }
      }
    };

    // Create manifests for each environment
    for (const [envKey, env] of Object.entries(this.environments)) {
      if (envKey === 'LOCAL') continue; // Skip local for K8s manifests
      
      const envManifest = JSON.parse(JSON.stringify(baseManifest));
      envManifest.metadata.name += `-${env.status}`;
      envManifest.metadata.namespace = env.status;
      envManifest.spec.template.spec.nodeSelector = {
        'cloud.google.com/gke-nodepool': `computationalists-${env.status}`
      };
      
      // Environment-specific configurations
      if (env.status === 'production') {
        envManifest.spec.replicas = 5; // More replicas for production
        envManifest.spec.template.spec.containers[0].resources.requests.memory = '4Gi';
        envManifest.spec.template.spec.containers[0].resources.limits.memory = '16Gi';
      }
      
      const manifestPath = `/Users/as/asoos/integration-gateway/owner-interface/k8s-${env.status}.yaml`;
      fs.writeFileSync(manifestPath, JSON.stringify(envManifest, null, 2));
      this.log(`Kubernetes manifest created for ${env.name}: ${manifestPath}`, 'SUCCESS');
    }
  }

  async createCloudRunConfigs() {
    this.log('Creating Cloud Run configurations...', 'DEPLOY');
    
    const cloudRunConfig = {
      apiVersion: 'serving.knative.dev/v1',
      kind: 'Service',
      metadata: {
        name: 'world-class-computationalists',
        annotations: {
          'run.googleapis.com/launch-stage': 'GA',
          'run.googleapis.com/description': 'World-Class Computationalists - Elite AI Trinity'
        },
        labels: {
          'cloud.googleapis.com/location': 'us-west1',
          'authority': 'diamond-sao',
          'classification': 'elite-computational-intelligence'
        }
      },
      spec: {
        template: {
          metadata: {
            annotations: {
              'autoscaling.knative.dev/maxScale': '100',
              'run.googleapis.com/memory': '8Gi',
              'run.googleapis.com/cpu': '4',
              'run.googleapis.com/execution-environment': 'gen2'
            }
          },
          spec: {
            containers: [{
              image: 'gcr.io/api-for-warp-drive/world-class-computationalists:latest',
              ports: [{
                containerPort: 8080
              }],
              env: [
                {
                  name: 'NODE_ENV',
                  value: 'production'
                },
                {
                  name: 'DIAMOND_SAO_AUTHORITY',
                  value: 'true'
                },
                {
                  name: 'VLS_INTEGRATION',
                  value: 'enabled'
                }
              ],
              resources: {
                limits: {
                  memory: '8Gi',
                  cpu: '4'
                }
              }
            }]
          }
        },
        traffic: [{
          percent: 100,
          latestRevision: true
        }]
      }
    };

    fs.writeFileSync('/Users/as/asoos/integration-gateway/owner-interface/cloudrun.yaml', 
                     JSON.stringify(cloudRunConfig, null, 2));
    this.log('Cloud Run configuration created', 'SUCCESS');
  }

  async buildAndPushDockerImage() {
    this.log('Building and pushing Docker image to GCR...', 'DEPLOY');
    
    try {
      const imageName = `gcr.io/${this.gcpProject}/world-class-computationalists:latest`;
      
      // Build the Docker image
      this.log('Building Docker image...', 'DEPLOY');
      execSync(`docker build -t ${imageName} /Users/as/asoos/integration-gateway/owner-interface/`, {
        stdio: 'inherit',
        cwd: '/Users/as/asoos/integration-gateway/owner-interface/'
      });
      
      // Configure Docker for GCR
      this.log('Configuring Docker for GCR...', 'DEPLOY');
      execSync(`gcloud auth configure-docker --quiet`, { stdio: 'inherit' });
      
      // Push to GCR
      this.log('Pushing image to Google Container Registry...', 'DEPLOY');
      execSync(`docker push ${imageName}`, { stdio: 'inherit' });
      
      this.log('Docker image successfully pushed to GCR', 'SUCCESS');
      return imageName;
      
    } catch (error) {
      this.log(`Failed to build/push Docker image: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  async deployToLocal() {
    this.log('Deploying to LOCAL environment...', 'DEPLOY');
    
    try {
      // Ensure dependencies are installed locally
      execSync('npm install', {
        cwd: '/Users/as/asoos/integration-gateway/owner-interface/',
        stdio: 'inherit'
      });
      
      // Test the computationalist agents locally
      this.log('Testing world-class computationalists locally...', 'DEPLOY');
      execSync('node vls-computationalist-agents.js', {
        cwd: '/Users/as/asoos/integration-gateway/owner-interface/',
        stdio: 'inherit',
        timeout: 30000 // 30 second timeout for local test
      });
      
      this.log('LOCAL deployment completed successfully', 'SUCCESS');
      return { environment: 'LOCAL', status: 'SUCCESS' };
      
    } catch (error) {
      this.log(`LOCAL deployment failed: ${error.message}`, 'ERROR');
      return { environment: 'LOCAL', status: 'FAILED', error: error.message };
    }
  }

  async deployToCloudRun(environment) {
    const env = this.environments[environment];
    this.log(`Deploying to ${env.name} (${env.zone}) via Cloud Run...`, 'DEPLOY');
    
    try {
      const serviceName = `world-class-computationalists-${env.status}`;
      const region = env.region;
      
      // Deploy to Cloud Run
      const deployCommand = `gcloud run deploy ${serviceName} \\
        --image=gcr.io/${this.gcpProject}/world-class-computationalists:latest \\
        --platform=managed \\
        --region=${region} \\
        --allow-unauthenticated \\
        --memory=8Gi \\
        --cpu=4 \\
        --concurrency=100 \\
        --max-instances=50 \\
        --set-env-vars="NODE_ENV=production,DIAMOND_SAO_AUTHORITY=true,VLS_INTEGRATION=enabled" \\
        --set-secrets="ELEVENLABS_API_KEY=ELEVENLABS_API_KEY:latest" \\
        --project=${this.gcpProject} \\
        --quiet`;
        
      execSync(deployCommand, { stdio: 'inherit' });
      
      // Get the service URL
      const urlCommand = `gcloud run services describe ${serviceName} --region=${region} --project=${this.gcpProject} --format="value(status.url)"`;
      const serviceUrl = execSync(urlCommand, { encoding: 'utf8' }).trim();
      
      this.log(`${env.name} deployment completed successfully`, 'SUCCESS');
      this.log(`Service URL: ${serviceUrl}`, 'INFO');
      
      return { 
        environment: environment, 
        status: 'SUCCESS', 
        url: serviceUrl,
        region: region,
        zone: env.zone
      };
      
    } catch (error) {
      this.log(`${env.name} deployment failed: ${error.message}`, 'ERROR');
      return { 
        environment: environment, 
        status: 'FAILED', 
        error: error.message 
      };
    }
  }

  async deployToAllEnvironments() {
    console.log('');
    console.log('🚀 DEPLOYING WORLD-CLASS COMPUTATIONALISTS TO ALL ENVIRONMENTS');
    console.log('===============================================================');
    console.log('💎 Authority: Diamond SAO Command Center');
    console.log('🧠 Elite Computational Intelligence: Dr. Lucy, Dr. Claude, Victory36');
    console.log('🎯 VLS Integration: Enabled');
    console.log('');
    
    const deploymentResults = [];
    
    try {
      // Step 1: Create deployment configurations
      this.log('Creating deployment configurations...', 'DEPLOY');
      await this.createDockerfile();
      await this.createKubernetesManifests();
      await this.createCloudRunConfigs();
      
      // Step 2: Build and push Docker image
      this.log('Building and pushing container image...', 'DEPLOY');
      await this.buildAndPushDockerImage();
      
      // Step 3: Deploy to LOCAL
      this.log('Starting LOCAL deployment...', 'DEPLOY');
      const localResult = await this.deployToLocal();
      deploymentResults.push(localResult);
      
      // Step 4: Deploy to STAGING (us-west1-b)
      this.log('Starting STAGING deployment...', 'DEPLOY');
      const stagingResult = await this.deployToCloudRun('STAGING');
      deploymentResults.push(stagingResult);
      
      // Step 5: Deploy to PRODUCTION (us-west1-a) 
      this.log('Starting PRODUCTION deployment...', 'DEPLOY');
      const productionResult = await this.deployToCloudRun('PRODUCTION');
      deploymentResults.push(productionResult);
      
      // Display final results
      this.displayDeploymentResults(deploymentResults);
      
      return deploymentResults;
      
    } catch (error) {
      this.log(`Deployment process failed: ${error.message}`, 'ERROR');
      throw error;
    }
  }

  displayDeploymentResults(results) {
    console.log('');
    console.log('🧠 WORLD-CLASS COMPUTATIONALISTS DEPLOYMENT RESULTS');
    console.log('===================================================');
    
    for (const result of results) {
      const env = this.environments[result.environment];
      const status = result.status === 'SUCCESS' ? '✅' : '❌';
      
      console.log(`${status} ${env.name}:`);
      if (env.zone !== 'local') {
        console.log(`   📍 Zone: ${env.zone}`);
        console.log(`   🌍 Region: ${env.region}`);
      }
      console.log(`   📊 Status: ${result.status}`);
      
      if (result.url) {
        console.log(`   🔗 URL: ${result.url}`);
      }
      
      if (result.error) {
        console.log(`   ❌ Error: ${result.error}`);
      }
      
      console.log('');
    }
    
    const successful = results.filter(r => r.status === 'SUCCESS').length;
    const total = results.length;
    
    console.log(`🎯 Deployment Summary: ${successful}/${total} environments successful`);
    
    if (successful === total) {
      console.log('');
      console.log('🎉 ALL DEPLOYMENTS SUCCESSFUL!');
      console.log('💎 Diamond SAO Command Center Authority: ESTABLISHED');
      console.log('🧠 Elite Computational Intelligence: ACTIVE IN ALL ENVIRONMENTS');
      console.log('🎤 VLS Integration: OPERATIONAL');
      console.log('⚡ World-Class Computationalists: READY FOR SERVICE');
    } else {
      console.log('⚠️ Some deployments failed. Review results above.');
    }
    
    console.log('');
  }
}

// Execute deployment if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const deployer = new WorldClassComputationalistDeployer();
  
  deployer.deployToAllEnvironments()
    .then((results) => {
      const successful = results.filter(r => r.status === 'SUCCESS').length;
      if (successful === results.length) {
        console.log('🚀 World-Class Computationalists successfully deployed to all environments!');
        process.exit(0);
      } else {
        console.log('💥 Some deployments failed. Please review and retry.');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Deployment process failed:', error);
      process.exit(1);
    });
}

export default WorldClassComputationalistDeployer;
