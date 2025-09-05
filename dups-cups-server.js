const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const { DUPS_CUPS_System, createDUPSCUPSRoutes } = require('./services/DUPS_CUPS_System');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize DUPS & CUPS System
const dupsSystem = new DUPS_CUPS_System();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// MongoDB connection (optional for now)
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('📊 MongoDB connected'))
  .catch(err => console.warn('⚠️ MongoDB connection failed:', err.message));
}

// DUPS & CUPS Routes
app.use('/api/dups-cups', createDUPSCUPSRoutes(dupsSystem));

// Root endpoint - DUPS & CUPS Landing Page
app.get('/', (req, res) => {
  res.json({
    service: 'DUPS & CUPS Patent System',
    tagline: 'Dynamic Useful Patent Storage + Continuously Updated Patent System',
    version: '1.0.0',
    region: process.env.CLOUD_ML_REGION || 'us-central1',
    
    // System Status
    status: dupsSystem.getCompanyStatus(),
    
    // Service Descriptions
    services: {
      DUPS: {
        name: 'Dynamic Useful Patent Storage',
        description: 'Real-time patent search, AI analysis, and intelligent storage',
        features: dupsSystem.dupsConfig.features,
        pricing: dupsSystem.dupsConfig.pricing
      },
      CUPS: {
        name: 'Continuously Updated Patent System', 
        description: 'Daily USPTO updates with auto-retraining and trend analysis',
        features: dupsSystem.cupsConfig.features,
        updateFrequency: dupsSystem.cupsConfig.updateFrequency
      }
    },
    
    // First 45 Companies Program
    program: {
      name: 'First 45 Companies Program',
      slotsRemaining: 45 - dupsSystem.onboardedCompanies.size,
      benefits: [
        'Premium Dr. Burby AI patent analysts',
        'Custom MCP domain: mcp.company-name.2100.cool',
        'Priority access to new features',
        'Dedicated support',
        'Beta pricing (50% off standard rates)'
      ]
    },
    
    // Available Endpoints
    endpoints: {
      onboarding: '/api/dups-cups/onboard',
      status: '/api/dups-cups/status', 
      search: '/api/dups-cups/search/:companyId',
      mcp: '/api/dups-cups/mcp/:companyId',
      health: '/health'
    }
  });
});

// Company Onboarding Endpoint
app.post('/onboard', async (req, res) => {
  try {
    const companyData = req.body;
    
    // Validate required fields
    if (!companyData.name || !companyData.industry) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['name', 'industry'],
        optional: ['size', 'plan', 'description']
      });
    }

    const result = await dupsSystem.onboardCompany(companyData);
    
    if (result.success) {
      res.status(201).json({
        ...result,
        welcome: {
          mcpUrl: result.company.mcpUrl,
          drBurbyCount: result.company.dups.drBurbyCount,
          searchQuota: result.company.dups.searchQuota,
          storageQuota: result.company.dups.storageQuota
        }
      });
    } else {
      res.status(202).json(result); // 202 Accepted but waitlisted
    }

  } catch (error) {
    console.error('Onboarding error:', error);
    res.status(500).json({
      error: 'Onboarding failed',
      message: error.message
    });
  }
});

// Quick Demo: Onboard Sample Companies
app.post('/demo/recruit', async (req, res) => {
  try {
    await dupsSystem.recruitInitialCompanies();
    
    res.json({
      success: true,
      message: 'Demo companies recruited',
      status: dupsSystem.getCompanyStatus()
    });
    
  } catch (error) {
    res.status(500).json({
      error: 'Demo recruitment failed',
      message: error.message
    });
  }
});

// Health Check
app.get('/health', (req, res) => {
  const systemMetrics = dupsSystem.patentSystem ? dupsSystem.patentSystem.getSystemMetrics() : {};
  
  res.json({
    status: 'healthy',
    service: 'DUPS & CUPS Patent System',
    timestamp: new Date().toISOString(),
    region: process.env.CLOUD_ML_REGION || 'us-central1',
    
    system: {
      onboardedCompanies: dupsSystem.onboardedCompanies.size,
      targetCompanies: dupsSystem.targetCompanies,
      waitingList: dupsSystem.waitingList.length,
      ...systemMetrics
    },
    
    services: {
      mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      pinecone: process.env.PINECONE_API_KEY ? 'configured' : 'not configured',
      openai: process.env.OPENAI_API_KEY ? 'configured' : 'not configured'
    }
  });
});

// Company Portal (MCP Integration)
app.get('/portal/:companyName', async (req, res) => {
  const { companyName } = req.params;
  const company = await dupsSystem.getTenant(companyName);
  
  if (!company) {
    return res.status(404).json({
      error: 'Company not found',
      message: 'Please onboard first or check company name'
    });
  }

  const endpoints = dupsSystem.generateMCPEndpoints(company);
  
  res.json({
    company: company.name,
    welcome: `Welcome to your DUPS & CUPS patent portal!`,
    mcpUrl: company.mcpUrl,
    status: company.onboardingStatus,
    
    // Company Configuration
    configuration: {
      plan: company.plan,
      drBurbyInstances: company.dups.drBurbyCount,
      features: Object.keys(company.dups.features).filter(key => company.dups.features[key])
    },
    
    // Usage & Quotas
    quotas: {
      searches: {
        used: company.usage?.searches || 0,
        limit: company.dups.searchQuota,
        remaining: company.dups.searchQuota - (company.usage?.searches || 0)
      },
      storage: {
        limit: company.dups.storageQuota + 'GB'
      }
    },
    
    // Available Endpoints
    endpoints,
    
    // Getting Started
    gettingStarted: [
      'Use patent search API to find relevant patents',
      'Configure your Dr. Burby specialists for your industry',
      'Upload your existing patent portfolio',
      'Set up automated alerts for competitor patents',
      'Access daily patent updates via CUPS'
    ]
  });
});

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    service: 'DUPS & CUPS Patent System',
    availableEndpoints: [
      'GET /',
      'POST /onboard',
      'GET /api/dups-cups/status',
      'GET /portal/:companyName',
      'GET /health'
    ],
    documentation: 'Visit / for full API documentation'
  });
});

// Error Handler
app.use((error, req, res, next) => {
  console.error('DUPS & CUPS error:', error);
  
  res.status(500).json({
    error: 'Internal server error',
    service: 'DUPS & CUPS Patent System',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message
  });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 DUPS & CUPS Patent System started');
  console.log(`🌍 Running on port ${PORT} in ${process.env.CLOUD_ML_REGION || 'us-central1'}`);
  console.log(`🏢 Ready to onboard ${dupsSystem.targetCompanies} companies`);
  console.log(`🔗 Onboarding: http://0.0.0.0:${PORT}/onboard`);
  console.log(`📊 Status: http://0.0.0.0:${PORT}/api/dups-cups/status`);
  console.log(`💚 Health: http://0.0.0.0:${PORT}/health`);
  
  console.log('\n🎯 DUPS: Dynamic Useful Patent Storage');
  console.log('   • Real-time patent search & AI analysis');
  console.log('   • Multi-tenant architecture');  
  console.log('   • Specialized Dr. Burby instances');
  
  console.log('\n🔄 CUPS: Continuously Updated Patent System');
  console.log('   • Daily USPTO database updates');
  console.log('   • Auto-retraining ML models');
  console.log('   • Patent trend analysis');
  
  console.log('\n🏆 First 45 Companies Program Active!');
  console.log('   • Premium pricing & features');
  console.log('   • Custom MCP domains');
  console.log('   • Priority support');
});

module.exports = app;
