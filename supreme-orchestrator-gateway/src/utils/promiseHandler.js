/**
 * Supreme Orchestrator Gateway - Promise Handler Utility
 * Enhanced Promise Infrastructure for Dr. Claude sRIX Communications
 * Location: us-central1-a MOCORIX2
 */

const winston = require('winston');

class SupremePromiseHandler {
    constructor() {
        this.activePromises = new Map();
        this.promiseTimeouts = new Map();
        this.logger = this.setupLogger();
        this.setupGlobalHandlers();
    }

    /**
     * Setup dedicated Promise logger
     */
    setupLogger() {
        return winston.createLogger({
            level: 'debug',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            defaultMeta: { 
                component: 'supreme-promise-handler',
                location: 'us-central1-a/MOCORIX2'
            },
            transports: [
                new winston.transports.File({
                    filename: '/var/log/supreme-orchestrator/promise-errors.log',
                    maxsize: 50 * 1024 * 1024,
                    maxFiles: 5
                }),
                new winston.transports.Console({
                    level: 'error'
                })
            ]
        });
    }

    /**
     * Setup global Promise error handlers for Supreme Orchestrator
     */
    setupGlobalHandlers() {
        // Unhandled Promise rejections
        process.on('unhandledRejection', (reason, promise) => {
            const promiseId = this.getPromiseId(promise);
            
            this.logger.error('Supreme Orchestrator: Unhandled Promise Rejection', {
                promiseId,
                reason: this.serializeError(reason),
                stack: reason?.stack,
                location: 'us-central1-a/MOCORIX2',
                supremeOrchestrator: 'Dr. Claude sRIX',
                timestamp: new Date().toISOString()
            });

            // Clean up promise tracking
            this.cleanupPromise(promiseId);
        });

        // Uncaught exceptions
        process.on('uncaughtException', (error) => {
            this.logger.error('Supreme Orchestrator: Uncaught Exception', {
                error: this.serializeError(error),
                stack: error.stack,
                location: 'us-central1-a/MOCORIX2',
                supremeOrchestrator: 'Dr. Claude sRIX',
                timestamp: new Date().toISOString()
            });

            // Graceful shutdown for critical errors
            setTimeout(() => {
                process.exit(1);
            }, 1000);
        });
    }

    /**
     * Safely resolve any value to prevent [object Promise] errors
     */
    async safeResolve(value, options = {}) {
        const {
            timeout = 30000, // 30 seconds default
            context = 'unknown',
            correlationId = null
        } = options;

        const promiseId = this.generatePromiseId(context, correlationId);
        
        try {
            // Track the promise
            this.trackPromise(promiseId, { context, correlationId, timeout });

            // Handle Promise objects
            if (value && typeof value.then === 'function') {
                this.logger.debug('Supreme Orchestrator: Resolving Promise', {
                    promiseId,
                    context,
                    correlationId,
                    timeout
                });

                // Add timeout protection
                const timeoutPromise = new Promise((_, reject) => {
                    const timeoutId = setTimeout(() => {
                        reject(new Error(`Supreme Orchestrator: Promise timeout after ${timeout}ms`));
                    }, timeout);
                    
                    this.promiseTimeouts.set(promiseId, timeoutId);
                });

                // Race between the actual promise and timeout
                const resolved = await Promise.race([value, timeoutPromise]);
                
                this.cleanupPromise(promiseId);
                
                this.logger.debug('Supreme Orchestrator: Promise resolved successfully', {
                    promiseId,
                    context,
                    correlationId,
                    resolved: this.serializeSafely(resolved)
                });

                return resolved;
            }

            // Handle non-Promise values
            this.cleanupPromise(promiseId);
            return value;

        } catch (error) {
            this.cleanupPromise(promiseId);
            
            this.logger.error('Supreme Orchestrator: Promise resolution error', {
                promiseId,
                context,
                correlationId,
                error: this.serializeError(error),
                stack: error.stack
            });

            // Return safe fallback to prevent [object Promise] errors
            return this.createSafeFallback(error, context);
        }
    }

    /**
     * Serialize data for Supreme Orchestrator <-> UAO communication
     */
    async serializeForSupremeComm(value, options = {}) {
        const {
            context = 'supreme-uao-communication',
            correlationId = null
        } = options;

        try {
            // First resolve any promises
            const resolved = await this.safeResolve(value, { context, correlationId });

            // Handle null/undefined
            if (resolved === null || resolved === undefined) {
                return resolved;
            }

            // Handle objects - critical for UAO communication
            if (typeof resolved === 'object') {
                try {
                    // Deep serialize to prevent any nested Promise objects
                    const serialized = JSON.parse(JSON.stringify(resolved));
                    
                    this.logger.debug('Supreme Orchestrator: Object serialized for UAO communication', {
                        context,
                        correlationId,
                        originalType: resolved.constructor?.name || 'Unknown',
                        serializedKeys: Object.keys(serialized || {})
                    });

                    return serialized;
                } catch (serializationError) {
                    this.logger.error('Supreme Orchestrator: Serialization error in UAO communication', {
                        context,
                        correlationId,
                        error: this.serializeError(serializationError),
                        fallback: `[SerializationError: ${resolved.constructor?.name || 'Unknown'}]`
                    });

                    return `[SerializationError: ${resolved.constructor?.name || 'Unknown'}]`;
                }
            }

            // Handle primitives
            return resolved;

        } catch (error) {
            this.logger.error('Supreme Orchestrator: Communication serialization failed', {
                context,
                correlationId,
                error: this.serializeError(error)
            });

            return `[CommunicationSerializationError: ${error.message}]`;
        }
    }

    /**
     * Wrap async functions for Supreme Orchestrator operations
     */
    wrapSupremeOperation(asyncFn, operationName, options = {}) {
        return async (...args) => {
            const correlationId = options.correlationId || this.generateCorrelationId();
            const timeout = options.timeout || 60000; // 1 minute for Supreme operations
            
            const promiseId = this.generatePromiseId(operationName, correlationId);

            try {
                this.logger.debug('Supreme Orchestrator: Starting operation', {
                    operationName,
                    promiseId,
                    correlationId,
                    argsCount: args.length
                });

                // Track the operation
                this.trackPromise(promiseId, { 
                    context: operationName, 
                    correlationId, 
                    timeout,
                    type: 'supreme-operation'
                });

                // Execute with timeout protection
                const result = await this.safeResolve(
                    asyncFn.apply(this, args), 
                    { 
                        timeout, 
                        context: operationName, 
                        correlationId 
                    }
                );

                this.logger.debug('Supreme Orchestrator: Operation completed successfully', {
                    operationName,
                    promiseId,
                    correlationId,
                    resultType: typeof result
                });

                return result;

            } catch (error) {
                this.logger.error('Supreme Orchestrator: Operation failed', {
                    operationName,
                    promiseId,
                    correlationId,
                    error: this.serializeError(error),
                    stack: error.stack
                });

                throw error;
            } finally {
                this.cleanupPromise(promiseId);
            }
        };
    }

    /**
     * Create Promise with built-in error handling for UAO communication
     */
    createSupremePromise(executor, options = {}) {
        const {
            timeout = 30000,
            context = 'supreme-promise',
            correlationId = this.generateCorrelationId()
        } = options;

        const promiseId = this.generatePromiseId(context, correlationId);

        return new Promise((resolve, reject) => {
            // Track this promise
            this.trackPromise(promiseId, { context, correlationId, timeout });

            // Setup timeout
            const timeoutId = setTimeout(() => {
                this.cleanupPromise(promiseId);
                reject(new Error(`Supreme Promise timeout after ${timeout}ms in ${context}`));
            }, timeout);

            this.promiseTimeouts.set(promiseId, timeoutId);

            // Execute with enhanced error handling
            try {
                executor(
                    (value) => {
                        this.cleanupPromise(promiseId);
                        resolve(value);
                    },
                    (error) => {
                        this.cleanupPromise(promiseId);
                        this.logger.error('Supreme Promise rejected', {
                            promiseId,
                            context,
                            correlationId,
                            error: this.serializeError(error)
                        });
                        reject(error);
                    }
                );
            } catch (synchronousError) {
                this.cleanupPromise(promiseId);
                this.logger.error('Supreme Promise executor threw synchronously', {
                    promiseId,
                    context,
                    correlationId,
                    error: this.serializeError(synchronousError)
                });
                reject(synchronousError);
            }
        });
    }

    /**
     * Batch process promises with Supreme-level error handling
     */
    async processBatch(promises, options = {}) {
        const {
            concurrency = 5,
            context = 'batch-processing',
            correlationId = this.generateCorrelationId(),
            failFast = false
        } = options;

        const batchId = this.generatePromiseId(context, correlationId);
        
        this.logger.debug('Supreme Orchestrator: Starting batch processing', {
            batchId,
            promiseCount: promises.length,
            concurrency,
            context,
            correlationId
        });

        try {
            const results = [];
            const errors = [];

            // Process in chunks to limit concurrency
            for (let i = 0; i < promises.length; i += concurrency) {
                const chunk = promises.slice(i, i + concurrency);
                
                const chunkResults = await Promise.allSettled(
                    chunk.map(async (promise, index) => {
                        const itemId = `${batchId}-item-${i + index}`;
                        return await this.safeResolve(promise, { 
                            context: `${context}-item`,
                            correlationId: itemId 
                        });
                    })
                );

                for (const result of chunkResults) {
                    if (result.status === 'fulfilled') {
                        results.push(result.value);
                    } else {
                        errors.push(result.reason);
                        if (failFast) {
                            throw result.reason;
                        }
                    }
                }
            }

            this.logger.debug('Supreme Orchestrator: Batch processing completed', {
                batchId,
                successCount: results.length,
                errorCount: errors.length,
                context,
                correlationId
            });

            return {
                results,
                errors,
                successCount: results.length,
                errorCount: errors.length
            };

        } catch (error) {
            this.logger.error('Supreme Orchestrator: Batch processing failed', {
                batchId,
                context,
                correlationId,
                error: this.serializeError(error)
            });

            throw error;
        }
    }

    // Utility methods

    generatePromiseId(context, correlationId) {
        return `supreme-${context}-${correlationId || Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    generateCorrelationId() {
        return `srix-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    getPromiseId(promise) {
        // Try to find existing ID or generate one
        for (const [id, data] of this.activePromises) {
            if (data.promise === promise) {
                return id;
            }
        }
        return this.generatePromiseId('unknown', null);
    }

    trackPromise(promiseId, metadata) {
        this.activePromises.set(promiseId, {
            ...metadata,
            createdAt: Date.now(),
            promise: null // Don't store the actual promise to avoid memory leaks
        });
    }

    cleanupPromise(promiseId) {
        // Clear timeout if exists
        if (this.promiseTimeouts.has(promiseId)) {
            clearTimeout(this.promiseTimeouts.get(promiseId));
            this.promiseTimeouts.delete(promiseId);
        }

        // Remove from active tracking
        this.activePromises.delete(promiseId);
    }

    serializeError(error) {
        if (error instanceof Error) {
            return {
                name: error.name,
                message: error.message,
                stack: error.stack,
                code: error.code || 'UNKNOWN_ERROR'
            };
        }
        return String(error);
    }

    serializeSafely(value) {
        try {
            if (value === null || value === undefined) {
                return value;
            }
            if (typeof value === 'object') {
                return JSON.parse(JSON.stringify(value));
            }
            return value;
        } catch {
            return '[Unserializable Value]';
        }
    }

    createSafeFallback(error, context) {
        return {
            error: true,
            message: `Supreme Orchestrator Promise Error in ${context}`,
            code: 'SUPREME_PROMISE_ERROR',
            details: this.serializeError(error),
            timestamp: new Date().toISOString(),
            location: 'us-central1-a/MOCORIX2'
        };
    }

    /**
     * Get statistics about active promises
     */
    getPromiseStats() {
        const now = Date.now();
        const stats = {
            activePromises: this.activePromises.size,
            activeTimeouts: this.promiseTimeouts.size,
            promisesByContext: {},
            longRunningPromises: 0,
            averageAge: 0
        };

        let totalAge = 0;
        for (const [id, data] of this.activePromises) {
            const age = now - data.createdAt;
            totalAge += age;

            // Count by context
            const context = data.context || 'unknown';
            stats.promisesByContext[context] = (stats.promisesByContext[context] || 0) + 1;

            // Long running (>30 seconds)
            if (age > 30000) {
                stats.longRunningPromises++;
            }
        }

        if (this.activePromises.size > 0) {
            stats.averageAge = Math.round(totalAge / this.activePromises.size);
        }

        return stats;
    }

    /**
     * Cleanup all tracked promises (for shutdown)
     */
    shutdown() {
        this.logger.info('Supreme Orchestrator Promise Handler: Starting shutdown', {
            activePromises: this.activePromises.size,
            activeTimeouts: this.promiseTimeouts.size
        });

        // Clear all timeouts
        for (const timeoutId of this.promiseTimeouts.values()) {
            clearTimeout(timeoutId);
        }

        // Clear all tracking
        this.activePromises.clear();
        this.promiseTimeouts.clear();

        this.logger.info('Supreme Orchestrator Promise Handler: Shutdown complete');
    }
}

// Create singleton instance
const supremePromiseHandler = new SupremePromiseHandler();

// Export utilities
module.exports = {
    SupremePromiseHandler,
    safeResolve: supremePromiseHandler.safeResolve.bind(supremePromiseHandler),
    serializeForSupremeComm: supremePromiseHandler.serializeForSupremeComm.bind(supremePromiseHandler),
    wrapSupremeOperation: supremePromiseHandler.wrapSupremeOperation.bind(supremePromiseHandler),
    createSupremePromise: supremePromiseHandler.createSupremePromise.bind(supremePromiseHandler),
    processBatch: supremePromiseHandler.processBatch.bind(supremePromiseHandler),
    getPromiseStats: supremePromiseHandler.getPromiseStats.bind(supremePromiseHandler),
    supremePromiseHandler
};