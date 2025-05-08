/**
 * Adaptive Model Orchestration Layer
 * 
 * An enhanced orchestration system for managing interactions with multiple LLM providers that builds on the
 * existing ModelOrchestrationLayer with additional capabilities:
 * 
 * 1. Performance prediction based on historic model performance data
 * 2. Adaptive learning system that improves model selection over time
 * 3. Business impact tracking for calculating cost savings and ROI
 * 4. Dynamic circuit breakers to handle failures gracefully
 * 5. Enhanced model selection using ML-based optimization
 */

import { ModelOrchestrationLayer } from './ModelOrchestrationLayer';
import { MetricsCollector } from '../metrics/MetricsCollector';
import { ErrorUtils } from '../../utils/ErrorUtils';
import { performance } from 'perf_hooks';
import { Logger } from '../../utils/logger';

// Interfaces for type safety
interface ModelStats {
  provider: string;
  model: string;
  latency: number[];
  errorRate: number;
  successCount: number;
  failureCount: number;
  averageCost: number;
  lastUpdated: number;
  reliability: number;
  features: string[];
  capabilities: string[];
  [key: string]: any;
}

interface ModelPrediction {
  provider: string;
  model: string;
  predictedLatency: number;
  predictedCost: number;
  predictedReliability: number;
  confidence: number;
}

interface BusinessMetrics {
  totalCostSavings: number;
  successRate: number;
  averageResponseTime: number;
  uptime: number;
  failoverSuccessRate: number;
  serviceLevelAgreementCompliance: number;
}

interface PerformanceFeatures {
  taskType: string;
  promptLength: number;
  complexity: number;
  capabilities: string[];
  timeOfDay: number;
  dayOfWeek: number;
  [key: string]: any;
}

interface CircuitBreakerState {
  provider: string;
  model: string;
  isOpen: boolean;
  failureCount: number;
  lastFailureTime: number;
  recoveryAttemptTime: number | null;
  consecutiveSuccesses: number;
}

/**
 * Performance Predictor Class
 * 
 * Predicts model performance based on request features and historical data
 */
class PerformancePredictor {
  private modelStats: Map<string, ModelStats> = new Map();
  private logger: Logger;
  private featureHistory: {features: PerformanceFeatures, result: any}[] = [];
  private readonly maxHistoryEntries = 1000;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Update model statistics with latest performance data
   */
  public updateModelStats(
    provider: string,
    model: string,
    latency: number,
    isSuccess: boolean,
    cost: number
  ): void {
    const key = `${provider}:${model}`;
    let stats = this.modelStats.get(key);

    if (!stats) {
      stats = {
        provider,
        model,
        latency: [],
        errorRate: 0,
        successCount: 0,
        failureCount: 0,
        averageCost: 0,
        lastUpdated: Date.now(),
        reliability: 1.0,
        features: [],
        capabilities: []
      };
      this.modelStats.set(key, stats);
    }

    // Update latency history (keep last 100 entries)
    stats.latency.push(latency);
    if (stats.latency.length > 100) {
      stats.latency.shift();
    }

    // Update success/failure counts and error rate
    if (isSuccess) {
      stats.successCount += 1;
    } else {
      stats.failureCount += 1;
    }
    
    const totalRequests = stats.successCount + stats.failureCount;
    stats.errorRate = totalRequests > 0 ? stats.failureCount / totalRequests : 0;
    stats.reliability = 1 - stats.errorRate;

    // Update average cost
    stats.averageCost = ((stats.averageCost * (totalRequests - 1)) + cost) / totalRequests;
    stats.lastUpdated = Date.now();

    this.modelStats.set(key, stats);
  }

  /**
   * Predict model performance for a given request
   */
  public predictPerformance(
    models: { provider: string, model: string }[],
    features: PerformanceFeatures
  ): ModelPrediction[] {
    try {
      const predictions: ModelPrediction[] = [];

      for (const { provider, model } of models) {
        const key = `${provider}:${model}`;
        const stats = this.modelStats.get(key);

        if (!stats || stats.latency.length === 0) {
          // If no history, make a default prediction with low confidence
          predictions.push({
            provider,
            model,
            predictedLatency: 1000, // default 1s latency
            predictedCost: 0.01,    // default cost estimate
            predictedReliability: 0.95, // default reliability
            confidence: 0.1         // low confidence
          });
          continue;
        }

        // Calculate predicted latency based on similar past requests
        const recentLatencies = stats.latency.slice(-20);
        const avgLatency = recentLatencies.reduce((sum, val) => sum + val, 0) / recentLatencies.length;

        // Apply adjustments based on features
        let adjustedLatency = avgLatency;
        
        // Adjust based on prompt length (longer prompts may take more time)
        if (features.promptLength > 1000) {
          adjustedLatency *= 1.2;
        }

        // Adjust based on complexity
        if (features.complexity > 0.7) {
          adjustedLatency *= 1.3;
        }

        // Adjust based on time of day (peak hours might affect performance)
        const hour = features.timeOfDay;
        if (hour >= 9 && hour <= 17) { // Business hours
          adjustedLatency *= 1.1;
        }

        // Calculate confidence based on amount of data available
        const confidence = Math.min(0.9, stats.latency.length / 100);

        predictions.push({
          provider,
          model,
          predictedLatency: adjustedLatency,
          predictedCost: stats.averageCost,
          predictedReliability: stats.reliability,
          confidence
        });
      }

      return predictions;
    } catch (error) {
      this.logger.error(`Error predicting model performance: ${ErrorUtils.formatError(error)}`);
      // In case of error, return default predictions with low confidence
      return models.map(({ provider, model }) => ({
        provider,
        model,
        predictedLatency: 1000,
        predictedCost: 0.01,
        predictedReliability: 0.95,
        confidence: 0.1
      }));
    }
  }

  /**
   * Record request features and result for training
   */
  public recordFeatureResult(features: PerformanceFeatures, result: any): void {
    this.featureHistory.push({ features, result });
    
    // Limit history size
    if (this.featureHistory.length > this.maxHistoryEntries) {
      this.featureHistory.shift();
    }
  }

  /**
   * Train the predictor on historical data
   */
  public async train(): Promise<void> {
    // In a real implementation, this would train the ML model
    // For now, we'll just log that training occurred
    this.logger.info(`Training performance predictor on ${this.featureHistory.length} examples`);
    
    // Remove old entries to keep the model focused on recent data
    if (this.featureHistory.length > this.maxHistoryEntries / 2) {
      this.featureHistory = this.featureHistory.slice(-this.maxHistoryEntries / 2);
    }
  }
}

/**
 * Routing Optimizer Class
 * 
 * Uses reinforcement learning techniques to optimize model selection over time
 */
class RoutingOptimizer {
  private logger: Logger;
  private rewardHistory: Map<string, number[]> = new Map();
  private weightedScores: Map<string, number> = new Map();
  private explorationRate: number = 0.2; // Exploration vs exploitation balance
  private learningRate: number = 0.1;
  
  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Optimize model selection based on historical performance
   */
  public selectOptimalModel(
    candidates: ModelPrediction[],
    taskType: string,
    explorationEnabled: boolean = true
  ): ModelPrediction {
    try {
      if (candidates.length === 0) {
        throw new Error('No candidate models provided for optimization');
      }

      if (candidates.length === 1) {
        return candidates[0];
      }

      // Random exploration (with probability explorationRate)
      if (explorationEnabled && Math.random() < this.explorationRate) {
        const randomIndex = Math.floor(Math.random() * candidates.length);
        return candidates[randomIndex];
      }

      // Calculate scores for each model
      const scores: {model: ModelPrediction, score: number}[] = candidates.map(model => {
        const key = `${model.provider}:${model.model}:${taskType}`;
        let weightedScore = this.weightedScores.get(key) || 0.5; // Default score
        
        // Adjust score based on predictions
        // Convert metrics to 0-1 range for easier comparison
        const latencyScore = Math.max(0, 1 - (model.predictedLatency / 5000)); // Assumes 5s is worst case
        const costScore = Math.max(0, 1 - (model.predictedCost / 0.1)); // Assumes $0.10 is worst case
        const reliabilityScore = model.predictedReliability;
        
        // Combine scores with confidence-weighted sum
        const predictedScore = (
          (0.4 * reliabilityScore) + 
          (0.3 * latencyScore) + 
          (0.3 * costScore)
        ) * model.confidence;
        
        // Combine historical score with predicted score
        const combinedScore = (0.7 * weightedScore) + (0.3 * predictedScore);
        
        return { model, score: combinedScore };
      });

      // Select the model with the highest score
      return scores.sort((a, b) => b.score - a.score)[0].model;
    } catch (error) {
      this.logger.error(`Error selecting optimal model: ${ErrorUtils.formatError(error)}`);
      // In case of error, return the first candidate or the one with highest reliability
      return candidates.sort((a, b) => b.predictedReliability - a.predictedReliability)[0];
    }
  }

  /**
   * Update model scores based on execution results (reinforcement learning)
   */
  public updateFromResult(
    provider: string,
    model: string,
    taskType: string,
    success: boolean,
    latency: number,
    cost: number
  ): void {
    try {
      const key = `${provider}:${model}:${taskType}`;
      
      // Calculate reward (combine success, latency, and cost factors)
      // Success is the most important factor
      const successFactor = success ? 1.0 : 0.0;
      
      // Latency factor (lower is better)
      // Normalize to 0-1 range, with anything over 5s being 0
      const latencyFactor = Math.max(0, 1 - (latency / 5000));
      
      // Cost factor (lower is better)
      // Normalize to 0-1 range, with anything over $0.10 being 0
      const costFactor = Math.max(0, 1 - (cost / 0.1));
      
      // Combined reward (weighted sum)
      const reward = (0.6 * successFactor) + (0.2 * latencyFactor) + (0.2 * costFactor);
      
      // Store reward in history
      let rewards = this.rewardHistory.get(key) || [];
      rewards.push(reward);
      
      // Keep only the last 100 rewards
      if (rewards.length > 100) {
        rewards = rewards.slice(-100);
      }
      this.rewardHistory.set(key, rewards);
      
      // Update weighted score
      const currentScore = this.weightedScores.get(key) || 0.5;
      const newScore = currentScore + (this.learningRate * (reward - currentScore));
      this.weightedScores.set(key, newScore);
      
      this.logger.debug(`Updated model score for ${key} to ${newScore} (reward: ${reward})`);
    } catch (error) {
      this.logger.error(`Error updating model scores: ${ErrorUtils.formatError(error)}`);
    }
  }

  /**
   * Adjust exploration rate over time (decreases as more data is collected)
   */
  public adjustExplorationRate(): void {
    // Decrease exploration rate as we get more data, but keep a minimum
    const totalDataPoints = Array.from(this.rewardHistory.values())
      .reduce((sum, rewards) => sum + rewards.length, 0);
    
    this.explorationRate = Math.max(0.05, 0.3 - (totalDataPoints / 10000) * 0.25);
    this.logger.debug(`Adjusted exploration rate to ${this.explorationRate}`);
  }
}

/**
 * Business Value Tracker Class
 * 
 * Tracks business impact metrics like cost savings and ROI
 */
class BusinessValueTracker {
  private logger: Logger;
  private metrics: BusinessMetrics;
  private costBaseline: Map<string, number> = new Map(); // Baseline costs per task type
  private defaultCost: number = 0.03; // Default cost estimate if no baseline
  private requestSuccessHistory: boolean[] = []; // Recent success/failure
  private responseTimeHistory: number[] = []; // Recent response times
  private costSavingsHistory: number[] = []; // Recent cost savings
  
  constructor(logger: Logger) {
    this.logger = logger;
    this.metrics = {
      totalCostSavings: 0,
      successRate: 1.0,
      averageResponseTime: 0,
      uptime: 1.0,
      failoverSuccessRate: 0,
      serviceLevelAgreementCompliance: 1.0
    };
    
    // Initialize histories with empty arrays
    this.requestSuccessHistory = [];
    this.responseTimeHistory = [];
    this.costSavingsHistory = [];
  }

  /**
   * Track cost savings compared to baseline
   */
  public trackCostSavings(taskType: string, model: string, provider: string, actualCost: number): number {
    try {
      // Get baseline cost for comparison
      const baselineKey = `${taskType}`;
      let baselineCost = this.costBaseline.get(baselineKey) || this.defaultCost;
      
      // Calculate cost difference (positive means savings)
      const costSavings = baselineCost - actualCost;
      
      // Update total cost savings
      this.metrics.totalCostSavings += costSavings;
      
      // Add to history
      this.costSavingsHistory.push(costSavings);
      if (this.costSavingsHistory.length > 100) {
        this.costSavingsHistory.shift();
      }
      
      // Update baseline with weighted average if we don't have one yet
      if (!this.costBaseline.has(baselineKey)) {
        this.costBaseline.set(baselineKey, actualCost);
      }
      
      return costSavings;
    } catch (error) {
      this.logger.error(`Error tracking cost savings: ${ErrorUtils.formatError(error)}`);
      return 0;
    }
  }

  /**
   * Calculate ROI based on cost savings and implementation cost
   */
  public calculateROI(implementationCost: number): number {
    if (implementationCost <= 0) {
      return 0; // Cannot calculate meaningful ROI with zero or negative cost
    }
    
    const roi = (this.metrics.totalCostSavings / implementationCost) * 100;
    return Math.max(0, roi); // Ensure we don't return negative ROI
  }

  /**
   * Update success rate metrics
   */
  public trackRequestSuccess(success: boolean): void {
    // Add to history
    this.requestSuccessHistory.push(success);
    
    // Keep only last 1000 requests
    if (this.requestSuccessHistory.length > 1000) {
      this.requestSuccessHistory.shift();
    }
    
    // Recalculate success rate
    const successCount = this.requestSuccessHistory.filter(s => s).length;
    this.metrics.successRate = this.requestSuccessHistory.length > 0 
      ? successCount / this.requestSuccessHistory.length 
      : 1.0;
  }

  /**
   * Track response time
   */
  public trackResponseTime(responseTime: number): void {
    // Add to history
    this.responseTimeHistory.push(responseTime);
    
    // Keep only last 1000 responses
    if (this.responseTimeHistory.length > 1000) {
      this.responseTimeHistory.shift();
    }
    
    // Recalculate average response time
    this.metrics.averageResponseTime = this.responseTimeHistory.length > 0
      ? this.responseTimeHistory.reduce((sum, time) => sum + time, 0) / this.responseTimeHistory.length
      : 0;
  }

  /**
   * Update SLA compliance metric
   */
  public updateSLACompliance(responseTime: number, slaThreshold: number): void {
    // SLA compliance is the percentage of requests that meet the threshold
    const meetsThreshold = responseTime <= slaThreshold;
    
    // Exponential moving average for smoother updates
    const alpha = 0.05; // Small alpha for stable metric
    this.metrics.serviceLevelAgreementCompliance = 
      (1 - alpha) * this.metrics.serviceLevelAgreementCompliance + 
      alpha * (meetsThreshold ? 1.0 : 0.0);
  }

  /**
   * Track failover success (when primary model fails and backup succeeds)
   */
  public trackFailoverSuccess(success: boolean): void {
    // Exponential moving average for smoother updates
    const alpha = 0.1;
    this.metrics.failoverSuccessRate = 
      (1 - alpha) * this.metrics.failoverSuccessRate + 
      alpha * (success ? 1.0 : 0.0);
  }

  /**
   * Get current business metrics
   */
  public getMetrics(): BusinessMetrics {
    return { ...this.metrics };
  }

  /**
   * Generate business impact report
   */
  public generateBusinessImpactReport(): string {
    const metrics = this.getMetrics();
    
    return `
Business Impact Report:
------------------------
Total Cost Savings: $${metrics.totalCostSavings.toFixed(2)}
Success Rate: ${(metrics.successRate * 100).toFixed(1)}%
Average Response Time: ${metrics.averageResponseTime.toFixed(0)}ms
Service Uptime: ${(metrics.uptime * 100).toFixed(2)}%
SLA Compliance: ${(metrics.serviceLevelAgreementCompliance * 100).toFixed(1)}%
Failover Success Rate: ${(metrics.failoverSuccessRate * 100).toFixed(1)}%
    `;
  }
}

/**
 * Circuit Breaker Class
 * 
 * Implements the circuit breaker pattern to prevent cascading failures
 * when a provider or model is failing repeatedly.
 */
class CircuitBreaker {
  private logger: Logger;
  private states: Map<string, CircuitBreakerState> = new Map();
  
  // Configuration
  private failureThreshold: number = 5; // Number of failures before opening circuit
  private resetTimeout: number = 30000; // Half-open after 30 seconds
  private successesToClose: number = 2; // Number of successes needed to close circuit
  
  constructor(logger: Logger, options?: {
    failureThreshold?: number,
    resetTimeout?: number,
    successesToClose?: number
  }) {
    this.logger = logger;
    
    // Apply custom options if provided
    if (options) {
      this.failureThreshold = options.failureThreshold || this.failureThreshold;
      this.resetTimeout = options.resetTimeout || this.resetTimeout;
      this.successesToClose = options.successesToClose || this.successesToClose;
    }
  }

  /**
   * Get the key for the circuit breaker state
   */
  private getKey(provider: string, model: string): string {
    return `${provider}:${model}`;
  }

  /**
   * Get current state for a provider/model, creating if it doesn't exist
   */
  private getState(provider: string, model: string): CircuitBreakerState {
    const key = this.getKey(provider, model);
    
    if (!this.states.has(key)) {
      this.states.set(key, {
        provider,
        model,
        isOpen: false,
        failureCount: 0,
        lastFailureTime: 0,
        recoveryAttemptTime: null,
        consecutiveSuccesses: 0
      });
    }
    
    return this.states.get(key)!;
  }

  /**
   * Check if the circuit is currently open (failing)
   */
  public isOpen(provider: string, model: string): boolean {
    const state = this.getState(provider, model);
    
    // If circuit is closed, return false immediately
    if (!state.isOpen) {
      return false;
    }
    
    // Check if enough time has passed to try half-open state
    const now = Date.now();
    if (state.lastFailureTime + this.resetTimeout < now) {
      // Time to try half-open state (will let one request through)
      state.recoveryAttemptTime = now;
      this.logger.info(`Circuit for ${provider}:${model} entering half-open state for testing`);
      return false;
    }
    
    return true;
  }

  /**
   * Record a failure, potentially opening the circuit
   */
  public recordFailure(provider: string, model: string): void {
    const state = this.getState(provider, model);
    state.failureCount++;
    state.lastFailureTime = Date.now();
    state.consecutiveSuccesses = 0;
    
    // Check if we need to open the circuit
    if (!state.isOpen && state.failureCount >= this.failureThreshold) {
      state.isOpen = true;
      this.logger.warn(`Circuit breaker opened for ${provider}:${model} after ${state.failureCount} failures`);
    } else if (state.recoveryAttemptTime !== null) {
      // Failed during recovery attempt
      state.recoveryAttemptTime = null;
      this.logger.warn(`Recovery attempt failed for ${provider}:${model}, circuit remains open`);
    }
  }

  /**
   * Record a success, potentially closing the circuit
   */
  public recordSuccess(provider: string, model: string): void {
    const state = this.getState(provider, model);
    
    // Reset failure count
    state.failureCount = 0;
    
    // In half-open state, count consecutive successes
    if (state.isOpen) {
      state.consecutiveSuccesses++;
      
      // Check if we have enough successes to close the circuit
      if (state.consecutiveSuccesses >= this.successesToClose) {
        state.isOpen = false;
        state.recoveryAttemptTime = null;
        this.logger.info(`Circuit breaker closed for ${provider}:${model} after ${state.consecutiveSuccesses} consecutive successes`);
      }
    }
  }

  /**
   * Reset circuit breaker for a provider/model
   */
  public reset(provider: string, model: string): void {
    const key = this.getKey(provider, model);
    this.states.delete(key);
    this.logger.info(`Circuit breaker reset for ${provider}:${model}`);
  }

  /**
   * Get status report for all circuit breakers
   */
  public getStatus(): { [key: string]: { isOpen: boolean, failureCount: number, lastFailureTime: number } } {
    const status: { [key: string]: { isOpen: boolean, failureCount: number, lastFailureTime: number } } = {};
    
    for (const [key, state] of this.states.entries()) {
      status[key] = {
        isOpen: state.isOpen,
        failureCount: state.failureCount,
        lastFailureTime: state.lastFailureTime
      };
    }
    
    return status;
  }
}

/**
 * Adaptive Model Orchestrator
 * 
 * Enhanced model orchestration layer that adds ML-driven model selection,
 * automated recovery from failures, and business impact tracking.
 */
export class AdaptiveModelOrchestrator extends ModelOrchestrationLayer {
  private performancePredictor: PerformancePredictor;
  private routingOptimizer: RoutingOptimizer;
  private businessValueTracker: BusinessValueTracker;
  private circuitBreakers: CircuitBreaker;
  private metricsCollector: MetricsCollector;
  private cachedResults: Map<string, any> = new Map();
  private cacheTTL: number = 5 * 60 * 1000; // 5 minutes cache
  
  constructor(
    logger: Logger, 
    metricsCollector: MetricsCollector,
    options?: {
      cacheTTL?: number,
      circuitBreakerOptions?: {
        failureThreshold?: number,
        resetTimeout?: number,
        successesToClose?: number
      }
    }
  ) {
    super(logger);
    
    this.metricsCollector = metricsCollector;
    this.performancePredictor = new PerformancePredictor(logger);
    this.routingOptimizer = new RoutingOptimizer(logger);
    this.businessValueTracker = new BusinessValueTracker(logger);
    this.circuitBreakers = new CircuitBreaker(logger, options?.circuitBreaker

