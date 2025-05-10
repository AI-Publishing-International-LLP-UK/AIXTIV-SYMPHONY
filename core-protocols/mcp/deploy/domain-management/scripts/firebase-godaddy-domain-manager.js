const admin = require('firebase-admin');
const axios = require('axios');
const firebaseDomainService = require('./firebase-domain-service');
const godaddyService = require('./godaddy-service');
const { selectSiteForDomain } = require('./site-selector');
const { optimizeSEO } = require('./seo-service');
const fs = require('fs').promises;
const path = require('path');

// Load configuration files
const firebaseConfig = require('../config/firebase-projects.json');
const siteMappings = require('../config/site-mappings.json');
const characterMappings = require('../config/domain-character-mappings.json');
const godaddyConfig = require('../config/godaddy-api.json');

// Constants for batch processing
const BATCH_SIZE = 10; // Process 10 domains at a time
const RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 5000; // 5 seconds

class DomainManager {
  constructor() {
    this.initializeServices();
    this.projectId = process.env.FIREBASE_PROJECT_ID || 'api-for-warp-drive';
    this.reportDirectory = process.env.REPORT_DIRECTORY || './reports';
    this.domainStatusCache = new Map();
  }

  async initializeServices() {
    try {
      // Initialize Firebase Admin if not already initialized
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: this.projectId
        });
      }
      
      // Create reports directory if it doesn't exist
      await fs.mkdir(this.reportDirectory, { recursive: true });
      
      console.log(`Domain Manager initialized for project: ${this.projectId}`);
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      throw error;
    }
  }

  async addDomainToFirebase(domain, siteId, retryCount = 0) {
    try {
      console.log(`Adding domain ${domain} to Firebase site ${siteId}...`);
      const result = await firebaseDomainService.addDomain(domain, siteId);
      console.log(`Successfully added domain ${domain} to Firebase`);
      
      // Cache the DNS records for later verification
      this.domainStatusCache.set(domain, {
        dnsRecords: result.dnsRecords,
        siteId: siteId,
        status: 'pending_dns'
      });
      
      return result;
    } catch (error) {
      if (retryCount < RETRY_ATTEMPTS) {
        console.warn(`Retrying addDomainToFirebase for ${domain} (attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return this.addDomainToFirebase(domain, siteId, retryCount + 1);
      }
      console.error(`Failed to add domain ${domain} to Firebase:`, error.message);
      throw error;
    }
  }

  async configureGoDaddyDNS(domain, retryCount = 0) {
    try {
      const cachedStatus = this.domainStatusCache.get(domain);
      if (!cachedStatus || !cachedStatus.dnsRecords) {
        throw new Error(`No DNS records found for domain ${domain}`);
      }
      
      console.log(`Configuring GoDaddy DNS for ${domain}...`);
      
      // Format DNS records for GoDaddy API
      const dnsRecords = cachedStatus.dnsRecords.map(record => {
        return {
          type: record.type,
          name: record.name === '@' ? '@' : record.name.replace(`.${domain}`, ''),
          data: record.rrdata,
          ttl: 3600
        };
      });
      
      await godaddyService.updateDNSRecords(domain, dnsRecords);
      console.log(`Successfully configured DNS for ${domain}`);
      
      // Update cache
      this.domainStatusCache.set(domain, {
        ...cachedStatus,
        status: 'dns_configured'
      });
      
      return true;
    } catch (error) {
      if (retryCount < RETRY_ATTEMPTS) {
        console.warn(`Retrying configureGoDaddyDNS for ${domain} (attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return this.configureGoDaddyDNS(domain, retryCount + 1);
      }
      console.error(`Failed to configure DNS for ${domain}:`, error.message);
      throw error;
    }
  }
  
  async verifyDomainSetup(domain, siteId, retryCount = 0) {
    try {
      console.log(`Verifying domain setup for ${domain}...`);
      
      // Check domain status in Firebase
      const status = await firebaseDomainService.getDomainStatus(domain, siteId);
      
      if (status.status === 'DOMAIN_VERIFICATION_REQUIRED') {
        // Trigger verification if needed
        await firebaseDomainService.verifyDomain(domain, siteId);
        
        // Wait a bit for verification
        await new Promise(resolve => setTimeout(resolve, 10000));
        
        // Check again
        return this.verifyDomainSetup(domain, siteId, retryCount);
      }
      
      if (status.status === 'DOMAIN_ACTIVE') {
        console.log(`Domain ${domain} is active and verified`);
        this.domainStatusCache.set(domain, {
          ...this.domainStatusCache.get(domain),
          status: 'active'
        });
        return true;
      }
      
      if (retryCount < 5) {  // More retries for verification
        console.log(`Domain ${domain} status: ${status.status}. Waiting for activation...`);
        await new Promise(resolve => setTimeout(resolve, 30000));  // 30 seconds between checks
        return this.verifyDomainSetup(domain, siteId, retryCount + 1);
      }
      
      throw new Error(`Domain failed to activate. Status: ${status.status}`);
    } catch (error) {
      if (retryCount < RETRY_ATTEMPTS) {
        console.warn(`Retrying verifyDomainSetup for ${domain} (attempt ${retryCount + 1})`);
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
        return this.verifyDomainSetup(domain, siteId, retryCount + 1);
      }
      console.error(`Failed to verify domain ${domain}:`, error.message);
      throw error;
    }
  }

  async processDomainBatch(domains) {
    if (!Array.isArray(domains) || domains.length === 0) {
      throw new Error('No domains provided for processing');
    }
    
    console.log(`Processing batch of ${domains.length} domains...`);
    
    const results = {
      successful: [],
      failed: [],
      pending: [],
    };
    
    // Process domains in smaller batches to avoid overwhelming APIs
    const batches = [];
    for (let i = 0; i < domains.length; i += BATCH_SIZE) {
      batches.push(domains.slice(i, i + BATCH_SIZE));
    }
    
    console.log(`Split into ${batches.length} batches of up to ${BATCH_SIZE} domains each`);
    
    let batchNumber = 1;
    for (const batch of batches) {
      console.log(`Processing batch ${batchNumber} of ${batches.length}...`);
      
      // Process each domain in parallel within the batch
      const batchPromises = batch.map(async (domain) => {
        try {
          console.log(`Processing domain: ${domain}`);
          
          // Step 1: Select appropriate Firebase site
          const siteId = await selectSiteForDomain(domain, siteMappings);
          
          // Step 2: Add domain to Firebase
          await this.addDomainToFirebase(domain, siteId);
          
          // Step 3: Configure DNS in GoDaddy
          await this.configureGoDaddyDNS(domain);
          
          // Step 4: Verify domain setup 
          const isVerified = await this.verifyDomainSetup(domain, siteId);
          
          if (isVerified) {
            // Step 5: Optimize SEO if domain is active
            await optimizeSEO(domain, siteId);
            results.successful.push(domain);
          } else {
            results.pending.push({ domain, status: 'verification_pending' });
          }
          
        } catch (error) {
          console.error(`Failed to process domain ${domain}:`, error.message);
          results.failed.push({ 
            domain, 
            error: error.message,
            stage: this.domainStatusCache.get(domain)?.status || 'unknown'
          });
        }
      });
      
      // Wait for batch to complete before moving to next batch
      await Promise.all(batchPromises);
      
      // Generate interim report after each batch
      await this.generateReport(results, `batch_${batchNumber}_of_${batches.length}`);
      
      batchNumber++;
      
      // Wait between batches to avoid rate limiting
      if (batchNumber <= batches.length) {
        console.log('Waiting 30 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
    
    // Generate final report
    await this.generateReport(results, 'final');
    
    return results;
  }
  
  async generateReport(results, suffix = '') {
    try {
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const filename = `domain_processing_${timestamp}_${suffix}.json`;
      const filePath = path.join(this.reportDirectory, filename);
      
      const report = {
        timestamp: new Date().toISOString(),
        projectId: this.projectId,
        summary: {
          total: results.successful.length + results.failed.length + results.pending.length,
          successful: results.successful.length,
          failed: results.failed.length,
          pending: results.pending.length,
        },
        details: results
      };
      
      await fs.writeFile(filePath, JSON.stringify(report, null, 2));
      console.log(`Report generated: ${filePath}`);
      
      return filePath;
    } catch (error) {
      console.error('Failed to generate report:', error);
      return null;
    }
  }
  
  async cleanupFailedDomains(failedDomains) {
    console.log(`Cleaning up ${failedDomains.length} failed domains...`);
    
    for (const { domain } of failedDomains) {
      try {
        const cachedStatus = this.domainStatusCache.get(domain);
        if (cachedStatus && cachedStatus.siteId) {
          await firebaseDomainService.deleteDomain(domain, cachedStatus.siteId);
          console.log(`Successfully removed domain ${domain} from Firebase`);
        }
      } catch (error) {
        console.error(`Failed to clean up domain ${domain}:`, error.message);
      }
    }
  }
}

module.exports = new DomainManager();
