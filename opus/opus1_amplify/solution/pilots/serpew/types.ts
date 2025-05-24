/**
 * Common type definitions for the SERPEW (Sector-specific REsearch Pilot for Enterprise Workflows) system
 * These types are used across various SERPEW components including clients, processors, and connectors.
 */

/**
 * Represents a feed item from an RSS or other content source
 */
export interface FeedItem {
  id: string;
  title: string;
  description: string;
  content: string;
  link: string;
  pubDate: Date;
  author?: string;
  categories?: string[];
  source?: string;
  mediaContent?: MediaContent[];
  embeddings?: number[];
}

/**
 * Represents media content attached to a feed item
 */
export interface MediaContent {
  url: string;
  type: string;
  size?: number;
  description?: string;
}

/**
 * Supported data sources for SERPEW
 */
export enum DataSource {
  RSS = 'rss',
  GOOGLE_DRIVE = 'googleDrive',
  DATABASE = 'database',
  API = 'api',
  MANUAL = 'manual',
}

/**
 * Supported storage destinations for processed data
 */
export enum StorageDestination {
  FIRESTORE = 'firestore',
  PINECONE = 'pinecone',
  VISION_LAKE = 'visionLake',
  LAKE_COACH = 'lakeCoach',
  LAKE_ZENA = 'lakeZena',
}

/**
 * Configuration for the GoogleDriveClient
 */
export interface GoogleDriveConfig {
  email: string;
  folderIds: string[];
  fileTypes?: string[];
  workspace: string;
  refreshInterval?: number;
}

/**
 * Configuration for the RSSProcessor
 */
export interface RSSProcessorConfig {
  feedUrls: string[];
  refreshInterval: number;
  maxItems?: number;
  categories?: string[];
  includeMedia?: boolean;
}

/**
 * Configuration for the VectorEmbedder
 */
export interface VectorEmbedderConfig {
  modelName: string;
  dimensions: number;
  batchSize?: number;
  storageDestination: StorageDestination;
  storageConfig: Record<string, any>;
}

/**
 * Configuration for the DatabaseClient
 */
export interface DatabaseConfig {
  type: 'firestore' | 'mongodb' | 'postgres';
  connectionString?: string;
  collections: {
    sectorStandards?: string;
    jobDefinitions?: string;
    feedItems?: string;
  };
}

/**
 * Status of a processing task
 */
export enum ProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

/**
 * Processing statistics for monitoring
 */
export interface ProcessingStats {
  totalItemsProcessed: number;
  itemsSucceeded: number;
  itemsFailed: number;
  startTime: Date;
  endTime?: Date;
  status: ProcessingStatus;
  errors?: Error[];
}

/**
 * Structure of a sector standard document
 */
export interface SectorStandard {
  id: string;
  name: string;
  description: string;
  sector: string;
  keywords: string[];
  competencies: string[];
  source: string;
  lastUpdated: Date;
}

/**
 * Structure of a job definition document
 */
export interface JobDefinition {
  id: string;
  title: string;
  description: string;
  responsibilities: string[];
  requiredSkills: string[];
  preferredSkills?: string[];
  sector: string;
  relatedStandards?: string[];
}
