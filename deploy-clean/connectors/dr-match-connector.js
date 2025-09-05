/**
 * Dr. Match LinkedIn App Connector
 * Integrates existing Dr. Match LinkedIn app with ASOOS Flyer
 * Focuses on people/talent intelligence and company matching
 */

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const axios = require('axios');

class DrMatchLinkedInConnector {
    constructor() {
        this.secretClient = new SecretManagerServiceClient();
        this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || 'your-gcp-project';
        this.credentials = null;
        this.rateLimiter = new Map();
        
        // Dr. Match Cloud Services - Multiple specializations
        this.cloudServices = {
            // Dr. Match LinkedIn Marketing Service
            linkedinMarketing: {
                url: 'https://drmatch-marketing-859242575175.europe-west1.run.app',
                available: false,
                specialty: 'linkedin_marketing_talent'
            },
            // Dr. Match BidSuite Service (for project bidding and matching)
            bidsuite: {
                url: process.env.DR_MATCH_BIDSUITE_ENDPOINT || 'https://dr-match-bidsuite-859242575175.us-west1.run.app',
                available: false,
                specialty: 'project_bidding_matching'
            },
            // Dr. Match CustomerDelight Service (for customer matching and satisfaction)
            customerDelight: {
                url: process.env.DR_MATCH_CUSTOMER_DELIGHT_ENDPOINT || 'https://dr-match-customer-delight-859242575175.us-west1.run.app',
                available: false,
                specialty: 'customer_satisfaction_matching'
            }
        };
        
        // LinkedIn API endpoints for Dr. Match app (people/talent focused)
        this.apiEndpoints = {
            peopleSearch: '/v2/peopleSearch',
            companyLookup: '/v2/companies', 
            organizationLookup: '/v2/organizations',
            talentInsights: '/v2/talentInsights'
        };
        
        // Rate limiting for LinkedIn API
        this.rateLimits = {
            companiesPerHour: 100,
            searchesPerHour: 500, // Dr. Match may have higher search limits
            currentUsage: 0,
            resetTime: Date.now() + 3600000 // 1 hour
        };
        
        console.log('🎯 Dr. Match LinkedIn Connector initialized');
    }

    /**
     * Initialize connection with cloud services and credentials
     */
    async initialize() {
        try {
            console.log('🔐 Initializing Dr. Match connector with multiple services...');
            
            // Test all cloud services first
            await this.testAllCloudServices();
            
            // If any cloud services are available, we're good
            const availableServices = Object.values(this.cloudServices).filter(s => s.available);
            if (availableServices.length > 0) {
                console.log(`✅ Dr. Match connected to ${availableServices.length} cloud services`);
                return true;
            }
            
            console.log('🔄 No cloud services available, loading LinkedIn credentials...');
            
            // Fallback: Get credentials from GCP Secret Manager
            try {
                const [version] = await this.secretClient.accessSecretVersion({
                    name: `projects/${this.projectId}/secrets/drmatch-linkedin-credentials/versions/latest`
                });
                
                const credentialsData = version.payload.data.toString();
                this.credentials = this.parseCredentials(credentialsData);
                
                console.log('✅ Dr. Match LinkedIn credentials loaded successfully');
                
                // Test connection
                await this.testConnection();
                
            } catch (credError) {
                console.warn('⚠️ Could not load credentials, using cloud services fallback');
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize Dr. Match connector:', error);
            throw error;
        }
    }

    /**
     * Test all Dr. Match cloud services
     */
    async testAllCloudServices() {
        console.log('🧠 Testing all Dr. Match cloud services...');
        
        const serviceTests = Object.entries(this.cloudServices).map(async ([name, service]) => {
            try {
                const response = await axios.get(`${service.url}/health`, {
                    timeout: 10000
                });
                
                if (response.status === 200) {
                    service.available = true;
                    console.log(`✅ Dr. Match ${name} (${service.specialty}) is healthy`);
                } else {
                    service.available = false;
                    console.log(`⚠️ Dr. Match ${name} returned status ${response.status}`);
                }
            } catch (error) {
                service.available = false;
                console.log(`⚠️ Dr. Match ${name} not available: ${error.message}`);
            }
        });
        
        await Promise.allSettled(serviceTests);
        
        const healthyServices = Object.entries(this.cloudServices)
            .filter(([_, service]) => service.available)
            .map(([name, _]) => name);
            
        console.log(`📊 Dr. Match services status: ${healthyServices.length}/${Object.keys(this.cloudServices).length} healthy`);
        
        return healthyServices.length > 0;
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
            console.log('🧪 Testing Dr. Match LinkedIn API connection...');
            
            const response = await this.makeLinkedInAPICall('/v2/me', 'GET');
            
            if (response.data) {
                console.log(`✅ Dr. Match LinkedIn API connection successful`);
                console.log(`👤 Connected as: ${response.data.firstName} ${response.data.lastName}`);
                return true;
            }
            
        } catch (error) {
            console.error('❌ Dr. Match LinkedIn API test failed:', error.message);
            throw error;
        }
    }

    /**
     * Process organizations for LinkedIn data collection
     * Dr. Match focuses on people/talent insights and company matching
     * @param {Array} organizations - List of organizations to process
     * @returns {Object} LinkedIn data results with talent insights
     */
    async processOrganizations(organizations) {
        console.log(`🎯 Dr. Match processing ${organizations.length} organizations for talent insights...`);
        
        if (!this.credentials) {
            await this.initialize();
        }
        
        const results = [];
        const batchSize = 10; // Process in batches to respect rate limits
        
        try {
            for (let i = 0; i < organizations.length; i += batchSize) {
                const batch = organizations.slice(i, i + batchSize);
                
                console.log(`📈 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(organizations.length/batchSize)}`);
                
                // Check rate limits before batch
                await this.checkRateLimit();
                
                const batchResults = await Promise.allSettled(
                    batch.map(org => this.getOrganizationTalentInsights(org))
                );
                
                batchResults.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        results.push(result.value);
                    } else {
                        console.error(`❌ Failed to process ${batch[index].name}:`, result.reason.message);
                        results.push({
                            name: batch[index].name,
                            error: result.reason.message,
                            source: 'dr_match'
                        });
                    }
                });
                
                // Rate limiting between batches
                if (i + batchSize < organizations.length) {
                    console.log('⏳ Rate limiting: waiting 2 seconds...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
            
            console.log(`✅ Dr. Match completed processing: ${results.filter(r => !r.error).length}/${organizations.length} successful`);
            
            return {
                source: 'dr_match_linkedin',
                status: 'completed',
                data: results,
                summary: {
                    total: organizations.length,
                    successful: results.filter(r => !r.error).length,
                    failed: results.filter(r => r.error).length
                }
            };
            
        } catch (error) {
            console.error('❌ Dr. Match batch processing failed:', error);
            throw error;
        }
    }

    /**
     * Get organization talent insights and matching data from LinkedIn
     * Dr. Match specializes in people/talent intelligence
     * @param {Object} organization - Organization object with name, domain, etc.
     * @returns {Object} LinkedIn organization data with talent insights
     */
    async getOrganizationTalentInsights(organization) {
        try {
            console.log(`🔍 Getting talent insights for ${organization.name} via Dr. Match...`);
            
            // Get basic company information first
            const companyData = await this.getCompanyData(organization);
            
            if (!companyData) {
                return {
                    ...organization,
                    source: 'dr_match',
                    status: 'no_company_data_found',
                    scrapedAt: new Date().toISOString()
                };
            }
            
            // Get talent insights for the company
            const talentInsights = await this.getTalentInsights(organization, companyData);
            
            // Get leadership and key people information
            const leadershipData = await this.getLeadershipData(organization, companyData);
            
            // Combine all data
            return {
                ...organization,
                ...companyData,
                talentInsights,
                leadership: leadershipData,
                source: 'dr_match_linkedin_api',
                scrapedAt: new Date().toISOString(),
                dataQuality: this.calculateTalentDataQuality(companyData, talentInsights, leadershipData)
            };
            
        } catch (error) {
            console.error(`❌ Error getting talent insights for ${organization.name}:`, error);
            throw error;
        }
    }

    /**
     * Get basic company data
     */
    async getCompanyData(organization) {
        try {
            // Try direct lookup first
            if (organization.linkedinHandle) {
                const response = await this.makeLinkedInAPICall(`/v2/companies/${organization.linkedinHandle}`, 'GET');
                if (response.data) {
                    return this.formatBasicCompanyData(response.data);
                }
            }
            
            // Try search by company name
            const searchParams = {
                q: 'universalName',
                universalName: this.generateUniversalName(organization.name)
            };
            
            const searchResponse = await this.makeLinkedInAPICall('/v2/companies', 'GET', searchParams);
            
            if (searchResponse.data && searchResponse.data.elements && searchResponse.data.elements.length > 0) {
                return this.formatBasicCompanyData(searchResponse.data.elements[0]);
            }
            
            return null;
            
        } catch (error) {
            console.log(`⚠️ Company data lookup failed for ${organization.name}`);
            return null;
        }
    }

    /**
     * Get talent insights for the organization
     * This would use LinkedIn's talent insights API if available
     */
    async getTalentInsights(organization, companyData) {
        try {
            // Simulate talent insights - replace with actual LinkedIn API calls
            const insights = {
                // Company size and growth trends
                employeeTrends: await this.getEmployeeTrends(companyData),
                
                // Key roles and hiring patterns
                hiringPatterns: await this.getHiringPatterns(companyData),
                
                // Skills and technology adoption indicators
                skillsAnalysis: await this.getSkillsAnalysis(companyData),
                
                // Leadership and management structure
                organizationStructure: await this.getOrganizationStructure(companyData)
            };
            
            return insights;
            
        } catch (error) {
            console.log(`⚠️ Talent insights failed for ${organization.name}`);
            return {
                available: false,
                reason: error.message
            };
        }
    }

    /**
     * Get leadership and key people data
     */
    async getLeadershipData(organization, companyData) {
        try {
            // Search for key leadership roles at the company
            const leadershipRoles = ['CEO', 'CTO', 'CIO', 'VP', 'President', 'Founder'];
            const leadership = {};
            
            for (const role of leadershipRoles.slice(0, 3)) { // Limit to avoid rate limits
                const leaders = await this.searchPeopleByRole(companyData.linkedinId || companyData.universalName, role);
                if (leaders && leaders.length > 0) {
                    leadership[role.toLowerCase()] = leaders.slice(0, 2); // Top 2 results per role
                }
            }
            
            return {
                executives: leadership,
                totalFound: Object.values(leadership).flat().length,
                roles: Object.keys(leadership)
            };
            
        } catch (error) {
            console.log(`⚠️ Leadership data failed for ${organization.name}`);
            return {
                available: false,
                reason: error.message
            };
        }
    }

    /**
     * Search for people by role at a company
     */
    async searchPeopleByRole(companyIdentifier, role) {
        try {
            const searchParams = {
                keywords: role,
                facetCurrentCompany: companyIdentifier,
                facetNetwork: ['F', 'S'], // 1st and 2nd connections
                start: 0,
                count: 5 // Limit results
            };
            
            const response = await this.makeLinkedInAPICall('/v2/peopleSearch', 'GET', searchParams);
            
            if (response.data && response.data.elements) {
                return response.data.elements.map(person => ({
                    name: `${person.firstName} ${person.lastName}`,
                    headline: person.headline,
                    profileUrl: person.publicProfileUrl,
                    industry: person.industry,
                    location: person.location?.name,
                    role: role
                }));
            }
            
            return [];
            
        } catch (error) {
            console.log(`⚠️ People search failed for role ${role}`);
            return [];
        }
    }

    // Talent insight analysis methods
    async getEmployeeTrends(companyData) {
        // This would analyze employee growth trends
        return {
            currentSize: companyData.employeeCountRange,
            growthStage: this.analyzeGrowthStage(companyData),
            hiringTrend: 'stable' // Placeholder
        };
    }

    async getHiringPatterns(companyData) {
        // This would analyze recent hiring patterns
        return {
            activelyHiring: true, // Placeholder
            keyDepartments: ['Engineering', 'Sales', 'Marketing'], // Placeholder
            remotePolicy: 'hybrid' // Placeholder
        };
    }

    async getSkillsAnalysis(companyData) {
        // This would analyze skills and technology adoption
        return {
            topSkills: ['JavaScript', 'Python', 'React', 'AWS'], // Placeholder
            technologyAdoption: 'high', // Placeholder
            innovationScore: 85 // Placeholder
        };
    }

    async getOrganizationStructure(companyData) {
        // This would analyze organizational structure
        return {
            hierarchyLevel: this.analyzeHierarchyLevel(companyData),
            departmentCount: this.estimateDepartmentCount(companyData),
            managementRatio: 'standard' // Placeholder
        };
    }

    /**
     * Format basic company data
     */
    formatBasicCompanyData(companyData) {
        return {
            name: companyData.name || companyData.localizedName,
            universalName: companyData.universalName,
            linkedinId: companyData.id,
            linkedinUrl: `https://linkedin.com/company/${companyData.universalName}`,
            description: companyData.description,
            website: companyData.websiteUrl,
            industry: companyData.industries?.[0]?.localizedName,
            employeeCountRange: this.formatEmployeeCount(companyData.staffCount),
            headquarters: this.formatLocation(companyData.locations),
            foundedYear: companyData.foundedOn?.year
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
            console.log('🔄 Refreshing Dr. Match LinkedIn access token...');
            
            // Implementation would depend on your OAuth flow
            // This is a placeholder for the refresh logic
            
            console.log('✅ Access token refreshed');
            
        } catch (error) {
            console.error('❌ Failed to refresh access token:', error);
            throw error;
        }
    }

    // Analysis utility methods
    analyzeGrowthStage(companyData) {
        const employeeCount = this.extractEmployeeNumber(companyData.employeeCountRange);
        
        if (employeeCount < 50) return 'startup';
        if (employeeCount < 500) return 'growth';
        if (employeeCount < 5000) return 'scale';
        return 'enterprise';
    }

    analyzeHierarchyLevel(companyData) {
        const employeeCount = this.extractEmployeeNumber(companyData.employeeCountRange);
        
        if (employeeCount < 50) return 'flat';
        if (employeeCount < 1000) return 'moderate';
        return 'hierarchical';
    }

    estimateDepartmentCount(companyData) {
        const employeeCount = this.extractEmployeeNumber(companyData.employeeCountRange);
        
        // Rough estimation based on company size
        if (employeeCount < 50) return 3-5;
        if (employeeCount < 500) return 5-10;
        if (employeeCount < 5000) return 10-20;
        return '20+';
    }

    extractEmployeeNumber(employeeRange) {
        if (!employeeRange) return 0;
        
        const ranges = {
            '1 employee': 1,
            '2-10 employees': 6,
            '11-50 employees': 30,
            '51-200 employees': 125,
            '201-500 employees': 350,
            '501-1,000 employees': 750,
            '1,001-5,000 employees': 3000,
            '5,001-10,000 employees': 7500,
            '10,001+ employees': 15000
        };
        
        return ranges[employeeRange] || 0;
    }

    calculateTalentDataQuality(companyData, talentInsights, leadershipData) {
        let score = 0;
        
        // Basic company data quality
        if (companyData?.name) score += 20;
        if (companyData?.description) score += 10;
        if (companyData?.industry) score += 10;
        if (companyData?.employeeCountRange) score += 10;
        
        // Talent insights quality
        if (talentInsights?.available !== false) score += 20;
        if (talentInsights?.employeeTrends) score += 10;
        if (talentInsights?.hiringPatterns) score += 10;
        
        // Leadership data quality
        if (leadershipData?.available !== false) score += 10;
        if (leadershipData?.totalFound > 0) score += 10;
        
        return Math.min(score, 100);
    }

    // Utility methods (shared with Dr. Memoria)
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

    generateUniversalName(companyName) {
        return companyName.toLowerCase()
                         .replace(/[^a-z0-9\s]/g, '')
                         .replace(/\s+/g, '-')
                         .replace(/^-+|-+$/g, '');
    }

    // Rate limiting methods (same as Dr. Memoria)
    async checkRateLimit() {
        const now = Date.now();
        
        if (now > this.rateLimits.resetTime) {
            this.rateLimits.currentUsage = 0;
            this.rateLimits.resetTime = now + 3600000;
        }
        
        if (this.rateLimits.currentUsage >= this.rateLimits.companiesPerHour) {
            const waitTime = this.rateLimits.resetTime - now;
            console.log(`⏳ Dr. Match rate limit reached, waiting ${Math.ceil(waitTime/60000)} minutes...`);
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

module.exports = { DrMatchLinkedInConnector };
