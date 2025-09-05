const { exec } = require('child_process');
const { promisify } = require('util');
const admin = require('firebase-admin');
const axios = require('axios');

const execAsync = promisify(exec);

/**
 * Diamond CLI Warp Drive Replacement Manager
 * AI-driven conversational interface for application deployment and management
 * Replaces traditional Warp Drive CLI with natural language commands
 * Supports Docker, Kubernetes, Cloud Run, and general app deployment workflows
 * 
 * Examples:
 * - "deploy integration gateway app to cloud run"
 * - "scale owner interface app to 5 replicas"
 * - "rollback diamond sao app to previous version"
 * - "check deployment status of all apps"
 * - "create new app environment for testing"
 * - "update app environment variables for production"
 * - "build and deploy from github repository"
 */
class DiamondCLIWarpDriveManager {
    constructor() {
        this.diamondSAO = null;
        this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || process.env.GCP_PROJECT_ID;
        this.region = process.env.GOOGLE_CLOUD_REGION || 'us-west1';
        this.dockerRegistry = process.env.DOCKER_REGISTRY || 'gcr.io';
        
        // Initialize Firebase for Diamond SAO integration
        this.initializeFirebase();
        
        // App deployment configurations
        this.appConfigs = {
            'integration-gateway': {
                type: 'cloud-run',
                repo: 'integration-gateway',
                port: 8080,
                memory: '512Mi',
                cpu: '1000m'
            },
            'owner-interface': {
                type: 'cloud-run',
                repo: 'mocoa-owner-interface',
                port: 3000,
                memory: '1Gi',
                cpu: '1000m'
            },
            'diamond-sao': {
                type: 'kubernetes',
                repo: 'diamond-sao-command-center',
                port: 9000,
                replicas: 3
            }
        };
    }

    async initializeFirebase() {
        try {
            if (!admin.apps.length) {
                const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
                admin.initializeApp({
                    credential: admin.credential.cert(serviceAccount),
                    projectId: process.env.FIREBASE_PROJECT_ID
                });
            }
            this.firestore = admin.firestore();
            console.log('💎 Diamond SAO Firestore initialized for Warp Drive operations');
        } catch (error) {
            console.error('Failed to initialize Firebase:', error);
        }
    }

    async processConversationalCommand(naturalLanguageInput) {
        console.log(`💎 Diamond SAO processing Warp Drive command: "${naturalLanguageInput}"`);
        
        try {
            // Parse intent using Diamond SAO AI
            const warpDriveIntent = await this.parseWarpDriveIntent(naturalLanguageInput);
            
            // Generate deployment operations based on intent
            const warpDriveOperations = await this.generateWarpDriveOperations(warpDriveIntent);
            
            // Execute operations
            const executionResult = await this.executeWarpDriveOperations(warpDriveOperations);
            
            // Log to Diamond SAO Firestore
            await this.logOperationToFirestore({
                input: naturalLanguageInput,
                intent: warpDriveIntent,
                operations: warpDriveOperations,
                result: executionResult,
                timestamp: new Date(),
                method: 'diamond_sao_warp_drive_cli'
            });
            
            return {
                warpDriveIntent,
                warpDriveOperations,
                executionResult,
                diamondSaoProcessing: true
            };
            
        } catch (error) {
            console.error('💎 Diamond SAO Warp Drive operation failed:', error);
            throw error;
        }
    }

    async parseWarpDriveIntent(input) {
        const lowerInput = input.toLowerCase();
        
        let intent = {
            operation: 'unknown',
            confidence: 0.5,
            parameters: {}
        };

        // App deployment operations
        if (lowerInput.includes('deploy') && (lowerInput.includes('app') || this.containsAppName(input))) {
            intent = {
                operation: 'deploy_app',
                confidence: 0.9,
                parameters: {
                    app: this.extractAppName(input),
                    environment: this.extractEnvironment(input),
                    platform: this.extractPlatform(input),
                    source: this.extractSource(input),
                    config: this.extractDeploymentConfig(input)
                }
            };
        }
        
        // App scaling operations
        else if (lowerInput.includes('scale') && (lowerInput.includes('app') || this.containsAppName(input))) {
            intent = {
                operation: 'scale_app',
                confidence: 0.9,
                parameters: {
                    app: this.extractAppName(input),
                    replicas: this.extractReplicas(input),
                    environment: this.extractEnvironment(input)
                }
            };
        }
        
        // App rollback operations
        else if (lowerInput.includes('rollback') || lowerInput.includes('revert')) {
            intent = {
                operation: 'rollback_app',
                confidence: 0.85,
                parameters: {
                    app: this.extractAppName(input),
                    version: this.extractVersion(input),
                    environment: this.extractEnvironment(input)
                }
            };
        }
        
        // App status operations
        else if (lowerInput.includes('status') || lowerInput.includes('health') || lowerInput.includes('check')) {
            intent = {
                operation: 'check_app_status',
                confidence: 0.9,
                parameters: {
                    app: this.extractAppName(input) || 'all',
                    environment: this.extractEnvironment(input),
                    detailed: lowerInput.includes('detailed') || lowerInput.includes('full')
                }
            };
        }
        
        // Build operations
        else if (lowerInput.includes('build') && !lowerInput.includes('rebuild')) {
            intent = {
                operation: 'build_app',
                confidence: 0.85,
                parameters: {
                    app: this.extractAppName(input),
                    source: this.extractSource(input),
                    tag: this.extractTag(input),
                    push: lowerInput.includes('push') || lowerInput.includes('deploy')
                }
            };
        }
        
        // Environment management
        else if (lowerInput.includes('environment') || lowerInput.includes('env')) {
            if (lowerInput.includes('create') || lowerInput.includes('new')) {
                intent = {
                    operation: 'create_environment',
                    confidence: 0.8,
                    parameters: {
                        environment: this.extractEnvironment(input),
                        template: this.extractTemplate(input),
                        apps: this.extractApps(input)
                    }
                };
            } else if (lowerInput.includes('update') || lowerInput.includes('set')) {
                intent = {
                    operation: 'update_environment',
                    confidence: 0.8,
                    parameters: {
                        app: this.extractAppName(input),
                        environment: this.extractEnvironment(input),
                        variables: this.extractEnvironmentVariables(input)
                    }
                };
            }
        }
        
        // Log operations
        else if (lowerInput.includes('logs') || lowerInput.includes('log')) {
            intent = {
                operation: 'get_app_logs',
                confidence: 0.9,
                parameters: {
                    app: this.extractAppName(input),
                    environment: this.extractEnvironment(input),
                    tail: this.extractLogTail(input),
                    since: this.extractLogSince(input)
                }
            };
        }
        
        // Traffic management
        else if (lowerInput.includes('traffic') || lowerInput.includes('route')) {
            intent = {
                operation: 'manage_traffic',
                confidence: 0.8,
                parameters: {
                    app: this.extractAppName(input),
                    environment: this.extractEnvironment(input),
                    percentage: this.extractTrafficPercentage(input),
                    version: this.extractVersion(input)
                }
            };
        }
        
        // Auto-scaling configuration
        else if (lowerInput.includes('autoscale') || lowerInput.includes('auto-scale')) {
            intent = {
                operation: 'configure_autoscaling',
                confidence: 0.8,
                parameters: {
                    app: this.extractAppName(input),
                    environment: this.extractEnvironment(input),
                    minReplicas: this.extractMinReplicas(input),
                    maxReplicas: this.extractMaxReplicas(input),
                    targetCPU: this.extractTargetCPU(input)
                }
            };
        }

        return intent;
    }

    async generateWarpDriveOperations(intent) {
        const operations = [];
        
        switch (intent.operation) {
            case 'deploy_app':
                const appConfig = this.appConfigs[intent.parameters.app] || {};
                
                // Build step
                operations.push({
                    type: 'docker_build',
                    method: 'direct_docker_api',
                    command: 'build',
                    parameters: {
                        app: intent.parameters.app,
                        dockerfile: `./apps/${intent.parameters.app}/Dockerfile`,
                        tag: `${this.dockerRegistry}/${this.projectId}/${intent.parameters.app}:latest`,
                        context: `./apps/${intent.parameters.app}`
                    },
                    bypasses_warp_drive_cli: true
                });
                
                // Push step
                operations.push({
                    type: 'docker_push',
                    method: 'direct_docker_api',
                    command: 'push',
                    parameters: {
                        tag: `${this.dockerRegistry}/${this.projectId}/${intent.parameters.app}:latest`
                    },
                    bypasses_warp_drive_cli: true
                });
                
                // Deploy step
                if (appConfig.type === 'cloud-run' || intent.parameters.platform === 'cloud-run') {
                    operations.push({
                        type: 'cloud_run_deploy',
                        method: 'direct_gcloud_api',
                        command: 'run_deploy',
                        parameters: {
                            service: intent.parameters.app,
                            image: `${this.dockerRegistry}/${this.projectId}/${intent.parameters.app}:latest`,
                            platform: 'managed',
                            region: this.region,
                            port: appConfig.port || 8080,
                            memory: appConfig.memory || '512Mi',
                            cpu: appConfig.cpu || '1000m',
                            environment: intent.parameters.environment
                        },
                        bypasses_warp_drive_cli: true
                    });
                } else if (appConfig.type === 'kubernetes' || intent.parameters.platform === 'kubernetes') {
                    operations.push({
                        type: 'kubernetes_deploy',
                        method: 'direct_kubectl_api',
                        command: 'apply',
                        parameters: {
                            manifest: this.generateKubernetesManifest(intent.parameters.app, appConfig),
                            namespace: intent.parameters.environment || 'default'
                        },
                        bypasses_warp_drive_cli: true
                    });
                }
                break;
                
            case 'scale_app':
                operations.push({
                    type: 'app_scaling',
                    method: 'direct_platform_api',
                    command: 'scale',
                    parameters: {
                        app: intent.parameters.app,
                        replicas: intent.parameters.replicas,
                        environment: intent.parameters.environment
                    },
                    bypasses_warp_drive_cli: true
                });
                break;
                
            case 'rollback_app':
                operations.push({
                    type: 'app_rollback',
                    method: 'direct_platform_api',
                    command: 'rollback',
                    parameters: {
                        app: intent.parameters.app,
                        version: intent.parameters.version || 'previous',
                        environment: intent.parameters.environment
                    },
                    bypasses_warp_drive_cli: true
                });
                break;
                
            case 'check_app_status':
                operations.push({
                    type: 'status_check',
                    method: 'direct_platform_api',
                    command: 'status',
                    parameters: {
                        app: intent.parameters.app,
                        environment: intent.parameters.environment,
                        detailed: intent.parameters.detailed
                    },
                    bypasses_warp_drive_cli: true
                });
                break;
                
            case 'build_app':
                operations.push({
                    type: 'docker_build',
                    method: 'direct_docker_api',
                    command: 'build',
                    parameters: {
                        app: intent.parameters.app,
                        source: intent.parameters.source,
                        tag: intent.parameters.tag,
                        push: intent.parameters.push
                    },
                    bypasses_warp_drive_cli: true
                });
                break;
                
            case 'create_environment':
                operations.push({
                    type: 'environment_creation',
                    method: 'direct_platform_api',
                    command: 'create_namespace',
                    parameters: {
                        environment: intent.parameters.environment,
                        template: intent.parameters.template,
                        apps: intent.parameters.apps
                    },
                    bypasses_warp_drive_cli: true
                });
                break;
                
            case 'update_environment':
                operations.push({
                    type: 'environment_update',
                    method: 'direct_platform_api',
                    command: 'update_env_vars',
                    parameters: {
                        app: intent.parameters.app,
                        environment: intent.parameters.environment,
                        variables: intent.parameters.variables
                    },
                    bypasses_warp_drive_cli: true
                });
                break;
                
            case 'get_app_logs':
                operations.push({
                    type: 'log_retrieval',
                    method: 'direct_platform_api',
                    command: 'logs',
                    parameters: {
                        app: intent.parameters.app,
                        environment: intent.parameters.environment,
                        tail: intent.parameters.tail,
                        since: intent.parameters.since
                    },
                    bypasses_warp_drive_cli: true
                });
                break;
                
            case 'manage_traffic':
                operations.push({
                    type: 'traffic_management',
                    method: 'direct_platform_api',
                    command: 'update_traffic',
                    parameters: {
                        app: intent.parameters.app,
                        environment: intent.parameters.environment,
                        percentage: intent.parameters.percentage,
                        version: intent.parameters.version
                    },
                    bypasses_warp_drive_cli: true
                });
                break;
                
            case 'configure_autoscaling':
                operations.push({
                    type: 'autoscaling_configuration',
                    method: 'direct_platform_api',
                    command: 'configure_hpa',
                    parameters: {
                        app: intent.parameters.app,
                        environment: intent.parameters.environment,
                        minReplicas: intent.parameters.minReplicas,
                        maxReplicas: intent.parameters.maxReplicas,
                        targetCPU: intent.parameters.targetCPU
                    },
                    bypasses_warp_drive_cli: true
                });
                break;
        }
        
        return operations;
    }

    async executeWarpDriveOperations(operations) {
        const results = [];
        
        for (const operation of operations) {
            try {
                let result;
                
                switch (operation.command) {
                    case 'build':
                        result = await this.executeDemoDockerBuild(operation.parameters);
                        break;
                        
                    case 'push':
                        result = await this.executeDemoDockerPush(operation.parameters);
                        break;
                        
                    case 'run_deploy':
                        result = await this.executeDemoCloudRunDeploy(operation.parameters);
                        break;
                        
                    case 'apply':
                        result = await this.executeDemoKubernetesDeploy(operation.parameters);
                        break;
                        
                    case 'scale':
                        result = await this.executeDemoScale(operation.parameters);
                        break;
                        
                    case 'rollback':
                        result = await this.executeDemoRollback(operation.parameters);
                        break;
                        
                    case 'status':
                        result = await this.executeDemoStatus(operation.parameters);
                        break;
                        
                    case 'logs':
                        result = await this.executeDemoLogs(operation.parameters);
                        break;
                        
                    case 'update_traffic':
                        result = await this.executeDemoTrafficUpdate(operation.parameters);
                        break;
                        
                    case 'configure_hpa':
                        result = await this.executeDemoAutoscalingConfig(operation.parameters);
                        break;
                        
                    default:
                        result = { 
                            success: true, 
                            message: `Simulated ${operation.command} operation`,
                            simulated: true 
                        };
                }
                
                results.push({
                    operation: operation.type,
                    success: result.success,
                    result,
                    method: operation.method
                });
                
            } catch (error) {
                results.push({
                    operation: operation.type,
                    success: false,
                    error: error.message,
                    method: operation.method
                });
            }
        }
        
        return {
            operations_completed: results.length,
            successful_operations: results.filter(r => r.success).length,
            failed_operations: results.filter(r => !r.success).length,
            results,
            bypassed_warp_drive_cli: true,
            used_direct_platform_apis: true
        };
    }

    // Demo execution methods (in production, these would call actual APIs)
    async executeDemoDockerBuild(params) {
        return {
            success: true,
            message: `Built Docker image for ${params.app}`,
            tag: params.tag,
            built: true,
            simulated: true
        };
    }

    async executeDemoDockerPush(params) {
        return {
            success: true,
            message: `Pushed Docker image ${params.tag}`,
            pushed: true,
            simulated: true
        };
    }

    async executeDemoCloudRunDeploy(params) {
        return {
            success: true,
            message: `Deployed ${params.service} to Cloud Run`,
            url: `https://${params.service}-${params.region}-${this.projectId}.a.run.app`,
            platform: 'cloud-run',
            region: params.region,
            deployed: true,
            simulated: true
        };
    }

    async executeDemoKubernetesDeploy(params) {
        return {
            success: true,
            message: `Deployed to Kubernetes namespace ${params.namespace}`,
            namespace: params.namespace,
            platform: 'kubernetes',
            deployed: true,
            simulated: true
        };
    }

    async executeDemoScale(params) {
        return {
            success: true,
            message: `Scaled ${params.app} to ${params.replicas} replicas`,
            app: params.app,
            replicas: params.replicas,
            scaled: true,
            simulated: true
        };
    }

    async executeDemoRollback(params) {
        return {
            success: true,
            message: `Rolled back ${params.app} to ${params.version} version`,
            app: params.app,
            version: params.version,
            rolledBack: true,
            simulated: true
        };
    }

    async executeDemoStatus(params) {
        const apps = params.app === 'all' ? Object.keys(this.appConfigs) : [params.app];
        
        return {
            success: true,
            apps: apps.map(app => ({
                name: app,
                status: 'healthy',
                replicas: '3/3',
                uptime: '2h 15m',
                lastDeploy: '2024-01-15T10:30:00Z'
            })),
            environment: params.environment || 'production',
            simulated: true
        };
    }

    async executeDemoLogs(params) {
        return {
            success: true,
            message: `Retrieved logs for ${params.app}`,
            lines: 100,
            tail: params.tail,
            since: params.since,
            simulated: true
        };
    }

    async executeDemoTrafficUpdate(params) {
        return {
            success: true,
            message: `Updated traffic for ${params.app} to ${params.percentage}%`,
            app: params.app,
            percentage: params.percentage,
            version: params.version,
            updated: true,
            simulated: true
        };
    }

    async executeDemoAutoscalingConfig(params) {
        return {
            success: true,
            message: `Configured autoscaling for ${params.app}`,
            app: params.app,
            minReplicas: params.minReplicas,
            maxReplicas: params.maxReplicas,
            targetCPU: params.targetCPU,
            configured: true,
            simulated: true
        };
    }

    async logOperationToFirestore(operationData) {
        try {
            if (this.firestore) {
                await this.firestore.collection('diamond_sao_warp_drive_operations').add(operationData);
                console.log('💎 Warp Drive operation logged to Diamond SAO Firestore');
            }
        } catch (error) {
            console.error('Failed to log to Firestore:', error);
        }
    }

    // Helper methods for parsing natural language
    extractAppName(input) {
        const appNames = Object.keys(this.appConfigs);
        for (const app of appNames) {
            if (input.toLowerCase().includes(app.replace('-', ' '))) {
                return app;
            }
        }
        
        // Common app name patterns
        const patterns = [
            /(?:app|application|service) (?:called |named )?([a-zA-Z][-a-zA-Z0-9]*)/i,
            /deploy ([a-zA-Z][-a-zA-Z0-9]*)/i,
            /(integration[- ]gateway|owner[- ]interface|diamond[- ]sao)/i
        ];
        
        for (const pattern of patterns) {
            const match = input.match(pattern);
            if (match) {
                return match[1].toLowerCase().replace(/\s+/g, '-');
            }
        }
        
        return null;
    }

    containsAppName(input) {
        const appNames = Object.keys(this.appConfigs);
        return appNames.some(app => input.toLowerCase().includes(app.replace('-', ' ')));
    }

    extractEnvironment(input) {
        if (input.toLowerCase().includes('production') || input.toLowerCase().includes('prod')) {
            return 'production';
        }
        if (input.toLowerCase().includes('staging') || input.toLowerCase().includes('stage')) {
            return 'staging';
        }
        if (input.toLowerCase().includes('development') || input.toLowerCase().includes('dev')) {
            return 'development';
        }
        if (input.toLowerCase().includes('testing') || input.toLowerCase().includes('test')) {
            return 'testing';
        }
        return 'production';
    }

    extractPlatform(input) {
        if (input.toLowerCase().includes('cloud run') || input.toLowerCase().includes('cloudrun')) {
            return 'cloud-run';
        }
        if (input.toLowerCase().includes('kubernetes') || input.toLowerCase().includes('k8s')) {
            return 'kubernetes';
        }
        if (input.toLowerCase().includes('docker')) {
            return 'docker';
        }
        return 'cloud-run';
    }

    extractReplicas(input) {
        const replicaPattern = /(?:to |scale to |replicas? )(\d+)/i;
        const match = input.match(replicaPattern);
        return match ? parseInt(match[1]) : 3;
    }

    extractVersion(input) {
        const versionPattern = /version (\w+)/i;
        const match = input.match(versionPattern);
        return match ? match[1] : 'previous';
    }

    extractSource(input) {
        const sourcePattern = /from (github|gitlab|bitbucket|local)/i;
        const match = input.match(sourcePattern);
        return match ? match[1] : 'local';
    }

    extractTag(input) {
        const tagPattern = /tag ([a-zA-Z0-9.-]+)/i;
        const match = input.match(tagPattern);
        return match ? match[1] : 'latest';
    }

    extractDeploymentConfig(input) {
        return {
            strategy: input.toLowerCase().includes('blue-green') ? 'blue-green' : 'rolling',
            healthCheck: !input.toLowerCase().includes('no health'),
            autoScale: input.toLowerCase().includes('autoscale') || input.toLowerCase().includes('auto-scale')
        };
    }

    generateKubernetesManifest(appName, config) {
        return `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${appName}
spec:
  replicas: ${config.replicas || 3}
  selector:
    matchLabels:
      app: ${appName}
  template:
    metadata:
      labels:
        app: ${appName}
    spec:
      containers:
      - name: ${appName}
        image: ${this.dockerRegistry}/${this.projectId}/${appName}:latest
        ports:
        - containerPort: ${config.port || 8080}
        `;
    }

    extractTemplate(input) {
        if (input.toLowerCase().includes('production')) return 'production';
        if (input.toLowerCase().includes('development')) return 'development';
        return 'basic';
    }

    extractApps(input) {
        return Object.keys(this.appConfigs);
    }

    extractEnvironmentVariables(input) {
        // In production, this would parse environment variables from the input
        return {
            ENVIRONMENT: this.extractEnvironment(input),
            MANAGED_BY: 'diamond-sao'
        };
    }

    extractLogTail(input) {
        const tailPattern = /tail (\d+)/i;
        const match = input.match(tailPattern);
        return match ? parseInt(match[1]) : 100;
    }

    extractLogSince(input) {
        const sincePattern = /since (\d+[hmd])/i;
        const match = input.match(sincePattern);
        return match ? match[1] : '1h';
    }

    extractTrafficPercentage(input) {
        const percentPattern = /(\d+)%/;
        const match = input.match(percentPattern);
        return match ? parseInt(match[1]) : 100;
    }

    extractMinReplicas(input) {
        const minPattern = /min(?:imum)? (\d+)/i;
        const match = input.match(minPattern);
        return match ? parseInt(match[1]) : 1;
    }

    extractMaxReplicas(input) {
        const maxPattern = /max(?:imum)? (\d+)/i;
        const match = input.match(maxPattern);
        return match ? parseInt(match[1]) : 10;
    }

    extractTargetCPU(input) {
        const cpuPattern = /cpu (\d+)%/i;
        const match = input.match(cpuPattern);
        return match ? parseInt(match[1]) : 80;
    }
}

module.exports = DiamondCLIWarpDriveManager;
