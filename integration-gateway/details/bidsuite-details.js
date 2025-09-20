/**
 * 🎯 BIDSUITE DETAIL PANEL
 * Right-side expansion panel for detailed BidSuite data
 * Max 15KB bundle size - Lazy loaded on click
 */

export class BidSuiteDetails {
  constructor(orchestrator) {
    this.orchestrator = orchestrator;
    this.containerId = 'bidsuite-detail-panel';
  }

  /**
   * Render detailed view based on clicked element
   */
  async render(type, identifier) {
    switch(type) {
      case 'metric':
        return await this.renderMetricDetails(identifier);
      case 'activity':  
        return await this.renderActivityDetails(identifier);
      case 'opportunities':
        return await this.renderOpportunities();
      case 'performance':
        return await this.renderPerformance();
      default:
        return await this.renderOpportunities();
    }
  }

  /**
   * Render opportunities list with drill-down capability
   */
  async renderOpportunities() {
    const opportunities = await this.fetchOpportunities();
    
    return `
      <div class="detail-panel" id="${this.containerId}">
        <!-- Header: 80px height -->
        <div class="detail-header">
          <h3 class="detail-title">ACTIVE OPPORTUNITIES</h3>
          <button class="close-btn" data-action="close">✕</button>
        </div>

        <!-- Scrollable Content -->
        <div class="detail-content">
          <!-- Opportunity Filters -->
          <div class="opportunity-filters">
            <select class="filter-select" data-filter="status">
              <option value="all">All Status</option>
              <option value="qualified">Qualified</option>
              <option value="submitted">Bid Submitted</option>
              <option value="reviewing">Under Review</option>
            </select>
            <select class="filter-select" data-filter="value">
              <option value="all">All Values</option>
              <option value="high">$50K+</option>
              <option value="medium">$10K-$50K</option>
              <option value="low">Under $10K</option>
            </select>
          </div>

          <!-- Opportunities List -->
          <div class="opportunities-container">
            ${opportunities.map((opp, index) => `
              <div class="opportunity-card clickable" data-opportunity="${index}">
                <div class="opp-header">
                  <div class="opp-title">${opp.title}</div>
                  <div class="opp-value">$${opp.value}</div>
                </div>
                <div class="opp-details">
                  <div class="opp-client">${opp.client}</div>
                  <div class="opp-status status-${opp.statusColor}">${opp.status}</div>
                </div>
                <div class="opp-timeline">
                  <div class="deadline">Deadline: ${opp.deadline}</div>
                  <div class="win-probability">Win Rate: ${opp.winProbability}%</div>
                </div>
              </div>
            `).join('')}
          </div>

          <!-- Pagination -->
          <div class="pagination">
            <button class="page-btn" data-page="prev">← Previous</button>
            <span class="page-info">Page 1 of 3</span>
            <button class="page-btn" data-page="next">Next →</button>
          </div>
        </div>

        <!-- Footer Actions: 60px height -->
        <div class="detail-footer">
          <button class="detail-action-btn primary">EXPORT LIST</button>
          <button class="detail-action-btn secondary">ADD MANUAL</button>
        </div>
      </div>
    `;
  }

  /**
   * Render performance metrics with charts
   */
  async renderPerformance() {
    const performance = await this.fetchPerformanceData();
    
    return `
      <div class="detail-panel" id="${this.containerId}">
        <div class="detail-header">
          <h3 class="detail-title">PERFORMANCE ANALYTICS</h3>
          <button class="close-btn" data-action="close">✕</button>
        </div>

        <div class="detail-content">
          <!-- Performance Summary -->
          <div class="performance-summary">
            <div class="perf-metric">
              <div class="perf-value">34%</div>
              <div class="perf-label">Overall Win Rate</div>
            </div>
            <div class="perf-metric">
              <div class="perf-value">$847K</div>
              <div class="perf-label">Total Pipeline</div>
            </div>
            <div class="perf-metric">
              <div class="perf-value">23</div>
              <div class="perf-label">Active Bids</div>
            </div>
          </div>

          <!-- Chart Area: 360x200px max -->
          <div class="chart-container">
            <div class="chart-header">
              <h4>Win Rate Trend (Last 6 Months)</h4>
            </div>
            <div class="chart-placeholder">
              <!-- Chart would be rendered here -->
              <div class="chart-mock">
                📈 Chart: 28% → 31% → 29% → 34% → 36% → 34%
              </div>
            </div>
          </div>

          <!-- Performance Breakdown -->
          <div class="performance-breakdown">
            <div class="breakdown-section">
              <h4>By Industry</h4>
              <div class="breakdown-item">
                <span>Technology</span>
                <span class="breakdown-value">42% (12 wins)</span>
              </div>
              <div class="breakdown-item">
                <span>Healthcare</span>
                <span class="breakdown-value">28% (8 wins)</span>
              </div>
              <div class="breakdown-item">
                <span>Finance</span>
                <span class="breakdown-value">31% (5 wins)</span>
              </div>
            </div>

            <div class="breakdown-section">
              <h4>By Project Size</h4>
              <div class="breakdown-item">
                <span>Large ($100K+)</span>
                <span class="breakdown-value">25% (3 wins)</span>
              </div>
              <div class="breakdown-item">
                <span>Medium ($25K-$100K)</span>
                <span class="breakdown-value">38% (15 wins)</span>
              </div>
              <div class="breakdown-item">
                <span>Small (Under $25K)</span>
                <span class="breakdown-value">47% (22 wins)</span>
              </div>
            </div>
          </div>
        </div>

        <div class="detail-footer">
          <button class="detail-action-btn primary">FULL REPORT</button>
          <button class="detail-action-btn secondary">EXPORT DATA</button>
        </div>
      </div>
    `;
  }

  /**
   * Render specific activity details
   */
  async renderActivityDetails(activityIndex) {
    const activity = await this.fetchActivityDetails(activityIndex);
    
    return `
      <div class="detail-panel" id="${this.containerId}">
        <div class="detail-header">
          <h3 class="detail-title">ACTIVITY DETAILS</h3>
          <button class="close-btn" data-action="close">✕</button>
        </div>

        <div class="detail-content">
          <div class="activity-detail">
            <h4>${activity.title}</h4>
            <div class="activity-meta">
              <div class="meta-item">
                <span class="meta-label">Status:</span>
                <span class="meta-value status-${activity.statusColor}">${activity.status}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Client:</span>
                <span class="meta-value">${activity.client}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Value:</span>
                <span class="meta-value">$${activity.value}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Deadline:</span>
                <span class="meta-value">${activity.deadline}</span>
              </div>
            </div>

            <div class="activity-description">
              <h5>Description</h5>
              <p>${activity.description}</p>
            </div>

            <div class="activity-timeline">
              <h5>Timeline</h5>
              ${activity.timeline.map(event => `
                <div class="timeline-item">
                  <div class="timeline-date">${event.date}</div>
                  <div class="timeline-action">${event.action}</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <div class="detail-footer">
          <button class="detail-action-btn primary">UPDATE STATUS</button>
          <button class="detail-action-btn secondary">VIEW PROPOSAL</button>
        </div>
      </div>
    `;
  }

  /**
   * Fetch opportunities data
   */
  async fetchOpportunities() {
    return [
      {
        title: 'Enterprise CRM Development',
        client: 'TechCorp Solutions', 
        value: '127,000',
        status: 'BID SUBMITTED',
        statusColor: 'green',
        deadline: 'Oct 15, 2024',
        winProbability: 42
      },
      {
        title: 'Healthcare Analytics Platform',
        client: 'MedDevice Inc',
        value: '85,000', 
        status: 'PROPOSAL SENT',
        statusColor: 'yellow',
        deadline: 'Oct 22, 2024',
        winProbability: 28
      },
      {
        title: 'Financial Planning Tool',
        client: 'FinanceFirst LLC',
        value: '63,000',
        status: 'REVIEWING',
        statusColor: 'blue', 
        deadline: 'Nov 1, 2024',
        winProbability: 35
      }
    ];
  }

  /**
   * Fetch performance analytics
   */
  async fetchPerformanceData() {
    return {
      winRate: 34,
      totalPipeline: 847000,
      activeBids: 23,
      monthlyTrend: [28, 31, 29, 34, 36, 34]
    };
  }

  /**
   * Fetch specific activity details
   */
  async fetchActivityDetails(index) {
    const activities = [
      {
        title: 'Software Development RFP',
        client: 'TechCorp Solutions',
        value: '127,000',
        status: 'BID SUBMITTED', 
        statusColor: 'green',
        deadline: 'October 15, 2024',
        description: 'Enterprise-grade CRM system with advanced analytics, custom reporting, and integration capabilities for mid-market companies.',
        timeline: [
          { date: 'Sep 12', action: 'Opportunity identified by Dr. Match' },
          { date: 'Sep 13', action: 'Initial qualification completed' },
          { date: 'Sep 15', action: 'Proposal drafted and reviewed' },
          { date: 'Sep 18', action: 'Bid submitted to client' }
        ]
      }
    ];
    
    return activities[index] || activities[0];
  }
}

// CSS styles for detail panel
export const bidSuiteDetailStyles = `
  .detail-panel {
    width: 100%;
    height: 100%;
    background: var(--bg-secondary);
    border-left: 1px solid var(--border-color);
    display: flex;
    flex-direction: column;
  }

  .detail-header {
    height: 80px;
    padding: 20px 24px;
    border-bottom: 1px solid var(--border-color);
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .detail-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    color: var(--text-secondary);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .detail-content {
    flex: 1;
    padding: 24px;
    overflow-y: auto;
  }

  .opportunity-card {
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 16px;
    margin-bottom: 16px;
    cursor: pointer;
    transition: opacity 100ms ease-out;
  }

  .opportunity-card:hover {
    opacity: 1.2;
  }

  .opp-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .opp-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .opp-value {
    font-size: 14px;
    font-weight: 600;
    color: var(--status-green);
  }

  .opp-value::before {
    content: "$";
  }

  .chart-container {
    width: 360px;
    height: 200px;
    background: var(--bg-tertiary);
    border: 1px solid var(--border-color);
    border-radius: 4px;
    padding: 16px;
    margin: 24px 0;
  }

  .chart-mock {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 140px;
    color: var(--text-secondary);
    font-size: 14px;
  }

  .detail-footer {
    height: 60px;
    padding: 0 24px;
    border-top: 1px solid var(--border-color);
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .detail-action-btn {
    height: 36px;
    padding: 0 16px;
    font-size: 12px;
    font-weight: 500;
    border: 1px solid var(--border-color);
    border-radius: 4px;
    cursor: pointer;
  }

  .detail-action-btn.primary {
    background: var(--accent-blue);
    color: white;
  }

  .detail-action-btn.secondary {
    background: var(--bg-tertiary);
    color: var(--text-primary);
  }
`;