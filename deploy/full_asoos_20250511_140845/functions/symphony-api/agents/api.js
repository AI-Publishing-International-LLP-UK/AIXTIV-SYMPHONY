const express = require('express');
const router = express.Router();

// Mock agent data
const agents = [
  {
    id: 'lucy',
    name: 'Dr. Lucy',
    system: 'Flight Memory',
    status: 'active',
    capabilities: ['Memory Management', 'Decision Tracking', 'Strategic Continuity'],
    metrics: {
      totalDecisions: 4872,
      memoryAccuracy: 0.982,
      strategicInsights: 342
    }
  },
  {
    id: 'claude',
    name: 'Dr. Claude',
    system: 'Orchestration',
    status: 'active',
    capabilities: ['Task Mapping', 'Resource Allocation', 'Workflow Optimization'],
    metrics: {
      tasksManaged: 12485,
      resourceEfficiency: 0.891,
      optimizationScore: 93.7
    }
  },
  {
    id: 'grant',
    name: 'Dr. Grant',
    system: 'Security',
    status: 'active',
    capabilities: ['Authentication', 'Perimeter Security', 'Data Protection'],
    metrics: {
      securityIncidents: 0,
      authenticationRequests: 85721,
      threatsPrevented: 312
    }
  },
  {
    id: 'sabina',
    name: 'Dr. Sabina',
    system: 'Dream Commander',
    status: 'active',
    capabilities: ['Client Psychology', 'Sales Cadence', 'Predictive Analysis'],
    metrics: {
      predictionAccuracy: 0.874,
      salesInsights: 1432,
      clientSatisfaction: 0.92
    }
  },
  {
    id: 'burby',
    name: 'Dr. Burby',
    system: 'Blockchain',
    status: 'active',
    capabilities: ['Compliance Logic', 'Transaction Verification', 'Smart Contracts'],
    metrics: {
      transactionsVerified: 67234,
      complianceScore: 0.999,
      contractEfficiency: 0.87
    }
  },
  {
    id: 'lee',
    name: 'Prof. Lee',
    system: 'Q4D Framework',
    status: 'active',
    capabilities: ['Complex Input Analysis', 'Information Decoding', 'Action Synthesis'],
    metrics: {
      complexityReduction: 0.752,
      actionableInsights: 3421,
      informationProcessed: 89732
    }
  }
];

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: agents
  });
});

router.get('/:id', (req, res) => {
  const agent = agents.find(a => a.id === req.params.id);
  
  if (agent) {
    res.json({
      success: true,
      data: agent
    });
  } else {
    res.status(404).json({
      success: false,
      message: 'Agent not found'
    });
  }
});

router.post('/:id/action', (req, res) => {
  const { id } = req.params;
  const { action, parameters } = req.body;
  
  const agent = agents.find(a => a.id === id);
  
  if (!agent) {
    return res.status(404).json({
      success: false,
      message: 'Agent not found'
    });
  }
  
  // Simulate agent action
  console.log(`[Agent] ${agent.name} performing action: ${action}`);
  
  // Simple mock response
  res.json({
    success: true,
    data: {
      agent: agent.name,
      action,
      status: 'completed',
      result: `${action} processed successfully by ${agent.name}`,
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = router;
