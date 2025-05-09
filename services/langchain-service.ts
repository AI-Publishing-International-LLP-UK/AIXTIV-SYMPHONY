/**
 * LangChain Service
 * Provides client-side access to LangChain functionality via Firebase Functions
 */

import { getFunctions, httpsCallable } from 'firebase/functions';

export interface LangChainPromptOptions {
  /** The prompt template to use */
  prompt: string;
  
  /** The input variables for the prompt */
  input: Record<string, any>;
  
  /** The model to use */
  model?: string;
  
  /** The provider to use (openai or anthropic) */
  provider?: 'openai' | 'anthropic';
  
  /** The temperature to use (0-1) */
  temperature?: number;
}

export interface LangChainConversationOptions extends LangChainPromptOptions {
  /** The session ID for conversation memory */
  sessionId: string;
}

export interface LangChainDocumentStoreOptions {
  /** The documents to store */
  documents: {
    /** The content of the document */
    content: string;
    
    /** Metadata for the document */
    metadata?: Record<string, any>;
  }[];
  
  /** The index name to store the documents in */
  indexName: string;
}

export interface LangChainSearchOptions {
  /** The query to search for */
  query: string;
  
  /** The index name to search in */
  indexName: string;
  
  /** The number of results to return */
  k?: number;
}

/**
 * LangChain Integration Service
 * Provides access to LangChain functions via Firebase Functions
 */
class LangChainService {
  private functions = getFunctions(undefined, 'us-west1');
  
  /**
   * Run a LangChain prompt
   * @param options The prompt options
   * @returns The result of running the prompt
   */
  async runPrompt(options: LangChainPromptOptions): Promise<string> {
    const runPrompt = httpsCallable(this.functions, 'runPrompt');
    
    const result = await runPrompt({
      prompt: options.prompt,
      input: options.input,
      model: options.model || 'gpt-4',
      provider: options.provider || 'openai',
      temperature: options.temperature || 0.7,
    });
    
    const { result: promptResult } = result.data as { result: string };
    return promptResult;
  }
  
  /**
   * Run a LangChain conversation with memory
   * @param options The conversation options
   * @returns The response and memory
   */
  async runConversation(
    options: LangChainConversationOptions
  ): Promise<{ response: string; memory: string }> {
    const runConversation = httpsCallable(this.functions, 'runConversation');
    
    const result = await runConversation({
      prompt: options.prompt,
      input: options.input,
      sessionId: options.sessionId,
      model: options.model || 'gpt-4',
      provider: options.provider || 'openai',
      temperature: options.temperature || 0.7,
    });
    
    return result.data as { response: string; memory: string };
  }
  
  /**
   * Create a document store
   * @param options The document store options
   * @returns Success status and index name
   */
  async createDocumentStore(
    options: LangChainDocumentStoreOptions
  ): Promise<{ success: boolean; indexName: string }> {
    const createDocumentStore = httpsCallable(
      this.functions,
      'createDocumentStore'
    );
    
    const result = await createDocumentStore({
      documents: options.documents,
      indexName: options.indexName,
    });
    
    return result.data as { success: boolean; indexName: string };
  }
  
  /**
   * Search documents
   * @param options The search options
   * @returns Search results
   */
  async searchDocuments(
    options: LangChainSearchOptions
  ): Promise<{
    documents: {
      content: string;
      metadata: Record<string, any>;
    }[];
  }> {
    const searchDocuments = httpsCallable(this.functions, 'searchDocuments');
    
    const result = await searchDocuments({
      query: options.query,
      indexName: options.indexName,
      k: options.k || 5,
    });
    
    return result.data as {
      documents: {
        content: string;
        metadata: Record<string, any>;
      }[];
    };
  }
  
  /**
   * Generate embeddings for a text
   * This is a local utility that leverages the document store functionality
   * @param text The text to generate embeddings for
   * @returns The embeddings as a temporary document store
   */
  async generateEmbeddings(
    text: string
  ): Promise<{ indexName: string; success: boolean }> {
    const tempIndexName = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    return this.createDocumentStore({
      documents: [
        {
          content: text,
          metadata: {
            source: 'temp-embedding',
            timestamp: Date.now(),
          },
        },
      ],
      indexName: tempIndexName,
    });
  }
  
  /**
   * Find similar content to a given text
   * @param text The text to find similar content for
   * @param indexName The index to search in
   * @param k The number of results to return
   * @returns Similar documents
   */
  async findSimilarContent(
    text: string,
    indexName: string,
    k: number = 5
  ): Promise<{
    documents: {
      content: string;
      metadata: Record<string, any>;
    }[];
  }> {
    return this.searchDocuments({
      query: text,
      indexName,
      k,
    });
  }
  
  /**
   * Answer a question with context from documents
   * @param question The question to answer
   * @param indexName The index to search for context
   * @returns The answer
   */
  async answerWithContext(
    question: string,
    indexName: string,
    options: {
      model?: string;
      provider?: 'openai' | 'anthropic';
      temperature?: number;
      k?: number;
    } = {}
  ): Promise<string> {
    // First, search for relevant documents
    const searchResults = await this.searchDocuments({
      query: question,
      indexName,
      k: options.k || 5,
    });
    
    // Extract content from documents
    const contextText = searchResults.documents
      .map((doc) => doc.content)
      .join('\n\n');
    
    // Create a prompt with context
    const prompt = `
    You are an AI assistant that answers questions based on the provided context.

    CONTEXT:
    {context}

    QUESTION:
    {question}

    ANSWER:
    `;
    
    // Run prompt with context
    return this.runPrompt({
      prompt,
      input: {
        context: contextText,
        question,
      },
      model: options.model,
      provider: options.provider,
      temperature: options.temperature,
    });
  }
}

// Export singleton instance
export const langchainService = new LangChainService();
export default langchainService;