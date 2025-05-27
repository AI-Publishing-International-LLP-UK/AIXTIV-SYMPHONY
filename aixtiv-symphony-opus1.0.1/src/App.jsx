import React, { useState } from 'react';
import AgentManager from './components/AgentManager';
import ClaudeInterface from './components/ClaudeInterface';
import DeweyCard from './components/DeweyCard';
import DeepgramTranscriber from './components/DeepgramTranscriber';

/**
 * Main App Component for ASOOS Divinity Wing Interface
 * 
 * Provides navigation and integration of all main components:
 * - Dashboard
 * - Agent Management
 * - Dewey Card System
 * - S2DO Workflow
 * - Analytics
 */
const App = () => {
  // State for active tab navigation
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Mock data for Dewey Cards
  const mockDeweyCards = [
    {
      id: 'DWC-8F43',
      title: 'Enterprise LMS RFP',
      agentName: 'Dr. Lucy',
      agentInstance: '0045',
      task: 'Lead research analysis for EdTech platform evaluation',
      performance: 5,
      nftRef: 'ETH-QMM932',
      timestamp: '2025-05-20T14:22:10Z',
      status: 'Completed',
      metadata: {
        'Domain': 'Education',
        'Priority': 'High',
        'Blockchain': 'Ethereum'
      }
    },
    {
      id: 'DWC-9A21',
      title: 'Integration Gateway Security',
      agentName: 'Dr. Grant',
      agentInstance: '0056',
      task: 'Implement token validation for cross-domain requests',
      performance: 4,
      nftRef: 'ETH-QMM945',
      timestamp: '2025-05-21T09:17:32Z',
      status: 'Completed'
    },
    {
      id: 'DWC-7C92',
      title: 'Agent Lifecycle Management',
      agentName: 'Dr. Claude',
      agentInstance: '0023',
      task: 'Design promotion pathway for Tier 03 agents',
      performance: 5,
      nftRef: 'ETH-QMM951',
      timestamp: '2025-05-22T16:45:03Z',
      status: 'Completed'
    },
    {
      id: 'DWC-3D77',
      title: 'S2DO Smart Contract Integration',
      agentName: 'Dr. Burby',
      agentInstance: '0062',
      task: 'Develop blockchain verification for completed tasks',
      performance: 0,
      nftRef: '',
      timestamp: '2025-05-23T10:12:45Z',
      status: 'In Progress',
      actions: [
        {
          label: 'Review',
          handler: (id) => console.log(`Reviewing card ${id}`)
        },
        {
          label: 'Approve',
          handler: (id) => console.log(`Approving card ${id}`)
        }
      ]
    }
  ];
  
  // Stats for dashboard
  const stats = {
    activeAgents: 92,
    deweyCards: '1.4M',
    smartContracts: 18,
    systemHealth: 99.8
  };
  
  // Handle Dewey Card click
  const handleDeweyCardClick = (cardId) => {
    console.log(`Card clicked: ${cardId}`);
  };

  return (
    <div className="asoos-app">
      <header>
        <div className="container">
          <div className="header-content">
            <div className="logo">ASOOS <span>Symphony Opus 1.0.1</span></div>
            <div className="user-section">
              <div className="user-avatar">MR</div>
              <div>
                <div>Mr. Phillip Corey Roark</div>
                <small>Commander</small>
              </div>
            </div>
          </div>
          <nav>
            <ul className="nav-list">
              <li className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}>
                <a href="#dashboard" onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('dashboard');
                }}>Dashboard</a>
              </li>
              <li className={`nav-item ${activeTab === 'agents' ? 'active' : ''}`}>
                <a href="#agents" onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('agents');
                }}>Agents</a>
              </li>
              <li className={`nav-item ${activeTab === 'dewey' ? 'active' : ''}`}>
                <a href="#dewey" onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('dewey');
                }}>Dewey Cards</a>
              </li>
              <li className={`nav-item ${activeTab === 's2do' ? 'active' : ''}`}>
                <a href="#s2do" onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('s2do');
                }}>S2DO Workflow</a>
              </li>
              <li className={`nav-item ${activeTab === 'analytics' ? 'active' : ''}`}>
                <a href="#analytics" onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('analytics');
                }}>Analytics</a>
              </li>
              <li className={`nav-item ${activeTab === 'speech' ? 'active' : ''}`}>
                <a href="#speech" onClick={(e) => {
                  e.preventDefault();
                  setActiveTab('speech');
                }}>Speech Recognition</a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="container">
        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <>
            <h2 className="section-title">System Dashboard</h2>
            
            <div className="dashboard-grid">
              <div className="stat-card">
                <h3>Active Agents</h3>
                <div className="value">{stats.activeAgents}</div>
                <div className="description">Across Opus 1: Amplify to Opus 5: Senador</div>
              </div>
              <div className="stat-card">
                <h3>Dewey Cards</h3>
                <div className="value">{stats.deweyCards}</div>
                <div className="description">Task cards with performance history</div>
              </div>
              <div className="stat-card">
                <h3>Smart Contracts</h3>
                <div className="value">{stats.smartContracts}</div>
                <div className="description">Recent blockchain transactions</div>
              </div>
              <div className="stat-card">
                <h3>System Health</h3>
                <div className="value">{stats.systemHealth}%</div>
                <div className="description">Overall system operational status</div>
              </div>
            </div>
            
            <h2 className="section-title">Recent Dewey Cards</h2>
            <div className="dewey-cards">
              {mockDeweyCards.slice(0, 3).map(card => (
                <DeweyCard 
                  key={card.id} 
                  card={card} 
                  onCardClick={handleDeweyCardClick}
                />
              ))}
            </div>
            
            <h2 className="section-title">Dr. Claude Interface</h2>
            <ClaudeInterface />
          </>
        )}
        
        {/* Agents Tab */}
        {activeTab === 'agents' && (
          <>
            <h2 className="section-title">Agent Management</h2>
            <AgentManager />
          </>
        )}
        
        {/* Dewey Cards Tab */}
        {activeTab === 'dewey' && (
          <>
            <h2 className="section-title">Dewey Digital Cards</h2>
            <p className="mb-6">
              Dewey Cards represent tasks assigned to agents and their completion status. 
              Each card contains performance metrics, blockchain verification, and task details.
            </p>
            <div className="dewey-cards">
              {mockDeweyCards.map(card => (
                <DeweyCard 
                  key={card.id} 
                  card={card} 
                  onCardClick={handleDeweyCardClick}
                />
              ))}
            </div>
          </>
        )}
        
        {/* S2DO Workflow Tab */}
        {activeTab === 's2do' && (
          <>
            <h2 className="section-title">S2DO Workflow</h2>
            <p className="mb-6">
              The S2DO (Scan-to-Do) workflow system manages task approvals and blockchain integration,
              ensuring transparent verification and immutable record-keeping for all agent activities.
            </p>
            
            <div className="card mb-8">
              <div className="card-header">
                <h3>Workflow Diagram</h3>
              </div>
              <div className="card-body">
                <div className="workflow-diagram">
                  <div className="workflow-step">
                    <div className="step-number">1</div>
                    <div className="step-label">Task Created</div>
                    <div className="step-agent">Tier 01 Core agent prototypes</div>
                  </div>
                  <div className="workflow-connector">→</div>
                  <div className="workflow-step">
                    <div className="step-number">2</div>
                    <div className="step-label">Task Assigned</div>
                    <div className="step-agent">Tier 02 Deploy agent executes</div>
                  </div>
                  <div className="workflow-connector">→</div>
                  <div className="workflow-step">
                    <div className="step-number">3</div>
                    <div className="step-label">Task Completed</div>
                    <div className="step-agent">Tier 03 Engage agent delivers</div>
                  </div>
                  <div className="workflow-connector">→</div>
                  <div className="workflow-step">
                    <div className="step-number">4</div>
                    <div className="step-label">Task Archived</div>
                    <div className="step-agent">Dewey Card with lifecycle tags</div>
                  </div>
                </div>
              </div>
            </div>
            
            <h3 className="text-xl font-semibold mb-4">Blockchain Integration</h3>
            <p className="mb-6">
              All completed tasks are recorded on the blockchain through the S2DO governance system, 
              creating an immutable record of agent activities and task completions.
            </p>
            
            <ClaudeInterface />
          </>
        )}
        
        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <>
            <h2 className="section-title">Analytics</h2>
            <p className="mb-4">Performance analytics for the ASOOS Symphony system.</p>
            
            <div className="card p-10 text-center">
              <div className="text-2xl font-bold text-gray-700 mb-4">Analytics Dashboard</div>
              <p className="text-gray-600 mb-6">
                Comprehensive performance metrics and system analytics coming in the next update.
              </p>
              <div className="flex justify-center">
                <button className="btn btn-primary">Request Early Access</button>
              </div>
            </div>
          </>
        )}
        
        {/* Speech Recognition Tab */}
        {activeTab === 'speech' && (
          <>
            <h2 className="section-title">Speech Recognition</h2>
            <p className="mb-4">
              Use Deepgram's AI-powered speech recognition to transcribe audio files or live recordings.
              Compare different models and customize transcription settings for optimal results.
            </p>
            <DeepgramTranscriber />
          </>
        )}
      </main>

      <footer>
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>About ASOOS</h3>
              <p>ASOOS (Aixtiv Symphony Orchestrating Operating System) is a modular, agent-driven enterprise solution for orchestrating AI workflows and human collaboration.</p>
            </div>
            <div className="footer-section">
              <h3>Quick Links</h3>
              <ul>
                <li><a href="#documentation">Documentation</a></li>
                <li><a href="#api">API Reference</a></li>
                <li><a href="#support">Support</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h3>Contact</h3>
              <p>For assistance, please contact your agent representative or system administrator.</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 ASOOS Symphony Opus 1.0.1. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;

