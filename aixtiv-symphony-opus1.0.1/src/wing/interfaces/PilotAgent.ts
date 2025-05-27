/**
 * PilotAgent.ts
 * 
 * This interface defines the structure for deployable agents within the Wing system
 * of the Aixtiv Symphony architecture. Pilot agents are the executable units that
 * can be dispatched for various tasks across the Symphony ecosystem.
 */

import { UUID } from 'uuid';

/**
 * Represents the various operational states of a Pilot Agent
 */
export enum PilotAgentStatus {
  IDLE = 'idle',
  PREPARING = 'preparing',
  ACTIVE = 'active',
  EXECUTING = 'executing',
  STANDBY = 'standby',
  MAINTENANCE = 'maintenance',
  DECOMMISSIONED = 'decommissioned',
  ERROR = 'error'
}

/**
 * Represents the security clearance levels for agent operations
 */
export enum SecurityClearance {
  BASIC = 'basic',
  ENHANCED = 'enhanced',
  ADVANCED = 'advanced',
  PRIVILEGED = 'privileged',
  SYSTEMS = 'systems'
}

/**
 * Defines the capabilities of a Pilot Agent
 */
export interface PilotCapabilities {
  /** Identifies what the agent can process */
  dataProcessingTypes: string[];
  /** Integration capabilities with other systems */
  integrations: string[];
  /** Languages the agent can process */
  languages: string[];
  /** AI models the agent can leverage */
  models: string[];
  /** Special abilities unique to this agent */
  specializations: string[];
  /** Maximum parallel tasks the agent can handle */
  concurrencyLimit: number;
}

/**
 * Represents a task execution result
 */
export interface TaskExecutionResult {
  /** Unique identifier for the execution result */
  executionId: string;
  /** Task that was executed */
  taskId: string;
  /** Status code of the execution */
  status: number;
  /** Output data from the task */
  output: any;
  /** Performance metrics of the execution */
  metrics: {
    startTime: Date;
    completionTime: Date;
    processingTimeMs: number;
    resourceUtilization: number;
    costUnits: number;
  };
  /** Any errors encountered during execution */
  errors?: Error[];
}

/**
 * Core interface for a Pilot Agent in the Wing system
 */
export interface PilotAgent {
  // --- Identification Properties ---
  
  /** Unique identifier for the agent */
  id: string;
  
  /** Version of the agent */
  version: string;
  
  /** Type classification of the agent */
  type: 'RIX' | 'CRX' | 'CO-PILOT' | 'SPECIALIZED';
  
  /** Display name of the agent */
  name: string;
  
  /** Detailed description of the agent's purpose */
  description: string;
  
  /** Security clearance level */
  clearance: SecurityClearance;
  
  /** Squadron assignment within the Wing */
  squadron: 'CORE' | 'DEPLOY' | 'ENGAGE';
  
  // --- Capability Definitions ---
  
  /** Capabilities of the agent */
  capabilities: PilotCapabilities;
  
  /** Domain specializations of the agent */
  domains: string[];
  
  // --- State Tracking ---
  
  /** Current operational status */
  status: PilotAgentStatus;
  
  /** Current utilization percentage (0-100) */
  utilization: number;
  
  /** Active task IDs the agent is handling */
  activeTasks: string[];
  
  /** Timestamp of last status change */
  lastStatusChange: Date;
  
  /** Operational metrics and telemetry */
  metrics: {
    tasksCompleted: number;
    successRate: number;
    averageResponseTime: number;
    uptime: number;
  };
  
  // --- Task Execution Methods ---
  
  /**
   * Initialize the agent with configuration settings
   * @param config Configuration settings for the agent
   */
  initialize(config: Record<string, any>): Promise<boolean>;
  
  /**
   * Assign a task to the agent for execution
   * @param taskId Unique identifier for the task
   * @param parameters Parameters required for task execution
   * @param priority Priority level of the task (1-10)
   * @param deadline Optional deadline for task completion
   */
  assignTask(
    taskId: string, 
    parameters: Record<string, any>, 
    priority?: number, 
    deadline?: Date
  ): Promise<boolean>;
  
  /**
   * Execute a task with the given parameters
   * @param taskId Unique identifier for the task
   * @param parameters Parameters required for task execution
   */
  executeTask(taskId: string, parameters: Record<string, any>): Promise<TaskExecutionResult>;
  
  /**
   * Cancel an active task
   * @param taskId Unique identifier for the task to cancel
   * @param reason Reason for cancellation
   */
  cancelTask(taskId: string, reason?: string): Promise<boolean>;
  
  /**
   * Retrieve the status of a task
   * @param taskId Unique identifier for the task
   */
  getTaskStatus(taskId: string): Promise<{ status: string, progress: number }>;
  
  // --- Integration Points ---
  
  /**
   * Record an event to the Flight Memory System
   * @param event Event details to record
   */
  recordToFMS(event: { 
    type: string, 
    details: Record<string, any>, 
    timestamp?: Date 
  }): Promise<string>;
  
  /**
   * Request approval through the S2DO system
   * @param approvalRequest Details of the approval request
   */
  requestS2DOApproval(approvalRequest: {
    action: string,
    resources: string[],
    justification: string,
    priority?: number
  }): Promise<{ approved: boolean, approvalId?: string, reason?: string }>;
  
  /**
   * Communicate with another Pilot Agent
   * @param targetAgentId ID of the target agent
   * @param message Message to send
   * @param priority Priority level of the communication
   */
  communicateWithAgent(
    targetAgentId: string, 
    message: Record<string, any>, 
    priority?: number
  ): Promise<boolean>;
  
  /**
   * Update agent's capabilities with the Dream Commander
   * @param learningData Learning data to improve agent capabilities
   */
  updateWithDreamCommander(learningData: {
    performance: Record<string, any>,
    insights: string[],
    recommendedImprovements: string[]
  }): Promise<boolean>;
  
  /**
   * Connect to gateway for authorization and access control
   * @param context Operation context requiring gateway access
   */
  connectToGateway(context: {
    operation: string,
    resources: string[],
    requiredAccess: string[]
  }): Promise<{ authorized: boolean, token?: string, permissions?: string[] }>;
}

