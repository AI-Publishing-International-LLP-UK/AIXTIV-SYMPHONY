/**
 * AIXTIV SYMPHONY™ Frontend Components
 * © 2025 AI Publishing International LLP
 * 
 * PROPRIETARY AND CONFIDENTIAL
 * This is proprietary software of AI Publishing International LLP.
 * All rights reserved. No part of this software may be reproduced,
 * modified, or distributed without prior written permission.
 */

import React, { useState, useEffect, useContext, createContext } from 'react';
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { AIXTIVUser, UserType, CoreSolution, PilotType } from '../core/types';
import { UserService, AgentService, ConversationService } from '../core';

// Initialize Firebase Auth
const auth = getAuth();
const db = getFirestore();

// Authentication Context
interface AuthContextType {
  user: AIXTIVUser | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, userData: Partial<AIXTIVUser>) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {}
});

// Auth Provider Component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AIXTIVUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      
      if (firebaseUser) {
        try {
          // Get the user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            setUser(userDoc.data() as AIXTIVUser);
          } else {
            setUser(null);
            setError('User profile not found');
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setError('Error fetching user data');
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Fetch user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', result.user.uid));
      
      if (userDoc.exists()) {
        setUser(userDoc.data() as AIXTIVUser);
      } else {
        throw new Error('User profile not found');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      setError(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, userData: Partial<AIXTIVUser>) => {
    try {
      setLoading(true);
      setError(null);
      
      // Create user with Firebase Auth
      const result = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create user profile in Firestore using UserService
      const newUser = await UserService.createUser(email, password, userData);
      setUser(newUser);
    } catch (error: any) {
      console.error('Registration error:', error);
      setError(error.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (error: any) {
      console.error('Logout error:', error);
      setError(error.message || 'Logout failed');
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use authentication
export const useAuth = () => useContext(AuthContext);

// Agent Context
interface AgentContextType {
  agents: any[];
  currentAgent: any | null;
  loading: boolean;
  error: string | null;
  setCurrentAgent: (agent: any) => void;
  createAgent: (agentData: any) => Promise<any>;
  updateAgent: (agentId: string, data: any) => Promise<any>;
}

const AgentContext = createContext<AgentContextType>({
  agents: [],
  currentAgent: null,
  loading: true,
  error: null,
  setCurrentAgent: () => {},
  createAgent: async () => ({}),
  updateAgent: async () => ({})
});

// Agent Provider Component
export const AgentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [agents, setAgents] = useState<any[]>([]);
  const [currentAgent, setCurrentAgent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user's agents when user changes
  useEffect(() => {
    if (user) {
      loadAgents();
    } else {
      setAgents([]);
      setCurrentAgent(null);
      setLoading(false);
    }
  }, [user]);

  const loadAgents = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Get user's agents
      const userAgents = await AgentService.getAgentsByOwner('user', user.id);
      setAgents(userAgents);
      
      // Set default current agent if not already set
      if (userAgents.length > 0 && !currentAgent) {
        setCurrentAgent(userAgents[0]);
      }
    } catch (error: any) {
      console.error('Error loading agents:', error);
      setError('Failed to load agents');
    } finally {
      setLoading(false);
    }
  };

  const createAgent = async (agentData: any) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setLoading(true);
      setError(null);
      
      // Create agent with AgentService
      const newAgent = await AgentService.createAgentInstance({
        ...agentData,
        ownerType: 'user',
        ownerId: user.id
      });
      
      // Update agents list
      setAgents(prevAgents => [...prevAgents, newAgent]);
      
      return newAgent;
    } catch (error: any) {
      console.error('Error creating agent:', error);
      setError('Failed to create agent');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const updateAgent = async (agentId: string, data: any) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setLoading(true);
      setError(null);
      
      // Update agent with AgentService
      const updatedAgent = await AgentService.updateAgentInstance(agentId, data);
      
      if (!updatedAgent) {
        throw new Error('Agent not found');
      }
      
      // Update agents list
      setAgents(prevAgents => 
        prevAgents.map(agent => agent.id === agentId ? updatedAgent : agent)
      );
      
      // Update current agent if it's the one being updated
      if (currentAgent && currentAgent.id === agentId) {
        setCurrentAgent(updatedAgent);
      }
      
      return updatedAgent;
    } catch (error: any) {
      console.error('Error updating agent:', error);
      setError('Failed to update agent');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AgentContext.Provider 
      value={{ 
        agents, 
        currentAgent, 
        loading, 
        error, 
        setCurrentAgent, 
        createAgent, 
        updateAgent 
      }}
    >
      {children}
    </AgentContext.Provider>
  );
};

// Custom hook to use agent context
export const useAgents = () => useContext(AgentContext);

// Chat/Conversation Context
interface ConversationContextType {
  conversations: any[];
  currentConversation: any | null;
  messages: any[];
  loading: boolean;
  error: string | null;
  setCurrentConversation: (conversation: any) => void;
  createConversation: (title: string, participants: any[]) => Promise<any>;
  sendMessage: (content: string) => Promise<any>;
}

const ConversationContext = createContext<ConversationContextType>({
  conversations: [],
  currentConversation: null,
  messages: [],
  loading: true,
  error: null,
  setCurrentConversation: () => {},
  createConversation: async () => ({}),
  sendMessage: async () => ({})
});

// Conversation Provider Component
export const ConversationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { currentAgent } = useAgents();
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentConversation, setCurrentConversation] = useState<any | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load user's conversations when user changes
  useEffect(() => {
    if (user) {
      loadConversations();
    } else {
      setConversations([]);
      setCurrentConversation(null);
      setMessages([]);
      setLoading(false);
    }
  }, [user]);

  // Load messages when current conversation changes
  useEffect(() => {
    if (currentConversation) {
      loadMessages(currentConversation.id);
    } else {
      setMessages([]);
    }
  }, [currentConversation]);

  const loadConversations = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Query Firestore for conversations where user is a participant
      const db = getFirestore();
      const conversationsRef = db.collection('conversations');
      const querySnapshot = await conversationsRef
        .where('participants', 'array-contains', { type: 'user', id: user.id })
        .get();
      
      const userConversations = querySnapshot.docs.map(doc => doc.data());
      setConversations(userConversations);
      
      // Set default current conversation if not already set
      if (userConversations.length > 0 && !currentConversation) {
        setCurrentConversation(userConversations[0]);
      }
    } catch (error: any) {
      console.error('Error loading conversations:', error);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Get conversation messages with ConversationService
      const conversationMessages = await ConversationService.getConversationMessages(conversationId);
      setMessages(conversationMessages);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const createConversation = async (title: string, participants: any[]) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setLoading(true);
      setError(null);
      
      // Include the current user in participants if not already included
      const userParticipant = { type: 'user', id: user.id };
      const hasUser = participants.some(p => p.type === 'user' && p.id === user.id);
      
      if (!hasUser) {
        participants.push(userParticipant);
      }
      
      // Create conversation with ConversationService
      const newConversation = await ConversationService.createConversation(
        title,
        'user',
        user.id,
        participants
      );
      
      // Update conversations list
      setConversations(prevConversations => [...prevConversations, newConversation]);
      
      // Set as current conversation
      setCurrentConversation(newConversation);
      
      return newConversation;
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      setError('Failed to create conversation');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (content: string) => {
    if (!user) throw new Error('User not authenticated');
    if (!currentConversation) throw new Error('No active conversation');
    
    try {
      setLoading(true);
      setError(null);
      
      // Send message with ConversationService
      const message = await ConversationService.addMessage(
        currentConversation.id,
        'user',
        user.id,
        content
      );
      
      // Update messages list
      setMessages(prevMessages => [...prevMessages, message]);
      
      // If conversation has an agent participant, get agent response
      const agentParticipant = currentConversation.participants.find((p: any) => p.type === 'agent');
      
      if (agentParticipant && currentAgent) {
        // In a real implementation, this would trigger the agent to respond
        // For now, we'll create a simple automated response
        setTimeout(async () => {
          try {
            const agentResponse = await ConversationService.addMessage(
              currentConversation.id,
              'agent',
              agentParticipant.id,
              `This is an automated response from ${currentAgent.name}`
            );
            
            setMessages(prevMessages => [...prevMessages, agentResponse]);
          } catch (error) {
            console.error('Error getting agent response:', error);
          }
        }, 1000);
      }
      
      return message;
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <ConversationContext.Provider 
      value={{ 
        conversations, 
        currentConversation, 
        messages, 
        loading, 
        error, 
        setCurrentConversation, 
        createConversation, 
        sendMessage 
      }}
    >
      {children}
    </ConversationContext.Provider>
  );
};

// Custom hook to use conversation context
export const useConversations = () => useContext(ConversationContext);

// Solution/Feature Context
interface SolutionContextType {
  availableSolutions: any[];
  userSolutions: any[];
  loading: boolean;
  error: string | null;
  activateSolution: (solutionId: string) => Promise<void>;
}

const SolutionContext = createContext<SolutionContextType>({
  availableSolutions: [],
  userSolutions: [],
  loading: true,
  error: null,
  activateSolution: async () => {}
});

// Solution Provider Component
export const SolutionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [availableSolutions, setAvailableSolutions] = useState<any[]>([]);
  const [userSolutions, setUserSolutions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load solutions when user changes
  useEffect(() => {
    if (user) {
      loadSolutions();
    } else {
      setUserSolutions([]);
      setLoading(false);
    }
  }, [user]);

  // Load available solutions on mount
  useEffect(() => {
    loadAvailableSolutions();
  }, []);

  const loadAvailableSolutions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Query Firestore for all available solutions
      const db = getFirestore();
      const solutionsRef = db.collection('solutions');
      const querySnapshot = await solutionsRef.where('status', '==', 'active').get();
      
      const solutions = querySnapshot.docs.map(doc => doc.data());
      setAvailableSolutions(solutions);
    } catch (error: any) {
      console.error('Error loading available solutions:', error);
      setError('Failed to load available solutions');
    } finally {
      setLoading(false);
    }
  };

  const loadSolutions = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Query Firestore for user's subscribed solutions
      const db = getFirestore();
      const subscriptionsRef = db.collection('subscriptions');
      const querySnapshot = await subscriptionsRef
        .where('subscriberType', '==', 'user')
        .where('subscriberId', '==', user.id)
        .where('status', '==', 'active')
        .get();
      
      // Get the solution details for each subscription
      const userSolutionsPromises = querySnapshot.docs.map(async doc => {
        const subscription = doc.data();
        const solutionDoc = await db.collection('solutions').doc(subscription.solutionId).get();
        
        if (solutionDoc.exists) {
          return {
            ...solutionDoc.data(),
            subscription: {
              id: doc.id,
              tier: subscription.subscriptionTier,
              startDate: subscription.startDate,
              endDate: subscription.endDate
            }
          };
        }
        
        return null;
      });
      
      const solutions = (await Promise.all(userSolutionsPromises)).filter(Boolean);
      setUserSolutions(solutions);
    } catch (error: any) {
      console.error('Error loading user solutions:', error);
      setError('Failed to load user solutions');
    } finally {
      setLoading(false);
    }
  };

  const activateSolution = async (solutionId: string) => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      setLoading(true);
      setError(null);
      
      // In a real implementation, this would create a subscription
      // or activate a trial for the solution
      const db = getFirestore();
      const solutionDoc = await db.collection('solutions').doc(solutionId).get();
      
      if (!solutionDoc.exists) {
        throw new Error('Solution not found');
      }
      
      const solution = solutionDoc.data();
      
      // Create subscription document
      const subscription = {
        id: `sub_${Date.now()}`,
        solutionId,
        subscriberType: 'user',
        subscriberId: user.id,
        subscriptionTier: 'standard',  // Default tier
        status: 'active',
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),  // 30 days trial
        billingCycle: 'monthly',
        paymentStatus: 'trial',
        settings: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      await db.collection('subscriptions').doc(subscription.id).set(subscription);
      
      // Add solution to user's solutions
      setUserSolutions(prevSolutions => [
        ...prevSolutions,
        {
          ...solution,
          subscription: {
            id: subscription.id,
            tier: subscription.subscriptionTier,
            startDate: subscription.startDate,
            endDate: subscription.endDate
          }
        }
      ]);
      
      // Update user's solution array in Firestore
      if (!user.solutions.includes(solution.solutionCode)) {
        await db.collection('users').doc(user.id).update({
          solutions: [...user.solutions, solution.solutionCode],
          updatedAt: new Date()
        });
      }
    } catch (error: any) {
      console.error('Error activating solution:', error);
      setError('Failed to activate solution');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return (
    <SolutionContext.Provider 
      value={{ 
        availableSolutions, 
        userSolutions, 
        loading, 
        error, 
        activateSolution 
      }}
    >
      {children}
    </SolutionContext.Provider>
  );
};

// Custom hook to use solution context
export const useSolutions = () => useContext(SolutionContext);

// UI Components

// User Profile Component
export const UserProfile: React.FC = () => {
  const { user, logout, error } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    displayName: '',
    photoURL: '',
    bio: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        bio: user.userMetadata.bio || ''
      });
    }
  }, [user]);

  if (!user) {
    return <div>Please log in to view your profile.</div>;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await UserService.updateUser(user.id, {
        displayName: formData.displayName,
        photoURL: formData.photoURL,
        userMetadata: {
          ...user.userMetadata,
          bio: formData.bio
        }
      });
      
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
    }
  };

  return (
    <div className="user-profile">
      <h1>User Profile</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      {isEditing ? (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="displayName">Display Name</label>
            <input
              type="text"
              id="displayName"
              name="displayName"
              value={formData.displayName}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="photoURL">Profile Image URL</label>
            <input
              type="text"
              id="photoURL"
              name="photoURL"
              value={formData.photoURL}
              onChange={handleInputChange}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
            />
          </div>
          
          <button type="submit">Save</button>
          <button type="button" onClick={() => setIsEditing(false)}>Cancel</button>
        </form>
      ) : (
        <div className="profile-details">
          <div className="profile-header">
            {user.photoURL && (
              <img src={user.photoURL} alt={user.displayName} className="profile-image" />
            )}
            <div className="profile-info">
              <h2>{user.displayName}</h2>
              <p>{user.email}</p>
              <p><strong>User Type:</strong> {`${user.track}-${user.position}-${user.level}`}</p>
              {user.specializedRoles.length > 0 && (
                <p><strong>Roles:</strong> {user.specializedRoles.join(', ')}</p>
              )}
            </div>
          </div>
          
          {formData.bio && (
            <div className="profile-bio">
              <h3>Bio</h3>
              <p>{formData.bio}</p>
            </div>
          )}
          
          <div className="profile-actions">
            <button onClick={() => setIsEditing(true)}>Edit Profile</button>
            <button onClick={logout}>Logout</button>
          </div>
        </div>
      )}
    </div>
  );
};

// Agent Card Component
export const AgentCard: React.FC<{ agent: any; onSelect: (agent: any) => void; isSelected: boolean }> = ({ 
  agent, 
  onSelect, 
  isSelected 
}) => {
  return (
    <div className={`agent-card ${isSelected ? 'selected' : ''}`} onClick={() => onSelect(agent)}>
      <div className="agent-avatar" style={{ backgroundColor: agent.appearanceSettings.color || '#3498db' }}>
        {agent.nickname ? agent.nickname.charAt(0) : agent.name.charAt(0)}
      </div>
      <div className="agent-info">
        <h3>{agent.name}</h3>
        {agent.nickname && <p className="agent-nickname">{agent.nickname}</p>}
        <p className="agent-type">{agent.agentTypeId}</p>
      </div>
      {isSelected && <div className="selected-indicator">✓</div>}
    </div>
  );
};

// Agent Selection Component
export const AgentSelection: React.FC = () => {
  const { agents, currentAgent, loading, error, setCurrentAgent } = useAgents();

  if (loading) {
    return <div>Loading agents...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  if (agents.length === 0) {
    return <div>No agents available. Create your first agent to get started.</div>;
  }

  return (
    <div className="agent-selection">
      <h2>Select an Agent</h2>
      <div className="agent-list">
        {agents.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            onSelect={setCurrentAgent}
            isSelected={currentAgent?.id === agent.id}
          />
        ))}
      </div>
    </div>
  );
};

// Chat Interface Component
export const ChatInterface: React.FC = () => {
  const { user } = useAuth();
  const { currentAgent } = useAgents();
  const { 
    currentConversation, 
    messages, 
    loading, 
    error,
    sendMessage 
  } = useConversations();
  const [messageInput, setMessageInput] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageInput.trim()) return;
    
    try {
      await sendMessage(messageInput);
      setMessageInput('');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  if (!user) {
    return <div>Please log in to use the chat.</div>;
  }

  if (!currentAgent) {
    return <div>Please select an agent to chat with.</div>;
  }

  if (!currentConversation) {
    return <div>No active conversation. Start a new conversation to begin chatting.</div>;
  }

  if (loading && messages.length === 0) {
    return <div>Loading conversation...</div>;
  }

  return (
    <div className="chat-interface">
      <div className="chat-header">
        <h2>{currentConversation.title || 'Chat with ' + currentAgent.name}</h2>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <div className="message-list">
            {messages.map(message => (
              <div 
                key={message.id} 
                className={`message ${message.senderType === 'user' ? 'user-message' : 'agent-message'}`}
              >
                <div className="message-content">{message.content}</div>
                <div className="message-time">
                  {message.sentAt.toDate().toLocaleTimeString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <form className="message-input-form" onSubmit={handleSubmit}>
        <input
          type="text"
          value={messageInput}
          onChange={(e) => setMessageInput(e.target.value)}
          placeholder="Type your message..."
          disabled={loading}
        />
        <button type="submit" disabled={loading || !messageInput.trim()}>
          Send
        </button>
      </form>
    </div>
  );
};

// Solution Card Component
export const SolutionCard: React.FC<{ 
  solution: any; 
  isSubscribed: boolean;
  onActivate: () => void;
}> = ({ solution, isSubscribed, onActivate }) => {
  return (
    <div className="solution-card">
      <div className="solution-header">
        <h3>{solution.name}</h3>
        <span className="solution-code">{solution.solutionCode}</span>
      </div>
      
      <p className="solution-description">{solution.description}</p>
      
      <div className="solution-features">
        <h4>Features</h4>
        <ul>
          {solution.features.map((feature: string, index: number) => (
            <li key={index}>{feature}</li>
          ))}
        </ul>
      </div>
      
      <div className="solution-actions">
        {isSubscribed ? (
          <button disabled>Activated</button>
        ) : (
          <button onClick={onActivate}>Activate</button>
        )}
      </div>
    </div>
  );
};

// Solutions Gallery Component
export const SolutionsGallery: React.FC = () => {
  const { availableSolutions, userSolutions, loading, error, activateSolution } = useSolutions();

  if (loading) {
    return <div>Loading solutions...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  // Check if a solution is subscribed
  const isSubscribed = (solutionId: string) => {
    return userSolutions.some(solution => solution.id === solutionId);
  };

  return (
    <div className="solutions-gallery">
      <h2>Available Solutions</h2>
      
      <div className="solutions-grid">
        {availableSolutions.map(solution => (
          <SolutionCard
            key={solution.id}
            solution={solution}
            isSubscribed={isSubscribed(solution.id)}
            onActivate={() => activateSolution(solution.id)}
          />
        ))}
      </div>
    </div>
  );
};

// Create Agent Form Component
export const CreateAgentForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const { createAgent, error } = useAgents();
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    agentTypeId: PilotType.DR_LUCY_R1_CORE_01,
    performanceProfile: 'standard',
    color: '#3498db'
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createAgent({
        name: formData.name,
        nickname: formData.nickname || undefined,
        agentTypeId: formData.agentTypeId,
        performanceProfile: formData.performanceProfile,
        appearanceSettings: {
          color: formData.color
        },
        communicationSettings: {},
        culturalAdaptationSettings: {}
      });
      
      onSuccess();
    } catch (err) {
      console.error('Error creating agent:', err);
    }
  };

  return (
    <div className="create-agent-form">
      <h2>Create New Agent</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Agent Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="nickname">Nickname (Optional)</label>
          <input
            type="text"
            id="nickname"
            name="nickname"
            value={formData.nickname}
            onChange={handleInputChange}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="agentTypeId">Agent Type</label>
          <select
            id="agentTypeId"
            name="agentTypeId"
            value={formData.agentTypeId}
            onChange={handleInputChange}
            required
          >
            <option value={PilotType.DR_LUCY_R1_CORE_01}>Dr. Lucy Core 01</option>
            <option value={PilotType.DR_LUCY_R1_CORE_02}>Dr. Lucy Core 02</option>
            <option value={PilotType.DR_MATCH_PILOT}>Dr. Match</option>
            <option value={PilotType.DR_MEMORIA_PILOT}>Dr. Memoria</option>
            <option value={PilotType.PROFESSOR_LEE_PILOT}>Professor Lee</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="performanceProfile">Performance Profile</label>
          <select
            id="performanceProfile"
            name="performanceProfile"
            value={formData.performanceProfile}
            onChange={handleInputChange}
            required
          >
            <option value="standard">Standard</option>
            <option value="high-performance">High Performance</option>
            <option value="ultra-performance">Ultra Performance</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="color">Avatar Color</label>
          <input
            type="color"
            id="color"
            name="color"
            value={formData.color}
            onChange={handleInputChange}
          />
        </div>
        
        <button type="submit">Create Agent</button>
      </form>
    </div>
  );
};

// Main App Component that uses all contexts
export const AIXTIVApp: React.FC = () => {
  return (
    <AuthProvider>
      <AgentProvider>
        <ConversationProvider>
          <SolutionProvider>
            <div className="aixtiv-app">
              <header className="app-header">
                <h1>AIXTIV SYMPHONY</h1>
                {/* Navigation would go here */}
              </header>
              
              <main className="app-content">
                {/* Main content components would go here */}
              </main>
            </div>
          </SolutionProvider>
        </ConversationProvider>
      </AgentProvider>
    </AuthProvider>
  );
};

export default {
  AuthProvider,
  AgentProvider,
  ConversationProvider,
  SolutionProvider,
  useAuth,
  useAgents,
  useConversations,
  useSolutions,
  UserProfile,
  AgentSelection,
  ChatInterface,
  SolutionsGallery,
  CreateAgentForm,
  AIXTIVApp
};
