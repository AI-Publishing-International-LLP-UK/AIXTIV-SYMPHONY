const admin = require('firebase-admin');
const { Storage } = require('@google-cloud/storage');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../monitoring/logger');

/**
 * Career Dictionary Service
 *
 * Provides comprehensive career data integrating O*NET classifications,
 * international sector standards, and psychometric assessment tools (MBTI, DISC, Hogan)
 */
class CareerDictionaryService {
  constructor() {
    this.db = admin.firestore();
    this.storage = new Storage();
    this.onetBucket = this.storage.bucket('aixtiv-onet-data');
    this.sectorBucket = this.storage.bucket('aixtiv-sector-data');

    // Collection references
    this.collections = {
      onet: this.db.collection('career_dictionaries/onet/classifications'),
      sectors: this.db.collection('career_dictionaries/international/sectors'),
      crossReferences: this.db.collection(
        'career_dictionaries/mapping/cross_references'
      ),
      mbti: this.db.collection('career_dictionaries/psychometrics/mbti'),
      disc: this.db.collection('career_dictionaries/psychometrics/disc'),
      hogan: this.db.collection('career_dictionaries/psychometrics/hogan'),
    };
  }

  /**
   * Initialize the career dictionary service
   * Creates necessary collections if they don't exist
   */
  async initialize() {
    try {
      // Ensure all collection paths exist
      const collections = Object.keys(this.collections);

      for (const collectionKey of collections) {
        const collectionRef = this.collections[collectionKey];
        const snapshot = await collectionRef.limit(1).get();

        if (snapshot.empty) {
          logger.info(`Initializing collection: ${collectionRef.path}`);
          // Add a placeholder document to ensure collection exists
          await collectionRef.doc('_metadata').set({
            created: admin.firestore.FieldValue.serverTimestamp(),
            description: `Career dictionary collection for ${collectionKey}`,
          });
        }
      }

      logger.info('Career Dictionary Service initialized successfully');
      return true;
    } catch (error) {
      logger.error(
        `Error initializing Career Dictionary Service: ${error.message}`
      );
      return false;
    }
  }

  /**
   * Import O*NET data from CSV file
   * @param {string} filePath - Path to the O*NET CSV file
   * @param {string} dataType - Type of O*NET data (occupations, skills, etc.)
   * @returns {Promise<Object>} - Import results
   */
  async importOnetData(filePath, dataType) {
    try {
      const results = [];
      let successCount = 0;
      let errorCount = 0;

      // Create batch for Firestore operations
      let batch = this.db.batch();
      let operationCount = 0;
      const MAX_BATCH_SIZE = 500;

      // Parse CSV file
      await new Promise((resolve, reject) => {
        fs.createReadStream(filePath)
          .pipe(csv())
          .on('data', async data => {
            try {
              const docId = data.code || data.onetsoc_code || uuidv4();
              const docRef = this.collections.onet.doc(docId);

              // Transform data based on dataType
              const transformedData = this.transformOnetData(data, dataType);

              // Add to batch
              batch.set(docRef, transformedData, { merge: true });
              operationCount++;

              // If batch is full, commit and create a new batch
              if (operationCount >= MAX_BATCH_SIZE) {
                await batch.commit();
                batch = this.db.batch();
                operationCount = 0;
              }

              results.push({ id: docId, success: true });
              successCount++;
            } catch (err) {
              results.push({
                error: err.message,
                data: data,
                success: false,
              });
              errorCount++;
            }
          })
          .on('end', async () => {
            // Commit any remaining operations
            if (operationCount > 0) {
              await batch.commit();
            }
            resolve();
          })
          .on('error', err => {
            reject(err);
          });
      });

      // Upload original file to Cloud Storage for reference
      const fileName = path.basename(filePath);
      await this.onetBucket.upload(filePath, {
        destination: `imports/${dataType}/${fileName}`,
        metadata: {
          contentType: 'text/csv',
          metadata: {
            importedAt: new Date().toISOString(),
            recordCount: successCount + errorCount,
            successCount,
            errorCount,
          },
        },
      });

      // Update metadata document
      await this.collections.onet.doc('_metadata').set(
        {
          lastImport: {
            dataType,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            fileName,
            recordCount: successCount + errorCount,
            successCount,
            errorCount,
          },
        },
        { merge: true }
      );

      return {
        success: true,
        dataType,
        totalRecords: successCount + errorCount,
        successCount,
        errorCount,
        results: results.filter(r => !r.success).slice(0, 10), // Return first 10 errors for debugging
      };
    } catch (error) {
      logger.error(`Error importing O*NET data: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Transform O*NET data based on data type
   * @param {Object} data - Raw data from CSV
   * @param {string} dataType - Type of O*NET data
   * @returns {Object} - Transformed data
   */
  transformOnetData(data, dataType) {
    const baseData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      dataType,
    };

    switch (dataType) {
      case 'occupations':
        return {
          ...baseData,
          code: data.onetsoc_code || data.code,
          title: data.title || data.occupation_title,
          description: data.description,
          category: data.category,
          education: data.education_level || data.typical_education,
          experience: data.experience_level || data.work_experience,
          training: data.training_level || data.on_the_job_training,
          skills: [],
          abilities: [],
          knowledgeAreas: [],
          relatedOccupations: [],
        };

      case 'skills':
        return {
          ...baseData,
          code: data.onetsoc_code || data.code,
          skills: this.parseArrayField(data.skills || data.skill_list),
          skillsImportance: data.skills_importance
            ? JSON.parse(data.skills_importance)
            : {},
        };

      case 'abilities':
        return {
          ...baseData,
          code: data.onetsoc_code || data.code,
          abilities: this.parseArrayField(data.abilities || data.ability_list),
          abilitiesImportance: data.abilities_importance
            ? JSON.parse(data.abilities_importance)
            : {},
        };

      case 'knowledge':
        return {
          ...baseData,
          code: data.onetsoc_code || data.code,
          knowledgeAreas: this.parseArrayField(
            data.knowledge || data.knowledge_areas
          ),
          knowledgeImportance: data.knowledge_importance
            ? JSON.parse(data.knowledge_importance)
            : {},
        };

      case 'related':
        return {
          ...baseData,
          code: data.onetsoc_code || data.code,
          relatedOccupations: this.parseArrayField(data.related_occupations),
        };

      default:
        return {
          ...baseData,
          ...data,
        };
    }
  }

  /**
   * Parse array field from string (handles various formats)
   * @param {string} field - Field string
   * @returns {Array} - Parsed array
   */
  parseArrayField(field) {
    if (!field) return [];
    if (Array.isArray(field)) return field;

    // Check if JSON array
    if (field.startsWith('[') && field.endsWith(']')) {
      try {
        return JSON.parse(field);
      } catch (e) {
        // Not valid JSON, continue to other parsing methods
      }
    }

    // Try comma-separated values
    return field.split(',').map(item => item.trim());
  }

  /**
   * Import international sector data
   * @param {string} filePath - Path to the sector data file (CSV or JSON)
   * @param {string} region - Region or country code
   * @returns {Promise<Object>} - Import results
   */
  async importInternationalSectorData(filePath, region) {
    try {
      let sectorData;

      // Determine file type and parse accordingly
      if (filePath.endsWith('.json')) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        sectorData = JSON.parse(fileContent);
      } else if (filePath.endsWith('.csv')) {
        sectorData = [];
        await new Promise((resolve, reject) => {
          fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', data => {
              sectorData.push(data);
            })
            .on('end', resolve)
            .on('error', reject);
        });
      } else {
        throw new Error('Unsupported file format. Use CSV or JSON.');
      }

      // Process sector data
      const sectorCollection = this.collections.sectors;
      const regionRef = sectorCollection.doc(region);

      // Structure the data
      const structuredData = {
        region,
        regionName: sectorData.regionName || region,
        sectors: Array.isArray(sectorData)
          ? sectorData
          : sectorData.sectors || [],
        metadata: {
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          source: path.basename(filePath),
        },
      };

      // Save to Firestore
      await regionRef.set(structuredData);

      // Upload original file to Cloud Storage for reference
      const fileName = path.basename(filePath);
      await this.sectorBucket.upload(filePath, {
        destination: `imports/${region}/${fileName}`,
        metadata: {
          contentType: filePath.endsWith('.json')
            ? 'application/json'
            : 'text/csv',
          metadata: {
            importedAt: new Date().toISOString(),
            region,
            sectorCount: structuredData.sectors.length,
          },
        },
      });

      return {
        success: true,
        region,
        sectorCount: structuredData.sectors.length,
      };
    } catch (error) {
      logger.error(
        `Error importing international sector data: ${error.message}`
      );
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate cross-references between O*NET and international sector classifications
   * @returns {Promise<Object>} - Results of the cross-reference generation
   */
  async generateCrossReferences() {
    try {
      // Get all O*NET occupations
      const onetSnapshot = await this.collections.onet.get();
      const onetOccupations = [];

      onetSnapshot.forEach(doc => {
        if (doc.id !== '_metadata') {
          onetOccupations.push({
            id: doc.id,
            ...doc.data(),
          });
        }
      });

      // Get all international sectors
      const sectorsSnapshot = await this.collections.sectors.get();
      const internationalSectors = [];

      sectorsSnapshot.forEach(doc => {
        if (doc.id !== '_metadata') {
          const data = doc.data();
          internationalSectors.push({
            region: doc.id,
            sectors: data.sectors || [],
          });
        }
      });

      // Create cross-references
      const crossRefBatch = this.db.batch();
      let refCount = 0;

      // For each O*NET occupation, find matching international sectors
      for (const occupation of onetOccupations) {
        if (!occupation.title) continue;

        const crossRefId = occupation.id;
        const crossRefDoc = this.collections.crossReferences.doc(crossRefId);

        const mappings = {};

        // For each region, find matching sectors
        for (const region of internationalSectors) {
          const matches = [];

          for (const sector of region.sectors) {
            const sectorTitle = sector.title || sector.name;
            if (!sectorTitle) continue;

            // Check for title similarity or keywords match
            const isTitleSimilar = this.checkTitleSimilarity(
              occupation.title,
              sectorTitle
            );
            const keywordsMatch = this.checkKeywordsMatch(
              occupation.description || '',
              sector.description || ''
            );

            if (isTitleSimilar || keywordsMatch) {
              matches.push({
                sectorId: sector.id || sector.code,
                sectorTitle,
                confidence: isTitleSimilar ? 'high' : 'medium',
              });
            }
          }

          if (matches.length > 0) {
            mappings[region.region] = matches;
          }
        }

        // Add cross-reference document
        crossRefBatch.set(crossRefDoc, {
          onetCode: occupation.id,
          onetTitle: occupation.title,
          internationalMappings: mappings,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        refCount++;

        // Commit batch if it gets too large
        if (refCount >= 500) {
          await crossRefBatch.commit();
          refCount = 0;
        }
      }

      // Commit any remaining documents
      if (refCount > 0) {
        await crossRefBatch.commit();
      }

      // Update metadata
      await this.collections.crossReferences.doc('_metadata').set(
        {
          lastGenerated: admin.firestore.FieldValue.serverTimestamp(),
          onetCount: onetOccupations.length,
          regionCount: internationalSectors.length,
        },
        { merge: true }
      );

      return {
        success: true,
        onetCount: onetOccupations.length,
        regionCount: internationalSectors.length,
      };
    } catch (error) {
      logger.error(`Error generating cross-references: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Check title similarity between O*NET occupation and international sector
   * @param {string} onetTitle - O*NET occupation title
   * @param {string} sectorTitle - International sector title
   * @returns {boolean} - True if titles are similar
   */
  checkTitleSimilarity(onetTitle, sectorTitle) {
    // Simple implementation - check if titles contain shared keywords
    const onetWords = onetTitle.toLowerCase().split(/\s+/);
    const sectorWords = sectorTitle.toLowerCase().split(/\s+/);

    // Check for shared significant words (ignore common words like "and", "or", etc.)
    const commonWords = onetWords.filter(word => {
      return word.length > 3 && sectorWords.includes(word);
    });

    return commonWords.length > 0;
  }

  /**
   * Check for matching keywords in descriptions
   * @param {string} onetDescription - O*NET occupation description
   * @param {string} sectorDescription - International sector description
   * @returns {boolean} - True if descriptions share keywords
   */
  checkKeywordsMatch(onetDescription, sectorDescription) {
    if (!onetDescription || !sectorDescription) return false;

    // Extract keywords (words longer than 5 chars) from descriptions
    const onetKeywords = onetDescription
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 5)
      .map(word => word.replace(/[.,;:?!]/g, ''));

    const sectorKeywords = sectorDescription
      .toLowerCase()
      .split(/\s+/)
      .filter(word => word.length > 5)
      .map(word => word.replace(/[.,;:?!]/g, ''));

    // Check for shared keywords
    const commonKeywords = onetKeywords.filter(word =>
      sectorKeywords.includes(word)
    );

    return commonKeywords.length >= 3; // Require at least 3 matching keywords
  }

  /**
   * Import psychometric data (MBTI, DISC, Hogan) and correlations to career paths
   * @param {string} assessmentType - Type of assessment ('mbti', 'disc', 'hogan')
   * @param {string} filePath - Path to the data file
   * @returns {Promise<Object>} - Import results
   */
  async importPsychometricData(assessmentType, filePath) {
    try {
      if (!['mbti', 'disc', 'hogan'].includes(assessmentType)) {
        throw new Error(
          'Invalid assessment type. Must be mbti, disc, or hogan.'
        );
      }

      // Get target collection
      const collection = this.collections[assessmentType];

      // Parse data from file
      let profileData;
      if (filePath.endsWith('.json')) {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        profileData = JSON.parse(fileContent);
      } else if (filePath.endsWith('.csv')) {
        profileData = [];
        await new Promise((resolve, reject) => {
          fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', data => {
              profileData.push(data);
            })
            .on('end', resolve)
            .on('error', reject);
        });
      } else {
        throw new Error('Unsupported file format. Use CSV or JSON.');
      }

      // Process and save profiles in batches
      let batch = this.db.batch();
      let batchCount = 0;
      let totalProfiles = 0;

      const processProfile = profile => {
        const profileId =
          profile.id || profile.code || profile.type || uuidv4();
        const docRef = collection.doc(profileId);

        // Transform and structure based on assessment type
        const transformedData = this.transformPsychometricData(
          profile,
          assessmentType
        );

        batch.set(docRef, transformedData, { merge: true });
        batchCount++;
        totalProfiles++;

        // Commit batch if it gets too large
        if (batchCount >= 500) {
          batch.commit();
          batch = this.db.batch();
          batchCount = 0;
        }
      };

      // Process all profiles
      if (Array.isArray(profileData)) {
        profileData.forEach(processProfile);
      } else {
        // Handle case where JSON contains a map of profiles
        Object.entries(profileData).forEach(([key, value]) => {
          processProfile({
            id: key,
            ...value,
          });
        });
      }

      // Commit any remaining profiles
      if (batchCount > 0) {
        await batch.commit();
      }

      // Update metadata
      await collection.doc('_metadata').set(
        {
          lastImport: {
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            fileName: path.basename(filePath),
            profileCount: totalProfiles,
          },
        },
        { merge: true }
      );

      return {
        success: true,
        assessmentType,
        totalProfiles,
      };
    } catch (error) {
      logger.error(`Error importing psychometric data: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Transform psychometric data based on assessment type
   * @param {Object} data - Raw profile data
   * @param {string} assessmentType - Type of assessment
   * @returns {Object} - Transformed data
   */
  transformPsychometricData(data, assessmentType) {
    const baseData = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    switch (assessmentType) {
      case 'mbti':
        return {
          ...baseData,
          type: data.type || data.mbti_type,
          description: data.description,
          characteristics: this.parseArrayField(data.characteristics),
          strengths: this.parseArrayField(data.strengths),
          weaknesses: this.parseArrayField(data.weaknesses),
          careerFit: this.parseArrayField(data.career_fit || data.careers),
          onetCodes: this.parseArrayField(data.onet_codes),
        };

      case 'disc':
        return {
          ...baseData,
          type: data.type || data.disc_type,
          dominance: parseFloat(data.dominance) || 0,
          influence: parseFloat(data.influence) || 0,
          steadiness: parseFloat(data.steadiness) || 0,
          compliance: parseFloat(data.compliance) || 0,
          description: data.description,
          characteristics: this.parseArrayField(data.characteristics),
          workStyle: this.parseArrayField(data.work_style),
          communicationStyle: this.parseArrayField(data.communication_style),
          careerFit: this.parseArrayField(data.career_fit || data.careers),
          onetCodes: this.parseArrayField(data.onet_codes),
        };

      case 'hogan':
        return {
          ...baseData,
          profileId: data.id || data.profile_id,
          hpi: data.hpi
            ? JSON.parse(data.hpi)
            : {
                adjustment: parseFloat(data.adjustment) || 0,
                ambition: parseFloat(data.ambition) || 0,
                sociability: parseFloat(data.sociability) || 0,
                interpersonal_sensitivity:
                  parseFloat(data.interpersonal_sensitivity) || 0,
                prudence: parseFloat(data.prudence) || 0,
                inquisitive: parseFloat(data.inquisitive) || 0,
                learning_approach: parseFloat(data.learning_approach) || 0,
              },
          hds: data.hds ? JSON.parse(data.hds) : {},
          mvpi: data.mvpi ? JSON.parse(data.mvpi) : {},
          description: data.description,
          characteristics: this.parseArrayField(data.characteristics),
          leadershipStyle: this.parseArrayField(data.leadership_style),
          careerFit: this.parseArrayField(data.career_fit || data.careers),
          onetCodes: this.parseArrayField(data.onet_codes),
        };

      default:
        return {
          ...baseData,
          ...data,
        };
    }
  }

  /**
   * Search and retrieve career data based on various criteria
   * @param {Object} searchParams - Search parameters
   * @returns {Promise<Object>} - Search results
   */
  async searchCareerData(searchParams) {
    try {
      const {
        keywords,
        assessmentType,
        assessmentProfile,
        onetCode,
        sector,
        region,
        limit = 10,
      } = searchParams;

      // Track which search method was used
      let searchMethod = '';
      let results = [];

      // Case 1: Search by O*NET code
      if (onetCode) {
        searchMethod = 'onet_code';
        const docRef = this.collections.onet.doc(onetCode);
        const doc = await docRef.get();

        if (doc.exists) {
          results = [{ id: doc.id, ...doc.data() }];

          // Get cross-references
          const crossRefDoc = await this.collections.crossReferences
            .doc(onetCode)
            .get();
          if (crossRefDoc.exists) {
            results[0].crossReferences =
              crossRefDoc.data().internationalMappings;
          }
        }
      }
      // Case 2: Search by sector and region
      else if (sector && region) {
        searchMethod = 'sector_region';
        const regionDoc = await this.collections.sectors.doc(region).get();

        if (regionDoc.exists) {
          const regionData = regionDoc.data();
          const sectorData = (regionData.sectors || []).find(
            s =>
              s.id === sector ||
              s.code === sector ||
              s.name === sector ||
              s.title === sector
          );

          if (sectorData) {
            results = [{ region, ...sectorData }];

            // Find O*NET occupations mapped to this sector
            const crossRefsSnapshot = await this.collections.crossReferences
              .where(`internationalMappings.${region}`, '!=', null)
              .limit(limit)
              .get();

            const onetMappings = [];
            crossRefsSnapshot.forEach(doc => {
              const data = doc.data();
              const mappings = data.internationalMappings[region] || [];

              if (
                mappings.some(
                  m => m.sectorId === sector || m.sectorTitle === sector
                )
              ) {
                onetMappings.push({
                  onetCode: doc.id,
                  onetTitle: data.onetTitle,
                });
              }
            });

            if (onetMappings.length > 0) {
              results[0].onetMappings = onetMappings;
            }
          }
        }
      }
      // Case 3: Search by assessment type and profile
      else if (assessmentType && assessmentProfile) {
        searchMethod = 'assessment_profile';

        if (!this.collections[assessmentType]) {
          throw new Error(`Invalid assessment type: ${assessmentType}`);
        }

        const profileDoc = await this.collections[assessmentType]
          .doc(assessmentProfile)
          .get();

        if (profileDoc.exists) {
          const profileData = profileDoc.data();
          results = [{ id: profileDoc.id, ...profileData }];

          // If profile has O*NET mappings, get those occupations
          const onetCodes = profileData.onetCodes || [];
          if (onetCodes.length > 0) {
            const onetOccupations = [];

            // Get occupation details for each code
            for (const code of onetCodes.slice(0, 10)) {
              // Limit to 10 to avoid excessive reads
              const onetDoc = await this.collections.onet.doc(code).get();
              if (onetDoc.exists) {
                onetOccupations.push({
                  id: onetDoc.id,
                  ...onetDoc.data(),
                });
              }
            }

            if (onetOccupations.length > 0) {
              results[0].occupations = onetOccupations;
            }
          }
        }
      }
      // Case 4: Search by keywords
      else if (keywords) {
        searchMethod = 'keywords';
        const keywordArray = keywords.toLowerCase().split(/\s+/);

        // Search O*NET occupations
        const onetResults = [];
        const onetSnapshot = await this.collections.onet.limit(limit * 2).get();

        onetSnapshot.forEach(doc => {
          if (doc.id === '_metadata') return;

          const data = doc.data();
          const title = (data.title || '').toLowerCase();
          const description = (data.description || '').toLowerCase();

          // Check if all keywords are present in title or description
          if (
            keywordArray.every(
              keyword =>
                title.includes(keyword) || description.includes(keyword)
            )
          ) {
            onetResults.push({
              id: doc.id,
              ...data,
              source: 'onet',
            });
          }
        });

        // Search international sectors
        const sectorResults = [];
        const sectorSnapshot = await this.collections.sectors.get();

        sectorSnapshot.forEach(doc => {
          if (doc.id === '_metadata') return;

          const regionData = doc.data();
          const sectors = regionData.sectors || [];

          sectors.forEach(sector => {
            const sectorTitle = (
              sector.title ||
              sector.name ||
              ''
            ).toLowerCase();
            const sectorDesc = (sector.description || '').toLowerCase();

            // Check if all keywords are present in title or description
            if (
              keywordArray.every(
                keyword =>
                  sectorTitle.includes(keyword) || sectorDesc.includes(keyword)
              )
            ) {
              sectorResults.push({
                region: doc.id,
                ...sector,
                source: 'sector',
              });
            }
          });
        });

        // Combine results
        results = [...onetResults, ...sectorResults].slice(0, limit);
      }

      return {
        success: true,
        method: searchMethod,
        count: results.length,
        results,
      };
    } catch (error) {
      logger.error(`Error searching career data: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get a comprehensive view of a specific O*NET occupation with all related data
   * @param {string} onetCode - O*NET occupation code
   * @returns {Promise<Object>} - Comprehensive occupation data
   */
  async getComprehensiveOccupation(onetCode) {
    try {
      // Get base occupation data
      const occupationRef = this.collections.onet.doc(onetCode);
      const occupationDoc = await occupationRef.get();

      if (!occupationDoc.exists) {
        return {
          success: false,
          error: `Occupation not found: ${onetCode}`,
        };
      }

      const occupationData = occupationDoc.data();

      // Get cross-references to international sectors
      const crossRefRef = this.collections.crossReferences.doc(onetCode);
      const crossRefDoc = await crossRefRef.get();
      let internationalMappings = {};

      if (crossRefDoc.exists) {
        internationalMappings = crossRefDoc.data().internationalMappings || {};
      }

      // Get psychometric matches
      const psychometricMatches = {
        mbti: [],
        disc: [],
        hogan: [],
      };

      // Check MBTI matches
      const mbtiSnapshot = await this.collections.mbti
        .where('onetCodes', 'array-contains', onetCode)
        .get();

      mbtiSnapshot.forEach(doc => {
        psychometricMatches.mbti.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Check DISC matches
      const discSnapshot = await this.collections.disc
        .where('onetCodes', 'array-contains', onetCode)
        .get();

      discSnapshot.forEach(doc => {
        psychometricMatches.disc.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Check Hogan matches
      const hoganSnapshot = await this.collections.hogan
        .where('onetCodes', 'array-contains', onetCode)
        .get();

      hoganSnapshot.forEach(doc => {
        psychometricMatches.hogan.push({
          id: doc.id,
          ...doc.data(),
        });
      });

      // Assemble comprehensive view
      return {
        success: true,
        occupation: {
          code: onetCode,
          ...occupationData,
        },
        internationalMappings,
        psychometricMatches,
      };
    } catch (error) {
      logger.error(`Error getting comprehensive occupation: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Create singleton instance
const careerDictionaryService = new CareerDictionaryService();

module.exports = careerDictionaryService;
