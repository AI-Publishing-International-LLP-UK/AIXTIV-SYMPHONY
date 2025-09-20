// PCP selectIcon Function - Activate QB (Dr. Lucy sRIX)
// All sidebar icons activate QB as the primary PCP model

function selectIcon(element, category, id) {
  console.log(`🤖 Activating QB PCP for ${category}`);
  
  // Remove active class from all icons
  document.querySelectorAll('.sidebar-icon').forEach(icon => {
    icon.classList.remove('active');
  });
  
  // Add active class to selected icon
  element.classList.add('active');
  
  // Activate QB PCP (Dr. Lucy sRIX with OpenAI Dana Voice)
  activateQBPCP(category, id);
  
  // Update UI to show QB is active
  updatePCPDisplay('QB', category);
  
  // Show notification
  showNotification(`QB PCP activated for ${category}`, 'success');
}

function activateQBPCP(category, id) {
  // Activate QB (Dr. Lucy sRIX)
  const pcpData = {
    name: 'QB',
    fullName: 'Dr. Lucy sRIX',
    voice: 'OpenAI Dana Voice',
    category: category,
    id: id,
    status: 'active'
  };
  
  // Load S2DO data from Dream Commander
  loadS2DOData(pcpData);
  
  // Load hot tips from feedback loop
  loadHotTips(pcpData);
  
  // Load performance rankings
  loadPerformanceRankings(pcpData);
  
  // Update the PCP interface
  displayPCPInterface(pcpData);
}

function loadS2DOData(pcpData) {
  console.log('📋 Loading S2DO (Scan-To-Do) data from Dream Commander...');
  
  // Simulated S2DO prompts - In production, these come from Dream Commander
  const s2doPrompts = [
    'Complete quarterly KPI review and identify top 3 improvement areas',
    'Schedule 1-on-1 meetings with direct reports for career development',
    'Review and optimize main business process workflow',
    'Analyze customer feedback trends and create action plan', 
    'Update team training materials for new procedures'
  ];
  
  // Display S2DO prompts in the interface
  const s2doContainer = document.getElementById('s2do-container') || createS2DOContainer();
  s2doContainer.innerHTML = `
    <h3>📋 Today's S2DO from Dream Commander</h3>
    <div class="s2do-list">
      ${s2doPrompts.map((prompt, index) => `
        <div class="s2do-item">
          <span class="s2do-number">${index + 1}</span>
          <span class="s2do-text">${prompt}</span>
          <button class="s2do-complete" onclick="markS2DOComplete(${index})">✓</button>
        </div>
      `).join('')}
    </div>
  `;
}

function loadHotTips(pcpData) {
  console.log('🔥 Loading hot tips from PCP feedback loop...');
  
  // Simulated hot tips - In production, these come from Dream Commander feedback loop
  const hotTips = [
    'Focus on automation to increase efficiency by 30%',
    'Team communication improved 15% with daily standup meetings',
    'Customer satisfaction scores highest when response time < 2 hours',
    'Project completion rate increases with smaller, daily milestones',
    'Performance reviews show 25% improvement with weekly check-ins'
  ];
  
  const hotTipsContainer = document.getElementById('hot-tips-container') || createHotTipsContainer();
  hotTipsContainer.innerHTML = `
    <h3>🔥 Hot Tips from PCP Network</h3>
    <div class="hot-tips-list">
      ${hotTips.map(tip => `
        <div class="hot-tip-item">
          <span class="tip-icon">💡</span>
          <span class="tip-text">${tip}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function loadPerformanceRankings(pcpData) {
  console.log('📊 Loading performance rankings from Dream Commander...');
  
  // Simulated performance data - In production, this comes from Dream Commander analysis
  const performanceData = {
    score: 87,
    rank: 'Top 15%',
    trend: '↗ Improving',
    kpiStatus: 'Meeting 4/5 targets',
    feedback: 'Strong performance in project delivery. Focus on team communication for improvement.'
  };
  
  const performanceContainer = document.getElementById('performance-container') || createPerformanceContainer();
  performanceContainer.innerHTML = `
    <h3>📊 Performance Rankings</h3>
    <div class="performance-data">
      <div class="performance-score">
        <span class="score-value">${performanceData.score}</span>
        <span class="score-label">Overall Score</span>
      </div>
      <div class="performance-details">
        <div class="perf-item">
          <strong>Rank:</strong> ${performanceData.rank}
        </div>
        <div class="perf-item">
          <strong>Trend:</strong> ${performanceData.trend}
        </div>
        <div class="perf-item">
          <strong>KPIs:</strong> ${performanceData.kpiStatus}
        </div>
        <div class="perf-feedback">
          <strong>Feedback:</strong> ${performanceData.feedback}
        </div>
      </div>
    </div>
  `;
}

function displayPCPInterface(pcpData) {
  console.log(`🎭 Displaying ${pcpData.name} PCP interface`);
  
  // Update the main PCP display area
  const pcpDisplay = document.getElementById('pcp-main-display') || createPCPDisplay();
  pcpDisplay.innerHTML = `
    <div class="pcp-header">
      <h2>🤖 ${pcpData.fullName} (${pcpData.name})</h2>
      <p class="pcp-voice">Voice: ${pcpData.voice}</p>
      <p class="pcp-status">Status: <span class="status-active">${pcpData.status}</span></p>
      <p class="pcp-category">Active for: ${pcpData.category}</p>
    </div>
    <div class="pcp-content">
      <div id="s2do-container"></div>
      <div id="hot-tips-container"></div>
      <div id="performance-container"></div>
    </div>
    <div class="pcp-interaction">
      <textarea id="pcp-input" placeholder="Ask ${pcpData.name} anything about your ${pcpData.category} goals..."></textarea>
      <button onclick="sendPCPMessage()" class="pcp-send-btn">Send to ${pcpData.name}</button>
    </div>
  `;
  
  // Load all PCP data sections
  loadS2DOData(pcpData);
  loadHotTips(pcpData);
  loadPerformanceRankings(pcpData);
}

// Helper functions to create containers if they don't exist
function createS2DOContainer() {
  const container = document.createElement('div');
  container.id = 's2do-container';
  container.className = 's2do-container';
  return container;
}

function createHotTipsContainer() {
  const container = document.createElement('div');
  container.id = 'hot-tips-container';
  container.className = 'hot-tips-container';
  return container;
}

function createPerformanceContainer() {
  const container = document.createElement('div');
  container.id = 'performance-container'; 
  container.className = 'performance-container';
  return container;
}

function createPCPDisplay() {
  const display = document.createElement('div');
  display.id = 'pcp-main-display';
  display.className = 'pcp-main-display';
  // Insert into the main content area
  const mainContent = document.querySelector('.main-content') || document.body;
  mainContent.appendChild(display);
  return display;
}

// S2DO interaction functions
function markS2DOComplete(index) {
  console.log(`✅ Marking S2DO ${index + 1} as complete`);
  const s2doItem = document.querySelectorAll('.s2do-item')[index];
  if (s2doItem) {
    s2doItem.classList.add('completed');
    s2doItem.querySelector('.s2do-complete').textContent = '✅';
    s2doItem.querySelector('.s2do-complete').disabled = true;
  }
  showNotification(`S2DO ${index + 1} marked complete!`, 'success');
}

function sendPCPMessage() {
  const input = document.getElementById('pcp-input');
  const message = input.value.trim();
  
  if (!message) {return;}
  
  console.log(`💬 Sending message to QB: ${message}`);
  
  // In production, this would send to Dream Commander/QB PCP API
  // For now, simulate QB response
  simulateQBResponse(message);
  
  input.value = '';
}

function simulateQBResponse(userMessage) {
  // Simulate QB (Dr. Lucy sRIX) response
  const responses = [
    'I understand your question about business optimization. Let me analyze your current KPIs and suggest improvements.',
    'Based on your performance data, I recommend focusing on the top 3 priority areas for maximum impact.',
    "Great question! I'll connect this to your daily S2DO goals and provide actionable insights.",
    'Let me review the feedback from other PCPs and provide you with relevant hot tips for this situation.',
    "Excellent! This aligns perfectly with your career development objectives. Here's my recommendation..."
  ];
  
  const randomResponse = responses[Math.floor(Math.random() * responses.length)];
  
  // Display QB response (in production, this would be with 4RZ84U1b4WCqpu57LvIq)
  showNotification(`QB (Dr. Lucy): ${randomResponse}`, 'info');
  
  // Add to chat history
  addPCPMessage('user', userMessage);
  addPCPMessage('qb', randomResponse);
}

function addPCPMessage(sender, message) {
  const chatContainer = document.getElementById('pcp-chat') || createPCPChat();
  const messageDiv = document.createElement('div');
  messageDiv.className = `pcp-message ${sender}`;
  messageDiv.innerHTML = `
    <div class="message-content">
      <strong>${sender === 'user' ? 'You' : 'QB (Dr. Lucy)'}:</strong>
      <p>${message}</p>
    </div>
    <div class="message-time">${new Date().toLocaleTimeString()}</div>
  `;
  chatContainer.appendChild(messageDiv);
  chatContainer.scrollTop = chatContainer.scrollHeight;
}

function createPCPChat() {
  const chat = document.createElement('div');
  chat.id = 'pcp-chat';
  chat.className = 'pcp-chat';
  const pcpDisplay = document.getElementById('pcp-main-display');
  if (pcpDisplay) {
    pcpDisplay.appendChild(chat);
  }
  return chat;
}

function updatePCPDisplay(pcpName, category) {
  console.log(`🔄 Updating display for ${pcpName} PCP - ${category} category`);
  // Update any status indicators or UI elements
  const statusElements = document.querySelectorAll('.pcp-status-indicator');
  statusElements.forEach(element => {
    element.textContent = `${pcpName} Active - ${category}`;
    element.className = 'pcp-status-indicator active';
  });
}

// Export for global access
window.selectIcon = selectIcon;
window.markS2DOComplete = markS2DOComplete;
window.sendPCPMessage = sendPCPMessage;

console.log('🤖 PCP System Ready - QB (Dr. Lucy sRIX) available for activation');
