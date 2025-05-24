import React, { useState, useEffect } from 'react';
import axios from 'axios';

// API endpoint
const API_ENDPOINT = 'https://us-west1-aixtiv-symphony.cloudfunctions.net/dr-claude/projects/delegate';

// Styles
const styles = {
  container: {
    width: '100%',
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px'
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden'
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '20px',
    borderBottom: '1px solid #eaeaea'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: 0
  },
  badge: {
    padding: '6px 12px',
    borderRadius: '16px',
    fontSize: '14px',
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  badgeReady: {
    backgroundColor: '#e6f7ee',
    color: '#0a7d33'
  },
  badgeProcessing: {
    backgroundColor: '#fff8e6',
    color: '#b86e00'
  },
  badgeError: {
    backgroundColor: '#fee7e7',
    color: '#d42a2a'
  },
  messageArea: {
    backgroundColor: '#f9f9fb',
    padding: '20px',
    minHeight: '300px',
    maxHeight: '400px',
    overflowY: 'auto',
    margin: '0',
    borderRadius: '4px'
  },
  message: {
    marginBottom: '16px',
    padding: '12px',
    borderRadius: '8px',
    backgroundColor: 'white',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
  },
  userMessage: {
    backgroundColor: '#e7f2ff',
    alignSelf: 'flex-end',
  },
  inputArea: {
    display: 'flex',
    gap: '12px',
    padding: '20px'
  },
  input: {
    flex: 1,
    padding: '12px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '16px'
  },
  button: {
    padding: '10px 20px',
    backgroundColor: '#2c7be5',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  formArea: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  label: {
    fontWeight: 'bold',
    fontSize: '16px'
  },
  textarea: {
    padding: '12px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '16px',
    minHeight: '100px',
    fontFamily: 'inherit'
  },
  select: {
    padding: '12px',
    borderRadius: '4px',
    border: '1px solid #ddd',
    fontSize: '16px'
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center'
  },
  logoutButton: {
    padding: '8px 16px',
    backgroundColor: '#f1f1f1',
    color: '#333',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px'
  },
  errorMessage: {
    color: '#d42a2a',
    backgroundColor: '#fee7e7',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '16px'
  },
  successMessage: {
    color: '#0a7d33',
    backgroundColor: '#e6f7ee',
    padding: '12px',
    borderRadius: '4px',
    marginBottom: '16px'
  },
  tabs: {
    display: 'flex',
    borderBottom: '1px solid #eaeaea',
    padding: '0 20px'
  },
  tab: {
    padding: '16px 20px',
    cursor: 'pointer',
    fontWeight: 'bold',
    color: '#666'
  },
  activeTab: {
    borderBottom: '2px solid #2c7be5',
    color: '#2c7be5'
  }
};

const ClaudeInterface = () => {
  // State
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('ready');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const [projectData, setProjectData] = useState({
    name: '',
    description: '',
    priority: 'medium',
    deadline: '',
    tags: '',
    assignedTo: ''
  });

  // Check authentication on component mount
  useEffect(() => {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
      // You could validate the token here with an API call
    }
  }, []);

  // Handle chat message submission
  const handleSubmit = async () => {
    if (!input.trim()) return;
    
    setStatus('processing');
    setError('');
    
    // Add user message to chat
    const userMessage = { type: 'user', content: input };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInput('');
    
    try {
      // In a real implementation, you would send the message to an API
      // For now, we'll simulate a response
      setTimeout(() => {
        const responseMessage = { 
          type: 'claude', 
          content: `I've processed your request: "${input}". How else can I assist you?` 
        };
        setMessages(prevMessages => [...prevMessages, responseMessage]);
        setStatus('ready');
      }, 1500);
      
    } catch (err) {
      console.error('Error processing message:', err);
      setError('Failed to process your message. Please try again.');
      setStatus('error');
    }
  };

  // Handle project delegation to Dr. Claude
  const handleDelegateProject = async (e) => {
    e.preventDefault();
    setStatus('processing');
    setError('');
    setSuccess('');
    
    // Validate required fields
    if (!projectData.name.trim() || !projectData.description.trim()) {
      setError('Project name and description are required.');
      setStatus('error');
      return;
    }
    
    try {
      // Prepare the payload
      const payload = {
        name: projectData.name,
        description: projectData.description,
        priority: projectData.priority,
        deadline: projectData.deadline || null,
        tags: projectData.tags ? projectData.tags.split(',').map(t => t.trim()) : [],
        assigned_to: projectData.assignedTo || null,
        orchestrator: 'dr-claude'
      };
      
      // Make API call to delegate project
      const response = await axios.post(API_ENDPOINT, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || sessionStorage.getItem('authToken')}`,
          'x-agent-id': 'dr-claude-orchestrator'
        }
      });
      
      // Handle successful response
      setSuccess(`Project "${projectData.name}" successfully delegated to Dr. Claude. Project ID: ${response.data.project_id}`);
      
      // Reset form
      setProjectData({
        name: '',
        description: '',
        priority: 'medium',
        deadline: '',
        tags: '',
        assignedTo: ''
      });
      
      // Add a message to the chat
      setMessages(prevMessages => [
        ...prevMessages, 
        { 
          type: 'system', 
          content: `Project "${projectData.name}" has been delegated to Dr. Claude.` 
        }
      ]);
      
      setStatus('ready');
      
    } catch (err) {
      console.error('Error delegating project:', err);
      
      // Display appropriate error message
      if (err.response) {
        setError(`Failed to delegate project: ${err.response.data.error || 'Server error'}`);
      } else if (err.request) {
        setError('Unable to reach the server. Please check your connection and try again.');
      } else {
        setError(`Error preparing project delegation: ${err.message}`);
      }
      
      setStatus('error');
    }
  };

  // Handle input changes for project form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProjectData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    setIsAuthenticated(false);
    window.location.href = '/auth';
  };

  // Get status badge style
  const getStatusBadgeStyle = () => {
    switch (status) {
      case 'processing':
        return { ...styles.badge, ...styles.badgeProcessing };
      case 'error':
        return { ...styles.badge, ...styles.badgeError };
      default:
        return { ...styles.badge, ...styles.badgeReady };
    }
  };

  // If not authenticated, redirect to auth page
  if (!isAuthenticated) {
    return null; // The auth check in index.html will handle this
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h2 style={styles.title}>Super Claude Interface</h2>
          <div style={styles.headerActions}>
            <div style={getStatusBadgeStyle()}>{status}</div>
            <button style={styles.logoutButton} onClick={handleLogout}>Logout</button>
          </div>
        </div>
        
        <div style={styles.tabs}>
          <div 
            style={activeTab === 'chat' ? {...styles.tab, ...styles.activeTab} : styles.tab}
            onClick={() => setActiveTab('chat')}
          >
            Chat
          </div>
          <div 
            style={activeTab === 'delegate' ? {...styles.tab, ...styles.activeTab} : styles.tab}
            onClick={() => setActiveTab('delegate')}
          >
            Delegate Project
          </div>
        </div>

        {activeTab === 'chat' && (
          <>
            <div style={styles.messageArea}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>
                  Begin your conversation with Dr. Claude
                </div>
              )}
              
              {messages.map((msg, i) => (
                <div key={i} style={{
                  ...styles.message,
                  ...(msg.type === 'user' ? styles.userMessage : {})
                }}>
                  <p style={{ margin: 0 }}>{msg.content}</p>
                </div>
              ))}
            </div>

            <div style={styles.inputArea}>
              <input
                style={styles.input}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Dr. Claude..."
                disabled={status === 'processing'}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
              />
              <button 
                style={styles.button}
                onClick={handleSubmit}
                disabled={status === 'processing' || !input.trim()}
              >
                Send
              </button>
            </div>
          </>
        )}

        {activeTab === 'delegate' && (
          <form style={styles.formArea} onSubmit={handleDelegateProject}>
            {error && <div style={styles.errorMessage}>{error}</div>}
            {success && <div style={styles.successMessage}>{success}</div>}
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Project Name*</label>
              <input
                style={styles.input}
                type="text"
                name="name"
                value={projectData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Description*</label>
              <textarea
                style={styles.textarea}
                name="description"
                value={projectData.description}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Priority</label>
              <select
                style={styles.select}
                name="priority"
                value={projectData.priority}
                onChange={handleInputChange}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Deadline (optional)</label>
              <input
                style={styles.input}
                type="date"
                name="deadline"
                value={projectData.deadline}
                onChange={handleInputChange}
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Tags (comma separated)</label>
              <input
                style={styles.input}
                type="text"
                name="tags"
                value={projectData.tags}
                onChange={handleInputChange}
                placeholder="tag1, tag2, tag3"
              />
            </div>
            
            <div style={styles.formGroup}>
              <label style={styles.label}>Assign To (optional)</label>
              <input
                style={styles.input}
                type="text"
                name="assignedTo"
                value={projectData.assignedTo}
                onChange={handleInputChange}
                placeholder="Enter agent name or ID"
              />
            </div>
            
            <button
              style={styles.button}
              type="submit"
              disabled={status === 'processing'}
            >
              {status === 'processing' ? 'Delegating...' : 'Delegate to Dr. Claude'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default ClaudeInterface;
