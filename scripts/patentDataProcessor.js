#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const https = require('https');
const { createWriteStream } = require('fs');
const { pipeline } = require('stream');
const { promisify } = require('util');
const AdmZip = require('adm-zip');
const mongoose = require('mongoose');
const Patent = require('../models/PatentModel');
const PatentVectorService = require('../services/PatentVectorService');

// Configuration
const CONFIG = {
  DATASET_URL: 'https://data.uspto.gov/ui/datasets/products/files/PTFWPRE/2021-2025-patent-filewrapper-full-json-20250831.zip',
  DOWNLOAD_DIR: path.join(__dirname, '../data'),
  CHUNK_SIZE: 100, // Process patents in chunks
  VECTOR_CHUNK_SIZE: 25, // Smaller chunks for vector processing to avoid rate limits
  MONGODB_URI: process.env.MONGODB_URI,
  MAX_RETRIES: 3,
  ENABLE_VECTORS: process.env.ENABLE_VECTORS !== 'false' // Default to true unless explicitly disabled
};

const pipelineAsync = promisify(pipeline);

class PatentDataProcessor {
  constructor() {
    this.downloadPath = path.join(CONFIG.DOWNLOAD_DIR, '2021-2025-patent-data.zip');
    this.extractPath = path.join(CONFIG.DOWNLOAD_DIR, 'extracted');
    this.processedCount = 0;
    this.errorCount = 0;
    this.startTime = Date.now();
  }

  async initialize() {
    console.log('🚀 Initializing Patent Data Processor...');
    
    // Ensure data directory exists
    if (!fs.existsSync(CONFIG.DOWNLOAD_DIR)) {
      fs.mkdirSync(CONFIG.DOWNLOAD_DIR, { recursive: true });
    }
    
    if (!fs.existsSync(this.extractPath)) {
      fs.mkdirSync(this.extractPath, { recursive: true });
    }

    // Connect to MongoDB
    console.log('📊 Connecting to MongoDB...');
    await mongoose.connect(CONFIG.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ MongoDB connected');
  }

  async downloadFile() {
    console.log('📥 Starting download of patent dataset...');
    console.log(`URL: ${CONFIG.DATASET_URL}`);
    
    if (fs.existsSync(this.downloadPath)) {
      console.log('📁 File already exists, skipping download');
      return;
    }

    return new Promise((resolve, reject) => {
      const file = createWriteStream(this.downloadPath);
      let downloaded = 0;
      let total = 0;

      https.get(CONFIG.DATASET_URL, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download: ${response.statusCode}`));
          return;
        }

        total = parseInt(response.headers['content-length'] || '0');
        console.log(`📊 Total size: ${this.formatBytes(total)}`);

        response.on('data', (chunk) => {
          downloaded += chunk.length;
          const percent = total > 0 ? ((downloaded / total) * 100).toFixed(1) : '0';
          process.stdout.write(`\r📥 Downloaded: ${this.formatBytes(downloaded)} (${percent}%)`);
        });

        response.on('end', () => {
          console.log('\n✅ Download completed');
          resolve();
        });

        response.on('error', (err) => {
          reject(err);
        });

        response.pipe(file);
      }).on('error', (err) => {
        reject(err);
      });

      file.on('error', (err) => {
        reject(err);
      });

      file.on('finish', () => {
        file.close();
      });
    });
  }

  async extractFile() {
    console.log('📦 Extracting ZIP file...');
    
    try {
      const zip = new AdmZip(this.downloadPath);
      const zipEntries = zip.getEntries();
      
      console.log(`📄 Found ${zipEntries.length} files in archive`);
      
      zipEntries.forEach((entry) => {
        if (entry.entryName.endsWith('.json')) {
          console.log(`📤 Extracting: ${entry.entryName}`);
          zip.extractEntryTo(entry, this.extractPath, false, true);
        }
      });
      
      console.log('✅ Extraction completed');
    } catch (error) {
      console.error('❌ Extraction failed:', error);
      throw error;
    }
  }

  async processJsonFiles() {
    console.log('🔄 Processing JSON files...');
    
    const files = fs.readdirSync(this.extractPath).filter(f => f.endsWith('.json'));
    
    for (const file of files) {
      await this.processJsonFile(path.join(this.extractPath, file));
    }
  }

  async processJsonFile(filePath) {
    console.log(`📖 Processing file: ${path.basename(filePath)}`);
    
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      const patents = data.patentFileWrapperDataBag || [];
      
      console.log(`📊 Found ${patents.length} patents in file`);
      
      // Process in chunks to avoid memory issues
      for (let i = 0; i < patents.length; i += CONFIG.CHUNK_SIZE) {
        const chunk = patents.slice(i, i + CONFIG.CHUNK_SIZE);
        await this.processPatentChunk(chunk, path.basename(filePath));
        
        const progress = ((i + chunk.length) / patents.length * 100).toFixed(1);
        console.log(`📈 Progress: ${progress}% (${i + chunk.length}/${patents.length})`);
      }
      
    } catch (error) {
      console.error(`❌ Error processing file ${filePath}:`, error);
      this.errorCount++;
    }
  }

  async processPatentChunk(patents, sourceFile) {
    const operations = [];
    
    for (const patentData of patents) {
      try {
        // Validate required fields
        if (!patentData.applicationNumberText) {
          console.warn('⚠️ Skipping patent without application number');
          continue;
        }

        const patentDoc = {
          applicationNumberText: patentData.applicationNumberText,
          applicationMetaData: patentData.applicationMetaData || {},
          correspondenceAddressBag: patentData.correspondenceAddressBag || [],
          assignmentBag: patentData.assignmentBag || [],
          recordAttorney: patentData.recordAttorney || {},
          foreignPriorityBag: patentData.foreignPriorityBag || [],
          parentContinuityBag: patentData.parentContinuityBag || [],
          childContinuityBag: patentData.childContinuityBag || [],
          patentTermAdjustmentData: patentData.patentTermAdjustmentData || {},
          eventDataBag: patentData.eventDataBag || [],
          pgpubDocumentMetaData: patentData.pgpubDocumentMetaData || {},
          grantDocumentMetaData: patentData.grantDocumentMetaData || {},
          lastIngestionDateTime: patentData.lastIngestionDateTime,
          processingMetadata: {
            datasetFile: sourceFile,
            processingVersion: '1.0.0'
          }
        };

        operations.push({
          updateOne: {
            filter: { applicationNumberText: patentData.applicationNumberText },
            update: { $set: patentDoc },
            upsert: true
          }
        });

      } catch (error) {
        console.error('❌ Error preparing patent document:', error);
        this.errorCount++;
      }
    }

    if (operations.length > 0) {
      try {
        const result = await Patent.bulkWrite(operations, { ordered: false });
        this.processedCount += result.upsertedCount + result.modifiedCount;
        
        if (result.writeErrors && result.writeErrors.length > 0) {
          console.warn(`⚠️ Write errors: ${result.writeErrors.length}`);
          this.errorCount += result.writeErrors.length;
        }
        
      } catch (error) {
        console.error('❌ Bulk write error:', error);
        this.errorCount += operations.length;
      }
    }
  }

  async createIndexes() {
    console.log('🔍 Creating database indexes...');
    
    try {
      await Patent.createIndexes();
      console.log('✅ Indexes created successfully');
    } catch (error) {
      console.error('❌ Error creating indexes:', error);
    }
  }

  async generateStats() {
    console.log('📊 Generating statistics...');
    
    try {
      const totalPatents = await Patent.countDocuments();
      const grantedPatents = await Patent.countDocuments({ 
        'applicationMetaData.grantDate': { $exists: true, $ne: null } 
      });
      const recentPatents = await Patent.countDocuments({
        'applicationMetaData.filingDate': { 
          $gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      });

      const stats = {
        totalPatents,
        grantedPatents,
        recentPatents,
        processingTime: Date.now() - this.startTime,
        processedCount: this.processedCount,
        errorCount: this.errorCount
      };

      console.log('\n📈 Final Statistics:');
      console.log(`Total Patents: ${stats.totalPatents.toLocaleString()}`);
      console.log(`Granted Patents: ${stats.grantedPatents.toLocaleString()}`);
      console.log(`Recent Patents (last year): ${stats.recentPatents.toLocaleString()}`);
      console.log(`Processing Time: ${this.formatDuration(stats.processingTime)}`);
      console.log(`Processed: ${stats.processedCount.toLocaleString()}`);
      console.log(`Errors: ${stats.errorCount.toLocaleString()}`);

      // Save stats to file
      fs.writeFileSync(
        path.join(CONFIG.DOWNLOAD_DIR, 'processing_stats.json'),
        JSON.stringify(stats, null, 2)
      );

    } catch (error) {
      console.error('❌ Error generating statistics:', error);
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.downloadFile();
      await this.extractFile();
      await this.processJsonFiles();
      await this.createIndexes();
      await this.generateStats();
      
      console.log('🎉 Patent data processing completed successfully!');
      
    } catch (error) {
      console.error('❌ Fatal error during processing:', error);
      process.exit(1);
    } finally {
      await mongoose.connection.close();
      console.log('👋 Database connection closed');
    }
  }
}

// CLI interface
if (require.main === module) {
  const processor = new PatentDataProcessor();
  
  process.on('SIGINT', async () => {
    console.log('\n🛑 Process interrupted. Cleaning up...');
    await mongoose.connection.close();
    process.exit(0);
  });
  
  processor.run().catch(console.error);
}

module.exports = PatentDataProcessor;
