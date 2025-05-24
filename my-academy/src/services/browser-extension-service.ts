import { v4 as uuidv4 } from 'uuid';

// Types for browser extension communication
export interface ExtensionMessage {
  id: string;
  type: string;
  payload: any;
  timestamp: number;
  source: 'extension' | 'website' | 'service';
}

export interface AgentState {
  id: string;
  name: string;
  avatar?: string;
  contextCapacity: number;
  memorySlots: number;
  lastSyncTime: Date;
  configurations: Record<string, any>;
}

export interface EnvironmentConfig {
  id: string;
  name: string;
  type: 'gmail' | 'corporate' | 'opus' | 'other';
  domain: string;
  permissions: string[];
  customSettings?: Record<string, any>;
}

/**
 * BrowserExtensionService handles communication between the browser extension
 * and various websites (Gmail, corporate portals, etc.)
 */
export class BrowserExtensionService {
  private static instance: BrowserExtensionService;
  private token: string | null = null;
  private environments: EnvironmentConfig[] = [];
  private agentState: AgentState | null = null;
  private messageListeners: Map<string, ((message: ExtensionMessage) => void)[]> = new Map();
  private connected = false;

  private constructor() {
    // Initialize the service
    this.setupMessageListener();
  }

  /**
   * Get the singleton instance of BrowserExtensionService
   */
  public static getInstance(): BrowserExtensionService {
    if (!BrowserExtensionService.instance) {
      BrowserExtensionService.instance = new BrowserExtensionService();
    }
    return BrowserExtensionService.instance;
  }

  /**
   * Initialize the connection with the browser extension
   */
  public async connect(): Promise<boolean> {
    try {
      // Check if extension is available
      if (typeof window === 'undefined' || !window.chrome || !window.chrome.runtime) {
        console.error('Browser extension not detected');
        return false;
      }

      // Send handshake message to extension
      const response = await this.sendMessage({
        type: 'HANDSHAKE',
        payload: { version: '1.0.0' }
      });

      if (response && response.type === 'HANDSHAKE_ACK') {
        this.connected = true;
        this.token = response.payload.token;
        
        // Load environments
        await this.loadEnvironments();
        
        // Load agent state
        await this.loadAgentState();
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to connect to browser extension:', error);
      return false;
    }
  }

  /**
   * Check if we're currently on a supported environment
   */
  public detectCurrentEnvironment(): EnvironmentConfig | null {
    if (typeof window === 'undefined') return null;
    
    const currentDomain = window.location.hostname;
    
    // Check if current domain matches any known environment
    return this.environments.find(env => {
      if (env.type === 'gmail' && currentDomain.includes('mail.google.com')) {
        return true;
      }
      
      return currentDomain.includes(env.domain);
    }) || null;
  }

  /**
   * Initialize Gmail-specific integration
   */
  public async initializeGmailIntegration(): Promise<boolean> {
    try {
      // Check if we're on Gmail
      if (typeof window === 'undefined' || !window.location.hostname.includes('mail.google.com')) {
        return false;
      }

      // Register Gmail-specific listeners
      await this.sendMessage({
        type: 'REGISTER_GMAIL_LISTENERS',
        payload: {
          listeners: ['new_email', 'compose', 'read_email']
        }
      });

      // Initialize Gmail UI integration
      this.injectGmailUI();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize Gmail integration:', error);
      return false;
    }
  }

  /**
   * Initialize corporate portal integration
   * @param portalConfig Configuration for the corporate portal
   */
  public async initializeCorporatePortalIntegration(portalConfig: {
    domain: string;
    selectors: Record<string, string>;
    customScripts?: string[];
  }): Promise<boolean> {
    try {
      // Check if we're on the corporate portal
      if (typeof window === 'undefined' || !window.location.hostname.includes(portalConfig.domain)) {
        return false;
      }

      // Register corporate portal event listeners
      await this.sendMessage({
        type: 'REGISTER_CORPORATE_LISTENERS',
        payload: {
          domain: portalConfig.domain,
          selectors: portalConfig.selectors
        }
      });

      // Initialize corporate portal UI integration
      this.injectCorporatePortalUI(portalConfig);
      
      return true;
    } catch (error) {
      console.error('Failed to initialize corporate portal integration:', error);
      return false;
    }
  }

  /**
   * Register a listener for specific message types from the extension
   */
  public onMessage(type: string, callback: (message: ExtensionMessage) => void): () => void {
    if (!this.messageListeners.has(type)) {
      this.messageListeners.set(type, []);
    }
    
    this.messageListeners.get(type)?.push(callback);
    
    // Return unsubscribe function
    return () => {
      const listeners = this.messageListeners.get(type) || [];
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    };
  }

  /**
   * Send agent actions to the current environment
   */
  public async sendAgentAction(action: {
    type: string;
    payload: any;
    target?: string;
  }): Promise<any> {
    const currentEnv = this.detectCurrentEnvironment();
    
    if (!currentEnv) {
      throw new Error('Not in a supported environment');
    }
    
    return this.sendMessage({
      type: 'AGENT_ACTION',
      payload: {
        action,
        environment: currentEnv.id
      }
    });
  }

  /**
   * Sync agent state between environments
   */
  public async syncAgentState(): Promise<boolean> {
    try {
      const response = await this.sendMessage({
        type: 'SYNC_AGENT_STATE',
        payload: {
          currentEnvironment: this.detectCurrentEnvironment()?.id
        }
      });
      
      if (response && response.type === 'SYNC_AGENT_STATE_COMPLETE') {
        // Update local agent state
        this.agentState = response.payload.agentState;
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to sync agent state:', error);
      return false;
    }
  }

  /**
   * Get the current agent state
   */
  public getAgentState(): AgentState | null {
    return this.agentState;
  }

  /**
   * Update agent memory with new information from the current environment
   */
  public async updateAgentMemory(memory: {
    type: 'shortTerm' | 'longTerm' | 'procedural';
    content: any;
    tags: string[];
  }): Promise<boolean> {
    try {
      const response = await this.sendMessage({
        type: 'UPDATE_AGENT_MEMORY',
        payload: {
          memory,
          environment: this.detectCurrentEnvironment()?.id
        }
      });
      
      return response && response.type === 'MEMORY_UPDATED';
    } catch (error) {
      console.error('Failed to update agent memory:', error);
      return false;
    }
  }

  /**
   * Add a new environment for the agent to integrate with
   */
  public async addEnvironment(environment: Omit<EnvironmentConfig, 'id'>): Promise<EnvironmentConfig | null> {
    try {
      const response = await this.sendMessage({
        type: 'ADD_ENVIRONMENT',
        payload: {
          environment: {
            ...environment,
            id: uuidv4()
          }
        }
      });
      
      if (response && response.type === 'ENVIRONMENT_ADDED') {
        // Update local environments list
        await this.loadEnvironments();
        return response.payload.environment;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to add environment:', error);
      return null;
    }
  }

  // Private methods

  /**
   * Setup listener for messages from the extension
   */
  private setupMessageListener(): void {
    if (typeof window !== 'undefined') {
      window.addEventListener('message', (event) => {
        // Only process messages from the extension
        if (event.source !== window || !event.data.source || event.data.source !== 'extension') {
          return;
        }
        
        const message = event.data as ExtensionMessage;
        
        // Process message
        this.processIncomingMessage(message);
      });
    }
  }

  /**
   * Process incoming messages from the extension
   */
  private processIncomingMessage(message: ExtensionMessage): void {
    // Call any registered listeners for this message type
    const listeners = this.messageListeners.get(message.type) || [];
    listeners.forEach(callback => callback(message));
    
    // Handle system messages
    if (message.type === 'AGENT_STATE_UPDATED') {
      this.agentState = message.payload.agentState;
    } else if (message.type === 'ENVIRONMENTS_UPDATED') {
      this.environments = message.payload.environments;
    }
  }

  /**
   * Send a message to the browser extension
   */
  private async sendMessage(message: Omit<ExtensionMessage, 'id' | 'timestamp' | 'source'>): Promise<ExtensionMessage | null> {
    return new Promise((resolve) => {
      const id = uuidv4();
      
      // Create full message
      const fullMessage: ExtensionMessage = {
        id,
        timestamp: Date.now(),
        source: 'website',
        ...message
      };
      
      // Register one-time listener for response
      const responseType = `${message.type}_RESPONSE`;
      const listener = (response: ExtensionMessage) => {
        if (response.id === id || response.type === responseType) {
          resolve(response);
          
          // Remove this listener
          const listeners = this.messageListeners.get(responseType) || [];
          const index = listeners.indexOf(listener);
          if (index !== -1) {
            listeners.splice(index, 1);
          }
        }
      };
      
      // Add listener
      if (!this.messageListeners.has(responseType)) {
        this.messageListeners.set(responseType, []);
      }
      this.messageListeners.get(responseType)?.push(listener);
      
      // Send message
      window.postMessage(fullMessage, '*');
      
      // Set timeout to remove listener
      setTimeout(() => {
        const listeners = this.messageListeners.get(responseType) || [];
        const index = listeners.indexOf(listener);
        if (index !== -1) {
          listeners.splice(index, 1);
        }
        resolve(null);
      }, 5000);
    });
  }

  /**
   * Load agent environments from the extension
   */
  private async loadEnvironments(): Promise<void> {
    try {
      const response = await this.sendMessage({
        type: 'GET_ENVIRONMENTS',
        payload: {}
      });
      
      if (response && response.type === 'ENVIRONMENTS_RESPONSE') {
        this.environments = response.payload.environments;
      }
    } catch (error) {
      console.error('Failed to load environments:', error);
    }
  }

  /**
   * Load agent state from the extension
   */
  private async loadAgentState(): Promise<void> {
    try {
      const response = await this.sendMessage({
        type: 'GET_AGENT_STATE',
        payload: {}
      });
      
      if (response && response.type === 'AGENT_STATE_RESPONSE') {
        this.agentState = response.payload.agentState;
      }
    } catch (error) {
      console.error('Failed to load agent state:', error);
    }
  }

  /**
   * Inject UI elements for Gmail integration
   */
  private injectGmailUI(): void {
    if (typeof document === 'undefined') return;
    
    // Create container for agent UI
    const container = document.createElement('div');
    container.id = 'agent-gmail-container';
    container.style.position = 'fixed';
    container.style.right = '20px';
    container.style.bottom = '20px';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    
    // Create toggle button
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Agent';
    toggleButton.style.padding = '8px 16px';
    toggleButton.style.backgroundColor = '#1a73e8';
    toggleButton.style.color = 'white';
    toggleButton.style.border = 'none';
    toggleButton.style.borderRadius = '4px';
    toggleButton.style.cursor = 'pointer';
    container.appendChild(toggleButton);
    
    // Create panel (initially hidden)
    const panel = document.createElement('div');
    panel.style.backgroundColor = 'white';
    panel.style.border = '1px solid #ccc';
    panel.style.borderRadius = '4px';
    panel.style.padding = '16px';
    panel.style.width = '300px';
    panel.style.display = 'none';
    panel.style.marginTop = '8px';
    panel.innerHTML = '<h3>Agent Assistant</h3><p>Your agent is ready to help with emails.</p>';
    container.appendChild(panel);
    
    // Toggle panel on button click
    toggleButton.addEventListener('click', () => {
      panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    });
  }

  /**
   * Inject UI elements for corporate portal integration
   */
  private injectCorporatePortalUI(portalConfig: {
    domain: string;
    selectors: Record<string, string>;
  }): void {
    if (typeof document === 'undefined') return;
    
    // Create container for agent UI
    const container = document.createElement('div');
    container.id = 'agent-corporate-container';
    container.style.position = 'fixed';
    container.style.right = '20px';
    container.style.bottom = '20px';
    container.style.zIndex = '9999';
    document.body.appendChild(container);
    
    // Create toggle button
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Agent';
    toggleButton.style.padding = '8px 16px';
    toggleButton.style.backgroundColor = '#444';
    toggleButton.style.color = 'white';
    toggleButton.style.border = 'none';
    toggleButton.style.borderRadius = '4px';
    toggleButton.style.cursor = 'pointer';
    container.appendChild(

