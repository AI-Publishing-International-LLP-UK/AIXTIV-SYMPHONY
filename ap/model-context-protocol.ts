/**
 * Model Context Protocol (MCP) Implementation
 * Comprehensive framework for intelligent agent communication
 * Version: 2.0.0
 */

import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';

/**
 * MCP Configuration Interface
 */
export interface MCPConfig {
  /** Base URL for the MCP server */
  mcpServerUrl: string;
  
  /** Client ID for OAuth2 authentication */
  clientId: string;
  
  /** Client secret for OAuth2 authentication */
  clientSecret: string;
  
  /** Redirect URI for OAuth2 authentication */
  redirectUri: string;
  
  /** Scope for OAuth2 authentication */
  scope?: string;
  
  /** State matrix for quantum-like transformations */
  stateMatrix?: Record<string, any>;
  
  /** Token storage type */
  tokenStorage?: 'localStorage' | 'sessionStorage' | 'memory';
  
  /** Quantum configuration */
  quantum?: {
    /** Whether quantum-like transformations are enabled */
    enabled: boolean;
    
    /** Coherence threshold for quantum-like transformations */
    coherenceThreshold: number;
    
    /** State vector size for quantum-like transformations */
    stateVectorSize: number;
  };
  
  /** Debug mode */
  debug?: boolean;
}

/**
 * Agent Configuration Interface
 */
export interface AgentConfig {
  /** Agent ID */
  id: string;
  
  /** Agent name */
  name: string;
  
  /** Agent role */
  role: string;
  
  /** Agent capabilities */
  capabilities: string[];
  
  /** Agent voice configuration */
  voice?: {
    /** Language code */
    languageCode: string;
    
    /** Voice name */
    voiceName: string;
  };
  
  /** Agent model parameters */
  modelParameters?: Record<string, any>;
}

/**
 * Message Context Interface
 */
export interface MessageContext {
  /** Context ID */
  id: string;
  
  /** Session ID */
  sessionId: string;
  
  /** Sender ID */
  senderId: string;
  
  /** Recipient ID */
  recipientId: string;
  
  /** Message timestamp */
  timestamp: Date;
  
  /** Context type */
  type: 'instruction' | 'observation' | 'response' | 'analysis' | 'action';
  
  /** Context data */
  data: Record<string, any>;
  
  /** Context metadata */
  metadata?: Record<string, any>;
}

/**
 * Token Manager for OAuth2 authentication
 */
class TokenManager {
  private tokens: {
    accessToken: string | null;
    refreshToken: string | null;
    expiresAt: number | null;
  };
  
  private config: MCPConfig;
  
  constructor(config: MCPConfig) {
    this.config = config;
    this.tokens = {
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
    };
    
    // Load tokens from storage if available
    this.loadTokens();
  }
  
  /**
   * Load tokens from storage
   */
  private loadTokens() {
    if (this.config.tokenStorage === 'localStorage' && typeof localStorage !== 'undefined') {
      const storedTokens = localStorage.getItem('mcp.tokens');
      if (storedTokens) {
        try {
          this.tokens = JSON.parse(storedTokens);
        } catch (error) {
          console.error('Failed to parse stored tokens:', error);
        }
      }
    } else if (this.config.tokenStorage === 'sessionStorage' && typeof sessionStorage !== 'undefined') {
      const storedTokens = sessionStorage.getItem('mcp.tokens');
      if (storedTokens) {
        try {
          this.tokens = JSON.parse(storedTokens);
        } catch (error) {
          console.error('Failed to parse stored tokens:', error);
        }
      }
    }
  }
  
  /**
   * Save tokens to storage
   */
  private saveTokens() {
    if (this.config.tokenStorage === 'localStorage' && typeof localStorage !== 'undefined') {
      localStorage.setItem('mcp.tokens', JSON.stringify(this.tokens));
    } else if (this.config.tokenStorage === 'sessionStorage' && typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('mcp.tokens', JSON.stringify(this.tokens));
    }
  }
  
  /**
   * Generate a random state for OAuth2 authentication
   */
  async generateAuthState(): Promise<string> {
    return uuidv4();
  }
  
  /**
   * Check if the access token is valid
   */
  isTokenValid(): boolean {
    if (!this.tokens.accessToken || !this.tokens.expiresAt) {
      return false;
    }
    
    // Add a 5-minute buffer to ensure the token is still valid
    const now = Date.now();
    return this.tokens.expiresAt > now + 5 * 60 * 1000;
  }
  
  /**
   * Get the access token, refreshing if necessary
   */
  async getAccessToken(): Promise<string> {
    if (this.isTokenValid()) {
      return this.tokens.accessToken!;
    }
    
    // Token is expired or missing, try to refresh
    if (this.tokens.refreshToken) {
      await this.refreshAccessToken();
      return this.tokens.accessToken!;
    }
    
    throw new Error('No valid access token or refresh token available');
  }
  
  /**
   * Refresh the access token using the refresh token
   */
  async refreshAccessToken(): Promise<void> {
    try {
      const response = await axios.post(`${this.config.mcpServerUrl}/oauth/token`, {
        grant_type: 'refresh_token',
        refresh_token: this.tokens.refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      });
      
      const { access_token, refresh_token, expires_in } = response.data;
      
      this.tokens = {
        accessToken: access_token,
        refreshToken: refresh_token || this.tokens.refreshToken,
        expiresAt: Date.now() + expires_in * 1000,
      };
      
      this.saveTokens();
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      throw error;
    }
  }
  
  /**
   * Exchange an authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<void> {
    try {
      const response = await axios.post(`${this.config.mcpServerUrl}/oauth/token`, {
        grant_type: 'authorization_code',
        code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
      });
      
      const { access_token, refresh_token, expires_in } = response.data;
      
      this.tokens = {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: Date.now() + expires_in * 1000,
      };
      
      this.saveTokens();
    } catch (error) {
      console.error('Failed to exchange code for tokens:', error);
      throw error;
    }
  }
  
  /**
   * Set tokens directly
   */
  setTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
    this.tokens = {
      accessToken,
      refreshToken,
      expiresAt: Date.now() + expiresIn * 1000,
    };
    
    this.saveTokens();
  }
  
  /**
   * Clear tokens
   */
  clearTokens(): void {
    this.tokens = {
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
    };
    
    if (this.config.tokenStorage === 'localStorage' && typeof localStorage !== 'undefined') {
      localStorage.removeItem('mcp.tokens');
    } else if (this.config.tokenStorage === 'sessionStorage' && typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('mcp.tokens');
    }
  }
  
  /**
   * Check and refresh token if necessary
   */
  async checkAndRefreshToken(): Promise<void> {
    if (!this.isTokenValid() && this.tokens.refreshToken) {
      await this.refreshAccessToken();
    }
  }
}

/**
 * State Handler for quantum-like transformations
 */
class StateHandler {
  private stateMatrix: Record<string, any>;
  private currentVector: number[];
  private coherenceLevel: number;
  
  constructor(stateMatrix: Record<string, any> = {}) {
    this.stateMatrix = stateMatrix;
    this.currentVector = [1, 0, 0, 0, 0, 0, 0, 0]; // Default 8D vector
    this.coherenceLevel = 1.0;
  }
  
  /**
   * Initialize the state
   */
  async initializeState(): Promise<void> {
    // Initialize with identity state
    this.currentVector = [1, 0, 0, 0, 0, 0, 0, 0];
    this.coherenceLevel = 1.0;
  }
  
  /**
   * Get the current vector
   */
  getCurrentVector(): number[] {
    return [...this.currentVector];
  }
  
  /**
   * Get the coherence level
   */
  getCoherenceLevel(): number {
    return this.coherenceLevel;
  }
  
  /**
   * Process a state update
   */
  async processStateUpdate(newState: any): Promise<any> {
    // Apply transformation based on new state
    const updatedVector = this.applyTransformation(this.currentVector, newState);
    
    // Calculate new coherence level
    this.coherenceLevel = this.calculateCoherence(updatedVector);
    
    // Update current vector
    this.currentVector = updatedVector;
    
    return {
      vector: this.currentVector,
      coherenceLevel: this.coherenceLevel,
      timestamp: Date.now(),
    };
  }
  
  /**
   * Apply a transformation to a vector
   */
  private applyTransformation(vector: number[], transformation: any): number[] {
    // Simple matrix multiplication as an example
    // In a real implementation, this would be more sophisticated
    return vector.map((value, index) => {
      return value * (transformation.factor || 1);
    });
  }
  
  /**
   * Calculate coherence of a vector
   */
  private calculateCoherence(vector: number[]): number {
    // Calculate the L2 norm and normalize to [0, 1]
    const sumOfSquares = vector.reduce((sum, value) => sum + value * value, 0);
    return Math.min(1.0, Math.sqrt(sumOfSquares));
  }
}

/**
 * MCP (Model Context Protocol) Implementation
 */
export class ModelContextProtocol {
  private config: MCPConfig;
  private tokenManager: TokenManager;
  private stateHandler: StateHandler;
  private client: AxiosInstance;
  private agents: Map<string, AgentConfig>;
  private sessionId: string;
  private messageHistory: MessageContext[];
  
  /**
   * Create a new MCP instance
   */
  constructor(config: MCPConfig) {
    this.config = {
      mcpServerUrl: 'https://mcp.aixtiv.io',
      clientId: '',
      clientSecret: '',
      redirectUri: '',
      scope: 'read write execute',
      tokenStorage: 'localStorage',
      quantum: {
        enabled: false,
        coherenceThreshold: 0.95,
        stateVectorSize: 8,
      },
      debug: false,
      ...config,
    };
    
    this.tokenManager = new TokenManager(this.config);
    this.stateHandler = new StateHandler(this.config.stateMatrix);
    this.agents = new Map();
    this.sessionId = uuidv4();
    this.messageHistory = [];
    
    // Create HTTP client
    this.client = axios.create({
      baseURL: this.config.mcpServerUrl,
      timeout: 30000,
    });
    
    // Add request interceptor for authentication
    this.client.interceptors.request.use(async (config) => {
      try {
        const token = await this.tokenManager.getAccessToken();
        config.headers.Authorization = `Bearer ${token}`;
      } catch (error) {
        console.error('Failed to get access token:', error);
      }
      return config;
    });
    
    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, try to refresh
          try {
            await this.tokenManager.refreshAccessToken();
            // Retry the request
            const originalRequest = error.config;
            originalRequest.headers.Authorization = `Bearer ${await this.tokenManager.getAccessToken()}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            console.error('Failed to refresh token:', refreshError);
          }
        }
        return Promise.reject(error);
      }
    );
  }
  
  /**
   * Initialize the MCP
   */
  async initialize(): Promise<{ status: string; coherenceLevel: number; readiness: boolean }> {
    try {
      // Initialize token manager
      await this.tokenManager.checkAndRefreshToken();
      
      // Initialize state handler
      await this.stateHandler.initializeState();
      
      // Check server readiness
      const readiness = await this.checkSystemReadiness();
      
      if (this.config.debug) {
        console.log('MCP initialized:', {
          status: 'initialized',
          coherenceLevel: this.stateHandler.getCoherenceLevel(),
          readiness,
        });
      }
      
      return {
        status: 'initialized',
        coherenceLevel: this.stateHandler.getCoherenceLevel(),
        readiness,
      };
    } catch (error) {
      console.error('MCP Initialization Error:', error);
      throw new MCPInitializationError((error as Error).message);
    }
  }
  
  /**
   * Check system readiness
   */
  async checkSystemReadiness(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.data.status === 'UP';
    } catch (error) {
      console.error('System readiness check failed:', error);
      return false;
    }
  }
  
  /**
   * Authenticate with OAuth2
   */
  async authenticate(): Promise<{ url: string; state: string; timestamp: number; coherenceVector: number[] }> {
    const authState = await this.tokenManager.generateAuthState();
    
    const authUrl = new URL(`${this.config.mcpServerUrl}/oauth/authorize`);
    authUrl.searchParams.append('client_id', this.config.clientId);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', this.config.redirectUri);
    authUrl.searchParams.append('state', authState);
    authUrl.searchParams.append('scope', this.config.scope || 'read write execute');
    
    return {
      url: authUrl.toString(),
      state: authState,
      timestamp: Date.now(),
      coherenceVector: this.stateHandler.getCurrentVector(),
    };
  }
  
  /**
   * Handle OAuth2 callback
   */
  async handleCallback(code: string, state: string): Promise<boolean> {
    try {
      await this.tokenManager.exchangeCodeForTokens(code);
      return true;
    } catch (error) {
      console.error('Failed to handle callback:', error);
      return false;
    }
  }
  
  /**
   * Register an agent
   */
  async registerAgent(agent: AgentConfig): Promise<boolean> {
    try {
      // Register with server
      const response = await this.client.post('/agents/register', agent);
      
      if (response.status === 200 || response.status === 201) {
        // Store locally
        this.agents.set(agent.id, agent);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to register agent:', error);
      return false;
    }
  }
  
  /**
   * Get an agent by ID
   */
  getAgent(agentId: string): AgentConfig | undefined {
    return this.agents.get(agentId);
  }
  
  /**
   * List all registered agents
   */
  listAgents(): AgentConfig[] {
    return Array.from(this.agents.values());
  }
  
  /**
   * Send a message to an agent
   */
  async sendMessage(
    senderId: string,
    recipientId: string,
    message: string,
    contextType: MessageContext['type'] = 'instruction',
    metadata: Record<string, any> = {}
  ): Promise<MessageContext> {
    // Create message context
    const context: MessageContext = {
      id: uuidv4(),
      sessionId: this.sessionId,
      senderId,
      recipientId,
      timestamp: new Date(),
      type: contextType,
      data: {
        message,
        format: 'text',
      },
      metadata: {
        ...metadata,
        coherenceLevel: this.stateHandler.getCoherenceLevel(),
        coherenceVector: this.stateHandler.getCurrentVector(),
      },
    };
    
    try {
      // Send message to server
      const response = await this.client.post('/messages', context);
      
      // Store in history
      this.messageHistory.push(context);
      
      // Update state
      await this.stateHandler.processStateUpdate({
        type: 'message_sent',
        context,
      });
      
      return context;
    } catch (error) {
      console.error('Failed to send message:', error);
      throw new MCPError({
        message: `Failed to send message: ${(error as Error).message}`,
        type: 'MESSAGE_ERROR',
        retryable: true,
      });
    }
  }
  
  /**
   * Receive messages for an agent
   */
  async receiveMessages(agentId: string): Promise<MessageContext[]> {
    try {
      const response = await this.client.get(`/messages/${agentId}`);
      
      // Add messages to history
      for (const message of response.data) {
        this.messageHistory.push(message);
      }
      
      return response.data;
    } catch (error) {
      console.error('Failed to receive messages:', error);
      throw new MCPError({
        message: `Failed to receive messages: ${(error as Error).message}`,
        type: 'MESSAGE_ERROR',
        retryable: true,
      });
    }
  }
  
  /**
   * Get message history
   */
  getMessageHistory(
    filterOptions: {
      senderId?: string;
      recipientId?: string;
      type?: MessageContext['type'];
      limit?: number;
    } = {}
  ): MessageContext[] {
    let filteredHistory = [...this.messageHistory];
    
    // Apply filters
    if (filterOptions.senderId) {
      filteredHistory = filteredHistory.filter(
        (msg) => msg.senderId === filterOptions.senderId
      );
    }
    
    if (filterOptions.recipientId) {
      filteredHistory = filteredHistory.filter(
        (msg) => msg.recipientId === filterOptions.recipientId
      );
    }
    
    if (filterOptions.type) {
      filteredHistory = filteredHistory.filter(
        (msg) => msg.type === filterOptions.type
      );
    }
    
    // Sort by timestamp (newest first)
    filteredHistory.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    // Apply limit
    if (filterOptions.limit) {
      filteredHistory = filteredHistory.slice(0, filterOptions.limit);
    }
    
    return filteredHistory;
  }
  
  /**
   * Establish server connection
   */
  async establishServerConnection(): Promise<any> {
    const connectionParams = {
      protocol: 'mcp-v2',
      timestamp: Date.now(),
      stateVector: this.stateHandler.getCurrentVector(),
      coherenceLevel: this.stateHandler.getCoherenceLevel(),
      capabilities: this.getSystemCapabilities(),
      sessionId: this.sessionId,
    };
    
    try {
      const response = await this.client.post('/establish', connectionParams);
      return this.handleConnectionResponse(response);
    } catch (error) {
      throw new MCPConnectionError((error as Error).message);
    }
  }
  
  /**
   * Handle connection response
   */
  private handleConnectionResponse(response: any): any {
    // Process and return connection details
    return response.data;
  }
  
  /**
   * Update state matrix
   */
  async updateStateMatrix(newState: any): Promise<any> {
    const stateUpdate = await this.stateHandler.processStateUpdate(newState);
    
    if (this.config.quantum?.enabled) {
      return this.applyQuantumTransformation(stateUpdate);
    }
    
    return stateUpdate;
  }
  
  /**
   * Apply quantum transformation
   */
  private applyQuantumTransformation(state: any): any {
    const coherenceLevel = this.calculateCoherence(state);
    const transformedState = this.transformStateVector(state);
    
    return {
      ...transformedState,
      coherenceLevel,
      timestamp: Date.now(),
      metadata: {
        transformationType: 'quantum',
        coherenceThreshold: this.config.quantum?.coherenceThreshold,
        stateVectorSize: this.config.quantum?.stateVectorSize,
      },
    };
  }
  
  /**
   * Calculate coherence
   */
  private calculateCoherence(state: any): number {
    // Implementation of coherence calculation based on state vector
    const stateVector = state.vector || [];
    let coherenceSum = 0;
    
    for (let i = 0; i < stateVector.length; i++) {
      coherenceSum += Math.pow(Math.abs(stateVector[i]), 2);
    }
    
    return Math.sqrt(coherenceSum);
  }
  
  /**
   * Transform state vector
   */
  private transformStateVector(state: any): any {
    // Implementation of quantum-like state transformation
    const vector = state.vector || [];
    return {
      ...state,
      vector: vector.map((component: number) => {
        const phase = Math.random() * Math.PI * 2;
        return {
          magnitude: Math.abs(component),
          phase: phase,
          value: component * Math.cos(phase),
        };
      }),
    };
  }
  
  /**
   * Get system capabilities
   */
  private getSystemCapabilities(): Record<string, any> {
    return {
      quantum: this.config.quantum?.enabled,
      stateVectorSize: this.config.quantum?.stateVectorSize,
      coherenceThreshold: this.config.quantum?.coherenceThreshold,
      supportedProtocols: ['mcp-v2', 'quantum-state', 'coherence-sync'],
      systemVersion: '2.0.0',
      features: {
        stateTransformation: true,
        coherenceTracking: true,
        quantumOptimization: this.config.quantum?.enabled,
        multiAgentCommunication: true,
      },
    };
  }
}

/**
 * Base error class
 */
export class MCPError extends Error {
  details: any;
  
  constructor(details: any) {
    super(details.message);
    this.name = 'MCPError';
    this.details = details;
  }
}

/**
 * Initialization error
 */
export class MCPInitializationError extends MCPError {
  constructor(message: string) {
    super({
      message,
      type: 'INITIALIZATION_ERROR',
      retryable: true,
    });
    this.name = 'MCPInitializationError';
  }
}

/**
 * Connection error
 */
export class MCPConnectionError extends MCPError {
  constructor(message: string) {
    super({
      message,
      type: 'CONNECTION_ERROR',
      retryable: true,
    });
    this.name = 'MCPConnectionError';
  }
}

// Export singleton instance creator
export const createMCP = (config: MCPConfig): ModelContextProtocol => {
  return new ModelContextProtocol(config);
};

export default createMCP;