/**
 * WFA Swarm Queue - Data Processing Pipeline
 * Manages data flow from ASOOS Flyer to Professor Lee curation
 */

class WFASwarmQueue {
  constructor() {
    this.processingQueue = [];
    this.completedTasks = [];
    this.errorTasks = [];
    this.activeProcessors = new Map();
    this.maxConcurrentTasks = 5;
    this.retryDelays = [5000, 15000, 45000]; // Exponential backoff
    this.taskProcessors = new Map();
    this.initialized = false;
        
    console.log('📋 WFA Swarm Queue constructed');
  }

  /**
     * Initialize the WFA Swarm Queue system
     */
  async initialize() {
    if (this.initialized) {
      console.log('📋 WFA Swarm Queue already initialized');
      return true;
    }
        
    try {
      console.log('🔄 Initializing WFA Swarm Queue...');
            
      // Set up default task processors
      this.setupDefaultProcessors();
            
      // Initialize any required connections or resources
      await this.initializeConnections();
            
      this.initialized = true;
      console.log('✅ WFA Swarm Queue initialized successfully');
            
      return true;
            
    } catch (error) {
      console.error('❌ Failed to initialize WFA Swarm Queue:', error);
      throw error;
    }
  }

  /**
     * Set up default task processors
     */
  setupDefaultProcessors() {
    // Register default processors for common tasks
    this.registerTaskProcessor('data-processing', async (payload) => {
      console.log('📊 Processing data task');
      return { status: 'processed', timestamp: new Date().toISOString() };
    });
        
    this.registerTaskProcessor('quality-check', async (payload) => {
      console.log('🔍 Performing quality check');
      return await this.performDataQualityCheck(payload);
    });
        
    console.log('🛠️ Default task processors registered');
  }

  /**
     * Initialize any required connections
     */
  async initializeConnections() {
    // Initialize any external connections if needed
    // This is a placeholder for future expansion
    console.log('🔗 Queue connections initialized');
    return true;
  }

  /**
     * Register a task processor for a specific task type
     */
  registerTaskProcessor(taskType, processor) {
    this.taskProcessors.set(taskType, processor);
    console.log(`📋 Registered processor for task type: ${taskType}`);
  }

  /**
     * Enqueue a new task for processing
     * @param {string} destination - Where to send the processed data
     * @param {Object} payload - The data to process
     * @returns {Promise<Object>} Processing result
     */
  async enqueue(destination, payload) {
    const task = {
      id: this.generateTaskId(),
      destination,
      payload,
      status: 'queued',
      timestamp: new Date().toISOString(),
      retryCount: 0,
      priority: payload.priority || 'medium'
    };

    // Insert task based on priority
    this.insertTaskByPriority(task);
        
    console.log(`📤 WFA Queue: Enqueued task ${task.id} for ${destination} (Priority: ${task.priority})`);
        
    // Start processing if not at max capacity
    this.processNextTask();
        
    return task.id;
  }

  insertTaskByPriority(newTask) {
    const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'strategic': 3 };
    const newPriority = priorityOrder[newTask.priority] || 2;
        
    let insertIndex = this.processingQueue.length;
    for (let i = 0; i < this.processingQueue.length; i++) {
      const taskPriority = priorityOrder[this.processingQueue[i].priority] || 2;
      if (newPriority < taskPriority) {
        insertIndex = i;
        break;
      }
    }
        
    this.processingQueue.splice(insertIndex, 0, newTask);
  }

  async processNextTask() {
    // Check if we're at capacity
    if (this.activeProcessors.size >= this.maxConcurrentTasks) {
      return;
    }

    // Get next task
    const task = this.processingQueue.shift();
    if (!task) {
      return;
    }

    // Start processing
    this.activeProcessors.set(task.id, task);
    this.processTask(task);
  }

  async processTask(task) {
    task.status = 'processing';
    task.processingStarted = new Date().toISOString();
        
    console.log(`⚙️ WFA Queue: Processing task ${task.id} for ${task.destination}`);
        
    try {
      let result;
            
      switch (task.destination) {
      case 'professor-lee-curation':
        result = await this.sendToProfessorLee(task.payload);
        break;
      case 'srix-leaders':
        result = await this.sendToSRIXLeaders(task.payload);
        break;
      case 'mcp-deployment':
        result = await this.sendToMCPDeployment(task.payload);
        break;
      case 'data-quality-check':
        result = await this.performDataQualityCheck(task.payload);
        break;
      default:
        throw new Error(`Unknown destination: ${task.destination}`);
      }

      // Task completed successfully
      task.status = 'completed';
      task.result = result;
      task.processingCompleted = new Date().toISOString();
      task.processingDuration = new Date(task.processingCompleted).getTime() - 
                                     new Date(task.processingStarted).getTime();
            
      this.completedTasks.push(task);
      this.activeProcessors.delete(task.id);
            
      console.log(`✅ WFA Queue: Task ${task.id} completed in ${task.processingDuration}ms`);
            
      // Process next task
      this.processNextTask();
            
      return result;
            
    } catch (error) {
      console.error(`❌ WFA Queue: Task ${task.id} failed:`, error.message);
            
      task.status = 'error';
      task.error = error.message;
      task.retryCount++;
            
      // Retry logic with exponential backoff
      if (task.retryCount <= this.retryDelays.length) {
        const retryDelay = this.retryDelays[task.retryCount - 1];
                
        console.log(`🔄 WFA Queue: Retrying task ${task.id} in ${retryDelay}ms (attempt ${task.retryCount})`);
                
        setTimeout(() => {
          task.status = 'queued';
          this.insertTaskByPriority(task);
          this.processNextTask();
        }, retryDelay);
                
      } else {
        // Max retries exceeded
        console.error(`💀 WFA Queue: Task ${task.id} exceeded max retries, moving to error queue`);
        task.status = 'failed';
        task.finalError = new Date().toISOString();
        this.errorTasks.push(task);
      }
            
      this.activeProcessors.delete(task.id);
      this.processNextTask();
            
      throw error;
    }
  }

  /**
     * Send processed data to Professor Lee for curation
     */
  async sendToProfessorLee(payload) {
    console.log('👨‍🎓 Delivering intelligence to Professor Lee...');
        
    const curatedData = {
      deliveryId: this.generateTaskId(),
      timestamp: new Date().toISOString(),
      source: 'WFA-Swarm-ASOOS-Flyer',
      type: payload.type || 'market_intelligence',
      priority: payload.priority,
            
      // Core intelligence data
      intelligence: payload.data,
            
      // Processing instructions for Professor Lee
      instructions: {
        assignMCPServers: payload.processingInstructions?.assignMCPServers || true,
        calculatePriorityScores: payload.processingInstructions?.calculatePriorityScores || true,
        assignSRIXLeaders: payload.processingInstructions?.assignSRIXLeaders || true,
        generateCompetitiveAnalysis: payload.processingInstructions?.generateCompetitiveAnalysis || true
      },
            
      // Data quality metrics
      qualityMetrics: {
        dataCompleteness: this.calculateDataCompleteness(payload.data),
        sourceReliability: this.calculateSourceReliability(payload.data),
        informationRecency: this.calculateInformationRecency(payload.data)
      },
            
      // Suggested actions
      suggestedActions: this.generateSuggestedActions(payload.data, payload.priority)
    };

    // Save to Professor Lee's Google Drive folder (simulated)
    await this.saveToGoogleDrive(curatedData);
        
    // Generate summary report
    const summary = this.generateDeliveryReport(curatedData);
        
    console.log(`✅ Intelligence delivered to Professor Lee - ${summary.organizationCount} organizations processed`);
        
    return {
      status: 'delivered',
      deliveryId: curatedData.deliveryId,
      summary,
      googleDriveLocation: `Professor-Lee-Human-Work-Intelligence/WFA-Intelligence/${curatedData.deliveryId}`,
      nextSteps: [
        'Review organization priority scores',
        'Assign MCP servers to high-priority targets', 
        'Coordinate with assigned sRIX leaders',
        'Begin competitive analysis phase'
      ]
    };
  }

  /**
     * Send processed data to sRIX leaders for sector-specific analysis
     */
  async sendToSRIXLeaders(payload) {
    console.log('🎖️ Distributing intelligence to sRIX leaders...');
        
    const sectorAssignments = this.distributeBySector(payload.data);
    const results = [];
        
    for (const [sector, organizations] of sectorAssignments.entries()) {
      const assignedLeader = this.getSRIXLeaderForSector(sector);
            
      const distribution = {
        leader: assignedLeader,
        sector: sector,
        organizations: organizations,
        assignedAt: new Date().toISOString(),
        priority: payload.priority,
        instructions: `Analyze ${organizations.length} organizations in ${sector} sector for MCP deployment readiness`
      };
            
      results.push(distribution);
      console.log(`📋 Assigned ${organizations.length} ${sector} organizations to ${assignedLeader}`);
    }
        
    return {
      status: 'distributed',
      distributionCount: results.length,
      assignments: results
    };
  }

  /**
     * Send data for MCP server deployment planning
     */
  async sendToMCPDeployment(payload) {
    console.log('🚀 Preparing MCP deployment assignments...');
        
    const deploymentPlan = {
      planId: this.generateTaskId(),
      generatedAt: new Date().toISOString(),
      organizations: payload.data.organizationProfiles || [],
      mcpServerAssignments: [],
      deploymentStrategy: payload.priority
    };
        
    // Generate MCP server assignments
    deploymentPlan.organizations.forEach((org, index) => {
      const assignment = this.generateMCPAssignment(org, payload.data.sector, index);
      deploymentPlan.mcpServerAssignments.push(assignment);
    });
        
    return {
      status: 'planned',
      planId: deploymentPlan.planId,
      serversAssigned: deploymentPlan.mcpServerAssignments.length,
      deploymentPlan
    };
  }

  /**
     * Perform data quality assessment
     */
  async performDataQualityCheck(payload) {
    console.log('🔍 Performing data quality assessment...');
        
    const qualityMetrics = {
      completeness: this.calculateDataCompleteness(payload.data),
      accuracy: this.calculateDataAccuracy(payload.data),
      timeliness: this.calculateInformationRecency(payload.data),
      consistency: this.calculateDataConsistency(payload.data),
      reliability: this.calculateSourceReliability(payload.data)
    };
        
    const overallQuality = Object.values(qualityMetrics).reduce((a, b) => a + b, 0) / 5;
        
    return {
      status: 'assessed',
      overallQuality: Math.round(overallQuality),
      metrics: qualityMetrics,
      recommendations: this.generateQualityRecommendations(qualityMetrics)
    };
  }

  // Utility methods for data processing
  calculateDataCompleteness(data) {
    if (!data || !data.organizationProfiles) return 0;
        
    let totalFields = 0;
    let completedFields = 0;
        
    data.organizationProfiles.forEach(profile => {
      const requiredFields = ['name', 'domain', 'sector', 'location', 'size'];
      totalFields += requiredFields.length;
            
      requiredFields.forEach(field => {
        if (profile[field] && profile[field].length > 0) {
          completedFields++;
        }
      });
    });
        
    return totalFields > 0 ? Math.round((completedFields / totalFields) * 100) : 0;
  }

  calculateSourceReliability(data) {
    if (!data || !data.sources) return 0;
        
    const reliabilityScores = {
      linkedin: 95,
      website: 85,
      search: 70,
      social: 60,
      financial: 90,
      news: 75
    };
        
    const sources = Object.keys(data.sources);
    const avgReliability = sources.reduce((sum, source) => {
      return sum + (reliabilityScores[source] || 50);
    }, 0) / sources.length;
        
    return Math.round(avgReliability || 0);
  }

  calculateInformationRecency(data) {
    if (!data || !data.timestamp) return 0;
        
    const dataAge = Date.now() - new Date(data.timestamp).getTime();
    const hoursOld = dataAge / (1000 * 60 * 60);
        
    // Score decreases as data gets older
    if (hoursOld < 1) return 100;
    if (hoursOld < 6) return 90;
    if (hoursOld < 24) return 80;
    if (hoursOld < 72) return 70;
    return 50;
  }

  calculateDataAccuracy(data) {
    // Simplified accuracy calculation based on cross-source verification
    return 85; // Placeholder - would implement cross-referencing logic
  }

  calculateDataConsistency(data) {
    // Simplified consistency check
    return 80; // Placeholder - would implement consistency checking
  }

  generateSuggestedActions(data, priority) {
    const actions = [
      'Review organization profiles for completeness',
      'Validate contact information and decision makers',
      'Cross-reference competitive intelligence',
      'Schedule sRIX leader assignments'
    ];
        
    if (priority === 'critical') {
      actions.unshift('Prioritize immediate MCP server deployment');
      actions.push('Prepare executive-level outreach materials');
    }
        
    return actions;
  }

  generateQualityRecommendations(metrics) {
    const recommendations = [];
        
    if (metrics.completeness < 80) {
      recommendations.push('Enhance data collection to improve completeness');
    }
    if (metrics.reliability < 75) {
      recommendations.push('Incorporate more reliable data sources');
    }
    if (metrics.timeliness < 70) {
      recommendations.push('Implement more frequent data refresh cycles');
    }
        
    return recommendations;
  }

  distributeBySector(data) {
    const sectorMap = new Map();
        
    if (data.organizationProfiles) {
      data.organizationProfiles.forEach(profile => {
        const sector = profile.sector || 'unclassified';
        if (!sectorMap.has(sector)) {
          sectorMap.set(sector, []);
        }
        sectorMap.get(sector).push(profile);
      });
    }
        
    return sectorMap;
  }

  getSRIXLeaderForSector(sector) {
    const srixAssignments = {
      'technology_software': 'Dr. Claude sRIX',
      'healthcare_medical': 'Dr. Lucy sRIX',
      'financial_services': 'Dr. Burby sRIX',
      'manufacturing_industrial': 'Dr. Grant sRIX',
      'energy_utilities': 'Dr. Roark sRIX',
      'retail_consumer': 'Dr. Sabina sRIX',
      'media_communications': 'Dr. Memoria sRIX',
      'transportation_logistics': 'Dr. Roark sRIX',
      'education_training': 'Professor Lee sRIX',
      'government_public': 'Dr. Grant sRIX',
      'emerging_specialized': 'Dr. Claude sRIX',
      'global_expansion': 'Dr. Match sRIX'
    };
        
    return srixAssignments[sector] || 'Dr. Claude sRIX';
  }

  generateMCPAssignment(org, sector, index) {
    // Simplified MCP server assignment logic
    const sectorRanges = {
      'technology_software': [1, 850],
      'healthcare_medical': [851, 1600],
      'financial_services': [1601, 2350],
      // ... other sectors
    };
        
    const range = sectorRanges[sector] || [7526, 10000];
    const serverId = range[0] + (index % (range[1] - range[0] + 1));
        
    return {
      organization: org.name || `Organization_${index}`,
      mcpServer: `mcp${serverId}.asoos.2100.cool`,
      srixLeader: this.getSRIXLeaderForSector(sector),
      priority: this.calculateOrgPriority(org),
      deploymentApproach: this.generateDeploymentApproach(org)
    };
  }

  calculateOrgPriority(org) {
    // Simplified priority calculation
    return Math.floor(Math.random() * 100) + 1; // 1-100
  }

  generateDeploymentApproach(org) {
    const approaches = [
      'Executive-level direct approach',
      'Technical team integration',
      'Department pilot program',
      'Educational relationship building'
    ];
        
    return approaches[Math.floor(Math.random() * approaches.length)];
  }

  async saveToGoogleDrive(data) {
    // Simulate Google Drive save
    console.log(`💾 Saving to Google Drive: ${data.deliveryId}.json`);
    return true;
  }

  generateDeliveryReport(data) {
    return {
      organizationCount: data.intelligence?.organizationProfiles?.length || 0,
      dataQuality: data.qualityMetrics,
      recommendedActions: data.suggestedActions.length,
      mcpServersReady: true
    };
  }

  generateTaskId() {
    return `wfa-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Queue management methods
  getQueueStatus() {
    return {
      queued: this.processingQueue.length,
      active: this.activeProcessors.size,
      completed: this.completedTasks.length,
      errors: this.errorTasks.length,
      capacity: `${this.activeProcessors.size}/${this.maxConcurrentTasks}`
    };
  }

  clearCompletedTasks() {
    const clearedCount = this.completedTasks.length;
    this.completedTasks = [];
    console.log(`🧹 Cleared ${clearedCount} completed tasks from queue`);
    return clearedCount;
  }

  reprocessFailedTasks() {
    const failedTasks = this.errorTasks.splice(0);
    failedTasks.forEach(task => {
      task.status = 'queued';
      task.retryCount = 0;
      task.error = null;
      this.insertTaskByPriority(task);
    });
        
    console.log(`🔄 Requeued ${failedTasks.length} failed tasks for processing`);
    this.processNextTask();
        
    return failedTasks.length;
  }
}

module.exports = { WFASwarmQueue };
