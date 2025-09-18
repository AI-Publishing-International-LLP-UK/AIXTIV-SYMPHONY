const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;
const SERVICE_NAME = process.env.SERVICE_NAME || 'simple-service';

app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: SERVICE_NAME,
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.status(200).json({
    message: `${SERVICE_NAME} is running`,
    status: 'active',
    timestamp: new Date().toISOString()
  });
});

// Generic POST endpoint for service operations
app.post('/', (req, res) => {
  res.status(200).json({
    message: `${SERVICE_NAME} received request`,
    status: 'processed',
    timestamp: new Date().toISOString(),
    data: req.body
  });
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    service: SERVICE_NAME,
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 ${SERVICE_NAME} listening on port ${PORT}`);
  console.log(`✅ Health check available at http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully');
  process.exit(0);
});