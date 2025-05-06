import {
  UserType,
  SolutionType,
} from '../../../services/firestore/user-types/user-types';

/**
 * Professional Owner Type Definition
 *
 * This file defines the capabilities, metadata, and pricing for the Professional Owner type
 * in the AIXTIV Symphony Opus system. Professional Owners have access to a subset of enterprise
 * features tailored for individual professional use.
 */

export interface OwnerPricingTier {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  freeTrial: {
    durationDays: number;
    requiresCreditCard: boolean;
  };
}

export interface ProfessionalOwnerMetadata {
  userType: UserType;
  displayName: string;
  description: string;
  capabilities: string[];
  maxTeamMembers: number;
  maxProjects: number;
  availableSolutions: SolutionType[];
  pricing: OwnerPricingTier[];
  freeTrial: {
    durationDays: number;
    features: string[];
  };
}

export const ProfessionalOwner: ProfessionalOwnerMetadata = {
  userType: UserType.CORPORATE_MEMBER, // Using existing user type that fits best
  displayName: 'Professional Owner',
  description:
    'Professional level access to Symphony with capabilities for individual productivity and limited team collaboration',
  capabilities: [
    'Access to Brand Diagnostics with up to 3 analyses per month',
    'Limited access to Brand Builder with up to 5 projects',
    'Basic access to Bid Suite for individual proposals',
    'Full access to Customer Delight for personal clients',
    'Up to 3 Wing agents simultaneously active',
    'Personalized Dashboard',
    'Basic Analytics',
    'Cloud Storage (15GB)',
    'Email & Community Support',
  ],
  maxTeamMembers: 3,
  maxProjects: 10,
  availableSolutions: [
    SolutionType.BRAND_DIAGNOSTICS,
    SolutionType.BRAND_BUILDER,
    SolutionType.BID_SUITE_BASIC,
    SolutionType.CUSTOMER_DELIGHT,
    SolutionType.MEMORIA_ANTHOLOGY,
    SolutionType.DREAM_COMMANDER_BASIC,
  ],
  pricing: [
    {
      name: 'Professional Basic',
      monthlyPrice: 49.99,
      annualPrice: 499.9,
      features: [
        'All core capabilities',
        'Limited to 3 team members',
        'Up to 10 active projects',
        'Basic priority in Agent assignment',
      ],
      freeTrial: {
        durationDays: 3,
        requiresCreditCard: true,
      },
    },
    {
      name: 'Professional Plus',
      monthlyPrice: 79.99,
      annualPrice: 799.9,
      features: [
        'All core capabilities',
        'Limited to 3 team members',
        'Up to 20 active projects',
        'Enhanced priority in Agent assignment',
        'Phone support during business hours',
        'Advanced analytics dashboard',
      ],
      freeTrial: {
        durationDays: 3,
        requiresCreditCard: true,
      },
    },
  ],
  freeTrial: {
    durationDays: 3,
    features: [
      'Full access to all Professional Owner capabilities',
      'Up to 3 brand analyses',
      'Up to 2 brand building projects',
      '1 complete bid proposal',
      'Access to all learning materials',
      '24/7 email support during trial',
    ],
  },
};

export default ProfessionalOwner;
