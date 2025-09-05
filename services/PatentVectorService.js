const { Pinecone } = require('@pinecone-database/pinecone');
const OpenAI = require('openai');
const Patent = require('../models/PatentModel');

class PatentVectorService {
  constructor() {
    // Check if required API keys are available
    if (!process.env.PINECONE_API_KEY) {
      console.warn('⚠️ PINECONE_API_KEY not found - vector search will be disabled');
      this.disabled = true;
      return;
    }
    
    if (!process.env.OPENAI_API_KEY) {
      console.warn('⚠️ OPENAI_API_KEY not found - vector search will be disabled');
      this.disabled = true;
      return;
    }

    this.pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY
    });
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    
    this.indexName = 'patent-search';
    this.index = null;
    this.batchSize = 100;
    this.maxRetries = 3;
  }

  async initialize() {
    if (this.disabled) {
      console.log('⚠️ Vector service disabled - API keys not available');
      return;
    }
    
    console.log('🔌 Initializing Pinecone connection...');
    
    try {
      // Get or create the index
      const indexList = await this.pinecone.listIndexes();
      const existingIndex = indexList.indexes?.find(idx => idx.name === this.indexName);
      
      if (!existingIndex) {
        console.log('🏗️ Creating new Pinecone index...');
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: 1536, // OpenAI ada-002 embedding dimension
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'gcp',
              region: 'us-central1'  // Your preferred region
            }
          }
        });
        
        // Wait for index to be ready
        console.log('⏳ Waiting for index to be ready...');
        await this.waitForIndexReady();
      }
      
      this.index = this.pinecone.index(this.indexName);
      console.log('✅ Pinecone index ready');
      
    } catch (error) {
      console.error('❌ Error initializing Pinecone:', error);
      throw error;
    }
  }

  async waitForIndexReady(maxWaitTime = 300000) { // 5 minutes max
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitTime) {
      try {
        const indexStats = await this.pinecone.index(this.indexName).describeIndexStats();
        if (indexStats) {
          return true;
        }
      } catch (error) {
        // Index not ready yet, continue waiting
      }
      
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
    }
    
    throw new Error('Index creation timeout');
  }

  async createEmbedding(text) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      throw new Error('Invalid text for embedding');
    }

    try {
      const response = await this.openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: text.substring(0, 8000), // Limit text length
      });
      
      return response.data[0].embedding;
    } catch (error) {
      console.error('❌ Error creating embedding:', error);
      throw error;
    }
  }

  preparePatentText(patent) {
    const textParts = [];
    
    // Add invention title
    if (patent.applicationMetaData?.inventionTitle) {
      textParts.push(patent.applicationMetaData.inventionTitle);
    }
    
    // Add applicant names
    if (patent.applicationMetaData?.firstApplicantName) {
      textParts.push(`Applicant: ${patent.applicationMetaData.firstApplicantName}`);
    }
    
    // Add inventor names
    if (patent.applicationMetaData?.firstInventorName) {
      textParts.push(`Inventor: ${patent.applicationMetaData.firstInventorName}`);
    }
    
    // Add CPC classifications
    if (patent.applicationMetaData?.cpcClassificationBag?.length > 0) {
      textParts.push(`Classifications: ${patent.applicationMetaData.cpcClassificationBag.join(', ')}`);
    }
    
    // Add status description
    if (patent.applicationMetaData?.applicationStatusDescriptionText) {
      textParts.push(`Status: ${patent.applicationMetaData.applicationStatusDescriptionText}`);
    }
    
    return textParts.join('. ');
  }

  async upsertPatentVectors(patents) {
    if (!this.index) {
      throw new Error('Pinecone index not initialized');
    }

    const vectors = [];
    
    for (const patent of patents) {
      try {
        const patentText = this.preparePatentText(patent);
        
        if (patentText.trim().length === 0) {
          console.warn(`⚠️ No meaningful text for patent ${patent.applicationNumberText}`);
          continue;
        }

        const embedding = await this.createEmbedding(patentText);
        
        vectors.push({
          id: patent.applicationNumberText,
          values: embedding,
          metadata: {
            title: patent.applicationMetaData?.inventionTitle || '',
            patentNumber: patent.applicationMetaData?.patentNumber || '',
            filingDate: patent.applicationMetaData?.filingDate || '',
            grantDate: patent.applicationMetaData?.grantDate || '',
            status: patent.applicationMetaData?.applicationStatusDescriptionText || '',
            applicant: patent.applicationMetaData?.firstApplicantName || '',
            inventor: patent.applicationMetaData?.firstInventorName || '',
            classifications: patent.applicationMetaData?.cpcClassificationBag || [],
            lastUpdated: new Date().toISOString()
          }
        });

      } catch (error) {
        console.error(`❌ Error processing patent ${patent.applicationNumberText}:`, error);
      }
    }

    if (vectors.length === 0) {
      console.warn('⚠️ No vectors to upsert');
      return;
    }

    // Upsert vectors in batches
    for (let i = 0; i < vectors.length; i += this.batchSize) {
      const batch = vectors.slice(i, i + this.batchSize);
      
      let retries = 0;
      while (retries < this.maxRetries) {
        try {
          await this.index.upsert(batch);
          console.log(`✅ Upserted ${batch.length} vectors (${i + batch.length}/${vectors.length})`);
          break;
        } catch (error) {
          retries++;
          console.warn(`⚠️ Retry ${retries}/${this.maxRetries} for batch ${i}-${i + batch.length}:`, error.message);
          
          if (retries === this.maxRetries) {
            console.error(`❌ Failed to upsert batch after ${this.maxRetries} retries`);
            throw error;
          }
          
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retries) * 1000));
        }
      }
    }
  }

  async searchPatents(query, options = {}) {
    if (!this.index) {
      throw new Error('Pinecone index not initialized');
    }

    const {
      topK = 10,
      includeMetadata = true,
      filter = null
    } = options;

    try {
      // Create embedding for the query
      const queryEmbedding = await this.createEmbedding(query);
      
      // Search in Pinecone
      const searchResults = await this.index.query({
        vector: queryEmbedding,
        topK,
        includeMetadata,
        filter
      });

      // Format results
      const results = searchResults.matches.map(match => ({
        applicationNumber: match.id,
        similarity: match.score,
        title: match.metadata?.title,
        patentNumber: match.metadata?.patentNumber,
        filingDate: match.metadata?.filingDate,
        grantDate: match.metadata?.grantDate,
        status: match.metadata?.status,
        applicant: match.metadata?.applicant,
        inventor: match.metadata?.inventor,
        classifications: match.metadata?.classifications
      }));

      return {
        query,
        totalResults: results.length,
        results
      };

    } catch (error) {
      console.error('❌ Error searching patents:', error);
      throw error;
    }
  }

  async getIndexStats() {
    if (!this.index) {
      throw new Error('Pinecone index not initialized');
    }

    try {
      const stats = await this.index.describeIndexStats();
      return {
        totalVectors: stats.totalVectorCount,
        dimension: stats.dimension,
        indexFullness: stats.indexFullness,
        namespaces: stats.namespaces
      };
    } catch (error) {
      console.error('❌ Error getting index stats:', error);
      throw error;
    }
  }

  async deletePatentVector(applicationNumber) {
    if (!this.index) {
      throw new Error('Pinecone index not initialized');
    }

    try {
      await this.index.deleteOne(applicationNumber);
      console.log(`🗑️ Deleted vector for patent ${applicationNumber}`);
    } catch (error) {
      console.error(`❌ Error deleting patent vector ${applicationNumber}:`, error);
      throw error;
    }
  }

  async rebuildIndex() {
    console.log('🔄 Starting index rebuild...');
    
    if (!this.index) {
      throw new Error('Pinecone index not initialized');
    }

    try {
      // Clear existing index
      console.log('🧹 Clearing existing index...');
      await this.index.deleteAll();

      // Process all patents in batches
      let skip = 0;
      const batchSize = 50; // Smaller batch for embedding processing
      let totalProcessed = 0;

      while (true) {
        const patents = await Patent.find({})
          .skip(skip)
          .limit(batchSize)
          .lean();

        if (patents.length === 0) break;

        await this.upsertPatentVectors(patents);
        
        totalProcessed += patents.length;
        skip += batchSize;
        
        console.log(`📈 Processed ${totalProcessed} patents...`);
        
        // Add delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      console.log(`✅ Index rebuild completed. Processed ${totalProcessed} patents.`);
      
      return { totalProcessed };

    } catch (error) {
      console.error('❌ Error rebuilding index:', error);
      throw error;
    }
  }
}

module.exports = PatentVectorService;
