import React, { useState, useEffect } from 'react';

/**
 * AgentManager Component
 * 
 * Provides interface for managing and monitoring agents in the Wing system.
 * Features include:
 * - Agent listing and filtering
 * - Agent status monitoring
 * - Agent deployment controls
 * - Performance metrics visualization
 */
const AgentManager = () => {
  // State for agents data
  const [agents, setAgents] = useState([]);
  const [filteredAgents, setFilteredAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState(null);

  // Mock agent data - in a real implementation, this would come from Firebase/API
  useEffect(() => {
    // Simulate API fetch
    setTimeout(() => {
      const mockAgents = [
        {
          id: 'agt-001',
          name: 'Dr. Lucy',
          type: 'Flight Memory System',
          tier: 'Tier 01',
          status: 'active',
          lastActive: '2025-05-25T08:45:12Z',
          performance: 97,
          tasks: 243,
          instance: '0045',
          squadron: 'R1',
          description: 'Core intelligence agent specializing in memory management and recall optimization.'
        },
        {
          id: 'agt-002',
          name: 'Dr. Burby',
          type: 'S2DO Blockchain',
          tier: 'Tier 01',
          status: 'active',
          lastActive: '2025-05-25T09:12:33Z',
          performance: 94,
          tasks: 198,
          instance: '0062',
          squadron: 'R1',
          description: 'Blockchain governance agent managing smart contract approvals and verification.'
        },
        {
          id: 'agt-003',
          name: 'Professor Lee',
          type: 'Q4D Lenz',
          tier: 'Tier 01',
          status: 'active',
          lastActive: '2025-05-25T10:05:41Z',
          performance: 98,
          tasks: 321,
          instance: '0037',
          squadron: 'R1',
          description: 'Contextual understanding agent for deep semantic analysis.'
        },
        {
          id: 'agt-004',
          name: 'Dr. Sabina',
          type: 'Dream Commander',
          tier: 'Tier 01',
          status: 'idle',
          lastActive: '2025-05-24T22:18:05Z',
          performance: 96,
          tasks: 187,
          instance: '0089',
          squadron: 'R1',
          description: 'Strategic intelligence agent for learning path optimization and prediction.'
        },
        {
          id: 'agt-005',
          name: 'Dr. Memoria',
          type: 'Anthology',
          tier: 'Tier 02',
          status: 'active',
          lastActive: '2025-05-25T09:45:22Z',
          performance: 91,
          tasks: 156,
          instance: '0112',
          squadron: 'R2',
          description: 'Automated publishing agent with summarization capabilities.'
        },
        {
          id: 'agt-006',
          name: 'Dr. Claude',
          type: 'Orchestrator',
          tier: 'Tier 01',
          status: 'active',
          lastActive: '2025-05-25T10:28:03Z',
          performance: 99,
          tasks: 542,
          instance: '0023',
          squadron: 'R1',
          description: 'Master coordination agent for Symphony orchestration and delegation.'
        },
        {
          id: 'agt-007',
          name: 'Dr. Grant',
          type: 'Cybersecurity',
          tier: 'Tier 01',
          status: 'active',
          lastActive: '2025-05-25T10:22:17Z',
          performance: 95,
          tasks: 231,
          instance: '0056',
          squadron: 'R1',
          description: 'Security solutions agent for infrastructure protection and threat detection.'
        },
        {
          id: 'agt-008',
          name: 'Dr. Maria',
          type: 'Support',
          tier: 'Tier 03',
          status: 'maintenance',
          lastActive: '2025-05-23T14:32:45Z',
          performance: 88,
          tasks: 129,
          instance: '0147',
          squadron: 'R3',
          description: 'Multilingual support agent with cultural adaptation capabilities.'
        }
      ];
      
      setAgents(mockAgents);
      setFilteredAgents(mockAgents);
      setLoading(false);
    }, 1000);
  }, []);

  // Filter agents whenever filter or search term changes
  useEffect(() => {
    if (agents.length === 0) return;
    
    let result = [...agents];
    
    // Apply status filter
    if (filter !== 'all') {
      result = result.filter(agent => agent.status === filter);
    }
    
    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(agent => 
        agent.name.toLowerCase().includes(term) || 
        agent.type.toLowerCase().includes(term) ||
        agent.description.toLowerCase().includes(term)
      );
    }
    
    setFilteredAgents(result);
  }, [filter, searchTerm, agents]);

  // Handle agent selection
  const handleAgentSelect = (id) => {
    setSelectedAgentId(id === selectedAgentId ? null : id);
  };

  // Handle agent deployment
  const handleDeployAgent = (id) => {
    // In a real implementation, this would call an API or Firebase function
    console.log(`Deploying agent ${id}`);
    // Update the agent status
    const updatedAgents = agents.map(agent => 
      agent.id === id ? { ...agent, status: 'deploying' } : agent
    );
    setAgents(updatedAgents);
    
    // Simulate deployment completion
    setTimeout(() => {
      const completedAgents = agents.map(agent => 
        agent.id === id ? { ...agent, status: 'active', lastActive: new Date().toISOString() } : agent
      );
      setAgents(completedAgents);
    }, 2000);
  };

  // Handle agent maintenance mode
  const handleMaintenanceMode = (id) => {
    // In a real implementation, this would call an API or Firebase function
    console.log(`Setting agent ${id} to maintenance mode`);
    const updatedAgents = agents.map(agent => 
      agent.id === id ? { ...agent, status: 'maintenance' } : agent
    );
    setAgents(updatedAgents);
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'active':
        return 'badge badge-success';
      case 'idle':
        return 'badge bg-gray-200 text-gray-700';
      case 'maintenance':
        return 'badge badge-warning';
      case 'deploying':
        return 'badge badge-primary';
      default:
        return 'badge bg-gray-200 text-gray-700';
    }
  };

  // Display loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center p-10">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-gray-600">Loading Wing agents...</p>
        </div>
      </div>
    );
  }

  // Display error state
  if (error) {
    return (
      <div className="alert alert-danger">
        <h4 className="text-lg font-semibold">Error Loading Agents</h4>
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="agent-manager">
      {/* Control Panel */}
      <div className="card mb-8">
        <div className="card-header bg-gray-50">
          <h3 className="text-xl font-semibold">Wing Control Center</h3>
          <p className="text-sm text-gray-600">Manage and monitor Symphony agents across all squadrons</p>
        </div>
        <div className="card-body">
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Search */}
            <div className="flex-1 min-w-[250px]">
              <input
                type="text"
                placeholder="Search agents by name or function..."
                className="w-full p-3 border border-gray-300 rounded-md"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {/* Filters */}
            <div className="flex gap-2">
              <button 
                className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button 
                className={`btn ${filter === 'active' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setFilter('active')}
              >
                Active
              </button>
              <button 
                className={`btn ${filter === 'idle' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setFilter('idle')}
              >
                Idle
              </button>
              <button 
                className={`btn ${filter === 'maintenance' ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setFilter('maintenance')}
              >
                Maintenance
              </button>
            </div>
          </div>
          
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card bg-gray-50">
              <div className="card-body p-4 text-center">
                <h4 className="text-gray-700">Total Agents</h4>
                <div className="text-3xl font-bold text-primary">{agents.length}</div>
              </div>
            </div>
            <div className="card bg-gray-50">
              <div className="card-body p-4 text-center">
                <h4 className="text-gray-700">Active</h4>
                <div className="text-3xl font-bold text-primary">
                  {agents.filter(a => a.status === 'active').length}
                </div>
              </div>
            </div>
            <div className="card bg-gray-50">
              <div className="card-body p-4 text-center">
                <h4 className="text-gray-700">Avg. Performance</h4>
                <div className="text-3xl font-bold text-primary">
                  {Math.round(agents.reduce((sum, a) => sum + a.performance, 0) / agents.length)}%
                </div>
              </div>
            </div>
            <div className="card bg-gray-50">
              <div className="card-body p-4 text-center">
                <h4 className="text-gray-700">Total Tasks</h4>
                <div className="text-3xl font-bold text-primary">
                  {agents.reduce((sum, a) => sum + a.tasks, 0)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Agent List */}
      <div className="agents-grid">
        {filteredAgents.length === 0 ? (
          <div className="text-center p-10 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No Agents Found</h3>
            <p className="text-gray-600">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgents.map(agent => (
              <div 
                key={agent.id}
                className={`card hover:border-primary transition-all ${selectedAgentId === agent.id ? 'border-2 border-primary shadow-lg' : ''}`}
                onClick={() => handleAgentSelect(agent.id)}
              >
                <div className="card-header flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-semibold">{agent.name}</h3>
                    <p className="text-sm text-gray-600">{agent.type}</p>
                  </div>
                  <div className={getStatusBadgeClass(agent.status)}>
                    {agent.status}
                  </div>
                </div>
                <div className="card-body">
                  <div className="mb-4">
                    <p className="text-sm text-gray-700">{agent.description}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-600">Instance</p>
                      <p className="font-semibold">{agent.instance}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Squadron</p>
                      <p className="font-semibold">{agent.squadron}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Tier</p>
                      <p className="font-semibold">{agent.tier}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Tasks</p>
                      <p className="font-semibold">{agent.tasks}</p>
                    </div>
                  </div>
                  <div className="mb-2">
                    <p className="text-xs text-gray-600 mb-1">Performance</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary rounded-full h-2" 
                        style={{ width: `${agent.performance}%` }}
                      ></div>
                    </div>
                    <p className="text-right text-xs mt-1">{agent.performance}%</p>
                  </div>
                </div>
                <div className="card-footer flex justify-between">
                  <div className="text-xs text-gray-600">
                    Last Active: {new Date(agent.lastActive).toLocaleString()}
                  </div>
                  <div className="flex gap-2">
                    {agent.status !== 'active' && (
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeployAgent(agent.id);
                        }}
                      >
                        Deploy
                      </button>
                    )}
                    {agent.status !== 'maintenance' && (
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMaintenanceMode(agent.id);
                        }}
                      >
                        Maintenance
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentManager;

