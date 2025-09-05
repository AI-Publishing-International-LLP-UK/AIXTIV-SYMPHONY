const { MongoClient } = require('mongodb');
const admin = require('firebase-admin');

/**
 * Diamond CLI MongoDB Manager
 * AI-driven conversational interface for MongoDB operations
 * Replaces traditional mongo CLI with natural language commands
 * 
 * Examples:
 * - "create database for user profiles"
 * - "add user collection with email and name fields"
 * - "find all users where status is active"
 * - "backup production database to cloud storage"
 * - "create index on email field for users collection"
 */
class DiamondCLIMongoDBManager {
    constructor() {
        this.diamondSAO = null;
        this.mongoClient = null;
        this.db = null;
        this.connectionString = process.env.MONGODB_CONNECTION_STRING;
        this.defaultDatabase = process.env.MONGODB_DEFAULT_DATABASE || 'diamond_sao';
        
        // Initialize Firebase for Diamond SAO integration
        this.initializeFirebase();
        
        // Connect to MongoDB
        this.connectToMongoDB();
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
            console.log('💎 Diamond SAO Firestore initialized for MongoDB operations');
        } catch (error) {
            console.error('Failed to initialize Firebase:', error);
        }
    }

    async connectToMongoDB() {
        try {
            if (!this.connectionString) {
                console.warn('MongoDB connection string not found in environment variables');
                return;
            }
            
            this.mongoClient = new MongoClient(this.connectionString, {
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
            
            await this.mongoClient.connect();
            this.db = this.mongoClient.db(this.defaultDatabase);
            console.log('💎 Connected to MongoDB via Diamond SAO');
        } catch (error) {
            console.error('MongoDB connection failed:', error);
        }
    }

    async processConversationalCommand(naturalLanguageInput) {
        console.log(`💎 Diamond SAO processing MongoDB command: "${naturalLanguageInput}"`);
        
        try {
            // Parse intent using Diamond SAO AI
            const mongoIntent = await this.parseMongoDBIntent(naturalLanguageInput);
            
            // Generate MongoDB operations based on intent
            const mongoOperations = await this.generateMongoDBOperations(mongoIntent);
            
            // Execute operations
            const executionResult = await this.executeMongoDBOperations(mongoOperations);
            
            // Log to Diamond SAO Firestore
            await this.logOperationToFirestore({
                input: naturalLanguageInput,
                intent: mongoIntent,
                operations: mongoOperations,
                result: executionResult,
                timestamp: new Date(),
                method: 'diamond_sao_mongodb_cli'
            });
            
            return {
                mongoIntent,
                mongoOperations,
                executionResult,
                diamondSaoProcessing: true
            };
            
        } catch (error) {
            console.error('💎 Diamond SAO MongoDB operation failed:', error);
            throw error;
        }
    }

    async parseMongoDBIntent(input) {
        // Simulate Diamond SAO AI intent parsing
        const lowerInput = input.toLowerCase();
        
        let intent = {
            operation: 'unknown',
            confidence: 0.5,
            parameters: {}
        };

        // Database operations
        if (lowerInput.includes('create') && lowerInput.includes('database')) {
            intent = {
                operation: 'create_database',
                confidence: 0.9,
                parameters: {
                    dbName: this.extractDatabaseName(input) || 'new_database',
                    purpose: this.extractPurpose(input)
                }
            };
        }
        
        // Collection operations
        else if (lowerInput.includes('create') && (lowerInput.includes('collection') || lowerInput.includes('table'))) {
            intent = {
                operation: 'create_collection',
                confidence: 0.9,
                parameters: {
                    collection: this.extractCollectionName(input) || 'new_collection',
                    fields: this.extractFields(input),
                    indexes: this.extractIndexes(input)
                }
            };
        }
        
        // Data query operations
        else if (lowerInput.includes('find') || lowerInput.includes('search') || lowerInput.includes('get')) {
            intent = {
                operation: 'query_data',
                confidence: 0.85,
                parameters: {
                    collection: this.extractCollectionName(input) || 'users',
                    filters: this.extractFilters(input),
                    limit: this.extractLimit(input)
                }
            };
        }
        
        // Data insertion
        else if (lowerInput.includes('add') || lowerInput.includes('insert') || lowerInput.includes('create')) {
            intent = {
                operation: 'insert_data',
                confidence: 0.85,
                parameters: {
                    collection: this.extractCollectionName(input) || 'users',
                    data: this.extractDataFields(input)
                }
            };
        }
        
        // Index operations
        else if (lowerInput.includes('index') || lowerInput.includes('optimize')) {
            intent = {
                operation: 'create_index',
                confidence: 0.8,
                parameters: {
                    collection: this.extractCollectionName(input) || 'users',
                    field: this.extractIndexField(input),
                    type: this.extractIndexType(input)
                }
            };
        }
        
        // Backup operations
        else if (lowerInput.includes('backup') || lowerInput.includes('export')) {
            intent = {
                operation: 'backup_database',
                confidence: 0.9,
                parameters: {
                    database: this.extractDatabaseName(input) || this.defaultDatabase,
                    destination: this.extractBackupDestination(input)
                }
            };
        }
        
        // User management
        else if (lowerInput.includes('user') && (lowerInput.includes('create') || lowerInput.includes('add'))) {
            intent = {
                operation: 'create_user',
                confidence: 0.85,
                parameters: {
                    username: this.extractUsername(input),
                    database: this.extractDatabaseName(input) || this.defaultDatabase,
                    roles: this.extractRoles(input)
                }
            };
        }
        
        // Status and monitoring
        else if (lowerInput.includes('status') || lowerInput.includes('health') || lowerInput.includes('monitor')) {
            intent = {
                operation: 'check_status',
                confidence: 0.9,
                parameters: {
                    scope: this.extractStatusScope(input)
                }
            };
        }

        return intent;
    }

    async generateMongoDBOperations(intent) {
        const operations = [];
        
        switch (intent.operation) {
            case 'create_database':
                operations.push({
                    type: 'database_creation',
                    method: 'direct_mongodb_api',
                    command: 'use',
                    parameters: {
                        database: intent.parameters.dbName
                    },
                    bypasses_mongo_cli: true
                });
                break;
                
            case 'create_collection':
                operations.push({
                    type: 'collection_creation',
                    method: 'direct_mongodb_api',
                    command: 'createCollection',
                    parameters: {
                        name: intent.parameters.collection,
                        options: {
                            validator: this.generateValidator(intent.parameters.fields)
                        }
                    },
                    bypasses_mongo_cli: true
                });
                
                // Add indexes if specified
                if (intent.parameters.indexes && intent.parameters.indexes.length > 0) {
                    intent.parameters.indexes.forEach(index => {
                        operations.push({
                            type: 'index_creation',
                            method: 'direct_mongodb_api',
                            command: 'createIndex',
                            parameters: {
                                collection: intent.parameters.collection,
                                index: { [index.field]: index.direction || 1 }
                            }
                        });
                    });
                }
                break;
                
            case 'query_data':
                operations.push({
                    type: 'data_query',
                    method: 'direct_mongodb_api',
                    command: 'find',
                    parameters: {
                        collection: intent.parameters.collection,
                        filter: intent.parameters.filters || {},
                        options: {
                            limit: intent.parameters.limit || 100
                        }
                    },
                    bypasses_mongo_cli: true
                });
                break;
                
            case 'insert_data':
                operations.push({
                    type: 'data_insertion',
                    method: 'direct_mongodb_api',
                    command: 'insertOne',
                    parameters: {
                        collection: intent.parameters.collection,
                        document: intent.parameters.data
                    },
                    bypasses_mongo_cli: true
                });
                break;
                
            case 'create_index':
                operations.push({
                    type: 'index_creation',
                    method: 'direct_mongodb_api',
                    command: 'createIndex',
                    parameters: {
                        collection: intent.parameters.collection,
                        index: { [intent.parameters.field]: 1 },
                        options: { background: true }
                    },
                    bypasses_mongo_cli: true
                });
                break;
                
            case 'backup_database':
                operations.push({
                    type: 'database_backup',
                    method: 'direct_mongodb_api',
                    command: 'mongodump_equivalent',
                    parameters: {
                        database: intent.parameters.database,
                        destination: intent.parameters.destination || 'gcs_backup_bucket'
                    },
                    bypasses_mongo_cli: true
                });
                break;
                
            case 'create_user':
                operations.push({
                    type: 'user_creation',
                    method: 'direct_mongodb_api',
                    command: 'createUser',
                    parameters: {
                        user: intent.parameters.username,
                        pwd: 'generated_secure_password',
                        roles: intent.parameters.roles || ['read']
                    },
                    bypasses_mongo_cli: true
                });
                break;
                
            case 'check_status':
                operations.push({
                    type: 'status_check',
                    method: 'direct_mongodb_api',
                    command: 'serverStatus',
                    parameters: {
                        scope: intent.parameters.scope || 'all'
                    },
                    bypasses_mongo_cli: true
                });
                break;
        }
        
        return operations;
    }

    async executeMongoDBOperations(operations) {
        const results = [];
        
        for (const operation of operations) {
            try {
                let result;
                
                switch (operation.command) {
                    case 'use':
                        // Switch database
                        this.db = this.mongoClient.db(operation.parameters.database);
                        result = { success: true, database: operation.parameters.database };
                        break;
                        
                    case 'createCollection':
                        result = await this.db.createCollection(
                            operation.parameters.name, 
                            operation.parameters.options
                        );
                        break;
                        
                    case 'find':
                        const collection = this.db.collection(operation.parameters.collection);
                        const documents = await collection.find(
                            operation.parameters.filter,
                            operation.parameters.options
                        ).toArray();
                        result = { documents, count: documents.length };
                        break;
                        
                    case 'insertOne':
                        const insertCollection = this.db.collection(operation.parameters.collection);
                        result = await insertCollection.insertOne(operation.parameters.document);
                        break;
                        
                    case 'createIndex':
                        const indexCollection = this.db.collection(operation.parameters.collection);
                        result = await indexCollection.createIndex(
                            operation.parameters.index,
                            operation.parameters.options
                        );
                        break;
                        
                    case 'createUser':
                        // Note: In production, use proper user management
                        result = { 
                            success: true, 
                            message: `User ${operation.parameters.user} created with roles: ${operation.parameters.roles.join(', ')}`,
                            simulated: true 
                        };
                        break;
                        
                    case 'serverStatus':
                        result = await this.db.admin().serverStatus();
                        break;
                        
                    case 'mongodump_equivalent':
                        // Simulate backup operation
                        result = { 
                            success: true, 
                            message: `Backup of ${operation.parameters.database} initiated to ${operation.parameters.destination}`,
                            simulated: true 
                        };
                        break;
                        
                    default:
                        result = { success: false, error: `Unsupported operation: ${operation.command}` };
                }
                
                results.push({
                    operation: operation.type,
                    success: true,
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
            bypassed_mongo_cli: true,
            used_direct_mongodb_api: true
        };
    }

    async logOperationToFirestore(operationData) {
        try {
            if (this.firestore) {
                await this.firestore.collection('diamond_sao_mongodb_operations').add(operationData);
                console.log('💎 MongoDB operation logged to Diamond SAO Firestore');
            }
        } catch (error) {
            console.error('Failed to log to Firestore:', error);
        }
    }

    // Helper methods for parsing natural language
    extractDatabaseName(input) {
        const patterns = [
            /database (?:called |named |for )?([a-zA-Z_][a-zA-Z0-9_]*)/i,
            /db (?:called |named |for )?([a-zA-Z_][a-zA-Z0-9_]*)/i,
            /for ([a-zA-Z_][a-zA-Z0-9_]*) database/i
        ];
        
        for (const pattern of patterns) {
            const match = input.match(pattern);
            if (match) return match[1];
        }
        return null;
    }

    extractCollectionName(input) {
        const patterns = [
            /collection (?:called |named |for )?([a-zA-Z_][a-zA-Z0-9_]*)/i,
            /table (?:called |named |for )?([a-zA-Z_][a-zA-Z0-9_]*)/i,
            /([a-zA-Z_][a-zA-Z0-9_]*) collection/i,
            /(users?|products?|orders?|customers?|profiles?|accounts?|sessions?|logs?)/i
        ];
        
        for (const pattern of patterns) {
            const match = input.match(pattern);
            if (match) return match[1];
        }
        return null;
    }

    extractFields(input) {
        const fieldPattern = /with fields? ([^.!?]+)/i;
        const match = input.match(fieldPattern);
        if (!match) return [];
        
        return match[1].split(/,|\sand\s/).map(field => field.trim());
    }

    extractFilters(input) {
        const filters = {};
        
        // Extract where conditions
        const wherePattern = /where (\w+) is (\w+)/i;
        const match = input.match(wherePattern);
        if (match) {
            filters[match[1]] = match[2];
        }
        
        return filters;
    }

    extractLimit(input) {
        const limitPattern = /(?:limit|top|first) (\d+)/i;
        const match = input.match(limitPattern);
        return match ? parseInt(match[1]) : 100;
    }

    extractDataFields(input) {
        // Simple data extraction - in production, use more sophisticated parsing
        return {
            created_at: new Date(),
            source: 'diamond_sao_cli',
            processed: true
        };
    }

    extractIndexField(input) {
        const patterns = [
            /index on (\w+)/i,
            /(\w+) field/i,
            /(\w+) index/i
        ];
        
        for (const pattern of patterns) {
            const match = input.match(pattern);
            if (match) return match[1];
        }
        return 'id';
    }

    extractIndexType(input) {
        if (input.includes('text')) return 'text';
        if (input.includes('unique')) return 'unique';
        return 'standard';
    }

    generateValidator(fields) {
        if (!fields || fields.length === 0) return {};
        
        const properties = {};
        fields.forEach(field => {
            properties[field] = { bsonType: 'string' };
        });
        
        return {
            $jsonSchema: {
                bsonType: 'object',
                properties
            }
        };
    }

    extractPurpose(input) {
        const purposePattern = /for ([^.!?]+)/i;
        const match = input.match(purposePattern);
        return match ? match[1].trim() : 'general purpose';
    }

    extractIndexes(input) {
        // Extract index specifications from natural language
        const indexes = [];
        if (input.includes('email index') || input.includes('index on email')) {
            indexes.push({ field: 'email', direction: 1 });
        }
        if (input.includes('unique')) {
            indexes.push({ field: 'id', direction: 1, unique: true });
        }
        return indexes;
    }

    extractBackupDestination(input) {
        if (input.includes('cloud') || input.includes('gcs') || input.includes('bucket')) {
            return 'gcs_backup_bucket';
        }
        if (input.includes('local')) {
            return 'local_backup';
        }
        return 'default_backup_location';
    }

    extractUsername(input) {
        const patterns = [
            /user (?:called |named )?([a-zA-Z_][a-zA-Z0-9_]*)/i,
            /create ([a-zA-Z_][a-zA-Z0-9_]*) user/i
        ];
        
        for (const pattern of patterns) {
            const match = input.match(pattern);
            if (match) return match[1];
        }
        return 'new_user';
    }

    extractRoles(input) {
        const roles = [];
        if (input.includes('admin')) roles.push('dbAdmin');
        if (input.includes('read')) roles.push('read');
        if (input.includes('write')) roles.push('readWrite');
        return roles.length > 0 ? roles : ['read'];
    }

    extractStatusScope(input) {
        if (input.includes('all') || input.includes('full')) return 'all';
        if (input.includes('connection')) return 'connections';
        if (input.includes('performance')) return 'performance';
        return 'basic';
    }

    async cleanup() {
        if (this.mongoClient) {
            await this.mongoClient.close();
        }
    }
}

module.exports = DiamondCLIMongoDBManager;
