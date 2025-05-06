/**
 * Firestore Schema Design for O*NET and International Sector Data Integration
 *
 * This module defines the Firestore collection structure for storing O*NET occupational data
 * and international sector classifications, with cross-references between different systems.
 *
 * Project ID: api-for-warp-drive
 * Organization: coaching2100.com
 */

const COLLECTIONS = {
  // O*NET Collections
  ONET_OCCUPATIONS: 'onet_occupations',
  ONET_SKILLS: 'onet_skills',
  ONET_ABILITIES: 'onet_abilities',
  ONET_KNOWLEDGE: 'onet_knowledge',
  ONET_INTERESTS: 'onet_interests',
  ONET_WORK_STYLES: 'onet_work_styles',
  ONET_WORK_VALUES: 'onet_work_values',
  ONET_WORK_ACTIVITIES: 'onet_work_activities',
  ONET_WORK_CONTEXTS: 'onet_work_contexts',
  ONET_JOB_ZONES: 'onet_job_zones',
  ONET_CAREER_PATHWAYS: 'onet_career_pathways',
  ONET_BRIGHT_OUTLOOK: 'onet_bright_outlook',

  // International Classification Collections
  INTL_ISCO: 'intl_isco_occupations', // International Standard Classification of Occupations
  INTL_ISIC: 'intl_isic_sectors', // International Standard Industrial Classification
  INTL_NACE: 'intl_nace_sectors', // European Classification of Economic Activities
  INTL_NAICS: 'intl_naics_sectors', // North American Industry Classification System
  INTL_SOC: 'intl_soc_occupations', // Standard Occupational Classification (UK)
  INTL_ANZSCO: 'intl_anzsco_occupations', // Australian and New Zealand Standard Classification of Occupations

  // Cross-Reference Collections
  CROSSREF_ONET_ISCO: 'crossref_onet_isco',
  CROSSREF_ONET_SOC: 'crossref_onet_soc',
  CROSSREF_ONET_ISIC: 'crossref_onet_isic',
  CROSSREF_ISCO_ISIC: 'crossref_isco_isic',

  // Integration with SERPEW
  SERPEW_ONET_MAPPINGS: 'serpew_onet_mappings',
  SERPEW_SECTOR_MAPPINGS: 'serpew_sector_mappings',
  SERPEW_HOLLAND_MAPPINGS: 'serpew_holland_mappings',

  // Admin and Configuration
  ONET_CONFIG: 'onet_config',
  ONET_IMPORT_LOGS: 'onet_import_logs',
  ONET_ADMIN_ACTIONS: 'onet_admin_actions',
};

/**
 * Document structure for O*NET occupations
 */
const ONET_OCCUPATION_SCHEMA = {
  onetCode: String, // O*NET-SOC code (e.g., "11-1011.00")
  title: String, // Occupation title
  description: String, // Detailed description
  reportDate: String, // Date the data was reported
  wages: {
    // Wage information
    median: Number, // Median annual wage
    meanAnnual: Number, // Mean annual wage
    entryEducation: String, // Entry education requirement
    entryExperience: String, // Entry experience requirement
  },
  jobZone: Number, // Job Zone (1-5)
  holland: {
    // Holland codes (RIASEC)
    primary: String, // Primary Holland code (R, I, A, S, E, or C)
    secondary: String, // Secondary Holland code
    tertiary: String, // Tertiary Holland code
  },
  brightOutlook: Boolean, // Whether this is a bright outlook occupation
  greenOccupation: Boolean, // Whether this is a green occupation
  skills: [
    // Related skills
    {
      id: String, // Skill ID
      name: String, // Skill name
      importanceScore: Number, // Importance score (0-100)
      levelScore: Number, // Level score (0-7)
    },
  ],
  abilities: [
    // Related abilities
    {
      id: String, // Ability ID
      name: String, // Ability name
      importanceScore: Number, // Importance score (0-100)
      levelScore: Number, // Level score (0-7)
    },
  ],
  interests: [
    // Occupational interests
    {
      type: String, // Interest type (R, I, A, S, E, or C)
      score: Number, // Interest score (0-100)
    },
  ],
  workValues: [
    // Work values
    {
      id: String, // Value ID
      name: String, // Value name
      score: Number, // Score (0-100)
    },
  ],
  relatedOccupations: [
    // Related occupations
    {
      onetCode: String, // O*NET-SOC code
      title: String, // Occupation title
      similarity: Number, // Similarity score (0-100)
    },
  ],
  tasks: [
    // Representative tasks
    {
      id: String, // Task ID
      description: String, // Task description
      importanceScore: Number, // Importance score (0-100)
      frequencyScore: Number, // Frequency score (0-5)
    },
  ],
  lastUpdated: Date, // Last update timestamp
  importedBy: String, // User who imported the data
  version: String, // O*NET database version
};

/**
 * Document structure for international ISCO occupations
 */
const ISCO_OCCUPATION_SCHEMA = {
  iscoCode: String, // ISCO code (e.g., "1120")
  title: String, // Occupation title
  description: String, // Detailed description
  level: Number, // ISCO level (1-4)
  parentCode: String, // Parent ISCO code
  skills: [String], // Required skills
  tasks: [String], // Common tasks
  examples: [String], // Example job titles
  notes: String, // Additional notes
  version: String, // ISCO version (e.g., "ISCO-08")
  lastUpdated: Date, // Last update timestamp
};

/**
 * Document structure for international ISIC industrial classifications
 */
const ISIC_SECTOR_SCHEMA = {
  isicCode: String, // ISIC code (e.g., "A01")
  title: String, // Sector title
  description: String, // Detailed description
  level: Number, // Hierarchical level
  parentCode: String, // Parent sector code
  includes: [String], // Activities included
  excludes: [String], // Activities excluded
  version: String, // ISIC version (e.g., "ISIC Rev.4")
  lastUpdated: Date, // Last update timestamp
};

/**
 * Document structure for cross-reference between O*NET and ISCO
 */
const CROSSREF_ONET_ISCO_SCHEMA = {
  onetCode: String, // O*NET-SOC code
  iscoCode: String, // ISCO code
  matchType: String, // Type of match (exact, close, partial)
  matchScore: Number, // Match confidence score (0-100)
  mappingNotes: String, // Notes about the mapping
  createdBy: String, // User who created the mapping
  createdAt: Date, // Creation timestamp
  lastUpdated: Date, // Last update timestamp
};

/**
 * Document structure for SERPEW integration mappings
 */
const SERPEW_ONET_MAPPING_SCHEMA = {
  serpewJobCode: String, // SERPEW job code
  onetCode: String, // O*NET-SOC code
  matchType: String, // Type of match (exact, close, partial)
  matchScore: Number, // Match confidence score (0-100)
  autoGenerated: Boolean, // Whether mapping was auto-generated
  verifiedBy: String, // User who verified the mapping
  verifiedAt: Date, // Verification timestamp
  hollandCode: String, // Holland code derived from O*NET
  skillsOverlap: [String], // Overlapping skills
  lastUpdated: Date, // Last update timestamp
};

/**
 * Document structure for O*NET import logs
 */
const ONET_IMPORT_LOG_SCHEMA = {
  importId: String, // Unique import ID
  startTime: Date, // Import start time
  endTime: Date, // Import end time
  status: String, // Status (completed, failed, in-progress)
  onetVersion: String, // O*NET database version
  files: [
    // Imported files
    {
      filename: String, // File name
      recordCount: Number, // Number of records processed
      status: String, // Import status for this file
      errors: [
        // Any errors encountered
        {
          message: String, // Error message
          code: String, // Error code
          record: String, // Related record
        },
      ],
    },
  ],
  totalRecords: Number, // Total records processed
  successCount: Number, // Successfully imported records
  errorCount: Number, // Records with errors
  importedBy: String, // User who initiated the import
  notes: String, // Any additional notes
};

module.exports = {
  COLLECTIONS,
  ONET_OCCUPATION_SCHEMA,
  ISCO_OCCUPATION_SCHEMA,
  ISIC_SECTOR_SCHEMA,
  CROSSREF_ONET_ISCO_SCHEMA,
  SERPEW_ONET_MAPPING_SCHEMA,
  ONET_IMPORT_LOG_SCHEMA,
};
