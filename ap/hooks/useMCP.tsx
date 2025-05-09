/**
 * MCP (Model Context Protocol) React Hook
 * Provides easy access to MCP functionality in React components
 * Version: 2.0.0
 */

import { useState, useEffect, useCallback, useContext, createContext, ReactNode } from 'react';
import { 
  ModelContextProtocol, 
  MCPConfig, 
  AgentConfig, 
  MessageContext, 
  createMCP
} from '../model-context-protocol';

/**
 * MCP Hook Context Interface
 */
interface MCPContextValue {
  /** MCP instance */
  mcp: ModelContextProtocol | null;
  
  /** Whether MCP is initialized */
  isInitialized: boolean;
  
  /** Initialization error */
  error: Error | null;
  
  /** Currently registered agents */
  agents: AgentConfig[];
  
  /** Send a message to an agent */
  sendMessage: (
    senderId: string,
    recipientId: string,
    message: string,
    contextType?: MessageContext['type'],
    metadata?: Record<string, any>
  ) => Promise<MessageContext>;
  
  /** Receive messages for an agent */
  receiveMessages: (agentId: string) => Promise<MessageContext[]>;
  
  /** Get message history */
  getMessageHistory: (filterOptions?: {
    senderId?: string;
    recipientId?: string;
    type?: MessageContext['type'];
    limit?: number;
  }) => MessageContext[];
  
  /** Register a new agent */
  registerAgent: (agent: AgentConfig) => Promise<boolean>;
  
  /** Get coherence level */
  coherenceLevel: number;
  
  /** Update state matrix */
  updateStateMatrix: (newState: any) => Promise<any>;
}

/**
 * Default MCP context value
 */
const defaultMCPContext: MCPContextValue = {
  mcp: null,
  isInitialized: false,
  error: null,
  agents: [],
  sendMessage: async () => {
    throw new Error('MCP not initialized');
  },
  receiveMessages: async () => {
    throw new Error('MCP not initialized');
  },
  getMessageHistory: () => [],
  registerAgent: async () => false,
  coherenceLevel: 0,
  updateStateMatrix: async () => ({}),
};

/**
 * MCP Context
 */
const MCPContext = createContext<MCPContextValue>(defaultMCPContext);

/**
 * MCP Provider Props
 */
interface MCPProviderProps {
  children: ReactNode;
  config: MCPConfig;
  autoInitialize?: boolean;
}

/**
 * MCP Provider Component
 */
export const MCPProvider: React.FC<MCPProviderProps> = ({
  children,
  config,
  autoInitialize = true,
}) => {
  const [mcp, setMCP] = useState<ModelContextProtocol | null>(null);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [coherenceLevel, setCoherenceLevel] = useState<number>(0);
  
  /**
   * Initialize MCP
   */
  const initialize = useCallback(async () => {
    try {
      setError(null);
      
      const mcpInstance = createMCP(config);
      setMCP(mcpInstance);
      
      const initResult = await mcpInstance.initialize();
      setIsInitialized(true);
      setCoherenceLevel(initResult.coherenceLevel);
      
      // Load agents
      setAgents(mcpInstance.listAgents());
      
      return true;
    } catch (err) {
      setError(err as Error);
      return false;
    }
  }, [config]);
  
  /**
   * Auto-initialize on mount
   */
  useEffect(() => {
    if (autoInitialize) {
      initialize();
    }
  }, [autoInitialize, initialize]);
  
  /**
   * Send a message to an agent
   */
  const sendMessage = useCallback(
    async (
      senderId: string,
      recipientId: string,
      message: string,
      contextType: MessageContext['type'] = 'instruction',
      metadata: Record<string, any> = {}
    ): Promise<MessageContext> => {
      if (!mcp || !isInitialized) {
        throw new Error('MCP not initialized');
      }
      
      return mcp.sendMessage(senderId, recipientId, message, contextType, metadata);
    },
    [mcp, isInitialized]
  );
  
  /**
   * Receive messages for an agent
   */
  const receiveMessages = useCallback(
    async (agentId: string): Promise<MessageContext[]> => {
      if (!mcp || !isInitialized) {
        throw new Error('MCP not initialized');
      }
      
      return mcp.receiveMessages(agentId);
    },
    [mcp, isInitialized]
  );
  
  /**
   * Get message history
   */
  const getMessageHistory = useCallback(
    (filterOptions?: {
      senderId?: string;
      recipientId?: string;
      type?: MessageContext['type'];
      limit?: number;
    }) => {
      if (!mcp || !isInitialized) {
        return [];
      }
      
      return mcp.getMessageHistory(filterOptions);
    },
    [mcp, isInitialized]
  );
  
  /**
   * Register a new agent
   */
  const registerAgent = useCallback(
    async (agent: AgentConfig): Promise<boolean> => {
      if (!mcp || !isInitialized) {
        throw new Error('MCP not initialized');
      }
      
      const success = await mcp.registerAgent(agent);
      
      if (success) {
        setAgents(mcp.listAgents());
      }
      
      return success;
    },
    [mcp, isInitialized]
  );
  
  /**
   * Update state matrix
   */
  const updateStateMatrix = useCallback(
    async (newState: any): Promise<any> => {
      if (!mcp || !isInitialized) {
        throw new Error('MCP not initialized');
      }
      
      const result = await mcp.updateStateMatrix(newState);
      setCoherenceLevel(result.coherenceLevel);
      
      return result;
    },
    [mcp, isInitialized]
  );
  
  /**
   * Context value
   */
  const value: MCPContextValue = {
    mcp,
    isInitialized,
    error,
    agents,
    sendMessage,
    receiveMessages,
    getMessageHistory,
    registerAgent,
    coherenceLevel,
    updateStateMatrix,
  };
  
  return <MCPContext.Provider value={value}>{children}</MCPContext.Provider>;
};

/**
 * Use MCP Hook
 */
export const useMCP = () => {
  const context = useContext(MCPContext);
  
  if (context === undefined) {
    throw new Error('useMCP must be used within an MCPProvider');
  }
  
  return context;
};

/**
 * MCP Configuration Hook Props
 */
interface UseMCPConfigProps {
  /** Auto-poll interval in milliseconds */
  autoPollInterval?: number;
  
  /** Agent ID to auto-poll for */
  agentId?: string;
  
  /** Message received callback */
  onMessageReceived?: (messages: MessageContext[]) => void;
  
  /** State update interval in milliseconds */
  stateUpdateInterval?: number;
}

/**
 * MCP Configuration Hook
 */
export const useMCPConfig = (props: UseMCPConfigProps = {}) => {
  const {
    autoPollInterval = 5000,
    agentId,
    onMessageReceived,
    stateUpdateInterval = 10000,
  } = props;
  
  const { 
    receiveMessages, 
    updateStateMatrix,
    isInitialized
  } = useMCP();
  
  /**
   * Auto-poll for messages
   */
  useEffect(() => {
    if (!isInitialized || !agentId || !autoPollInterval) {
      return () => {};
    }
    
    const pollMessages = async () => {
      try {
        const messages = await receiveMessages(agentId);
        
        if (messages.length > 0 && onMessageReceived) {
          onMessageReceived(messages);
        }
      } catch (error) {
        console.error('Failed to poll for messages:', error);
      }
    };
    
    // Poll immediately
    pollMessages();
    
    // Set up polling interval
    const intervalId = setInterval(pollMessages, autoPollInterval);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [isInitialized, agentId, autoPollInterval, onMessageReceived, receiveMessages]);
  
  /**
   * Auto-update state matrix
   */
  useEffect(() => {
    if (!isInitialized || !stateUpdateInterval) {
      return () => {};
    }
    
    const updateState = async () => {
      try {
        await updateStateMatrix({
          type: 'periodic_update',
          timestamp: Date.now(),
        });
      } catch (error) {
        console.error('Failed to update state matrix:', error);
      }
    };
    
    // Set up update interval
    const intervalId = setInterval(updateState, stateUpdateInterval);
    
    // Clean up on unmount
    return () => clearInterval(intervalId);
  }, [isInitialized, stateUpdateInterval, updateStateMatrix]);
};

export default useMCP;