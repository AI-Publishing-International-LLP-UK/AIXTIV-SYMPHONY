// src/models/FmsPilotProfile.ts
import { Timestamp } from 'firebase/firestore';

/**
 * FMS Pilot Profile - Core data model for pilot bidding
 */
export interface FmsPilotProfile {
  id: string;
  pilotId: string;
  fullName: string;
  email: string;
  licenseNumber: string;
  licenseType: string;
  certifications: string[];
  ratings: string[];
  dateOfHire: Timestamp;
  seniority: number;
  status: PilotStatus;
  base: string;
  equipment: string[];
  qualifications: string[];
  trainingRecords: TrainingRecord[];
  bidPreferences: BidPreference[];
  lastActive: Timestamp;
  metadata: Record<string, any>;
}

export enum PilotStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  TRAINING = 'training',
  LEAVE = 'leave',
  SUSPENDED = 'suspended',
}

export interface TrainingRecord {
  id: string;
  type: string;
  completionDate: Timestamp;
  expirationDate: Timestamp;
  instructorId: string;
  score?: number;
  notes?: string;
}

export interface BidPreference {
  id: string;
  category: 'route' | 'equipment' | 'schedule' | 'location';
  preference: string;
  priority: number;
  notes?: string;
}

// src/models/FlightBid.ts
import { Timestamp } from 'firebase/firestore';

/**
 * Flight Bid - Data structure for pilot bidding
 */
export interface FlightBid {
  id: string;
  pilotId: string;
  pilotName: string;
  bidPeriodId: string;
  bidPeriodName: string;
  preferenceRanking: BidItem[];
  submittedAt: Timestamp;
  updatedAt: Timestamp;
  status: 'draft' | 'submitted' | 'processed' | 'awarded' | 'denied';
  award?: BidAward;
  notes?: string;
}

export interface BidItem {
  rank: number;
  itemId: string;
  itemType: 'route' | 'schedule' | 'position' | 'equipment';
  itemName: string;
}

export interface BidAward {
  awardedItemId: string;
  awardedItemName: string;
  awardedAt: Timestamp;
  effectiveDate: Timestamp;
  expirationDate?: Timestamp;
  status: 'active' | 'pending' | 'expired';
}

// src/models/BidSubscription.ts
import { Timestamp } from 'firebase/firestore';

/**
 * Bid Subscription - Manages notification preferences for pilots
 */
export interface BidSubscription {
  id: string;
  pilotId: string;
  bidTypes: ('route' | 'equipment' | 'schedule' | 'position')[];
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    push: boolean;
    inApp: boolean;
  };
  notificationEvents: {
    bidOpen: boolean;
    bidClosingSoon: boolean;
    bidClosed: boolean;
    bidAwarded: boolean;
    bidDenied: boolean;
    newBidOpportunity: boolean;
    preferencesUpdated: boolean;
  };
  subscriptionStatus: 'active' | 'paused' | 'cancelled';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  phoneNumber?: string;
  deviceTokens?: string[];
}

// src/services/FmsPilotDataService.ts
import {
  Firestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  Timestamp,
} from 'firebase/firestore';
import { FmsPilotProfile, FlightBid, BidSubscription } from '../models';

/**
 * FMS Pilot Data Service
 * Manages storage and retrieval of pilot data for bidding
 */
export class FmsPilotDataService {
  private firestore: Firestore;
  private pilotCollection: string;
  private bidCollection: string;
  private subscriptionCollection: string;
  private bidPeriodCollection: string;

  constructor(
    firestore: Firestore,
    pilotCollection: string = 'fmsPilots',
    bidCollection: string = 'flightBids',
    subscriptionCollection: string = 'bidSubscriptions',
    bidPeriodCollection: string = 'bidPeriods'
  ) {
    this.firestore = firestore;
    this.pilotCollection = pilotCollection;
    this.bidCollection = bidCollection;
    this.subscriptionCollection = subscriptionCollection;
    this.bidPeriodCollection = bidPeriodCollection;
  }

  /**
   * Get a pilot profile by ID
   */
  async getPilotProfile(pilotId: string): Promise<FmsPilotProfile | null> {
    try {
      const profileRef = doc(this.firestore, this.pilotCollection, pilotId);
      const profileDoc = await getDoc(profileRef);

      if (profileDoc.exists()) {
        return profileDoc.data() as FmsPilotProfile;
      }

      return null;
    } catch (error) {
      console.error(`Error getting pilot profile ${pilotId}:`, error);
      throw error;
    }
  }

  /**
   * Update a pilot profile
   */
  async updatePilotProfile(
    pilotId: string,
    updates: Partial<FmsPilotProfile>
  ): Promise<boolean> {
    try {
      const profileRef = doc(this.firestore, this.pilotCollection, pilotId);
      await updateDoc(profileRef, {
        ...updates,
        updatedAt: Timestamp.now(),
      });

      return true;
    } catch (error) {
      console.error(`Error updating pilot profile ${pilotId}:`, error);
      return false;
    }
  }

  /**
   * Get active bids for a pilot
   */
  async getPilotBids(
    pilotId: string,
    status?: 'draft' | 'submitted' | 'processed' | 'awarded' | 'denied'
  ): Promise<FlightBid[]> {
    try {
      let q;

      if (status) {
        q = query(
          collection(this.firestore, this.bidCollection),
          where('pilotId', '==', pilotId),
          where('status', '==', status)
        );
      } else {
        q = query(
          collection(this.firestore, this.bidCollection),
          where('pilotId', '==', pilotId)
        );
      }

      const querySnapshot = await getDocs(q);

      const bids: FlightBid[] = [];
      querySnapshot.forEach(doc => {
        bids.push(doc.data() as FlightBid);
      });

      return bids;
    } catch (error) {
      console.error(`Error getting bids for pilot ${pilotId}:`, error);
      throw error;
    }
  }

  /**
   * Create or update a bid for a pilot
   */
  async savePilotBid(bid: FlightBid): Promise<string> {
    try {
      const now = Timestamp.now();
      const bidId = bid.id || doc(collection(this.firestore, '_unused')).id;

      const completeBid: FlightBid = {
        ...bid,
        id: bidId,
        updatedAt: now,
        submittedAt: bid.submittedAt || now,
      };

      await setDoc(doc(this.firestore, this.bidCollection, bidId), completeBid);

      return bidId;
    } catch (error) {
      console.error(`Error saving bid for pilot ${bid.pilotId}:`, error);
      throw error;
    }
  }

  /**
   * Get a pilot's subscription preferences
   */
  async getPilotSubscription(pilotId: string): Promise<BidSubscription | null> {
    try {
      const subscriptionRef = doc(
        this.firestore,
        this.subscriptionCollection,
        pilotId
      );
      const subscriptionDoc = await getDoc(subscriptionRef);

      if (subscriptionDoc.exists()) {
        return subscriptionDoc.data() as BidSubscription;
      }

      return null;
    } catch (error) {
      console.error(`Error getting subscription for pilot ${pilotId}:`, error);
      throw error;
    }
  }

  /**
   * Save pilot subscription preferences
   */
  async savePilotSubscription(subscription: BidSubscription): Promise<boolean> {
    try {
      const now = Timestamp.now();
      const subId = subscription.id || subscription.pilotId;

      const completeSubscription: BidSubscription = {
        ...subscription,
        id: subId,
        updatedAt: now,
        createdAt: subscription.createdAt || now,
      };

      await setDoc(
        doc(this.firestore, this.subscriptionCollection, subId),
        completeSubscription
      );

      return true;
    } catch (error) {
      console.error(
        `Error saving subscription for pilot ${subscription.pilotId}:`,
        error
      );
      return false;
    }
  }

  /**
   * Get active bid periods
   */
  async getActiveBidPeriods(): Promise<any[]> {
    try {
      const now = Timestamp.now();

      const q = query(
        collection(this.firestore, this.bidPeriodCollection),
        where('startDate', '<=', now),
        where('endDate', '>=', now)
      );

      const querySnapshot = await getDocs(q);

      const periods: any[] = [];
      querySnapshot.forEach(doc => {
        periods.push(doc.data());
      });

      return periods;
    } catch (error) {
      console.error('Error getting active bid periods:', error);
      throw error;
    }
  }
}

// src/database/schema.ts - Database schema definition with indexes

export const fmsSchema = {
  collections: {
    fmsPilots: {
      fields: {
        pilotId: { type: 'string', required: true },
        fullName: { type: 'string', required: true },
        email: { type: 'string', required: true },
        licenseNumber: { type: 'string', required: true },
        licenseType: { type: 'string', required: true },
        certifications: { type: 'array', required: true },
        ratings: { type: 'array', required: true },
        dateOfHire: { type: 'timestamp', required: true },
        seniority: { type: 'number', required: true },
        status: { type: 'string', required: true },
        base: { type: 'string', required: true },
        equipment: { type: 'array', required: true },
        qualifications: { type: 'array', required: true },
        trainingRecords: { type: 'array', required: true },
        bidPreferences: { type: 'array', required: true },
        lastActive: { type: 'timestamp', required: true },
      },
      indexes: [
        { field: 'pilotId', type: 'hash' },
        { field: 'email', type: 'hash' },
        { field: 'status', type: 'hash' },
        { field: 'base', type: 'hash' },
        { field: 'seniority', type: 'btree' },
        { field: 'dateOfHire', type: 'btree' },
        { fields: ['base', 'status'], type: 'composite' },
        { fields: ['equipment', 'status'], type: 'composite' },
      ],
    },
    flightBids: {
      fields: {
        pilotId: { type: 'string', required: true },
        bidPeriodId: { type: 'string', required: true },
        status: { type: 'string', required: true },
        submittedAt: { type: 'timestamp', required: true },
        updatedAt: { type: 'timestamp', required: true },
      },
      indexes: [
        { field: 'pilotId', type: 'hash' },
        { field: 'bidPeriodId', type: 'hash' },
        { field: 'status', type: 'hash' },
        { field: 'submittedAt', type: 'btree' },
        { fields: ['pilotId', 'bidPeriodId'], type: 'composite' },
        { fields: ['bidPeriodId', 'status'], type: 'composite' },
      ],
    },
    bidSubscriptions: {
      fields: {
        pilotId: { type: 'string', required: true },
        subscriptionStatus: { type: 'string', required: true },
        bidTypes: { type: 'array', required: true },
        updatedAt: { type: 'timestamp', required: true },
      },
      indexes: [
        { field: 'pilotId', type: 'hash' },
        { field: 'subscriptionStatus', type: 'hash' },
      ],
    },
    bidPeriods: {
      fields: {
        name: { type: 'string', required: true },
        startDate: { type: 'timestamp', required: true },
        endDate: { type: 'timestamp', required: true },
        status: { type: 'string', required: true },
        bidType: { type: 'string', required: true },
      },
      indexes: [
        { field: 'status', type: 'hash' },
        { field: 'bidType', type: 'hash' },
        { field: 'startDate', type: 'btree' },
        { field: 'endDate', type: 'btree' },
        { fields: ['status', 'bidType'], type: 'composite' },
      ],
    },
  },
};

// src/integrations/ExternalFmsConnector.ts
import {
  FmsPilotDataService,
  AuditLogger,
  IntegrationGateway,
} from '../services';

/**
 * External FMS System Connector
 * Integrates with external Flight Management Systems for data synchronization
 */
export class ExternalFmsConnector {
  private pilotDataService: FmsPilotDataService;
  private auditLogger: AuditLogger;
  private integrationGateway: IntegrationGateway;

  constructor(
    pilotDataService: FmsPilotDataService,
    auditLogger: AuditLogger,
    integrationGateway: IntegrationGateway
  ) {
    this.pilotDataService = pilotDataService;
    this.auditLogger = auditLogger;
    this.integrationGateway = integrationGateway;
  }

  /**
   * Sync pilot data from external FMS systems
   */
  async syncPilotData(
    externalSystemId: string,
    options?: {
      incremental?: boolean;
      since?: Date;
      pilotIds?: string[];
    }
  ): Promise<{
    success: boolean;
    synchronized: number;
    errors?: string[];
  }> {
    try {
      // Get the connector for the external system
      const connector = this.integrationGateway.getConnector(externalSystemId);
      if (!connector) {
        throw new Error(
          `No connector found for external system ${externalSystemId}`
        );
      }

      // Build request parameters
      const params: any = {
        dataType: 'pilots',
        incremental: options?.incremental || true,
      };

      if (options?.since) {
        params.since = options.since.toISOString();
      }

      if (options?.pilotIds) {
        params.pilotIds = options.pilotIds;
      }

      // Request data from external system
      const response = await connector.executeApiRequest(
        'data/pilots',
        'GET',
        null,
        params
      );

      if (!response.success) {
        throw new Error(`External API error: ${response.message}`);
      }

      // Process and store the pilot data
      let successCount = 0;
      const errors: string[] = [];

      for (const pilotData of response.data) {
        try {
          // Transform data to our format
          const transformedData = this.transformPilotData(
            pilotData,
            externalSystemId
          );

          // Update or create pilot profile
          const existingProfile = await this.pilotDataService.getPilotProfile(
            transformedData.pilotId
          );

          if (existingProfile) {
            // Update existing profile
            await this.pilotDataService.updatePilotProfile(
              transformedData.pilotId,
              transformedData
            );
          } else {
            // Create new profile document
            await setDoc(
              doc(this.firestore, 'fmsPilots', transformedData.pilotId),
              transformedData
            );
          }

          successCount++;
        } catch (error) {
          errors.push(
            `Error processing pilot ${pilotData.id}: ${error.message}`
          );
        }
      }

      // Log the synchronization
      this.auditLogger.logActivity({
        entityType: 'system',
        entityId: externalSystemId,
        action: 'sync_pilot_data',
        details: {
          pilotsProcessed: successCount,
          totalPilots: response.data.length,
          errors: errors.length > 0 ? errors : undefined,
        },
      });

      return {
        success: errors.length === 0,
        synchronized: successCount,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      this.auditLogger.logError({
        component: 'ExternalFmsConnector',
        action: 'syncPilotData',
        error: error.message,
        details: { externalSystemId, options },
      });

      return {
        success: false,
        synchronized: 0,
        errors: [error.message],
      };
    }
  }

  /**
   * Transform pilot data from external format to our internal format
   */
  private transformPilotData(externalData: any, sourceSystem: string): any {
    // Implementation would depend on the external system's data structure
    // This is a placeholder implementation

    return {
      pilotId: externalData.id,
      fullName: `${externalData.firstName} ${externalData.lastName}`,
      email: externalData.email,
      licenseNumber: externalData.license?.number,
      licenseType: externalData.license?.type,
      certifications: externalData.certifications || [],
      ratings: externalData.ratings || [],
      dateOfHire: Timestamp.fromDate(new Date(externalData.hireDate)),
      seniority: externalData.seniority,
      status: this.mapPilotStatus(externalData.status),
      base: externalData.base,
      equipment: externalData.qualifiedEquipment || [],
      qualifications: externalData.qualifications || [],
      trainingRecords: this.transformTrainingRecords(externalData.training),
      bidPreferences: this.transformBidPreferences(externalData.preferences),
      lastActive: Timestamp.now(),
      metadata: {
        sourceSystem,
        externalId: externalData.id,
        lastSynced: Timestamp.now(),
        rawData: externalData,
      },
    };
  }

  /**
   * Map external pilot status to internal status
   */
  private mapPilotStatus(externalStatus: string): PilotStatus {
    const statusMap: Record<string, PilotStatus> = {
      active: PilotStatus.ACTIVE,
      inactive: PilotStatus.INACTIVE,
      training: PilotStatus.TRAINING,
      leave: PilotStatus.LEAVE,
      suspended: PilotStatus.SUSPENDED,
    };

    return statusMap[externalStatus.toLowerCase()] || PilotStatus.INACTIVE;
  }

  /**
   * Transform training records from external format
   */
  private transformTrainingRecords(externalTraining: any[]): TrainingRecord[] {
    if (!externalTraining || !Array.isArray(externalTraining)) {
      return [];
    }

    return externalTraining.map(training => ({
      id: training.id,
      type: training.type,
      completionDate: Timestamp.fromDate(new Date(training.completedOn)),
      expirationDate: Timestamp.fromDate(new Date(training.expiresOn)),
      instructorId: training.instructor,
      score: training.score,
      notes: training.notes,
    }));
  }

  /**
   * Transform bid preferences from external format
   */
  private transformBidPreferences(externalPreferences: any[]): BidPreference[] {
    if (!externalPreferences || !Array.isArray(externalPreferences)) {
      return [];
    }

    return externalPreferences.map((pref, index) => ({
      id: pref.id || `pref-${index}`,
      category: this.mapPreferenceCategory(pref.type),
      preference: pref.value,
      priority: pref.priority || index + 1,
      notes: pref.notes,
    }));
  }

  /**
   * Map external preference category to internal category
   */
  private mapPreferenceCategory(
    externalType: string
  ): 'route' | 'equipment' | 'schedule' | 'location' {
    const categoryMap: Record<
      string,
      'route' | 'equipment' | 'schedule' | 'location'
    > = {
      route: 'route',
      equipment: 'equipment',
      schedule: 'schedule',
      location: 'location',
      base: 'location',
      aircraft: 'equipment',
      shift: 'schedule',
      flight: 'route',
    };

    return categoryMap[externalType.toLowerCase()] || 'route';
  }
}
