// ASOOS Master Control Program (MCP) - Main Entry Point
// This file serves as the main entry point for programmatic usage of the MCP

// Import MCP components
const mcpServer = require('./mcp-server');
const domainIntegration = require('./mcp-domain-integration');

// Export MCP components for programmatic usage
module.exports = {
  // Core MCP Server components
  server: mcpServer,

  // Domain integration
  domainIntegration,

  // MCP Client - for connecting to MCP from other components
  connect: async (options = {}) => {
    const WebSocket = require('ws');

    // Default connection options
    const defaults = {
      host: 'localhost',
      port: 3000,
      token: process.env.MCP_AUTH_TOKEN || 'oauth2',
      timeout: 30000,
      reconnect: true,
      maxRetries: 5,
    };

    // Merge with provided options
    const config = { ...defaults, ...options };

    // Create connection URL
    const url = `ws://${config.host}:${config.port}`;

    // Create connection headers
    const headers = {
      Authorization: `Bearer ${config.token}`,
    };

    // Return MCP client instance
    return new MCPClient(url, headers, config);
  },
};

// MCP Client implementation
class MCPClient {
  constructor(url, headers, config) {
    this.url = url;
    this.headers = headers;
    this.config = config;
    this.ws = null;
    this.connected = false;
    this.pendingRequests = new Map();
    this.sessionId = null;
    this.retryCount = 0;

    // Event listeners
    this.listeners = {
      connect: [],
      disconnect: [],
      error: [],
      message: [],
    };
  }

  // Connect to MCP server
  async connect() {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url, { headers: this.headers });

        // Setup timeout
        const timeout = setTimeout(() => {
          if (!this.connected) {
            this.ws.close();
            reject(new Error('Connection timeout'));
          }
        }, this.config.timeout);

        // Handle connection open
        this.ws.on('open', () => {
          clearTimeout(timeout);
          this.connected = true;
          this.retryCount = 0;
          this.emit('connect');
        });

        // Handle connection messages
        this.ws.on('message', data => {
          try {
            const message = JSON.parse(data);

            // Handle session initialization
            if (message.type === 'session_init') {
              this.sessionId = message.session_id;
              resolve(this);
            }

            // Handle request responses
            if (
              message.request_id &&
              this.pendingRequests.has(message.request_id)
            ) {
              const { resolve, reject } = this.pendingRequests.get(
                message.request_id
              );

              if (message.type === 'error') {
                reject(new Error(message.error.message));
              } else {
                resolve(message);
              }

              this.pendingRequests.delete(message.request_id);
            }

            // Emit message event
            this.emit('message', message);
          } catch (err) {
            this.emit('error', err);
          }
        });

        // Handle connection close
        this.ws.on('close', () => {
          this.connected = false;
          this.emit('disconnect');

          // Auto-reconnect if enabled
          if (
            this.config.reconnect &&
            this.retryCount < this.config.maxRetries
          ) {
            this.retryCount++;
            setTimeout(() => this.connect(), 1000 * this.retryCount);
          }
        });

        // Handle connection errors
        this.ws.on('error', err => {
          clearTimeout(timeout);
          this.emit('error', err);
          reject(err);
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  // Close connection
  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.connected = false;
    }
  }

  // Send request to MCP server
  async request(type, params = {}) {
    if (!this.connected) {
      throw new Error('Not connected to MCP server');
    }

    return new Promise((resolve, reject) => {
      try {
        // Generate request ID
        const requestId =
          Date.now().toString(36) + Math.random().toString(36).substring(2);

        // Create request message
        const message = {
          type,
          request_id: requestId,
          ...params,
        };

        // Store pending request
        this.pendingRequests.set(requestId, { resolve, reject });

        // Set request timeout
        setTimeout(() => {
          if (this.pendingRequests.has(requestId)) {
            this.pendingRequests.delete(requestId);
            reject(new Error('Request timeout'));
          }
        }, this.config.timeout);

        // Send request
        this.ws.send(JSON.stringify(message));
      } catch (err) {
        reject(err);
      }
    });
  }

  // List available resources
  async listResources() {
    return this.request('list_resources');
  }

  // Fetch a specific resource
  async fetchResource(resourceId) {
    return this.request('fetch_resource', { resource_id: resourceId });
  }

  // List available tools
  async listTools() {
    return this.request('list_tools');
  }

  // Execute a tool
  async executeTool(toolId, parameters = {}) {
    return this.request('execute_tool', { tool_id: toolId, parameters });
  }

  // List available prompts
  async listPrompts() {
    return this.request('list_prompts');
  }

  // Render a prompt
  async renderPrompt(promptId, parameters = {}) {
    return this.request('render_prompt', { prompt_id: promptId, parameters });
  }

  // Event handling
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
    return this;
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(
        cb => cb !== callback
      );
    }
    return this;
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
}
