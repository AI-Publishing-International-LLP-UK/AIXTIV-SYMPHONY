/**
 * Enhanced UI Components for Blockchain and AIRewards Display
 * Integration with S2DO Blockchain and Quality Points System
 * 
 * Features:
 * - Real-time blockchain status display
 * - AIRewards balance and earnings tracking
 * - Quality points visualization
 * - 6-box partition progress tracking
 * - Transaction history with confirmation statuses
 */

class BlockchainRewardsUI {
  constructor() {
    this.s2doIntegration = new S2DOBlockchainRewardsIntegration();
    this.updateInterval = null;
    this.currentUserId = null;
    this.userStats = null;
  }

  /**
   * Initialize UI components for a user
   */
  async initializeUI(userId) {
    try {
      this.currentUserId = userId;
      console.log(`🎨 Initializing Blockchain & Rewards UI for user: ${userId}`);
      
      // Fetch initial user stats
      this.userStats = await this.s2doIntegration.getUserBlockchainStats(userId);
      
      // Create UI components
      this.createBlockchainStatusSection();
      this.createAIRewardsSection();
      this.createQualityPointsSection(); 
      this.createPartitionTrackingSection();
      this.createTransactionHistorySection();
      
      // Start real-time updates
      this.startRealTimeUpdates();
      
      console.log(`✅ Blockchain & Rewards UI initialized`);
      
    } catch (error) {
      console.error(`❌ Error initializing UI:`, error);
    }
  }

  /**
   * Create blockchain status display section
   */
  createBlockchainStatusSection() {
    const blockchainSection = document.createElement('div');
    blockchainSection.className = 'panel-card blockchain-status-card';
    blockchainSection.innerHTML = `
      <button class="panel-header" onclick="togglePanel(this)">
        <div class="panel-title">
          <svg class="panel-icon" style="fill: #00d4aa;" viewBox="0 0 24 24">
            <path d="M12 2L2 7v10c0 5.55 3.84 9.95 9 11 5.16-1.05 9-5.45 9-11V7l-10-5z"/>
            <path d="M8 11l2 2 4-4"/>
          </svg>
          Blockchain Status
        </div>
        <div class="blockchain-status-indicator" id="blockchainStatusIndicator">
          <div class="status-dot connected"></div>
          <span>Connected</span>
        </div>
        <svg class="enterprise-icon chevron-icon" style="fill: rgba(255, 255, 255, 0.8);">
          <use href="#icon-chevron-down"></use>
        </svg>
      </button>
      <div class="panel-content active" id="blockchainStatusContent">
        <div class="blockchain-stats-grid">
          <div class="stat-item">
            <div class="stat-label">Total Transactions</div>
            <div class="stat-value" id="totalTransactions">${this.userStats?.blockchain_activity?.total_transactions || 0}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Confirmed</div>
            <div class="stat-value success" id="confirmedTransactions">${this.userStats?.blockchain_activity?.confirmed_transactions || 0}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Pending</div>
            <div class="stat-value warning" id="pendingTransactions">${this.userStats?.blockchain_activity?.pending_transactions || 0}</div>
          </div>
          <div class="stat-item">
            <div class="stat-label">Failed</div>
            <div class="stat-value error" id="failedTransactions">${this.userStats?.blockchain_activity?.failed_transactions || 0}</div>
          </div>
        </div>
        
        <div class="recent-transactions">
          <div class="section-title">Recent Transactions</div>
          <div class="transaction-list" id="recentTransactionsList">
            ${this.renderRecentTransactions()}
          </div>
        </div>
      </div>
    `;
    
    // Insert into the right panel
    this.insertIntoRightPanel(blockchainSection, 'blockchain-status');
  }

  /**
   * Create AIRewards balance and tracking section
   */
  createAIRewardsSection() {
    const rewardsSection = document.createElement('div');
    rewardsSection.className = 'panel-card ai-rewards-card';
    rewardsSection.innerHTML = `
      <button class="panel-header" onclick="togglePanel(this)">
        <div class="panel-title">
          <svg class="panel-icon" style="fill: #FFD700;" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
          AIRewards Balance
        </div>
        <div class="balance-display">
          <span class="balance-amount" id="aiRewardsBalance">${this.userStats?.ai_rewards?.total_balance || 0}</span>
          <span class="balance-token">AI</span>
        </div>
        <svg class="enterprise-icon chevron-icon" style="fill: rgba(255, 255, 255, 0.8);">
          <use href="#icon-chevron-down"></use>
        </svg>
      </button>
      <div class="panel-content active" id="aiRewardsContent">
        <div class="rewards-overview">
          <div class="overview-grid">
            <div class="overview-item">
              <div class="overview-label">Total Earned</div>
              <div class="overview-value" id="totalEarned">${this.userStats?.ai_rewards?.total_earned || 0}</div>
            </div>
            <div class="overview-item">
              <div class="overview-label">Total Spent</div>
              <div class="overview-value" id="totalSpent">${this.userStats?.ai_rewards?.total_spent || 0}</div>
            </div>
          </div>
        </div>
        
        <div class="earnings-breakdown">
          <div class="section-title">Recent Earnings</div>
          <div class="earnings-list" id="recentEarningsList">
            ${this.renderRecentEarnings()}
          </div>
        </div>
        
        <div class="rewards-actions">
          <button class="action-btn primary" onclick="showRewardsHistory()">
            <svg viewBox="0 0 24 24" style="width: 16px; height: 16px;">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
            </svg>
            View History
          </button>
          <button class="action-btn secondary" onclick="showRewardsMarketplace()">
            <svg viewBox="0 0 24 24" style="width: 16px; height: 16px;">
              <path d="M7 18c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12L8.1 13h7.45c.75 0 1.41-.41 1.75-1.03L21.7 4H5.21l-.94-2H1zm16 16c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
            Marketplace
          </button>
        </div>
      </div>
    `;
    
    this.insertIntoRightPanel(rewardsSection, 'ai-rewards');
  }

  /**
   * Create Quality Points tracking section
   */
  createQualityPointsSection() {
    const qualitySection = document.createElement('div');
    qualitySection.className = 'panel-card quality-points-card';
    qualitySection.innerHTML = `
      <button class="panel-header" onclick="togglePanel(this)">
        <div class="panel-title">
          <svg class="panel-icon" style="fill: #9333EA;" viewBox="0 0 24 24">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
          </svg>
          Quality Points
        </div>
        <div class="quality-rank-display">
          <span class="quality-points" id="qualityPointsBalance">${this.userStats?.quality_points?.total_balance || 0}</span>
          <span class="quality-rank" id="qualityRank">${this.userStats?.quality_points?.current_rank || 'Bronze'}</span>
        </div>
        <svg class="enterprise-icon chevron-icon" style="fill: rgba(255, 255, 255, 0.8);">
          <use href="#icon-chevron-down"></use>
        </svg>
      </button>
      <div class="panel-content active" id="qualityPointsContent">
        <div class="rank-progress">
          <div class="progress-header">
            <span>Progress to ${this.getNextRank()}</span>
            <span>${this.userStats?.quality_points?.total_balance || 0}/${this.userStats?.quality_points?.next_rank_threshold || 3500}</span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" style="width: ${this.calculateRankProgress()}%"></div>
          </div>
        </div>
        
        <div class="quality-categories">
          <div class="section-title">Quality Categories</div>
          <div class="category-grid">
            <div class="category-item">
              <div class="category-icon">🔧</div>
              <div class="category-name">Technical</div>
              <div class="category-score">85%</div>
            </div>
            <div class="category-item">
              <div class="category-icon">💬</div>
              <div class="category-name">Communication</div>
              <div class="category-score">92%</div>
            </div>
            <div class="category-item">
              <div class="category-icon">⏱️</div>
              <div class="category-name">Timeliness</div>
              <div class="category-score">78%</div>
            </div>
            <div class="category-item">
              <div class="category-icon">💡</div>
              <div class="category-name">Innovation</div>
              <div class="category-score">88%</div>
            </div>
            <div class="category-item">
              <div class="category-icon">🤝</div>
              <div class="category-name">Collaboration</div>
              <div class="category-score">90%</div>
            </div>
            <div class="category-item">
              <div class="category-icon">🧩</div>
              <div class="category-name">Problem Solving</div>
              <div class="category-score">87%</div>
            </div>
          </div>
        </div>
        
        <div class="recent-quality-points">
          <div class="section-title">Recent Earnings</div>
          <div class="quality-earnings-list" id="recentQualityEarnings">
            ${this.renderRecentQualityEarnings()}
          </div>
        </div>
      </div>
    `;
    
    this.insertIntoRightPanel(qualitySection, 'quality-points');
  }

  /**
   * Create 6-box partition tracking section
   */
  createPartitionTrackingSection() {
    const partitionSection = document.createElement('div');
    partitionSection.className = 'panel-card partition-tracking-card';
    partitionSection.innerHTML = `
      <button class="panel-header" onclick="togglePanel(this)">
        <div class="panel-title">
          <svg class="panel-icon" style="fill: #0bb1bb;" viewBox="0 0 24 24">
            <path d="M3 3v18h18V3H3zm8 16H5v-6h6v6zm0-8H5V5h6v6zm8 8h-6v-6h6v6zm0-8h-6V5h6v6z"/>
          </svg>
          PCP Partition Tracking
        </div>
        <div class="pcp-selector">
          <select id="pcpModelSelector" onchange="switchPCPModel(this.value)">
            <option value="QB">QB - Dr. Lucy</option>
            <option value="SH">SH - Dr. Claude</option>
            <option value="V36">V36 - Victory36</option>
          </select>
        </div>
        <svg class="enterprise-icon chevron-icon" style="fill: rgba(255, 255, 255, 0.8);">
          <use href="#icon-chevron-down"></use>
        </svg>
      </button>
      <div class="panel-content active" id="partitionTrackingContent">
        <div class="partition-grid" id="partitionGrid">
          ${this.renderPartitionBoxes()}
        </div>
        
        <div class="partition-summary">
          <div class="summary-stats">
            <div class="summary-item">
              <div class="summary-label">Total Tasks</div>
              <div class="summary-value" id="totalPartitionTasks">${this.calculateTotalTasks()}</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Avg Quality</div>
              <div class="summary-value" id="avgPartitionQuality">${this.calculateAverageQuality()}%</div>
            </div>
            <div class="summary-item">
              <div class="summary-label">Active Partitions</div>
              <div class="summary-value" id="activePartitions">6/6</div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    this.insertIntoRightPanel(partitionSection, 'partition-tracking');
  }

  /**
   * Create transaction history section
   */
  createTransactionHistorySection() {
    const historySection = document.createElement('div');
    historySection.className = 'panel-card transaction-history-card';
    historySection.innerHTML = `
      <button class="panel-header" onclick="togglePanel(this)">
        <div class="panel-title">
          <svg class="panel-icon" style="fill: #F59E0B;" viewBox="0 0 24 24">
            <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/>
          </svg>
          Transaction History
        </div>
        <div class="history-filter">
          <select id="historyFilter" onchange="filterTransactionHistory(this.value)">
            <option value="all">All Transactions</option>
            <option value="rewards">AI Rewards</option>
            <option value="quality">Quality Points</option>
            <option value="blockchain">Blockchain</option>
          </select>
        </div>
        <svg class="enterprise-icon chevron-icon" style="fill: rgba(255, 255, 255, 0.8);">
          <use href="#icon-chevron-down"></use>
        </svg>
      </button>
      <div class="panel-content active" id="transactionHistoryContent">
        <div class="transaction-timeline" id="transactionTimeline">
          ${this.renderTransactionHistory()}
        </div>
        
        <div class="history-actions">
          <button class="action-btn secondary" onclick="exportTransactionHistory()">
            <svg viewBox="0 0 24 24" style="width: 16px; height: 16px;">
              <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 2 2h8c1.1 0 2-.9 2-2V8l-6-6zm4 18H6V4h7v5h5v11z"/>
            </svg>
            Export History
          </button>
        </div>
      </div>
    `;
    
    this.insertIntoRightPanel(historySection, 'transaction-history');
  }

  /**
   * Render recent transactions
   */
  renderRecentTransactions() {
    const transactions = this.userStats?.blockchain_activity?.recent_transactions || [];
    
    return transactions.map(tx => `
      <div class="transaction-item">
        <div class="transaction-hash">
          <code>${tx.hash}</code>
          <button class="copy-btn" onclick="copyToClipboard('${tx.hash}')">📋</button>
        </div>
        <div class="transaction-status ${tx.status}">
          <div class="status-dot ${tx.status}"></div>
          <span>${tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}</span>
        </div>
        <div class="transaction-time">${this.formatTimestamp(tx.timestamp)}</div>
      </div>
    `).join('');
  }

  /**
   * Render recent earnings
   */
  renderRecentEarnings() {
    const earnings = this.userStats?.ai_rewards?.recent_earnings || [];
    
    return earnings.map(earning => `
      <div class="earning-item">
        <div class="earning-source">${earning.source.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
        <div class="earning-amount">+${earning.amount} AI</div>
        <div class="earning-date">${earning.date}</div>
      </div>
    `).join('');
  }

  /**
   * Render recent quality earnings
   */
  renderRecentQualityEarnings() {
    const earnings = this.userStats?.quality_points?.recent_earnings || [];
    
    return earnings.map(earning => `
      <div class="quality-earning-item">
        <div class="earning-category">${earning.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
        <div class="earning-points">+${earning.amount} pts</div>
        <div class="earning-date">${earning.date}</div>
      </div>
    `).join('');
  }

  /**
   * Render 6-box partition system
   */
  renderPartitionBoxes() {
    const partitions = this.userStats?.pcp_partitions?.QB || {};
    
    return Object.entries(partitions).map(([partitionKey, data]) => {
      const partitionNum = partitionKey.split('_')[1];
      const partitionName = this.getPartitionName(parseInt(partitionNum));
      
      return `
        <div class="partition-box" data-partition="${partitionNum}">
          <div class="partition-header">
            <div class="partition-number">${partitionNum}</div>
            <div class="partition-name">${partitionName}</div>
          </div>
          <div class="partition-stats">
            <div class="stat">
              <span class="stat-label">Tasks</span>
              <span class="stat-value">${data.completed_tasks}</span>
            </div>
            <div class="stat">
              <span class="stat-label">Quality</span>
              <span class="stat-value">${data.quality_average}%</span>
            </div>
            <div class="stat">
              <span class="stat-label">Last</span>
              <span class="stat-value">${data.last_activity}</span>
            </div>
          </div>
          <div class="partition-progress">
            <div class="progress-bar">
              <div class="progress-fill" style="width: ${data.quality_average}%"></div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  /**
   * Render transaction history
   */
  renderTransactionHistory() {
    // Combine different types of transactions
    const allTransactions = [
      ...(this.userStats?.ai_rewards?.recent_earnings || []).map(e => ({
        type: 'reward',
        amount: e.amount,
        source: e.source,
        date: e.date,
        status: 'confirmed'
      })),
      ...(this.userStats?.quality_points?.recent_earnings || []).map(e => ({
        type: 'quality',
        amount: e.amount,
        source: e.category,
        date: e.date,
        status: 'confirmed'
      })),
      ...(this.userStats?.blockchain_activity?.recent_transactions || []).map(tx => ({
        type: 'blockchain',
        hash: tx.hash,
        status: tx.status,
        date: tx.timestamp,
        source: 'blockchain_transaction'
      }))
    ];

    return allTransactions.map(transaction => `
      <div class="timeline-item">
        <div class="timeline-icon ${transaction.type}">
          ${this.getTransactionIcon(transaction.type)}
        </div>
        <div class="timeline-content">
          <div class="transaction-title">${this.formatTransactionTitle(transaction)}</div>
          <div class="transaction-details">${this.formatTransactionDetails(transaction)}</div>
          <div class="transaction-timestamp">${this.formatTimestamp(transaction.date)}</div>
        </div>
        <div class="transaction-status ${transaction.status}">
          <div class="status-dot ${transaction.status}"></div>
        </div>
      </div>
    `).join('');
  }

  /**
   * Helper methods
   */
  getPartitionName(partitionNum) {
    const names = {
      1: 'Project Initiation',
      2: 'Requirements Analysis',
      3: 'Development Execution',
      4: 'Quality Assurance',
      5: 'Deployment Delivery',
      6: 'Post-Delivery Optimization'
    };
    return names[partitionNum] || 'Unknown';
  }

  getNextRank() {
    const rankProgression = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    const currentRank = this.userStats?.quality_points?.current_rank || 'Bronze';
    const currentIndex = rankProgression.indexOf(currentRank);
    return rankProgression[currentIndex + 1] || 'Diamond';
  }

  calculateRankProgress() {
    const current = this.userStats?.quality_points?.total_balance || 0;
    const threshold = this.userStats?.quality_points?.next_rank_threshold || 3500;
    return Math.min((current / threshold) * 100, 100);
  }

  calculateTotalTasks() {
    const partitions = this.userStats?.pcp_partitions?.QB || {};
    return Object.values(partitions).reduce((total, partition) => total + (partition.completed_tasks || 0), 0);
  }

  calculateAverageQuality() {
    const partitions = this.userStats?.pcp_partitions?.QB || {};
    const qualities = Object.values(partitions).map(p => p.quality_average || 0);
    return qualities.length > 0 ? Math.round(qualities.reduce((a, b) => a + b) / qualities.length) : 0;
  }

  getTransactionIcon(type) {
    const icons = {
      reward: '⭐',
      quality: '🏆',
      blockchain: '🔗'
    };
    return icons[type] || '📄';
  }

  formatTransactionTitle(transaction) {
    const titles = {
      reward: 'AIRewards Earned',
      quality: 'Quality Points Earned',
      blockchain: 'Blockchain Transaction'
    };
    return titles[transaction.type] || 'Transaction';
  }

  formatTransactionDetails(transaction) {
    if (transaction.type === 'reward') {
      return `+${transaction.amount} AI tokens from ${transaction.source.replace('_', ' ')}`;
    } else if (transaction.type === 'quality') {
      return `+${transaction.amount} quality points for ${transaction.source.replace('_', ' ')}`;
    } else if (transaction.type === 'blockchain') {
      return `Hash: ${transaction.hash}`;
    }
    return '';
  }

  formatTimestamp(timestamp) {
    if (!timestamp) return 'Unknown';
    const date = new Date(timestamp);
    return date.toLocaleString();
  }

  /**
   * Insert section into right panel
   */
  insertIntoRightPanel(element, position) {
    const rightPanel = document.getElementById('rightPanel');
    if (!rightPanel) {
      console.error('Right panel not found');
      return;
    }

    // Insert after copilot section
    const copilotSection = rightPanel.querySelector('.copilot-section');
    if (copilotSection) {
      copilotSection.insertAdjacentElement('afterend', element);
    } else {
      rightPanel.appendChild(element);
    }
  }

  /**
   * Start real-time updates
   */
  startRealTimeUpdates() {
    this.updateInterval = setInterval(async () => {
      try {
        // Fetch updated stats
        this.userStats = await this.s2doIntegration.getUserBlockchainStats(this.currentUserId);
        
        // Update UI elements
        this.updateBlockchainStatus();
        this.updateAIRewardsDisplay();
        this.updateQualityPointsDisplay();
        this.updatePartitionTracking();
        
      } catch (error) {
        console.error('Error updating UI:', error);
      }
    }, 30000); // Update every 30 seconds
  }

  /**
   * Update blockchain status display
   */
  updateBlockchainStatus() {
    const totalTx = document.getElementById('totalTransactions');
    const confirmedTx = document.getElementById('confirmedTransactions');
    const pendingTx = document.getElementById('pendingTransactions');
    const failedTx = document.getElementById('failedTransactions');
    
    if (totalTx) totalTx.textContent = this.userStats?.blockchain_activity?.total_transactions || 0;
    if (confirmedTx) confirmedTx.textContent = this.userStats?.blockchain_activity?.confirmed_transactions || 0;
    if (pendingTx) pendingTx.textContent = this.userStats?.blockchain_activity?.pending_transactions || 0;
    if (failedTx) failedTx.textContent = this.userStats?.blockchain_activity?.failed_transactions || 0;
  }

  /**
   * Update AIRewards display
   */
  updateAIRewardsDisplay() {
    const balance = document.getElementById('aiRewardsBalance');
    const totalEarned = document.getElementById('totalEarned');
    const totalSpent = document.getElementById('totalSpent');
    
    if (balance) balance.textContent = this.userStats?.ai_rewards?.total_balance || 0;
    if (totalEarned) totalEarned.textContent = this.userStats?.ai_rewards?.total_earned || 0;
    if (totalSpent) totalSpent.textContent = this.userStats?.ai_rewards?.total_spent || 0;
  }

  /**
   * Update quality points display
   */
  updateQualityPointsDisplay() {
    const balance = document.getElementById('qualityPointsBalance');
    const rank = document.getElementById('qualityRank');
    
    if (balance) balance.textContent = this.userStats?.quality_points?.total_balance || 0;
    if (rank) rank.textContent = this.userStats?.quality_points?.current_rank || 'Bronze';
  }

  /**
   * Update partition tracking
   */
  updatePartitionTracking() {
    const totalTasks = document.getElementById('totalPartitionTasks');
    const avgQuality = document.getElementById('avgPartitionQuality');
    
    if (totalTasks) totalTasks.textContent = this.calculateTotalTasks();
    if (avgQuality) avgQuality.textContent = `${this.calculateAverageQuality()}%`;
  }

  /**
   * Cleanup
   */
  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }
}

// Global instance
let blockchainRewardsUI = null;

// Initialize function
function initializeBlockchainRewardsUI(userId) {
  if (blockchainRewardsUI) {
    blockchainRewardsUI.destroy();
  }
  
  blockchainRewardsUI = new BlockchainRewardsUI();
  blockchainRewardsUI.initializeUI(userId);
}

// Utility functions for UI interactions
function switchPCPModel(model) {
  console.log(`Switching to PCP model: ${model}`);
  // Update partition display for selected model
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    console.log('Copied to clipboard:', text);
  });
}

function showRewardsHistory() {
  console.log('Showing rewards history');
  // Open rewards history modal
}

function showRewardsMarketplace() {
  console.log('Opening rewards marketplace');
  // Open marketplace modal
}

function filterTransactionHistory(filter) {
  console.log(`Filtering transaction history by: ${filter}`);
  // Filter transaction display
}

function exportTransactionHistory() {
  console.log('Exporting transaction history');
  // Export functionality
}

// Make available globally
if (typeof window !== 'undefined') {
  window.BlockchainRewardsUI = BlockchainRewardsUI;
  window.initializeBlockchainRewardsUI = initializeBlockchainRewardsUI;
}
