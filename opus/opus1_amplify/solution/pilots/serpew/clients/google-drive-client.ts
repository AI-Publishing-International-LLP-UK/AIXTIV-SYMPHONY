import { google, drive_v3 } from 'googleapis';
import { JWT } from 'google-auth-library';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Interface for RSS data structure
 */
interface RSSItem {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  guid: string;
  author?: string;
  category?: string[];
  [key: string]: any;
}

/**
 * Configuration for GoogleDriveClient
 */
interface GoogleDriveConfig {
  credentialsPath?: string;
  credentials?: {
    client_email: string;
    private_key: string;
    [key: string]: any;
  };
  scopes?: string[];
  userEmail?: string;
  workspaceAccount?: string;
}

/**
 * Search parameters for finding files
 */
interface FileSearchParams {
  mimeType?: string;
  name?: string;
  trashed?: boolean;
  folderId?: string;
  sharedWithMe?: boolean;
  fileExtension?: string;
}

/**
 * Client for interacting with Google Drive API, especially for RSS data
 * with specific support for coaching2100.com Google Workspace account
 */
export class GoogleDriveClient {
  private drive: drive_v3.Drive;
  private auth: JWT;
  private userEmail: string;
  private workspaceAccount: string;
  private initialized: boolean = false;

  /**
   * Creates a new GoogleDriveClient instance
   * @param config Configuration options
   */
  constructor(config: GoogleDriveConfig = {}) {
    // Set default values for coaching2100.com
    this.userEmail = config.userEmail || 'pr@coaching2100.com';
    this.workspaceAccount = config.workspaceAccount || 'coaching2100.com';

    // Will be initialized in init() method
    this.auth = null!;
    this.drive = null!;
  }

  /**
   * Initializes the Google Drive API client
   * @param credentialsPath Path to the service account credentials file
   */
  async init(credentialsPath?: string): Promise<void> {
    try {
      let credentials;
      
      if (credentialsPath) {
        // Load credentials from file
        const content = fs.readFileSync(credentialsPath, 'utf8');
        credentials = JSON.parse(content);
      } else {
        // Look for credentials in environment variable
        const envCreds = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
        if (envCreds) {
          credentials = JSON.parse(envCreds);
        } else {
          throw new Error('No credentials provided. Either specify a credentialsPath or set GOOGLE_APPLICATION_CREDENTIALS_JSON environment variable.');
        }
      }

      // Default scopes for Google Drive
      const scopes = [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.metadata.readonly'
      ];

      // Create JWT auth client
      this.auth = new JWT({
        email: credentials.client_email,
        key: credentials.private_key,
        scopes,
        subject: this.userEmail // Impersonate the workspace user
      });

      // Create Drive client
      this.drive = google.drive({ version: 'v3', auth: this.auth });
      
      this.initialized = true;
      console.log(`GoogleDriveClient initialized for ${this.userEmail} on ${this.workspaceAccount} workspace`);
    } catch (error) {
      console.error('Failed to initialize GoogleDriveClient:', error);
      throw error;
    }
  }

  /**
   * Ensures the client is initialized before making API calls
   * @private
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('GoogleDriveClient is not initialized. Call init() method first.');
    }
  }

  /**
   * Lists files in Google Drive based on search parameters
   * @param params Search parameters
   * @param pageSize Number of results to return per page
   * @param pageToken Token for the next page of results
   * @returns List of files matching the parameters
   */
  async listFiles(params: FileSearchParams = {}, pageSize = 100, pageToken?: string): Promise<drive_v3.Schema$File[]> {
    this.ensureInitialized();

    try {
      let query: string[] = [];
      
      if (params.mimeType) {
        query.push(`mimeType='${params.mimeType}'`);
      }
      
      if (params.name) {
        query.push(`name contains '${params.name}'`);
      }
      
      if (params.fileExtension) {
        query.push(`name contains '.${params.fileExtension}'`);
      }
      
      if (params.folderId) {
        query.push(`'${params.folderId}' in parents`);
      }
      
      // Handle trashed files
      query.push(`trashed=${!!params.trashed}`);
      
      // Handle shared files
      if (params.sharedWithMe) {
        query.push(`sharedWithMe=true`);
      }
      
      const queryString = query.join(' and ');
      
      const response = await this.drive.files.list({
        q: queryString,
        pageSize,
        pageToken,
        fields: 'nextPageToken, files(id, name, mimeType, createdTime, modifiedTime, webViewLink, webContentLink, owners, sharingUser, shared)'
      });
      
      return response.data.files || [];
    } catch (error) {
      console.error('Error listing files:', error);
      throw error;
    }
  }

  /**
   * Finds all RSS files shared with the user
   * @returns Array of RSS files
   */
  async findSharedRSSFiles(): Promise<drive_v3.Schema$File[]> {
    try {
      // Look for XML files or files with RSS content
      const xmlFiles = await this.listFiles({
        fileExtension: 'xml',
        sharedWithMe: true,
        trashed: false
      });
      
      const rssFiles = await this.listFiles({
        name: 'rss',
        sharedWithMe: true,
        trashed: false
      });
      
      // Combine and remove duplicates
      const fileMap = new Map<string, drive_v3.Schema$File>();
      
      [...xmlFiles, ...rssFiles].forEach(file => {
        if (file.id) {
          fileMap.set(file.id, file);
        }
      });
      
      return Array.from(fileMap.values());
    } catch (error) {
      console.error('Error finding shared RSS files:', error);
      throw error;
    }
  }

  /**
   * Downloads a file from Google Drive
   * @param fileId ID of the file to download
   * @param destPath Path to save the downloaded file (optional)
   * @returns Content of the file as a string or the path to the saved file
   */
  async downloadFile(fileId: string, destPath?: string): Promise<string> {
    this.ensureInitialized();

    try {
      const response = await this.drive.files.get({
        fileId,
        alt: 'media'
      }, { responseType: 'stream' });

      if (destPath) {
        // Ensure directory exists
        const directory = path.dirname(destPath);
        if (!fs.existsSync(directory)) {
          fs.mkdirSync(directory, { recursive: true });
        }
        
        // Create a write stream
        const writer = fs.createWriteStream(destPath);
        
        // Pipe the response data to the file
        return new Promise<string>((resolve, reject) => {
          response.data
            .on('end', () => resolve(destPath))
            .on('error', reject)
            .pipe(writer);
        });
      } else {
        // Return the content as a string
        const chunks: Buffer[] = [];
        
        return new Promise<string>((resolve, reject) => {
          response.data
            .on('data', (chunk) => chunks.push(Buffer.from(chunk)))
            .on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
            .on('error', reject);
        });
      }
    } catch (error) {
      console.error(`Error downloading file ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Parses an RSS XML string to extract items
   * @param xmlContent XML content as a string
   * @returns Array of parsed RSS items
   */
  parseRSSContent(xmlContent: string): RSSItem[] {
    try {
      // Simple XML parser for RSS content
      // In a production environment, you might want to use a dedicated XML parsing library
      
      const items: RSSItem[] = [];
      
      // Extract each item from the RSS feed
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      
      while ((match = itemRegex.exec(xmlContent)) !== null) {
        const itemContent = match[1];
        const item: Partial<RSSItem> = {};
        
        // Extract title
        const titleMatch = /<title>(.*?)<\/title>/i.exec(itemContent);
        if (titleMatch) item.title = titleMatch[1];
        
        // Extract link
        const linkMatch = /<link>(.*?)<\/link>/i.exec(itemContent);
        if (linkMatch) item.link = linkMatch[1];
        
        // Extract description
        const descMatch = /<description>([\s\S]*?)<\/description>/i.exec(itemContent);
        if (descMatch) item.description = descMatch[1];
        
        // Extract pubDate
        const pubDateMatch = /<pubDate>(.*?)<\/pubDate>/i.exec(itemContent);
        if (pubDateMatch) item.pubDate = pubDateMatch[1];
        
        // Extract guid
        const guidMatch = /<guid.*?>(.*?)<\/guid>/i.exec(itemContent);
        if (guidMatch) item.guid = guidMatch[1];
        
        // Extract author if available
        const authorMatch = /<author>(.*?)<\/author>/i.exec(itemContent);
        if (authorMatch) item.author = authorMatch[1];
        
        // Extract categories
        const categories: string[] = [];
        const categoryRegex = /<category>(.*?)<\/category>/g;
        let catMatch;
        
        while ((catMatch = categoryRegex.exec(itemContent)) !== null) {
          categories.push(catMatch[1]);
        }
        
        if (categories.length > 0) {
          item.category = categories;
        }
        
        // Only add the item if it has required fields
        if (item.title && item.link) {
          items.push(item as RSSItem);
        }
      }
      
      return items;
    } catch (error) {
      console.error('Error parsing RSS content:', error);
      throw error;
    }
  }

  /**
   * Fetches and processes RSS content from a Google Drive file
   * @param fileId ID of the RSS file in Google Drive
   * @returns Array of parsed RSS items
   */
  async fetchAndProcessRSS(fileId: string): Promise<RSSItem[]> {
    try {
      const content = await this.downloadFile(fileId);
      return this.parseRSSContent(content);
    } catch (error) {
      console.error(`Error processing RSS file ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Fetches all shared RSS files and processes them
   * @returns A map of file names to their parsed RSS items
   */
  async fetchAllSharedRSSData(): Promise<Map<string, RSSItem[]>> {
    try {
      const rssFiles = await this.findSharedRSSFiles();
      const results = new Map<string, RSSItem[]>();
      
      for (const file of rssFiles) {
        if (file.id && file.name) {
          try {
            const rssItems = await this.fetchAndProcessRSS(file.id);
            results.set(file.name, rssItems);
            console.log(`Successfully processed RSS file: ${file.name} (${rssItems.length} items)`);
          } catch (error) {
            console.error(`Error processing RSS file ${file.name}:`, error);
            // Continue with other files even if one fails
          }
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error fetching all shared RSS data:', error);
      throw error;
    }
  }

  /**
   * Creates a temporary access URL for a file in Google Drive
   * @param fileId ID of the file
   * @param expiryTimeMs Expiry time in milliseconds
   * @returns Temporary URL for accessing the file
   */
  async createTemporaryAccessUrl(fileId: string, expiryTimeMs = 3600000): Promise<string> {
    this.ensureInitialized();

    try {
      // Get the file metadata to confirm it exists
      await this.drive.files.get({
        fileId,
        fields: 'id,name'
      });
      
      // Generate a signed URL that expires after the specified time
      const expiryDate = new Date();
      expiryDate.setTime(expiryDate.getTime() + expiryTimeMs);
      
      const response = await this.drive.files.get({
        fileId,
        alt: 'media'
      }, {
        headers: {
          'Authorization': `Bearer ${(await this.auth.getAccessToken()).token}`
        }
      });
      
      // Return the URL that can be used to access the file
      return `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media&access_token=${(await this.auth.getAccessToken()).token}`;
    } catch (error) {
      console.error(`Error creating temporary access URL for file ${fileId}:`, error);
      throw error;
    }
  }

  /**
   * Monitors a folder for new or updated RSS files
   * @param folderId ID of the folder to monitor
   * @param intervalMs Polling interval in milliseconds
   * @param callback Function to call when new/updated files are found
   * @returns A function to stop monitoring
   */
  monitorRSSFolder(folderId: string, intervalMs = 300000, callback: (files: drive_v3.Schema$File[]) => void): () => void {
    this.ensureInitialized();

    let lastCheckTime = new Date();
    let intervalId: NodeJS.Timeout;
    
    const checkForUpdates = async () => {
      try {
        // Get files modified after lastCheckTime
        const query = `'${folderId}' in parents and (mimeType='application/xml' or mimeType='text/xml') and modifiedTime > '${lastCheckTime.toISOString()}'`;
        
        const response = await this.drive.files.list({
          q: query,
          fields: 'files(id, name, mimeType, createdTime, modifiedTime)'
        });
        
        const updatedFiles = response.data.files || [];
        
        if (updatedFiles.length > 0) {
          // Update lastCheckTime to now
          lastCheckTime = new Date();
          
          // Call the callback with updated files
          callback(updatedFiles

