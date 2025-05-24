const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const app = express();
const port = 3030;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('../public'));

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes
app.use('/api/auth', require('./auth/api'));
app.use('/api/visualization', require('./visualization/api'));
app.use('/api/agents', require('./agents/api'));

// Error handling
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(port, () => {
  console.log(`Symphony Local API running at http://localhost:${port}`);
  console.log(`Dr. Claude Orchestrator active and monitoring system`);
});
