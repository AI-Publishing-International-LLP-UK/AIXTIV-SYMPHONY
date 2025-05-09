/**
 * Q4D-Lenz Service
 * Client-side access to Q4D-Lenz apparatus for Owner Cultural Empathy Score (OCES)
 * Exclusively for agent use to analyze SERPEW Data, Career Trajectory, and Benchmarks
 */

import { getFunctions, httpsCallable } from 'firebase/functions';
import { v4 as uuidv4 } from 'uuid';

/**
 * OCES Level Interface
 */
export interface OCESLevel {
  overall: number;
  serpewScore: number;
  sentimentScore: number;
  careerHorizon: number;
  careerVertical: number;
}

/**
 * Nine Box Position Interface
 */
export interface NineBoxPosition {
  x: number; // Performance (1-3)
  y: number; // Potential (1-3)
  label: string; // Position label (e.g., "Star", "Solid Performer")
}

/**
 * RIASEC Profile Interface
 */
export interface RiasecProfile {
  realistic: number;
  investigative: number;
  artistic: number;
  social: number;
  enterprising: number;
  conventional: number;
  primaryType: string;
  secondaryType: string;
}

/**
 * SERPEW Data Interface
 */
export interface SerpewData {
  searchMetrics: Record<string, number>;
  entityRecognition: string[];
  profileWeighting: Record<string, number>;
  sentimentScores: {
    overall: number;
    byEntity: Record<string, number>;
  };
}

/**
 * OCES Profile Interface
 */
export interface OCESProfile {
  id: string;
  ownerSubscriberId: string;
  currentOCESLevel: OCESLevel;
  nineBoxPosition: NineBoxPosition;
  careerMetrics: {
    timestamp: any;
    source: string;
    score_change: number;
    dimension: string;
  }[];
  careerAttributes: {
    distanceTraveled: number; // Career Horizon
    prestigeTrajectory: number; // Positive = rising, Negative = falling
    industryVertical: string;
    yearsOfExperience: number;
    roleLevel: string;
  };
  assessmentScores: {
    riasecProfile: RiasecProfile;
    dfabResults: Record<string, number>; // Military DFAB assessment results
    benchmarkPercentile: number;
  };
  serpewData: SerpewData;
  validationCheckpoints: {
    type: string;
    status: 'pending' | 'completed' | 'failed';
    threshold: number;
  }[];
  createdAt: any;
  updatedAt: any;
}

/**
 * Interaction Log Interface
 */
export interface InteractionLog {
  id: string;
  profileId: string;
  agentType: string;
  interactionDimension: string;
  questionSet: {
    question: string;
    responseType: string;
    confidenceWeight: number;
  }[];
  responses: {
    question: string;
    response: string;
    confidenceImpact: number;
    timestamp: any;
  }[];
  confidenceImpact: {
    initialConfidence: number;
    finalConfidence: number;
    dimensionConfidence: Record<string, number>;
  };
  createdAt: any;
  updatedAt: any;
}

/**
 * Verification Record Interface
 */
export interface VerificationRecord {
  interactionId: string;
  agents: string[];
  confidenceMetrics: {
    initialConfidence: number;
    finalConfidence: number;
    validationScore: number;
  };
  blockchainProof: string;
  createdAt: any;
}

/**
 * Q4D-Lenz Service
 * Provides access to Q4D-Lenz functions via Firebase Functions
 */
class Q4DLenzService {
  private functions = getFunctions(undefined, 'us-west1');
  
  /**
   * Create a confidence profile for a user
   * @param ownerSubscriberId User ID
   * @returns Created profile
   */
  async createConfidenceProfile(
    ownerSubscriberId: string
  ): Promise<{
    success: boolean;
    profileId: string;
    profile: ConfidenceProfile;
    message?: string;
  }> {
    const createProfile = httpsCallable(this.functions, 'createConfidenceProfile');
    
    const result = await createProfile({
      ownerSubscriberId,
    });
    
    return result.data as {
      success: boolean;
      profileId: string;
      profile: ConfidenceProfile;
      message?: string;
    };
  }
  
  /**
   * Get a confidence profile for a user
   * @param criteria Search criteria
   * @returns Confidence profile
   */
  async getConfidenceProfile(
    criteria: { ownerSubscriberId?: string; profileId?: string }
  ): Promise<{
    success: boolean;
    profileId?: string;
    profile?: ConfidenceProfile;
    message?: string;
  }> {
    const getProfile = httpsCallable(this.functions, 'getConfidenceProfile');
    
    const result = await getProfile(criteria);
    
    return result.data as {
      success: boolean;
      profileId?: string;
      profile?: ConfidenceProfile;
      message?: string;
    };
  }
  
  /**
   * Update confidence metrics for a user
   * @param profileId Profile ID
   * @param source Source of the update
   * @param confidence_increment Amount to increment confidence
   * @param dimension Dimension to update
   * @returns Updated confidence levels
   */
  async updateConfidenceMetrics(
    profileId: string,
    source: string,
    confidence_increment: number,
    dimension: string = 'professional'
  ): Promise<{
    success: boolean;
    profileId: string;
    newConfidenceLevel: ConfidenceLevel;
  }> {
    const updateMetrics = httpsCallable(this.functions, 'updateConfidenceMetrics');
    
    const result = await updateMetrics({
      profileId,
      source,
      confidence_increment,
      dimension,
    });
    
    return result.data as {
      success: boolean;
      profileId: string;
      newConfidenceLevel: ConfidenceLevel;
    };
  }
  
  /**
   * Create an interaction log
   * @param profileId Profile ID
   * @param agentType Agent type
   * @param interactionDimension Dimension of interaction
   * @param questionSet Set of questions
   * @returns Created interaction log
   */
  async createInteractionLog(
    profileId: string,
    agentType: string,
    interactionDimension: string,
    questionSet: {
      question: string;
      responseType: string;
      confidenceWeight: number;
    }[]
  ): Promise<{
    success: boolean;
    interactionId: string;
    interactionLog: InteractionLog;
  }> {
    const createLog = httpsCallable(this.functions, 'createInteractionLog');
    
    const result = await createLog({
      profileId,
      agentType,
      interactionDimension,
      questionSet,
    });
    
    return result.data as {
      success: boolean;
      interactionId: string;
      interactionLog: InteractionLog;
    };
  }
  
  /**
   * Add a response to an interaction log
   * @param interactionId Interaction ID
   * @param question Question
   * @param response Response
   * @param confidenceImpact Confidence impact
   * @returns Updated confidence level
   */
  async addInteractionResponse(
    interactionId: string,
    question: string,
    response: string,
    confidenceImpact: number = 0
  ): Promise<{
    success: boolean;
    interactionId: string;
    newConfidenceLevel: number;
  }> {
    const addResponse = httpsCallable(this.functions, 'addInteractionResponse');
    
    const result = await addResponse({
      interactionId,
      question,
      response,
      confidenceImpact,
    });
    
    return result.data as {
      success: boolean;
      interactionId: string;
      newConfidenceLevel: number;
    };
  }
  
  /**
   * Create a verification record
   * @param interactionId Interaction ID
   * @param agents Agents involved
   * @param initialConfidence Initial confidence
   * @param finalConfidence Final confidence
   * @param validationScore Validation score
   * @returns Created verification record
   */
  async createVerificationRecord(
    interactionId: string,
    agents: string[],
    initialConfidence: number,
    finalConfidence: number,
    validationScore: number
  ): Promise<{
    success: boolean;
    interactionId: string;
    blockchainProof: string;
    verificationRecord: VerificationRecord;
  }> {
    const createRecord = httpsCallable(this.functions, 'createVerificationRecord');
    
    const result = await createRecord({
      interactionId,
      agents,
      initialConfidence,
      finalConfidence,
      validationScore,
    });
    
    return result.data as {
      success: boolean;
      interactionId: string;
      blockchainProof: string;
      verificationRecord: VerificationRecord;
    };
  }
  
  /**
   * Get verification records for an interaction
   * @param interactionId Interaction ID
   * @returns Verification record
   */
  async getVerificationRecords(
    interactionId: string
  ): Promise<{
    success: boolean;
    verificationRecord?: VerificationRecord;
    message?: string;
  }> {
    const getRecords = httpsCallable(this.functions, 'getVerificationRecords');
    
    const result = await getRecords({
      interactionId,
    });
    
    return result.data as {
      success: boolean;
      verificationRecord?: VerificationRecord;
      message?: string;
    };
  }
  
  /**
   * Complete a validation checkpoint
   * @param profileId Profile ID
   * @param checkpointType Checkpoint type
   * @param status Status
   * @returns Result
   */
  async completeValidationCheckpoint(
    profileId: string,
    checkpointType: string,
    status: 'completed' | 'failed' = 'completed'
  ): Promise<{
    success: boolean;
    profileId: string;
    checkpointType: string;
    status: string;
  }> {
    const completeCheckpoint = httpsCallable(
      this.functions,
      'completeValidationCheckpoint'
    );
    
    const result = await completeCheckpoint({
      profileId,
      checkpointType,
      status,
    });
    
    return result.data as {
      success: boolean;
      profileId: string;
      checkpointType: string;
      status: string;
    };
  }
  
  /**
   * Start a confidence building session
   * This is a helper method that creates a profile and interaction log
   * @param userId User ID
   * @param agentType Agent type
   * @param dimension Dimension
   * @param questions Questions
   * @returns Session info
   */
  async startConfidenceSession(
    userId: string,
    agentType: string,
    dimension: string,
    questions: {
      question: string;
      responseType: string;
      confidenceWeight: number;
    }[]
  ): Promise<{
    profileId: string;
    interactionId: string;
    confidenceLevel: ConfidenceLevel;
  }> {
    // Get or create profile
    const profileResult = await this.getConfidenceProfile({
      ownerSubscriberId: userId,
    });
    
    let profileId: string;
    
    if (profileResult.success && profileResult.profileId) {
      // Use existing profile
      profileId = profileResult.profileId;
    } else {
      // Create new profile
      const createResult = await this.createConfidenceProfile(userId);
      profileId = createResult.profileId;
    }
    
    // Create interaction log
    const logResult = await this.createInteractionLog(
      profileId,
      agentType,
      dimension,
      questions
    );
    
    // Return session info
    return {
      profileId,
      interactionId: logResult.interactionId,
      confidenceLevel: profileResult.success && profileResult.profile
        ? profileResult.profile.currentConfidenceLevel
        : { overall: 0, professional: 0, social: 0, behavioral: 0 },
    };
  }
  
  /**
   * Process a response in a confidence session
   * @param interactionId Interaction ID
   * @param question Question
   * @param response Response
   * @param calculateConfidence Function to calculate confidence impact
   * @returns Updated confidence
   */
  async processSessionResponse(
    interactionId: string,
    question: string,
    response: string,
    calculateConfidence?: (response: string) => number
  ): Promise<{
    success: boolean;
    newConfidenceLevel: number;
  }> {
    // Calculate confidence impact if function provided
    let confidenceImpact = 0;
    
    if (calculateConfidence) {
      confidenceImpact = calculateConfidence(response);
    } else {
      // Default calculation based on response length and complexity
      confidenceImpact = Math.min(
        5,
        Math.max(0, Math.floor(response.length / 50)) + 
          (response.includes(' because ') ? 1 : 0) +
          (response.includes(' however ') ? 1 : 0)
      );
    }
    
    // Add response
    const result = await this.addInteractionResponse(
      interactionId,
      question,
      response,
      confidenceImpact
    );
    
    return {
      success: result.success,
      newConfidenceLevel: result.newConfidenceLevel,
    };
  }
  
  /**
   * Complete a confidence session with verification
   * @param interactionId Interaction ID
   * @param agents Agents involved
   * @param initialConfidence Initial confidence
   * @param finalConfidence Final confidence
   * @returns Verification record
   */
  async completeConfidenceSession(
    interactionId: string,
    agents: string[],
    initialConfidence: number,
    finalConfidence: number
  ): Promise<{
    success: boolean;
    blockchainProof: string;
  }> {
    // Calculate validation score
    const validationScore = Math.min(
      1.0,
      Math.max(0, (finalConfidence - initialConfidence) / 100 + 0.5)
    );
    
    // Create verification record
    const result = await this.createVerificationRecord(
      interactionId,
      agents,
      initialConfidence,
      finalConfidence,
      validationScore
    );
    
    return {
      success: result.success,
      blockchainProof: result.blockchainProof,
    };
  }
}

// Export singleton instance
export const q4dLenzService = new Q4DLenzService();
export default q4dLenzService;