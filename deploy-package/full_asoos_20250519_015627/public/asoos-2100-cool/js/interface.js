/**
 * ASOOS.2100.COOL Interface
 * Implementation of the ASOOSInterface React component as vanilla JS
 */

document.addEventListener('DOMContentLoaded', function() {
  // Theme colors from your React component
  const themeColors = {
    primary: '#0bb1bb',
    secondary: '#c7b299',
    black: '#000000',
    white: '#ffffff',
    gradientStart: '#FFD700',
    gradientMiddle: '#c7b299',
    gradientEnd: '#50C878'
  };

  // User and Copilot information
  const userInfo = {
    uuid: "00001",
    name: "Mr. Phillip Corey Roark",
    role: "CEO / Principal"
  };
  
  const copilotInfo = {
    id: "0001",
    name: "QB Lucy",
    status: "Active"
  };

  // State variables
  let currentTheme = 'default';
  let selectedIcon = null;
  let expandedPanel = 'S2DO';
  let chatInput = '';
  let messages = [];
  let showLibrary = false;
  let showSettings = false;
  let audioEnabled = true;
  let isListening = false;
  let isSpeaking = false;
  let currentLanguage = 'en-US';
  let academyMode = false;
  let showIntegrations = false;
  let integrationCategory = 'all';

  // Get the root element
  const root = document.getElementById('root');

  // Main function to render the interface
  function renderInterface() {
    if (showIntegrations) {
      renderIntegrationsPage();
    } else if (showSettings) {
      renderSettingsPage();
    } else {
      renderMainInterface();
    }
  }

  // Render the main interface
  function renderMainInterface() {
    root.innerHTML = `
      <div class="flex h-screen bg-gray-50" style="font-family: 'Montserrat', sans-serif; font-weight: 400;">
        <!-- Left Sidebar -->
        <div class="left-sidebar">
          <!-- Sidebar Icons with Tooltips -->
          <div class="sidebar-icons">
            ${sidebarIcons.map(item => `
              <div
                class="sidebar-icon ${selectedIcon === item.id ? 'active' : ''}"
                data-id="${item.id}"
                data-name="${item.name}"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <defs>
                    <linearGradient id="gradient${item.id}" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stop-color="${themeColors.gradientStart}" stop-opacity="1" />
                      <stop offset="50%" stop-color="${themeColors.gradientMiddle}" stop-opacity="0.8" />
                      <stop offset="100%" stop-color="${themeColors.gradientEnd}" stop-opacity="0.6" />
                    </linearGradient>
                  </defs>
                  ${item.isTriangle ? 
                    `<path d="M12 2L22 20H2L12 2z" stroke="url(#gradient${item.id})" stroke-width="2" fill="none"/>` :
                    `<circle cx="12" cy="12" r="10" stroke="url(#gradient${item.id})" stroke-width="2" fill="none"/>`
                  }
                </svg>
                
                <!-- Icon inside -->
                <div class="icon-inner" style="position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; color: white;">
                  <i data-lucide="${item.iconName}"></i>
                </div>
                
                <!-- Tooltip that appears on hover -->
                <div class="icon-tooltip">
                  <div style="font-weight: bold;">${item.name}</div>
                  <div>${item.desc}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Main Content -->
        <div class="flex-1 flex flex-col">
          <!-- Header -->
          <div class="header">
            <div class="font-bold text-2xl tracking-wide" style="color: ${themeColors.primary};">
              ASOOS
            </div>
            <div class="text-right">
              <div class="font-bold text-lg">${userInfo.name}</div>
              <div class="text-sm" style="color: ${themeColors.primary};">${userInfo.role}</div>
            </div>
          </div>

          <!-- Content Area -->
          <div class="content-area">
            <!-- Chat Area -->
            <div class="chat-area">
              <!-- Messages -->
              <div class="messages">
                ${messages.map(msg => `
                  <div class="message ${msg.sender === 'user' ? 'user' : 'ai'}" style="${msg.sender === 'user' ? `background-color: ${themeColors.primary};` : ''}">
                    ${msg.text}
                  </div>
                `).join('')}
              </div>

              <!-- Input Area -->
              <div class="input-area">
                <button 
                  class="mic-button ${isListening ? 'listening' : ''}"
                  title="${isListening ? 'Stop listening' : 'Start voice input'}"
                >
                  <i data-lucide="mic"></i>
                </button>
                
                <input
                  type="text"
                  id="chatInput"
                  placeholder="${isListening ? 'Listening...' : 'Type your message...'}"
                  class="chat-input"
                  ${isListening ? 'disabled' : ''}
                />
                
                <button
                  class="audio-toggle"
                  title="${audioEnabled ? 'Mute responses' : 'Enable audio responses'}"
                >
                  <i data-lucide="${audioEnabled ? 'volume-2' : 'volume-x'}"></i>
                </button>
                
                <button
                  id="sendButton"
                  class="send-button"
                  ${!chatInput.trim() && !isListening ? 'disabled' : ''}
                  style="${!chatInput.trim() && !isListening ? '' : `background-color: ${themeColors.primary};`}"
                >
                  <i data-lucide="send"></i>
                </button>
              </div>
            </div>

            <!-- Right Panel -->
            <div class="right-panel">
              <div class="panel-header">
                <!-- Hexagonal Agent Representation -->
                <div class="flex items-center">
                  <div class="agent-avatar ${isSpeaking ? 'speaking' : ''}" title="QB Lucy - Your AI Copilot">
                    <svg viewBox="0 0 100 100">
                      <defs>
                        <linearGradient id="hexAgentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stop-color="${themeColors.primary}" stop-opacity="0.8" />
                          <stop offset="50%" stop-color="${themeColors.primary}" stop-opacity="0.9" />
                          <stop offset="100%" stop-color="${themeColors.primary}" stop-opacity="0.8" />
                        </linearGradient>
                      </defs>
                      <path 
                        d="M50 0 L95 25 L95 75 L50 100 L5 75 L5 25 Z" 
                        stroke="${themeColors.primary}"
                        stroke-width="2" 
                        fill="url(#hexAgentGradient)"
                      />
                      <circle cx="50" cy="35" r="10" fill="white" />
                      <path d="M30 70 Q50 90 70 70" stroke="white" stroke-width="2" fill="none" />
                    </svg>
                  </div>
                  
                  <!-- Copilot Information -->
                  <div>
                    <div class="font-semibold">${copilotInfo.name}</div>
                    <div class="text-xs text-gray-500">Copilot: ${copilotInfo.status}</div>
                  </div>
                </div>
                
                <!-- Quick Google TTS language indicator -->
                <div class="flex items-center text-xs text-gray-500">
                  <i data-lucide="globe" style="width: 14px; height: 14px; margin-right: 4px;"></i>
                  ${currentLanguage.split('-')[0].toUpperCase()}
                </div>
              </div>
              
              <!-- S2DO Section -->
              <div class="panel-card">
                <div 
                  class="panel-card-header"
                  data-panel="S2DO"
                >
                  <h3 class="font-bold" style="color: ${themeColors.primary};">S2DO's</h3>
                  <div class="text-gray-500">
                    ${expandedPanel === 'S2DO' ? '▼' : '▶️'}
                  </div>
                </div>
                
                ${expandedPanel === 'S2DO' ? `
                  <div class="panel-card-content">
                    <div class="space-y-3">
                      <div class="panel-bullet">
                        <div class="panel-bullet-dot"></div>
                        <span class="text-sm">Update sales dashboard with Q3 results</span>
                      </div>
                      <div class="panel-bullet">
                        <div class="panel-bullet-dot"></div>
                        <span class="text-sm">Schedule review meeting with marketing team</span>
                      </div>
                      <div class="panel-bullet">
                        <div class="panel-bullet-dot"></div>
                        <span class="text-sm">Finalize integration with new CRM system</span>
                      </div>
                    </div>
                    
                    <div class="mt-6">
                      <h3 class="font-bold text-sm mb-2" style="color: ${themeColors.primary};">Quick Stats</h3>
                      <div class="stats-grid">
                        <div class="stat-box">
                          <div class="stat-label">Open Tasks</div>
                          <div class="stat-value">12</div>
                        </div>
                        <div class="stat-box">
                          <div class="stat-label">In Progress</div>
                          <div class="stat-value">5</div>
                        </div>
                        <div class="stat-box">
                          <div class="stat-label">Completed Today</div>
                          <div class="stat-value">7</div>
                        </div>
                        <div class="stat-box">
                          <div class="stat-label">System Health</div>
                          <div class="stat-value" style="color: #10b981;">98%</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ` : ''}
              </div>
              
              <!-- Projects Section -->
              <div class="panel-card">
                <div 
                  class="panel-card-header"
                  data-panel="Projects"
                >
                  <h3 class="font-bold" style="color: ${themeColors.primary};">Phillip's Aixtiv Projects</h3>
                  <div class="text-gray-500">
                    ${expandedPanel === 'Projects' ? '▼' : '▶️'}
                  </div>
                </div>
                
                ${expandedPanel === 'Projects' ? `
                  <div class="panel-card-content">
                    <div class="space-y-2">
                      <div class="flex justify-between border-b pb-2">
                        <span class="text-sm font-medium">Symphony Integration</span>
                        <span class="text-xs" style="background-color: #dbeafe; color: #1e40af; padding: 0.25rem 0.5rem; border-radius: 9999px;">In Progress</span>
                      </div>
                      <div class="flex justify-between border-b pb-2">
                        <span class="text-sm font-medium">Market Analysis Report</span>
                        <span class="text-xs" style="background-color: #dcfce7; color: #166534; padding: 0.25rem 0.5rem; border-radius: 9999px;">Completed</span>
                      </div>
                      <div class="flex justify-between border-b pb-2">
                        <span class="text-sm font-medium">Client Presentation</span>
                        <span class="text-xs" style="background-color: #fef3c7; color: #92400e; padding: 0.25rem 0.5rem; border-radius: 9999px;">Pending</span>
                      </div>
                    </div>
                    
                    <div class="text-xs text-gray-500 mt-4 flex justify-between items-center">
                      <span>Last updated: Today, 10:42 AM</span>
                      <button class="text-blue-600 hover:text-blue-800">View All Projects</button>
                    </div>
                  </div>
                ` : ''}
              </div>
              
              <!-- Strategic Tasks -->
              <div class="panel-card">
                <div 
                  class="panel-card-header"
                  data-panel="Strategic"
                >
                  <h3 class="font-bold" style="color: ${themeColors.primary};">Strategic Executive Projects</h3>
                  <div class="text-gray-500">
                    ${expandedPanel === 'Strategic' ? '▼' : '▶️'}
                  </div>
                </div>
                
                ${expandedPanel === 'Strategic' ? `
                  <div class="panel-card-content">
                    <div class="space-y-2">
                      <div class="flex justify-between border-b pb-2">
                        <span class="text-sm font-medium">AI Implementation Strategy</span>
                        <span class="text-xs" style="background-color: #dbeafe; color: #1e40af; padding: 0.25rem 0.5rem; border-radius: 9999px;">Phase 2</span>
                      </div>
                      <div class="flex justify-between border-b pb-2">
                        <span class="text-sm font-medium">Digital Transformation</span>
                        <span class="text-xs" style="background-color: #f3e8ff; color: #6b21a8; padding: 0.25rem 0.5rem; border-radius: 9999px;">Planning</span>
                      </div>
                      <div class="flex justify-between border-b pb-2">
                        <span class="text-sm font-medium">2026 Growth Initiative</span>
                        <span class="text-xs" style="background-color: #e0e7ff; color: #3730a3; padding: 0.25rem 0.5rem; border-radius: 9999px;">Research</span>
                      </div>
                    </div>
                  </div>
                ` : ''}
              </div>
              
              <!-- Learning Resources -->
              <div class="panel-card">
                <div 
                  class="panel-card-header"
                  data-panel="Learning"
                >
                  <h3 class="font-bold" style="color: ${themeColors.primary};">Learning Resources</h3>
                  <div class="text-gray-500">
                    ${expandedPanel === 'Learning' ? '▼' : '▶️'}
                  </div>
                </div>
                
                ${expandedPanel === 'Learning' ? `
                  <div class="panel-card-content">
                    <div class="space-y-2">
                      <div class="p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                        <div class="text-sm font-medium">AI Leadership Masterclass</div>
                        <div class="text-xs text-gray-500">Strategic implementation frameworks</div>
                      </div>
                      <div class="p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                        <div class="text-sm font-medium">Executive Communication</div>
                        <div class="text-xs text-gray-500">Advanced techniques & case studies</div>
                      </div>
                      <div class="p-2 border border-gray-200 rounded hover:bg-gray-50 cursor-pointer">
                        <div class="text-sm font-medium">Future of Work Symposium</div>
                        <div class="text-xs text-gray-500">Recordings & presentation materials</div>
                      </div>
                    </div>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- Integration Bar -->
          <div class="integration-bar">
            <!-- Settings Icon -->
            <div 
              class="settings-button"
              id="settingsButton"
            >
              <i data-lucide="settings"></i>
            </div>
          
            <div class="integrations">
              <!-- Integration Categories -->
              <div class="integration-category">
                <div class="integration-label">Productivity:</div>
                <div class="integration-icons">
                  ${['Z', 'S', 'A'].map((item, idx) => `
                    <div
                      class="integration-icon"
                      title="${['Zapier', 'Slack', 'Asana'][idx]}"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <defs>
                          <linearGradient id="integrationGradient-productivity-${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="${themeColors.gradientStart}" stop-opacity="1" />
                            <stop offset="50%" stop-color="${themeColors.gradientMiddle}" stop-opacity="0.8" />
                            <stop offset="100%" stop-color="${themeColors.gradientEnd}" stop-opacity="0.6" />
                          </linearGradient>
                        </defs>
                        <circle cx="12" cy="12" r="10" stroke="url(#integrationGradient-productivity-${idx})" stroke-width="2" fill="none"/>
                      </svg>
                      
                      <!-- Icon text -->
                      <div class="integration-icon-text">
                        ${item}
                      </div>
                      
                      <!-- Tooltip that appears on hover -->
                      <div class="icon-tooltip" style="bottom: 100%; left: 50%; transform: translateX(-50%);">
                        ${['Zapier', 'Slack', 'Asana'][idx]}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
              
              <div class="divider"></div>
              
              <div class="integration-category">
                <div class="integration-label">Dev:</div>
                <div class="integration-icons">
                  ${['G', 'GL', 'J'].map((item, idx) => `
                    <div
                      class="integration-icon"
                      title="${['GitHub', 'GitLab', 'Jira'][idx]}"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <defs>
                          <linearGradient id="integrationGradient-dev-${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#4169e1" stop-opacity="1" />
                            <stop offset="50%" stop-color="#6b8cde" stop-opacity="0.8" />
                            <stop offset="100%" stop-color="#a3b8eb" stop-opacity="0.6" />
                          </linearGradient>
                        </defs>
                        <circle cx="12" cy="12" r="10" stroke="url(#integrationGradient-dev-${idx})" stroke-width="2" fill="none"/>
                      </svg>
                      
                      <!-- Icon text -->
                      <div class="integration-icon-text">
                        ${item}
                      </div>
                      
                      <!-- Tooltip that appears on hover -->
                      <div class="icon-tooltip" style="bottom: 100%; left: 50%; transform: translateX(-50%);">
                        ${['GitHub', 'GitLab', 'Jira'][idx]}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
              
              <div class="divider"></div>
              
              <div class="integration-category">
                <div class="integration-label">LLMs:</div>
                <div class="integration-icons">
                  ${['G4', 'C', 'GM', 'L3'].map((item, idx) => `
                    <div
                      class="integration-icon"
                      title="${['GPT-4', 'Claude', 'Gemini', 'Llama'][idx]}"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <defs>
                          <linearGradient id="integrationGradient-llm-${idx}" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stop-color="#006850" stop-opacity="1" />
                            <stop offset="50%" stop-color="#00997a" stop-opacity="0.8" />
                            <stop offset="100%" stop-color="#00cca3" stop-opacity="0.6" />
                          </linearGradient>
                        </defs>
                        <circle cx="12" cy="12" r="10" stroke="url(#integrationGradient-llm-${idx})" stroke-width="2" fill="none"/>
                      </svg>
                      
                      <!-- Icon text -->
                      <div class="integration-icon-text">
                        ${item}
                      </div>
                      
                      <!-- Tooltip that appears on hover -->
                      <div class="icon-tooltip" style="bottom: 100%; left: 50%; transform: translateX(-50%);">
                        ${['GPT-4', 'Claude', 'Gemini', 'Llama'][idx]}
                      </div>
                    </div>
                  `).join('')}
                </div>
              </div>
            </div>
            
            <!-- Integration Library Button -->
            <button 
              class="integration-button"
              id="integrationsButton"
            >
              <span>Integration</span>
              <span>Gateway</span>
            </button>
          </div>
        </div>
      </div>
    `;

    // Initialize Lucide icons
    if (window.lucide) {
      lucide.createIcons();
    }

    // Add event listeners
    setupEventListeners();
  }

  // Render the integrations page
  function renderIntegrationsPage() {
    // All available integrations categorized
    const integrations = {
      productivity: [
        { id: 'zapier', name: 'Zapier', icon: 'Z', description: 'Connect with 5,000+ apps', connected: true },
        { id: 'slack', name: 'Slack', icon: 'S', description: 'Real-time messaging & notifications', connected: true },
        { id: 'teams', name: 'Microsoft Teams', icon: 'T', description: 'Collaboration & meetings', connected: false },
        { id: 'asana', name: 'Asana', icon: 'A', description: 'Project & task management', connected: false },
        { id: 'monday', name: 'Monday.com', icon: 'M', description: 'Work management platform', connected: false },
        { id: 'trello', name: 'Trello', icon: 'T', description: 'Visual task boards', connected: false },
      ],
      developer: [
        { id: 'github', name: 'GitHub', icon: 'G', description: 'Code hosting & version control', connected: true },
        { id: 'gitlab', name: 'GitLab', icon: 'GL', description: 'DevOps platform', connected: true },
        { id: 'jira', name: 'Jira', icon: 'J', description: 'Issue & project tracking', connected: false },
        { id: 'bitbucket', name: 'Bitbucket', icon: 'B', description: 'Git repository management', connected: false },
        { id: 'vscode', name: 'VS Code', icon: '<>', description: 'Code editor integration', connected: false },
        { id: 'jenkins', name: 'Jenkins', icon: 'JK', description: 'Automation server', connected: false }
      ],
      crm: [
        { id: 'salesforce', name: 'Salesforce', icon: 'SF', description: 'CRM & customer platform', connected: true },
        { id: 'hubspot', name: 'HubSpot', icon: 'H', description: 'Marketing, sales & service', connected: false },
        { id: 'zendesk', name: 'Zendesk', icon: 'Z', description: 'Customer service platform', connected: true },
        { id: 'dynamics', name: 'Dynamics 365', icon: 'D', description: 'Business applications', connected: false }
      ],
      llm: [
        { id: 'gpt4', name: 'GPT-4', icon: 'G4', description: 'OpenAI language model', connected: true },
        { id: 'claude', name: 'Claude', icon: 'C', description: 'Anthropic language model', connected: true },
        { id: 'gemini', name: 'Gemini', icon: 'GM', description: 'Google language model', connected: false },
        { id: 'llama', name: 'Llama 3', icon: 'L3', description: 'Meta language model', connected: false },
        { id: 'mistral', name: 'Mistral', icon: 'M', description: 'Mistral language model', connected: false }
      ],
      data: [
        { id: 'sheets', name: 'Google Sheets', icon: 'GS', description: 'Spreadsheets & data', connected: false },
        { id: 'excel', name: 'Excel', icon: 'XL', description: 'Microsoft spreadsheets', connected: true },
        { id: 'tableau', name: 'Tableau', icon: 'TB', description: 'Data visualization', connected: false },
        { id: 'power-bi', name: 'Power BI', icon: 'PB', description: 'Business analytics', connected: false }
      ],
      cloud: [
        { id: 'aws', name: 'AWS', icon: 'AWS', description: 'Amazon cloud computing', connected: true },
        { id: 'gcp', name: 'Google Cloud', icon: 'GCP', description: 'Google cloud computing', connected: false },
        { id: 'azure', name: 'Azure', icon: 'AZ', description: 'Microsoft cloud computing', connected: false }
      ]
    };

    // Determine which integrations to show based on selected category
    const allIntegrations = Object.values(integrations).flat();
    const filteredIntegrations = integrationCategory === 'all' 
      ? allIntegrations 
      : integrations[integrationCategory] || [];

    root.innerHTML = `
      <div class="flex flex-col h-screen bg-gray-50" style="font-family: 'Montserrat, sans-serif';">
        <!-- Header -->
        <div class="integrations-header">
          <div class="flex items-center">
            <button 
              id="back-button"
              class="mr-4 p-2 hover:bg-gray-800 rounded-full"
            >
              ←
            </button>
            <div class="font-bold text-xl" style="color: ${themeColors.primary}">Integration Gateway</div>
          </div>
          <div class="text-right">
            <div class="font-bold text-lg">ASOOS.2100.COOL</div>
            <div class="text-sm" style="color: ${themeColors.primary}">Intelligent Success Companion</div>
          </div>
        </div>
        
        <!-- Integration Content -->
        <div class="integrations-content">
          <!-- Category Tabs -->
          <div class="category-tabs">
            ${[
              { id: 'all', name: 'All Integrations' },
              { id: 'productivity', name: 'Productivity' },
              { id: 'developer', name: 'Developer' },
              { id: 'crm', name: 'CRM & Support' },
              { id: 'llm', name: 'Language Models' },
              { id: 'data', name: 'Data & Analytics' },
              { id: 'cloud', name: 'Cloud Services' },
            ].map((category) => `
              <button
                class="category-tab ${integrationCategory === category.id ? 'active' : ''}"
                data-category="${category.id}"
                style="${integrationCategory === category.id ? `background-color: ${themeColors.primary};` : ''}"
              >
                ${category.name}
              </button>
            `).join('')}
          </div>
          
          <!-- Search Bar -->
          <div class="search-bar">
            <input 
              type="text" 
              placeholder="Search integrations..." 
              class="search-input"
            />
            <div class="search-icon">
              <i data-lucide="search"></i>
            </div>
          </div>
          
          <!-- Integrations Grid -->
          <div class="integrations-grid">
            ${filteredIntegrations.map((integration) => `
              <div class="integration-card">
                <div class="integration-card-header">
                  <div 
                    class="integration-logo ${integration.connected ? 'connected' : 'disconnected'}"
                    style="${integration.connected ? `background-color: ${themeColors.primary};` : ''}"
                  >
                    ${integration.icon}
                  </div>
                  <div class="integration-info">
                    <div class="integration-name">${integration.name}</div>
                    <div class="integration-description">${integration.description}</div>
                  </div>
                </div>
                <div class="integration-card-footer">
                  <span class="integration-status ${integration.connected ? 'connected' : ''}">
                    ${integration.connected ? 'Connected' : 'Not connected'}
                  </span>
                  <button 
                    class="integration-action ${integration.connected ? 'disconnect' : 'connect'}"
                    style="${!integration.connected ? `background-color: ${themeColors.primary};` : ''}"
                  >
                    ${integration.connected ? 'Disconnect' : 'Connect'}
                  </button>
                </div>
              </div>
            `).join('')}
            
            <!-- Add New Integration Tile -->
            <div class="add-integration-card">
              <div class="add-integration-content">
                <div 
                  class="add-integration-icon"
                  style="background-color: ${themeColors.primary}20;"
                >
                  <i data-lucide="plus"></i>
                </div>
                <div class="add-integration-text" style="color: ${themeColors.primary};">Add New Integration</div>
                <div class="add-integration-subtext">Browse integration marketplace</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Initialize Lucide icons
    if (window.lucide) {
      lucide.createIcons();
    }

    // Add event listeners
    document.getElementById('back-button').addEventListener('click', () => {
      showIntegrations = false;
      renderInterface();
    });

    document.querySelectorAll('.category-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        integrationCategory = tab.dataset.category;
        renderInterface();
      });
    });
  }

  // Render the settings page
  function renderSettingsPage() {
    // Translations dictionary - using only English for simplicity
    const getText = (key) => {
      return {
        // Header and Navigation
        headerTitle: 'Vision Lake',
        saveAndClose: 'Save & Close',
        
        // Life at Vision Lake
        lifeAtVisionLake: '🌅 Life at Vision Lake',
        welcomeOs: 'Welcome to the OS of Intelligent Leadership',
        visionLakeIntro: "Vision Lake is more than a workspace — it's a living executive ecosystem where every insight, interaction, and initiative is orchestrated to help you lead with precision, speed, and clarity.",
        
        // What Our Capabilities Mean
        whatCapabilitiesMean: '🔓 What Our Solutions Capabilities Mean for You',
        capabilitiesIntro1: "You don't need to learn our systems — they've been designed to learn you.",
        capabilitiesIntro2: "Every capability within ASOOS exists to remove friction, unlock precision, and empower your leadership. From the moment you enter Vision Lake, you're surrounded by a living framework that knows when to organize, when to advise, and when to act — on your behalf.",
        capabilitiesIntro3: "These aren't tools. They're trusted collaborators, purpose-built for your elevation.",
        
        // How We Operate
        howWeOperate: '🧬 Understanding How We Operate For You',
        meetTheMinds: 'Meet the minds behind your mission.',
        
        // Expert Profiles
        drLucyTitle: 'Dr. Lucy',
        drLucyDesc: "Sees your strategic rhythm. Her Flight Memory system tracks every decision, transforming scattered moments into a coherent trajectory. She's your continuity.",
        drLucyQuote: '"While you're planning tomorrow, I'm preserving what made today succeed."',
        
        drGrantTitle: 'Dr. Grant',
        drGrantDesc: 'Builds your secure perimeter. His cyber-authentication systems ensure that only the right hands touch the right data, with zero compromise.',
        drGrantQuote: '"I protect the gates, so you can focus on the game."',
        
        drSabinaTitle: 'Dr. Sabina',
        drSabinaDesc: 'Understands client psychology and sales cadence before they appear in your CRM. Her Dream Commander predicts what moves will matter most.',
        drSabinaQuote: '"You dream forward — I'll translate it into momentum."',
        
        drClaudeTitle: 'Dr. Claude',
        drClaudeDesc: 'Is your unseen COO. He maps your agents to their highest-value tasks, ensuring nothing slips and no one stalls.',
        drClaudeQuote: '"The right work, in the right hands, at the right time — every time."',
        
        drBurbyTitle: 'Dr. Burby',
        drBurbyDesc: 'Makes every choice future-proof. His blockchain and compliance logic means your initiatives can scale without regret.',
        drBurbyQuote: '"Governance is not a gate. It's a guarantee."',
        
        profLeeTitle: 'Professor Lee',
        profLeeDesc: 'Is your lens into the chaos. With the Q4D framework, he helps your intelligence teams decode complex inputs into crisp next actions.',
        profLeeQuote: '"Information overload ends here."',
        
        drMatchTitle: 'Dr. Match',
        drMatchDesc: 'Sharpens your influence. From proposals to brand posture, he helps you speak in the language that converts.',
        drMatchQuote: '"Let's make your vision irresistible."',
        
        // Agents of Success
        agentsOfSuccess1: '🧠 These are not just profiles. These are agents of your success.',
        agentsOfSuccess2: "In the world of ASOOS, you're never managing complexity alone. You're commanding an intelligent, always-on executive symphony.",
        
        // Your Role
        yourRole: '🧭 Your Role in This System',
        roleCommand: 'You command the agents.',
        roleTrain: 'You train the intelligence.',
        roleShape: 'You shape the future.',
        roleDesc1: 'Direct your AI executive team with clear, strategic vision.',
        roleDesc2: 'Your feedback sharpens our precision and relevance.',
        roleDesc3: 'ASOOS evolves with your vision of leadership.',
        
        // Settings Sections
        accountProfile: 'Account & Profile',
        subscriptionBilling: 'Subscription & Billing',
        languageRegion: 'Language & Region',
        appearance: 'Appearance',
        voiceAudio: 'Voice & Audio',
        aboutAsoos: 'About ASOOS',
      }[key] || key;
    };

    root.innerHTML = `
      <div class="flex flex-col h-screen bg-gray-50" style="font-family: 'Montserrat, sans-serif';">
        <!-- Header -->
        <div class="integrations-header">
          <div class="settings-header">
            <button 
              id="back-button"
              class="back-button"
            >
              ←
            </button>
            <div class="font-bold text-xl" style="color: ${themeColors.primary};">${getText('headerTitle')}</div>
          </div>
          <div class="text-right">
            <div class="font-bold text-lg">ASOOS.2100.COOL</div>
            <div class="text-sm" style="color: ${themeColors.primary};">Intelligent Success Companion</div>
          </div>
        </div>
        
        <!-- Settings Content - Two-column layout -->
        <div class="settings-content">
          <!-- Life at Vision Lake - Human-centered section -->
          <div class="human-section">
            <div class="human-section-header">
              <h2 class="text-2xl font-bold">${getText('lifeAtVisionLake')}</h2>
              <p class="text-gray-300 mt-1">${getText('welcomeOs')}</p>
            </div>
            
            <div class="human-section-content">
              <p class="mb-4">
                ${getText('visionLakeIntro')}
              </p>
              
              <h3 class="text-lg font-bold mb-4" style="color: ${themeColors.primary};">
                ${getText('whatCapabilitiesMean')}
              </h3>
              
              <div style="background-color: #f9fafb; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1.5rem;">
                <p class="mb-2">
                  ${getText('capabilitiesIntro1')}
                </p>
                <p class="mb-2">
                  ${getText('capabilitiesIntro2')}
                </p>
                <p>
                  ${getText('capabilitiesIntro3')}
                </p>
              </div>
              
              <h3 class="text-lg font-bold mb-4" style="color: ${themeColors.primary};">
                ${getText('howWeOperate')}
              </h3>
              
              <p class="mb-4">${getText('meetTheMinds')}</p>
              
              <div style="display: flex; flex-direction: column; gap: 1.25rem;">
                <div style="border-left: 4px solid #3b82f6; padding-left: 1rem; padding-top: 0.25rem; padding-bottom: 0.25rem;">
                  <div style="font-weight: 500;">${getText('drLucyTitle')}</div>
                  <p style="font-size: 0.875rem; color: #4b5563;">${getText('drLucyDesc')}</p>
                  <p style="font-size: 0.875rem; font-style: italic; margin-top: 0.25rem;">${getText('drLucyQuote')}</p>
                </div>
                
                <div style="border-left: 4px solid #10b981; padding-left: 1rem; padding-top: 0.25rem; padding-bottom: 0.25rem;">
                  <div style="font-weight: 500;">${getText('drGrantTitle')}</div>
                  <p style="font-size: 0.875rem; color: #4b5563;">${getText('drGrantDesc')}</p>
                  <p style="font-size: 0.875rem; font-style: italic; margin-top: 0.25rem;">${getText('drGrantQuote')}</p>
                </div>
                
                <div style="border-left: 4px solid #8b5cf6; padding-left: 1rem; padding-top: 0.25rem; padding-bottom: 0.25rem;">
                  <div style="font-weight: 500;">${getText('drSabinaTitle')}</div>
                  <p style="font-size: 0.875rem; color: #4b5563;">${getText('drSabinaDesc')}</p>
                  <p style="font-size: 0.875rem; font-style: italic; margin-top: 0.25rem;">${getText('drSabinaQuote')}</p>
                </div>
                
                <div style="border-left: 4px solid #f59e0b; padding-left: 1rem; padding-top: 0.25rem; padding-bottom: 0.25rem;">
                  <div style="font-weight: 500;">${getText('drClaudeTitle')}</div>
                  <p style="font-size: 0.875rem; color: #4b5563;">${getText('drClaudeDesc')}</p>
                  <p style="font-size: 0.875rem; font-style: italic; margin-top: 0.25rem;">${getText('drClaudeQuote')}</p>
                </div>
                
                <div style="border-left: 4px solid #ef4444; padding-left: 1rem; padding-top: 0.25rem; padding-bottom: 0.25rem;">
                  <div style="font-weight: 500;">${getText('drBurbyTitle')}</div>
                  <p style="font-size: 0.875rem; color: #4b5563;">${getText('drBurbyDesc')}</p>
                  <p style="font-size: 0.875rem; font-style: italic; margin-top: 0.25rem;">${getText('drBurbyQuote')}</p>
                </div>
                
                <div style="border-left: 4px solid #14b8a6; padding-left: 1rem; padding-top: 0.25rem; padding-bottom: 0.25rem;">
                  <div style="font-weight: 500;">${getText('profLeeTitle')}</div>
                  <p style="font-size: 0.875rem; color: #4b5563;">${getText('profLeeDesc')}</p>
                  <p style="font-size: 0.875rem; font-style: italic; margin-top: 0.25rem;">${getText('profLeeQuote')}</p>
                </div>
                
                <div style="border-left: 4px solid #6366f1; padding-left: 1rem; padding-top: 0.25rem; padding-bottom: 0.25rem;">
                  <div style="font-weight: 500;">${getText('drMatchTitle')}</div>
                  <p style="font-size: 0.875rem; color: #4b5563;">${getText('drMatchDesc')}</p>
                  <p style="font-size: 0.875rem; font-style: italic; margin-top: 0.25rem;">${getText('drMatchQuote')}</p>
                </div>
              </div>
              
              <div style="margin-top: 1.5rem; background-color: #f9fafb; padding: 1rem; border-radius: 0.5rem; text-align: center;">
                <p style="font-weight: 500;">${getText('agentsOfSuccess1')}</p>
                <p style="font-size: 0.875rem; margin-top: 0.5rem;">${getText('agentsOfSuccess2')}</p>
              </div>
            </div>
            
            <div class="human-section-content">
              <h3 class="text-lg font-bold mb-4" style="color: ${themeColors.primary};">${getText('yourRole')}</h3>
              
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; text-align: center;">
                <div style="padding: 1rem; background-color: #f9fafb; border-radius: 0.5rem;">
                  <div style="font-weight: 500; margin-bottom: 0.5rem;">${getText('roleCommand')}</div>
                  <p style="font-size: 0.875rem;">${getText('roleDesc1')}</p>
                </div>
                
                <div style="padding: 1rem; background-color: #f9fafb; border-radius: 0.5rem;">
                  <div style="font-weight: 500; margin-bottom: 0.5rem;">${getText('roleTrain')}</div>
                  <p style="font-size: 0.875rem;">${getText('roleDesc2')}</p>
                </div>
                
                <div style="padding: 1rem; background-color: #f9fafb; border-radius: 0.5rem;">
                  <div style="font-weight: 500; margin-bottom: 0.5rem;">${getText('roleShape')}</div>
                  <p style="font-size: 0.875rem;">${getText('roleDesc3')}</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Settings sections here -->
          <div class="human-section">
            <div class="settings-section">
              <details>
                <summary class="settings-summary">
                  <h3 class="text-lg font-bold inline-block" style="color: ${themeColors.primary};">${getText('languageRegion')}</h3>
                </summary>
                <div class="settings-details">
                  <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem;">
                    <div>
                      <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #4b5563; margin-bottom: 0.5rem;">
                        Language (Google TTS/STT)
                      </label>
                      <select 
                        class="language-select"
                        id="language-select"
                      >
                        <option value="en-US" ${currentLanguage === 'en-US' ? 'selected' : ''}>English (United States)</option>
                        <option value="en-GB" ${currentLanguage === 'en-GB' ? 'selected' : ''}>English (United Kingdom)</option>
                        <option value="es-ES" ${currentLanguage === 'es-ES' ? 'selected' : ''}>Spanish (Spain)</option>
                        <option value="es-MX" ${currentLanguage === 'es-MX' ? 'selected' : ''}>Spanish (Mexico)</option>
                        <option value="fr-FR" ${currentLanguage === 'fr-FR' ? 'selected' : ''}>French (France)</option>
                        <option value="fr-CA" ${currentLanguage === 'fr-CA' ? 'selected' : ''}>French (Canada)</option>
                        <option value="de-DE" ${currentLanguage === 'de-DE' ? 'selected' : ''}>German</option>
                        <option value="it-IT" ${currentLanguage === 'it-IT' ? 'selected' : ''}>Italian</option>
                        <option value="pt-BR" ${currentLanguage === 'pt-BR' ? 'selected' : ''}>Portuguese (Brazil)</option>
                        <option value="zh-CN" ${currentLanguage === 'zh-CN' ? 'selected' : ''}>Chinese (Simplified)</option>
                        <option value="zh-TW" ${currentLanguage === 'zh-TW' ? 'selected' : ''}>Chinese (Traditional)</option>
                        <option value="ja-JP" ${currentLanguage === 'ja-JP' ? 'selected' : ''}>Japanese</option>
                        <option value="ko-KR" ${currentLanguage === 'ko-KR' ? 'selected' : ''}>Korean</option>
                        <option value="hi-IN" ${currentLanguage === 'hi-IN' ? 'selected' : ''}>Hindi</option>
                      </select>
                      <p style="margin-top: 0.25rem; font-size: 0.75rem; color: #6b7280;">
                        This setting affects voice recognition, text-to-speech, and interface language.
                      </p>
                    </div>
                    
                    <div>
                      <label style="display: block; font-size: 0.875rem; font-weight: 500; color: #4b5563; margin-bottom: 0.5rem;">
                        Time Zone
                      </label>
                      <select class="language-select">
                        <option>America/Mexico_City (UTC-06:00)</option>
                        <option>America/Los_Angeles (UTC-08:00)</option>
                        <option>America/New_York (UTC-05:00)</option>
                        <option>Europe/London (UTC+00:00)</option>
                        <option>Europe/Paris (UTC+01:00)</option>
                        <option>Asia/Tokyo (UTC+09:00)</option>
                      </select>
                      <p style="margin-top: 0.25rem; font-size: 0.75rem; color: #6b7280;">
                        Used for scheduling, calendar events, and time-based features.
                      </p>
                    </div>
                  </div>
                  
                  <div style="margin-top: 1rem; display: flex; align-items: center;">
                    <input type="checkbox" id="autoDetect" style="margin-right: 0.5rem;" checked />
                    <label for="autoDetect" style="font-size: 0.875rem; color: #4b5563;">Auto-detect language when possible</label>
                  </div>
                </div>
              </details>
            </div>
            
            <div class="settings-section">
              <details>
                <summary class="settings-summary">
                  <h3 class="text-lg font-bold inline-block" style="color: ${themeColors.primary};">${getText('appearance')}</h3>
                </summary>
                <div class="settings-details">
                  <div class="theme-grid">
                    ${['default', 'professional', 'modern'].map((themeName) => `
                      <div 
                        class="theme-card ${currentTheme === themeName ? 'active' : ''}"
                        data-theme="${themeName}"
                        style="${currentTheme === themeName ? `border-color: ${themeColors.primary}; background-color: ${themeColors.primary}10;` : ''}"
                      >
                        <div class="theme-preview">
                          <!-- Theme preview -->
                          <div style="position: absolute; inset: 0;">
                            <div 
                              style="height: 1.5rem; width: 100%; background-color: ${themeName === 'default' ? '#000000' : themeName === 'professional' ? '#1a365d' : '#4c1d95'};"
                            ></div>
                            <div style="display: flex; height: 3.5rem;">
                              <div 
                                style="width: 1.5rem; background-color: ${themeName === 'default' ? '#000000' : themeName === 'professional' ? '#1a365d' : '#4c1d95'};"
                              ></div>
                              <div 
                                style="flex: 1; background-color: #ffffff;"
                              ></div>
                              <div 
                                style="width: 3rem; background-color: ${themeName === 'default' ? '#f4f4f4' : themeName === 'professional' ? '#f8fafc' : '#f5f3ff'};"
                              ></div>
                            </div>
                          </div>
                        </div>
                        <div 
                          class="theme-color" 
                          style="background-color: ${themeName === 'default' ? themeColors.primary : 
                                    themeName === 'professional' ? '#2c5282' : '#6d28d9'};"
                        ></div>
                        <span style="font-size: 0.875rem; font-weight: 500;">${themeName.charAt(0).toUpperCase() + themeName.slice(1)}</span>
                      </div>
                    `).join('')}
                  </div>
                  
                  <div style="border-top: 1px solid #f3f4f6; padding-top: 1rem;">
                    <div style="font-size: 0.875rem; color: #6b7280;">
                      Theme changes are applied immediately and will be saved for your next session.
                    </div>
                  </div>
                </div>
              </details>
            </div>
            
            <div class="settings-section">
              <details>
                <summary class="settings-summary">
                  <h3 class="text-lg font-bold inline-block" style="color: ${themeColors.primary};">${getText('voiceAudio')}</h3>
                </summary>
                <div class="settings-details">
                  <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0; margin-bottom: 1rem;">
                    <span style="font-size: 0.875rem; font-weight: 500; color: #4b5563;">Enable voice responses</span>
                    <label class="switch">
                      <input 
                        type="checkbox" 
                        class="switch-input" 
                        id="voice-toggle"
                        ${audioEnabled ? 'checked' : ''}
                      />
                      <span class="switch-slider" style="--peer-checked: ${themeColors.primary};"></span>
                    </label>
                  </div>
                  
                  <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0;">
                    <span style="font-size: 0.875rem; font-weight: 500; color: #4b5563;">Voice activation on startup</span>
                    <label class="switch">
                      <input type="checkbox" class="switch-input" />
                      <span class="switch-slider" style="--peer-checked: ${themeColors.primary};"></span>
                    </label>
                  </div>
                  
                  <div style="display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0;">
                    <span style="font-size: 0.875rem; font-weight: 500; color: #4b5563;">Voice feedback sounds</span>
                    <label class="switch">
                      <input type="checkbox" class="switch-input" checked />
                      <span class="switch-slider" style="--peer-checked: ${themeColors.primary};"></span>
                    </label>
                  </div>
                </div>
              </details>
            </div>
            
            <div class="settings-section">
              <details>
                <summary class="settings-summary">
                  <h3 class="text-lg font-bold inline-block" style="color: ${themeColors.primary};">${getText('aboutAsoos')}</h3>
                </summary>
                <div class="settings-details">
                  <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                    <div style="display: flex; justify-content: space-between;">
                      <div style="font-size: 0.875rem; font-weight: 500; color: #4b5563;">Version</div>
                      <div style="font-size: 0.875rem;">ASOOS.2100.Cool (Build 2025.05.08)</div>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between;">
                      <div style="font-size: 0.875rem; font-weight: 500; color: #4b5563;">Copilot Version</div>
                      <div style="font-size: 0.875rem;">QB Lucy 2.7.3</div>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between;">
                      <div style="font-size: 0.875rem; font-weight: 500; color: #4b5563;">License</div>
                      <div style="font-size: 0.875rem;">Enterprise (12 seats)</div>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between;">
                      <div style="font-size: 0.875rem; font-weight: 500; color: #4b5563;">Support</div>
                      <div style="font-size: 0.875rem;">Premium 24/7</div>
                    </div>
                    
                    <div style="display: flex; justify-content: space-between;">
                      <div style="font-size: 0.875rem; font-weight: 500; color: #4b5563;">Last Updated</div>
                      <div style="font-size: 0.875rem;">Thursday, May 08, 2025 at 09:42 AM</div>
                    </div>
                  </div>
                  
                  <div style="margin-top: 1.5rem; display: flex; justify-content: space-between;">
                    <button style="font-size: 0.875rem; padding: 0.25rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.25rem;">Release Notes</button>
                    <button style="font-size: 0.875rem; padding: 0.25rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.25rem;">Support Portal</button>
                    <button style="font-size: 0.875rem; padding: 0.25rem 0.75rem; border: 1px solid #d1d5db; border-radius: 0.25rem;">Documentation</button>
                  </div>
                </div>
              </details>
            </div>
          </div>
          
          <!-- Save Button -->
          <button 
            id="save-settings"
            class="save-button"
            style="background-color: ${themeColors.primary};"
          >
            ${getText('saveAndClose')}
          </button>
        </div>
      </div>
    `;

    // Initialize Lucide icons
    if (window.lucide) {
      lucide.createIcons();
    }

    // Add event listeners
    document.getElementById('back-button').addEventListener('click', () => {
      showSettings = false;
      renderInterface();
    });

    document.getElementById('save-settings').addEventListener('click', () => {
      showSettings = false;
      renderInterface();
    });

    document.getElementById('language-select').addEventListener('change', (e) => {
      currentLanguage = e.target.value;
    });

    document.getElementById('voice-toggle').addEventListener('change', (e) => {
      audioEnabled = e.target.checked;
    });

    document.querySelectorAll('.theme-card').forEach(card => {
      card.addEventListener('click', () => {
        currentTheme = card.dataset.theme;
        renderInterface();
      });
    });
  }

  // Set up event listeners for the interface
  function setupEventListeners() {
    // Sidebar icon click
    document.querySelectorAll('.sidebar-icon').forEach(icon => {
      icon.addEventListener('click', () => {
        const id = parseInt(icon.dataset.id);
        if (id === 7) {
          academyMode = !academyMode;
        } else {
          selectedIcon = id;
        }
        renderInterface();
      });
    });

    // Panel expansion
    document.querySelectorAll('.panel-card-header').forEach(header => {
      header.addEventListener('click', () => {
        const panel = header.dataset.panel;
        expandedPanel = expandedPanel === panel ? null : panel;
        renderInterface();
      });
    });

    // Chat input
    const inputElement = document.getElementById('chatInput');
    if (inputElement) {
      inputElement.addEventListener('input', (e) => {
        chatInput = e.target.value;
        const sendButton = document.getElementById('sendButton');
        if (sendButton) {
          sendButton.disabled = !chatInput.trim() && !isListening;
          sendButton.style.backgroundColor = !chatInput.trim() && !isListening ? '#d1d5db' : themeColors.primary;
        }
      });

      inputElement.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          handleSendMessage();
        }
      });
    }

    // Send button
    const sendButton = document.getElementById('sendButton');
    if (sendButton) {
      sendButton.addEventListener('click', handleSendMessage);
    }

    // Mic button
    const micButton = document.querySelector('.mic-button');
    if (micButton) {
      micButton.addEventListener('click', toggleListening);
    }

    // Audio toggle
    const audioToggle = document.querySelector('.audio-toggle');
    if (audioToggle) {
      audioToggle.addEventListener('click', () => {
        audioEnabled = !audioEnabled;
        renderInterface();
      });
    }

    // Settings button
    const settingsButton = document.getElementById('settingsButton');
    if (settingsButton) {
      settingsButton.addEventListener('click', () => {
        showSettings = true;
        renderInterface();
      });
    }

    // Integrations button
    const integrationsButton = document.getElementById('integrationsButton');
    if (integrationsButton) {
      integrationsButton.addEventListener('click', () => {
        showIntegrations = true;
        renderInterface();
      });
    }
  }

  // Handle sending a message
  function handleSendMessage() {
    const inputElement = document.getElementById('chatInput');
    if (inputElement && inputElement.value.trim()) {
      const userMessage = inputElement.value;
      messages.push({ text: userMessage, sender: 'user' });
      inputElement.value = '';
      chatInput = '';
      
      setTimeout(() => {
        messages.push({ 
          text: `Response to: ${userMessage}`, 
          sender: 'ai' 
        });
        
        // Simulate speaking if enabled
        if (audioEnabled) {
          isSpeaking = true;
          setTimeout(() => {
            isSpeaking = false;
            renderInterface();
          }, 3000);
        }
        
        renderInterface();
      }, 1000);

      renderInterface();
    }
  }

  // Toggle voice input
  function toggleListening() {
    isListening = !isListening;
    if (isListening) {
      // Simulate voice recognition starting
      setTimeout(() => {
        const inputElement = document.getElementById('chatInput');
        if (inputElement) {
          inputElement.value = 'How do I integrate with Slack?';
          chatInput = 'How do I integrate with Slack?';
        }
        isListening = false;
        renderInterface();
      }, 3000);
    }
    renderInterface();
  }

  // Sidebar icons data
  const sidebarIcons = [
    { id: 1, name: 'Communication', desc: 'Automated Communication', iconName: 'message-square' },
    { id: 2, name: 'Growth', desc: 'Growth Revenues', iconName: 'target' },
    { id: 3, name: 'Services', desc: 'Client Services Innovation', iconName: 'users' },
    { id: 4, name: 'Automation', desc: 'Organizational Automation', iconName: 'code' },
    { id: 5, name: 'ROI', desc: 'ROI Dashboard', iconName: 'share-2' },
    { id: 6, name: 'Wish', desc: 'Your Wish', iconName: 'book-open' },
    { id: 7, name: 'Academy', desc: 'Learning & Training', isTriangle: true, iconName: 'user' }
  ];

  // Initialize the interface
  renderInterface();
});