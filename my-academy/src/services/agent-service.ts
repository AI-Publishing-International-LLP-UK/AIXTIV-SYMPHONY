import { v4 as uuidv4 } from 'uuid';

// Define interfaces for agent-related types
export interface AgentMemory {
  id: string;
  agentId: string;
  memoryType: 'longTerm' | 'shortTerm' | 'procedural';
  content: Record<string, any>;
  contextualTags: string[];
  productOrigin?: string;
  lastAccessed: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentAccess {
  id: string;
  agentId: string;
  productId: string;
  accessToken: string;
  refreshToken?: string;
  syncStatus: 'synced' | 'pending' | 'failed';
  lastSync: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  contextCapacity: number;
  memorySlots: number;
  lastSyncTime: Date;
  configurations: Record<string, any>;
  memory: AgentMemory[];
  access: AgentAccess[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentMemoryInput {
  memoryType: 'longTerm' | 'shortTerm' | 'procedural';
  content: Record<string, any>;
  contextualTags: string[];
  productOrigin?: string;
}

export interface SyncResult {
  success: boolean;
  message?: string;
  syncedAt: Date;
  syncedItems: number;
}

export interface ConnectionStatus {
  connected: boolean;
  lastSync?: Date;
  error?: string;
}

export interface ConnectionMetrics {
  totalSyncs: number;
  totalItems: number;
  averageSyncTime: number;
  errorRate: number;
}

export interface EnvironmentConfig {
  id: string;
  name: string;
  type: 'browser' | 'product' | 'corporate';
  settings: Record<string, any>;
}

/**
 * AgentService class responsible for managing transportable agents
 * across different environments and products.
 */
export class AgentService {
  private agents: Map<string, Agent> = new Map();
  private environments: Map<string, EnvironmentConfig> = new Map();
  
  /**
   * Create a new agent for a user
   */
  async createAgent(userId: string, name: string, avatar?: string): Promise<Agent> {
    const agent: Agent = {
      id: uuidv4(),
      userId,
      name,
      avatar,
      contextCapacity: 5, // Default capacity
      memorySlots: 10,    // Default memory slots
      lastSyncTime: new Date(),
      configurations: {},
      memory: [],
      access: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.agents.set(agent.id, agent);
    
    // In a real implementation, this would save to a database
    // await prisma.agent.create({ data: agent });
    
    return agent;
  }
  
  /**
   * Retrieve an agent with its memory for a specific user
   */
  async getAgentWithMemory(userId: string, productContext?: string): Promise<Agent | null> {
    // In a real implementation, this would fetch from a database
    // const agent = await prisma.agent.findFirst({
    //   where: { userId },
    //   include: { memory: true, access: true }
    // });
    
    // For now, look in our in-memory map
    const agent = Array.from(this.agents.values()).find(a => a.userId === userId);
    
    if (!agent) return null;
    
    // If product context is provided, filter memories for that context
    if (productContext) {
      // Load relevant memories for this product context
      // This could involve complex memory retrieval logic based on the product
      const productSpecificMemories = agent.memory.filter(
        m => m.productOrigin === productContext || 
             m.contextualTags.includes(productContext)
      );
      
      // We might prioritize these memories by setting them first in the array
      // or applying some other memory prioritization logic
    }
    
    return agent;
  }
  
  /**
   * Get agent by ID
   */
  async getAgentById(agentId: string): Promise<Agent | null> {
    // In a real implementation, this would fetch from a database
    // return await prisma.agent.findUnique({
    //   where: { id: agentId },
    //   include: { memory: true, access: true }
    // });
    
    return this.agents.get(agentId) || null;
  }
  
  /**
   * Update agent memory after interactions
   */
  async updateAgentMemory(agentId: string, newMemories: AgentMemoryInput[]): Promise<void> {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent not found: ${agentId}`);
    
    // Add new memories
    const currentTime = new Date();
    
    newMemories.forEach(memoryInput => {
      const memory: AgentMemory = {
        id: uuidv4(),
        agentId,
        memoryType: memoryInput.memoryType,
        content: memoryInput.content,
        contextualTags: memoryInput.contextualTags,
        productOrigin: memoryInput.productOrigin,
        lastAccessed: currentTime,
        createdAt: currentTime,
        updatedAt: currentTime
      };
      
      agent.memory.push(memory);
    });
    
    // Prune memories if we exceed the capacity
    if (agent.memory.length > agent.memorySlots) {
      // Sort by last accessed (oldest first)
      agent.memory.sort((a, b) => 
        a.lastAccessed.getTime() - b.lastAccessed.getTime()
      );
      
      // Remove oldest memories that exceed our capacity
      agent.memory = agent.memory.slice(agent.memory.length - agent.memorySlots);
    }
    
    agent.updatedAt = currentTime;
    this.agents.set(agentId, agent);
    
    // In a real implementation, this would update the database
    // await prisma.agentMemory.createMany({ data: newMemoryRecords });
    // await pruneExcessMemories(agentId, agent.memorySlots);
  }
  
  /**
   * Expand agent memory capacity when a user purchases more Opus products
   */
  async expandAgentMemory(userId: string, newMemoryAllocation: number): Promise<Agent | null> {
    const agent = Array.from(this.agents.values()).find(a => a.userId === userId);
    if (!agent) return null;
    
    // Increase memory capacity
    agent.memorySlots += newMemoryAllocation;
    agent.contextCapacity += Math.floor(newMemoryAllocation * 0.5);
    agent.updatedAt = new Date();
    
    this.agents.set(agent.id, agent);
    
    // In a real implementation, this would update the database
    // return await prisma.agent.update({
    //   where: { userId },
    //   data: {
    //     memorySlots: { increment: newMemoryAllocation },
    //     contextCapacity: { increment: Math.floor(newMemoryAllocation * 0.5) },
    //     updatedAt: new Date()
    //   }
    // });
    
    return agent;
  }
  
  /**
   * Synchronize agent state between environments or products
   */
  async syncAgentState(
    agentId: string, 
    sourceEnvironment: string, 
    targetEnvironment: string
  ): Promise<SyncResult> {
    const agent = this.agents.get(agentId);
    if (!agent) {
      return {
        success: false,
        message: `Agent not found: ${agentId}`,
        syncedAt: new Date(),
        syncedItems: 0
      };
    }
    
    try {
      // Check if both environments are registered
      const sourceEnv = this.environments.get(sourceEnvironment);
      const targetEnv = this.environments.get(targetEnvironment);
      
      if (!sourceEnv || !targetEnv) {
        return {
          success: false,
          message: `One or more environments not found`,
          syncedAt: new Date(),
          syncedItems: 0
        };
      }
      
      // In a real implementation, this would synchronize specific state
      // between environments, possibly involving API calls to external systems
      
      // For example, transfer relevant memories from source to target
      const relevantMemories = agent.memory.filter(
        memory => memory.productOrigin === sourceEnvironment ||
                  memory.contextualTags.includes(sourceEnvironment)
      );
      
      // Update memories with target environment context
      relevantMemories.forEach(memory => {
        if (!memory.contextualTags.includes(targetEnvironment)) {
          memory.contextualTags.push(targetEnvironment);
        }
      });
      
      // Update agent sync time
      const now = new Date();
      agent.lastSyncTime = now;
      agent.updatedAt = now;
      
      this.agents.set(agent.id, agent);
      
      return {
        success: true,
        message: `Successfully synced agent state from ${sourceEnv.name} to ${targetEnv.name}`,
        syncedAt: now,
        syncedItems: relevantMemories.length
      };
    } catch (error) {
      return {
        success: false,
        message: `Sync failed: ${error instanceof Error ? error.message : String(error)}`,
        syncedAt: new Date(),
        syncedItems: 0
      };
    }
  }
  
  /**
   * Register a new environment where agents can operate
   */
  async registerEnvironment(config: EnvironmentConfig): Promise<void> {
    this.environments.set(config.id, config);
    
    // In a real implementation, this would persist to a database
    // await prisma.environment.upsert({
    //   where: { id: config.id },
    //   update: config,
    //   create: config
    // });
  }
  
  /**
   * Add product access for an agent
   */
  async addProductAccess(
    agentId: string, 
    productId: string, 
    accessToken: string, 
    refreshToken?: string
  ): Promise<AgentAccess | null> {
    const agent = this.agents.get(agentId);
    if (!agent) return null;
    
    const now = new Date();
    const access: AgentAccess = {
      id: uuidv4(),
      agentId,
      productId,
      accessToken,
      refreshToken,
      syncStatus: 'synced',
      lastSync: now,
      createdAt: now,
      updatedAt: now
    };
    
    // Add to agent's access list
    agent.access.push(access);
    agent.updatedAt = now;
    
    this.agents.set(agent.id, agent);
    
    // In a real implementation, this would update the database
    // return await prisma.agentAccess.create({ data: access });
    
    return access;
  }
  
  /**
   * Export agent state for cross-environment transfer
   */
  async exportAgentState(agentId: string): Promise<Record<string, any>> {
    const agent = this.agents.get(agentId);
    if (!agent) throw new Error(`Agent not found: ${agentId}`);
    
    // Export core agent state, excluding sensitive information
    return {
      id: agent.id,
      name: agent.name,
      avatar: agent.avatar,
      contextCapacity: agent.contextCapacity,
      memorySlots: agent.memorySlots,
      lastSyncTime: agent.lastSyncTime,
      configurations: agent.configurations,
      memory: agent.memory.map(memory => ({
        id: memory.id,
        memoryType: memory.memoryType,
        content: memory.content,
        contextualTags: memory.contextualTags,
        productOrigin: memory.productOrigin,
        lastAccessed: memory.lastAccessed
      })),
      // Do not export access tokens or other sensitive information
      accessibleProducts: agent.access.map(access => access.productId)
    };
  }
  
  /**
   * Import agent state from another environment
   */
  async importAgentState(
    userId: string, 
    exportedState: Record<string, any>
  ): Promise<Agent | null> {
    // Check if agent already exists for this user
    let agent = Array.from(this.agents.values()).find(a => a.userId === userId);
    
    if (agent) {
      // Merge exported state with existing agent
      // In a real implementation, this would use more sophisticated merging logic
      
      // Update basic properties
      agent.name = exportedState.name || agent.name;
      agent.avatar = exportedState.avatar || agent.avatar;
      agent.contextCapacity = Math.max(agent.contextCapacity, exportedState.contextCapacity || 0);
      agent.memorySlots = Math.max(agent.memorySlots, exportedState.memorySlots || 0);
      agent.configurations = { ...agent.configurations, ...exportedState.configurations };
      agent.updatedAt = new Date();
      
      // Merge memories, avoiding duplicates by ID
      const existingMemoryIds = new Set(agent.memory.map(m => m.id));
      const newMemories = (exportedState.memory || []).filter(
        (m: any) => !existingMemoryIds.has(m.id)
      );
      
      newMemories.forEach((memoryData: any) => {
        const memory: AgentMemory = {
          id: memoryData.id || uuidv4(),
          agentId: agent!.id,
          memoryType: memoryData.memoryType,
          content: memoryData.content,
          contextualTags: memoryData.contextualTags,
          productOrigin: memoryData.productOrigin,
          lastAccessed: new Date(memoryData.lastAccessed || Date.now()),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        agent!.memory.push(memory);
      });
    } else {
      // Create new agent from exported state
      agent = {
        id: exportedState.id || uuidv4(),
        userId,
        name: exportedState.name || 'Imported Agent',
        avatar: exportedState.avatar,
        contextCapacity: exportedState.contextCapacity || 5,
        memorySlots: exportedState.memorySlots || 10,
        lastSyncTime: new Date(),
        configurations: exportedState.configurations || {},
        memory: (exportedState.memory || []).map((memoryData: any) => ({
          id: memoryData.id || uuidv4(),
          agentId: exportedState.id,
          memoryType:

