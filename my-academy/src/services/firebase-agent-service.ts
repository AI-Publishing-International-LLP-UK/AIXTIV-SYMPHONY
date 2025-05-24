import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  increment,
  Timestamp,
  documentId,
  limit as firestoreLimit,
  orderBy
} from 'firebase/firestore';
import { 
  getAuth, 
  signInWithCustomToken, 
  onAuthStateChanged, 
  signOut,
  UserCredential 
} from 'firebase/auth';
import { db, auth, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL, getBlob } from 'firebase/storage';
import { PineconeClient, Vector, QueryRequest } from '@pinecone-database/pinecone';
import * as crypto from 'crypto-js';

// Types for the Agent Service
export type SecurityClearance = 'basic' | 'elevated' | 'admin' | 'system';
export type TokenTier = 'basic' | 'pro' | 'enterprise' | 'unlimited';
export type AgentModelType = 'standard' | 'advanced' | 'expert' | 'specialized';
export type ModelProvider = 'openai' | 'anthropic' | 'palm' | 'llama' | 'mistral' | 'internal';
export type MemoryType = 'longTerm' | 'shortTerm' | 'procedural' | 'episodic' | 'semantic';
export type SyncStatus = 'synced' | 'pending' | 'failed' | 'partial';
export type EnvironmentType = 'browser' | 'product' | 'corporate' | 'personal' | 'mobile' | 'desktop';

export interface TokenUsage {
  used: number;
  limit: number;
  resetDate: Timestamp;
  tier: TokenTier;
  history: {
    date: Timestamp;
    count: number;
    environment: string;
  }[];
}

export interface SecurityToken {
  token: string;
  issuedAt: Timestamp;
  expiresAt: Timestamp;
  environmentId: string;
  clearance: SecurityClearance;
  fingerprint: string;
}

export interface AgentModel {
  id: string;
  name: string;
  provider: ModelProvider;
  type: AgentModelType;
  contextWindow: number;
  tokenCostPerK: number;
  capabilities: string[];
  configuration: Record<string, any>;
}

export interface Agent {
  id: string;
  userId: string;
  name: string;
  avatar?: string;
  contextCapacity: number;
  memorySlots: number;
  lastSyncTime: Timestamp;
  configuration: Record<string, any>;
  securityClearance: SecurityClearance;
  tokenUsage: TokenUsage;
  currentModelId: string;
  availableModelIds: string[];
  securityTokens: SecurityToken[];
  securityScore: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AgentMemory {
  id: string;
  agentId: string;
  memoryType: MemoryType;
  content: Record<string, any>;
  contextualTags: string[];
  productOrigin?: string;
  securityLevel: SecurityClearance;
  importance: number;
  vectorId?: string;
  lastAccessed: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AgentAccess {
  id: string;
  agentId: string;
  productId: string;
  environmentId: string;
  accessToken: string;
  refreshToken?: string;
  syncStatus: SyncStatus;
  permissions: string[];
  lastSync: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface AgentEnvironment {
  id: string;
  name: string;
  type: EnvironmentType;
  domain?: string;
  capabilities: string[];
  securityLevel: SecurityClearance;
  allowsExport: boolean;
  allowsImport: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface SalleyportToken {
  jwt: string;
  permissions: string[];
  securityContext: Record<string, any>;
  fingerprint: string;
  expiresAt: number;
}

export interface SalleyportAuthResponse {
  token: SalleyportToken;
  user: {
    id: string;
    name: string;
    email: string;
    securityClearance: SecurityClearance;
  };
  success: boolean;
}

// PineconeMemoryVector represents the vector embedding in Pinecone
interface PineconeMemoryVector extends Vector {
  metadata: {
    agentId: string;
    memoryId: string;
    memoryType: string;
    securityLevel: string;
    tags: string[];
    timestamp: number;
  };
}

/**
 * FirebaseAgentService class for managing transportable agents using Firebase, Firestore, and Pinecone
 */
export class FirebaseAgentService {
  private pineconeClient: PineconeClient;
  private pineconeIndex: string;
  private pineconeNamespace: string;
  private salleyportApiUrl: string;
  private encryptionKey: string;
  private static instance: FirebaseAgentService;

  constructor(
    pineconeApiKey: string,
    pineconeIndex: string,
    salleyportApiUrl: string,
    encryptionKey: string,
    pineconeNamespace: string = 'agent-memories'
  ) {
    this.pineconeIndex = pineconeIndex;
    this.pineconeNamespace = pineconeNamespace;
    this.salleyportApiUrl = salleyportApiUrl;
    this.encryptionKey = encryptionKey;
    this.pineconeClient = new PineconeClient();
    this.initializePinecone(pineconeApiKey);
  }

  /**
   * Get the singleton instance of the service
   */
  public static getInstance(
    pineconeApiKey?: string,
    pineconeIndex?: string,
    salleyportApiUrl?: string,
    encryptionKey?: string,
    pineconeNamespace?: string
  ): FirebaseAgentService {
    if (!FirebaseAgentService.instance) {
      if (!pineconeApiKey || !pineconeIndex || !salleyportApiUrl || !encryptionKey) {
        throw new Error('Required parameters missing for FirebaseAgentService initialization');
      }
      FirebaseAgentService.instance = new FirebaseAgentService(
        pineconeApiKey,
        pineconeIndex,
        salleyportApiUrl,
        encryptionKey,
        pineconeNamespace
      );
    }
    return FirebaseAgentService.instance;
  }

  /**
   * Initialize the Pinecone client
   */
  private async initializePinecone(apiKey: string) {
    await this.pineconeClient.init({
      apiKey,
      environment: 'us-west1', // Change to your Pinecone environment
    });
  }

  /**
   * Get a reference to the Pinecone index
   */
  private async getPineconeIndex() {
    return this.pineconeClient.Index(this.pineconeIndex);
  }

  /**
   * Authenticate with Salleyport
   */
  async authenticateWithSalleyport(username: string, password: string): Promise<SalleyportAuthResponse> {
    try {
      const response = await fetch(`${this.salleyportApiUrl}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
          deviceFingerprint: this.generateDeviceFingerprint(),
        }),
      });

      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.statusText}`);
      }

      const authResponse = await response.json();
      return authResponse as SalleyportAuthResponse;
    } catch (error) {
      console.error('Salleyport authentication error:', error);
      throw error;
    }
  }

  /**
   * Sign in with Salleyport token
   */
  async signInWithSalleyport(salleyportToken: SalleyportToken): Promise<UserCredential> {
    try {
      // Exchange Salleyport JWT for Firebase custom token
      const response = await fetch(`${this.salleyportApiUrl}/token-exchange`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${salleyportToken.jwt}`
        },
        body: JSON.stringify({
          fingerprint: salleyportToken.fingerprint
        }),
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.statusText}`);
      }

      const { firebaseToken } = await response.json();
      
      // Sign in to Firebase with custom token
      return signInWithCustomToken(auth, firebaseToken);
    } catch (error) {
      console.error('Firebase sign-in error:', error);
      throw error;
    }
  }

  /**
   * Generate device fingerprint for security
   */
  private generateDeviceFingerprint(): string {
    const userAgent = navigator.userAgent;
    const screenData = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    
    const fingerprint = crypto.SHA256(`${userAgent}|${screenData}|${timeZone}|${language}`).toString();
    return fingerprint;
  }

  /**
   * Create a new agent for a user
   */
  async createAgent(
    userId: string, 
    name: string, 
    modelId: string,
    securityClearance: SecurityClearance = 'basic',
    tokenTier: TokenTier = 'basic',
    avatar?: string
  ): Promise<Agent> {
    // Get token limit based on tier
    const tokenLimit = this.getTokenLimitForTier(tokenTier);
    
    const agentId = `agent_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const now = Timestamp.now();
    
    const newAgent: Agent = {
      id: agentId,
      userId,
      name,
      avatar,
      contextCapacity: 5, // Default capacity
      memorySlots: 10,    // Default memory slots
      lastSyncTime: now,
      configuration: {},
      securityClearance,
      tokenUsage: {
        used: 0,
        limit: tokenLimit,
        resetDate: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)), // 30 days from now
        tier: tokenTier,
        history: []
      },
      currentModelId: modelId,
      availableModelIds: [modelId],
      securityTokens: [],
      securityScore: 100, // Default security score
      createdAt: now,
      updatedAt: now
    };

    const agentRef = doc(db, 'agents', agentId);
    await setDoc(agentRef, newAgent);
    
    return newAgent;
  }

  /**
   * Get token limit based on tier
   */
  private getTokenLimitForTier(tier: TokenTier): number {
    switch (tier) {
      case 'basic':
        return 100000; // 100K tokens
      case 'pro':
        return 500000; // 500K tokens
      case 'enterprise':
        return 2000000; // 2M tokens
      case 'unlimited':
        return Number.MAX_SAFE_INTEGER;
      default:
        return 100000;
    }
  }

  /**
   * Get agent by ID
   */
  async getAgentById(agentId: string): Promise<Agent | null> {
    const agentRef = doc(db, 'agents', agentId);
    const agentSnap = await getDoc(agentRef);
    
    if (!agentSnap.exists()) {
      return null;
    }
    
    return agentSnap.data() as Agent;
  }

  /**
   * Get agent by user ID
   */
  async getAgentByUserId(userId: string): Promise<Agent | null> {
    const agentsRef = collection(db, 'agents');
    const q = query(agentsRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return null;
    }
    
    return querySnapshot.docs[0].data() as Agent;
  }

  /**
   * Update agent information
   */
  async updateAgent(agentId: string, data: Partial<Agent>): Promise<void> {
    const agentRef = doc(db, 'agents', agentId);
    
    // Remove read-only fields
    const { id, userId, createdAt, ...updateData } = data;
    
    await updateDoc(agentRef, {
      ...updateData,
      updatedAt: Timestamp.now()
    });
  }

  /**
   * Change agent model
   */
  async changeAgentModel(agentId: string, modelId: string): Promise<void> {
    const agent = await this.getAgentById(agentId);
    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }
    
    // Check if model is in available models
    if (!agent.availableModelIds.includes(modelId)) {
      throw new Error(`Model ${modelId} is not available for this agent`);
    }
    
    // Update the agent's current model
    await this.updateAgent(agentId, { currentModelId: modelId });
  }

  /**
   * Add available model to agent
   */
  async addModelToAgent(agentId: string, modelId: string): Promise<void> {
    const agent = await this.getAgentById(agentId);
    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }
    
    // Check if model is already available
    if (agent.availableModelIds.includes(modelId)) {
      return; // Model already available
    }
    
    // Add model to available models
    const availableModelIds = [...agent.availableModelIds, modelId];
    await this.updateAgent(agentId, { availableModelIds });
  }

  /**
   * Get available models for agent
   */
  async getAvailableModels(agentId: string): Promise<AgentModel[]> {
    const agent = await this.getAgentById(agentId);
    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }
    
    // Get model documents from

