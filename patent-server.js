const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Import patent routes
const patentRoutes = require('./routes/patentRoutes');
const patentFilingRoutes = require('./routes/patentFilingRoutes');

const app = express();
const PORT = process.env.PORT || 8080;

// Basic middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Patent routes
app.use('/api/patents', patentRoutes);
app.use('/api/filing', patentFilingRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Patent Storage System',
    timestamp: new Date().toISOString(),
    region: process.env.CLOUD_ML_REGION || 'us-central1',
    features: [
      'Patent Search API',
      'Patent Filing Service', 
      'Vector Search (Pinecone)',
      'Prior Art Search',
      'Sequence Listing Validation'
    ]
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Patent Storage System',
    version: '1.0.0',
    region: process.env.CLOUD_ML_REGION || 'us-central1',
    endpoints: {
      patentSearch: '/api/patents/search',
      patentFiling: '/api/filing/create',
      priorArt: '/api/filing/prior-art',
      fees: '/api/filing/fees',
      health: '/health'
    },
    capabilities: [
      '🔍 AI-Powered Patent Search (Pinecone + OpenAI)',
      '🏛️ Direct USPTO Patent Filing',
      '📊 11GB+ Patent Database Access',
      '🧬 Sequence Listing Validation (ST.25/ST.26)',
      '💰 Real-time Fee Calculation',
      '📈 Application Status Tracking'
    ]
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /api/patents/search',
      'POST /api/filing/create',
      'GET /api/filing/fees',
      'POST /api/filing/prior-art'
    ]
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Patent system error:', error);
  
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message,
    service: 'Patent Storage System'
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Patent Storage System running on port ${PORT}`);
  console.log(`🌍 Region: ${process.env.CLOUD_ML_REGION || 'us-central1'}`);
  console.log(`🔍 Patent Search: http://0.0.0.0:${PORT}/api/patents/search`);
  console.log(`📝 Patent Filing: http://0.0.0.0:${PORT}/api/filing/create`);
  console.log(`💚 Health Check: http://0.0.0.0:${PORT}/health`);
  
  if (process.env.PINECONE_API_KEY) {
    console.log('✅ Pinecone API key configured - vector search enabled');
  } else {
    console.log('⚠️ Pinecone API key missing - vector search disabled');
  }
  
  if (process.env.OPENAI_API_KEY) {
    console.log('✅ OpenAI API key configured - embeddings enabled');  
  } else {
    console.log('⚠️ OpenAI API key missing - embeddings disabled');
  }
});

module.exports = app;
