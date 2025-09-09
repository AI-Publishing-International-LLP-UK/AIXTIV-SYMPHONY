#!/usr/bin/env node
/**
 * 💎📚 Digital Intelligent Library (DIL) - MCP Search Integration
 * Links DIDC (Data Intentional Duty Classification) cards with Google Custom Search
 * Authority: Diamond SAO Command Center
 * Version: 1.0.0-mcp-integration
 * 
 * Integration Flow:
 * 1. Company visits mcp.{company}.2100.cool
 * 2. SallyPort OAuth2 authentication 
 * 3. User selects "Search your industry/sector/function"
 * 4. Search integrates with existing DIDC archives + Google Custom Search
 * 5. Results stored as new DIDC cards in Digital Intelligent Library
 * 6. Enables AI-driven whitepaper generation from research
 */

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { Firestore } = require('@google-cloud/firestore');
const { MongoClient } = require('mongodb');
const axios = require('axios');
const winston = require('winston');
const crypto = require('crypto');

// Import existing DIDC system
const { DIDCArchivesCore, DeweyDataClassifier, IntentionalDataProcessor } = require('../../../Aixtiv-Symphony/production-didc-archives-system.js');

/**
 * Digital Intelligent Library MCP Search Integration
 * Connects Google Custom Search with DIDC classification for 10,000 company MCPs
 */
class DigitalIntelligentLibraryMCPSearch {
    constructor() {
        this.gcpProjectId = process.env.GCP_PROJECT_ID || 'api-for-warp-drive';
        this.region = process.env.CLOUD_ML_REGION || 'us-west1';
        
        // Initialize core systems
        this.didcCore = new DIDCArchivesCore();
        this.deweyClassifier = new DeweyDataClassifier();
        this.intentionalProcessor = new IntentionalDataProcessor();
        
        // Initialize clients
        this.secretManager = new SecretManagerServiceClient();
        this.firestore = new Firestore({ projectId: this.gcpProjectId });
        this.mongoClient = null;
        
        // Search configuration
        this.searchConfig = {
            // Industry-specific search parameters
            industries: {
                technology: {
                    keywords: ['artificial intelligence', 'machine learning', 'software development', 'tech innovation'],
                    deweyCode: '004.8',
                    customSearchCX: null // Will be loaded from secrets
                },
                healthcare: {
                    keywords: ['medical technology', 'healthcare AI', 'digital health', 'telemedicine'],
                    deweyCode: '610',
                    customSearchCX: null
                },
                finance: {
                    keywords: ['fintech', 'digital banking', 'financial AI', 'blockchain'],
                    deweyCode: '332',
                    customSearchCX: null
                },
                manufacturing: {
                    keywords: ['industry 4.0', 'smart manufacturing', 'IoT', 'automation'],
                    deweyCode: '670',
                    customSearchCX: null
                },
                education: {
                    keywords: ['edtech', 'educational technology', 'online learning', 'AI in education'],
                    deweyCode: '371.33',
                    customSearchCX: null
                }
            },
            
            // Function-specific search parameters
            functions: {
                'human-resources': {
                    keywords: ['HR technology', 'talent management', 'workforce analytics', 'employee engagement'],
                    deweyCode: '658.3',
                    customSearchCX: null
                },
                'marketing': {
                    keywords: ['digital marketing', 'marketing automation', 'customer analytics', 'martech'],
                    deweyCode: '658.8',
                    customSearchCX: null
                },
                'operations': {
                    keywords: ['operations management', 'process optimization', 'supply chain', 'logistics'],
                    deweyCode: '658.5',
                    customSearchCX: null
                },
                'finance': {
                    keywords: ['financial planning', 'budgeting', 'financial analytics', 'accounting'],
                    deweyCode: '658.15',
                    customSearchCX: null
                },
                'it': {
                    keywords: ['information technology', 'IT management', 'cybersecurity', 'cloud computing'],
                    deweyCode: '004',
                    customSearchCX: null
                }
            }
        };
        
        this.logger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
            transports: [
                new winston.transports.File({ filename: './logs/dil-mcp-search.log' }),
                new winston.transports.Console({ format: winston.format.simple() })
            ]
        });
        
        console.log('💎📚 Digital Intelligent Library MCP Search Integration initialized');
        console.log('🔍 Google Custom Search + DIDC Archives integration ready');
        console.log('🏢 Supporting 10,000 company-specific research interfaces');
    }

    /**
     * 🚀 Initialize all systems
     */
    async initialize() {
        try {
            // Initialize DIDC core system
            await this.didcCore.initialize();
            await this.deweyClassifier.initialize();
            await this.intentionalProcessor.initialize();
            
            // Initialize MongoDB connection for company profiles
            await this.initializeMongoDBConnection();
            
            // Load search configuration from secrets
            await this.loadSearchConfiguration();
            
            this.logger.info('✅ Digital Intelligent Library MCP Search fully operational');
            return true;
            
        } catch (error) {
            this.logger.error('❌ DIL MCP Search initialization failed', { error: error.message });
            throw error;
        }
    }

    /**
     * 🔍 MCP Company Search - Main entry point for company-specific searches
     * Called from mcp.{company}.2100.cool interface
     */
    async processMCPCompanySearch(companyId, searchType, query, userContext = {}) {
        try {
            this.logger.info('🔍 Processing MCP company search', {
                companyId,
                searchType, // 'industry', 'sector', 'function'
                query: query.substring(0, 100),
                userContext: userContext.userId || 'anonymous'
            });

            // Step 1: Load company profile from MongoDB Atlas
            const companyProfile = await this.loadCompanyProfile(companyId);
            
            // Step 2: Build search parameters based on company profile and search type
            const searchParams = await this.buildSearchParameters(companyProfile, searchType, query);
            
            // Step 3: Execute multi-source search
            const searchResults = await this.executeMultiSourceSearch(searchParams);
            
            // Step 4: Process results through DIDC classification
            const classifiedResults = await this.classifySearchResults(searchResults, searchParams);
            
            // Step 5: Store in Digital Intelligent Library as DIDC cards
            const didcCards = await this.createDIDCCards(classifiedResults, companyProfile);
            
            // Step 6: Generate research summary for whitepaper potential
            const researchSummary = await this.generateResearchSummary(didcCards, searchParams);
            
            // Step 7: Update company's library in Firestore
            await this.updateCompanyLibrary(companyId, didcCards, researchSummary);
            
            this.logger.info('✅ MCP company search completed', {
                companyId,
                resultsFound: classifiedResults.length,
                didcCardsCreated: didcCards.length
            });

            return {
                success: true,
                companyId,
                searchType,
                query,
                results: {
                    totalResults: classifiedResults.length,
                    didcCards,
                    researchSummary,
                    libraryLocation: `library/${companyId}`,
                    searchId: crypto.randomUUID()
                },
                digitalLibrary: {
                    newCardsAdded: didcCards.length,
                    deweyCategories: [...new Set(didcCards.map(card => card.classification.deweyCode))],
                    researchTopics: researchSummary.topics
                },
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            this.logger.error('❌ MCP company search failed', {
                companyId,
                searchType,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * 👥 Load company profile from MongoDB Atlas
     */
    async loadCompanyProfile(companyId) {
        try {
            const collection = this.mongoClient.db('api-for-warp-drive').collection('companies');
            const profile = await collection.findOne({ companyId });
            
            if (!profile) {
                throw new Error(`Company profile not found: ${companyId}`);
            }

            return {
                companyId: profile.companyId,
                name: profile.name,
                industry: profile.industry,
                sector: profile.sector,
                size: profile.size,
                location: profile.location,
                mcpDomain: `mcp.${companyId}.2100.cool`,
                searchPreferences: profile.searchPreferences || {},
                librarySettings: profile.librarySettings || {
                    autoClassify: true,
                    generateWhitepapers: true,
                    deweyCategories: 'auto'
                }
            };

        } catch (error) {
            this.logger.error('❌ Failed to load company profile', { companyId, error: error.message });
            throw error;
        }
    }

    /**
     * ⚙️ Build search parameters based on company profile and search type
     */
    async buildSearchParameters(companyProfile, searchType, userQuery) {
        const params = {
            companyId: companyProfile.companyId,
            searchType,
            userQuery,
            baseKeywords: [],
            customSearchCX: null,
            deweyCode: '000', // Default to General Works
            searchSources: ['google_custom_search', 'existing_didc_archives']
        };

        // Add industry/sector/function specific keywords
        switch (searchType) {
            case 'industry':
                if (this.searchConfig.industries[companyProfile.industry]) {
                    const industryConfig = this.searchConfig.industries[companyProfile.industry];
                    params.baseKeywords = industryConfig.keywords;
                    params.customSearchCX = industryConfig.customSearchCX;
                    params.deweyCode = industryConfig.deweyCode;
                }
                break;

            case 'sector':
                // Map company sector to search keywords
                params.baseKeywords = [
                    companyProfile.sector,
                    `${companyProfile.sector} trends`,
                    `${companyProfile.sector} innovation`,
                    `${companyProfile.sector} AI adoption`
                ];
                break;

            case 'function':
                // Extract primary function from user query or company profile
                const detectedFunction = this.detectFunction(userQuery);
                if (detectedFunction && this.searchConfig.functions[detectedFunction]) {
                    const functionConfig = this.searchConfig.functions[detectedFunction];
                    params.baseKeywords = functionConfig.keywords;
                    params.customSearchCX = functionConfig.customSearchCX;
                    params.deweyCode = functionConfig.deweyCode;
                }
                break;
        }

        // Combine with user query
        params.searchQuery = `${userQuery} ${params.baseKeywords.join(' ')}`;
        
        // Add company-specific context
        params.companyContext = {
            industry: companyProfile.industry,
            sector: companyProfile.sector,
            size: companyProfile.size,
            location: companyProfile.location
        };

        return params;
    }

    /**
     * 🔍 Execute multi-source search (Google Custom Search + existing DIDC archives)
     */
    async executeMultiSourceSearch(searchParams) {
        const results = {
            googleCustomSearch: [],
            didcArchives: [],
            combined: []
        };

        try {
            // Search Google Custom Search API
            if (searchParams.customSearchCX) {
                const googleResults = await this.searchGoogleCustomAPI(
                    searchParams.searchQuery,
                    searchParams.customSearchCX
                );
                results.googleCustomSearch = googleResults;
            }

            // Search existing DIDC archives
            const archiveResults = await this.didcCore.searchArchives(
                searchParams.userQuery,
                {
                    deweyCode: searchParams.deweyCode,
                    companyId: searchParams.companyId
                }
            );
            results.didcArchives = archiveResults;

            // Combine and deduplicate results
            results.combined = this.combineAndDeduplicateResults(
                results.googleCustomSearch,
                results.didcArchives
            );

            this.logger.info('🔍 Multi-source search completed', {
                googleResults: results.googleCustomSearch.length,
                archiveResults: results.didcArchives.length,
                combinedResults: results.combined.length
            });

            return results;

        } catch (error) {
            this.logger.error('❌ Multi-source search failed', { error: error.message });
            throw error;
        }
    }

    /**
     * 🌐 Search Google Custom Search API
     */
    async searchGoogleCustomAPI(query, customSearchCX) {
        try {
            // Get API key from Secret Manager
            const apiKey = await this.getSecretValue('api-google-search-crawl');
            
            const response = await axios.get('https://www.googleapis.com/customsearch/v1', {
                params: {
                    key: apiKey,
                    cx: customSearchCX || await this.getSecretValue('google-custom-search-default-cx'),
                    q: query,
                    num: 10, // Max results per search
                    safe: 'active',
                    fields: 'items(title,link,snippet,displayLink)'
                }
            });

            return response.data.items?.map(item => ({
                title: item.title,
                url: item.link,
                snippet: item.snippet,
                domain: item.displayLink,
                source: 'google_custom_search',
                retrievedAt: new Date().toISOString()
            })) || [];

        } catch (error) {
            this.logger.error('❌ Google Custom Search API failed', { error: error.message });
            return [];
        }
    }

    /**
     * 📚 Classify search results through DIDC system
     */
    async classifySearchResults(searchResults, searchParams) {
        const classifiedResults = [];

        for (const result of searchResults.combined) {
            try {
                // Prepare content for classification
                const contentToClassify = `${result.title} ${result.snippet || result.preview || ''}`;
                
                // Apply Dewey classification
                const deweyClassification = await this.deweyClassifier.classifyData(contentToClassify);
                
                // Apply intentional processing
                const intentionalAnalysis = await this.intentionalProcessor.analyzeIntent(
                    contentToClassify,
                    {
                        searchType: searchParams.searchType,
                        companyContext: searchParams.companyContext,
                        intent: 'research_and_analysis'
                    }
                );

                classifiedResults.push({
                    ...result,
                    classification: deweyClassification,
                    intentionalAnalysis,
                    searchContext: {
                        companyId: searchParams.companyId,
                        searchType: searchParams.searchType,
                        query: searchParams.userQuery
                    }
                });

            } catch (error) {
                this.logger.warn('⚠️ Failed to classify result', { 
                    title: result.title,
                    error: error.message 
                });
                
                // Add with default classification
                classifiedResults.push({
                    ...result,
                    classification: {
                        deweyCode: '000',
                        description: 'General Works',
                        confidence: 0.5
                    },
                    intentionalAnalysis: {
                        detectedPurpose: 'general_information',
                        confidence: 0.5,
                        importance: 'medium'
                    }
                });
            }
        }

        return classifiedResults;
    }

    /**
     * 📖 Create DIDC cards for Digital Intelligent Library
     */
    async createDIDCCards(classifiedResults, companyProfile) {
        const didcCards = [];

        for (const result of classifiedResults) {
            try {
                // Create DIDC archive package
                const archivePackage = await this.didcCore.processDataForArchival(
                    {
                        title: result.title,
                        content: result.snippet || result.preview,
                        url: result.url,
                        source: result.source,
                        retrievedAt: result.retrievedAt
                    },
                    {
                        companyId: companyProfile.companyId,
                        searchType: result.searchContext.searchType,
                        intent: 'digital_library_research',
                        priority: result.intentionalAnalysis.importance,
                        confidentiality: 'internal',
                        digitalLibraryCard: true
                    }
                );

                const didcCard = {
                    id: archivePackage.archiveId,
                    title: result.title,
                    deweyCode: result.classification.deweyCode,
                    deweyDescription: result.classification.description,
                    classification: result.classification,
                    intentionalAnalysis: result.intentionalAnalysis,
                    content: {
                        snippet: result.snippet || result.preview,
                        fullUrl: result.url,
                        domain: result.domain
                    },
                    metadata: {
                        companyId: companyProfile.companyId,
                        companyName: companyProfile.name,
                        searchType: result.searchContext.searchType,
                        searchQuery: result.searchContext.query,
                        source: result.source,
                        retrievedAt: result.retrievedAt,
                        classifiedAt: new Date().toISOString()
                    },
                    archival: {
                        location: archivePackage.location,
                        retrievalCode: archivePackage.retrievalCode
                    },
                    digitalLibrary: {
                        isDigitalLibraryCard: true,
                        researchTopic: result.searchContext.searchType,
                        whitepaperPotential: this.assessWhitepaperPotential(result),
                        relatedTopics: this.extractRelatedTopics(result)
                    }
                };

                didcCards.push(didcCard);

            } catch (error) {
                this.logger.error('❌ Failed to create DIDC card', {
                    title: result.title,
                    error: error.message
                });
            }
        }

        return didcCards;
    }

    /**
     * 📊 Generate research summary for whitepaper potential
     */
    async generateResearchSummary(didcCards, searchParams) {
        const summary = {
            searchContext: {
                companyId: searchParams.companyId,
                searchType: searchParams.searchType,
                query: searchParams.userQuery,
                timestamp: new Date().toISOString()
            },
            statistics: {
                totalCards: didcCards.length,
                deweyCategories: [...new Set(didcCards.map(card => card.deweyCode))],
                sourcesCount: {
                    googleCustomSearch: didcCards.filter(card => card.metadata.source === 'google_custom_search').length,
                    didcArchives: didcCards.filter(card => card.metadata.source === 'didc_archives').length
                },
                importanceLevels: {
                    critical: didcCards.filter(card => card.intentionalAnalysis.importance === 'critical').length,
                    high: didcCards.filter(card => card.intentionalAnalysis.importance === 'high').length,
                    medium: didcCards.filter(card => card.intentionalAnalysis.importance === 'medium').length,
                    low: didcCards.filter(card => card.intentionalAnalysis.importance === 'low').length
                }
            },
            topics: this.extractTopicsFromCards(didcCards),
            whitepaperRecommendations: {
                suggestedTopics: this.suggestWhitepaperTopics(didcCards, searchParams),
                readyToGenerate: didcCards.filter(card => 
                    card.digitalLibrary.whitepaperPotential === 'high'
                ).length >= 5,
                estimatedLength: this.estimateWhitepaperLength(didcCards)
            },
            nextSteps: [
                'Review high-priority DIDC cards for accuracy',
                'Generate whitepaper from high-potential research',
                'Share findings through company MCP interface',
                'Archive important discoveries for future reference'
            ]
        };

        return summary;
    }

    /**
     * 💾 Update company's Digital Intelligent Library in Firestore
     */
    async updateCompanyLibrary(companyId, didcCards, researchSummary) {
        try {
            const libraryRef = this.firestore.collection('digital-intelligent-library');
            const companyLibraryRef = libraryRef.doc(companyId);

            // Create or update company library document
            await companyLibraryRef.set({
                companyId,
                lastUpdated: new Date().toISOString(),
                totalCards: didcCards.length,
                latestSearch: researchSummary.searchContext,
                statistics: researchSummary.statistics
            }, { merge: true });

            // Store individual DIDC cards
            const batch = this.firestore.batch();
            for (const card of didcCards) {
                const cardRef = companyLibraryRef.collection('cards').doc(card.id);
                batch.set(cardRef, card);
            }

            // Store research summary
            const summaryRef = companyLibraryRef.collection('summaries').doc();
            batch.set(summaryRef, researchSummary);

            await batch.commit();

            this.logger.info('💾 Company library updated', {
                companyId,
                cardsAdded: didcCards.length
            });

        } catch (error) {
            this.logger.error('❌ Failed to update company library', {
                companyId,
                error: error.message
            });
            throw error;
        }
    }

    /**
     * 🔧 Utility Methods
     */
    
    async initializeMongoDBConnection() {
        try {
            const mongoUri = await this.getSecretValue('MONGODB_ATLAS_URI');
            if (mongoUri) {
                this.mongoClient = new MongoClient(mongoUri);
                await this.mongoClient.connect();
                this.logger.info('✅ MongoDB Atlas connection established');
            }
        } catch (error) {
            this.logger.error('❌ MongoDB connection failed', { error: error.message });
            throw error;
        }
    }

    async loadSearchConfiguration() {
        try {
            // Load custom search CX IDs from secrets for different categories
            for (const industry of Object.keys(this.searchConfig.industries)) {
                try {
                    const cx = await this.getSecretValue(`google-custom-search-${industry}-cx`);
                    if (cx) {
                        this.searchConfig.industries[industry].customSearchCX = cx;
                    }
                } catch (error) {
                    this.logger.warn(`⚠️ No custom CX found for industry: ${industry}`);
                }
            }

            this.logger.info('✅ Search configuration loaded');
        } catch (error) {
            this.logger.error('❌ Failed to load search configuration', { error: error.message });
        }
    }

    async getSecretValue(secretName) {
        try {
            const name = `projects/${this.gcpProjectId}/secrets/${secretName}/versions/latest`;
            const [version] = await this.secretManager.accessSecretVersion({ name });
            return version.payload.data.toString();
        } catch (error) {
            this.logger.warn(`⚠️ Could not get secret ${secretName}:`, error.message);
            return null;
        }
    }

    detectFunction(query) {
        const functionKeywords = {
            'human-resources': ['hr', 'human resources', 'talent', 'hiring', 'recruitment'],
            'marketing': ['marketing', 'advertising', 'promotion', 'brand', 'campaign'],
            'operations': ['operations', 'ops', 'process', 'workflow', 'efficiency'],
            'finance': ['finance', 'financial', 'accounting', 'budget', 'cost'],
            'it': ['it', 'information technology', 'tech', 'software', 'systems']
        };

        const queryLower = query.toLowerCase();
        for (const [func, keywords] of Object.entries(functionKeywords)) {
            if (keywords.some(keyword => queryLower.includes(keyword))) {
                return func;
            }
        }
        return null;
    }

    combineAndDeduplicateResults(googleResults, archiveResults) {
        const combined = [...googleResults];
        const existingUrls = new Set(googleResults.map(r => r.url));

        // Add archive results that don't duplicate Google results
        for (const archiveResult of archiveResults) {
            if (!existingUrls.has(archiveResult.url || archiveResult.id)) {
                combined.push({
                    ...archiveResult,
                    source: 'didc_archives'
                });
            }
        }

        return combined;
    }

    assessWhitepaperPotential(result) {
        const titleLength = result.title.length;
        const hasSnippet = Boolean(result.snippet);
        const confidence = result.classification?.confidence || 0;

        if (confidence > 0.8 && titleLength > 50 && hasSnippet) return 'high';
        if (confidence > 0.6 && titleLength > 30) return 'medium';
        return 'low';
    }

    extractRelatedTopics(result) {
        const content = `${result.title} ${result.snippet || ''}`.toLowerCase();
        const topics = [];
        
        const topicKeywords = ['ai', 'artificial intelligence', 'machine learning', 'automation', 'digital transformation', 'innovation', 'technology', 'data', 'analytics'];
        
        for (const topic of topicKeywords) {
            if (content.includes(topic)) {
                topics.push(topic);
            }
        }
        
        return topics;
    }

    extractTopicsFromCards(didcCards) {
        const topicMap = new Map();
        
        for (const card of didcCards) {
            const topics = card.digitalLibrary.relatedTopics || [];
            for (const topic of topics) {
                topicMap.set(topic, (topicMap.get(topic) || 0) + 1);
            }
        }
        
        return Array.from(topicMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([topic, count]) => ({ topic, count }));
    }

    suggestWhitepaperTopics(didcCards, searchParams) {
        const suggestions = [];
        const topicsCount = this.extractTopicsFromCards(didcCards);
        
        for (const topicInfo of topicsCount.slice(0, 3)) {
            suggestions.push({
                title: `${searchParams.searchType.toUpperCase()}: ${topicInfo.topic} in ${searchParams.companyContext?.industry || 'Industry'}`,
                estimatedLength: '5-10 pages',
                sourceCards: topicInfo.count,
                confidence: topicInfo.count >= 3 ? 'high' : 'medium'
            });
        }
        
        return suggestions;
    }

    estimateWhitepaperLength(didcCards) {
        const totalContent = didcCards.reduce((sum, card) => 
            sum + (card.content.snippet?.length || 0), 0
        );
        
        if (totalContent > 10000) return '10-15 pages';
        if (totalContent > 5000) return '5-10 pages';
        if (totalContent > 2000) return '3-5 pages';
        return '1-3 pages';
    }
}

module.exports = { DigitalIntelligentLibraryMCPSearch };
