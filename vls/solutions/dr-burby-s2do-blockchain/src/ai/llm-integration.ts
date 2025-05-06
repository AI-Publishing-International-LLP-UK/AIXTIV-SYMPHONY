import axios, { AxiosError, AxiosInstance } from 'axios';
import { backOff } from 'exponential-backoff';

/**
 * Constants for LLM integration
 */
const DEFAULT_TIMEOUT_MS = 30000;
const MAX_RETRIES = 3;
const INITIAL_BACKOFF_MS = 1000;
const MAX_BACKOFF_MS = 10000;

/**
 * Error types for LLM operations
 */
export enum LLMErrorType {
  AUTHENTICATION = 'authentication',
  RATE_LIMIT = 'rate_limit',
  CONTEXT_LENGTH = 'context_length',
  INVALID_REQUEST = 'invalid_request',
  SERVICE_UNAVAILABLE = 'service_unavailable',
  CONTENT_FILTER = 'content_filter',
  UNKNOWN = 'unknown'
}

/**
 * Custom error class for LLM operations
 */
export class LLMError extends Error {
  public readonly type: LLMErrorType;
  public readonly statusCode?: number;
  public readonly retryable: boolean;

  constructor(
    message: string,
    type: LLMErrorType = LLMErrorType.UNKNOWN,
    statusCode?: number,
    retryable: boolean = false
  ) {
    super(message);
    this.name = 'LLMError';
    this.type = type;
    this.statusCode = statusCode;
    this.retryable = retryable;
    Object.setPrototypeOf(this, LLMError.prototype);
  }
}

/**
 * Interface for LLM provider configurations
 */
export interface LLMConfig {
  apiKey: string;
  baseUrl?: string;
  organizationId?: string;
  defaultModel: string;
  timeoutMs?: number;
}

/**
 * Interface for prompts to be sent to LLMs
 */
export interface LLMPrompt {
  system?: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

/**
 * Interface for LLM responses
 */
export interface LLMResponse {
  content: string;
  model: string;
  finishReason?: string;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
}

/**
 * Interface for blockchain decision requests
 */
export interface BlockchainDecisionRequest {
  transactionDetails: {
    from: string;
    to?: string;
    value?: string;
    data?: string;
    function?: string;
    parameters?: Record<string, any>;
  };
  contextData?: {
    previousTransactions?: any[];
    userTrustScore?: number;
    governanceRules?: any;
  };
  decisionType: 'validation' | 'governance' | 'risk';
}

/**
 * Interface for blockchain decision responses
 */
export interface BlockchainDecisionResponse {
  decision: 'approve' | 'reject' | 'escalate';
  confidence: number;
  reasoning: string;
  suggestedModifications?: Record<string, any>;
  governanceFindings?: string[];
  riskAssessment?: {
    score: number;
    factors: string[];
  };
}

/**
 * Base interface for LLM service providers
 */
export interface LLMService {
  /**
   * Completes a prompt with the LLM
   */
  complete(prompt: LLMPrompt): Promise<LLMResponse>;
  
  /**
   * Generates a blockchain decision based on transaction data
   */
  generateBlockchainDecision(request: BlockchainDecisionRequest): Promise<BlockchainDecisionResponse>;
  
  /**
   * Verifies a blockchain transaction for validity
   */
  verifyTransaction(transactionData: any): Promise<{
    isValid: boolean;
    reasons: string[];
  }>;
  
  /**
   * Validates governance input against established rules
   */
  validateGovernanceInput(governanceData: any, rules: any): Promise<{
    isValid: boolean;
    violations: string[];
    suggestions: string[];
  }>;
}

/**
 * Base abstract class for LLM services
 */
export abstract class BaseLLMService implements LLMService {
  protected config: LLMConfig;
  protected client: AxiosInstance;
  protected activeRequests: Set<symbol> = new Set();

  constructor(config: LLMConfig) {
    this.config = {
      ...config,
      timeoutMs: config.timeoutMs || DEFAULT_TIMEOUT_MS
    };
    
    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeoutMs,
      headers: {
        'Content-Type': 'application/json',
      }
    });
  }

  /**
   * Abstract method to complete a prompt - to be implemented by specific providers
   */
  public abstract complete(prompt: LLMPrompt): Promise<LLMResponse>;

  /**
   * Generates a blockchain decision using the LLM
   */
  public async generateBlockchainDecision(request: BlockchainDecisionRequest): Promise<BlockchainDecisionResponse> {
    // Construct a detailed prompt for the LLM
    const systemPrompt = `You are a blockchain governance expert evaluating transactions for the S2DO Blockchain system. 
Your task is to provide a decision on the transaction based on security, compliance, and governance best practices.
Respond with a decision (approve/reject/escalate), confidence level, reasoning, and any suggested modifications.`;

    const userPrompt = this.constructBlockchainDecisionPrompt(request);
    
    try {
      const response = await this.complete({
        system: systemPrompt,
        user: userPrompt,
        temperature: 0.2, // Lower temperature for more deterministic responses
        maxTokens: 1000
      });
      
      return this.parseBlockchainDecisionResponse(response.content);
    } catch (error) {
      console.error('Error generating blockchain decision:', error);
      throw new LLMError(
        `Failed to generate blockchain decision: ${error instanceof Error ? error.message : 'Unknown error'}`,
        LLMErrorType.UNKNOWN
      );
    }
  }

  /**
   * Verifies a blockchain transaction
   */
  public async verifyTransaction(transactionData: any): Promise<{ isValid: boolean; reasons: string[] }> {
    const systemPrompt = `You are a blockchain security expert reviewing transactions for the S2DO Blockchain system.
Your task is to verify if the transaction is valid, secure, and complies with expected patterns.
Analyze the transaction data and respond with a verification result and detailed reasons.`;

    const userPrompt = `Please verify the following blockchain transaction:
\`\`\`json
${JSON.stringify(transactionData, null, 2)}
\`\`\`

Verify that:
1. The transaction format is valid
2. Parameter types match expected values
3. There are no suspicious patterns or potential security risks
4. The transaction complies with governance rules`;
    
    try {
      const response = await this.complete({
        system: systemPrompt,
        user: userPrompt,
        temperature: 0.1
      });
      
      return this.parseTransactionVerificationResponse(response.content);
    } catch (error) {
      console.error('Error verifying transaction:', error);
      throw new LLMError(
        `Failed to verify transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        LLMErrorType.UNKNOWN
      );
    }
  }

  /**
   * Validates governance input against established rules
   */
  public async validateGovernanceInput(governanceData: any, rules: any): Promise<{ 
    isValid: boolean; 
    violations: string[]; 
    suggestions: string[]; 
  }> {
    const systemPrompt = `You are a blockchain governance expert for the S2DO Blockchain system.
Your task is to validate governance input against established rules and best practices.
Analyze the input data and respond with a validation result, any rule violations, and suggestions for improvement.`;

    const userPrompt = `Please validate the following governance input:
\`\`\`json
${JSON.stringify(governanceData, null, 2)}
\`\`\`

Against these governance rules:
\`\`\`json
${JSON.stringify(rules, null, 2)}
\`\`\`

Provide:
1. Is the input valid? (yes/no)
2. List any rule violations
3. Suggestions for improving the governance input`;
    
    try {
      const response = await this.complete({
        system: systemPrompt,
        user: userPrompt,
        temperature: 0.1
      });
      
      return this.parseGovernanceValidationResponse(response.content);
    } catch (error) {
      console.error('Error validating governance input:', error);
      throw new LLMError(
        `Failed to validate governance input: ${error instanceof Error ? error.message : 'Unknown error'}`,
        LLMErrorType.UNKNOWN
      );
    }
  }

  /**
   * Executes a function with retry logic using exponential backoff
   */
  protected async withRetry<T>(fn: () => Promise<T>): Promise<T> {
    const requestId = Symbol('request-id');
    this.activeRequests.add(requestId);
    
    try {
      return await backOff(() => fn(), {
        startingDelay: INITIAL_BACKOFF_MS,
        maxDelay: MAX_BACKOFF_MS,
        numOfAttempts: MAX_RETRIES,
        retry: (error) => {
          if (error instanceof LLMError) {
            return error.retryable;
          }
          
          if (axios.isAxiosError(error)) {
            const status = error.response?.status || 0;
            // Retry on rate limits or service unavailable
            return status === 429 || (status >= 500 && status < 600);
          }
          
          return false;
        }
      });
    } finally {
      this.activeRequests.delete(requestId);
    }
  }

  /**
   * Constructs a detailed prompt for blockchain decision requests
   */
  protected constructBlockchainDecisionPrompt(request: BlockchainDecisionRequest): string {
    const { transactionDetails, contextData, decisionType } = request;
    
    let prompt = `Please evaluate the following blockchain transaction for ${decisionType} purposes:\n\n`;
    prompt += `Transaction Details:\n`;
    prompt += `- From: ${transactionDetails.from}\n`;
    
    if (transactionDetails.to) {
      prompt += `- To: ${transactionDetails.to}\n`;
    }
    
    if (transactionDetails.value) {
      prompt += `- Value: ${transactionDetails.value}\n`;
    }
    
    if (transactionDetails.function) {
      prompt += `- Function: ${transactionDetails.function}\n`;
    }
    
    if (transactionDetails.data) {
      prompt += `- Data: ${transactionDetails.data}\n`;
    }
    
    if (transactionDetails.parameters) {
      prompt += `- Parameters: ${JSON.stringify(transactionDetails.parameters, null, 2)}\n`;
    }
    
    if (contextData) {
      prompt += `\nContext Information:\n`;
      
      if (contextData.userTrustScore !== undefined) {
        prompt += `- User Trust Score: ${contextData.userTrustScore}\n`;
      }
      
      if (contextData.governanceRules) {
        prompt += `- Governance Rules: ${JSON.stringify(contextData.governanceRules, null, 2)}\n`;
      }
      
      if (contextData.previousTransactions && contextData.previousTransactions.length > 0) {
        prompt += `- Previous Transactions: ${JSON.stringify(contextData.previousTransactions, null, 2)}\n`;
      }
    }
    
    prompt += `\nBased on the above information, please provide:\n`;
    prompt += `1. Decision: Should this transaction be approved, rejected, or escalated?\n`;
    prompt += `2. Confidence: How confident are you in your decision (0-100%)?\n`;
    prompt += `3. Reasoning: Why did you make this decision?\n`;
    prompt += `4. Suggested Modifications: If any changes are needed, what would you recommend?\n`;
    
    if (decisionType === 'governance') {
      prompt += `5. Governance Findings: List any governance-related findings or concerns.\n`;
    }
    
    if (decisionType === 'risk') {
      prompt += `5. Risk Assessment: Provide a risk score (0-100) and list risk factors.\n`;
    }
    
    return prompt;
  }

  /**
   * Parses the LLM response for blockchain decisions
   */
  protected parseBlockchainDecisionResponse(content: string): BlockchainDecisionResponse {
    try {
      // First attempt to parse as JSON
      try {
        const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch && jsonMatch[1]) {
          const parsed = JSON.parse(jsonMatch[1]);
          if (this.isValidBlockchainDecisionResponse(parsed)) {
            return parsed;
          }
        }
      } catch (e) {
        // Continue with text parsing if JSON parsing fails
      }
      
      // Text-based parsing as fallback
      const decisionMatch = content.match(/Decision:?\s*(approve|reject|escalate)/i);
      const confidenceMatch = content.match(/Confidence:?\s*(\d+(?:\.\d+)?)/i);
      const reasoningMatch = content.match(/Reasoning:?\s*(.*?)(?:\n\n|\n[A-Z]|$)/is);
      const modificationsMatch = content.match(/Suggested Modifications:?\s*(.*?)(?:\n\n|\n[A-Z]|$)/is);
      const governanceMatch = content.match(/Governance Findings:?\s*(.*?)(?:\n\n|\n[A-Z]|$)/is);
      const riskMatch = content.match(/Risk Assessment:?\s*(.*?)(?:\n\n|\n[A-Z]|$)/is);
      
      const decision = decisionMatch ? decisionMatch[1].toLowerCase() as 'approve' | 'reject' | 'escalate' : 'escalate';
      const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) / 100 : 0.5;
      const reasoning = reasoningMatch ? reasoningMatch[1].trim() : 'No reasoning provided';
      
      const response: BlockchainDecisionResponse = {
        decision,
        confidence,
        reasoning,
      };
      
      if (modificationsMatch) {
        const modificationText = modificationsMatch[1].trim();
        const modifications: Record<string, any> = {};
        
        // Simple parsing of key-value pairs
        const modLines = modificationText.split('\n');
        modLines.forEach(line => {
          const kvMatch = line.match(/^[\s-]*([^:]+):\s*(.*?)$/);
          if (kvMatch) {
            modifications[kvMatch[1].trim()] = kvMatch[2].trim();
          }
        });
        
        if (Object.keys(modifications).length > 0) {
          response.suggestedModifications = modifications;
        }
      }
      
      if (governanceMatch) {
        const governanceText = governanceMatch[1].

