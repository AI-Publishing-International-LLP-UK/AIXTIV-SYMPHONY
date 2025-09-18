#!/usr/bin/env node

/**
 * MCP SERVICE REGISTRY CORE MODULE
 * Diamond SAO Command Center Integration
 * 
 * Purpose: Central registry for MCP service discovery and health monitoring
 * Features: Service registration, health checking, query interface, SAO authorization
 * Authority: Diamond SAO Command Center Integration
 * 
 * Database: MongoDB Atlas with multi-region replication
 * Security: SAO-based authorization with SallyPort integration
 */

const { MongoClient, ObjectId } = require('mongodb');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log(`🔮 MCP SERVICE REGISTRY - CORE MODULE`);
console.log(`💎 Diamond SAO Command Center Integration`);
console.log(`🌐 AIXTIV Symphony MCP Ecosystem`);
console.log(``);

class MCPServiceRegistry {
    constructor(config = {}) {
        this.config = {
            mongoUri: config.mongoUri || process.env.MONGODB_ATLAS_URI,
            database: config.database || 'aixtiv_symphony_mcp',
            collection: config.collection || 'service_registry',
            healthCollection: config.healthCollection || 'health_status',
            region: config.region || process.env.CLOUD_ML_REGION || 'us-west1',
            environment: config.environment || 'production',
            saoAuthEndpoint: config.saoAuthEndpoint || 'https://sallyport.2100.cool/api/auth/verify',
            diamondCommandCenter: config.diamondCommandCenter || 'https://mocoa.2100.cool',
            ...config
        };
        
        this.client = null;
        this.db = null;
        this.serviceCollection = null;
        this.healthCollection = null;
        this.isConnected = false;
        
        // Service status constants
        this.STATUS = {
            ACTIVE: 'active',
            INACTIVE: 'inactive', 
            MAINTENANCE: 'maintenance',
            UNHEALTHY: 'unhealthy',
            PROVISIONING: 'provisioning',
            DECOMMISSIONED: 'decommissioned'
        };
        
        // SAO Authorization levels
        this.SAO_LEVELS = {
            DIAMOND: 'diamond',    // Unlimited super admin
            EMERALD: 'emerald',    // Nearly unlimited super admin -01
            SAPPHIRE: 'sapphire',  // Unlimited super admin for their instance
            OPAL: 'opal',          // Limited ability per Sapphire SAO
            ONYX: 'onyx'           // Very limited abilities enabled by Sapphire SAO
        };
        
        this.initializationPromise = null;
    }

    // Initialize MongoDB connection and collections
    async initialize() {
        if (this.initializationPromise) {
            return this.initializationPromise;
        }

        this.initializationPromise = this._performInitialization();
        return this.initializationPromise;
    }

    async _performInitialization() {
        try {
            console.log(`🔌 Initializing MongoDB connection to Atlas...`);
            
            if (!this.config.mongoUri) {
                throw new Error('MongoDB Atlas URI not configured. Set MONGODB_ATLAS_URI environment variable.');
            }

            this.client = new MongoClient(this.config.mongoUri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
                serverSelectionTimeoutMS: 5000,
                maxPoolSize: 10,
                minPoolSize: 2
            });

            await this.client.connect();
            this.db = this.client.db(this.config.database);
            this.serviceCollection = this.db.collection(this.config.collection);
            this.healthCollection = this.db.collection(this.config.healthCollection);
            
            // Create indexes for optimal performance
            await this.createIndexes();
            
            this.isConnected = true;
            console.log(`✅ MongoDB Atlas connected successfully`);
            console.log(`📊 Database: ${this.config.database}`);
            console.log(`🏷️  Collections: ${this.config.collection}, ${this.config.healthCollection}`);
            
            return true;
            
        } catch (error) {
            console.error(`❌ Failed to initialize MongoDB connection: ${error.message}`);
            throw error;
        }
    }

    // Create database indexes for optimal performance
    async createIndexes() {
        try {
            console.log(`🔍 Creating database indexes...`);
            
            // Service collection indexes
            await this.serviceCollection.createIndex({ serviceId: 1 }, { unique: true });
            await this.serviceCollection.createIndex({ companyName: 1 });
            await this.serviceCollection.createIndex({ domain: 1 }, { unique: true });
            await this.serviceCollection.createIndex({ status: 1 });
            await this.serviceCollection.createIndex({ 'serviceInfo.region': 1 });
            await this.serviceCollection.createIndex({ 'serviceInfo.capabilities': 1 });
            await this.serviceCollection.createIndex({ saoLevel: 1 });
            await this.serviceCollection.createIndex({ tags: 1 });
            await this.serviceCollection.createIndex({ registeredAt: -1 });
            await this.serviceCollection.createIndex({ lastUpdated: -1 });
            
            // Health collection indexes
            await this.healthCollection.createIndex({ serviceId: 1 });
            await this.healthCollection.createIndex({ timestamp: -1 });
            await this.healthCollection.createIndex({ status: 1 });
            await this.healthCollection.createIndex({ responseTime: 1 });
            
            // Compound indexes for complex queries
            await this.serviceCollection.createIndex({ 
                companyName: 1, 
                status: 1, 
                'serviceInfo.region': 1 
            });
            
            console.log(`✅ Database indexes created successfully`);
            
        } catch (error) {
            console.error(`❌ Failed to create indexes: ${error.message}`);
            throw error;
        }
    }

    // Generate unique service ID
    generateServiceId(companyName, instanceId) {
        const timestamp = Date.now().toString(36);
        const hash = crypto.createHash('sha256')
            .update(`${companyName}-${instanceId}-${timestamp}`)
            .digest('hex')
            .substring(0, 8);
        return `svc-${companyName.toLowerCase()}-${hash}`;
    }

    // Validate SAO authorization
    async validateSAOAuthorization(authToken, requiredLevel = null, companyName = null) {
        try {
            if (!authToken) {
                throw new Error('Authorization token required');
            }

            // Extract SAO level from token (simplified for now)
            // In production, this would verify with SallyPort
            const tokenParts = authToken.split('.');
            if (tokenParts.length < 2) {
                throw new Error('Invalid authorization token format');
            }

            // Mock SAO validation - replace with actual SallyPort integration
            const saoLevel = this.SAO_LEVELS.DIAMOND; // For testing
            
            if (requiredLevel) {
                const levelHierarchy = [
                    this.SAO_LEVELS.ONYX,
                    this.SAO_LEVELS.OPAL, 
                    this.SAO_LEVELS.SAPPHIRE,
                    this.SAO_LEVELS.EMERALD,
                    this.SAO_LEVELS.DIAMOND
                ];
                
                const userLevelIndex = levelHierarchy.indexOf(saoLevel);
                const requiredLevelIndex = levelHierarchy.indexOf(requiredLevel);
                
                if (userLevelIndex < requiredLevelIndex) {
                    throw new Error(`Insufficient SAO authorization. Required: ${requiredLevel}, Current: ${saoLevel}`);
                }
            }

            return {
                authorized: true,
                saoLevel,
                companyScope: companyName // For company-specific operations
            };
            
        } catch (error) {
            console.error(`🔐 SAO Authorization failed: ${error.message}`);
            throw error;
        }
    }

    // Register a new MCP service
    async registerService(serviceData, authToken) {
        await this.initialize();
        
        try {
            console.log(`📝 Registering MCP service: ${serviceData.companyName}`);
            
            // Validate authorization
            await this.validateSAOAuthorization(authToken, this.SAO_LEVELS.SAPPHIRE);
            
            // Validate required fields
            this.validateServiceData(serviceData);
            
            const serviceId = this.generateServiceId(serviceData.companyName, serviceData.instanceId);
            const now = new Date().toISOString();
            
            const serviceRecord = {
                serviceId,
                companyName: serviceData.companyName,
                domain: serviceData.domain,
                instanceId: serviceData.instanceId,
                status: serviceData.status || this.STATUS.PROVISIONING,
                healthStatus: {
                    lastCheck: null,
                    responseTime: null,
                    uptime: 100.0,
                    consecutiveFailures: 0,
                    lastFailure: null
                },
                serviceInfo: {
                    version: serviceData.serviceInfo?.version || '1.0.0',
                    capabilities: serviceData.serviceInfo?.capabilities || [],
                    region: serviceData.serviceInfo?.region || this.config.region,
                    environment: serviceData.serviceInfo?.environment || this.config.environment,
                    endpoints: {
                        primary: `https://${serviceData.domain}`,
                        health: `https://${serviceData.domain}/health`,
                        metrics: `https://${serviceData.domain}/metrics`,
                        ...serviceData.serviceInfo?.endpoints
                    }
                },
                personalConfig: serviceData.personalConfig || {},
                demoConfig: serviceData.demoConfig || {},
                saoLevel: serviceData.saoLevel || this.SAO_LEVELS.SAPPHIRE,
                registeredAt: now,
                lastUpdated: now,
                tags: serviceData.tags || [],
                metadata: serviceData.metadata || {},
                healthCheckConfig: {
                    interval: serviceData.healthCheckConfig?.interval || '1m',
                    timeout: serviceData.healthCheckConfig?.timeout || '10s',
                    retries: serviceData.healthCheckConfig?.retries || 3,
                    failureThreshold: serviceData.healthCheckConfig?.failureThreshold || 3,
                    successThreshold: serviceData.healthCheckConfig?.successThreshold || 2,
                    endpoints: serviceData.healthCheckConfig?.endpoints || ['/health'],
                    expectedStatus: serviceData.healthCheckConfig?.expectedStatus || 200,
                    alerting: {
                        enabled: true,
                        channels: ['diamond-sao'],
                        escalationLevels: ['warning', 'critical', 'emergency'],
                        ...serviceData.healthCheckConfig?.alerting
                    }
                }
            };
            
            // Insert service record
            const result = await this.serviceCollection.insertOne(serviceRecord);
            
            if (!result.insertedId) {
                throw new Error('Failed to insert service record');
            }
            
            console.log(`✅ Service registered successfully`);
            console.log(`🆔 Service ID: ${serviceId}`);
            console.log(`🌐 Domain: ${serviceData.domain}`);
            console.log(`📍 Region: ${serviceRecord.serviceInfo.region}`);
            
            return {
                success: true,
                serviceId,
                serviceRecord: { ...serviceRecord, _id: result.insertedId }
            };
            
        } catch (error) {
            console.error(`❌ Service registration failed: ${error.message}`);
            throw error;
        }
    }

    // Update service information
    async updateService(serviceId, updateData, authToken) {
        await this.initialize();
        
        try {
            console.log(`🔄 Updating service: ${serviceId}`);
            
            // Get existing service for authorization check
            const existingService = await this.serviceCollection.findOne({ serviceId });
            if (!existingService) {
                throw new Error(`Service not found: ${serviceId}`);
            }
            
            // Validate authorization
            await this.validateSAOAuthorization(
                authToken, 
                this.SAO_LEVELS.SAPPHIRE,
                existingService.companyName
            );
            
            const updateQuery = {
                ...updateData,
                lastUpdated: new Date().toISOString()
            };
            
            // Remove fields that shouldn't be updated directly
            delete updateQuery.serviceId;
            delete updateQuery.registeredAt;
            delete updateQuery._id;
            
            const result = await this.serviceCollection.updateOne(
                { serviceId },
                { $set: updateQuery }
            );
            
            if (result.matchedCount === 0) {
                throw new Error(`Service not found: ${serviceId}`);
            }
            
            console.log(`✅ Service updated successfully: ${serviceId}`);
            
            return {
                success: true,
                serviceId,
                modifiedCount: result.modifiedCount
            };
            
        } catch (error) {
            console.error(`❌ Service update failed: ${error.message}`);
            throw error;
        }
    }

    // Query services based on criteria
    async discoverServices(queryParams = {}, authToken) {
        await this.initialize();
        
        try {
            console.log(`🔍 Discovering services with criteria:`, queryParams);
            
            // Validate authorization
            const auth = await this.validateSAOAuthorization(authToken);
            
            // Build MongoDB query
            const query = this.buildDiscoveryQuery(queryParams, auth);
            
            // Execute query with pagination
            const limit = Math.min(parseInt(queryParams.limit) || 50, 1000);
            const skip = Math.max(parseInt(queryParams.offset) || 0, 0);
            
            const services = await this.serviceCollection
                .find(query)
                .sort({ lastUpdated: -1 })
                .limit(limit)
                .skip(skip)
                .toArray();
            
            const totalCount = await this.serviceCollection.countDocuments(query);
            
            console.log(`✅ Found ${services.length} services (${totalCount} total)`);
            
            return {
                success: true,
                services,
                pagination: {
                    total: totalCount,
                    limit,
                    offset: skip,
                    hasMore: skip + limit < totalCount
                },
                query: queryParams
            };
            
        } catch (error) {
            console.error(`❌ Service discovery failed: ${error.message}`);
            throw error;
        }
    }

    // Build MongoDB query from discovery parameters
    buildDiscoveryQuery(params, auth) {
        const query = {};
        
        // Company filter (enforce for non-Diamond SAO)
        if (params.company) {
            query.companyName = { $regex: new RegExp(params.company, 'i') };
        } else if (auth.saoLevel !== this.SAO_LEVELS.DIAMOND && auth.saoLevel !== this.SAO_LEVELS.EMERALD) {
            // Restrict to company scope for lower SAO levels
            if (auth.companyScope) {
                query.companyName = auth.companyScope;
            }
        }
        
        // Status filter
        if (params.status) {
            if (Array.isArray(params.status)) {
                query.status = { $in: params.status };
            } else {
                query.status = params.status;
            }
        }
        
        // Region filter
        if (params.region) {
            query['serviceInfo.region'] = params.region;
        }
        
        // Capabilities filter
        if (params.capabilities) {
            const capabilities = Array.isArray(params.capabilities) ? params.capabilities : [params.capabilities];
            query['serviceInfo.capabilities'] = { $in: capabilities };
        }
        
        // Tags filter
        if (params.tags) {
            const tags = Array.isArray(params.tags) ? params.tags : [params.tags];
            query.tags = { $in: tags };
        }
        
        // SAO level filter (for authorized users)
        if (params.saoLevel && (auth.saoLevel === this.SAO_LEVELS.DIAMOND || auth.saoLevel === this.SAO_LEVELS.EMERALD)) {
            query.saoLevel = params.saoLevel;
        }
        
        return query;
    }

    // Get service by ID
    async getService(serviceId, authToken) {
        await this.initialize();
        
        try {
            const service = await this.serviceCollection.findOne({ serviceId });
            if (!service) {
                throw new Error(`Service not found: ${serviceId}`);
            }
            
            // Validate authorization
            await this.validateSAOAuthorization(
                authToken,
                this.SAO_LEVELS.ONYX,
                service.companyName
            );
            
            return {
                success: true,
                service
            };
            
        } catch (error) {
            console.error(`❌ Get service failed: ${error.message}`);
            throw error;
        }
    }

    // Deregister a service
    async deregisterService(serviceId, authToken) {
        await this.initialize();
        
        try {
            console.log(`🗑️  Deregistering service: ${serviceId}`);
            
            const service = await this.serviceCollection.findOne({ serviceId });
            if (!service) {
                throw new Error(`Service not found: ${serviceId}`);
            }
            
            // Validate authorization
            await this.validateSAOAuthorization(
                authToken,
                this.SAO_LEVELS.SAPPHIRE,
                service.companyName
            );
            
            // Mark as decommissioned instead of deleting
            const result = await this.serviceCollection.updateOne(
                { serviceId },
                { 
                    $set: { 
                        status: this.STATUS.DECOMMISSIONED,
                        lastUpdated: new Date().toISOString()
                    }
                }
            );
            
            if (result.matchedCount === 0) {
                throw new Error(`Service not found: ${serviceId}`);
            }
            
            console.log(`✅ Service deregistered: ${serviceId}`);
            
            return {
                success: true,
                serviceId
            };
            
        } catch (error) {
            console.error(`❌ Service deregistration failed: ${error.message}`);
            throw error;
        }
    }

    // Validate service data
    validateServiceData(serviceData) {
        const required = ['companyName', 'domain', 'instanceId'];
        
        for (const field of required) {
            if (!serviceData[field]) {
                throw new Error(`Required field missing: ${field}`);
            }
        }
        
        // Validate domain format
        const domainPattern = /^mcp\.[a-z0-9-]+\.2100\.cool$/;
        if (!domainPattern.test(serviceData.domain)) {
            throw new Error(`Invalid domain format. Expected: mcp.{company}.2100.cool`);
        }
        
        // Validate instance ID format
        const instanceIdPattern = /^[a-z0-9]+-[a-z0-9]+-[a-z0-9]+$/;
        if (!instanceIdPattern.test(serviceData.instanceId)) {
            throw new Error(`Invalid instance ID format`);
        }
    }

    // Get service statistics
    async getStatistics(authToken) {
        await this.initialize();
        
        try {
            // Validate authorization
            await this.validateSAOAuthorization(authToken, this.SAO_LEVELS.EMERALD);
            
            const stats = await this.serviceCollection.aggregate([
                {
                    $group: {
                        _id: null,
                        totalServices: { $sum: 1 },
                        activeServices: {
                            $sum: { $cond: [{ $eq: ['$status', this.STATUS.ACTIVE] }, 1, 0] }
                        },
                        unhealthyServices: {
                            $sum: { $cond: [{ $eq: ['$status', this.STATUS.UNHEALTHY] }, 1, 0] }
                        },
                        maintenanceServices: {
                            $sum: { $cond: [{ $eq: ['$status', this.STATUS.MAINTENANCE] }, 1, 0] }
                        }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        totalServices: 1,
                        activeServices: 1,
                        unhealthyServices: 1,
                        maintenanceServices: 1,
                        uptimePercentage: {
                            $multiply: [
                                { $divide: ['$activeServices', '$totalServices'] },
                                100
                            ]
                        }
                    }
                }
            ]).toArray();
            
            const regionStats = await this.serviceCollection.aggregate([
                {
                    $group: {
                        _id: '$serviceInfo.region',
                        count: { $sum: 1 },
                        activeCount: {
                            $sum: { $cond: [{ $eq: ['$status', this.STATUS.ACTIVE] }, 1, 0] }
                        }
                    }
                }
            ]).toArray();
            
            return {
                success: true,
                statistics: stats[0] || {
                    totalServices: 0,
                    activeServices: 0,
                    unhealthyServices: 0,
                    maintenanceServices: 0,
                    uptimePercentage: 0
                },
                regionDistribution: regionStats,
                generatedAt: new Date().toISOString()
            };
            
        } catch (error) {
            console.error(`❌ Statistics query failed: ${error.message}`);
            throw error;
        }
    }

    // Close database connection
    async close() {
        if (this.client) {
            await this.client.close();
            this.isConnected = false;
            console.log(`🔌 MongoDB connection closed`);
        }
    }
}

module.exports = { MCPServiceRegistry };