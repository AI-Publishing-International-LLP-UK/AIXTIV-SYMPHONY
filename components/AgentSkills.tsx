/**
 * Agent Skills Component
 * Demonstrates how to use LangChain for agent capabilities
 */

import React, { useState, useCallback, useEffect } from 'react';
import useLangChain from '../services/hooks/useLangChain';
import { useMCP } from '../ap/hooks/useMCP';
import { useSallyPortAuth } from '../auth/hooks/useSallyPortAuth';
import speechService from '../services/speech-service';

interface AgentSkillsProps {
  /**
   * Agent ID to use
   */
  agentId: string;
  
  /**
   * User ID
   */
  userId: string;
  
  /**
   * Document index for knowledge retrieval
   */
  knowledgeIndex?: string;
  
  /**
   * Whether to use voice capabilities
   */
  useVoice?: boolean;
  
  /**
   * Language code to use
   */
  languageCode?: string;
  
  /**
   * Voice name to use
   */
  voiceName?: string;
  
  /**
   * Initial question or instruction
   */
  initialMessage?: string;
}

/**
 * Agent Skills Component
 * Demonstrates AI agent with LangChain and MCP
 */
const AgentSkills: React.FC<AgentSkillsProps> = ({
  agentId,
  userId,
  knowledgeIndex = 'aixtiv-docs',
  useVoice = false,
  languageCode = 'en-US',
  voiceName = 'en-US-Wavenet-F',
  initialMessage = '',
}) => {
  // LangChain hook
  const {
    runPrompt,
    runConversation,
    answerWithContext,
    generateSessionId,
    loading: langchainLoading,
  } = useLangChain();
  
  // MCP hook for agent communication
  const { 
    sendMessage, 
    getMessageHistory, 
    coherenceLevel,
    updateStateMatrix,
  } = useMCP();
  
  // Auth hook
  const { user } = useSallyPortAuth();
  
  // Local state
  const [sessionId] = useState<string>(() => generateSessionId());
  const [messages, setMessages] = useState<
    { role: string; content: string; timestamp: Date }[]
  >([]);
  const [input, setInput] = useState<string>(initialMessage);
  const [processing, setProcessing] = useState<boolean>(false);
  const [agentReady, setAgentReady] = useState<boolean>(false);
  
  // Initialize agent
  useEffect(() => {
    const setupAgent = async () => {
      try {
        // Prepare agent with LangChain prompt
        const agentPrompt = `
          You are an Aixtiv Symphony AI assistant named {agentName}.
          Your role is to provide helpful, accurate, and friendly responses.
          Your coherence level is currently {coherenceLevel}.
          
          Respond to the user in a way that demonstrates your capabilities.
        `;
        
        const agentConfig = await runPrompt({
          prompt: agentPrompt,
          input: {
            agentName: agentId,
            coherenceLevel: coherenceLevel.toFixed(2),
          },
        });
        
        // Register agent response in MCP
        await sendMessage(
          agentId,
          userId,
          agentConfig,
          'response',
          { initialized: true, sessionId }
        );
        
        setAgentReady(true);
        
        // Add initial message if provided
        if (initialMessage) {
          handleSendMessage(initialMessage);
        }
      } catch (error) {
        console.error('Failed to initialize agent:', error);
      }
    };
    
    setupAgent();
  }, [agentId, userId, coherenceLevel, sessionId, sendMessage, runPrompt, initialMessage]);
  
  // Send message to agent
  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || processing || !agentReady) {
        return;
      }
      
      setProcessing(true);
      
      try {
        // Add user message to messages
        const userMessage = {
          role: 'user',
          content: message,
          timestamp: new Date(),
        };
        
        setMessages((prevMessages) => [...prevMessages, userMessage]);
        
        // Reset input
        setInput('');
        
        // Send message to MCP
        await sendMessage(
          userId,
          agentId,
          message,
          'instruction',
          { sessionId }
        );
        
        // Update state matrix
        await updateStateMatrix({
          type: 'user_message',
          message,
          timestamp: Date.now(),
        });
        
        // Process with LangChain
        let response: string;
        
        if (knowledgeIndex) {
          // Use knowledge retrieval if index is provided
          response = await answerWithContext(message, knowledgeIndex);
        } else {
          // Use conversation memory
          const conversationResult = await runConversation({
            prompt: `
              You are an AI assistant named ${agentId}. 
              Your coherence level is ${coherenceLevel.toFixed(2)}.
              
              Current conversation:
              {chat_history}
              
              Human: {input}
              AI:
            `,
            input: { input: message },
            sessionId,
          });
          
          response = conversationResult.response;
        }
        
        // Add agent response to messages
        const agentMessage = {
          role: 'agent',
          content: response,
          timestamp: new Date(),
        };
        
        setMessages((prevMessages) => [...prevMessages, agentMessage]);
        
        // Send agent response to MCP
        await sendMessage(
          agentId,
          userId,
          response,
          'response',
          { sessionId }
        );
        
        // Speak response if voice is enabled
        if (useVoice) {
          const audioContent = await speechService.textToSpeech(
            response,
            { languageCode, voice: voiceName }
          );
          
          await speechService.playAudio(audioContent);
        }
      } catch (error) {
        console.error('Error processing message:', error);
      } finally {
        setProcessing(false);
      }
    },
    [
      processing,
      agentReady,
      userId,
      agentId,
      sessionId,
      knowledgeIndex,
      coherenceLevel,
      answerWithContext,
      runConversation,
      sendMessage,
      updateStateMatrix,
      useVoice,
      languageCode,
      voiceName,
    ]
  );
  
  // Handle voice input
  const handleVoiceInput = useCallback(async () => {
    if (processing || !useVoice) {
      return;
    }
    
    try {
      setProcessing(true);
      
      // Capture speech and convert to text
      const transcript = await speechService.captureAndTranscribe({
        languageCode,
      });
      
      // Set as input
      setInput(transcript);
      
      // Send message
      await handleSendMessage(transcript);
    } catch (error) {
      console.error('Error with voice input:', error);
    } finally {
      setProcessing(false);
    }
  }, [processing, useVoice, languageCode, handleSendMessage]);
  
  return (
    <div className="agent-skills">
      <div className="agent-skills__header">
        <h2>{agentId}</h2>
        <div className="agent-skills__status">
          <span>Coherence: {coherenceLevel.toFixed(2)}</span>
          <span className={`agent-skills__indicator ${agentReady ? 'ready' : 'initializing'}`}>
            {agentReady ? 'Ready' : 'Initializing...'}
          </span>
        </div>
      </div>
      
      <div className="agent-skills__messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`agent-skills__message ${
              message.role === 'user' ? 'user' : 'agent'
            }`}
          >
            <div className="agent-skills__message-content">
              {message.content}
            </div>
            <div className="agent-skills__message-timestamp">
              {message.timestamp.toLocaleTimeString()}
            </div>
          </div>
        ))}
        
        {(processing || langchainLoading) && (
          <div className="agent-skills__loading">Processing...</div>
        )}
      </div>
      
      <div className="agent-skills__input">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={processing || !agentReady}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSendMessage(input);
            }
          }}
        />
        
        <button
          onClick={() => handleSendMessage(input)}
          disabled={!input.trim() || processing || !agentReady}
        >
          Send
        </button>
        
        {useVoice && (
          <button
            onClick={handleVoiceInput}
            disabled={processing || !agentReady}
            className="agent-skills__voice-button"
          >
            🎤
          </button>
        )}
      </div>
    </div>
  );
};

export default AgentSkills;