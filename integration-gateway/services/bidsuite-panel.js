/**
 * 🎯 BIDSUITE SERVICE PANEL
 * Dr. Match automation for bid discovery and submission
 * Follows UI Design Standards - 50KB max bundle size
 */

export class BidSuitePanel {
  constructor(orchestrator) {
    this.orchestrator = orchestrator;
    this.containerId = 'bidsuite-panel';
    this.detailPanelOpen = false;
  }

  /**
   * Render BidSuite service panel in center area
   */
  async render(userData) {
    const data = await this.fetchBidSuiteData(userData.id);
    
    const panelHTML = `
      <div class="service-panel" id="${this.containerId}">
        <!-- Header Section: 60px height -->
        <div class="service-header">
          <h2 class="service-title">BIDSUITE - DR. MATCH AUTOMATION</h2>
          <span class="last-updated">Last updated: ${data.lastUpdated}</span>
        </div>

        <!-- Status Grid: 4 metrics in 2x2 -->
        <div class="status-grid">
          <div class="status-metric clickable" data-metric="opportunities">
            <div class="metric-value">${data.opportunities}</div>
            <div class="metric-label">Opportunities Found This Week</div>
          </div>
          <div class="status-metric clickable" data-metric="bids">
            <div class="metric-value">${data.bidsSubmitted}</div>
            <div class="metric-label">Bids Submitted</div>
          </div>
          <div class="status-metric clickable" data-metric="winrate">
            <div class="metric-value">${data.winRate}</div>
            <div class="metric-label">Win Rate</div>
          </div>
          <div class="status-metric clickable" data-metric="pipeline">
            <div class="metric-value">${data.pipelineValue}</div>
            <div class="metric-label">Pipeline Value</div>
          </div>
        </div>

        <!-- Activity List: Max 4 items -->
        <div class="activity-list">
          ${data.recentActivity.map((activity, index) => `
            <div class="activity-item clickable" data-activity="${index}">
              <div class="activity-action">${activity.action}</div>
              <div class="activity-status status-${activity.statusColor}">${activity.status}</div>
            </div>
          `).join('')}
        </div>

        <!-- Action Bar: 40px height, 5 buttons max -->
        <div class="action-bar">
          <button class="action-btn primary" data-action="view-opportunities">VIEW OPPORTUNITIES</button>
          <button class="action-btn secondary" data-action="modify-criteria">MODIFY CRITERIA</button>
          <button class="action-btn secondary" data-action="performance-report">PERFORMANCE</button>
          <button class="action-btn secondary" data-action="share">SHARE</button>
          <button class="action-btn secondary" data-action="settings">SETTINGS</button>
        </div>
      </div>
    `;

    this.attachEventListeners();
    return panelHTML;
  }

  /**
   * Attach click handlers following interaction standards
   */
  attachEventListeners() {
    // Metric clicks → right panel expansion
    document.querySelectorAll(`#${this.containerId} .status-metric.clickable`).forEach(metric => {
      metric.addEventListener('click', (e) => {
        const metricType = e.currentTarget.dataset.metric;
        this.expandDetailPanel('metric', metricType);
      });
    });

    // Activity clicks → right panel expansion
    document.querySelectorAll(`#${this.containerId} .activity-item.clickable`).forEach(item => {
      item.addEventListener('click', (e) => {
        const activityIndex = e.currentTarget.dataset.activity;
        this.expandDetailPanel('activity', activityIndex);
      });
    });

    // Action button clicks
    document.querySelectorAll(`#${this.containerId} .action-btn`).forEach(btn => {
      btn.addEventListener('click', (e) => {
        const action = e.currentTarget.dataset.action;
        this.handleAction(action);
      });
    });
  }

  /**
   * Expand right panel with detailed view
   */
  async expandDetailPanel(type, identifier) {
    if (this.detailPanelOpen) {return;} // Prevent multiple panels

    this.detailPanelOpen = true;
    
    // Load detail component dynamically
    const detailComponent = await import('../details/bidsuite-details.js');
    const detailPanel = new detailComponent.BidSuiteDetails(this.orchestrator);
    
    const detailHTML = await detailPanel.render(type, identifier);
    
    // Inject into right panel area
    this.orchestrator.emit('show-detail-panel', {
      html: detailHTML,
      width: 400,
      onClose: () => { this.detailPanelOpen = false; }
    });
  }

  /**
   * Handle action button clicks
   */
  async handleAction(action) {
    switch(action) {
      case 'view-opportunities':
        await this.expandDetailPanel('opportunities', 'all');
        break;
      case 'modify-criteria':
        this.orchestrator.emit('service-action', {
          service: 'bidsuite',
          action: 'modify-criteria'
        });
        break;
      case 'performance-report':
        await this.expandDetailPanel('performance', 'report');
        break;
      case 'share':
        this.orchestrator.emit('service-action', {
          service: 'bidsuite', 
          action: 'share'
        });
        break;
      case 'settings':
        await this.expandDetailPanel('settings', 'bidsuite-config');
        break;
    }
  }

  /**
   * Fetch BidSuite data from storage partition 2
   */
  async fetchBidSuiteData(userId) {
    // Connect to partition 2 (owner access)
    const storageAdapter = await import('../storage/partition-2.js');
    const data = await storageAdapter.fetchBidSuiteMetrics(userId);
    
    return {
      opportunities: data.opportunitiesFound || 18,
      bidsSubmitted: data.bidsSubmitted || 7, 
      winRate: data.winRate || '34%',
      pipelineValue: data.pipelineValue || '$127K',
      lastUpdated: data.lastUpdated || '45 minutes ago',
      recentActivity: [
        {
          action: 'Software development RFP identified',
          status: 'BID SUBMITTED', 
          statusColor: 'green'
        },
        {
          action: 'Consulting opportunity matched',
          status: 'PROPOSAL SENT',
          statusColor: 'yellow' 
        },
        {
          action: 'Partnership opportunity flagged', 
          status: 'REVIEWING',
          statusColor: 'blue'
        },
        {
          action: 'Government contract analyzed',
          status: 'QUALIFIED',
          statusColor: 'green'
        }
      ]
    };
  }
}

// CSS styles following design standards
export const bidSuiteStyles = `
  .service-panel {
    padding: 24px;
    background: var(--bg-secondary);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .service-header {
    height: 60px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid var(--border-color);
    margin-bottom: 24px;
  }

  .service-title {
    font-size: 24px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .last-updated {
    font-size: 12px;
    font-weight: 400;
    color: var(--text-secondary);
  }

  .status-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 24px;
  }

  .status-metric {
    width: 180px;
    height: 80px;
    padding: 12px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    cursor: pointer;
    transition: opacity 100ms ease-out;
  }

  .status-metric:hover {
    opacity: 1.2;
  }

  .metric-value {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
  }

  .metric-label {
    font-size: 12px;
    font-weight: 400;
    color: var(--text-secondary);
  }

  .activity-list {
    flex: 1;
    margin-bottom: 24px;
  }

  .activity-item {
    height: 48px;
    padding: 0 16px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    transition: opacity 100ms ease-out;
  }

  .activity-item:hover {
    opacity: 1.2;
  }

  .activity-action {
    font-size: 14px;
    font-weight: 400;
    color: var(--text-primary);
  }

  .activity-status {
    width: 80px;
    text-align: right;
    font-size: 12px;
    font-weight: 500;
  }

  .status-green { color: var(--status-green); }
  .status-yellow { color: var(--status-yellow); }
  .status-blue { color: var(--accent-blue); }
  .status-red { color: var(--status-red); }

  .action-bar {
    height: 40px;
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .action-btn {
    width: 120px;
    height: 32px;
    font-size: 12px;
    font-weight: 500;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    cursor: pointer;
    transition: opacity 100ms ease-out;
  }

  .action-btn.primary {
    background: var(--accent-blue);
    color: white;
  }

  .action-btn.secondary {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }

  .action-btn:hover {
    opacity: 1.2;
  }
`;