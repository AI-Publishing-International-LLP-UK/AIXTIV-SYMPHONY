import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PineconeClient } from '@pinecone-database/pinecone';
import { Document } from 'langchain/document';
import { v4 as uuidv4 } from 'uuid';
import { FeedItem } from '../types';

/**
 * VectorEmbedder class for converting text content into vector embeddings
 * for semantic search and storage in vector databases.
 */
export class VectorEmbedder {
  private embeddings: OpenAIEmbeddings;
  private pineconeClient: PineconeClient | null = null;
  private namespace: string;
  private indexName: string;
  private apiKey: string;
  private environment: string;
  private dimensionSize: number;

  /**
   * Creates a new VectorEmbedder instance
   *
   * @param apiKey - OpenAI API key for generating embeddings
   * @param pineconeApiKey - Pinecone API key (optional)
   * @param pineconeEnvironment - Pinecone environment (optional)
   * @param pineconeIndex - Pinecone index name (optional)
   * @param namespace - Namespace for vector storage (optional)
   * @param dimensionSize - Size of embedding vectors (default: 1536 for OpenAI embeddings)
   */
  constructor(
    apiKey: string,
    pineconeApiKey?: string,
    pineconeEnvironment?: string,
    pineconeIndex?: string,
    namespace?: string,
    dimensionSize: number = 1536
  ) {
    this.apiKey = apiKey;
    this.environment = pineconeEnvironment || '';
    this.indexName = pineconeIndex || '';
    this.namespace = namespace || 'serpew-rss-feeds';
    this.dimensionSize = dimensionSize;

    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: apiKey,
      modelName: 'text-embedding-ada-002',
    });

    if (pineconeApiKey && pineconeEnvironment && pineconeIndex) {
      this.initPinecone(pineconeApiKey, pineconeEnvironment, pineconeIndex);
    }
  }

  /**
   * Initializes the Pinecone client for vector storage
   *
   * @param apiKey - Pinecone API key
   * @param environment - Pinecone environment
   * @param indexName - Pinecone index name
   */
  private async initPinecone(
    apiKey: string,
    environment: string,
    indexName: string
  ): Promise<void> {
    this.pineconeClient = new PineconeClient();
    await this.pineconeClient.init({
      apiKey,
      environment,
    });

    // Check if index exists, create if it doesn't
    const indexList = await this.pineconeClient.listIndexes();
    if (!indexList.includes(indexName)) {
      console.log(`Creating new Pinecone index: ${indexName}`);
      await this.pineconeClient.createIndex({
        createRequest: {
          name: indexName,
          dimension: this.dimensionSize,
          metric: 'cosine',
        },
      });
    }
  }

  /**
   * Generates embeddings for the given text content
   *
   * @param text - Text content to embed
   * @returns Vector embedding as number array
   */
  public async embedText(text: string): Promise<number[]> {
    try {
      const embedding = await this.embeddings.embedQuery(text);
      return embedding;
    } catch (error) {
      console.error('Error generating embeddings:', error);
      throw new Error(`Failed to generate embeddings: ${error.message}`);
    }
  }

  /**
   * Embeds a batch of texts efficiently
   *
   * @param texts - Array of text strings to embed
   * @returns Array of vector embeddings
   */
  public async embedBatch(texts: string[]): Promise<number[][]> {
    try {
      const embeddings = await this.embeddings.embedDocuments(texts);
      return embeddings;
    } catch (error) {
      console.error('Error generating batch embeddings:', error);
      throw new Error(`Failed to generate batch embeddings: ${error.message}`);
    }
  }

  /**
   * Stores vector embeddings in Pinecone
   *
   * @param texts - Array of text content
   * @param metadata - Array of metadata objects corresponding to each text
   * @returns Array of IDs for the stored vectors
   */
  public async storeVectors(
    texts: string[],
    metadata: Record<string, any>[]
  ): Promise<string[]> {
    if (!this.pineconeClient) {
      throw new Error('Pinecone client not initialized');
    }

    if (texts.length !== metadata.length) {
      throw new Error('Number of texts must match number of metadata objects');
    }

    try {
      const embeddings = await this.embedBatch(texts);
      const index = this.pineconeClient.Index(this.indexName);

      const vectors = embeddings.map((embedding, i) => ({
        id: uuidv4(),
        values: embedding,
        metadata: metadata[i],
      }));

      await index.upsert({
        upsertRequest: {
          vectors,
          namespace: this.namespace,
        },
      });

      return vectors.map(v => v.id);
    } catch (error) {
      console.error('Error storing vectors in Pinecone:', error);
      throw new Error(`Failed to store vectors: ${error.message}`);
    }
  }

  /**
   * Processes RSS feed items and stores their embeddings in the vector database
   *
   * @param feedItems - Array of RSS feed items to process
   * @returns Array of IDs for the stored vectors
   */
  public async processFeedItems(feedItems: FeedItem[]): Promise<string[]> {
    const texts = feedItems.map(item => {
      // Combine title, description and content for a rich embedding
      return `${item.title}\n\n${item.description || ''}\n\n${item.content || ''}`;
    });

    const metadata = feedItems.map(item => ({
      id: item.id,
      title: item.title,
      link: item.link,
      pubDate: item.pubDate,
      feedUrl: item.feedUrl,
      source: 'serpew-rss',
      timestamp: new Date().toISOString(),
    }));

    return await this.storeVectors(texts, metadata);
  }

  /**
   * Performs a semantic search using the embedded query
   *
   * @param query - Search query text
   * @param topK - Number of results to return (default: 5)
   * @returns Search results with similarity scores and metadata
   */
  public async semanticSearch(query: string, topK: number = 5): Promise<any[]> {
    if (!this.pineconeClient) {
      throw new Error('Pinecone client not initialized');
    }

    try {
      const queryEmbedding = await this.embedText(query);
      const index = this.pineconeClient.Index(this.indexName);

      const results = await index.query({
        queryRequest: {
          vector: queryEmbedding,
          topK,
          includeMetadata: true,
          namespace: this.namespace,
        },
      });

      return results.matches || [];
    } catch (error) {
      console.error('Error during semantic search:', error);
      throw new Error(`Semantic search failed: ${error.message}`);
    }
  }

  /**
   * Updates the vector database with new embeddings for modified content
   *
   * @param id - ID of the vector to update
   * @param newText - New text content
   * @param metadata - Updated metadata
   */
  public async updateVector(
    id: string,
    newText: string,
    metadata: Record<string, any>
  ): Promise<void> {
    if (!this.pineconeClient) {
      throw new Error('Pinecone client not initialized');
    }

    try {
      const embedding = await this.embedText(newText);
      const index = this.pineconeClient.Index(this.indexName);

      await index.upsert({
        upsertRequest: {
          vectors: [
            {
              id,
              values: embedding,
              metadata,
            },
          ],
          namespace: this.namespace,
        },
      });
    } catch (error) {
      console.error('Error updating vector:', error);
      throw new Error(`Failed to update vector: ${error.message}`);
    }
  }

  /**
   * Deletes vectors from the database
   *
   * @param ids - Array of vector IDs to delete
   */
  public async deleteVectors(ids: string[]): Promise<void> {
    if (!this.pineconeClient) {
      throw new Error('Pinecone client not initialized');
    }

    try {
      const index = this.pineconeClient.Index(this.indexName);
      await index.delete({
        deleteRequest: {
          ids,
          namespace: this.namespace,
        },
      });
    } catch (error) {
      console.error('Error deleting vectors:', error);
      throw new Error(`Failed to delete vectors: ${error.message}`);
    }
  }
}
