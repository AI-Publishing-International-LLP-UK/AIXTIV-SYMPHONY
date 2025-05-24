/**
 * BidLifecycleManager.ts
 * Comprehensive lifecycle management for bids from submission to closure
 */

import {
  Firestore,
  doc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  Timestamp,
  increment,
  arrayUnion,
  runTransaction,
} from 'firebase/firestore';

import {
  Bid,
  BidStatus,
  BidResponse,
  BidResponseStatus,
  BidCategory,
  BidAttachment,
} from '../models/Bid';

// New interfaces for bid lifecycle management
export interface BidActivity {
  id: string;
  bidId: string;
  type: BidActivityType;
  timestamp: Timestamp;
  userId: string;
  userName: string;
  details: Record<string, any>;
  visibility: BidActivityVisibility;
}

export enum BidActivityType {
  CREATED = 'created',
  SUBMITTED = 'submitted',
  UPDATED = 'updated',
  RESPONSE_RECEIVED = 'response_received',
  REVIEWED = 'reviewed',
  AWARDED = 'awarded',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
  FEEDBACK_ADDED = 'feedback_added',
  DOCUMENT_ADDED = 'document_added',
  STATUS_CHANGED = 'status_changed',
}

export enum BidActivityVisibility {
  INTERNAL = 'internal',
  EXTERNAL = 'external',
  OWNER_ONLY = 'owner_only',
}

export interface BidSubmissionResult {
  success: boolean;
  bidId?: string;
  errors?: string[];
  externalReferences?: Record<string, string>;
}

export interface BidMonitorFilter {
  statuses?: BidStatus[];
  ownerId?: string;
  responderId?: string;
  expiringWithinDays?: number;
  categories?: BidCategory[];
  minAmount?: number;
  maxAmount?: number;
}

export interface BidFeedback {
  id: string;
  bidId: string;
  authorId: string;
  authorName: string;
  content: string;
  rating: number; // 1-5 scale
  categoryScores?: Record<string, number>; // More detailed ratings
  timestamp: Timestamp;
  visibility: BidActivityVisibility;
  attachments?: BidAttachment[];
}

export interface BidMetrics {
  totalSubmitted: number;
  totalWon: number;
  totalLost: number;
  totalInProgress: number;
  winRate: number;
  averageFeedbackScore: number;
  responseTimeAvg: number; // in hours
  categoryCounts: Record<BidCategory, number>;
  monthlyTrends: Array<{
    month: string; // Format: YYYY-MM
    submitted: number;
    won: number;
    lost: number;
    winRate: number;
  }>;
}

export interface StandardOperatingProcedure {
  id: string;
  name: string;
  description: string;
  steps: Array<{
    id: string;
    name: string;
    description: string;
    role: string;
    estimatedTimeMinutes: number;
    required: boolean;
    artifacts?: Array<{
      name: string;
      type: string;
      template?: string;
    }>;
  }>;
  approvals: Array<{
    role: string;
    order: number;
    required: boolean;
  }>;
}

/**
 * BidLifecycleManager - Manages the full lifecycle of bids
 *
 * Handles bid submission, monitoring, win/loss tracking, and
 * post-bid feedback, along with standardized operating procedures.
 */
export class BidLifecycleManager {
  private firestore: Firestore;
  private bidCollection: string;
  private sopCollection: string;
  private activitiesCollection: string;
  private feedbackCollection: string;
  private metricsCollection: string;

  /**
   * Creates a new BidLifecycleManager
   * @param firestore Firestore instance
   * @param bidCollection Name of bids collection
   */
  constructor(
    firestore: Firestore,
    bidCollection: string = 'bids',
    sopCollection: string = 'standardOperatingProcedures',
    activitiesCollection: string = 'bidActivities',
    feedbackCollection: string = 'bidFeedback',
    metricsCollection: string = 'bidMetrics'
  ) {
    this.firestore = firestore;
    this.bidCollection = bidCollection;
    this.sopCollection = sopCollection;
    this.activitiesCollection = activitiesCollection;
    this.feedbackCollection = feedbackCollection;
    this.metricsCollection = metricsCollection;
  }

  /**
   * Submit a new bid to internal database and optionally
   * to external eProcurement systems
   */
  async submitBid(
    bid: Omit<Bid, 'id' | 'createdAt' | 'updatedAt'>,
    userId: string,
    userName: string,
    submitToExternal: boolean = false,
    externalSystems?: string[]
  ): Promise<BidSubmissionResult> {
    try {
      // Validate the bid
      const validationResult = this.validateBid(bid);
      if (!validationResult.valid) {
        return {
          success: false,
          errors: validationResult.errors,
        };
      }

      // Generate a unique ID
      const bidId = doc(collection(this.firestore, '_unused')).id;

      // Create timestamps
      const now = Timestamp.now();

      // Create the complete bid object
      const completeBid: Bid = {
        id: bidId,
        ...bid,
        createdAt: now,
        updatedAt: now,
        status: BidStatus.OPEN,
      };

      // Save to Firestore
      await setDoc(doc(this.firestore, this.bidCollection, bidId), completeBid);

      // Record the activity
      await this.recordActivity({
        bidId,
        type: BidActivityType.SUBMITTED,
        userId,
        userName,
        details: { initialStatus: BidStatus.OPEN },
        visibility: BidActivityVisibility.EXTERNAL,
      });

      // If requested, submit to external systems
      const externalReferences: Record<string, string> = {};

      if (submitToExternal && externalSystems && externalSystems.length > 0) {
        // This would be implemented with the eProcurement connectors
        // For now, we'll mock this functionality
        for (const system of externalSystems) {
          const externalId = await this.submitToExternalSystem(
            completeBid,
            system
          );
          if (externalId) {
            externalReferences[system] = externalId;
          }
        }

        // Update the bid with external references
        if (Object.keys(externalReferences).length > 0) {
          await updateDoc(doc(this.firestore, this.bidCollection, bidId), {
            metadata: {
              ...completeBid.metadata,
              externalReferences,
            },
          });
        }
      }

      // Update metrics
      await this.updateBidMetrics(userId, 'submission');

      return {
        success: true,
        bidId,
        externalReferences,
      };
    } catch (error) {
      console.error('Error submitting bid:', error);
      return {
        success: false,
        errors: [error.message],
      };
    }
  }

  /**
   * Set up monitoring for bids matching specific criteria
   */
  monitorBids(
    filter: BidMonitorFilter,
    callback: (bids: Bid[]) => void
  ): () => void {
    // Build query constraints based on the filter
    const constraints = this.buildMonitorQueryConstraints(filter);

    // Create and execute the query
    const bidsRef = collection(this.firestore, this.bidCollection);
    const q = query(bidsRef, ...constraints);

    // Set up real-time listener
    const unsubscribe = onSnapshot(
      q,
      querySnapshot => {
        const bids: Bid[] = [];
        querySnapshot.forEach(doc => {
          bids.push(doc.data() as Bid);
        });

        callback(bids);
      },
      error => {
        console.error('Error monitoring bids:', error);
      }
    );

    // Return function to stop monitoring
    return unsubscribe;
  }

  /**
   * Track when a bid is won
   */
  async markBidAsWon(
    bidId: string,
    userId: string,
    userName: string,
    details: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      const bidRef = doc(this.firestore, this.bidCollection, bidId);

      // Update the bid status
      await updateDoc(bidRef, {
        status: BidStatus.AWARDED,
        updatedAt: Timestamp.now(),
        metadata: {
          awardDetails: details,
        },
      });

      // Record the activity
      await this.recordActivity({
        bidId,
        type: BidActivityType.AWARDED,
        userId,
        userName,
        details,
        visibility: BidActivityVisibility.EXTERNAL,
      });

      // Update metrics
      await this.updateBidMetrics(userId, 'won');

      return true;
    } catch (error) {
      console.error('Error marking bid as won:', error);
      return false;
    }
  }

  /**
   * Track when a bid is lost
   */
  async markBidAsLost(
    bidId: string,
    userId: string,
    userName: string,
    details: Record<string, any> = {}
  ): Promise<boolean> {
    try {
      const bidRef = doc(this.firestore, this.bidCollection, bidId);

      // Update the bid status
      await updateDoc(bidRef, {
        status: BidStatus.CLOSED,
        updatedAt: Timestamp.now(),
        metadata: {
          lossDetails: details,
        },
      });

      // Record the activity
      await this.recordActivity({
        bidId,
        type: BidActivityType.REJECTED,
        userId,
        userName,
        details,
        visibility: BidActivityVisibility.EXTERNAL,
      });

      // Update metrics
      await this.updateBidMetrics(userId, 'lost');

      return true;
    } catch (error) {
      console.error('Error marking bid as lost:', error);
      return false;
    }
  }

  /**
   * Add feedback about a bid (internal or from client)
   */
  async addBidFeedback(
    feedback: Omit<BidFeedback, 'id' | 'timestamp'>
  ): Promise<string> {
    try {
      // Generate a unique ID
      const feedbackId = doc(collection(this.firestore, '_unused')).id;

      // Create the complete feedback object
      const completeFeedback: BidFeedback = {
        id: feedbackId,
        ...feedback,
        timestamp: Timestamp.now(),
      };

      // Save to Firestore
      await setDoc(
        doc(this.firestore, this.feedbackCollection, feedbackId),
        completeFeedback
      );

      // Record the activity
      await this.recordActivity({
        bidId: feedback.bidId,
        type: BidActivityType.FEEDBACK_ADDED,
        userId: feedback.authorId,
        userName: feedback.authorName,
        details: {
          feedbackId,
          rating: feedback.rating,
        },
        visibility: feedback.visibility,
      });

      // Update metrics with the new feedback
      await this.updateFeedbackMetrics(feedback.bidId, feedback.rating);

      return feedbackId;
    } catch (error) {
      console.error('Error adding bid feedback:', error);
      throw error;
    }
  }

  /**
   * Get feedback for a specific bid
   */
  async getBidFeedback(
    bidId: string,
    visibilityFilter?: BidActivityVisibility
  ): Promise<BidFeedback[]> {
    try {
      // Create query to get feedback for the bid
      let feedbackQuery = query(
        collection(this.firestore, this.feedbackCollection),
        where('bidId', '==', bidId)
      );

      // Add visibility filter if specified
      if (visibilityFilter) {
        feedbackQuery = query(
          feedbackQuery,
          where('visibility', '==', visibilityFilter)
        );
      }

      // Execute the query
      const querySnapshot = await getDocs(feedbackQuery);

      // Process the results
      const feedback: BidFeedback[] = [];
      querySnapshot.forEach(doc => {
        feedback.push(doc.data() as BidFeedback);
      });

      return feedback;
    } catch (error) {
      console.error('Error getting bid feedback:', error);
      throw error;
    }
  }

  /**
   * Get a standard operating procedure (SOP) for a bid activity
   */
  async getSOP(
    category: BidCategory,
    activityType: string
  ): Promise<StandardOperatingProcedure | null> {
    try {
      // Query for SOPs that match the category and activity type
      const sopQuery = query(
        collection(this.firestore, this.sopCollection),
        where('categories', 'array-contains', category),
        where('activityType', '==', activityType)
      );

      const querySnapshot = await getDocs(sopQuery);

      // Return the first matching SOP, or null if none found
      if (querySnapshot.empty) {
        return null;
      }

      return querySnapshot.docs[0].data() as StandardOperatingProcedure;
    } catch (error) {
      console.error('Error getting SOP:', error);
      throw error;
    }
  }

  /**
   * Get bid metrics for a user or organization
   */
  async getBidMetrics(userId: string): Promise<BidMetrics> {
    try {
      const metricsRef = doc(this.firestore, this.metricsCollection, userId);
      const metricsDoc = await getDoc(metricsRef);

      if (metricsDoc.exists()) {
        return metricsDoc.data() as BidMetrics;
      }

      // Return default metrics if none exist
      return {
        totalSubmitted: 0,
        totalWon: 0,
        totalLost: 0,
        totalInProgress: 0,
        winRate: 0,
        averageFeedbackScore: 0,
        responseTimeAvg: 0,
        categoryCounts: {} as Record<BidCategory, number>,
        monthlyTrends: [],
      };
    } catch (error) {
      console.error('Error getting bid metrics:', error);
      throw error;
    }
  }

  /**
   * Record a bid activity
   */
  private async recordActivity(
    activity: Omit<BidActivity, 'id' | 'timestamp'>
  ): Promise<string> {
    try {
      // Generate a unique ID
      const activityId = doc(collection(this.firestore, '_unused')).id;

      // Create the complete activity object
      const completeActivity: BidActivity = {
        id: activityId,
        ...activity,
        timestamp: Timestamp.now(),
      };

      // Save to Firestore
      await setDoc(
        doc(this.firestore, this.activitiesCollection, activityId),
        completeActivity
      );

      return activityId;
    } catch (error) {
      console.error('Error recording activity:', error);
      throw error;
    }
  }

  /**
   * Submit a bid to an external eProcurement system
   * This is a placeholder that would be replaced with actual integration
   */
  private async submitToExternalSystem(
    bid: Bid,
    system: string
  ): Promise<string | null> {
    // This would be implemented with the actual eProcurement connector
    // For now, we'll just return a mock external ID
    return `${system}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  /**
   * Update metrics when a bid event occurs
   */
  private async updateBidMetrics(
    userId: string,
    eventType: 'submission' | 'won' | 'lost'
  ): Promise<void> {
    try {
      const metricsRef = doc(this.firestore, this.metricsCollection, userId);

      // Get the current month for trends
      const now = new Date();
      const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      // Update different fields based on event type
      if (eventType === 'submission') {
        await runTransaction(this.firestore, async transaction => {
          const metricsDoc = await transaction.get(metricsRef);

          if (metricsDoc.exists()) {
            // Update existing metrics
            transaction.update(metricsRef, {
              totalSubmitted: increment(1),
              totalInProgress: increment(1),
              [`monthlyTrends.${currentMonth}.submitted`]: increment(1),
            });
          } else {
            // Create new metrics document
            transaction.set(metricsRef, {
              totalSubmitted: 1,
              totalWon: 0,
              totalLost: 0,
              totalInProgress: 1,
              winRate: 0,
              averageFeedbackScore: 0,
              responseTimeAvg: 0,
              categoryCounts: {},
              monthlyTrends: {
                [currentMonth]: {
                  submitted: 1,
                  won: 0,
                  lost: 0,
                  winRate: 0,
                },
              },
            });
          }
        });
      } else if (eventType === 'won' || eventType === 'lost') {
        await runTransaction(this.firestore, async transaction => {
          const metricsDoc = await transaction.get(metricsRef);

          if (metricsDoc.exists()) {
            const data = metricsDoc.data();

            // Calculate new values
            const totalWon = data.totalWon + (eventType === 'won' ? 1 : 0);
            const totalLost = data.totalLost + (eventType === 'lost' ? 1 : 0);
            const winRate = (totalWon / (totalWon + totalLost)) * 100;

            // Update metrics
            const updates: any = {
              totalInProgress: increment(-1),
              winRate,
            };

            if (eventType === 'won') {
              updates.totalWon = increment(1);
              updates[`monthlyTrends.${currentMonth}.won`] = increment(1);
            } else {
              updates.totalLost = increment(1);
              updates[`monthlyTrends.${currentMonth}.lost`] = increment(1);
            }

            // Update monthly win rate
            updates[`monthlyTrends.${currentMonth}.winRate`] =
              ((data.monthlyTrends?.[currentMonth]?.won || 0) /
                ((data.monthlyTrends?.[currentMonth]?.won || 0) +
                  (data.monthlyTrends?.[currentMonth]?.lost || 0))) *
              100;

            transaction.update(metricsRef, updates);
          }
        });
      }
    } catch (error) {
      console.error('Error updating bid metrics:', error);
    }
  }

  /**
   * Update feedback metrics when new feedback is added
   */
  private async updateFeedbackMetrics(
    bidId: string,
    rating: number
  ): Promise<void> {
    try {
      // Get the bid to identify the owner
      const bidRef = doc(this.firestore, this.bidCollection, bidId);
      const bidDoc = await getDoc(bidRef);

      if (!bidDoc.exists()) {
        throw new Error(`Bid ${bidId} not found`);
      }

      const bid = bidDoc.data() as Bid;
      const userId = bid.ownerId;

      // Update metrics
      const metricsRef = doc(this.firestore, this.metricsCollection, userId);

      await runTransaction(this.firestore, async transaction => {
        const metricsDoc = await transaction.get(metricsRef);

        if (metricsDoc.exists()) {
          const data = metricsDoc.data();

          // Calculate new average feedback score
          const currentTotal =
            data.averageFeedbackScore * data.totalFeedback || 0;
          const newTotal = currentTotal + rating;
          const newCount = (data.totalFeedback || 0) + 1;
          const newAverage = newTotal / newCount;

          transaction.update(metricsRef, {
            averageFeedbackScore: newAverage,
            totalFeedback: increment(1),
          });
        } else {
          // If metrics don't exist yet, create them
          transaction.set(
            metricsRef,
            {
              averageFeedbackScore: rating,
              totalFeedback: 1,
            },
            { merge: true }
          );
        }
      });
    } catch (error) {
      console.error('Error updating feedback metrics:', error);
    }
  }

  /**
   * Build query constraints for bid monitoring
   */
  private buildMonitorQueryConstraints(filter: BidMonitorFilter): any[] {
    const constraints = [];

    // Add status filters
    if (filter.statuses && filter.statuses.length > 0) {
      constraints.push(where('status', 'in', filter.statuses));
    }

    // Add owner filter
    if (filter.ownerId) {
      constraints.push(where('ownerId', '==', filter.ownerId));
    }

    // Add responder filter
    if (filter.responderId) {
      constraints.push(
        where('responses', 'array-contains', {
          responderId: filter.responderId,
        })
      );
    }

    // Add expiring soon filter
    if (filter.expiringWithinDays) {
      const expiryThreshold = new Date();
      expiryThreshold.setDate(
        expiryThreshold.getDate() + filter.expiringWithinDays
      );
      const thresholdTimestamp = Timestamp.fromDate(expiryThreshold);

      constraints.push(where('expiresAt', '<=', thresholdTimestamp));
      constraints.push(where('status', '==', BidStatus.OPEN));
    }

    // Add category filters
    if (filter.categories && filter.categories.length > 0) {
      constraints.push(where('category', 'in', filter.categories));
    }

    // Add amount range filters
    if (filter.minAmount !== undefined) {
      constraints.push(where('amount', '>=', filter.minAmount));
    }
    if (filter.maxAmount !== undefined) {
      constraints.push(where('amount', '<=', filter.maxAmount));
    }

    return constraints;
  }

  /**
   * Validate a bid before submission
   */
  private validateBid(bid: any): { valid: boolean; errors: string[] } {
    const errors = [];

    // Check required fields
    if (!bid.title) errors.push('Title is required');
    if (!bid.description) errors.push('Description is required');
    if (bid.amount === undefined) errors.push('Amount is required');
    if (!bid.currency) errors.push('Currency is required');
    if (!bid.expiresAt) errors.push('Expiration date is required');
    if (!bid.ownerId) errors.push('Owner ID is required');
    if (!bid.ownerName) errors.push('Owner name is required');
    if (!bid.category) errors.push('Category is required');

    // Validate types
    if (typeof bid.amount !== 'number') errors.push('Amount must be a number');
    if (typeof bid.title !== 'string') errors.push('Title must be a string');
    if (typeof bid.description !== 'string')
      errors.push('Description must be a string');

    // Validate enums
    if (bid.category && !Object.values(BidCategory).includes(bid.category)) {
      errors.push(`Invalid category: ${bid.category}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

/**
 * StandardOperatingProcedureManager - Creates and manages SOPs
 * for standardized bid-related activities
 */
export class StandardOperatingProcedureManager {
  private firestore: Firestore;
  private sopCollection: string;

  constructor(
    firestore: Firestore,
    sopCollection: string = 'standardOperatingProcedures'
  ) {
    this.firestore = firestore;
    this.sopCollection = sopCollection;
  }

  /**
   * Create a new standard operating procedure
   */
  async createSOP(
    sop: Omit<StandardOperatingProcedure, 'id'>
  ): Promise<string> {
    try {
      // Generate a unique ID
      const sopId = doc(collection(this.firestore, '_unused')).id;

      // Create the complete SOP object
      const completeSOP: StandardOperatingProcedure = {
        id: sopId,
        ...sop,
      };

      // Save to Firestore
      await setDoc(doc(this.firestore, this.sopCollection, sopId), completeSOP);

      return sopId;
    } catch (error) {
      console.error('Error creating SOP:', error);
      throw error;
    }
  }

  /**
   * Update an existing standard operating procedure
   */
  async updateSOP(
    sopId: string,
    updates: Partial<StandardOperatingProcedure>
  ): Promise<boolean> {
    try {
      const sopRef = doc(this.firestore, this.sopCollection, sopId);
      await updateDoc(sopRef, updates);
      return true;
    } catch (error) {
      console.error('Error updating SOP:', error);
      return false;
    }
  }

  /**
   * Get standard operating procedures by category
   */
  async getSOPsByCategory(
    category: BidCategory
  ): Promise<StandardOperatingProcedure[]> {
    try {
      const sopQuery = query(
        collection(this.firestore, this.sopCollection),
        where('categories', 'array-contains', category)
      );

      const querySnapshot = await getDocs(sopQuery);

      const sops: StandardOperatingProcedure[] = [];
      querySnapshot.forEach(doc => {
        sops.push(doc.data() as StandardOperatingProcedure);
      });

      return sops;
    } catch (error) {
      console.error('Error getting SOPs by category:', error);
      throw error;
    }
  }

  /**
   * Create default SOPs for common bid activities
   */
  async createDefaultSOPs(): Promise<void> {
    try {
      // Example: Create a default SOP for bid submission
      await this.createSOP({
        name: 'Bid Submission Process',
        description: 'Standard process for creating and submitting a bid',
        steps: [
          {
            id: 'req-gathering',
            name: 'Requirements Gathering',
            description: 'Collect all project requirements and specifications',
            role: 'Business Analyst',
            estimatedTimeMinutes: 120,
            required: true,
            artifacts: [
              {
                name: 'Requirements Document',
                type: 'document',
                template: 'templates/requirements-doc.docx',
              },
            ],
          },
          {
            id: 'cost-analysis',
            name: 'Cost Analysis',
            description: 'Analyze costs and determine pricing strategy',
            role: 'Financial Analyst',
            estimatedTimeMinutes: 180,
            required: true,
            artifacts: [
              {
                name: 'Cost Breakdown',
                type: 'spreadsheet',
                template: 'templates/cost-analysis.xlsx',
              },
            ],
          },
          {
            id: 'proposal-drafting',
            name: 'Proposal Drafting',
            description: 'Draft the proposal document',
            role: 'Proposal Writer',
            estimatedTimeMinutes: 240,
            required: true,
            artifacts: [
              {
                name: 'Proposal Document',
                type: 'document',
                template: 'templates/proposal.docx',
              },
            ],
          },
          {
            id: 'legal-review',
            name: 'Legal Review',
            description: 'Review for legal compliance and risk',
            role: 'Legal Counsel',
            estimatedTimeMinutes: 120,
            required: true,
          },
          {
            id: 'final-review',
            name: 'Final Review',
            description: 'Final review and approval',
            role: 'Department Head',
            estimatedTimeMinutes: 60,
            required: true,
          },
        ],
        approvals: [
          {
            role: 'Department Head',
            order: 1,
            required: true,
          },
          {
            role: 'Legal Counsel',
            order: 2,
            required: true,
          },
          {
            role: 'Finance Director',
            order: 3,
            required: false,
          },
        ],
      });

      // Example: Create a default SOP for bid monitoring
      await this.createSOP({
        name: 'Bid Monitoring Process',
        description: 'Standard process for monitoring active bids',
        steps: [
          {
            id: 'setup-alerts',
            name: 'Setup Monitoring Alerts',
            description: 'Configure alerts for bid status changes',
            role: 'Bid Manager',
            estimatedTimeMinutes: 30,
            required: true,
          },
          {
            id: 'weekly-review',
            name: 'Weekly Bid Review',
            description: 'Review all active bids weekly',
            role: 'Bid Manager',
            estimatedTimeMinutes: 60,
            required: true,
            artifacts: [
              {
                name: 'Bid Status Report',
                type: 'spreadsheet',
                template: 'templates/bid-status-report.xlsx',
              },
            ],
          },
          {
            id: 'client-updates',
            name: 'Client Updates',
            description: 'Provide status updates to clients',
            role: 'Account Manager',
            estimatedTimeMinutes: 30,
            required: false,
          },
        ],
        approvals: [],
      });

      // Example: Create a default SOP for bid win/loss analysis
      await this.createSOP({
        name: 'Bid Outcome Analysis',
        description: 'Process for analyzing bid outcomes',
        steps: [
          {
            id: 'gather-feedback',
            name: 'Gather Client Feedback',
            description: 'Collect feedback from client on bid decision',
            role: 'Account Manager',
            estimatedTimeMinutes: 60,
            required: true,
            artifacts: [
              {
                name: 'Client Feedback Form',
                type: 'form',
                template: 'templates/client-feedback.docx',
              },
            ],
          },
          {
            id: 'internal-analysis',
            name: 'Internal Team Analysis',
            description: 'Team review of bid process and outcome',
            role: 'Bid Manager',
            estimatedTimeMinutes: 90,
            required: true,
            artifacts: [
              {
                name: 'Bid Retrospective Document',
                type: 'document',
                template: 'templates/bid-retrospective.docx',
              },
            ],
          },
          {
            id: 'improvement-plan',
            name: 'Process Improvement Plan',
            description:
              'Create plan for process improvements based on feedback',
            role: 'Process Manager',
            estimatedTimeMinutes: 120,
            required: false,
            artifacts: [
              {
                name: 'Process Improvement Plan',
                type: 'document',
                template: 'templates/improvement-plan.docx',
              },
            ],
          },
        ],
        approvals: [
          {
            role: 'Department Head',
            order: 1,
            required: true,
          },
        ],
      });
    } catch (error) {
      console.error('Error creating default SOPs:', error);
      throw error;
    }
  }
}

// Export for use in the application
export default BidLifecycleManager;
