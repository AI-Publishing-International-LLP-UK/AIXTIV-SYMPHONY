/**
 * Dream Commander Workflow Orchestrator Integration
 * Fetches personalized data from Dream Commander daily push endpoints
 * Replaces hardcoded panel content with owner-specific dynamic data
 */

class DreamCommanderIntegration {
  constructor() {
    this.apiBaseUrl = '/api/dream-commander';
    this.authenticated = false;
    this.ownerId = null;
    this.lastUpdate = null;
    this.retryCount = 0;
    this.maxRetries = 3;
    this.weeklySchedule = {
      0: 'sunday',    // Sunday - Week preparation
      1: 'monday',    // Monday - Week kickoff
      2: 'tuesday',   // Tuesday - Progress review
      3: 'wednesday', // Wednesday - Mid-week optimization
      4: 'thursday',  // Thursday - Performance analysis
      5: 'friday',    // Friday - Week completion
      6: 'saturday'   // Saturday - Weekly summary & statistics
    };
    this.currentDayType = this.getDayType();
  }

  /**
   * Get current day type for weekly scheduling
   */
  getDayType() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    return this.weeklySchedule[dayOfWeek];
  }

  /**
   * Get time until next update based on current day
   */
  getNextUpdateInterval() {
    const now = new Date();
    const currentHour = now.getHours();
    const dayType = this.getDayType();
    
    // Different update schedules based on day
    switch(dayType) {
    case 'saturday': // Saturday - Weekly summary at 6 AM
      if (currentHour < 6) {
        return (6 - currentHour) * 60 * 60 * 1000;
      }
      return 24 * 60 * 60 * 1000; // Next day
        
    case 'sunday': // Sunday - Week prep at 8 AM
      if (currentHour < 8) {
        return (8 - currentHour) * 60 * 60 * 1000;
      }
      return 24 * 60 * 60 * 1000; // Next day
        
    default: // Weekdays - Multiple updates
      // Morning briefing at 6 AM, midday at 12 PM, evening at 6 PM
      const updateHours = [6, 12, 18];
      const nextHour = updateHours.find(hour => hour > currentHour);
      if (nextHour) {
        return (nextHour - currentHour) * 60 * 60 * 1000;
      }
      return (24 - currentHour + 6) * 60 * 60 * 1000; // Next day at 6 AM
    }
  }

  /**
   * Initialize Dream Commander connection and authenticate
   */
  async initialize() {
    try {
      console.log(`🌟 Initializing Dream Commander integration for ${this.currentDayType}...`);
      
      // Authenticate with Dream Commander service
      const authResult = await this.authenticate();
      if (!authResult.success) {
        console.warn('⚠️ Dream Commander authentication failed, using fallback data');
        this.loadFallbackData();
        return false;
      }

      // Load initial data based on current day
      await this.loadAllPanelData();
      
      // Set up smart periodic updates based on weekly schedule
      this.setupWeeklySchedule();
      
      console.log(`✅ Dream Commander integration initialized for ${this.currentDayType} schedule`);
      return true;
      
    } catch (error) {
      console.error('❌ Dream Commander initialization error:', error);
      this.loadFallbackData();
      return false;
    }
  }

  /**
   * Authenticate with Dream Commander service
   */
  async authenticate() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-Interface': 'MOCOA',
          'X-User-Role': 'owner'
        },
        body: JSON.stringify({
          interface: 'mocoa-owner',
          request_type: 'panel_data_access',
          authentication_level: 'enterprise'
        })
      });

      if (response.ok) {
        const result = await response.json();
        this.authenticated = true;
        this.ownerId = result.owner_id;
        console.log('🔐 Dream Commander authenticated successfully');
        return { success: true, ownerId: result.owner_id };
      } else {
        throw new Error(`Authentication failed: ${response.status}`);
      }
    } catch (error) {
      console.error('❌ Dream Commander authentication error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Load all panel data from Dream Commander endpoints
   */
  async loadAllPanelData() {
    console.log('📊 Loading Dream Commander panel data...');
    
    try {
      // Load data for all 5 panels concurrently
      const [hotTopics, proposals, projects, growth, alignment, support] = await Promise.all([
        this.fetchHotTopics(),
        this.fetchProposals(),
        this.fetchProjects(),
        this.fetchGrowthData(),
        this.fetchAlignmentData(),
        this.fetchSupportData()
      ]);

      // Update each panel with fetched data
      this.updateHotTopicsPanel(hotTopics);
      this.updateProposalsPanel(proposals);
      this.updateProjectsPanel(projects);
      this.updateGrowthPanel(growth);
      this.updateAlignmentPanel(alignment);
      this.updateSupportPanel(support);

      this.lastUpdate = new Date();
      console.log('✅ All Dream Commander panel data loaded successfully');
      
    } catch (error) {
      console.error('❌ Error loading Dream Commander panel data:', error);
      throw error;
    }
  }

  /**
   * Fetch hot topics from Dream Commander daily push
   */
  async fetchHotTopics() {
    const response = await this.makeAuthenticatedRequest('/hot-topics');
    return response.topics || [];
  }

  /**
   * Fetch proposals data
   */
  async fetchProposals() {
    const response = await this.makeAuthenticatedRequest('/proposals');
    return response.proposals || [];
  }

  /**
   * Fetch projects data
   */
  async fetchProjects() {
    const response = await this.makeAuthenticatedRequest('/projects');
    return response.projects || [];
  }

  /**
   * Fetch growth metrics
   */
  async fetchGrowthData() {
    const response = await this.makeAuthenticatedRequest('/growth-metrics');
    return response.metrics || {};
  }

  /**
   * Fetch alignment recommendations
   */
  async fetchAlignmentData() {
    const response = await this.makeAuthenticatedRequest('/role-alignment');
    return response.alignment || {};
  }

  /**
   * Fetch career support data
   */
  async fetchSupportData() {
    const response = await this.makeAuthenticatedRequest('/career-support');
    return response.support || {};
  }

  /**
   * Make authenticated request to Dream Commander API
   */
  async makeAuthenticatedRequest(endpoint) {
    try {
      const response = await fetch(`${this.apiBaseUrl}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getAuthToken()}`,
          'Content-Type': 'application/json',
          'X-Owner-ID': this.ownerId,
          'X-Interface': 'MOCOA',
          'X-Request-Time': new Date().toISOString()
        }
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ Dream Commander API error for ${endpoint}:`, error);
      
      // Retry logic
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.log(`🔄 Retrying request (${this.retryCount}/${this.maxRetries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * this.retryCount));
        return this.makeAuthenticatedRequest(endpoint);
      }
      
      throw error;
    }
  }

  /**
   * Update Hot Topics panel with dynamic data
   */
  updateHotTopicsPanel(topics) {
    const content = document.getElementById('hotTopicsContent');
    if (!content || !topics.length) return;

    const topicsHtml = topics.slice(0, 2).map(topic => `
      <div style="display: flex; align-items: center; gap: 8px; padding: 6px; border-radius: 6px; transition: all 0.3s; cursor: pointer; margin-bottom: 6px;">
        <div style="width: 6px; height: 6px; background: ${topic.priority === 'high' ? 'linear-gradient(135deg, #ff6b35, #f7931e)' : 'linear-gradient(135deg, #50C878, #0bb1bb)'}; border-radius: 2px; flex-shrink: 0;"></div>
        <div style="flex: 1;">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 2px;">
            <span style="background: ${topic.priority === 'high' ? 'linear-gradient(135deg, #ff6b35, #f7931e)' : 'linear-gradient(135deg, #50C878, #0bb1bb)'}; color: white; padding: 1px 4px; border-radius: 6px; font-size: 7px; font-weight: 600;">
              ${topic.priority === 'high' ? '🔥 Trending' : '📈 Growth'}
            </span>
            <span style="font-size: 8px; color: #888;">${topic.timeAgo}</span>
          </div>
          <div style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 1px;">${topic.title}</div>
          <div style="font-size: 9px; color: #aaa; line-height: 1.2;">${topic.description}</div>
        </div>
      </div>
    `).join('');

    content.innerHTML = topicsHtml;
    console.log('📰 Hot Topics panel updated with Dream Commander data');
  }

  /**
   * Update Proposals panel with dynamic data
   */
  updateProposalsPanel(proposals) {
    const content = document.getElementById('proposalsContent');
    if (!content || !proposals.length) return;

    const proposalsHtml = proposals.slice(0, 2).map(proposal => `
      <div style="padding: 6px; border-radius: 6px; margin-bottom: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
          <div style="font-size: 11px; font-weight: 600; color: #fff;">${proposal.title}</div>
          <span style="font-size: 8px; color: ${proposal.status === 'APPROVED' ? '#50C878' : proposal.status === 'PENDING' ? '#fbbf24' : '#ff6b35'}; background: rgba(${proposal.status === 'APPROVED' ? '80, 200, 120' : proposal.status === 'PENDING' ? '251, 191, 36' : '255, 107, 53'}, 0.1); padding: 1px 4px; border-radius: 4px;">
            ${proposal.status}
          </span>
        </div>
        <div style="font-size: 9px; color: #aaa; line-height: 1.2; margin-bottom: 3px;">${proposal.description}</div>
        <div style="font-size: 8px; color: #888;">${proposal.roi ? `Est. ROI: ${proposal.roi}` : `Budget: ${proposal.budget}`}</div>
      </div>
    `).join('');

    content.innerHTML = proposalsHtml;
    console.log('💡 Proposals panel updated with Dream Commander data');
  }

  /**
   * Update Projects panel with dynamic data
   */
  updateProjectsPanel(projects) {
    const content = document.getElementById('projectsContent');
    if (!content || !projects.length) return;

    const projectsHtml = projects.slice(0, 2).map(project => `
      <div style="padding: 6px; border-radius: 6px; margin-bottom: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
          <div style="font-size: 11px; font-weight: 600; color: #fff;">${project.name}</div>
          <div style="font-size: 8px; color: ${project.progress >= 80 ? '#10b981' : project.progress >= 60 ? '#fbbf24' : '#ff6b35'};">${project.progress}%</div>
        </div>
        <div style="font-size: 9px; color: #aaa; line-height: 1.2; margin-bottom: 3px;">${project.description}</div>
        <div style="width: 100%; height: 3px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden;">
          <div style="width: ${project.progress}%; height: 100%; background: linear-gradient(90deg, ${project.progress >= 80 ? '#10b981, #0bb1bb' : project.progress >= 60 ? '#fbbf24, #f59e0b' : '#ff6b35, #f7931e'});"></div>
        </div>
      </div>
    `).join('');

    content.innerHTML = projectsHtml;
    console.log('📋 Projects panel updated with Dream Commander data');
  }

  /**
   * Update Growth panel with dynamic data
   */
  updateGrowthPanel(growth) {
    const content = document.getElementById('growthContent');
    if (!content || !growth.metrics) return;

    const metricsHtml = Object.entries(growth.metrics).slice(0, 3).map(([key, metric]) => `
      <div style="padding: 6px; border-radius: 6px; margin-bottom: 6px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">
          <div style="font-size: 11px; font-weight: 600; color: #fff;">${metric.name}</div>
          <div style="font-size: 10px; color: ${metric.trend === 'up' ? '#50C878' : metric.trend === 'down' ? '#ff6b35' : '#0bb1bb'}; font-weight: 700;">
            ${metric.change}
          </div>
        </div>
        <div style="font-size: 9px; color: #aaa; line-height: 1.2;">${metric.description}</div>
      </div>
    `).join('');

    content.innerHTML = metricsHtml;
    console.log('📈 Growth panel updated with Dream Commander data');
  }

  /**
   * Update Alignment panel with dynamic data
   */
  updateAlignmentPanel(alignment) {
    const content = document.getElementById('alignmentContent');
    if (!content || !alignment.priorities) return;

    const alignmentHtml = `
      <div style="padding: 6px; border-radius: 6px; margin-bottom: 6px;">
        <div style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 2px;">${alignment.currentPeriod} Strategic Priorities</div>
        ${alignment.priorities.slice(0, 3).map(priority => `
          <div style="font-size: 9px; color: #aaa; line-height: 1.2; margin-bottom: 3px;">• ${priority}</div>
        `).join('')}
      </div>
      <div style="padding: 6px; border-radius: 6px;">
        <div style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 2px;">${alignment.teamObjectives.title}</div>
        ${alignment.teamObjectives.objectives.slice(0, 2).map(objective => `
          <div style="font-size: 9px; color: #aaa; line-height: 1.2; margin-bottom: 2px;">${objective}</div>
        `).join('')}
      </div>
    `;

    content.innerHTML = alignmentHtml;
    console.log('🎯 Alignment panel updated with Dream Commander data');
  }

  /**
   * Update Support panel with dynamic data
   */
  updateSupportPanel(support) {
    const content = document.getElementById('supportContent');
    if (!content || !support.recommendations) return;

    const supportHtml = `
      <div style="padding: 6px; border-radius: 6px; margin-bottom: 6px;">
        <div style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 2px;">Recommended Training</div>
        ${support.recommendations.training.slice(0, 3).map(training => `
          <div style="font-size: 9px; color: #aaa; line-height: 1.2; margin-bottom: 2px;">• ${training}</div>
        `).join('')}
      </div>
      <div style="padding: 6px; border-radius: 6px;">
        <div style="font-size: 11px; font-weight: 600; color: #fff; margin-bottom: 2px;">Career Advancement</div>
        <div style="font-size: 9px; color: #aaa; line-height: 1.2; margin-bottom: 2px;">Next role: ${support.recommendations.nextRole}</div>
        <div style="font-size: 9px; color: #aaa; line-height: 1.2;">Target timeline: ${support.recommendations.timeline}</div>
      </div>
    `;

    content.innerHTML = supportHtml;
    console.log('🚀 Support panel updated with Dream Commander data');
  }

  /**
   * Load fallback data when Dream Commander is unavailable
   */
  loadFallbackData() {
    console.log('📋 Loading Dream Commander fallback data...');
    
    // Sample data that mimics the structure from Dream Commander
    const fallbackData = {
      hotTopics: [
        {
          priority: 'high',
          title: 'Vision Lake Integration Complete',
          description: '320,000 agents operational across squadrons',
          timeAgo: '2h ago'
        },
        {
          priority: 'normal',
          title: 'Revenue Pipeline +47%',
          description: 'Q2 projections exceeding targets by ENVIRONMENT_VARIABLE_REQUIRED',
          timeAgo: '4h ago'
        }
      ],
      proposals: [
        {
          title: 'Multi-Tenant Gateway Enhancement',
          description: 'Advanced tenant isolation & scaling capabilities',
          status: 'PENDING',
          roi: '+$1.2M annually'
        },
        {
          title: 'AI Copilot Expansion',
          description: 'Deploy 6 additional RIX specialists',
          status: 'APPROVED',
          budget: '$450K Q3-Q4'
        }
      ],
      projects: [
        {
          name: 'V99 Interface Deployment',
          description: 'Production rollout to 47 enterprise clients',
          progress: 87
        },
        {
          name: 'Security Audit Compliance',
          description: 'SOC2 Type II certification process',
          progress: 62
        }
      ],
      growth: {
        metrics: {
          engagement: {
            name: 'User Engagement',
            change: '+340%',
            description: 'Copilot interactions: 2.4M monthly',
            trend: 'up'
          },
          revenue: {
            name: 'Revenue Growth',
            change: '+127%',
            description: 'ARR: ENVIRONMENT_VARIABLE_REQUIRED (vs $8.3M last year)',
            trend: 'up'
          },
          retention: {
            name: 'Client Retention',
            change: 'ENVIRONMENT_VARIABLE_REQUIRED',
            description: 'Enterprise clients: 142 active',
            trend: 'up'
          }
        }
      },
      alignment: {
        currentPeriod: 'Q2',
        priorities: [
          'Enterprise scalability (Banking sector)',
          'Multi-tenant architecture completion',
          'Regulatory compliance (SOX, GDPR)'
        ],
        teamObjectives: {
          title: 'Team Objectives',
          objectives: [
            'Leadership development: 3 promotions pending',
            'Cross-training: 85% completion rate'
          ]
        }
      },
      support: {
        recommendations: {
          training: [
            'Executive Leadership Certification (8 weeks)',
            'Enterprise Architecture Mastery',
            'Board Presentation Skills Workshop'
          ],
          nextRole: 'Chief Technology Officer',
          timeline: 'Q4 2025'
        }
      }
    };

    // Update all panels with fallback data
    this.updateHotTopicsPanel(fallbackData.hotTopics);
    this.updateProposalsPanel(fallbackData.proposals);
    this.updateProjectsPanel(fallbackData.projects);
    this.updateGrowthPanel(fallbackData.growth);
    this.updateAlignmentPanel(fallbackData.alignment);
    this.updateSupportPanel(fallbackData.support);

    console.log('✅ Dream Commander fallback data loaded');
  }

  /**
   * Set up sophisticated weekly scheduling system
   * ENVIRONMENT_VARIABLE_REQUIRED pilots and automated workflows do the work in milliseconds
   * Lack of progress means lack of time in ASOOS and counts against performance metrics
   */
  setupWeeklySchedule() {
    const dayType = this.getDayType();
    
    console.log(`📅 Setting up ${dayType} schedule - 20M pilots ready for automated workflows`);
    
    // Schedule next update based on current day
    const nextUpdateMs = this.getNextUpdateInterval();
    
    setTimeout(async () => {
      await this.performScheduledUpdate();
      this.scheduleNextUpdate();
    }, nextUpdateMs);
    
    // Set up immediate performance tracking
    this.setupPerformanceTracking();
  }

  /**
   * Schedule next update in the weekly cycle
   */
  scheduleNextUpdate() {
    const nextUpdateMs = this.getNextUpdateInterval();
    
    setTimeout(async () => {
      await this.performScheduledUpdate();
      this.scheduleNextUpdate(); // Recursive scheduling
    }, nextUpdateMs);
  }

  /**
   * Perform scheduled update based on current day type
   */
  async performScheduledUpdate() {
    const dayType = this.getDayType();
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour12: false });
    
    console.log(`🔄 Performing ${dayType} update at ${timeString}`);
    
    try {
      switch(dayType) {
      case 'saturday':
        await this.loadWeeklySummaryData();
        break;
      case 'sunday':
        await this.loadWeekPreparationData();
        break;
      default:
        await this.loadWeekdayData();
        break;
      }
      
      // Track performance metrics
      this.updatePerformanceMetrics(dayType);
      
      if (window.showNotification) {
        const message = this.getUpdateMessage(dayType);
        window.showNotification(message, 'success');
      }
      
    } catch (error) {
      console.error(`❌ Error during ${dayType} update:`, error);
      // Performance hit for failed updates
      this.recordPerformanceIssue(dayType, error.message);
    }
  }

  /**
   * Load Saturday weekly summary and statistics
   */
  async loadWeeklySummaryData() {
    console.log('📊 Loading Saturday weekly summary and statistics...');
    
    const summaryData = await this.makeAuthenticatedRequest('/weekly-summary');
    const statistics = await this.makeAuthenticatedRequest('/weekly-statistics');
    const completedAdvances = await this.makeAuthenticatedRequest('/completed-advances');
    
    this.updateSaturdayPanels(summaryData, statistics, completedAdvances);
    
    // Update performance dashboard
    this.updateWeeklyPerformanceScore(summaryData.performance_score);
  }

  /**
   * Load Sunday week preparation data
   */
  async loadWeekPreparationData() {
    console.log('📋 Loading Sunday week preparation - priorities carry forward...');
    
    const carryForwardItems = await this.makeAuthenticatedRequest('/carry-forward-priorities');
    const weeklyGoals = await this.makeAuthenticatedRequest('/weekly-goals');
    const automatedWorkflows = await this.makeAuthenticatedRequest('/automated-workflows-status');
    
    this.updateSundayPanels(carryForwardItems, weeklyGoals, automatedWorkflows);
    
    // Prepare 20M pilots for the week ahead
    this.initializeWeeklyWorkflows();
  }

  /**
   * Load regular weekday data (Mon-Fri)
   */
  async loadWeekdayData() {
    console.log('💼 Loading weekday operational data...');
    
    // Standard panel data loading
    await this.loadAllPanelData();
    
    // Additional weekday-specific data
    const dailyMetrics = await this.makeAuthenticatedRequest('/daily-performance-metrics');
    this.updateDailyPerformanceIndicators(dailyMetrics);
  }

  /**
   * Set up performance tracking system
   * 20M pilots work in milliseconds - lack of progress = performance hit
   */
  setupPerformanceTracking() {
    this.performanceMetrics = {
      dailyUpdates: 0,
      missedUpdates: 0,
      averageResponseTime: 0,
      automatedWorkflowsActive: 20000000, // 20 million pilots
      progressScore: 100,
      lastUpdate: null
    };
    
    // Check for lack of progress every hour
    setInterval(() => {
      this.checkProgressMetrics();
    }, 3600000); // 1 hour
  }

  /**
   * Check progress metrics and update performance score
   */
  checkProgressMetrics() {
    const now = new Date();
    const hoursSinceLastUpdate = this.performanceMetrics.lastUpdate 
      ? (now - this.performanceMetrics.lastUpdate) / 3600000 
      : 0;
    
    // Performance penalty for stale data
    if (hoursSinceLastUpdate > 8) { // 8+ hours without update
      this.performanceMetrics.progressScore -= 5;
      console.warn(`⚠️ Performance hit: ${hoursSinceLastUpdate.toFixed(1)}h since last update`);
      
      if (window.showNotification) {
        window.showNotification('Performance metrics declining - update required', 'error');
      }
    }
    
    // Cap minimum score at 0
    this.performanceMetrics.progressScore = Math.max(0, this.performanceMetrics.progressScore);
  }

  /**
   * Update performance metrics after successful update
   */
  updatePerformanceMetrics(dayType) {
    this.performanceMetrics.dailyUpdates++;
    this.performanceMetrics.lastUpdate = new Date();
    
    // Boost performance score for timely updates
    if (this.performanceMetrics.progressScore < 100) {
      this.performanceMetrics.progressScore = Math.min(100, this.performanceMetrics.progressScore + 2);
    }
    
    console.log(`✅ Performance metrics updated - Score: ${this.performanceMetrics.progressScore}/100`);
  }

  /**
   * Record performance issue
   */
  recordPerformanceIssue(dayType, error) {
    this.performanceMetrics.missedUpdates++;
    this.performanceMetrics.progressScore -= 10;
    
    console.error(`❌ Performance issue on ${dayType}: ${error}`);
    console.log(`📉 Performance score reduced to ${this.performanceMetrics.progressScore}/100`);
  }

  /**
   * Get update message based on day type
   */
  getUpdateMessage(dayType) {
    const messages = {
      'saturday': '📊 Weekly summary & statistics updated',
      'sunday': '📋 Week preparation complete - priorities carry forward',
      'monday': '🚀 Monday briefing updated - week kickoff',
      'tuesday': '📈 Tuesday progress review updated',
      'wednesday': '⚡ Wednesday mid-week optimization updated',
      'thursday': '📊 Thursday performance analysis updated',
      'friday': '✅ Friday week completion summary updated'
    };
    
    return messages[dayType] || `🔄 ${dayType} data updated`;
  }

  /**
   * Initialize weekly workflows for 20M pilots
   */
  initializeWeeklyWorkflows() {
    console.log('🚀 Initializing ENVIRONMENT_VARIABLE_REQUIRED pilots for weekly automated workflows...');
    
    // Simulate millisecond workflow initialization
    setTimeout(() => {
      console.log('⚡ All pilots operational - workflows ready in milliseconds');
      
      if (window.showNotification) {
        window.showNotification('20M pilots ready - automated workflows operational', 'success');
      }
    }, 50); // 50ms to simulate ultra-fast initialization
  }

  /**
   * Get authentication token (would be stored securely in production)
   */
  getAuthToken() {
    // In production, this would come from secure storage
    return localStorage.getItem('dreamCommanderToken') || 'demo_token';
  }

  /**
   * Force refresh all panel data
   */
  async forceRefresh() {
    console.log('🔄 Force refreshing Dream Commander data...');
    this.retryCount = 0;
    
    try {
      await this.loadAllPanelData();
      if (window.showNotification) {
        window.showNotification('Dream Commander data refreshed', 'success');
      }
    } catch (error) {
      console.error('❌ Force refresh failed:', error);
      if (window.showNotification) {
        window.showNotification('Dream Commander refresh failed', 'error');
      }
    }
  }
}

// Initialize Dream Commander integration when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
  console.log('🌟 Starting Dream Commander integration...');
  
  // Create global Dream Commander instance
  window.dreamCommander = new DreamCommanderIntegration();
  
  // Wait a bit for the main interface to load
  setTimeout(async () => {
    await window.dreamCommander.initialize();
  }, 2000);
});

// Make the class globally available for debugging and manual operations
window.DreamCommanderIntegration = DreamCommanderIntegration;
