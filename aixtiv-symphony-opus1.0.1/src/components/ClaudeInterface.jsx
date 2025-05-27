import React, { useState, useEffect, useRef } from 'react';

/**
 * ClaudeInterface Component
 * 
 * Provides a conversational interface to the Dr. Claude orchestrator agent.
 * Features include:
 * - Real-time chat with Dr. Claude
 * - Message history tracking
 * - Agent status display
 * - Integration with S2DO workflow system
 */
const ClaudeInterface = () => {
  // State for chat functionality
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('ready'); // ready, processing, error
  const [agentData, setAgentData] = useState(null);
  const messagesEndRef = useRef(null);

  // Simulate loading agent data on component mount
  useEffect(() => {
    const fetchAgentData = async () => {
      try {
        // In a real implementation, this would fetch from Firestore or API
        // Example: await firebase.firestore().collection('agents').doc('dr-claude-01').get()
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setAgentData({
          name: 'Dr. Claude',
          instance: '0023',
          tier: '01',
          status: 'active',
          opus: 'Opus 1: Amplify',
          tasks_completed: 542,
          performance_rating: 4.9,
          lastActive: new Date().toISOString()
        });
      } catch (error) {
        console.error('Error fetching agent data:', error);
        setStatus('error');
      }
    };

    fetchAgentData();
    
    // Add welcome message
    setMessages([
      {
        id: 'welcome-msg',
        text: 'Welcome to the ASOOS Symphony Orchestrator Interface. How can I assist with your Symphony tasks today?',
        sender: 'assistant',
        timestamp: new Date()
      }
    ]);
  }, []);

  // Auto-scroll to bottom of messages when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Handle message submission
   */
  const handleSubmit = async () => {
    if (!input.trim() || status === 'processing') return;
    
    // Add user message to chat
    const userMessage = { 
      id: `user-${Date.now()}`,
      text: input, 
      sender: 'user', 
      timestamp: new Date() 
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setStatus('processing');
    
    try {
      // In a real implementation, this would call the S2DO API
      // Example: const response = await fetch('/api/s2do/claude', { 
      //   method: 'POST', 
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ prompt: input }) 
      // });
      // const data = await response.json();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate assistant response based on input
      const responseText = processQuery(input);
      
      // Add assistant message to chat
      const assistantMessage = { 
        id: `assistant-${Date.now()}`,
        text: responseText, 
        sender: 'assistant', 
        timestamp: new Date() 
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Add error message
      const errorMessage = { 
        id: `system-${Date.now()}`,
        text: 'Sorry, there was an error processing your request. Please try again.', 
        sender: 'system', 
        timestamp: new Date() 
      };
      
      setMessages(prev => [...prev, errorMessage]);
    }
    
    setStatus('ready');
  };

  /**
   * Process the user query and generate a response
   * In a real implementation, this would be handled by the backend API
   */
  const processQuery = (query) => {
    const lowerQuery = query.toLowerCase();
    
    // Check for agent status query
    if (lowerQuery.includes('agent') && lowerQuery.includes('status')) {
      return `There are currently 92 active agents across all tiers. Dr. Claude (instance ${agentData?.instance}) is currently active and processing S2DO workflows.`;
    }
    
    // Check for Dewey Card query
    if (lowerQuery.includes('dewey') || lowerQuery.includes('card')) {
      return 'The system has processed 1.4M Dewey Cards to date. Recent cards show a 94% success rate for completed tasks. Would you like me to display the most recent cards?';
    }
    
    // Check for S2DO query
    if (lowerQuery.includes('s2do') || lowerQuery.includes('workflow')) {
      return 'The S2DO Governance System is currently operational. There are 18 smart contracts in progress, with 7 awaiting approval. Would you like to initiate a new S2DO workflow?';
    }
    
    // Check for Symphony query
    if (lowerQuery.includes('symphony') || lowerQuery.includes('opus')) {
      return 'Symphony is currently running Opus 1: Amplify with all core systems operational. Wing orchestration is active across all three squadrons with 92 agents deployed. Would you like a detailed status report?';
    }
    
    // Check for help query
    if (lowerQuery.includes('help') || lowerQuery.includes('assist')) {
      return `I can help with several tasks:
1. Agent deployment and monitoring
2. S2DO workflow management
3. Dewey Card creation and tracking
4. Symphony system status updates
5. Task delegation and orchestration

What specific area would you like assistance with?`;
    }
    
    // Default response
    return 'I understand your request. How would you like me to proceed with this task? I can scan for relevant context, delegate to appropriate agents, or provide recommendations based on the Symphony intelligence framework.';
  };

  /**
   * Handle Enter key press in input field
   */
  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  /**
   * Format timestamp for display
   */
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="claude-interface">
      {/* Interface Header */}
      <div className="interface-header">
        <div className="agent-info">
          {agentData ? (
            <>
              <span className="agent-name">{agentData.name}</span>
              <span className="agent-instance">Instance {agentData.instance}</span>
              <span className={`agent-status status-${agentData.status}`}>
                {agentData.status}
              </span>
              <span className="flex-1"></span>
              <span className="text-sm text-gray-600">
                {agentData.performance_rating}/5.0
              </span>
            </>
          ) : (
            <span className="text-gray-600">Loading agent data...</span>
          )}
        </div>
      </div>
      
      {/* Messages Container */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <p>Welcome to the ASOOS Symphony Interface. Connecting to Dr. Claude...</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`message ${msg.sender}-message`}
            >
              <div className="message-content">{msg.text}</div>
              <div className="message-meta">
                <span className="message-time">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input Container */}
      <div className="input-container">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask Dr. Claude..."
          disabled={status === 'processing'}
          className="flex-1 p-3 border border-gray-300 rounded-md"
        />
        <button 
          onClick={handleSubmit}
          disabled={status === 'processing' || !input.trim()}
          className={`btn ${status === 'processing' ? 'bg-gray-400' : 'btn-primary'}`}
        >
          {status === 'processing' ? 'Processing...' : 'Send'}
        </button>
      </div>
    </div>
  );
};

export default ClaudeInterface;

