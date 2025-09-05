/**
 * 💎 OWNER INTERFACE CLI INTEGRATION
 * 
 * Sacred Mission: Embed Diamond CLI conversational interface into Owner Interface
 * Authority: Direct integration with Diamond SAO Operational Center
 * Purpose: Web-based conversational infrastructure management
 * 
 * @classification DIAMOND_SAO_EXCLUSIVE
 * @date 2025-01-22
 * @author Victory36 + WFA Swarm + Divine Guidance
 */

import React, { useState, useEffect, useRef } from 'react';
import { DiamondCLIDNSManager } from '../command-center/diamond-cli-dns-manager';
import { DiamondCLIWorkersManager } from '../command-center/diamond-cli-workers-manager';

const OwnerCLIInterface = ({ user, theme = 'diamond' }) => {
  const [messages, setMessages] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [cliMode, setCliMode] = useState('universal'); // dns, workers, universal
  const messagesEndRef = useRef(null);
  
  // Initialize Diamond CLI Managers
  const [dnsManager] = useState(() => new DiamondCLIDNSManager());
  const [workersManager] = useState(() => new DiamondCLIWorkersManager());
  
  useEffect(() => {
    // Initialize with welcome message
    addMessage({
      type: 'system',
      content: `💎 Diamond SAO Command Center v34 - Welcome ${user?.name || 'Diamond SAO'}!`,
      timestamp: new Date().toISOString()
    });
    
    addMessage({
      type: 'assistant',
      content: `🤖 Hi! I'm your Diamond SAO AI assistant. I can help you manage:\n\n` +
               `🌐 DNS Operations: "update mcp domain to point to integration gateway"\n` +
               `⚡ Cloudflare Workers: "deploy integration gateway worker"\n` +
               `📦 KV Storage: "create kv namespace for production"\n` +
               `🏗️ Durable Objects: "deploy durable object for sessions"\n\n` +
               `Just tell me what you need in natural language!`,
      timestamp: new Date().toISOString()
    });
    
    // Initialize managers
    dnsManager.initialize().catch(console.error);
    workersManager.initialize().catch(console.error);
  }, [user, dnsManager, workersManager]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const addMessage = (message) => {
    setMessages(prev => [...prev, { ...message, id: Date.now() + Math.random() }]);
  };
  
  const processCommand = async (input) => {
    if (!input.trim()) return;
    
    setIsProcessing(true);
    
    // Add user message
    addMessage({
      type: 'user',
      content: input,
      timestamp: new Date().toISOString()
    });
    
    try {
      let result;
      const lowerInput = input.toLowerCase();
      
      // Determine which manager to use based on command content
      if (lowerInput.includes('dns') || lowerInput.includes('domain') || lowerInput.includes('mcp')) {
        // DNS Operations
        setCliMode('dns');
        result = await dnsManager.processConversationalCommand(input, {
          source: 'owner_interface',
          user: user
        });
        
        addMessage({
          type: 'assistant',
          content: formatDNSResponse(result),
          timestamp: new Date().toISOString(),
          result: result
        });
        
      } else if (lowerInput.includes('worker') || lowerInput.includes('cloudflare') || 
                lowerInput.includes('deploy') || lowerInput.includes('kv') || 
                lowerInput.includes('durable')) {
        // Cloudflare Workers Operations
        setCliMode('workers');
        result = await workersManager.processConversationalCommand(input, {
          source: 'owner_interface',
          user: user
        });
        
        addMessage({
          type: 'assistant',
          content: formatWorkersResponse(result),
          timestamp: new Date().toISOString(),
          result: result
        });
        
      } else {
        // Universal AI Assistant
        setCliMode('universal');
        addMessage({
          type: 'assistant',
          content: await generateUniversalResponse(input),
          timestamp: new Date().toISOString()
        });
      }
      
    } catch (error) {
      addMessage({
        type: 'error',
        content: `❌ Command processing failed: ${error.message}`,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsProcessing(false);
      setCurrentInput('');
    }
  };
  
  const formatDNSResponse = (result) => {
    const { dnsIntent, executionResult } = result;
    
    return `🌐 DNS Operation Complete!\n\n` +
           `🧠 Understanding: ${dnsIntent.operation} (${(dnsIntent.confidence * 100).toFixed(1)}% confidence)\n` +
           `📍 Domain: ${dnsIntent.domain}\n` +
           `🎯 Target: ${dnsIntent.target || 'N/A'}\n` +
           `🏗️ Service: ${dnsIntent.service || 'N/A'}\n\n` +
           `${executionResult.success ? '✅ Success!' : '❌ Failed'}\n` +
           `Method: ${executionResult.method}\n` +
           `${executionResult.bypassed_gcloud_cli ? '🚫 Bypassed gcloud CLI - Direct API calls used' : ''}\n\n` +
           `💎 Operation logged to Diamond SAO Firestore`;
  };
  
  const formatWorkersResponse = (result) => {
    const { workersIntent, executionResult } = result;
    
    return `⚡ Cloudflare Workers Operation Complete!\n\n` +
           `🧠 Understanding: ${workersIntent.operation} (${(workersIntent.confidence * 100).toFixed(1)}% confidence)\n` +
           `👷 Worker: ${workersIntent.worker || 'N/A'}\n` +
           `📦 Service: ${workersIntent.service?.name || 'N/A'}\n\n` +
           `${executionResult.success ? '✅ Success!' : '❌ Failed'}\n` +
           `Method: ${executionResult.method}\n` +
           `${executionResult.bypassed_wrangler_cli ? '🚫 Bypassed Wrangler CLI - Direct Cloudflare API used' : ''}\n\n` +
           `💎 Operation logged to Diamond SAO Firestore`;
  };
  
  const generateUniversalResponse = async (input) => {
    // Universal AI responses for general queries
    if (input.toLowerCase().includes('help') || input.toLowerCase().includes('what can you do')) {
      return `💎 I'm your Diamond SAO AI assistant! Here's what I can help with:\n\n` +
             `🌐 **DNS Management:**\n` +
             `• "update mcp domain to point to integration gateway"\n` +
             `• "check mcp status"\n` +
             `• "create mcp domain for newclient"\n\n` +
             `⚡ **Cloudflare Workers:**\n` +
             `• "deploy integration gateway worker"\n` +
             `• "check worker status"\n` +
             `• "update worker configuration"\n\n` +
             `📦 **KV & Durable Objects:**\n` +
             `• "create kv namespace for production"\n` +
             `• "deploy durable object for sessions"\n\n` +
             `Just tell me what you need in natural language! 🚀`;
    }
    
    return `🤖 I understand you're asking about: "${input}"\n\n` +
           `This looks like it might be related to:\n` +
           `• Infrastructure management\n` +
           `• System operations\n` +
           `• Service configuration\n\n` +
           `Could you be more specific? For example:\n` +
           `• "deploy [service] worker to cloudflare"\n` +
           `• "update [domain] to point to [service]"\n` +
           `• "check status of [service]"\n\n` +
           `💎 I'm here to help with your Diamond SAO operations!`;
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (currentInput.trim() && !isProcessing) {
      processCommand(currentInput);
    }
  };
  
  const quickCommands = [
    {
      label: 'Check MCP Status',
      command: 'check mcp status',
      icon: '🌐'
    },
    {
      label: 'Deploy Integration Gateway',
      command: 'deploy integration gateway worker to cloudflare',
      icon: '⚡'
    },
    {
      label: 'Update MCP Domain',
      command: 'update mcp domain to point to integration gateway',
      icon: '🔄'
    },
    {
      label: 'Check Worker Status',
      command: 'check worker status',
      icon: '👷'
    }
  ];
  
  return (
    <div className="diamond-cli-interface">
      <style>{`
        .diamond-cli-interface {
          display: flex;
          flex-direction: column;
          height: 600px;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 12px;
          border: 2px solid #4c1d95;
          color: white;
          font-family: 'Monaco', 'Menlo', monospace;
          overflow: hidden;
        }
        
        .cli-header {
          background: linear-gradient(90deg, #4c1d95 0%, #7c3aed 100%);
          padding: 16px;
          border-bottom: 1px solid #4c1d95;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .cli-title {
          font-weight: 600;
          font-size: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .cli-mode {
          padding: 4px 12px;
          background: rgba(255,255,255,0.1);
          border-radius: 20px;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .message {
          padding: 12px 16px;
          border-radius: 8px;
          max-width: 80%;
          word-wrap: break-word;
          white-space: pre-wrap;
          font-size: 14px;
          line-height: 1.5;
        }
        
        .message.user {
          align-self: flex-end;
          background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
          color: white;
        }
        
        .message.assistant {
          align-self: flex-start;
          background: rgba(59, 130, 246, 0.1);
          border: 1px solid rgba(59, 130, 246, 0.3);
          color: #93c5fd;
        }
        
        .message.system {
          align-self: center;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.3);
          color: #6ee7b7;
          text-align: center;
        }
        
        .message.error {
          align-self: flex-start;
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          color: #f87171;
        }
        
        .quick-commands {
          padding: 12px 16px;
          border-top: 1px solid #4c1d95;
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .quick-command {
          padding: 6px 12px;
          background: rgba(124, 58, 237, 0.1);
          border: 1px solid rgba(124, 58, 237, 0.3);
          border-radius: 20px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .quick-command:hover {
          background: rgba(124, 58, 237, 0.2);
          border-color: rgba(124, 58, 237, 0.5);
        }
        
        .input-container {
          padding: 16px;
          border-top: 1px solid #4c1d95;
        }
        
        .input-form {
          display: flex;
          gap: 12px;
          align-items: center;
        }
        
        .cli-input {
          flex: 1;
          background: rgba(255,255,255,0.05);
          border: 1px solid #4c1d95;
          border-radius: 8px;
          padding: 12px 16px;
          color: white;
          font-family: inherit;
          font-size: 14px;
        }
        
        .cli-input:focus {
          outline: none;
          border-color: #7c3aed;
          box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.2);
        }
        
        .cli-submit {
          padding: 12px 20px;
          background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%);
          border: none;
          border-radius: 8px;
          color: white;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.2s;
        }
        
        .cli-submit:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .processing {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #fbbf24;
          font-size: 14px;
        }
        
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(251, 191, 36, 0.3);
          border-top: 2px solid #fbbf24;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .messages-container::-webkit-scrollbar {
          width: 6px;
        }
        
        .messages-container::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
        }
        
        .messages-container::-webkit-scrollbar-thumb {
          background: rgba(124, 58, 237, 0.3);
          border-radius: 3px;
        }
      `}</style>
      
      <div className="cli-header">
        <div className="cli-title">
          💎 Diamond SAO Command Center
        </div>
        <div className="cli-mode">{cliMode}</div>
      </div>
      
      <div className="messages-container">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            {message.content}
          </div>
        ))}
        
        {isProcessing && (
          <div className="processing">
            <div className="spinner"></div>
            Processing your Diamond SAO command...
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="quick-commands">
        {quickCommands.map((cmd, index) => (
          <div
            key={index}
            className="quick-command"
            onClick={() => !isProcessing && processCommand(cmd.command)}
          >
            {cmd.icon} {cmd.label}
          </div>
        ))}
      </div>
      
      <div className="input-container">
        <form className="input-form" onSubmit={handleSubmit}>
          <input
            type="text"
            className="cli-input"
            placeholder="Tell me what you need... (e.g., 'deploy integration gateway worker')"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            disabled={isProcessing}
          />
          <button
            type="submit"
            className="cli-submit"
            disabled={isProcessing || !currentInput.trim()}
          >
            {isProcessing ? '⏳' : '🚀'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OwnerCLIInterface;
