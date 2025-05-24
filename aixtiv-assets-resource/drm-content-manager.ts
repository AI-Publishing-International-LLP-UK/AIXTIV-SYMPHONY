/**
 * AIXTIV SYMPHONY™ Content Manager
 * © 2025 AI Publishing International LLP
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This is proprietary software of AI Publishing International LLP.
 * All rights reserved. Unauthorized copying or distribution is prohibited.
 */

import { firestore } from 'firebase-admin';
import * as PineconeDB from '@pinecone-database/pinecone';
import { v4 as uuidv4 } from 'uuid';
import {
  S2DOManager,
  S2DOObjectType,
  S2DOEncryptionLevel,
  S2DOAccessLevel,
} from './S2DOImplementation';

// Interface for content metadata
interface ContentMetadata {
  id: string;
  title: string;
  description: string;
  authorId: string;
  organizationId: string;
  createdAt: firestore.Timestamp;
  updatedAt: firestore.Timestamp;
  status: ContentStatus;
  contentType: ContentType;
  tags: string[];
  versionId: string;
  parentContentId?: string;
  rights: ContentRights;
  vectorEmbeddingId?: string;
  s2doId?: string;
}

// Interface for content version
interface ContentVersion {
  id: string;
  contentId: string;
  versionNumber: number;
  createdAt: firestore.Timestamp;
  createdBy: string;
  storagePath: string;
  changeDescription: string;
  s2doId?: string;
}

// Content status enum
enum ContentStatus {
  DRAFT = 'draft',
  REVIEW = 'review',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
  REMOVED = 'removed',
}

// Content type enum
enum ContentType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  ANTHOLOGY = 'anthology',
  COLLECTION = 'collection',
  INTERACTIVE = 'interactive',
  MULTIMODAL = 'multimodal',
}

// Content rights interface
interface ContentRights {
  ownerId: string;
  ownerType: 'user' | 'organization';
  licenseType: string;
  redistributionRights: string[];
  commercialUse: boolean;
  derivativeWorks: boolean;
  royaltyStructure: any;
  nftTokenId?: string;
  blockchainRecordId?: string;
}

/**
 * Content Manager Service
 *
 * Handles all aspects of content creation, storage, retrieval, and management
 * within the AIXTIV SYMPHONY ecosystem.
 */
class ContentManagerService {
  private db: firestore.Firestore;
  private pineconeClient: PineconeDB.PineconeClient;
  private s2doManager: any;
  private vectorIndexName: string = 'aixtiv-content-vectors';

  constructor(
    db: firestore.Firestore,
    pineconeClient: PineconeDB.PineconeClient,
    s2doManager: any
  ) {
    this.db = db;
    this.pineconeClient = pineconeClient;
    this.s2doManager = s2doManager;
  }

  /**
   * Create new content
   *
   * @param metadata Content metadata
   * @param contentData The actual content data
   * @param vectorEmbedding Optional vector embedding for content
   * @returns Promise with the content ID
   */
  async createContent(
    metadata: Omit<
      ContentMetadata,
      'id' | 'createdAt' | 'updatedAt' | 'versionId'
    >,
    contentData: any,
    vectorEmbedding?: number[]
  ): Promise<string> {
    const contentId = uuidv4();
    const versionId = uuidv4();
    const now = firestore.Timestamp.now();

    // First, store the content securely using S2DO
    const s2doId = await this.s2doManager.createObject({
      data: contentData,
      type: S2DOObjectType.CONTENT,
      encryptionLevel: S2DOEncryptionLevel.HIGH,
      accessLevel: S2DOAccessLevel.PRIVATE,
      ownerId: metadata.authorId,
      organizationId: metadata.organizationId,
    });

    // If vector embedding provided, store in Pinecone
    let vectorEmbeddingId: string | undefined;
    if (vectorEmbedding && vectorEmbedding.length > 0) {
      vectorEmbeddingId = await this.storeContentVector(
        contentId,
        vectorEmbedding
      );
    }

    // Create content metadata
    const contentMetadata: ContentMetadata = {
      id: contentId,
      ...metadata,
      createdAt: now,
      updatedAt: now,
      versionId: versionId,
      vectorEmbeddingId,
      s2doId,
    };

    // Create initial version record
    const contentVersion: ContentVersion = {
      id: versionId,
      contentId: contentId,
      versionNumber: 1,
      createdAt: now,
      createdBy: metadata.authorId,
      storagePath: `s2do://${s2doId}`,
      changeDescription: 'Initial version',
      s2doId,
    };

    // Start a Firestore transaction
    const batch = this.db.batch();

    // Add content metadata
    const contentRef = this.db.collection('content').doc(contentId);
    batch.set(contentRef, contentMetadata);

    // Add content version
    const versionRef = this.db.collection('contentVersions').doc(versionId);
    batch.set(versionRef, contentVersion);

    // Commit transaction
    await batch.commit();

    return contentId;
  }

  /**
   * Update existing content
   *
   * @param contentId Content ID to update
   * @param metadata Updated metadata
   * @param contentData Updated content data
   * @param vectorEmbedding Optional updated vector embedding
   * @returns Promise with the new version ID
   */
  async updateContent(
    contentId: string,
    metadata: Partial<Omit<ContentMetadata, 'id' | 'createdAt' | 'versionId'>>,
    contentData?: any,
    vectorEmbedding?: number[]
  ): Promise<string> {
    const now = firestore.Timestamp.now();
    const versionId = uuidv4();

    // Get current content metadata
    const contentRef = this.db.collection('content').doc(contentId);
    const contentDoc = await contentRef.get();

    if (!contentDoc.exists) {
      throw new Error(`Content with ID ${contentId} not found`);
    }

    const currentContent = contentDoc.data() as ContentMetadata;

    // If content data is provided, store it with S2DO
    let s2doId: string | undefined;
    if (contentData) {
      s2doId = await this.s2doManager.createObject({
        data: contentData,
        type: S2DOObjectType.CONTENT,
        encryptionLevel: S2DOEncryptionLevel.HIGH,
        accessLevel: S2DOAccessLevel.PRIVATE,
        ownerId: currentContent.authorId,
        organizationId: currentContent.organizationId,
      });
    }

    // If vector embedding provided, update in Pinecone
    let vectorEmbeddingId = currentContent.vectorEmbeddingId;
    if (vectorEmbedding && vectorEmbedding.length > 0) {
      // Remove old vector if exists
      if (vectorEmbeddingId) {
        await this.removeContentVector(vectorEmbeddingId);
      }

      // Store new vector
      vectorEmbeddingId = await this.storeContentVector(
        contentId,
        vectorEmbedding
      );
    }

    // Create updated metadata
    const updatedMetadata: Partial<ContentMetadata> = {
      ...metadata,
      updatedAt: now,
      vectorEmbeddingId,
      ...(s2doId ? { s2doId } : {}),
    };

    // If content data is provided, create a new version record
    if (contentData) {
      // Get latest version number
      const versionsSnapshot = await this.db
        .collection('contentVersions')
        .where('contentId', '==', contentId)
        .orderBy('versionNumber', 'desc')
        .limit(1)
        .get();

      const latestVersion = versionsSnapshot.docs[0]?.data() as ContentVersion;
      const newVersionNumber = latestVersion
        ? latestVersion.versionNumber + 1
        : 1;

      // Create new version record
      const contentVersion: ContentVersion = {
        id: versionId,
        contentId: contentId,
        versionNumber: newVersionNumber,
        createdAt: now,
        createdBy: metadata.authorId || currentContent.authorId,
        storagePath: `s2do://${s2doId}`,
        changeDescription: metadata.description || 'Updated version',
        s2doId,
      };

      // Update content record with new version ID
      updatedMetadata.versionId = versionId;

      // Start a Firestore transaction
      const batch = this.db.batch();

      // Update content metadata
      batch.update(contentRef, updatedMetadata);

      // Add content version
      const versionRef = this.db.collection('contentVersions').doc(versionId);
      batch.set(versionRef, contentVersion);

      // Commit transaction
      await batch.commit();

      return versionId;
    } else {
      // Just update the metadata
      await contentRef.update(updatedMetadata);
      return currentContent.versionId;
    }
  }

  /**
   * Get content by ID
   *
   * @param contentId Content ID
   * @param includeData Whether to include the actual content data
   * @returns Promise with the content metadata and optionally the content data
   */
  async getContent(
    contentId: string,
    includeData: boolean = false
  ): Promise<{
    metadata: ContentMetadata;
    data?: any;
  }> {
    // Get content metadata
    const contentRef = this.db.collection('content').doc(contentId);
    const contentDoc = await contentRef.get();

    if (!contentDoc.exists) {
      throw new Error(`Content with ID ${contentId} not found`);
    }

    const metadata = contentDoc.data() as ContentMetadata;

    // If data is requested and S2DO ID exists, fetch from S2DO
    if (includeData && metadata.s2doId) {
      const data = await this.s2doManager.getObject(metadata.s2doId);
      return { metadata, data };
    }

    return { metadata };
  }

  /**
   * Search content by similarity using vector search
   *
   * @param queryVector Query vector
   * @param limit Number of results to return
   * @param filters Optional filters for the search
   * @returns Promise with search results
   */
  async searchContentBySimilarity(
    queryVector: number[],
    limit: number = 10,
    filters?: any
  ): Promise<ContentMetadata[]> {
    // Initialize Pinecone index
    const index = this.pineconeClient.Index(this.vectorIndexName);

    // Perform vector search
    const searchResults = await index.query({
      vector: queryVector,
      topK: limit,
      filter: filters,
      includeMetadata: true,
    });

    // Extract content IDs from results
    const contentIds = searchResults.matches.map(match => match.id);

    // Get full content metadata from Firestore
    if (contentIds.length === 0) {
      return [];
    }

    const contentSnapshot = await this.db
      .collection('content')
      .where(firestore.FieldPath.documentId(), 'in', contentIds)
      .get();

    // Map results in order of relevance
    const idToContentMap = new Map<string, ContentMetadata>();
    contentSnapshot.docs.forEach(doc => {
      idToContentMap.set(doc.id, doc.data() as ContentMetadata);
    });

    return contentIds
      .map(id => idToContentMap.get(id))
      .filter(content => content !== undefined) as ContentMetadata[];
  }

  /**
   * Store content vector in Pinecone
   *
   * @param contentId Content ID
   * @param vector Vector embedding
   * @returns Promise with the vector ID
   */
  private async storeContentVector(
    contentId: string,
    vector: number[]
  ): Promise<string> {
    // Initialize Pinecone index
    const index = this.pineconeClient.Index(this.vectorIndexName);

    // Store vector
    await index.upsert({
      vectors: [
        {
          id: contentId,
          values: vector,
          metadata: { contentId },
        },
      ],
    });

    return contentId;
  }

  /**
   * Remove content vector from Pinecone
   *
   * @param vectorId Vector ID to remove
   */
  private async removeContentVector(vectorId: string): Promise<void> {
    // Initialize Pinecone index
    const index = this.pineconeClient.Index(this.vectorIndexName);

    // Delete vector
    await index.delete({
      ids: [vectorId],
    });
  }

  /**
   * Create an anthology (collection of content)
   *
   * @param metadata Anthology metadata
   * @param contentIds Array of content IDs to include
   * @returns Promise with the anthology ID
   */
  async createAnthology(
    metadata: Omit<
      ContentMetadata,
      'id' | 'createdAt' | 'updatedAt' | 'versionId' | 'contentType'
    >,
    contentIds: string[]
  ): Promise<string> {
    // Ensure content type is anthology
    const anthologyMetadata = {
      ...metadata,
      contentType: ContentType.ANTHOLOGY,
    };

    // Create anthology content
    const anthologyData = {
      type: 'anthology',
      contents: contentIds,
      structure: {
        type: 'sequential',
        sections: contentIds.map((id, index) => ({
          id,
          order: index,
          title: `Section ${index + 1}`,
        })),
      },
    };

    // Create anthology
    return this.createContent(anthologyMetadata, anthologyData);
  }

  /**
   * Delete content (marks as removed, doesn't actually delete)
   *
   * @param contentId Content ID
   * @param permanentDelete Whether to permanently delete
   */
  async deleteContent(
    contentId: string,
    permanentDelete: boolean = false
  ): Promise<void> {
    if (permanentDelete) {
      // Get content to find S2DO and vector IDs
      const { metadata } = await this.getContent(contentId);

      // Start a Firestore transaction
      const batch = this.db.batch();

      // Delete content
      const contentRef = this.db.collection('content').doc(contentId);
      batch.delete(contentRef);

      // Delete versions
      const versionsSnapshot = await this.db
        .collection('contentVersions')
        .where('contentId', '==', contentId)
        .get();

      versionsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Commit transaction
      await batch.commit();

      // Delete S2DO content if exists
      if (metadata.s2doId) {
        await this.s2doManager.deleteObject(metadata.s2doId);
      }

      // Delete vector if exists
      if (metadata.vectorEmbeddingId) {
        await this.removeContentVector(metadata.vectorEmbeddingId);
      }
    } else {
      // Just mark as removed
      await this.db.collection('content').doc(contentId).update({
        status: ContentStatus.REMOVED,
        updatedAt: firestore.Timestamp.now(),
      });
    }
  }
}

export {
  ContentManagerService,
  ContentStatus,
  ContentType,
  ContentMetadata,
  ContentVersion,
  ContentRights,
};
