/**
 * Ensure Pinecone Indexes Function - Clean Version
 * Removes all Firebase dependencies and uses pure GCP integration
 * 
 * This function ensures that required Pinecone indexes exist for the system.
 * It's designed to work without any Firebase dependencies.
 */

const pineconeIntegration = require('../src/functions/pinecone-integration-updated');

/**
 * HTTP Cloud Function to ensure required Pinecone indexes exist
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.ensurePineconeIndexes = async (req, res) => {
  try {
    console.log('Starting Pinecone indexes validation...');
    
    // List of required indexes for the system
    const requiredIndexes = [
      'aixtiv-memories',
      'aixtiv-prompts',
      'aixtiv-agents',
      'aixtiv-analytics'
    ];
    
    const results = [];
    
    // Ensure each required index exists
    for (const indexName of requiredIndexes) {
      try {
        console.log(`Checking index: ${indexName}`);
        const created = await pineconeIntegration.createIndexIfNotExists(indexName);
        results.push({
          index: indexName,
          status: created ? 'ready' : 'failed',
          created: created
        });
        console.log(`Index ${indexName}: ${created ? 'ready' : 'failed'}`);
      } catch (error) {
        console.error(`Error with index ${indexName}:`, error.message);
        results.push({
          index: indexName,
          status: 'error',
          error: error.message
        });
      }
    }
    
    // Check if all indexes are ready
    const allReady = results.every(result => result.status === 'ready');
    
    const response = {
      success: allReady,
      message: allReady ? 'All Pinecone indexes are ready' : 'Some indexes failed to initialize',
      indexes: results,
      timestamp: new Date().toISOString()
    };
    
    console.log('Pinecone indexes validation completed:', response);
    
    res.status(allReady ? 200 : 500).json(response);
    
  } catch (error) {
    console.error('Error in ensurePineconeIndexes function:', error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};