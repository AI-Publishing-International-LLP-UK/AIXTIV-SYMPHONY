const express = require('express');
const Patent = require('../models/PatentModel');
const PatentVectorService = require('../services/PatentVectorService');
const { cloudflareAuthentication } = require('../middleware/cloudflare-auth');

const router = express.Router();
const patentVectorService = new PatentVectorService();

// Initialize vector service
let vectorServiceReady = false;
patentVectorService.initialize()
  .then(() => {
    vectorServiceReady = true;
    console.log('✅ Patent Vector Service initialized');
  })
  .catch(error => {
    console.error('❌ Failed to initialize Patent Vector Service:', error);
  });

// Use existing OAuth2 authentication middleware
router.use(cloudflareAuthentication);

// GET /api/patents/search - Vector-powered semantic search
router.get('/search', async (req, res) => {
  try {
    const { q: query, limit = 10, includeFullData = false } = req.query;
    
    if (!query) {
      return res.status(400).json({
        error: 'Query parameter required',
        message: 'Please provide a search query using the "q" parameter'
      });
    }

    if (!vectorServiceReady) {
      return res.status(503).json({
        error: 'Vector search not available',
        message: 'Patent vector search service is initializing. Please try again in a moment.'
      });
    }

    const searchResults = await patentVectorService.searchPatents(query, {
      topK: parseInt(limit),
      includeMetadata: true
    });

    // Optionally fetch full patent data
    let detailedResults = searchResults.results;
    
    if (includeFullData === 'true') {
      const applicationNumbers = searchResults.results.map(r => r.applicationNumber);
      const fullPatents = await Patent.find({
        applicationNumberText: { $in: applicationNumbers }
      }).lean();
      
      // Merge search results with full patent data
      detailedResults = searchResults.results.map(result => {
        const fullPatent = fullPatents.find(p => p.applicationNumberText === result.applicationNumber);
        return {
          ...result,
          fullPatentData: fullPatent || null
        };
      });
    }

    res.json({
      success: true,
      query: searchResults.query,
      totalResults: searchResults.totalResults,
      results: detailedResults,
      searchType: 'vector_semantic'
    });

  } catch (error) {
    console.error('Patent search error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: error.message
    });
  }
});

// GET /api/patents/search/traditional - Traditional text-based search
router.get('/search/traditional', async (req, res) => {
  try {
    const { 
      q: query, 
      limit = 10, 
      skip = 0,
      sortBy = 'filingDate',
      sortOrder = 'desc'
    } = req.query;
    
    if (!query) {
      return res.status(400).json({
        error: 'Query parameter required',
        message: 'Please provide a search query using the "q" parameter'
      });
    }

    const searchQuery = {
      $text: { $search: query }
    };
    
    const sort = {};
    sort[`applicationMetaData.${sortBy}`] = sortOrder === 'desc' ? -1 : 1;

    const results = await Patent.find(searchQuery, { score: { $meta: 'textScore' } })
      .sort(sort)
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .lean();

    const total = await Patent.countDocuments(searchQuery);

    res.json({
      success: true,
      query,
      totalResults: results.length,
      totalDocuments: total,
      results,
      searchType: 'traditional_text',
      pagination: {
        skip: parseInt(skip),
        limit: parseInt(limit),
        hasMore: total > parseInt(skip) + parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Traditional search error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: error.message
    });
  }
});

// GET /api/patents/:applicationNumber - Get specific patent
router.get('/:applicationNumber', async (req, res) => {
  try {
    const { applicationNumber } = req.params;
    const patent = await Patent.findByApplicationNumber(applicationNumber);
    
    if (!patent) {
      return res.status(404).json({
        error: 'Patent not found',
        message: `No patent found with application number: ${applicationNumber}`
      });
    }

    res.json({
      success: true,
      patent
    });

  } catch (error) {
    console.error('Get patent error:', error);
    res.status(500).json({
      error: 'Failed to retrieve patent',
      message: error.message
    });
  }
});

// GET /api/patents/patent/:patentNumber - Get by patent number
router.get('/patent/:patentNumber', async (req, res) => {
  try {
    const { patentNumber } = req.params;
    const patent = await Patent.findByPatentNumber(patentNumber);
    
    if (!patent) {
      return res.status(404).json({
        error: 'Patent not found',
        message: `No patent found with patent number: ${patentNumber}`
      });
    }

    res.json({
      success: true,
      patent
    });

  } catch (error) {
    console.error('Get patent by number error:', error);
    res.status(500).json({
      error: 'Failed to retrieve patent',
      message: error.message
    });
  }
});

// GET /api/patents/classification/:cpcClass - Search by CPC classification
router.get('/classification/:cpcClass', async (req, res) => {
  try {
    const { cpcClass } = req.params;
    const { limit = 50, skip = 0 } = req.query;
    
    const patents = await Patent.findByClassification(cpcClass)
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .lean();

    const total = await Patent.countDocuments({
      'applicationMetaData.cpcClassificationBag': cpcClass
    });

    res.json({
      success: true,
      classification: cpcClass,
      totalResults: patents.length,
      totalDocuments: total,
      results: patents,
      pagination: {
        skip: parseInt(skip),
        limit: parseInt(limit),
        hasMore: total > parseInt(skip) + parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Classification search error:', error);
    res.status(500).json({
      error: 'Classification search failed',
      message: error.message
    });
  }
});

// GET /api/patents/stats - Get patent statistics
router.get('/stats', async (req, res) => {
  try {
    const [
      totalPatents,
      grantedPatents,
      pendingPatents,
      recentPatents,
      vectorStats
    ] = await Promise.all([
      Patent.countDocuments(),
      Patent.countDocuments({ 'applicationMetaData.grantDate': { $exists: true, $ne: null } }),
      Patent.countDocuments({ 'applicationMetaData.applicationStatusCode': { $in: [150, 211] } }), // Common pending codes
      Patent.countDocuments({
        'applicationMetaData.filingDate': { 
          $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      }),
      vectorServiceReady ? patentVectorService.getIndexStats().catch(() => null) : null
    ]);

    // Top classifications
    const topClassifications = await Patent.aggregate([
      { $unwind: '$applicationMetaData.cpcClassificationBag' },
      { $group: { 
        _id: '$applicationMetaData.cpcClassificationBag', 
        count: { $sum: 1 } 
      }},
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    const stats = {
      database: {
        totalPatents,
        grantedPatents,
        pendingPatents,
        recentPatents: recentPatents,
        grantRate: totalPatents > 0 ? (grantedPatents / totalPatents * 100).toFixed(2) + '%' : '0%'
      },
      vector: vectorStats,
      classifications: {
        topClassifications: topClassifications.map(c => ({
          classification: c._id,
          count: c.count
        }))
      },
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      stats
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve statistics',
      message: error.message
    });
  }
});

// POST /api/patents/vector/rebuild - Rebuild vector index (admin only)
router.post('/vector/rebuild', async (req, res) => {
  try {
    if (!vectorServiceReady) {
      return res.status(503).json({
        error: 'Vector service not ready',
        message: 'Patent vector search service is not available'
      });
    }

    // Start rebuild process (this will take time)
    const rebuildPromise = patentVectorService.rebuildIndex();
    
    res.json({
      success: true,
      message: 'Vector index rebuild started. This process will take some time.',
      status: 'in_progress'
    });

    // Handle rebuild in background
    rebuildPromise
      .then(result => {
        console.log('✅ Vector index rebuild completed:', result);
      })
      .catch(error => {
        console.error('❌ Vector index rebuild failed:', error);
      });

  } catch (error) {
    console.error('Rebuild error:', error);
    res.status(500).json({
      error: 'Failed to start rebuild',
      message: error.message
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy',
    vectorService: vectorServiceReady ? 'ready' : 'initializing',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
