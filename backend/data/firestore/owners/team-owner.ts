import { UserTypeCode } from '../../../services/firestore/user-types/user-types';

/**
 * Team Owner Type Definition
 *
 * Defines the Team Owner type for the AIXTIV Symphony platform with capabilities,
 * metadata, and pricing information for the free trial.
 */

export interface TeamOwnerCapabilities {
  maxUsers: number;
  maxProjects: number;
  maxStorage: number; // in GB
  customDomain: boolean;
  advancedAnalytics: boolean;
  prioritySupport: boolean;
  concurrentAgents: number;
  whiteLabeling: boolean;
  apiAccess: boolean;
}

export interface TeamOwnerPricing {
  monthly: number;
  annually: number;
  setupFee: number;
  freeTrial: {
    days: number;
    requiresCreditCard: boolean;
    limitations?: string[];
  };
}

export interface TeamOwnerMetadata {
  name: string;
  description: string;
  userTypeCode: UserTypeCode;
  capabilities: TeamOwnerCapabilities;
  pricing: TeamOwnerPricing;
  availableSolutions: string[];
  availableAgents: string[];
}

/**
 * Team Owner Definition
 *
 * Provides capabilities for small to medium-sized teams with collaborative features
 * and moderate scalability.
 */
export const teamOwner: TeamOwnerMetadata = {
  name: 'Team Owner',
  description:
    'Collaboration-focused plan for small to medium-sized teams with moderate scalability needs',
  userTypeCode: 'C-L-T', // Corporate-Leader-Team
  capabilities: {
    maxUsers: 25,
    maxProjects: 50,
    maxStorage: 100,
    customDomain: true,
    advancedAnalytics: true,
    prioritySupport: true,
    concurrentAgents: 5,
    whiteLabeling: false,
    apiAccess: true,
  },
  pricing: {
    monthly: 99.99,
    annually: 999.9, // ~16% discount
    setupFee: 0,
    freeTrial: {
      days: 3,
      requiresCreditCard: true,
      limitations: [
        'Limited to 5 users during trial',
        'Maximum 10 projects during trial',
        'Limited agent access during trial',
      ],
    },
  },
  availableSolutions: [
    'MEMORIA_ANTHOLOGY',
    'FLIGHT_MEMORY_SYSTEM',
    'BID_SUITE_BASIC',
    'BRAND_DIAGNOSTICS',
    'CUSTOMER_DELIGHT_SYSTEM',
  ],
  availableAgents: [
    'DR_MEMORIA_PILOT',
    'DR_MATCH_PILOT',
    'DR_SABINA_PILOT',
    'GENERAL_COPILOT',
  ],
};

export default teamOwner;
