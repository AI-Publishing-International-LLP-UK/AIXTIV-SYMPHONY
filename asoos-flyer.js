/**
 * ASOOS Flyer - Market Intelligence Orchestrator
 * Cost-efficient market intelligence data collection system
 * Integrates existing LinkedIn apps, web crawler, and fallback Apify actors
 */

const { ASOOSFlyerApifyIntegration } = require('./workers/asoos-flyer-apify-worker');
const { WFASwarmQueue } = require('./lib/wfa-queue');
const { LinkedInActor } = require('./custom-actors/linkedin-actor');
const { WebAnalysisActor } = require('./custom-actors/web-analyzer');
const { ConnectorManager } = require('./connectors');
const EventEmitter = require('events');

class ASOOSFlyer extends EventEmitter {
    constructor() {
        super();
        
        // Core components
        this.apifyWorker = new ASOOSFlyerApifyIntegration();
        this.queueManager = new WFASwarmQueue();
        this.linkedInActor = new LinkedInActor();
        this.webAnalysisActor = new WebAnalysisActor();
        this.connectorManager = new ConnectorManager();
        
        // Processing statistics
        this.stats = {
            totalProcessed: 0,
            successful: 0,
            failed: 0,
            startTime: null,
            endTime: null,
            existingInfraUsage: 0,
            fallbackUsage: 0
        };
        
        this.isInitialized = false;
        
        console.log('🚁 ASOOS Flyer - Market Intelligence Orchestrator initialized');
    }

    /**
     * Initialize all ASOOS Flyer components
     */
    async initialize() {
        try {
            console.log('🚀 Initializing ASOOS Flyer...');
            
            // Initialize queue system
            await this.queueManager.initialize();
            console.log('✅ WFA Queue system initialized');
            
            // Initialize existing infrastructure connectors (primary method)
            console.log('🔗 Initializing existing infrastructure connectors...');
            const connectorStatus = await this.connectorManager.initializeAllConnectors();
            console.log('📊 Connector status:', connectorStatus);
            
            // Initialize custom actors (fallback method)
            console.log('🎭 Initializing custom actors...');
            // Note: Custom actors initialize themselves when needed
            
            // Initialize Apify integration (premium fallback)
            console.log('🔗 Testing Apify connection...');
            const apifyStatus = await this.apifyWorker.testConnection();
            console.log(`📡 Apify status: ${apifyStatus ? '✅ Connected' : '⚠️ Simulation mode'}`);
            
            this.isInitialized = true;
            console.log('✅ ASOOS Flyer fully initialized and ready for operations');
            
            this.emit('initialized', { status: 'ready' });
            
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize ASOOS Flyer:', error);
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Process organizations using tiered approach: 
     * 1. Existing infrastructure (Dr. Memoria, Dr. Match, Web Crawler)
     * 2. Custom actors (cost-efficient)
     * 3. Apify actors (premium fallback)
     */
    async processOrganizationBatch(organizations, options = {}) {
        if (!this.isInitialized) {
            throw new Error('ASOOS Flyer not initialized. Call initialize() first.');
        }
        
        console.log(`🎯 Processing batch of ${organizations.length} organizations...`);
        this.stats.startTime = Date.now();
        
        const {
            useExistingInfrastructure = true, // Prioritize existing apps
            connectorTypes = [], // Specify which existing connectors to use
            useCustomActors = true,
            useApify = false, // Only as last resort
            batchSize = 10,
            forceFullProcessing = false // Force processing even with good coverage
        } = options;
        
        const results = {
            existingInfrastructure: null,
            customActors: {
                linkedin: [],
                webAnalysis: []
            },
            apify: {
                linkedin: [],
                webAnalysis: []
            },
            combined: []
        };
        
        try {
            // TIER 1: Use existing infrastructure (Dr. Memoria, Dr. Match, Web Crawler)
            if (useExistingInfrastructure) {
                console.log('🔄 TIER 1: Processing with existing infrastructure...');
                try {
                    const infraResults = await this.connectorManager.processOrganizations(organizations, connectorTypes);
                    results.existingInfrastructure = infraResults;
                    this.stats.existingInfraUsage += infraResults.data.length;
                    
                    console.log(`✅ Existing infrastructure processed ${infraResults.summary.successful}/${infraResults.summary.total} organizations`);
                    
                    // Calculate coverage quality
                    const coverage = this.calculateCoverage(infraResults.data);
                    console.log(`📊 Data coverage from existing infrastructure: ${(coverage * 100).toFixed(1)}%`);
                    
                    // If we have excellent coverage and not forcing full processing, return early
                    if (coverage >= 0.85 && !forceFullProcessing) {
                        console.log('🎯 Excellent coverage from existing infrastructure, skipping additional processing');
                        results.combined = infraResults.data;
                        this.updateStats(results.combined);
                        
                        // Queue for Professor Lee curation
                        await this.queueForCuration(results.combined, 'existing_infrastructure_only');
                        
                        return results;
                    }
                    
                    // If we have good coverage but some gaps, identify what's missing
                    if (coverage >= 0.70) {
                        console.log('📈 Good coverage from existing infrastructure, processing only gaps...');
                        const missingOrgs = this.identifyMissingData(infraResults.data, organizations);
                        if (missingOrgs.length > 0) {
                            console.log(`🔍 ${missingOrgs.length} organizations need additional processing`);
                            organizations = missingOrgs; // Process only the gaps
                        } else {
                            results.combined = infraResults.data;
                            this.updateStats(results.combined);
                            await this.queueForCuration(results.combined, 'existing_infrastructure_complete');
                            return results;
                        }
                    }
                    
                } catch (error) {
                    console.warn('⚠️ Existing infrastructure processing failed, falling back to other methods:', error.message);
                }
            }
            
            // TIER 2: Custom actors (cost-efficient fallback)
            if (useCustomActors && organizations.length > 0) {
                console.log('🔄 TIER 2: Processing with custom actors...');
                await this.processWithCustomActors(organizations, results, batchSize);
            }
            
            // TIER 3: Apify actors (premium fallback for critical gaps)
            if (useApify && organizations.length > 0) {
                console.log('🔄 TIER 3: Processing with Apify actors (premium)...');
                await this.processWithApify(organizations, results, batchSize);
            }
            
            // Combine all results with data merging
            results.combined = this.combineAllResults(
                results.existingInfrastructure?.data || [],
                results.customActors.linkedin,
                results.customActors.webAnalysis,
                results.apify.linkedin,
                results.apify.webAnalysis,
                organizations
            );
            
            // Update statistics
            this.updateStats(results.combined);
            
            // Queue for Professor Lee curation
            await this.queueForCuration(results.combined, 'full_processing');
            
            console.log(`✅ Batch processing completed: ${results.combined.length} organizations processed`);
            
            this.emit('batchCompleted', {
                total: results.combined.length,
                successful: results.combined.filter(r => !r.error).length,
                stats: this.stats
            });
            
            return results;
            
        } catch (error) {
            console.error('❌ Batch processing failed:', error);
            this.emit('error', error);
            throw error;
        }
    }

    /**
     * Process organizations with custom actors (cost-efficient)
     */
    async processWithCustomActors(organizations, results, batchSize) {
        console.log('🎭 Running custom actors...');
        
        for (let i = 0; i < organizations.length; i += batchSize) {
            const batch = organizations.slice(i, i + batchSize);
            console.log(`📊 Custom actors batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(organizations.length/batchSize)}`);
            
            try {
                // LinkedIn processing with custom actor
                console.log('🔗 Processing LinkedIn data with custom actor...');
                const linkedinResults = await this.linkedInActor.processBatch(batch);
                results.customActors.linkedin.push(...linkedinResults);
                this.stats.fallbackUsage += linkedinResults.length;
                
                // Web analysis with custom actor
                console.log('🌐 Processing web data with custom actor...');
                const webResults = await this.webAnalysisActor.processBatch(batch);
                results.customActors.webAnalysis.push(...webResults);
                
                // Rate limiting between batches
                if (i + batchSize < organizations.length) {
                    console.log('⏳ Rate limiting: waiting 2 seconds...');
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
                
            } catch (error) {
                console.warn(`⚠️ Custom actor batch failed: ${error.message}`);
            }
        }
    }

    /**
     * Process organizations with Apify actors (premium)
     */
    async processWithApify(organizations, results, batchSize) {
        console.log('💎 Running Apify actors (premium)...');
        
        if (!process.env.APIFY_TOKEN) {
            console.log('⚠️ APIFY_TOKEN not configured, simulating Apify processing...');
            // Simulate Apify results
            results.apify.linkedin = organizations.map(org => ({ ...org, source: 'apify_simulation' }));
            results.apify.webAnalysis = organizations.map(org => ({ ...org, source: 'apify_simulation' }));
            return;
        }
        
        try {
            // Use actual Apify integration
            const apifyResults = await this.apifyWorker.orchestrateDataCollection(organizations, {
                linkedinCrawling: true,
                webAnalysis: true,
                batchSize
            });
            
            results.apify.linkedin = apifyResults.linkedin || [];
            results.apify.webAnalysis = apifyResults.webAnalysis || [];
            
        } catch (error) {
            console.warn(`⚠️ Apify processing failed: ${error.message}`);
        }
    }

    /**
     * Combine results from all tiers with intelligent data merging
     */
    combineAllResults(infraData, customLinkedIn, customWeb, apifyLinkedIn, apifyWeb, originalOrgs) {
        return originalOrgs.map(org => {
            // Start with existing infrastructure data (highest priority)
            const infraResult = infraData.find(r => r.name === org.name) || org;
            
            // Add custom actor data if needed
            const customLI = customLinkedIn.find(r => r.name === org.name) || {};
            const customWebData = customWeb.find(r => r.name === org.name) || {};
            
            // Add Apify data if available
            const apifyLI = apifyLinkedIn.find(r => r.name === org.name) || {};
            const apifyWebData = apifyWeb.find(r => r.name === org.name) || {};
            
            // Intelligent data merging - prioritize by quality and recency
            const merged = {
                ...infraResult,
                
                // Merge LinkedIn data (infrastructure > custom > apify)
                linkedin: this.mergeLinkedInData(infraResult.drMemoria, infraResult.drMatch, customLI, apifyLI),
                
                // Merge web data (infrastructure > custom > apify)
                website: this.mergeWebData(infraResult.webCrawler, customWebData, apifyWebData),
                
                // Add fallback indicators
                sources: {
                    existingInfrastructure: !!(infraResult.drMemoria || infraResult.drMatch || infraResult.webCrawler),
                    customActors: !!(Object.keys(customLI).length || Object.keys(customWebData).length),
                    apify: !!(Object.keys(apifyLI).length || Object.keys(apifyWebData).length)
                },
                
                processedAt: new Date().toISOString()
            };
            
            // Calculate overall data quality
            merged.dataQuality = this.calculateOverallDataQuality(merged);
            
            return merged;
        });
    }

    /**
     * Merge LinkedIn data from different sources
     */
    mergeLinkedInData(drMemoriaData, drMatchData, customData, apifyData) {
        const sources = [drMemoriaData, drMatchData, customData, apifyData].filter(Boolean);
        
        if (sources.length === 0) return null;
        
        // Use the highest quality source as base
        const bestSource = sources.reduce((best, current) => {
            const bestQuality = best?.dataQuality || 0;
            const currentQuality = current?.dataQuality || 0;
            return currentQuality > bestQuality ? current : best;
        });
        
        return {
            ...bestSource,
            sources: sources.map(s => s.source).filter(Boolean),
            dataQuality: Math.max(...sources.map(s => s.dataQuality || 0))
        };
    }

    /**
     * Merge web data from different sources
     */
    mergeWebData(webCrawlerData, customData, apifyData) {
        const sources = [webCrawlerData, customData, apifyData].filter(Boolean);
        
        if (sources.length === 0) return null;
        
        // Combine data from all sources
        const merged = {
            url: null,
            title: null,
            description: null,
            seo: null,
            technical: null,
            sources: []
        };
        
        sources.forEach(source => {
            if (source.website?.url && !merged.url) merged.url = source.website.url;
            if (source.website?.title && !merged.title) merged.title = source.website.title;
            if (source.website?.description && !merged.description) merged.description = source.website.description;
            if (source.seo && !merged.seo) merged.seo = source.seo;
            if (source.technical && !merged.technical) merged.technical = source.technical;
            
            if (source.source) merged.sources.push(source.source);
        });
        
        return merged.url ? merged : null;
    }

    /**
     * Calculate data coverage from results
     */
    calculateCoverage(results) {
        if (!results || results.length === 0) return 0;
        
        const covered = results.filter(r => {
            const hasBasicData = r.name && (r.website || r.linkedin || r.description);
            const hasQualityData = r.dataQuality && r.dataQuality > 50;
            return hasBasicData && hasQualityData;
        });
        
        return covered.length / results.length;
    }

    /**
     * Identify organizations that need additional processing
     */
    identifyMissingData(results, originalOrgs) {
        return originalOrgs.filter(org => {
            const result = results.find(r => r.name === org.name);
            return !result || !result.dataQuality || result.dataQuality < 60;
        });
    }

    /**
     * Calculate overall data quality for merged results
     */
    calculateOverallDataQuality(orgData) {
        let score = 0;
        
        // Base data availability
        if (orgData.name) score += 10;
        if (orgData.website || orgData.linkedin) score += 20;
        if (orgData.description) score += 15;
        if (orgData.industry) score += 10;
        
        // LinkedIn data quality
        if (orgData.linkedin?.dataQuality) {
            score += orgData.linkedin.dataQuality * 0.25;
        }
        
        // Website data quality
        if (orgData.website) {
            score += 15;
            if (orgData.website.seo?.overall_score) {
                score += orgData.website.seo.overall_score * 0.15;
            }
        }
        
        // Multiple source bonus
        const sourceCount = Object.values(orgData.sources || {}).filter(Boolean).length;
        if (sourceCount >= 2) score += 10;
        if (sourceCount >= 3) score += 10;
        
        return Math.min(Math.round(score), 100);
    }

    /**
     * Queue results for Professor Lee curation
     */
    async queueForCuration(data, processingType) {
        try {
            console.log('📋 Queueing data for Professor Lee curation...');
            
            const curationTask = {
                type: 'market_intelligence_curation',
                data: data,
                processingType: processingType,
                stats: this.stats,
                priority: 'critical',
                timestamp: new Date().toISOString()
            };
            
            const taskId = await this.queueManager.enqueue('professor-lee-curation', curationTask);
            console.log(`✅ Data queued for curation with task ID: ${taskId}`);
            
            // Also queue for sRIX leadership assignment
            const srixTask = {
                type: 'srix_leader_assignment',
                data: data,
                priority: 'high'
            };
            
            const srixTaskId = await this.queueManager.enqueue('srix-leaders', srixTask);
            console.log(`✅ sRIX assignment queued with task ID: ${srixTaskId}`);
            
            return { curationTaskId: taskId, srixTaskId: srixTaskId };
            
        } catch (error) {
            console.error('❌ Failed to queue for curation:', error);
        }
    }

    /**
     * Update processing statistics
     */
    updateStats(results) {
        this.stats.totalProcessed = results.length;
        this.stats.successful = results.filter(r => !r.error && r.dataQuality > 50).length;
        this.stats.failed = results.filter(r => r.error || r.dataQuality <= 50).length;
        this.stats.endTime = Date.now();
        
        console.log('📊 Processing Statistics:');
        console.log(`   Total: ${this.stats.totalProcessed}`);
        console.log(`   Successful: ${this.stats.successful}`);
        console.log(`   Failed: ${this.stats.failed}`);
        console.log(`   Success Rate: ${((this.stats.successful / this.stats.totalProcessed) * 100).toFixed(1)}%`);
        console.log(`   Processing Time: ${this.stats.endTime - this.stats.startTime}ms`);
        console.log(`   Existing Infrastructure Usage: ${this.stats.existingInfraUsage}`);
        console.log(`   Fallback Usage: ${this.stats.fallbackUsage}`);
    }

    /**
     * Get current processing statistics
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * Get queue status
     */
    getQueueStatus() {
        return this.queueManager.getQueueStatus();
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        console.log('🧹 Cleaning up ASOOS Flyer resources...');
        
        if (this.connectorManager) {
            await this.connectorManager.cleanup();
        }
        
        if (this.queueManager) {
            await this.queueManager.cleanup();
        }
        
        console.log('✅ ASOOS Flyer cleanup completed');
    }
}

module.exports = { ASOOSFlyer };
