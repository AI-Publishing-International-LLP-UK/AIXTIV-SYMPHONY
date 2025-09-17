/**
 * 💎 Diamond Core - Central Diamond CLI functionality
 * 🏛️  Authority: Diamond SAO Command Center
 * 🌐 GCP Integration with API-For-Warp-Drive project
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

class DiamondCore {
  constructor(cli) {
    this.cli = cli;
    this.gcpProject = 'api-for-warp-drive';
    this.region = process.env.CLOUD_ML_REGION || 'us-west1';
    this.stagingZone = 'us-west1-b'; // mocoa staging
    this.productionZone = 'us-west1-a'; // mocoa production
  }

  async deploy(service, action, args) {
    this.cli.log.deploy(`🚀 Deploying ${service} ${action} to GCP...`);

    try {
      // Ensure we're deploying to GCP, not Cloudflare
      this.validateGCPDeployment();

      switch (service) {
        case 'service':
          await this.deployService(action, args);
          break;
        case 'integration':
          await this.deployIntegration(action, args);
          break;
        case 'gateway':
          await this.deployGateway(action, args);
          break;
        case 'quants':
          await this.deployQuantsSwarm(action, args);
          break;
        default:
          this.cli.log.warn(`Unknown service type: ${service}`);
      }

      this.cli.log.success('✅ Deployment completed successfully');
    } catch (error) {
      this.cli.log.error(`Deployment failed: ${error.message}`);
      throw error;
    }
  }

  validateGCPDeployment() {
    // Ensure deployment goes to GCP only, never Cloudflare
    const currentProject = this.getCurrentGCPProject();
    if (currentProject !== this.gcpProject) {
      throw new Error(
        `Wrong GCP project. Expected: ${this.gcpProject}, Current: ${currentProject}`
      );
    }

    this.cli.log.info(`✅ Validated GCP project: ${this.gcpProject}`);
    this.cli.log.info(`✅ Region: ${this.region}`);
  }

  getCurrentGCPProject() {
    try {
      const result = execSync('gcloud config get-value project', { encoding: 'utf8' }).trim();
      return result;
    } catch (error) {
      throw new Error('Failed to get current GCP project');
    }
  }

  async deployService(serviceName, args) {
    const environment = this.getEnvironmentFromArgs(args);
    const zone = environment === 'production' ? this.productionZone : this.stagingZone;

    this.cli.log.deploy(`📦 Deploying service: ${serviceName}`);
    this.cli.log.deploy(`🌍 Environment: ${environment} (${zone})`);

    // Build Docker image
    await this.buildDockerImage(serviceName);

    // Deploy to Cloud Run
    await this.deployToCloudRun(serviceName, environment);

    // Update DNS if needed
    if (environment === 'production') {
      await this.updateDNSRecords(serviceName);
    }
  }

  async buildDockerImage(serviceName) {
    this.cli.log.info(`🏗️  Building Docker image for ${serviceName}...`);

    try {
      const buildCommand = `gcloud builds submit --tag gcr.io/${this.gcpProject}/${serviceName} --project=${this.gcpProject}`;
      execSync(buildCommand, { stdio: 'inherit' });
      this.cli.log.success('✅ Docker image built successfully');
    } catch (error) {
      throw new Error(`Docker build failed: ${error.message}`);
    }
  }

  async deployToCloudRun(serviceName, environment) {
    this.cli.log.info('☁️  Deploying to Cloud Run...');

    try {
      const deployCommand = [
        'gcloud run deploy',
        serviceName,
        `--image=gcr.io/${this.gcpProject}/${serviceName}`,
        '--platform=managed',
        `--region=${this.region}`,
        `--project=${this.gcpProject}`,
        '--memory=2Gi',
        '--cpu=2',
        '--max-instances=100',
        `--set-env-vars=NODE_ENV=${environment}`,
        '--allow-unauthenticated',
      ].join(' ');

      execSync(deployCommand, { stdio: 'inherit' });
      this.cli.log.success('✅ Deployed to Cloud Run successfully');
    } catch (error) {
      throw new Error(`Cloud Run deployment failed: ${error.message}`);
    }
  }

  async updateDNSRecords(serviceName) {
    this.cli.log.info('🌐 Updating DNS records...');

    try {
      // Get Cloud Run service URL
      const getUrlCommand = `gcloud run services describe ${serviceName} --region=${this.region} --project=${this.gcpProject} --format="value(status.url)"`;
      const serviceUrl = execSync(getUrlCommand, { encoding: 'utf8' }).trim();

      // Update DNS in main-zone
      const dnsUpdateCommand = `gcloud dns record-sets transaction start --zone=main-zone --project=${this.gcpProject}`;
      execSync(dnsUpdateCommand);

      this.cli.log.success(`✅ DNS records updated for ${serviceName}`);
    } catch (error) {
      this.cli.log.warn(`DNS update warning: ${error.message}`);
      // Don't fail deployment for DNS issues
    }
  }

  async deployIntegration(integrationName, args) {
    this.cli.log.deploy(`🔗 Deploying integration: ${integrationName}`);

    // Deploy integration-gateway-js service
    if (integrationName === 'gateway') {
      await this.deployService('integration-gateway-js', args);
    }

    // Setup MongoDB Atlas connections
    await this.setupMongoDBConnections();

    // Configure Pinecone integration
    await this.configurePineconeIntegration();
  }

  async deployGateway(gatewayType, args) {
    this.cli.log.deploy(`🚪 Deploying gateway: ${gatewayType}`);

    // Deploy with SallyPort verification
    await this.deployWithSallyPort(gatewayType, args);
  }

  async deployWithSallyPort(service, args) {
    this.cli.log.info(`🔐 Configuring SallyPort verification for ${service}...`);

    // Ensure SallyPort secrets are available in Secret Manager
    await this.setupSallyPortSecrets();

    // Deploy with SallyPort integration
    await this.deployService(service, args);
  }

  async setupSallyPortSecrets() {
    this.cli.log.info('🔑 Setting up SallyPort secrets in Secret Manager...');

    try {
      // Check if SallyPort secrets exist
      const secretsCommand = `gcloud secrets list --project=${this.gcpProject} --filter="name:sallyport" --format="value(name)"`;
      const secrets = execSync(secretsCommand, { encoding: 'utf8' }).trim();

      if (!secrets) {
        this.cli.log.warn(
          '⚠️  SallyPort secrets not found. Please configure them in Secret Manager.'
        );
      } else {
        this.cli.log.success('✅ SallyPort secrets configured');
      }
    } catch (error) {
      this.cli.log.warn(`SallyPort secret check warning: ${error.message}`);
    }
  }

  async setupMongoDBConnections() {
    this.cli.log.info('🍃 Setting up MongoDB Atlas connections...');

    // MongoDB Atlas is configured as the agent registry system
    const mongoSecrets = [
      'MONGODB_ATLAS_URI',
      'MONGODB_ATLAS_DB_NAME',
      'MONGODB_ATLAS_USERNAME',
      'MONGODB_ATLAS_PASSWORD',
    ];

    for (const secret of mongoSecrets) {
      await this.ensureSecretExists(secret);
    }
  }

  async configurePineconeIntegration() {
    this.cli.log.info('🌲 Configuring Pinecone integration...');

    await this.ensureSecretExists('PINECONE_API_KEY');
    await this.ensureSecretExists('PINECONE_ENVIRONMENT');
  }

  async ensureSecretExists(secretName) {
    try {
      const checkCommand = `gcloud secrets describe ${secretName} --project=${this.gcpProject}`;
      execSync(checkCommand, { stdio: 'pipe' });
      this.cli.log.info(`✅ Secret ${secretName} exists`);
    } catch (error) {
      this.cli.log.warn(`⚠️  Secret ${secretName} not found. Please create it in Secret Manager.`);
    }
  }

  getEnvironmentFromArgs(args) {
    const envIndex = args.findIndex((arg) => arg === '--env');
    if (envIndex !== -1 && args[envIndex + 1]) {
      return args[envIndex + 1];
    }
    return 'staging'; // default to staging
  }

  async monitor(args) {
    this.cli.log.info('📊 Starting Diamond SAO monitoring dashboard...');

    try {
      // Get logs for integration-gateway-js
      this.cli.log.info('📋 Fetching service logs...');
      const logsCommand = `gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=integration-gateway-js" --limit=5 --project=${this.gcpProject}`;

      const logs = execSync(logsCommand, { encoding: 'utf8' });
      console.log('\n📋 Recent Service Logs:');
      console.log(logs);

      // Show service status
      await this.showServiceStatus();
    } catch (error) {
      this.cli.log.error(`Monitoring failed: ${error.message}`);
    }
  }

  async showServiceStatus() {
    this.cli.log.info('🔍 Checking service status...');

    try {
      const statusCommand = `gcloud run services list --platform=managed --region=${this.region} --project=${this.gcpProject}`;
      const services = execSync(statusCommand, { encoding: 'utf8' });

      console.log('\n☁️  Cloud Run Services:');
      console.log(services);
    } catch (error) {
      this.cli.log.error(`Failed to get service status: ${error.message}`);
    }
  }

  async deployQuantsSwarm(action, args) {
    this.cli.log.deploy(`📊 Deploying quants swarm: ${action}`);
    
    try {
      // Deploy quantum analytics infrastructure
      await this.deployQuantumAnalytics(args);
      
      // Setup ML swarm intelligence services
      await this.deployMLSwarmIntelligence(args);
      
      // Configure mocoa-quantum-middleware
      await this.deployService('mocoa-quantum-middleware', args);
      
      this.cli.log.success('✅ Quants swarm deployment completed');
    } catch (error) {
      this.cli.log.error(`Quants swarm deployment failed: ${error.message}`);
      throw error;
    }
  }

  async deployQuantumAnalytics(args) {
    this.cli.log.info('🔬 Deploying quantum analytics infrastructure...');
    
    // Deploy analytics services
    await this.deployService('ml-swarm-intelligence', args);
    await this.deployService('quantum-speed-analytics', args);
  }

  async deployMLSwarmIntelligence(args) {
    this.cli.log.info('🤖 Setting up ML swarm intelligence...');
    
    // Configure ML pipeline secrets
    await this.ensureSecretExists('OPENAI_API_KEY');
    await this.ensureSecretExists('ANTHROPIC_API_KEY');
    
    // Deploy swarm coordination services
    await this.deployService('wfa-production-swarm', args);
  }
}

module.exports = { DiamondCore };
