/**
 * Chat Interface Packet
 * Collaboration Hub Component
 */

class ChatInterfacePacket {
  render(config) {
    const companyName = config.branding?.companyName || 'ASOOS';
    const primaryColor = config.theme?.primaryColor || '#0bb1bb';
    const mcpEndpoint = config.mcpUrl;
    
    return `
      <div class="unit-panel chat-interface" data-unit="chat_interface">
        <div class="unit-header">
          <h3>${companyName} AI Chat</h3>
          <div class="unit-status online"></div>
        </div>
        <div class="chat-container">
          <div id="chatMessages" class="chat-messages"></div>
          <div class="chat-input-container">
            <input type="text" id="chatInput" placeholder="Chat with Testament Swarm..." />
            <button id="chatSend" class="btn-primary">Send</button>
          </div>
        </div>
        <script>
          // Connect to company's MCP endpoint
          const chatEndpoint = '${mcpEndpoint}/chat';
          initializeChat('${config.sallyPortToken}', chatEndpoint);
        </script>
        <style>
          .chat-interface {
            background: rgba(${this.hexToRgb(primaryColor)}, 0.1);
            border: 1px solid rgba(${this.hexToRgb(primaryColor)}, 0.3);
          }
          .unit-status.online {
            background: ${primaryColor};
            box-shadow: 0 0 10px ${primaryColor};
          }
        </style>
      </div>
    `;
  }
  
  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? 
      `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` 
      : '11, 177, 187';
  }
}

module.exports = ChatInterfacePacket;