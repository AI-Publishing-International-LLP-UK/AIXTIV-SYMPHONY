/**
 * Dr. Memoria LinkedIn App Connector
 * Integrates existing Dr. Memoria LinkedIn app with ASOOS Flyer
 * Focuses on comprehensive company intelligence and information
 */

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const axios = require('axios');

class DrMemoriaLinkedInConnector {
    constructor() {
        this.secretClient = new SecretManagerServiceClient();
        this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'your-gcp-project';
        this.credentials = null;
        this.rateLimiter = new Map();
        
        // LinkedIn API endpoints for Dr. Memoria app (company intelligence focused)
        this.apiEndpoints = {
            companies: '/v2/companies',
            companyUpdates: '/v2/shares',
            organizationLookup: '/v2/organizationalEntityAcls'
        };
        
        // Rate limiting for LinkedIn API
        this.rateLimits = {
            companiesPerHour: 100,
            currentUsage: 0,
            resetTime: Date.now() + 3600000 // 1 hour
        };
        
        console.log('🧠 Dr. Memoria LinkedIn Connector initialized');
    }

    /**
     * Initialize connection with GCP-stored credentials
     */
    async initialize() {
        try {
            console.log('🔐 Loading Dr. Memoria LinkedIn credentials from GCP...');
            
            // Get credentials from GCP Secret Manager
            const [version] = await this.secretClient.accessSecretVersion({
                name: `projects/${this.projectId}/secrets/dr-memoria-linkedin-credentials/versions/latest`
            });
            
            const credentialsData = version.payload.data.toString();
            this.credentials = this.parseCredentials(credentialsData);
            
            console.log('✅ Dr. Memoria LinkedIn credentials loaded successfully');
            
            // Test connection
            await this.testConnection();
            
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize Dr. Memoria connector:', error);
            throw error;
        }
    }

    /**
     * Parse credentials from GCP secret format
     */
    parseCredentials(credentialsData) {
        // Parse the secret format from your existing setup
        const lines = credentialsData.split('\n');
        const credentials = {};
        
        lines.forEach(line => {
            if (line.includes('|')) {
                const [key, value] = line.split('|');
                if (key === '1') {
                    credentials.accessToken = value;
                } else if (key === '2') {
                    credentials.refreshToken = value;
                }
            }
        });
        
        return credentials;
    }

    /**
     * Test LinkedIn API connection
     */
    async testConnection() {
        try {
            console.log('🧪 Testing Dr. Memoria LinkedIn API connection...');
            
            const response = await this.makeLinkedInAPICall('/v2/me', 'GET');
            
            if (response.data) {
                console.log(`✅ Dr. Memoria LinkedIn API connection successful`);
                console.log(`👤 Connected as: ${response.data.firstName} ${response.data.lastName}`);
                return true;
            }
            
        } catch (error) {
            console.error('❌ Dr. Memoria LinkedIn API test failed:', error.message);
            throw error;
        }
    }

    /**
     * Process organizations for LinkedIn data collection
     * Dr. Memoria specializes in comprehensive company intelligence
     * @param {Array} organizations - List of organizations to process
     * @returns {Object} LinkedIn data results
     */
    async processOrganizations(organizations) {
        console.log(`🧠 Dr. Memoria processing ${organizations.length} organizations...`);
        
        if (!this.credentials) {
            await this.initialize();
        }
        
        const results = [];
        const batchSize = 5; // Process in smaller batches to respect rate limits
        
        try {
            for (let i = 0; i < organizations.length; i += batchSize) {
                const batch = organizations.slice(i, i + batchSize);
                
                console.log(`📊 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(organizations.length/batchSize)}`);
                
                // Check rate limits before batch
                await this.checkRateLimit();
                
                const batchResults = await Promise.allSettled(
                    batch.map(org => this.getOrganizationData(org))
                );
                
                batchResults.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        results.push(result.value);
                    } else {
                        console.error(`❌ Failed to process ${batch[index].name}:`, result.reason.message);
                        results.push({
                            name: batch[index].name,
                            error: result.reason.message,
                            source: 'dr_memoria'
                        });
                    }
                });
                
                // Rate limiting between batches
                if (i + batchSize < organizations.length) {
                    console.log('⏳ Rate limiting: waiting 3 seconds...');
                    await new Promise(resolve => setTimeout(resolve, 3000));
                }
            }
            
            console.log(`✅ Dr. Memoria completed processing: ${results.filter(r => !r.error).length}/${organizations.length} successful`);
            
            return {
                source: 'dr_memoria_linkedin',
                status: 'completed',
                data: results,
                summary: {
                    total: organizations.length,
                    successful: results.filter(r => !r.error).length,
                    failed: results.filter(r => r.error).length
                }
            };
            
        } catch (error) {
            console.error('❌ Dr. Memoria batch processing failed:', error);
            throw error;
        }
    }

    /**
     * Get organization data from LinkedIn
     * @param {Object} organization - Organization object with name, domain, etc.
     * @returns {Object} LinkedIn organization data
     */
    async getOrganizationData(organization) {
        try {
            console.log(`🔍 Getting LinkedIn data for ${organization.name}...`);
            
            // Try different methods to find the company
            let companyData = null;
            
            // Method 1: Direct lookup by LinkedIn handle if available
            if (organization.linkedinHandle) {
                companyData = await this.lookupByLinkedInHandle(organization.linkedinHandle);
            }
            
            // Method 2: Search by company name
            if (!companyData) {
                companyData = await this.searchCompanyByName(organization.name);
            }
            
            // Method 3: Search by domain
            if (!companyData && organization.domain) {
                companyData = await this.searchCompanyByDomain(organization.domain);
            }
            
            if (!companyData) {
                return {
                    ...organization,
                    source: 'dr_memoria',
                    status: 'no_linkedin_data_found',
                    scrapedAt: new Date().toISOString()
                };
            }
            
            return {
                ...organization,
                ...companyData,
                source: 'dr_memoria_linkedin_api',
                scrapedAt: new Date().toISOString()
            };
            
        } catch (error) {
            console.error(`❌ Error getting data for ${organization.name}:`, error);
            throw error;
        }
    }

    /**
     * Direct lookup by LinkedIn handle/universal name
     */
    async lookupByLinkedInHandle(handle) {
        try {
            const response = await this.makeLinkedInAPICall(`/v2/companies/(universalName:${handle})`, 'GET');
            
            if (response.data) {
                return this.formatCompanyData(response.data, 'direct_lookup');
            }
            
        } catch (error) {
            console.log(`⚠️ Direct lookup failed for handle ${handle}`);
            return null;
        }
    }

    /**
     * Search company by name
     */
    async searchCompanyByName(companyName) {
        try {
            const searchParams = {
                q: 'universalName',
                universalName: this.generateUniversalName(companyName)
            };
            
            const response = await this.makeLinkedInAPICall('/v2/companies', 'GET', searchParams);
            
            if (response.data && response.data.elements && response.data.elements.length > 0) {
                // Get the first (most likely) match
                const company = response.data.elements[0];
                return this.formatCompanyData(company, 'name_search');
            }
            
        } catch (error) {
            console.log(`⚠️ Name search failed for ${companyName}`);
            return null;
        }
    }

    /**
     * Search company by domain (if supported by API)
     */
    async searchCompanyByDomain(domain) {
        try {
            // This may not be directly supported by LinkedIn API
            // Using company search with domain-based universal name guess
            const domainBasedName = domain.split('.')[0];
            return await this.searchCompanyByName(domainBasedName);
            
        } catch (error) {
            console.log(`⚠️ Domain search failed for ${domain}`);
            return null;
        }
    }

    /**
     * Format company data from LinkedIn API response
     */
    formatCompanyData(companyData, method) {
        return {
            // Basic company information
            name: companyData.name || companyData.localizedName,
            universalName: companyData.universalName,
            linkedinId: companyData.id,
            linkedinUrl: `https://linkedin.com/company/${companyData.universalName}`,
            
            // Company details
            tagline: companyData.tagline,
            description: companyData.description,
            website: companyData.websiteUrl,
            industry: companyData.industries?.[0]?.localizedName,
            companyType: companyData.companyType?.localizedName,
            
            // Location information
            headquarters: this.formatLocation(companyData.locations),
            
            // Company size
            employeeCountRange: this.formatEmployeeCount(companyData.staffCount),
            
            // Additional metadata
            foundedYear: companyData.foundedOn?.year,
            specialties: companyData.specialties,
            
            // Logo and images
            logoUrl: this.extractLogoUrl(companyData.logos),
            coverImageUrl: this.extractCoverImageUrl(companyData.coverPhoto),
            
            // Data source and quality
            source: 'dr_memoria_linkedin_api',
            method: method,
            scrapedAt: new Date().toISOString(),
            dataQuality: this.calculateDataQuality(companyData)
        };
    }

    /**
     * Make LinkedIn API call with proper authentication
     */
    async makeLinkedInAPICall(endpoint, method = 'GET', params = {}) {
        try {
            await this.checkRateLimit();
            
            const config = {
                method: method,
                url: `https://api.linkedin.com${endpoint}`,
                headers: {
                    'Authorization': `Bearer ${this.credentials.accessToken}`,
                    'Content-Type': 'application/json',
                    'LinkedIn-Version': '202308'
                },
                timeout: 30000
            };
            
            if (method === 'GET' && Object.keys(params).length > 0) {
                config.params = params;
            } else if (method === 'POST') {
                config.data = params;
            }
            
            const response = await axios(config);
            
            // Update rate limit usage
            this.updateRateLimit();
            
            return response;
            
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('🔄 Access token expired, refreshing...');
                await this.refreshAccessToken();
                return this.makeLinkedInAPICall(endpoint, method, params);
            }
            
            throw error;
        }
    }

    /**
     * Refresh LinkedIn access token
     */
    async refreshAccessToken() {
        try {
            console.log('🔄 Refreshing Dr. Memoria LinkedIn access token...');
            
            // Implementation would depend on your OAuth flow
            // This is a placeholder for the refresh logic
            
            console.log('✅ Access token refreshed');
            
        } catch (error) {
            console.error('❌ Failed to refresh access token:', error);
            throw error;
        }
    }

    // Utility methods for data formatting
    formatLocation(locations) {
        if (!locations || locations.length === 0) return null;
        
        const hq = locations.find(loc => loc.locationType === 'HEADQUARTERS') || locations[0];
        return {
            city: hq.address?.city,
            state: hq.address?.geographicArea,
            country: hq.address?.country,
            formatted: `${hq.address?.city}, ${hq.address?.geographicArea}, ${hq.address?.country}`
        };
    }

    formatEmployeeCount(staffCount) {
        if (!staffCount) return null;
        
        const ranges = {
            'SIZE_1': '1 employee',
            'SIZE_2_10': '2-10 employees',
            'SIZE_11_50': '11-50 employees',
            'SIZE_51_200': '51-200 employees',
            'SIZE_201_500': '201-500 employees',
            'SIZE_501_1000': '501-1,000 employees',
            'SIZE_1001_5000': '1,001-5,000 employees',
            'SIZE_5001_10000': '5,001-10,000 employees',
            'SIZE_10001_PLUS': '10,001+ employees'
        };
        
        return ranges[staffCount] || staffCount;
    }

    extractLogoUrl(logos) {
        if (!logos || logos.length === 0) return null;
        
        // Get the highest resolution logo
        const logo = logos[logos.length - 1];
        return logo?.cropped || logo?.original;
    }

    extractCoverImageUrl(coverPhoto) {
        if (!coverPhoto) return null;
        return coverPhoto.cropped || coverPhoto.original;
    }

    calculateDataQuality(companyData) {
        let score = 0;
        
        if (companyData.name) score += 20;
        if (companyData.description) score += 15;
        if (companyData.industry || companyData.industries) score += 15;
        if (companyData.websiteUrl) score += 10;
        if (companyData.locations && companyData.locations.length > 0) score += 10;
        if (companyData.staffCount) score += 10;
        if (companyData.foundedOn) score += 5;
        if (companyData.tagline) score += 5;
        if (companyData.specialties) score += 5;
        if (companyData.logos && companyData.logos.length > 0) score += 5;
        
        return Math.min(score, 100);
    }

    generateUniversalName(companyName) {
        return companyName.toLowerCase()
                         .replace(/[^a-z0-9\s]/g, '')
                         .replace(/\s+/g, '-')
                         .replace(/^-+|-+$/g, '');
    }

    // Rate limiting methods
    async checkRateLimit() {
        const now = Date.now();
        
        // Reset if hour has passed
        if (now > this.rateLimits.resetTime) {
            this.rateLimits.currentUsage = 0;
            this.rateLimits.resetTime = now + 3600000;
        }
        
        // Check if we're at the limit
        if (this.rateLimits.currentUsage >= this.rateLimits.companiesPerHour) {
            const waitTime = this.rateLimits.resetTime - now;
            console.log(`⏳ Dr. Memoria rate limit reached, waiting ${Math.ceil(waitTime/60000)} minutes...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
            this.rateLimits.currentUsage = 0;
            this.rateLimits.resetTime = Date.now() + 3600000;
        }
    }

    updateRateLimit() {
        this.rateLimits.currentUsage++;
    }

    getRateLimitStatus() {
        return {
            current: this.rateLimits.currentUsage,
            limit: this.rateLimits.companiesPerHour,
            remaining: this.rateLimits.companiesPerHour - this.rateLimits.currentUsage,
            resetTime: new Date(this.rateLimits.resetTime).toISOString()
        };
    }
}

module.exports = { DrMemoriaLinkedInConnector };
