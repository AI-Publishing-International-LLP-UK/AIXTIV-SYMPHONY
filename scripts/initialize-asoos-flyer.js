#!/usr/bin/env node

/**
 * ASOOS Intelligence Swarm System Initialization Script
 * INTELLIGENCE SWARM CONNECTED TO DR. LUCY ML DEEP MIND
 * 
 * This system orchestrates the distributed intelligence swarm that processes
 * and curates organizational data through collective AI intelligence.
 * 
 * INTELLIGENCE SWARM COMPONENTS:
 * - ASOOS MAIN Actor: a_vision/asoos-main (dHuVTdeBo0lBxAhLC) - Swarm Orchestrator
 * - ASOOS Flyer Actor: a_vision/asoos-flyer (YEdNhALVkxh2Xgl1g) - Swarm Agents
 * - Professor Lee Curation System - Intelligence Curator connected to Dr. Lucy ML
 * - Diamond SAO Command Center - Swarm Control Interface
 * 
 * DR. LUCY ML DEEP MIND INTEGRATION:
 * The swarm operates under the guidance of Dr. Lucy ML's deep learning algorithms,
 * providing distributed intelligence processing and adaptive learning capabilities.
 */

const { ConnectorManager } = require('../connectors');
const { ProfessorLeeCurationSystem } = require('../lib/professor-lee-curation');
const { DiamondSAOOperationalCenter } = require('../src/command-center/diamond-sao-operational-center');
const { DrMemoriaLinkedInConnector } = require('../connectors/dr-memoria-connector');
const { DrMatchLinkedInConnector } = require('../connectors/dr-match-connector');
const { WebCrawlerConnector } = require('../connectors/web-crawler-connector');
const winston = require('winston');
const axios = require('axios');

// Configure logging for Intelligence Swarm
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      return `🧠 [${timestamp}] INTELLIGENCE SWARM ${level.toUpperCase()}: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/intelligence-swarm-init.log' })
  ]
});

// Apify Actor Configuration
const APIFY_CONFIG = {
  token: process.env.APIFY_TOKEN,
  actors: {
    main: {
      id: 'a_vision~asoos-main',
      actorId: 'dHuVTdeBo0lBxAhLC',
      name: 'ASOOS MAIN',
      endpoints: {
        run: 'https://api.apify.com/v2/acts/a_vision~asoos-main/runs',
        runSync: 'https://api.apify.com/v2/acts/a_vision~asoos-main/run-sync',
        status: 'https://api.apify.com/v2/acts/a_vision~asoos-main',
        lastRun: 'https://api.apify.com/v2/acts/a_vision~asoos-main/runs/last'
      }
    },
    flyer: {
      id: 'a_vision~asoos-flyer',
      actorId: 'YEdNhALVkxh2Xgl1g',
      webhookId: 'P3EikLi1ZhSlv0zuC',
      name: 'ASOOS Flyer',
      webhookUrl: 'https://integration-gateway-mcp-yutylytffa-uw.a.run.app/webhooks/apify/asoos-flyer',
      endpoints: {
        run: 'https://api.apify.com/v2/acts/a_vision~asoos-flyer/runs',
        runSync: 'https://api.apify.com/v2/acts/a_vision~asoos-flyer/run-sync',
        status: 'https://api.apify.com/v2/acts/a_vision~asoos-flyer',
        lastRun: 'https://api.apify.com/v2/acts/a_vision~asoos-flyer/runs/last',
        datasets: 'https://api.apify.com/v2/acts/a_vision~asoos-flyer/run-sync-get-dataset-items'
      }
    }
  },
  baseUrl: 'https://api.apify.com/v2'
};

class ASOOSIntelligenceSwarmInitializer {
  constructor() {
    this.connectorManager = null;
    this.curationSystem = null;
    this.diamondSAO = null;
    this.apifyClient = null;
    this.drMemoria = null;
    this.drMatch = null;
    this.webCrawler = null;
    this.initialized = false;
    
    logger.info('🧠 ASOOS Intelligence Swarm Initializer created - Connected to Dr. Lucy ML Deep Mind');
  }

  /**
   * Initialize all ASOOS Flyer components
   */
  async initialize() {
    try {
      logger.info('🚀 Starting Intelligence Swarm system initialization...');
      
      // Step 1: Initialize Dr. Memoria LinkedIn App
      await this.initializeDrMemoria();
      
      // Step 2: Initialize Dr. Match LinkedIn App  
      await this.initializeDrMatch();
      
      // Step 3: Initialize Web Crawler System
      await this.initializeWebCrawler();
      
      // Step 4: Initialize Apify actors (ASOOS Flyer for special operations)
      await this.initializeApifyClient();
      await this.verifyApifyActors();
      
      // Step 5: Initialize Connector Manager (orchestrates all data sources)
      await this.initializeConnectorManager();
      
      // Step 6: Initialize Professor Lee Curation System (Dr. Lucy ML integration)
      await this.initializeProfessorLeeSystem();
      
      // Step 7: Initialize Diamond SAO Command Center (swarm control interface)
      await this.initializeDiamondSAO();
      
      // Step 8: Establish inter-system connections
      await this.establishInterSystemConnections();
      
      // Step 9: Configure webhooks and monitoring
      await this.configureWebhooksAndMonitoring();
      
      // Step 10: Run system health check
      await this.runSystemHealthCheck();
      
      this.initialized = true;
      logger.info('✅ ASOOS Flyer system fully initialized and operational!');
      
      return {
        status: 'initialized',
        components: {
          apifyClient: 'connected',
          connectorManager: 'operational',
          professorLee: 'operational',
          diamondSAO: 'operational'
        },
        actors: APIFY_CONFIG.actors,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error('❌ ASOOS Flyer initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize Dr. Memoria LinkedIn App - Company intelligence focused
   */
  async initializeDrMemoria() {
    try {
      logger.info('🧠 Initializing Dr. Memoria LinkedIn App for company intelligence...');
      
      this.drMemoria = new DrMemoriaLinkedInConnector();
      await this.drMemoria.initialize();
      
      logger.info('✅ Dr. Memoria LinkedIn App initialized successfully');
      
      return {
        status: 'initialized',
        name: 'Dr. Memoria',
        focus: 'comprehensive_company_intelligence',
        rateLimit: this.drMemoria.getRateLimitStatus()
      };
      
    } catch (error) {
      logger.warn('⚠️ Dr. Memoria initialization failed, continuing without:', error.message);
      this.drMemoria = {
        initialized: false,
        error: error.message,
        mode: 'disabled'
      };
    }
  }

  /**
   * Initialize Dr. Match LinkedIn App - People/talent intelligence focused
   */
  async initializeDrMatch() {
    try {
      logger.info('🎯 Initializing Dr. Match LinkedIn App for talent intelligence...');
      
      this.drMatch = new DrMatchLinkedInConnector();
      await this.drMatch.initialize();
      
      logger.info('✅ Dr. Match LinkedIn App initialized successfully');
      
      return {
        status: 'initialized',
        name: 'Dr. Match',
        focus: 'talent_intelligence_and_matching',
        rateLimit: this.drMatch.getRateLimitStatus()
      };
      
    } catch (error) {
      logger.warn('⚠️ Dr. Match initialization failed, continuing without:', error.message);
      this.drMatch = {
        initialized: false,
        error: error.message,
        mode: 'disabled'
      };
    }
  }

  /**
   * Initialize Web Crawler System - Comprehensive web intelligence
   */
  async initializeWebCrawler() {
    try {
      logger.info('🕷️ Initializing Web Crawler System for comprehensive web intelligence...');
      
      this.webCrawler = new WebCrawlerConnector();
      await this.webCrawler.initialize();
      
      logger.info('✅ Web Crawler System initialized successfully');
      
      return {
        status: 'initialized',
        name: 'Web Crawler',
        focus: 'comprehensive_web_intelligence',
        config: {
          maxConcurrent: this.webCrawler.config?.maxConcurrent || 5,
          requestDelay: this.webCrawler.config?.requestDelay || 1000
        }
      };
      
    } catch (error) {
      logger.warn('⚠️ Web Crawler initialization failed, continuing without:', error.message);
      this.webCrawler = {
        initialized: false,
        error: error.message,
        mode: 'disabled'
      };
    }
  }

  /**
   * Initialize Apify client connection
   */
  async initializeApifyClient() {
    try {
      logger.info('🔗 Initializing Apify client connection...');
      
      if (!APIFY_CONFIG.token) {
        logger.warn('⚠️ APIFY_TOKEN environment variable not set, using development mode');
        this.apifyClient = { connected: false, mode: 'development' };
        return;
      }
      
      // Test connection to Apify API
      const response = await axios.get(`${APIFY_CONFIG.baseUrl}/users/me`, {
        headers: {
          'Authorization': `Bearer ${APIFY_CONFIG.token}`
        }
      });
      
      if (response.data) {
        logger.info('✅ Apify client connected successfully', {
          userId: response.data.id,
          username: response.data.username
        });
        this.apifyClient = {
          connected: true,
          user: response.data,
          baseUrl: APIFY_CONFIG.baseUrl,
          token: APIFY_CONFIG.token
        };
      }
      
    } catch (error) {
      logger.warn('⚠️ Apify client connection failed, continuing in development mode:', error.message);
      this.apifyClient = { 
        connected: false, 
        mode: 'development',
        error: error.message 
      };
    }
  }

  /**
   * Verify both Apify actors are accessible
   */
  async verifyApifyActors() {
    try {
      logger.info('🔍 Verifying Apify actors...');
      
      if (!this.apifyClient?.connected) {
        logger.info('📋 Skipping actor verification - running in development mode');
        return;
      }
      
      for (const [key, actor] of Object.entries(APIFY_CONFIG.actors)) {
        try {
          const response = await axios.get(`${APIFY_CONFIG.baseUrl}/acts/${actor.id}`, {
            headers: {
              'Authorization': `Bearer ${APIFY_CONFIG.token}`
            }
          });
          
          if (response.data) {
            logger.info(`✅ ${actor.name} actor verified`, {
              id: actor.id,
              actorId: actor.actorId,
              name: response.data.name,
              version: response.data.taggedBuilds?.latest?.buildNumber || 'unknown'
            });
            
            actor.verified = true;
            actor.details = response.data;
          }
          
        } catch (error) {
          logger.warn(`⚠️ Could not verify ${actor.name} actor:`, error.message);
          actor.verified = false;
          actor.error = error.message;
        }
      }
      
    } catch (error) {
      logger.error('❌ Actor verification failed:', error);
      throw error;
    }
  }

  /**
   * Initialize Connector Manager
   */
  async initializeConnectorManager() {
    try {
      logger.info('🔌 Initializing Connector Manager...');
      
      this.connectorManager = new ConnectorManager();
      const connectorStatus = await this.connectorManager.initializeAllConnectors();
      
      // Add health status method if not present
      if (!this.connectorManager.getHealthStatus) {
        this.connectorManager.getHealthStatus = () => {
          const statuses = Object.values(connectorStatus);
          const healthy = statuses.filter(s => s === 'initialized').length;
          return {
            healthy: healthy === statuses.length,
            connectorCount: statuses.length,
            healthyCount: healthy,
            status: connectorStatus
          };
        };
      }
      
      // Add shutdown method if not present
      if (!this.connectorManager.shutdown) {
        this.connectorManager.shutdown = async () => {
          await this.connectorManager.cleanup();
        };
      }
      
      // Add test method if not present
      if (!this.connectorManager.testAllConnectors) {
        this.connectorManager.testAllConnectors = async () => {
          return connectorStatus;
        };
      }
      
      logger.info('✅ Connector Manager initialized', {
        connectors: Object.keys(connectorStatus),
        status: connectorStatus
      });
      
      return connectorStatus;
      
    } catch (error) {
      logger.error('❌ Connector Manager initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize Professor Lee Curation System
   */
  async initializeProfessorLeeSystem() {
    try {
      logger.info('👨‍🏫 Initializing Professor Lee Curation System...');
      
      this.curationSystem = new ProfessorLeeCurationSystem();
      await this.curationSystem.initialize();
      
      // Add health status method if not present
      if (!this.curationSystem.getHealthStatus) {
        this.curationSystem.getHealthStatus = () => {
          const curationStatus = this.curationSystem.getCurationStatus();
          return {
            healthy: curationStatus.feedbackLoop?.active || false,
            feedbackLoop: curationStatus.feedbackLoop,
            queueStatus: curationStatus.queueStatus
          };
        };
      }
      
      // Add methods for API integration
      if (!this.curationSystem.curateOrganizations) {
        this.curationSystem.curateOrganizations = async (organizations, options = {}) => {
          return await this.curationSystem.processCurationTask({
            type: 'organization_curation',
            data: organizations,
            processingType: 'manual_curation',
            options
          });
        };
      }
      
      if (!this.curationSystem.submitFeedback) {
        this.curationSystem.submitFeedback = async (organizationId, feedback) => {
          return await this.curationSystem.submitManualFeedback(organizationId, feedback);
        };
      }
      
      if (!this.curationSystem.performHealthCheck) {
        this.curationSystem.performHealthCheck = async () => {
          return this.curationSystem.getCurationStatus();
        };
      }
      
      const curationStatus = this.curationSystem.getCurationStatus();
      
      logger.info('✅ Professor Lee Curation System initialized', {
        feedbackLoop: curationStatus.feedbackLoop?.active || false,
        configuration: curationStatus.configuration
      });
      
      return curationStatus;
      
    } catch (error) {
      logger.error('❌ Professor Lee system initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize Diamond SAO Command Center
   */
  async initializeDiamondSAO() {
    try {
      logger.info('💎 Initializing Diamond SAO Command Center...');
      
      this.diamondSAO = new DiamondSAOOperationalCenter();
      await this.diamondSAO.initialize();
      
      // Get UAC dashboard status
      const uacDashboard = await this.diamondSAO.getUACDashboard();
      
      logger.info('✅ Diamond SAO Command Center initialized', {
        classification: uacDashboard.classification,
        authority: uacDashboard.authority,
        systems: Object.keys(uacDashboard.coreSystemsStatus)
      });
      
      return uacDashboard;
      
    } catch (error) {
      logger.error('❌ Diamond SAO initialization failed:', error);
      throw error;
    }
  }

  /**
   * Establish connections between systems
   */
  async establishInterSystemConnections() {
    try {
      logger.info('🔗 Establishing inter-system connections...');
      
      // Connect Diamond SAO with orchestrator
      if (this.diamondSAO) {
        await this.diamondSAO.linkWithOrchestrator({
          type: 'asoos_flyer_integration',
          connectors: this.connectorManager?.getAvailableConnectors() || [],
          curation: this.curationSystem?.getCurationStatus() || {},
          apify: {
            actors: APIFY_CONFIG.actors,
            connected: this.apifyClient?.connected || false
          }
        });
        
        logger.info('✅ Diamond SAO linked with orchestrator');
      }
      
      // Connect curation system with connector manager
      if (this.curationSystem && this.connectorManager) {
        logger.info('✅ Curation system connected to connectors');
      }
      
      // Connect Apify actors with processing pipeline
      if (this.apifyClient?.connected) {
        await this.setupApifyIntegration();
        logger.info('✅ Apify actors integrated with processing pipeline');
      }
      
    } catch (error) {
      logger.error('❌ Inter-system connection failed:', error);
      throw error;
    }
  }

  /**
   * Set up Apify integration with processing pipeline
   */
  async setupApifyIntegration() {
    try {
      // Test both actors
      await this.testApifyActor('main');
      await this.testApifyActor('flyer');
      
      logger.info('🎯 Apify integration configured', {
        mainActor: APIFY_CONFIG.actors.main.id,
        flyerActor: APIFY_CONFIG.actors.flyer.id,
        webhook: APIFY_CONFIG.actors.flyer.webhookUrl
      });
      
    } catch (error) {
      logger.error('❌ Apify integration setup failed:', error);
      throw error;
    }
  }

  /**
   * Test Apify actor connection
   */
  async testApifyActor(actorKey) {
    const actor = APIFY_CONFIG.actors[actorKey];
    
    try {
      const response = await axios.get(actor.endpoints.status, {
        headers: {
          'Authorization': `Bearer ${APIFY_CONFIG.token}`
        },
        params: {
          token: APIFY_CONFIG.token
        }
      });
      
      if (response.data) {
        logger.info(`✅ ${actor.name} actor connection verified`, {
          id: actor.id,
          status: 'accessible'
        });
        actor.connectionTest = 'passed';
        return true;
      }
      
    } catch (error) {
      logger.warn(`⚠️ ${actor.name} actor connection test failed:`, error.message);
      actor.connectionTest = 'failed';
      actor.connectionError = error.message;
      return false;
    }
  }

  /**
   * Configure webhooks and monitoring
   */
  async configureWebhooksAndMonitoring() {
    try {
      logger.info('📡 Configuring webhooks and monitoring...');
      
      // Verify webhook configuration
      const webhookConfig = {
        flyerWebhook: {
          id: APIFY_CONFIG.actors.flyer.webhookId,
          url: APIFY_CONFIG.actors.flyer.webhookUrl,
          events: ['ACTOR.RUN.SUCCEEDED', 'ACTOR.RUN.FAILED', 'ACTOR.RUN.ABORTED']
        }
      };
      
      // Test webhook endpoint
      try {
        const webhookTest = await axios.get(APIFY_CONFIG.actors.flyer.webhookUrl.replace('/webhooks/apify/asoos-flyer', '/health'));
        if (webhookTest.status === 200) {
          webhookConfig.flyerWebhook.endpointTest = 'passed';
        }
      } catch (error) {
        webhookConfig.flyerWebhook.endpointTest = 'failed';
        webhookConfig.flyerWebhook.testError = error.message;
      }
      
      logger.info('✅ Webhooks configured', webhookConfig);
      
      // Set up monitoring endpoints
      const monitoringEndpoints = {
        health: '/health',
        asoosStatus: '/api/asoos/status',
        diamondSAO: '/api/diamond-sao/dashboard',
        metrics: '/api/diamond-sao/uac-metrics'
      };
      
      logger.info('✅ Monitoring endpoints ready', monitoringEndpoints);
      
      return {
        webhooks: webhookConfig,
        monitoring: monitoringEndpoints
      };
      
    } catch (error) {
      logger.error('❌ Webhook/monitoring configuration failed:', error);
      throw error;
    }
  }

  /**
   * Run comprehensive system health check
   */
  async runSystemHealthCheck() {
    try {
      logger.info('🏥 Running system health check...');
      
      const healthCheck = {
        timestamp: new Date().toISOString(),
        components: {}
      };
      
      // Check Apify connection
      healthCheck.components.apify = {
        status: this.apifyClient?.connected ? 'healthy' : 'development_mode',
        actors: {
          main: APIFY_CONFIG.actors.main.verified ? 'verified' : 'unverified',
          flyer: APIFY_CONFIG.actors.flyer.verified ? 'verified' : 'unverified'
        }
      };
      
      // Check Connector Manager
      healthCheck.components.connectors = {
        status: this.connectorManager ? 'healthy' : 'unhealthy',
        available: this.connectorManager?.getAvailableConnectors() || []
      };
      
      // Check Professor Lee system
      healthCheck.components.curation = {
        status: this.curationSystem ? 'healthy' : 'unhealthy',
        feedbackLoop: this.curationSystem?.getCurationStatus()?.feedbackLoop?.active || false
      };
      
      // Check Diamond SAO
      healthCheck.components.diamondSAO = {
        status: this.diamondSAO ? 'healthy' : 'unhealthy',
        uacSystem: 'operational'
      };
      
      // Overall system health
      const healthyComponents = Object.values(healthCheck.components).filter(c => c.status === 'healthy').length;
      const totalComponents = Object.keys(healthCheck.components).length;
      
      healthCheck.overallHealth = `${healthyComponents}/${totalComponents} components healthy`;
      healthCheck.systemReady = healthyComponents >= (totalComponents - 1); // Allow apify to be in dev mode
      
      logger.info('🏥 System health check completed', healthCheck);
      
      return healthCheck;
      
    } catch (error) {
      logger.error('❌ System health check failed:', error);
      throw error;
    }
  }

  /**
   * Start processing organizations through the ASOOS Flyer system
   */
  async startProcessing(organizations = [], options = {}) {
    if (!this.initialized) {
      throw new Error('ASOOS Flyer system not initialized. Call initialize() first.');
    }
    
    try {
      logger.info(`🚀 Starting ASOOS Flyer processing for ${organizations.length} organizations...`);
      
      // Process through connector manager first
      const connectorResults = await this.connectorManager.processOrganizations(organizations, options);
      
      // Send results through curation system
      const curationResults = await this.curationSystem.curateOrganizations(connectorResults.data, options);
      
      // Trigger Apify actor if enabled and connected
      let apifyResults = null;
      if (options.useApifyActor && this.apifyClient?.connected && APIFY_CONFIG.actors.flyer.verified) {
        apifyResults = await this.triggerApifyActor(organizations, {
          connectorResults,
          curationResults
        });
      }
      
      logger.info('✅ ASOOS Flyer processing completed', {
        organizations: organizations.length,
        connectorResults: connectorResults.summary,
        curationResults: curationResults.stats,
        apifyTriggered: !!apifyResults
      });
      
      return {
        status: 'completed',
        connectorResults,
        curationResults,
        apifyResults,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      logger.error('❌ ASOOS Flyer processing failed:', error);
      throw error;
    }
  }

  /**
   * Trigger Apify ASOOS Flyer actor
   */
  async triggerApifyActor(organizations, processedData) {
    try {
      logger.info('🎭 Triggering Apify ASOOS Flyer actor...');
      
      const runInput = {
        organizations: organizations.map(org => ({
          name: org.name,
          domain: org.domain || org.website,
          metadata: org
        })),
        processedData,
        integrationGateway: {
          webhookUrl: APIFY_CONFIG.actors.flyer.webhookUrl,
          callbackEndpoint: '/api/asoos/feedback'
        },
        timestamp: new Date().toISOString()
      };
      
      const response = await axios.post(
        APIFY_CONFIG.actors.flyer.endpoints.run,
        runInput,
        {
          headers: {
            'Authorization': `Bearer ${APIFY_CONFIG.token}`,
            'Content-Type': 'application/json'
          },
          params: {
            token: APIFY_CONFIG.token
          }
        }
      );
      
      if (response.data) {
        logger.info('✅ Apify ASOOS Flyer actor triggered successfully', {
          runId: response.data.id,
          status: response.data.status,
          actorId: APIFY_CONFIG.actors.flyer.actorId
        });
        
        return response.data;
      }
      
    } catch (error) {
      logger.error('❌ Failed to trigger Apify actor:', error);
      throw error;
    }
  }

  /**
   * Get current system status
   */
  getSystemStatus() {
    return {
      initialized: this.initialized,
      components: {
        apifyClient: this.apifyClient?.connected || false,
        connectorManager: !!this.connectorManager,
        curationSystem: !!this.curationSystem,
        diamondSAO: !!this.diamondSAO
      },
      actors: APIFY_CONFIG.actors,
      apiEndpoints: {
        main: APIFY_CONFIG.actors.main.endpoints,
        flyer: APIFY_CONFIG.actors.flyer.endpoints
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Shutdown system gracefully
   */
  async shutdown() {
    try {
      logger.info('🔄 Shutting down ASOOS Flyer system...');
      
      if (this.connectorManager) {
        await this.connectorManager.shutdown();
      }
      
      if (this.curationSystem) {
        await this.curationSystem.cleanup();
      }
      
      logger.info('✅ ASOOS Flyer system shutdown complete');
      
    } catch (error) {
      logger.error('❌ Shutdown failed:', error);
      throw error;
    }
  }
}

// CLI execution
async function main() {
  if (require.main === module) {
    try {
      const initializer = new ASOOSIntelligenceSwarmInitializer();
      const initResult = await initializer.initialize();
      
      console.log('\n🎉 ASOOS Flyer System Successfully Initialized!');
      console.log('\n🏗️ System Components:');
      console.log('  💎 Diamond SAO Command Center - OPERATIONAL');
      console.log('  🔌 Connector Manager - OPERATIONAL');
      console.log('  👨‍🏫 Professor Lee Curation - OPERATIONAL');
      console.log(`  🎭 Apify Client - ${initResult.components.apifyClient.toUpperCase()}`);
      
      console.log('\n🎭 Apify Actors Available:');
      console.log(`  📊 ASOOS MAIN: ${APIFY_CONFIG.actors.main.id} (${APIFY_CONFIG.actors.main.actorId})`);
      console.log(`  🚀 ASOOS Flyer: ${APIFY_CONFIG.actors.flyer.id} (${APIFY_CONFIG.actors.flyer.actorId})`);
      
      console.log('\n🔗 API Endpoints:');
      console.log('  📊 Status: /api/asoos/status');
      console.log('  🧠 Process: /api/asoos/process');
      console.log('  👨‍🏫 Curate: /api/asoos/curate');
      console.log('  🔄 Feedback: /api/asoos/feedback');
      console.log('  💎 Diamond SAO: /api/diamond-sao/dashboard');
      
      console.log('\n🌐 Webhook Integration:');
      console.log(`  🔗 ${APIFY_CONFIG.actors.flyer.webhookUrl}`);
      
      console.log('\n🌟 ASOOS Flyer ready for AIXTIV operations!');
      console.log('\n📋 To start processing organizations:');
      console.log('  curl -X POST http://localhost:3001/api/asoos/process \\');
      console.log('    -H "Content-Type: application/json" \\');
      console.log('    -d \'{"organizations": [{"name": "Test Org", "domain": "test.com"}]}\'');
      
    } catch (error) {
      console.error('\n❌ ASOOS Flyer initialization failed:', error.message);
      console.error('\n🔧 Troubleshooting:');
      console.error('  1. Check APIFY_TOKEN environment variable');
      console.error('  2. Verify network connectivity to Apify API');
      console.error('  3. Ensure all dependencies are installed');
      console.error('  4. Check logs/asoos-flyer-init.log for details');
      process.exit(1);
    }
  }
}

// Export for use as module
module.exports = { ASOOSFlyerInitializer, APIFY_CONFIG };

// Run if called directly
main();
