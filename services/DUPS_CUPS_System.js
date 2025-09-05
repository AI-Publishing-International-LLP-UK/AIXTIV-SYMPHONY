const express = require('express');
const { MultiTenantPatentSystem } = require('./MultiTenantPatentSystem');
const crypto = require('crypto');

class DUPS_CUPS_System {
  constructor() {
    this.patentSystem = new MultiTenantPatentSystem();
    this.targetCompanies = 45;
    this.onboardedCompanies = new Map();
    this.waitingList = [];
    
    // DUPS Configuration
    this.dupsConfig = {
      name: 'Dynamic Useful Patent Storage',
      features: ['Real-time patent search', 'AI analysis', 'Prior art detection', 'Filing assistance'],
      pricing: {
        starter: 2500, // per month
        professional: 7500,
        enterprise: 25000
      }
    };
    
    // CUPS Configuration  
    this.cupsConfig = {
      name: 'Continuously Updated Patent System',
      features: ['Daily USPTO updates', 'Auto-retraining', 'Patent trend analysis', 'Portfolio optimization'],
      updateFrequency: 'daily',
      mlRetrainingSchedule: 'weekly'
    };

    console.log('🏢 DUPS & CUPS System initialized for 45 companies');
  }

  // Company Onboarding for First 45
  async onboardCompany(companyData) {
    if (this.onboardedCompanies.size >= this.targetCompanies) {
      this.waitingList.push(companyData);
      return {
        success: false,
        message: `Waiting list position: ${this.waitingList.length}`,
        status: 'waitlisted'
      };
    }

    const companyId = this.generateCompanyId(companyData.name);
    
    // Create company profile
    const company = {
      id: companyId,
      name: companyData.name,
      industry: companyData.industry,
      size: companyData.size || 'medium',
      plan: companyData.plan || 'professional',
      mcpUrl: `https://mcp.${this.sanitizeName(companyData.name)}.2100.cool`,
      
      // DUPS Configuration
      dups: {
        storageQuota: this.calculateStorageQuota(companyData.plan),
        searchQuota: this.calculateSearchQuota(companyData.plan),
        drBurbyCount: this.calculateDrBurbyCount(companyData.plan),
        features: this.getFeatures(companyData.plan)
      },
      
      // CUPS Configuration
      cups: {
        updateSchedule: 'daily',
        retrainingEnabled: true,
        alertsEnabled: true,
        portfolioTracking: true
      },
      
      // Onboarding Status
      onboardingStatus: 'initializing',
      onboardedAt: new Date(),
      position: this.onboardedCompanies.size + 1
    };

    this.onboardedCompanies.set(companyId, company);
    
    console.log(`🎯 Onboarding company ${this.onboardedCompanies.size}/45: ${companyData.name}`);
    
    // Initialize tenant in patent system
    await this.initializeCompanyTenant(company);
    
    return {
      success: true,
      company,
      message: `Welcome to DUPS & CUPS! You are company ${company.position}/45`,
      nextSteps: [
        'Access your patent portal',
        'Upload existing patent portfolio',
        'Configure Dr. Burby specialists',
        'Start patent searches'
      ]
    };
  }

  async initializeCompanyTenant(company) {
    try {
      // Create tenant with DUPS/CUPS configuration
      const tenantConfig = {
        drBurbyCount: company.dups.drBurbyCount,
        features: company.dups.features,
        storageGB: company.dups.storageQuota,
        searchRequests: company.dups.searchQuota,
        filingRequests: this.calculateFilingQuota(company.plan)
      };

      const tenant = await this.patentSystem.createTenant(company.name, tenantConfig);
      
      company.tenantId = tenant.id;
      company.onboardingStatus = 'active';
      
      // Set up CUPS continuous updates
      await this.setupCUPSUpdates(company);
      
      console.log(`✅ Company ${company.name} fully initialized`);
      
    } catch (error) {
      company.onboardingStatus = 'error';
      company.error = error.message;
      console.error(`❌ Failed to initialize ${company.name}:`, error);
    }
  }

  async setupCUPSUpdates(company) {
    // Schedule daily patent database updates
    const updateJob = {
      companyId: company.id,
      schedule: company.cups.updateSchedule,
      actions: [
        'fetch_new_patents',
        'update_vectors', 
        'retrain_models',
        'generate_alerts',
        'update_portfolio_analysis'
      ],
      nextRun: this.calculateNextUpdateTime()
    };
    
    console.log(`🔄 CUPS updates scheduled for ${company.name}`);
    return updateJob;
  }

  // Pricing & Quota Calculations
  calculateStorageQuota(plan) {
    const quotas = {
      starter: 50,    // 50GB
      professional: 200, // 200GB  
      enterprise: 1000   // 1TB
    };
    return quotas[plan] || quotas.professional;
  }

  calculateSearchQuota(plan) {
    const quotas = {
      starter: 1000,     // 1K searches/month
      professional: 10000,  // 10K searches/month
      enterprise: 100000    // 100K searches/month
    };
    return quotas[plan] || quotas.professional;
  }

  calculateDrBurbyCount(plan) {
    const counts = {
      starter: 3,        // 3 Dr. Burby instances
      professional: 10,  // 10 Dr. Burby instances
      enterprise: 25     // 25 Dr. Burby instances
    };
    return counts[plan] || counts.professional;
  }

  calculateFilingQuota(plan) {
    const quotas = {
      starter: 10,       // 10 filings/month
      professional: 50,  // 50 filings/month
      enterprise: 200    // 200 filings/month
    };
    return quotas[plan] || quotas.professional;
  }

  getFeatures(plan) {
    const baseFeatures = {
      patentSearch: true,
      basicAnalysis: true,
      priorArtSearch: true
    };

    const professionalFeatures = {
      ...baseFeatures,
      advancedAnalysis: true,
      portfolioManagement: true,
      patentFiling: true,
      sequenceValidation: true
    };

    const enterpriseFeatures = {
      ...professionalFeatures,
      customDrBurby: true,
      prioritySupport: true,
      apiAccess: true,
      bulkOperations: true,
      advancedReporting: true
    };

    switch (plan) {
      case 'starter': return baseFeatures;
      case 'professional': return professionalFeatures;
      case 'enterprise': return enterpriseFeatures;
      default: return professionalFeatures;
    }
  }

  // Company Management
  getCompanyStatus() {
    return {
      total: this.onboardedCompanies.size,
      target: this.targetCompanies,
      remaining: this.targetCompanies - this.onboardedCompanies.size,
      waitingList: this.waitingList.length,
      companies: Array.from(this.onboardedCompanies.values()).map(company => ({
        name: company.name,
        position: company.position,
        plan: company.plan,
        status: company.onboardingStatus,
        mcpUrl: company.mcpUrl
      }))
    };
  }

  async searchPatents(companyId, query, options = {}) {
    const company = this.onboardedCompanies.get(companyId);
    if (!company) throw new Error('Company not found');
    
    // Check quotas
    if (company.usage && company.usage.searches >= company.dups.searchQuota) {
      throw new Error('Search quota exceeded for this month');
    }

    // Perform search via patent system
    const results = await this.patentSystem.searchPatents(company.tenantId, query, options);
    
    // Track usage
    if (!company.usage) company.usage = { searches: 0, filings: 0 };
    company.usage.searches++;
    
    return {
      ...results,
      company: company.name,
      quotaUsed: company.usage.searches,
      quotaRemaining: company.dups.searchQuota - company.usage.searches
    };
  }

  // MCP Integration for each company
  generateMCPEndpoints(company) {
    const baseUrl = company.mcpUrl;
    
    return {
      patentSearch: `${baseUrl}/api/patents/search`,
      patentFiling: `${baseUrl}/api/filing/create`,
      priorArt: `${baseUrl}/api/filing/prior-art`,
      drBurbyAnalysis: `${baseUrl}/api/drburby/analyze`,
      portfolioManagement: `${baseUrl}/api/portfolio`,
      analytics: `${baseUrl}/api/analytics`,
      
      // DUPS specific
      storageInfo: `${baseUrl}/api/dups/storage`,
      quotaStatus: `${baseUrl}/api/dups/quota`,
      
      // CUPS specific  
      updateSchedule: `${baseUrl}/api/cups/schedule`,
      retraining: `${baseUrl}/api/cups/retrain`
    };
  }

  // Utility Functions
  generateCompanyId(companyName) {
    return crypto.createHash('md5')
      .update(`${companyName}-${Date.now()}`)
      .digest('hex')
      .substring(0, 12);
  }

  sanitizeName(name) {
    return name.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  calculateNextUpdateTime() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(2, 0, 0, 0); // 2 AM daily updates
    return tomorrow;
  }

  // First 45 Companies Recruitment
  async recruitInitialCompanies() {
    const targetCompanies = [
      // Tech Companies
      { name: 'TechStart Innovations', industry: 'software', size: 'medium', plan: 'professional' },
      { name: 'AI Dynamics Corp', industry: 'artificial-intelligence', size: 'large', plan: 'enterprise' },
      { name: 'BioTech Solutions', industry: 'biotechnology', size: 'medium', plan: 'professional' },
      { name: 'MedDevice Pro', industry: 'medical-devices', size: 'small', plan: 'starter' },
      { name: 'AutoTech Innovations', industry: 'automotive', size: 'large', plan: 'enterprise' },
      
      // Add 40 more companies...
    ];

    console.log('🎯 Recruiting initial 45 companies...');
    
    for (const companyData of targetCompanies.slice(0, 5)) { // Demo with first 5
      try {
        const result = await this.onboardCompany(companyData);
        console.log(`✅ ${companyData.name}: ${result.message}`);
      } catch (error) {
        console.error(`❌ Failed to onboard ${companyData.name}:`, error);
      }
    }
  }
}

// Express Routes for DUPS & CUPS
function createDUPSCUPSRoutes(dupsSystem) {
  const router = express.Router();

  // Company onboarding
  router.post('/onboard', async (req, res) => {
    try {
      const result = await dupsSystem.onboardCompany(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  // Company status
  router.get('/status', (req, res) => {
    res.json(dupsSystem.getCompanyStatus());
  });

  // Patent search for company
  router.get('/search/:companyId', async (req, res) => {
    try {
      const { companyId } = req.params;
      const { q: query, ...options } = req.query;
      
      const results = await dupsSystem.searchPatents(companyId, query, options);
      res.json(results);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  // MCP endpoints for company
  router.get('/mcp/:companyId', (req, res) => {
    const company = dupsSystem.onboardedCompanies.get(req.params.companyId);
    if (!company) {
      return res.status(404).json({ error: 'Company not found' });
    }
    
    const endpoints = dupsSystem.generateMCPEndpoints(company);
    res.json({ company: company.name, endpoints });
  });

  return router;
}

module.exports = { DUPS_CUPS_System, createDUPSCUPSRoutes };
