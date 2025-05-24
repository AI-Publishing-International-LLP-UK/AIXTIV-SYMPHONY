const express = require('express');
const router = express.Router();

// Mock visualization data
const visualizations = {
  symphony: {
    id: 'symphony-view',
    name: 'Symphony View',
    components: [
      { id: 'comp-1', name: 'Integration Gateway', status: 'active', connections: 8 },
      { id: 'comp-2', name: 'Agent Manager', status: 'active', connections: 12 },
      { id: 'comp-3', name: 'Memory System', status: 'active', connections: 5 },
      { id: 'comp-4', name: 'Domain Controller', status: 'active', connections: 3 },
      { id: 'comp-5', name: 'Authentication Service', status: 'active', connections: 7 },
      { id: 'comp-6', name: 'Analytics Engine', status: 'active', connections: 4 }
    ],
    metrics: {
      totalRequests: 2457,
      averageResponseTime: 120,
      errorRate: 0.02,
      activeUsers: 42
    }
  },
  greenscreen: {
    id: 'greenscreen-studio',
    name: 'Green Screen Studio',
    layers: [
      { id: 'layer-1', name: 'Background', visible: true, locked: false, type: 'image' },
      { id: 'layer-2', name: 'Foreground', visible: true, locked: false, type: 'video' },
      { id: 'layer-3', name: 'Overlay', visible: true, locked: false, type: 'effects' }
    ],
    effects: [
      { id: 'effect-1', name: 'Color Correction', enabled: true },
      { id: 'effect-2', name: 'Blur', enabled: false },
      { id: 'effect-3', name: 'Particle System', enabled: true }
    ]
  },
  orchestrator: {
    id: 'claude-orchestrator',
    name: 'Claude Orchestrator Console',
    logs: [
      { timestamp: '2025-05-10T22:45:33Z', level: 'info', message: 'System initialized' },
      { timestamp: '2025-05-10T22:45:34Z', level: 'info', message: 'Request routed through Dr. Claude Orchestrator' },
      { timestamp: '2025-05-10T22:45:35Z', level: 'info', message: 'Connected to Firebase' },
      { timestamp: '2025-05-10T22:45:37Z', level: 'info', message: 'Domain autoscaling rules loaded' },
      { timestamp: '2025-05-10T22:45:40Z', level: 'info', message: 'Ready for operation' },
      { timestamp: '2025-05-10T22:46:12Z', level: 'info', message: 'Domain verification check passed' },
      { timestamp: '2025-05-10T22:47:05Z', level: 'info', message: 'Scaling rules validated' },
      { timestamp: '2025-05-10T22:48:33Z', level: 'info', message: 'Current instance count: 3' },
      { timestamp: '2025-05-10T22:49:27Z', level: 'info', message: 'CPU utilization at 45%' },
      { timestamp: '2025-05-10T22:50:14Z', level: 'info', message: 'Memory usage nominal' },
      { timestamp: '2025-05-10T22:51:02Z', level: 'info', message: 'Connection pool health: 100%' },
      { timestamp: '2025-05-10T22:52:19Z', level: 'info', message: 'Request routed through Dr. Claude Orchestrator' }
    ],
    stats: {
      domains: 317,
      activeMonitors: 8,
      processedEvents: 12942,
      healthScore: 98.7
    }
  },
  memory: {
    id: 'anthology-memory',
    name: 'Anthology Memory Flowchart',
    nodes: [
      { id: 'node-1', type: 'input', connections: ['node-2', 'node-3'] },
      { id: 'node-2', type: 'processing', connections: ['node-4'] },
      { id: 'node-3', type: 'processing', connections: ['node-5'] },
      { id: 'node-4', type: 'memory', connections: ['node-6'] },
      { id: 'node-5', type: 'memory', connections: ['node-6'] },
      { id: 'node-6', type: 'output', connections: [] }
    ],
    stats: {
      memoryUnits: 732,
      connections: 2458,
      activePaths: 37
    }
  },
  agents: {
    id: 'asos-agents',
    name: 'ASOS Agent View',
    agents: [
      { id: 'agent-1', name: 'Dr. Lucy', system: 'Flight Memory', status: 'active', load: 75 },
      { id: 'agent-2', name: 'Dr. Claude', system: 'Orchestration', status: 'active', load: 80 },
      { id: 'agent-3', name: 'Dr. Grant', system: 'Security', status: 'active', load: 100 },
      { id: 'agent-4', name: 'Dr. Sabina', system: 'Dream Commander', status: 'active', load: 65 },
      { id: 'agent-5', name: 'Dr. Burby', system: 'Blockchain', status: 'active', load: 82 },
      { id: 'agent-6', name: 'Prof. Lee', system: 'Q4D Framework', status: 'active', load: 73 }
    ],
    system: {
      version: '1.2.5',
      totalAgents: 6,
      activeOperations: 24,
      load: 0.68
    }
  }
};

router.get('/:type', (req, res) => {
  const { type } = req.params;
  
  if (visualizations[type]) {
    setTimeout(() => {
      res.json({
        success: true,
        data: visualizations[type]
      });
    }, 500); // Add slight delay to simulate network
  } else {
    res.status(404).json({
      success: false,
      message: 'Visualization type not found'
    });
  }
});

module.exports = router;
