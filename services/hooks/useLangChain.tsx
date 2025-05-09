/**
 * LangChain React Hook
 * Provides easy access to LangChain functionality in React components
 * Version: 1.0.0
 */

import { useState, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import langchainService, {
  LangChainPromptOptions,
  LangChainConversationOptions,
  LangChainDocumentStoreOptions,
  LangChainSearchOptions,
} from '../langchain-service';

export interface UseLangChainOptions {
  /**
   * Default model to use
   * @default 'gpt-4'
   */
  defaultModel?: string;
  
  /**
   * Default provider to use
   * @default 'openai'
   */
  defaultProvider?: 'openai' | 'anthropic';
  
  /**
   * Default temperature to use
   * @default 0.7
   */
  defaultTemperature?: number;
  
  /**
   * Callback for handling errors
   */
  onError?: (error: Error) => void;
}

export interface UseLangChainReturn {
  /**
   * Run a LangChain prompt
   * @param options The prompt options
   * @returns The result of running the prompt
   */
  runPrompt: (options: Omit<LangChainPromptOptions, 'model' | 'provider' | 'temperature'>) => Promise<string>;
  
  /**
   * Run a LangChain conversation with memory
   * @param options The conversation options
   * @returns The response and memory
   */
  runConversation: (
    options: Omit<
      LangChainConversationOptions,
      'model' | 'provider' | 'temperature'
    >
  ) => Promise<{ response: string; memory: string }>;
  
  /**
   * Create a document store
   * @param options The document store options
   * @returns Success status and index name
   */
  createDocumentStore: (
    options: LangChainDocumentStoreOptions
  ) => Promise<{ success: boolean; indexName: string }>;
  
  /**
   * Search documents
   * @param options The search options
   * @returns Search results
   */
  searchDocuments: (
    options: LangChainSearchOptions
  ) => Promise<{
    documents: {
      content: string;
      metadata: Record<string, any>;
    }[];
  }>;
  
  /**
   * Find similar content to a given text
   * @param text The text to find similar content for
   * @param indexName The index to search in
   * @param k The number of results to return
   * @returns Similar documents
   */
  findSimilarContent: (
    text: string,
    indexName: string,
    k?: number
  ) => Promise<{
    documents: {
      content: string;
      metadata: Record<string, any>;
    }[];
  }>;
  
  /**
   * Answer a question with context from documents
   * @param question The question to answer
   * @param indexName The index to search for context
   * @returns The answer
   */
  answerWithContext: (
    question: string,
    indexName: string,
    options?: {
      k?: number;
    }
  ) => Promise<string>;
  
  /**
   * Generate a unique session ID for conversations
   * @returns A unique session ID
   */
  generateSessionId: () => string;
  
  /**
   * Whether the service is currently loading
   */
  loading: boolean;
  
  /**
   * Current error, if any
   */
  error: Error | null;
}

/**
 * Hook for using LangChain in React components
 * @param options Options for the hook
 * @returns LangChain functions and state
 */
export const useLangChain = (
  options: UseLangChainOptions = {}
): UseLangChainReturn => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  
  const {
    defaultModel = 'gpt-4',
    defaultProvider = 'openai',
    defaultTemperature = 0.7,
    onError,
  } = options;
  
  /**
   * Handle errors
   */
  const handleError = useCallback(
    (error: Error) => {
      setError(error);
      setLoading(false);
      
      if (onError) {
        onError(error);
      }
      
      console.error('LangChain error:', error);
    },
    [onError]
  );
  
  /**
   * Run a LangChain prompt
   */
  const runPrompt = useCallback(
    async (
      options: Omit<LangChainPromptOptions, 'model' | 'provider' | 'temperature'>
    ): Promise<string> => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await langchainService.runPrompt({
          ...options,
          model: defaultModel,
          provider: defaultProvider,
          temperature: defaultTemperature,
        });
        
        setLoading(false);
        return result;
      } catch (error) {
        handleError(error as Error);
        throw error;
      }
    },
    [defaultModel, defaultProvider, defaultTemperature, handleError]
  );
  
  /**
   * Run a LangChain conversation with memory
   */
  const runConversation = useCallback(
    async (
      options: Omit<
        LangChainConversationOptions,
        'model' | 'provider' | 'temperature'
      >
    ): Promise<{ response: string; memory: string }> => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await langchainService.runConversation({
          ...options,
          model: defaultModel,
          provider: defaultProvider,
          temperature: defaultTemperature,
        });
        
        setLoading(false);
        return result;
      } catch (error) {
        handleError(error as Error);
        throw error;
      }
    },
    [defaultModel, defaultProvider, defaultTemperature, handleError]
  );
  
  /**
   * Create a document store
   */
  const createDocumentStore = useCallback(
    async (
      options: LangChainDocumentStoreOptions
    ): Promise<{ success: boolean; indexName: string }> => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await langchainService.createDocumentStore(options);
        
        setLoading(false);
        return result;
      } catch (error) {
        handleError(error as Error);
        throw error;
      }
    },
    [handleError]
  );
  
  /**
   * Search documents
   */
  const searchDocuments = useCallback(
    async (
      options: LangChainSearchOptions
    ): Promise<{
      documents: {
        content: string;
        metadata: Record<string, any>;
      }[];
    }> => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await langchainService.searchDocuments(options);
        
        setLoading(false);
        return result;
      } catch (error) {
        handleError(error as Error);
        throw error;
      }
    },
    [handleError]
  );
  
  /**
   * Find similar content to a given text
   */
  const findSimilarContent = useCallback(
    async (
      text: string,
      indexName: string,
      k: number = 5
    ): Promise<{
      documents: {
        content: string;
        metadata: Record<string, any>;
      }[];
    }> => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await langchainService.findSimilarContent(text, indexName, k);
        
        setLoading(false);
        return result;
      } catch (error) {
        handleError(error as Error);
        throw error;
      }
    },
    [handleError]
  );
  
  /**
   * Answer a question with context from documents
   */
  const answerWithContext = useCallback(
    async (
      question: string,
      indexName: string,
      options: {
        k?: number;
      } = {}
    ): Promise<string> => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await langchainService.answerWithContext(
          question,
          indexName,
          {
            model: defaultModel,
            provider: defaultProvider,
            temperature: defaultTemperature,
            k: options.k,
          }
        );
        
        setLoading(false);
        return result;
      } catch (error) {
        handleError(error as Error);
        throw error;
      }
    },
    [defaultModel, defaultProvider, defaultTemperature, handleError]
  );
  
  /**
   * Generate a unique session ID for conversations
   */
  const generateSessionId = useCallback((): string => {
    return uuidv4();
  }, []);
  
  return {
    runPrompt,
    runConversation,
    createDocumentStore,
    searchDocuments,
    findSimilarContent,
    answerWithContext,
    generateSessionId,
    loading,
    error,
  };
};

export default useLangChain;