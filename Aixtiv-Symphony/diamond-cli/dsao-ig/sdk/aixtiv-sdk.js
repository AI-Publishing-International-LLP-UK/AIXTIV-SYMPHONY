/**
 * Aixtiv Symphony Integration Gateway SDK
 * 
 * A JavaScript/TypeScript SDK for interacting with the Aixtiv Symphony
 * Integration Gateway. This SDK provides a simple interface for authentication,
 * agent management, and VLS solution integration.
 * 
 * @version 1.0.1
 * @author Aixtiv Team
 */

class AixtivSDK {
  /**
   * Initialize the SDK with configuration
   * @param {Object} config - Configuration object
   * @param {string} config.apiUrl - Gateway API URL
   * @param {string} config.apiKey - API key for authentication
   * @param {string} [config.environment] - Environment (development, staging, production)
   */
  constructor(config) {
    this.apiUrl = config.apiUrl || 'https://integration-gateway-mcp-yutylytffa-uw.a.run.app';
    this.apiKey = config.apiKey;
    this.environment = config.environment || 'production';
    
    if (!this.apiKey) {
      throw new Error('API key is required');
    }
  }

  /**
   * Make an authenticated HTTP request to the gateway
   * @private
   */
  async _request(endpoint, options = {}) {
    const url = `${this.apiUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`,
      ...options.headers
    };

    const response = await fetch(url, {
      ...options,
      headers
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Authentication methods
   */
  auth = {
    /**
     * Verify the current authentication token
     * @returns {Promise<Object>} User context
     */
    verify: async () => {
      return await this._request('/auth/verify', { method: 'POST' });
    }
  };

  /**
   * Agent management methods
   */
  agents = {
    /**
     * Activate a specific AI agent
     * @param {string} agentId - The ID of the agent to activate
     * @returns {Promise<Object>} Activation result
     */
    activate: async (agentId) => {
      return await this._request('/agents/activate', {
        method: 'POST',
        body: JSON.stringify({ agentId })
      });
    },

    /**
     * Delegate a task to an agent
     * @param {string} agentId - The ID of the agent
     * @param {string} taskName - Name of the task
     * @param {Object} payload - Task payload
     * @returns {Promise<Object>} Delegation result
     */
    delegate: async (agentId, taskName, payload = {}) => {
      return await this._request('/agents/delegate', {
        method: 'POST',
        body: JSON.stringify({ agentId, taskName, payload })
      });
    },

    /**
     * List all available agents
     * @returns {Promise<Array>} List of agents
     */
    list: async () => {
      return await this._request('/agents', { method: 'GET' });
    }
  };

  /**
   * VLS (Vision Lake Solutions) integration methods
   */
  vls = {
    /**
     * Access Dr. Lucy Flight Memory System
     */
    drLucy: {
      /**
       * Store a memory in the flight memory system
       * @param {Object} memory - Memory object to store
       * @returns {Promise<Object>} Storage result
       */
      storeMemory: async (memory) => {
        return await this._request('/vls/dr-lucy/memory', {
          method: 'POST',
          body: JSON.stringify(memory)
        });
      }
    },

    /**
     * Access Dr. Claude Orchestrator
     */
    drClaude: {
      /**
       * Orchestrate a complex workflow
       * @param {Object} workflow - Workflow definition
       * @returns {Promise<Object>} Orchestration result
       */
      orchestrate: async (workflow) => {
        return await this._request('/vls/dr-claude/orchestrate', {
          method: 'POST',
          body: JSON.stringify(workflow)
        });
      }
    }
  };

  /**
   * Domain management methods
   */
  domains = {
    /**
     * List all managed domains
     * @returns {Promise<Array>} List of domains
     */
    list: async () => {
      return await this._request('/domains', { method: 'GET' });
    },

    /**
     * Add a new domain
     * @param {string} domainName - Domain name to add
     * @returns {Promise<Object>} Addition result
     */
    add: async (domainName) => {
      return await this._request('/domains', {
        method: 'POST',
        body: JSON.stringify({ domain: domainName })
      });
    }
  };
}

// Export for CommonJS and ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AixtivSDK;
} else if (typeof window !== 'undefined') {
  window.AixtivSDK = AixtivSDK;
}

// Example usage:
/*
const aixtiv = new AixtivSDK({
  apiUrl: 'https://integration-gateway-mcp-yutylytffa-uw.a.run.app',
  apiKey: 'your-api-key-here',
  environment: 'production'
});

// Verify authentication
const userContext = await aixtiv.auth.verify();

// Activate an agent
const activationResult = await aixtiv.agents.activate('rix-001');

// Delegate a task
const taskResult = await aixtiv.agents.delegate('crx-002', 'analyze-data', {
  dataset: 'customer-feedback'
});
*/
