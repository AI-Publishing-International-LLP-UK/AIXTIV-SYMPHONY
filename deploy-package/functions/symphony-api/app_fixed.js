const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const app = express();
const port = 3030;

console.log('Starting Symphony API server...');

// Check required dependencies
try {
  console.log('Checking required modules...');
  require.resolve('express');
  require.resolve('cors');
  require.resolve('body-parser');
  console.log('Required modules found.');
} catch (err) {
  console.error('ERROR: Missing required module. Please run npm install');
  console.error(err.message);
  process.exit(1);
}

// Check for API modules
const apiModules = {
  auth: './auth/api',
  visualization: './visualization/api',
  agents: './agents/api'
};

console.log('Checking API modules...');
Object.entries(apiModules).forEach(([name, path]) => {
  try {
    require.resolve(path);
    console.log(`✓ ${name} module found`);
  } catch (err) {
    console.warn(`✗ ${name} module not found: ${err.message}`);
    apiModules[name] = null;
  }
});

// Check static files directory
const publicDir = path.join(__dirname, '../public');
console.log(`Checking public directory: ${publicDir}`);
try {
  fs.accessSync(publicDir, fs.constants.R_OK);
  console.log('✓ Public directory found');
} catch (err) {
  console.warn(`✗ Public directory not found: ${err.message}`);
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
try {
  app.use(express.static(publicDir));
  console.log('✓ Static file middleware configured');
} catch (err) {
  console.warn(`✗ Static file middleware error: ${err.message}`);
}

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
console.log('Setting up API routes...');
Object.entries(apiModules).forEach(([name, modulePath]) => {
  if (modulePath) {
    try {
      const module = require(modulePath);
      app.use(`/api/${name}`, module);
      console.log(`✓ Registered /api/${name} routes`);
    } catch (err) {
      console.error(`✗ Failed to register /api/${name} routes: ${err.message}`);
    }
  }
});

// Fallback route for API
app.use('/api/*', (req, res) => {
  console.log(`Warning: API route not found: ${req.url}`);
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Fallback route for static files
app.use('*', (req, res) => {
  if (!req.url.startsWith('/api')) {
    res.sendFile(path.join(publicDir, 'index.html'));
  }
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Create mock API responses if needed
const mockApiResponses = (app) => {
  console.log('Setting up mock API responses...');
  
  // Auth mock
  app.post('/api/auth/authenticate', (req, res) => {
    console.log('Mock auth called with:', req.body);
    res.json({
      success: true,
      sessionId: 'mock-session-123',
      user: {
        username: req.body.username || 'mockuser',
        name: req.body.username === 'roark' ? 'Phillip Corey Roark' : 'Mock User',
        role: 'admin'
      }
    });
  });

  // Visualization mock
  app.get('/api/visualization/symphony', (req, res) => {
    res.json({
      success: true,
      data: {
        components: [
          { id: 1, name: 'Integration Gateway', status: 'Online', connections: 5 },
          { id: 2, name: 'Authentication Service', status: 'Online', connections: 3 },
          { id: 3, name: 'Dr. Claude Orchestrator', status: 'Online', connections: 7 },
          { id: 4, name: 'SallyPort Security', status: 'Online', connections: 2 },
          { id: 5, name: 'Jetport API', status: 'Online', connections: 4 },
          { id: 6, name: 'Anthology System', status: 'Online', connections: 6 }
        ],
        metrics: {
          totalRequests: 1253,
          averageResponseTime: 145,
          errorRate: 0.02,
          activeUsers: 42
        }
      }
    });
  });

  // Add other mock endpoints as needed
  app.get('/api/visualization/greenscreen', (req, res) => {
    res.json({
      success: true,
      data: {
        layers: [
          { id: 1, name: 'Background' },
          { id: 2, name: 'Foreground' },
          { id: 3, name: 'Effects' }
        ],
        effects: [
          { id: 1, name: 'Blur', enabled: true },
          { id: 2, name: 'Chroma Key', enabled: true },
          { id: 3, name: 'Shadows', enabled: false },
          { id: 4, name: 'Highlights', enabled: true },
          { id: 5, name: 'Color Correction', enabled: false },
          { id: 6, name: 'Noise Reduction', enabled: true }
        ]
      }
    });
  });

  app.get('/api/visualization/orchestrator', (req, res) => {
    res.json({
      success: true,
      data: {
        logs: [
          { timestamp: Date.now() - 5000, message: 'Dr. Claude Orchestrator initializing...' },
          { timestamp: Date.now() - 4000, message: 'Establishing connection to Integration Gateway' },
          { timestamp: Date.now() - 3000, message: 'Dr. Claude Orchestrator online and monitoring' },
          { timestamp: Date.now() - 2000, message: 'Domain health check completed: All domains online' },
          { timestamp: Date.now() - 1000, message: 'Processing system events: 0 critical, 2 warnings' }
        ],
        stats: {
          domains: 12,
          activeMonitors: 4,
          processedEvents: 342,
          healthScore: 98
        }
      }
    });
  });

  app.get('/api/visualization/memory', (req, res) => {
    res.json({
      success: true,
      data: {
        nodes: [
          { id: 1, type: 'input', connections: [4, 5] },
          { id: 2, type: 'input', connections: [4] },
          { id: 3, type: 'input', connections: [6] },
          { id: 4, type: 'processing', connections: [7, 8] },
          { id: 5, type: 'processing', connections: [7, 9] },
          { id: 6, type: 'processing', connections: [9] },
          { id: 7, type: 'memory', connections: [10, 11] },
          { id: 8, type: 'memory', connections: [10] },
          { id: 9, type: 'memory', connections: [11] },
          { id: 10, type: 'output', connections: [] },
          { id: 11, type: 'output', connections: [] }
        ],
        stats: {
          memoryUnits: 124,
          connections: 425,
          activePaths: 18
        }
      }
    });
  });

  app.get('/api/visualization/agents', (req, res) => {
    res.json({
      success: true,
      data: {
        agents: [
          { id: 1, name: 'Dr. Memoria', system: 'Anthology', load: 75 },
          { id: 2, name: 'Dr. Sabina', system: 'Dream Commander', load: 45 },
          { id: 3, name: 'Dr. Roark', system: 'Wish Vision', load: 60 },
          { id: 4, name: 'Dr. Grant', system: 'Sally Port', load: 40 },
          { id: 5, name: 'Dr. Match', system: 'Bid Suite', load: 55 },
          { id: 6, name: 'Dr. Lucy', system: 'Flight Memory System', load: 80 }
        ],
        system: {
          version: '2.0.3',
          load: 0.62
        }
      }
    });
  });
  
  console.log('Mock API responses configured');
};

// Start server
try {
  // Check for actual API modules first
  const hasRealApiModules = Object.values(apiModules).some(module => module !== null);
  
  // If no real API modules, use mock responses
  if (!hasRealApiModules) {
    console.log('No API modules found, using mock responses');
    mockApiResponses(app);
  }
  
  const server = app.listen(port, () => {
    console.log(`Symphony Local API running at http://localhost:${port}`);
    console.log(`Dr. Claude Orchestrator active and monitoring system`);
  });
  
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`ERROR: Port ${port} is already in use. Please close the application using this port.`);
    } else {
      console.error('Server error:', err);
    }
    process.exit(1);
  });
} catch (err) {
  console.error('Failed to start server:', err);
  process.exit(1);
}
