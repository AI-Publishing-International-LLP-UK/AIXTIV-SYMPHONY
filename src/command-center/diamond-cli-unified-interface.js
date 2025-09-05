const DiamondCLIDNSManager = require('./diamond-cli-dns-manager');
const DiamondCLIWorkersManager = require('./diamond-cli-workers-manager');
const DiamondCLIMongoDBManager = require('./diamond-cli-mongodb-manager');
const DiamondCLIGCPSecretsManager = require('./diamond-cli-gcp-secrets-manager');
const DiamondCLIWarpDriveManager = require('./diamond-cli-warp-drive-manager');

/**
 * Diamond CLI Unified Interface
 * Master conversational interface that routes natural language commands
 * to the appropriate specialized manager based on AI intent recognition
 * 
 * Replaces all traditional CLI tools with a single conversational interface:
 * - DNS Management (replaces gcloud CLI)
 * - Cloudflare Workers (replaces Wrangler CLI) 
 * - MongoDB Operations (replaces mongo CLI)
 * - GCP Secrets (replaces gcloud secrets CLI)
 * - App Deployment (replaces Warp Drive CLI)
 * 
 * Examples:
 * - "update mcp domain to point to integration gateway"
 * - "deploy integration gateway worker to cloudflare"
 * - "create database for user profiles"
 * - "get the api key secret from production"
 * - "scale owner interface app to 5 replicas"
 */
class DiamondCLIUnifiedInterface {
    constructor() {
        this.diamondSAO = null;
        
        // Initialize all specialized managers
        this.dnsManager = new DiamondCLIDNSManager();
        this.workersManager = new DiamondCLIWorkersManager();
        this.mongodbManager = new DiamondCLIMongoDBManager();
        this.secretsManager = new DiamondCLIGCPSecretsManager();
        this.warpDriveManager = new DiamondCLIWarpDriveManager();
        
        console.log('💎 Diamond SAO Unified CLI Interface initialized - All traditional CLI tools replaced');
    }

    async processConversationalCommand(naturalLanguageInput) {
        console.log(`💎 Diamond SAO processing unified command: "${naturalLanguageInput}"`);
        
        try {
            // Parse overall intent to determine which manager to use
            const overallIntent = await this.parseOverallIntent(naturalLanguageInput);
            
            let result;
            
            switch (overallIntent.category) {
                case 'dns':
                    console.log('💎 Routing to Diamond DNS Manager...');
                    result = await this.dnsManager.processConversationalCommand(naturalLanguageInput);
                    break;
                    
                case 'workers':
                    console.log('💎 Routing to Diamond Cloudflare Workers Manager...');
                    result = await this.workersManager.processConversationalCommand(naturalLanguageInput);
                    break;
                    
                case 'mongodb':
                    console.log('💎 Routing to Diamond MongoDB Manager...');
                    result = await this.mongodbManager.processConversationalCommand(naturalLanguageInput);
                    break;
                    
                case 'secrets':
                    console.log('💎 Routing to Diamond GCP Secrets Manager...');
                    result = await this.secretsManager.processConversationalCommand(naturalLanguageInput);
                    break;
                    
                case 'deployment':
                    console.log('💎 Routing to Diamond Warp Drive Manager...');
                    result = await this.warpDriveManager.processConversationalCommand(naturalLanguageInput);
                    break;
                    
                case 'multi_service':
                    console.log('💎 Processing multi-service operation...');
                    result = await this.processMultiServiceOperation(naturalLanguageInput, overallIntent.services);
                    break;
                    
                default:
                    console.log('💎 Providing universal assistance...');
                    result = await this.provideUniversalAssistance(naturalLanguageInput, overallIntent);
                    break;
            }
            
            // Add unified interface metadata
            result.unifiedInterface = {
                category: overallIntent.category,
                confidence: overallIntent.confidence,
                processedBy: 'diamond_sao_unified_cli',
                timestamp: new Date()
            };
            
            return result;
            
        } catch (error) {
            console.error('💎 Diamond SAO Unified Interface error:', error);
            throw error;
        }
    }

    async parseOverallIntent(input) {
        const lowerInput = input.toLowerCase();
        
        // DNS-related keywords
        const dnsKeywords = ['dns', 'domain', 'subdomain', 'mcp', 'record', 'cname', 'a record', 'nameserver'];
        if (dnsKeywords.some(keyword => lowerInput.includes(keyword))) {
            return {
                category: 'dns',
                confidence: 0.9,
                reasoning: 'Contains DNS/domain-related keywords'
            };
        }
        
        // Workers/Cloudflare-related keywords
        const workersKeywords = ['worker', 'cloudflare', 'wrangler', 'kv', 'durable', 'edge', 'cdn'];
        if (workersKeywords.some(keyword => lowerInput.includes(keyword))) {
            return {
                category: 'workers',
                confidence: 0.9,
                reasoning: 'Contains Cloudflare Workers-related keywords'
            };
        }
        
        // MongoDB-related keywords
        const mongoKeywords = ['database', 'collection', 'document', 'mongo', 'mongodb', 'db', 'query', 'index'];
        if (mongoKeywords.some(keyword => lowerInput.includes(keyword))) {
            return {
                category: 'mongodb',
                confidence: 0.85,
                reasoning: 'Contains MongoDB/database-related keywords'
            };
        }
        
        // Secrets-related keywords
        const secretsKeywords = ['secret', 'password', 'key', 'credential', 'token', 'api key', 'jwt'];
        if (secretsKeywords.some(keyword => lowerInput.includes(keyword))) {
            return {
                category: 'secrets',
                confidence: 0.9,
                reasoning: 'Contains secrets/credentials-related keywords'
            };
        }
        
        // Deployment/App-related keywords
        const deploymentKeywords = ['deploy', 'scale', 'rollback', 'app', 'application', 'service', 'build', 'container', 'kubernetes', 'cloud run'];
        if (deploymentKeywords.some(keyword => lowerInput.includes(keyword))) {
            return {
                category: 'deployment',
                confidence: 0.85,
                reasoning: 'Contains deployment/application-related keywords'
            };
        }
        
        // Multi-service operations
        const multiServiceIndicators = ['and', 'then', 'also', 'plus', 'after'];
        if (multiServiceIndicators.some(indicator => lowerInput.includes(indicator))) {
            const detectedServices = [];
            if (dnsKeywords.some(keyword => lowerInput.includes(keyword))) detectedServices.push('dns');
            if (workersKeywords.some(keyword => lowerInput.includes(keyword))) detectedServices.push('workers');
            if (deploymentKeywords.some(keyword => lowerInput.includes(keyword))) detectedServices.push('deployment');
            
            if (detectedServices.length > 1) {
                return {
                    category: 'multi_service',
                    confidence: 0.8,
                    services: detectedServices,
                    reasoning: 'Contains multiple service indicators'
                };
            }
        }
        
        // Status/monitoring requests
        if (lowerInput.includes('status') || lowerInput.includes('health') || lowerInput.includes('check')) {
            return {
                category: 'status_check',
                confidence: 0.8,
                reasoning: 'Status/health check request'
            };
        }
        
        return {
            category: 'unknown',
            confidence: 0.5,
            reasoning: 'Unable to determine specific service category'
        };
    }

    async processMultiServiceOperation(input, services) {
        console.log(`💎 Processing multi-service operation involving: ${services.join(', ')}`);
        
        const results = {};
        
        // Process each service sequentially
        for (const service of services) {
            try {
                let serviceResult;
                
                switch (service) {
                    case 'dns':
                        serviceResult = await this.dnsManager.processConversationalCommand(input);
                        break;
                    case 'workers':
                        serviceResult = await this.workersManager.processConversationalCommand(input);
                        break;
                    case 'deployment':
                        serviceResult = await this.warpDriveManager.processConversationalCommand(input);
                        break;
                }
                
                results[service] = serviceResult;
                
            } catch (error) {
                results[service] = {
                    success: false,
                    error: error.message
                };
            }
        }
        
        return {
            multiServiceOperation: true,
            services,
            results,
            summary: this.generateMultiServiceSummary(results)
        };
    }

    generateMultiServiceSummary(results) {
        const successful = Object.keys(results).filter(service => 
            results[service].executionResult?.successful_operations > 0 || 
            results[service].success !== false
        );
        
        const failed = Object.keys(results).filter(service => 
            results[service].success === false ||
            results[service].executionResult?.failed_operations > 0
        );
        
        return {
            total_services: Object.keys(results).length,
            successful_services: successful.length,
            failed_services: failed.length,
            successful: successful,
            failed: failed
        };
    }

    async provideUniversalAssistance(input, intent) {
        // Provide helpful guidance when intent is unclear
        return {
            universalAssistance: true,
            input: input,
            intent: intent,
            guidance: {
                message: "I can help you with infrastructure management across multiple services.",
                capabilities: [
                    {
                        service: "DNS Management",
                        example: "update mcp domain to point to integration gateway",
                        description: "Manage DNS records, domains, and routing"
                    },
                    {
                        service: "Cloudflare Workers",
                        example: "deploy integration gateway worker",
                        description: "Deploy and manage edge computing functions"
                    },
                    {
                        service: "MongoDB",
                        example: "create database for user profiles",
                        description: "Database operations, collections, and queries"
                    },
                    {
                        service: "GCP Secrets",
                        example: "get the api key secret from production",
                        description: "Secure secret storage and access management"
                    },
                    {
                        service: "App Deployment",
                        example: "deploy owner interface app to cloud run",
                        description: "Application deployment, scaling, and management"
                    }
                ],
                suggestion: `Based on your input "${input}", you might want to be more specific about what you'd like to accomplish.`
            },
            executionResult: {
                operations_completed: 1,
                successful_operations: 1,
                failed_operations: 0,
                results: [
                    {
                        operation: 'universal_guidance',
                        success: true,
                        result: {
                            guidance_provided: true,
                            capabilities_listed: 5
                        }
                    }
                ]
            }
        };
    }

    // Convenience methods for direct service access
    async processDNSCommand(command) {
        return await this.dnsManager.processConversationalCommand(command);
    }

    async processWorkersCommand(command) {
        return await this.workersManager.processConversationalCommand(command);
    }

    async processMongoDBCommand(command) {
        return await this.mongodbManager.processConversationalCommand(command);
    }

    async processSecretsCommand(command) {
        return await this.secretsManager.processConversationalCommand(command);
    }

    async processDeploymentCommand(command) {
        return await this.warpDriveManager.processConversationalCommand(command);
    }

    // Status check across all services
    async checkAllServicesStatus() {
        const statusChecks = await Promise.allSettled([
            this.processDNSCommand('check dns status'),
            this.processWorkersCommand('check worker status'),
            this.processDeploymentCommand('check deployment status of all apps')
        ]);

        return {
            overall_status: 'multi_service_check',
            services: {
                dns: statusChecks[0].status === 'fulfilled' ? statusChecks[0].value : { error: statusChecks[0].reason },
                workers: statusChecks[1].status === 'fulfilled' ? statusChecks[1].value : { error: statusChecks[1].reason },
                deployment: statusChecks[2].status === 'fulfilled' ? statusChecks[2].value : { error: statusChecks[2].reason }
            },
            timestamp: new Date()
        };
    }

    // Get all available commands
    getAvailableCommands() {
        return {
            dns: [
                "update [domain] to point to [service]",
                "create dns record for [domain]",
                "check dns status",
                "delete dns record for [domain]"
            ],
            workers: [
                "deploy [worker] to cloudflare",
                "check worker status",
                "update worker [name]",
                "delete worker [name]"
            ],
            mongodb: [
                "create database for [purpose]",
                "find all [collection] where [condition]",
                "create index on [field] for [collection]",
                "backup [database] to cloud storage"
            ],
            secrets: [
                "create secret for [purpose]",
                "get [secret] from [environment]",
                "update [secret] in [environment]",
                "list all secrets"
            ],
            deployment: [
                "deploy [app] to [platform]",
                "scale [app] to [replicas] replicas",
                "check deployment status of [app]",
                "rollback [app] to previous version"
            ]
        };
    }
}

module.exports = DiamondCLIUnifiedInterface;
