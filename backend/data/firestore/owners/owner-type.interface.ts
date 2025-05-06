import {
  UserType,
  UserTypeMetadata,
} from '../../../services/firestore/user-types/user-types';

/**
 * Interface for owner type definitions
 * This provides a standard structure for all owner types in the system
 */
export interface OwnerType {
  /** The user type code from the UserType enum */
  type: UserType;

  /** Human-readable name of the owner type */
  name: string;

  /** Detailed description of this owner type */
  description: string;

  /** Metadata about capabilities, limitations, and features */
  metadata: UserTypeMetadata;

  /** Free trial details */
  trial: {
    /** Duration of the free trial in days */
    durationDays: number;
    /** Whether the trial requires payment info upfront */
    requiresPaymentInfo: boolean;
    /** Any limitations during trial period */
    limitations?: string[];
  };

  /** Pricing information */
  pricing: {
    /** Monthly price in USD */
    monthly: number;
    /** Yearly price in USD (optional) */
    yearly?: number;
    /** Discount percentage for yearly plan (optional) */
    yearlyDiscountPercentage?: number;
    /** Whether custom pricing is available */
    customPricingAvailable: boolean;
  };

  /** Maximum number of users allowed */
  maxUsers: number;

  /** Maximum number of projects allowed */
  maxProjects: number;

  /** Maximum number of teams allowed (if applicable) */
  maxTeams?: number;

  /** Whether this owner type includes priority support */
  prioritySupport: boolean;

  /** Whether this owner type includes custom branding */
  customBranding: boolean;

  /** Whether this owner type has access to advanced analytics */
  advancedAnalytics: boolean;

  /** Whether this owner type can access API */
  apiAccess: boolean;

  /** Additional features specific to this owner type */
  additionalFeatures?: string[];

  /** Role permissions specific to this owner type */
  permissions?: string[];
}
