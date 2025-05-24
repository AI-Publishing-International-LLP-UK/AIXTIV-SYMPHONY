// Constants
const API_URL = 'http://localhost:3030/api';
const PRIMARY_COLOR = '#0bb1bb';

// Authentication context
const AuthContext = React.createContext({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  login: () => {},
  logout: () => {}
});

// Authentication provider component
const AuthProvider = ({ children }) => {
  const [state, setState] = React.useState({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null
  });
  
  // Check for existing session on load
  React.useEffect(() => {
    const sessionId = localStorage.getItem('symphonySessionId');
    
    if (sessionId) {
      validateSession(sessionId);
    } else {
      setState({ ...state, isLoading: false });
    }
  }, []);
  
  // Validate existing session
  const validateSession = async (sessionId) => {
    try {
      const response = await fetch(`${API_URL}/auth/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sessionId })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setState({
          isAuthenticated: true,
          isLoading: false,
          user: data.user,
          error: null
        });
      } else {
        localStorage.removeItem('symphonySessionId');
        setState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: 'Session expired. Please log in again.'
        });
      }
    } catch (error) {
      console.error('Session validation error:', error);
      localStorage.removeItem('symphonySessionId');
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: 'Error validating session: ' + error.message
      });
    }
  };
  
  // Log in
  const login = async (username, password) => {
    setState({ ...state, isLoading: true, error: null });
    
    try {
      const response = await fetch(`${API_URL}/auth/authenticate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (data.success) {
        localStorage.setItem('symphonySessionId', data.sessionId);
        
        setState({
          isAuthenticated: true,
          isLoading: false,
          user: data.user,
          error: null
        });
        
        // Play login sound
        if (window.SymphonyAudio) {
          window.SymphonyAudio.play('login');
        }
        
        return { success: true };
      } else {
        setState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: data.message || 'Login failed'
        });
        
        // Play error sound
        if (window.SymphonyAudio) {
          window.SymphonyAudio.play('error');
        }
        
        return { success: false, message: data.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: 'Error logging in: ' + error.message
      });
      
      // Play error sound
      if (window.SymphonyAudio) {
        window.SymphonyAudio.play('error');
      }
      
      return { success: false, message: error.message };
    }
  };
  
  // Log out
  const logout = async () => {
    setState({ ...state, isLoading: true });
    
    const sessionId = localStorage.getItem('symphonySessionId');
    
    if (sessionId) {
      try {
        await fetch(`${API_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ sessionId })
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    
    localStorage.removeItem('symphonySessionId');
    
    setState({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      error: null
    });
  };
  
  const contextValue = {
    ...state,
    login,
    logout
  };
  
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Login component
const Login = () => {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  
  const { login } = React.useContext(AuthContext);
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    const { success, message } = await login(username, password);
    
    if (!success) {
      setError(message || 'Login failed');
      setIsLoading(false);
    }
  };
  
  return (
    <div className="flex items-center justify-center min-h-screen p-4" style={{ background: '#121212' }}>
      <div className="p-8 bg-white rounded-lg shadow-md max-w-md w-full security-glow slide-up" style={{ color: '#333' }}>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-1" style={{ color: PRIMARY_COLOR }}>
            SallyPort Authentication
          </h2>
          <p className="text-gray-600">
            Secure access to ASOOS Symphony Environment
          </p>
        </div>
        
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-md mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
              Username
            </label>
            <input
              id="username"
              type="text"
              className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
          
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 mt-1">For demo, any username will work. Try "roark" for full name.</p>
          </div>
          
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              style={{ backgroundColor: PRIMARY_COLOR }}
              disabled={isLoading}
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </button>
            <a
              className="inline-block align-baseline font-bold text-sm"
              style={{ color: PRIMARY_COLOR }}
              href="#"
            >
              Need Help?
            </a>
          </div>
        </form>
        
        <div className="text-center mt-8 text-gray-600 text-xs">
          Protected by Dr. Grant's Security Framework
        </div>
      </div>
    </div>
  );
};

// Header component
const Header = () => {
  const { user, logout } = React.useContext(AuthContext);
  
  return (
    <header className="h-16 flex items-center justify-between px-6" style={{ backgroundColor: '#000000' }}>
      <div className="font-bold text-2xl tracking-wide" style={{ color: PRIMARY_COLOR }}>
        ASOOS Symphony
      </div>
      
      <div className="flex items-center">
        <div className="text-right mr-4">
          <div className="font-bold text-lg">{user?.name || user?.username}</div>
          <div className="text-sm" style={{ color: PRIMARY_COLOR }}>{user?.role === 'admin' ? 'Administrator' : 'CEO / Principal'}</div>
        </div>
        
        <button
          onClick={logout}
          className="px-3 py-1 rounded-md text-sm"
          style={{ backgroundColor: 'rgba(11, 177, 187, 0.2)' }}
        >
          Logout
        </button>
      </div>
    </header>
  );
};

// Developer Panel component
const DeveloperPanel = ({ onLaunch }) => {
  const [visible, setVisible] = React.useState(false);
  
  React.useEffect(() => {
    const handleKeyPress = (e) => {
      if (e.shiftKey && e.ctrlKey && e.key === '9') {
        setVisible(!visible);
      }
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [visible]);
  
  if (!visible) return null;
  
  return (
    <div className="fixed bottom-6 right-6 bg-white shadow-lg border border-gray-300 rounded-lg p-4 z-50 w-80 text-gray-800">
      <h3 className="font-bold text-lg mb-2">Symphony Developer Panel</h3>
      <div className="text-xs text-gray-500 mb-3">Press Shift+Ctrl+9 to toggle</div>
      
      <ul className="space-y-2 text-sm">
        <li>
          <button
            className="w-full text-left hover:text-cyan-600 transition-colors py-1"
            onClick={() => onLaunch('symphony')}
          >
            🔁 Launch Full Symphony View
          </button>
        </li>
        <li>
          <button
            className="w-full text-left hover:text-cyan-600 transition-colors py-1"
            onClick={() => onLaunch('greenscreen')}
          >
            🟢 Open Green Screen Studio
          </button>
        </li>
        <li>
          <button
            className="w-full text-left hover:text-cyan-600 transition-colors py-1"
            onClick={() => onLaunch('orchestrator')}
          >
            📡 Claude Orchestrator Console
          </button>
        </li>
        <li>
          <button
            className="w-full text-left hover:text-cyan-600 transition-colors py-1"
            onClick={() => onLaunch('memory')}
          >
            📖 Anthology Memory Flowchart
          </button>
        </li>
        <li>
          <button
            className="w-full text-left hover:text-cyan-600 transition-colors py-1"
            onClick={() => onLaunch('agents')}
          >
            🤖 ASOS Agent View
          </button>
        </li>
        <li>
          <button
            className="w-full text-left hover:text-cyan-600 transition-colors py-1"
            onClick={() => onLaunch('sallyport')}
          >
            🔐 Verify SallyPort Access
          </button>
        </li>
      </ul>
    </div>
  );
};

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = React.useContext(AuthContext);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mb-2" style={{ borderColor: `${PRIMARY_COLOR} transparent ${PRIMARY_COLOR} ${PRIMARY_COLOR}` }}></div>
          <div>Verifying SallyPort authentication...</div>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return <Login />;
  }
  
  return children;
};

// View components
const SymphonyView = () => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_URL}/visualization/symphony`);
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Error fetching Symphony data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mb-2" style={{ borderColor: `${PRIMARY_COLOR} transparent ${PRIMARY_COLOR} ${PRIMARY_COLOR}` }}></div>
          <div>Loading Symphony View...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-8 bg-dark-accent shadow-inner max-w-4xl mx-auto mt-8 rounded-lg border border-light-accent fade-in">
      <h2 className="text-2xl font-bold mb-4" style={{ color: '#64c8ff' }}>🎼 Symphony View</h2>
      
      <div className="bg-dark p-6 rounded-lg">
        <div className="font-medium text-lg mb-2">Full Symphony View Loaded</div>
        <div className="text-gray-400 mb-6">Orchestrating system components...</div>
        
        <div className="grid grid-cols-3 gap-4 mb-6">
          {data && data.components.map((component) => (
            <div 
              key={component.id} 
              className="bg-dark-accent p-4 rounded border border-light-accent text-center shimmer"
            >
              <div className="font-medium mb-1">{component.name}</div>
              <div className="text-xs text-green-400">{component.status}</div>
              <div className="text-xs text-gray-400 mt-1">Connections: {component.connections}</div>
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-dark-accent p-3 rounded-lg">
            <div className="text-xs text-gray-400">Total Requests</div>
            <div className="text-xl font-bold" style={{ color: PRIMARY_COLOR }}>{data?.metrics.totalRequests}</div>
          </div>
          <div className="bg-dark-accent p-3 rounded-lg">
            <div className="text-xs text-gray-400">Avg Response Time</div>
            <div className="text-xl font-bold" style={{ color: PRIMARY_COLOR }}>{data?.metrics.averageResponseTime}ms</div>
          </div>
          <div className="bg-dark-accent p-3 rounded-lg">
            <div className="text-xs text-gray-400">Error Rate</div>
            <div className="text-xl font-bold" style={{ color: PRIMARY_COLOR }}>{data?.metrics.errorRate * 100}%</div>
          </div>
          <div className="bg-dark-accent p-3 rounded-lg">
            <div className="text-xs text-gray-400">Active Users</div>
            <div className="text-xl font-bold" style={{ color: PRIMARY_COLOR }}>{data?.metrics.activeUsers}</div>
          </div>
        </div>
        
        <div className="text-right text-sm text-gray-400">
          Symphony v1.0.3 | Integration Gateway Active
        </div>
      </div>
    </div>
  );
};

const GreenScreenView = () => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_URL}/visualization/greenscreen`);
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Error fetching Green Screen data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mb-2" style={{ borderColor: '#00e676 transparent #00e676 #00e676' }}></div>
          <div>Loading Green Screen Studio...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-8 bg-dark-accent shadow-inner max-w-4xl mx-auto mt-8 rounded-lg border border-light-accent fade-in">
      <h2 className="text-2xl font-bold mb-4 text-green-400">🟢 Green Screen Studio</h2>
      
      <div className="bg-dark p-6 rounded-lg">
        <div className="font-medium text-lg mb-2">Green Screen Studio Active</div>
        <div className="text-gray-400 mb-4">Visual composition environment initialized</div>
        
        <div className="bg-green-900 text-green-100 p-8 rounded text-center mb-6" style={{minHeight: "150px"}}>
          GREEN SCREEN ACTIVE
          <div className="mt-4 flex justify-center space-x-3">
            {data && data.layers.map((layer) => (
              <div key={layer.id} className="px-3 py-1 bg-green-800 rounded">
                {layer.name}
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-6">
          <div className="font-medium mb-2">Effects</div>
          <div className="grid grid-cols-3 gap-3">
            {data && data.effects.map((effect) => (
              <div 
                key={effect.id} 
                className={`p-2 rounded-lg text-sm ${
                  effect.enabled ? 'bg-green-800 text-green-100' : 'bg-dark-accent text-gray-400'
                }`}
              >
                {effect.name}
              </div>
            ))}
          </div>
        </div>
        
        <div className="text-right text-sm text-gray-400">
          Studio v2.1.0 | Ready for composition
        </div>
      </div>
    </div>
  );
};

const OrchestratorView = () => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_URL}/visualization/orchestrator`);
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Error fetching Orchestrator data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mb-2" style={{ borderColor: '#bb00ff transparent #bb00ff #bb00ff' }}></div>
          <div>Loading Orchestrator Console...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-8 bg-dark-accent shadow-inner max-w-4xl mx-auto mt-8 rounded-lg border border-light-accent fade-in">
      <h2 className="text-2xl font-bold mb-4 text-purple-400">📡 Claude Orchestrator Console</h2>
      
      <div className="bg-dark p-6 rounded-lg">
        <div className="font-medium text-lg mb-4">Console Output</div>
        
        <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm mb-6" style={{minHeight: "250px"}}>
          {data && data.logs.map((log, index) => (
            <div 
              key={index} 
              className={`mb-1 ${
                log.message.includes('Dr. Claude Orchestrator') ? 'text-cyan-400' : ''
              }`}
            >
              [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-4 gap-4 mb-4">
          <div className="bg-dark-accent p-3 rounded-lg">
            <div className="text-xs text-gray-400">Domains</div>
            <div className="text-xl font-bold text-purple-400">{data?.stats.domains}</div>
          </div>
          <div className="bg-dark-accent p-3 rounded-lg">
            <div className="text-xs text-gray-400">Active Monitors</div>
            <div className="text-xl font-bold text-purple-400">{data?.stats.activeMonitors}</div>
          </div>
          <div className="bg-dark-accent p-3 rounded-lg">
            <div className="text-xs text-gray-400">Processed Events</div>
            <div className="text-xl font-bold text-purple-400">{data?.stats.processedEvents}</div>
          </div>
          <div className="bg-dark-accent p-3 rounded-lg">
            <div className="text-xs text-gray-400">Health Score</div>
            <div className="text-xl font-bold text-purple-400">{data?.stats.healthScore}%</div>
          </div>
        </div>
        
        <div className="flex space-x-3">
          <div className="px-2 py-1 bg-gray-800 rounded text-xs">Console</div>
          <div className="px-2 py-1 bg-gray-800 rounded text-xs">Logs</div>
          <div className="px-2 py-1 bg-gray-800 rounded text-xs">Metrics</div>
          <div className="px-2 py-1 bg-gray-800 rounded text-xs">Config</div>
        </div>
      </div>
    </div>
  );
};

const MemoryView = () => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_URL}/visualization/memory`);
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Error fetching Memory data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mb-2" style={{ borderColor: '#ffbb00 transparent #ffbb00 #ffbb00' }}></div>
          <div>Loading Memory Flowchart...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-8 bg-dark-accent shadow-inner max-w-4xl mx-auto mt-8 rounded-lg border border-light-accent fade-in">
      <h2 className="text-2xl font-bold mb-4 text-amber-400">📖 Anthology Memory Flowchart</h2>
      
      <div className="bg-dark p-6 rounded-lg">
        <div className="font-medium text-lg mb-2">Anthology Memory System</div>
        <div className="text-gray-400 mb-4">Visualizing memory pathways and connections</div>
        
        <div className="bg-dark-accent p-4 rounded-lg border border-amber-900 mb-6" style={{minHeight: "200px"}}>
          <div className="flex justify-between mb-6">
            {['Input Layer', 'Processing', 'Memory Store', 'Output Layer'].map((label, index) => (
              <div key={index} className="bg-amber-900 bg-opacity-30 p-2 rounded text-center w-32 text-amber-200">
                {label}
              </div>
            ))}
          </div>
          
          <div className="h-32 border border-amber-900 border-opacity-30 rounded p-4 flex items-center justify-center text-gray-400 grid-pattern">
            [Memory Pathways Visualization]
            
            <div className="absolute inset-0 flex items-center justify-center">
              <svg width="100%" height="100%" viewBox="0 0 400 100" className="opacity-70">
                {data && data.nodes.map((node, index) => {
                  const x = 50 + (index % 3) * 150;
                  const y = 30 + Math.floor(index / 3) * 50;
                  
                  return (
                    <g key={node.id}>
                      <circle 
                        cx={x} 
                        cy={y} 
                        r={10} 
                        fill={
                          node.type === 'input' ? 'rgba(255, 187, 0, 0.7)' : 
                          node.type === 'processing' ? 'rgba(255, 140, 0, 0.7)' :
                          node.type === 'memory' ? 'rgba(255, 100, 0, 0.7)' :
                          'rgba(255, 80, 0, 0.7)'
                        } 
                      />
                      
                      {node.connections.map((connId) => {
                        const targetIndex = data.nodes.findIndex(n => n.id === connId);
                        if (targetIndex !== -1) {
                          const tx = 50 + (targetIndex % 3) * 150;
                          const ty = 30 + Math.floor(targetIndex / 3) * 50;
                          
                          return (
                            <line 
                              key={`${node.id}-${connId}`}
                              x1={x} 
                              y1={y} 
                              x2={tx} 
                              y2={ty} 
                              stroke="rgba(255, 187, 0, 0.4)" 
                              strokeWidth="2" 
                            />
                          );
                        }
                        return null;
                      })}
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
          
          <div className="flex justify-between mt-6 text-xs text-gray-400">
            <div>Memory Units: {data?.stats.memoryUnits}</div>
            <div>Connections: {data?.stats.connections}</div>
            <div>Active Pathways: {data?.stats.activePaths}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AgentsView = () => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`${API_URL}/visualization/agents`);
        const result = await response.json();
        
        if (result.success) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Error fetching Agents data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-t-transparent rounded-full animate-spin mb-2" style={{ borderColor: '#8c53c6 transparent #8c53c6 #8c53c6' }}></div>
          <div>Loading Agent View...</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-8 bg-dark-accent shadow-inner max-w-4xl mx-auto mt-8 rounded-lg border border-light-accent fade-in">
      <h2 className="text-2xl font-bold mb-4 text-indigo-400">🤖 ASOS Agent View</h2>
      
      <div className="bg-dark p-6 rounded-lg">
        <div className="font-medium text-lg mb-2">ASOS Agent System Initialized</div>
        <div className="text-gray-400 mb-4">Visualizing agent interactions and activities</div>
        
        <div className="bg-indigo-900 bg-opacity-30 rounded-lg p-4 mb-6" style={{minHeight: "200px"}}>
          <div className="grid grid-cols-3 gap-4 mb-4">
            {data && data.agents.map((agent) => (
              <div 
                key={agent.id} 
                className="bg-indigo-800 bg-opacity-50 text-indigo-100 p-3 rounded agent-pulse"
                style={{ animationDelay: `${Math.random() * 2}s` }}
              >
                <div className="font-medium mb-1">{agent.name}</div>
                <div className="text-xs text-indigo-300">{agent.system}</div>
                <div className="mt-2 h-1 bg-indigo-700 rounded">
                  <div 
                    className="h-full bg-indigo-400 rounded" 
                    style={{ width: `${agent.load}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center text-indigo-300 text-xs mt-2">
            Agent Animation Framework v{data?.system.version} | Load: {(data?.system.load * 100).toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
};

const SallyPortView = () => {
  return (
    <div className="p-8 bg-dark-accent shadow-inner max-w-4xl mx-auto mt-8 rounded-lg border border-light-accent fade-in">
      <h2 className="text-2xl font-bold mb-4 text-cyan-400">🔐 SallyPort Authentication System</h2>
      
      <div className="bg-dark p-6 rounded-lg security-glow">
        <div className="font-medium text-lg mb-2">Authentication Framework</div>
        <div className="text-gray-400 mb-4">Security layer managed by Dr. Grant</div>
        
        <div className="bg-dark-accent p-4 rounded-lg border border-cyan-900 mb-4">
          <h3 className="font-medium text-cyan-400 mb-2">Protected Routes</h3>
          <div className="grid grid-cols-3 gap-2 mb-3">
            <div className="bg-cyan-900 bg-opacity-30 p-2 rounded text-center">
              <code className="text-sm text-cyan-200">/diamond</code>
            </div>
            <div className="bg-cyan-900 bg-opacity-30 p-2 rounded text-center">
              <code className="text-sm text-cyan-200">/vision</code>
            </div>
            <div className="bg-cyan-900 bg-opacity-30 p-2 rounded text-center">
              <code className="text-sm text-cyan-200">/copilot</code>
            </div>
          </div>
        </div>
        
        <div className="bg-dark-accent p-4 rounded-lg border border-cyan-900 mb-4">
          <h3 className="font-medium text-cyan-400 mb-2">Authentication Flow</h3>
          <div className="text-sm space-y-2">
            <div className="flex items-center">
              <div className="bg-cyan-700 text-cyan-100 rounded-full w-6 h-6 flex items-center justify-center mr-2">1</div>
              <span>Request to <code className="text-cyan-200">/api/auth/**</code> triggers <code className="text-cyan-200">authenticateWithSallyPort</code></span>
            </div>
            <div className="flex items-center">
              <div className="bg-cyan-700 text-cyan-100 rounded-full w-6 h-6 flex items-center justify-center mr-2">2</div>
              <span>Token validation via <code className="text-cyan-200">SallyPortAuth.tsx</code> component</span>
            </div>
            <div className="flex items-center">
              <div className="bg-cyan-700 text-cyan-100 rounded-full w-6 h-6 flex items-center justify-center mr-2">3</div>
              <span>Session state managed by <code className="text-cyan-200">useSallyPortAuth.ts</code> hook</span>
            </div>
            <div className="flex items-center">
              <div className="bg-cyan-700 text-cyan-100 rounded-full w-6 h-6 flex items-center justify-center mr-2">4</div>
              <span>Cryptographic verification via <code className="text-cyan-200">sallyport-verifier.js</code></span>
            </div>
            <div className="flex items-center">
              <div className="bg-cyan-700 text-cyan-100 rounded-full w-6 h-6 flex items-center justify-center mr-2">5</div>
              <span>Session verification via <code className="text-cyan-200">/api/verify/**</code> endpoint</span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="inline-block bg-cyan-700 text-cyan-100 rounded-full px-4 py-2 text-sm">
            Session Status: <span className="font-medium">Authenticated</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Dashboard component with view selection
const Dashboard = () => {
  const [currentView, setCurrentView] = React.useState('welcome');
  
  const handleLaunch = (viewName) => {
    setCurrentView(viewName);
    console.log(`[🔁] ${viewName} view activated`);
    
    // Play sound
    if (window.SymphonyAudio) {
      window.SymphonyAudio.play('click');
    }
  };
  
  // Auto-launch views on component mount
  React.useEffect(() => {
    setTimeout(() => {
      console.log('[🔁] Symphony View activated');
      handleLaunch('symphony');
      
      setTimeout(() => {
        console.log('[🟢] Green Screen Studio launched');
        handleLaunch('greenscreen');
      }, 2000);
    }, 1000);
  }, []);
  
  // Render current view
  const renderView = () => {
    switch (currentView) {
      case 'symphony':
        return <SymphonyView />;
      case 'greenscreen':
        return <GreenScreenView />;
      case 'orchestrator':
        return <OrchestratorView />;
      case 'memory':
        return <MemoryView />;
      case 'agents':
        return <AgentsView />;
      case 'sallyport':
        return <SallyPortView />;
      default:
        return (
          <div className="p-8 text-center max-w-2xl mx-auto mt-10 bg-dark-accent rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4 text-cyan-400">ASOOS Symphony Environment</h2>
            <p className="mb-4">Welcome to the Symphony Environment. Use the Developer Panel (Shift+Ctrl+9) to access different views.</p>
            
            <div className="mt-8 grid grid-cols-2 gap-4">
              <button 
                className="p-4 bg-dark rounded-lg border border-cyan-900 hover:bg-cyan-900 hover:bg-opacity-30 transition-colors text-left"
                onClick={() => handleLaunch('symphony')}
              >
                <div className="font-medium text-cyan-400">🔁 Symphony View</div>
                <div className="text-sm text-gray-400">Full system orchestration</div>
              </button>
              <button 
                className="p-4 bg-dark rounded-lg border border-green-900 hover:bg-green-900 hover:bg-opacity-30 transition-colors text-left"
                onClick={() => handleLaunch('greenscreen')}
              >
                <div className="font-medium text-green-400">🟢 Green Screen Studio</div>
                <div className="text-sm text-gray-400">Visual composition environment</div>
              </button>
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: '#121212' }}>
      <Header />
      
      <div className="flex-1 overflow-auto pb-16">
        {renderView()}
      </div>
      
      <DeveloperPanel onLaunch={handleLaunch} />
      
      <div className="h-10 bg-dark text-gray-400 text-xs flex items-center justify-between px-4">
        <div>ASOOS Symphony v1.0.3 | Owner Subscriber Access</div>
        <div className="flex items-center">
          <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
          SallyPort Authentication: Active
        </div>
      </div>
    </div>
  );
};

// Main App Component
const App = () => {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    </AuthProvider>
  );
};

// Render the App component
ReactDOM.render(<App />, document.getElementById('root'));
