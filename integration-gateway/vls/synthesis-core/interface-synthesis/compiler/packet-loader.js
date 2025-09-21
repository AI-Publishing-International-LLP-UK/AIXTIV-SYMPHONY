/**
 * ASOOS Packet Loader - Memory Efficient Dynamic Interface
 * Loads only what's needed, when needed
 */

class PacketLoader {
  constructor(config) {
    this.config = config;
    this.loadedPackets = new Map();
    this.pendingLoads = new Set();
    this.memoryThreshold = 50 * 1024 * 1024; // 50MB limit
  }

  async loadPacket(packetName) {
    // Check if already loaded
    if (this.loadedPackets.has(packetName)) {
      return this.loadedPackets.get(packetName);
    }

    // Prevent duplicate loading
    if (this.pendingLoads.has(packetName)) {
      return this.waitForLoad(packetName);
    }

    this.pendingLoads.add(packetName);

    try {
      // Check memory before loading
      await this.checkMemoryUsage();
      
      // Load packet dynamically
      const packet = await this.fetchPacket(packetName);
      
      // Cache the loaded packet
      this.loadedPackets.set(packetName, packet);
      
      console.log(`✅ Packet loaded: ${packetName}`);
      return packet;
      
    } catch (error) {
      console.error(`❌ Failed to load packet ${packetName}:`, error);
      throw error;
    } finally {
      this.pendingLoads.delete(packetName);
    }
  }

  async fetchPacket(packetName) {
    // For now, return a minimal packet structure
    // In production, this would fetch from your MCP endpoint
    const packetMap = {
      'ai_monitoring_panel': {
        render: (_config) => `<div class="packet ai-monitoring">AI Monitoring for ${_config.companyName}</div>`,
        scripts: ['ai-monitor.js'],
        styles: ['ai-monitor.css']
      },
      'chat_interface': {
        render: (config) => `
          <div class="packet chat-interface">
            <div class="chat-header">${config.companyName} Chat</div>
            <div class="chat-messages" id="chat-${Date.now()}"></div>
            <input type="text" placeholder="Chat with Testament Swarm..." />
          </div>
        `,
        scripts: ['chat.js'],
        styles: ['chat.css']
      },
      'terminal_interface': {
        render: (config) => `
          <div class="packet terminal-interface">
            <div class="terminal-header">Command Line Innovation</div>
            <div class="terminal-body">
              <div class="terminal-prompt">$ </div>
              <input type="text" class="terminal-input" />
            </div>
          </div>
        `,
        scripts: ['terminal.js'],
        styles: ['terminal.css']
      }
      // Add more packets as needed...
    };

    return packetMap[packetName] || { render: () => `<div>Packet ${packetName} not found</div>` };
  }

  async checkMemoryUsage() {
    if (performance.memory && performance.memory.usedJSHeapSize > this.memoryThreshold) {
      console.log('🧹 Memory threshold reached, cleaning up unused packets...');
      await this.cleanupUnusedPackets();
    }
  }

  async cleanupUnusedPackets() {
    // Remove packets that haven't been accessed recently
    const cutoffTime = Date.now() - (5 * 60 * 1000); // 5 minutes
    
    for (const [name, packet] of this.loadedPackets) {
      if (packet.lastAccessed && packet.lastAccessed < cutoffTime) {
        this.loadedPackets.delete(name);
        console.log(`🗑️ Cleaned up packet: ${name}`);
      }
    }
    
    // Force garbage collection if available (Node.js)
    if (global.gc) {
      global.gc();
    }
  }

  async waitForLoad(packetName) {
    return new Promise((resolve) => {
      const checkLoaded = () => {
        if (this.loadedPackets.has(packetName)) {
          resolve(this.loadedPackets.get(packetName));
        } else if (!this.pendingLoads.has(packetName)) {
          resolve(null); // Load failed
        } else {
          setTimeout(checkLoaded, 50);
        }
      };
      checkLoaded();
    });
  }
}

// Global packet loader instance (Node.js)
if (typeof global !== 'undefined') {
  global.asoos = global.asoos || {};
  global.asoos.packetLoader = new PacketLoader({
    companyName: 'ASOOS',
    mcpUrl: 'https://mcp.asoos.2100.cool'
  });
}

module.exports = PacketLoader;