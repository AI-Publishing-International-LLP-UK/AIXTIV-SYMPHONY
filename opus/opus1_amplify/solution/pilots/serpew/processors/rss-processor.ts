import axios from 'axios';
import { parseString } from 'xml2js';
import { promisify } from 'util';
import { GoogleDriveClient } from '../clients/google-drive-client';
import { VectorEmbedder } from './vector-embedder';

// Convert parseString to Promise-based function
const parseStringPromise = promisify(parseString);

/**
 * Formats for RSS feeds that can be processed
 */
export enum RSSFeedFormat {
  RSS2 = 'RSS2',
  ATOM = 'ATOM',
  JSON = 'JSON',
  CUSTOM = 'CUSTOM'
}

/**
 * Storage types for processed RSS data
 */
export enum RSSDataStorageType {
  FIRESTORE = 'FIRESTORE',
  PINECONE = 'PINECONE',
  VISION_LAKE = 'VISION_LAKE',
  LAKE_COACH = 'LAKE_COACH',
  LAKE_ZENA = 'LAKE_ZENA'
}

/**
 * Interface for RSS feed item
 */
export interface RSSFeedItem {
  id: string;
  title: string;
  link: string;
  description: string;
  author?: string;
  categories?: string[];
  content?: string;
  publishDate: Date;
  enclosures?: Array<{
    url: string;
    type: string;
    length?: number;
  }>;
  mediaContent?: Array<{
    url: string;
    type: string;
    width?: number;
    height?: number;
  }>;
  metadata?: Record<string, any>;
}

/**
 * Configuration for RSS processor
 */
export interface RSSProcessorConfig {
  feedUrls?: string[];
  googleDriveFolderIds?: string[];
  storageTypes: RSSDataStorageType[];
  feedFormats?: RSSFeedFormat[];
  maxItemsPerFeed?: number;
  updateFrequencyMinutes?: number;
  enableNlpProcessing?: boolean;
  enableMetadataExtraction?: boolean;
  enableImageProcessing?: boolean;
  customTransformers?: Array<(item: RSSFeedItem) => Promise<RSSFeedItem>>;
  customFilters?: Array<(item: RSSFeedItem) => Promise<boolean>>;
}

/**
 * Default RSS processor configuration
 */
const DEFAULT_CONFIG: RSSProcessorConfig = {
  storageTypes: [RSSDataStorageType.FIRESTORE],
  maxItemsPerFeed: 100,
  updateFrequencyMinutes: 60,
  enableNlpProcessing: false,
  enableMetadataExtraction: true,
  enableImageProcessing: false
};

/**
 * RSSProcessor for handling various RSS feed sources
 * and processing them for storage in different systems
 */
export class RSSProcessor {
  private config: RSSProcessorConfig;
  private googleDriveClient?: GoogleDriveClient;
  private vectorEmbedder?: VectorEmbedder;
  private activeJobs: Map<string, NodeJS.Timeout> = new Map();
  private processedItems: Set<string> = new Set();

  /**
   * Create a new RSS processor with the given configuration
   * @param config Configuration for the RSS processor
   * @param googleDriveClient Optional Google Drive client for processing feeds from Google Drive
   * @param vectorEmbedder Optional vector embedder for NLP processing
   */
  constructor(
    config: Partial<RSSProcessorConfig> = {},
    googleDriveClient?: GoogleDriveClient,
    vectorEmbedder?: VectorEmbedder
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.googleDriveClient = googleDriveClient;
    this.vectorEmbedder = vectorEmbedder;

    // Validate configuration
    if (!this.config.feedUrls?.length && !this.config.googleDriveFolderIds?.length) {
      console.warn('No feed URLs or Google Drive folder IDs provided. The processor will not fetch any feeds.');
    }

    if (this.config.enableNlpProcessing && !this.vectorEmbedder) {
      console.warn('NLP processing is enabled but no vector embedder was provided. NLP features will be disabled.');
      this.config.enableNlpProcessing = false;
    }
  }

  /**
   * Start processing RSS feeds based on the configuration
   */
  public async startProcessing(): Promise<void> {
    console.log('Starting RSS feed processing...');

    // Process direct feed URLs
    if (this.config.feedUrls?.length) {
      for (const url of this.config.feedUrls) {
        await this.processFeed(url);
        this.scheduleNextUpdate(url);
      }
    }

    // Process feeds from Google Drive
    if (this.config.googleDriveFolderIds?.length && this.googleDriveClient) {
      for (const folderId of this.config.googleDriveFolderIds) {
        await this.processGoogleDriveFolder(folderId);
      }
    }
  }

  /**
   * Stop all feed processing jobs
   */
  public stopProcessing(): void {
    console.log('Stopping all RSS feed processing...');
    for (const [url, timeout] of this.activeJobs.entries()) {
      clearTimeout(timeout);
      console.log(`Stopped processing for feed: ${url}`);
    }
    this.activeJobs.clear();
  }

  /**
   * Process a single RSS feed
   * @param url URL of the RSS feed
   */
  public async processFeed(url: string): Promise<RSSFeedItem[]> {
    try {
      console.log(`Processing feed: ${url}`);
      const response = await axios.get(url, { timeout: 10000 });
      
      // Determine feed format and parse accordingly
      const feedFormat = this.detectFeedFormat(response.data);
      const parsedFeed = await this.parseFeed(response.data, feedFormat);
      
      // Extract items and process them
      const items = this.extractItems(parsedFeed, feedFormat);
      const processedItems = await this.processItems(items);
      
      // Store the processed items
      await this.storeItems(processedItems);
      
      return processedItems;
    } catch (error) {
      console.error(`Error processing feed ${url}:`, error);
      return [];
    }
  }

  /**
   * Process RSS feed files from a Google Drive folder
   * @param folderId Google Drive folder ID containing RSS feed files
   */
  private async processGoogleDriveFolder(folderId: string): Promise<void> {
    if (!this.googleDriveClient) {
      console.error('Google Drive client not provided. Cannot process Google Drive folder.');
      return;
    }

    try {
      console.log(`Processing RSS feeds from Google Drive folder: ${folderId}`);
      
      // Get files from the folder
      const files = await this.googleDriveClient.listFiles(folderId);
      
      for (const file of files) {
        // Check if file is an RSS feed (XML or JSON)
        if (file.mimeType === 'application/xml' || 
            file.mimeType === 'text/xml' || 
            file.mimeType === 'application/rss+xml' ||
            file.mimeType === 'application/json') {
          
          // Download the file content
          const content = await this.googleDriveClient.downloadFile(file.id);
          
          // Determine feed format
          const feedFormat = this.detectFeedFormat(content);
          
          // Parse and process the feed
          const parsedFeed = await this.parseFeed(content, feedFormat);
          const items = this.extractItems(parsedFeed, feedFormat);
          const processedItems = await this.processItems(items);
          
          // Store the processed items
          await this.storeItems(processedItems);
          
          // Schedule next update (only if file is shared publicly or accessible via URL)
          if (file.webViewLink) {
            this.scheduleNextUpdate(file.webViewLink);
          }
        }
      }
    } catch (error) {
      console.error(`Error processing Google Drive folder ${folderId}:`, error);
    }
  }

  /**
   * Detect the format of an RSS feed
   * @param content Feed content as string
   * @returns The detected feed format
   */
  private detectFeedFormat(content: string): RSSFeedFormat {
    if (typeof content !== 'string') {
      return RSSFeedFormat.CUSTOM;
    }
    
    // Check for RSS 2.0
    if (content.includes('<rss') && content.includes('version="2.0"')) {
      return RSSFeedFormat.RSS2;
    }
    
    // Check for Atom
    if (content.includes('<feed') && content.includes('xmlns="http://www.w3.org/2005/Atom"')) {
      return RSSFeedFormat.ATOM;
    }
    
    // Check for JSON Feed
    try {
      const json = JSON.parse(content);
      if (json.version && json.version.startsWith('https://jsonfeed.org/version/')) {
        return RSSFeedFormat.JSON;
      }
    } catch (e) {
      // Not JSON format
    }
    
    // If we can't determine the format, default to RSS2 and try to parse it anyway
    return RSSFeedFormat.RSS2;
  }

  /**
   * Parse an RSS feed based on its format
   * @param content Feed content
   * @param format Feed format
   * @returns Parsed feed object
   */
  private async parseFeed(content: string, format: RSSFeedFormat): Promise<any> {
    switch (format) {
      case RSSFeedFormat.RSS2:
      case RSSFeedFormat.ATOM:
        try {
          return await parseStringPromise(content, { explicitArray: false });
        } catch (error) {
          console.error('Error parsing XML feed:', error);
          throw error;
        }
      
      case RSSFeedFormat.JSON:
        try {
          return JSON.parse(content);
        } catch (error) {
          console.error('Error parsing JSON feed:', error);
          throw error;
        }
      
      case RSSFeedFormat.CUSTOM:
        // For custom formats, return the raw content for custom extraction
        return content;
      
      default:
        throw new Error(`Unsupported feed format: ${format}`);
    }
  }

  /**
   * Extract items from a parsed feed based on format
   * @param parsedFeed Parsed feed object
   * @param format Feed format
   * @returns Array of extracted RSS feed items
   */
  private extractItems(parsedFeed: any, format: RSSFeedFormat): RSSFeedItem[] {
    const items: RSSFeedItem[] = [];
    let rawItems: any[] = [];

    try {
      switch (format) {
        case RSSFeedFormat.RSS2:
          rawItems = Array.isArray(parsedFeed.rss.channel.item) 
            ? parsedFeed.rss.channel.item 
            : parsedFeed.rss.channel.item ? [parsedFeed.rss.channel.item] : [];
          
          for (const item of rawItems) {
            items.push({
              id: item.guid?._?.toString() || item.guid?.toString() || item.link,
              title: item.title || '',
              link: item.link || '',
              description: item.description || '',
              author: item.author || item['dc:creator'] || '',
              categories: Array.isArray(item.category) ? item.category : item.category ? [item.category] : [],
              content: item['content:encoded'] || item.description || '',
              publishDate: item.pubDate ? new Date(item.pubDate) : new Date(),
              enclosures: item.enclosure ? [
                {
                  url: item.enclosure.url || '',
                  type: item.enclosure.type || '',
                  length: item.enclosure.length ? parseInt(item.enclosure.length) : undefined
                }
              ] : [],
              mediaContent: item['media:content'] ? [
                {
                  url: item['media:content'].url || '',
                  type: item['media:content'].type || '',
                  width: item['media:content'].width ? parseInt(item['media:content'].width) : undefined,
                  height: item['media:content'].height ? parseInt(item['media:content'].height) : undefined
                }
              ] : [],
              metadata: {
                feedType: 'RSS2'
              }
            });
          }
          break;
        
        case RSSFeedFormat.ATOM:
          rawItems = Array.isArray(parsedFeed.feed.entry) 
            ? parsedFeed.feed.entry 
            : parsedFeed.feed.entry ? [parsedFeed.feed.entry] : [];
          
          for (const item of rawItems) {
            const links = Array.isArray(item.link) ? item.link : [item.link];
            const link = links.find((l: any) => l.$.rel === 'alternate')?.$.href || links[0]?.$.href || '';
            
            items.push({
              id: item.id || link,
              title: item.title?._? || item.title || '',
              link: link,
              description: item.summary?._? || item.summary || '',
              author: item.author?.name || '',
              content: item.content?._? || item.content || item.summary?._? || item.summary || '',
              publishDate: item.updated ? new Date(item.updated) : new Date(),
              metadata: {
                feedType: 'ATOM'
              }
            });
          }
          break;
        
        case RSSFeedFormat.JSON:
          rawItems = parsedFeed.items || [];
          
          for (const item of rawItems) {
            items.push({
              id: item.id || item.url,
              title: item.title || '',
              link: item.url || item.external_url || '',
              description: item.summary || '',
              author: item.author?.name || '',
              content: item.content_html || item.content_text || item.summary || '',
              publishDate: item.date_published ? new Date(item.date_published) : new Date(),
              categories: item.tags || [],
              metadata: {
                feedType: 'JSON',
                jsonFeed: item
              }
            });
          }
          break;
          
        default:
          console.warn(`Unsupported feed format: ${format}. No items extracted.`);
      }
    } catch (error) {
      console.error('Error extracting items from feed:', error);
    }

    // Apply maximum items constraint
    return items.slice(0, this.config.maxItemsPerFeed);
  }

  /**
   * Process extracted items with NLP, metadata extraction, etc.
   * @param items Raw RSS feed items
   * @returns Processed RSS feed items
   */
  private async processItems(items: RSSFeedItem[]): Promise<RSSFeedItem[]> {
    const processedItems: RSSFeedItem[] = [];
    

