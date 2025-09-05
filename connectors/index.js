/**
 * ASOOS Flyer Connector Integration Module
 * Main entry point for all ASOOS Flyer connectors
 * Provides unified interface for data collection from various sources
 */

const { DrMemoriaLinkedInConnector } = require('./dr-memoria-connector');
const { DrMatchLinkedInConnector } = require('./dr-match-connector');
const { WebCrawlerConnector } = require('./web-crawler-connector');
const { DrLucyMLConnector } = require('./dr-lucy-ml-connector');

class ConnectorManager {
    constructor() {
        // Initialize connectors
        this.connectors = {
            drMemoria: new DrMemoriaLinkedInConnector(),
            drMatch: new DrMatchLinkedInConnector(),
            webCrawler: new WebCrawlerConnector(),
            drLucy: new DrLucyMLConnector()
        };
        
        console.log('🔄 ASOOS Flyer Connector Manager initialized');
    }

    /**
     * Get available connector types
     * @returns {Array} List of available connector types
     */
    getAvailableConnectors() {
        return Object.keys(this.connectors);
    }

    /**
     * Initialize all connectors
     */
    async initializeAllConnectors() {
        console.log('🔄 Initializing all connectors...');
        
        const results = {};
        
        for (const [name, connector] of Object.entries(this.connectors)) {
            try {
                await connector.initialize();
                results[name] = 'initialized';
            } catch (error) {
                console.error(`❌ Failed to initialize ${name}:`, error);
                results[name] = 'failed';
            }
        }
        
        return results;
    }

    /**
     * Process organizations through specified connectors
     * @param {Array} organizations - List of organizations to process
     * @param {Array} connectorTypes - Array of connector types to use (or all if empty)
     * @returns {Object} Combined results from all connectors
     */
    async processOrganizations(organizations, connectorTypes = []) {
        if (!organizations || organizations.length === 0) {
            throw new Error('No organizations provided for processing');
        }
        
        console.log(`🔄 Processing ${organizations.length} organizations`);
        
        // If no connector types specified, use all available
        const types = connectorTypes.length > 0 
            ? connectorTypes 
            : Object.keys(this.connectors);
        
        const results = {};
        const processingStart = Date.now();
        
        // Process each connector type in parallel
        await Promise.all(types.map(async (type) => {
            if (!this.connectors[type]) {
                console.warn(`⚠️ Unknown connector type: ${type}`);
                return;
            }
            
            try {
                console.log(`🔄 Processing with ${type} connector...`);
                const connectorResults = await this.connectors[type].processOrganizations(organizations);
                results[type] = connectorResults;
                console.log(`✅ Completed ${type} processing`);
            } catch (error) {
                console.error(`❌ Error in ${type} connector:`, error);
                results[type] = {
                    error: error.message,
                    status: 'failed'
                };
            }
        }));
        
        // Combine results
        const combinedResults = this.mergeResults(results, organizations);
        combinedResults.processingTime = Date.now() - processingStart;
        
        console.log(`✅ Completed processing ${organizations.length} organizations through ${types.length} connectors`);
        console.log(`⏱️ Total processing time: ${combinedResults.processingTime}ms`);
        
        return combinedResults;
    }

    /**
     * Merge results from multiple connectors
     * @param {Object} results - Results from each connector
     * @param {Array} organizations - Original organizations list
     * @returns {Object} Combined results
     */
    mergeResults(results, organizations) {
        const combinedData = organizations.map(org => {
            const orgData = { ...org };
            
            // Merge data from each connector
            for (const [connectorType, connectorResults] of Object.entries(results)) {
                if (connectorResults.error) continue;
                
                const orgResult = connectorResults.data?.find(r => r.name === org.name);
                if (orgResult) {
                    // Add connector-specific data
                    orgData[connectorType] = orgResult;
                    
                    // Merge key data points
                    if (connectorType === 'drMemoria' || connectorType === 'drMatch') {
                        // LinkedIn data
                        if (!orgData.linkedin && orgResult.linkedinUrl) {
                            orgData.linkedin = orgResult.linkedinUrl;
                        }
                        if (!orgData.description && orgResult.description) {
                            orgData.description = orgResult.description;
                        }
                        if (!orgData.industry && orgResult.industry) {
                            orgData.industry = orgResult.industry;
                        }
                    } else if (connectorType === 'webCrawler') {
                        // Website data
                        if (!orgData.website && orgResult.website?.url) {
                            orgData.website = orgResult.website.url;
                        }
                        if (!orgData.description && orgResult.website?.description) {
                            orgData.description = orgResult.website.description;
                        }
                    }
                }
            }
            
            // Calculate overall data quality
            orgData.dataQuality = this.calculateOverallDataQuality(orgData);
            
            return orgData;
        });
        
        return {
            status: 'completed',
            data: combinedData,
            summary: {
                total: organizations.length,
                sourceCounts: this.countSources(results),
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * Calculate overall data quality score
     * @param {Object} orgData - Organization data with connector-specific results
     * @returns {Number} Overall data quality score (0-100)
     */
    calculateOverallDataQuality(orgData) {
        let score = 0;
        let sources = 0;
        
        // Base score for available fields
        if (orgData.name) score += 10;
        if (orgData.website) score += 10;
        if (orgData.linkedin) score += 10;
        if (orgData.description) score += 10;
        if (orgData.industry) score += 10;
        
        // Add quality scores from connectors
        if (orgData.drMemoria?.dataQuality) {
            score += orgData.drMemoria.dataQuality * 0.15;
            sources++;
        }
        
        if (orgData.drMatch?.dataQuality) {
            score += orgData.drMatch.dataQuality * 0.15;
            sources++;
        }
        
        if (orgData.webCrawler?.dataQuality) {
            score += orgData.webCrawler.dataQuality * 0.15;
            sources++;
        }
        
        // Dr. Lucy ML gets higher weight due to AI analysis
        if (orgData.drLucy?.mlConfidence) {
            score += orgData.drLucy.mlConfidence * 30; // Higher impact from ML
            sources++;
        }
        
        // Bonus for multiple sources
        if (sources >= 2) score += 10;
        if (sources >= 3) score += 10;
        if (sources >= 4) score += 15; // Extra bonus for ML enhancement
        
        return Math.min(Math.round(score), 100);
    }

    /**
     * Count successful sources in results
     * @param {Object} results - Results from each connector
     * @returns {Object} Count of successful sources
     */
    countSources(results) {
        const counts = {};
        
        for (const [source, result] of Object.entries(results)) {
            if (!result.error) {
                counts[source] = result.data?.filter(r => !r.error).length || 0;
            } else {
                counts[source] = 0;
            }
        }
        
        return counts;
    }

    /**
     * Clean up resources
     */
    async cleanup() {
        console.log('🧹 Cleaning up connector resources...');
        
        for (const connector of Object.values(this.connectors)) {
            if (connector.cleanup && typeof connector.cleanup === 'function') {
                await connector.cleanup();
            }
        }
        
        console.log('✅ Connector resources cleaned up');
    }

    /**
     * Graceful shutdown method (calls cleanup for compatibility)
     */
    async shutdown() {
        console.log('🔄 Shutting down ConnectorManager...');
        
        // First try to shutdown individual connectors gracefully
        for (const [name, connector] of Object.entries(this.connectors)) {
            try {
                if (connector.shutdown && typeof connector.shutdown === 'function') {
                    await connector.shutdown();
                } else if (connector.cleanup && typeof connector.cleanup === 'function') {
                    await connector.cleanup();
                }
            } catch (error) {
                console.warn(`⚠️ Warning: Failed to shutdown ${name} connector:`, error.message);
            }
        }
        
        console.log('✅ ConnectorManager shutdown completed');
    }

    /**
     * Test all connectors for health check
     */
    async testAllConnectors() {
        console.log('🧪 Testing all connectors...');
        
        const testResults = {};
        
        for (const [name, connector] of Object.entries(this.connectors)) {
            try {
                // Try a basic health check if available, otherwise mark as initialized
                if (connector.healthCheck && typeof connector.healthCheck === 'function') {
                    testResults[name] = await connector.healthCheck();
                } else {
                    testResults[name] = { status: 'initialized', message: 'Basic connector ready' };
                }
            } catch (error) {
                testResults[name] = { status: 'failed', error: error.message };
            }
        }
        
        return testResults;
    }
}

module.exports = {
    ConnectorManager,
    DrMemoriaLinkedInConnector,
    DrMatchLinkedInConnector,
    WebCrawlerConnector,
    DrLucyMLConnector
};
