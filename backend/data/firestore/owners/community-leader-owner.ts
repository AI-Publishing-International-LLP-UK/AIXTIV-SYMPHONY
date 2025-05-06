import { OwnerType } from './owner-type.interface';
import { UserTypes } from '../../../services/firestore/user-types/user-types';

/**
 * Community Leader Owner Type
 *
 * This owner type is designed for community leaders and organizers
 * who want to use Dr. Memoria's Anthology for community-driven projects.
 */
export const COMMUNITY_LEADER: OwnerType = {
  typeCode: UserTypes.COMMUNITY_LEADER, // 'CM-L-I'
  displayName: 'Community Leader',
  description:
    'Access to community-focused tools and limited resources for community organizers.',
  capabilities: {
    maxUsers: 50,
    maxTeams: 5,
    maxProjects: 25,
    maxStorage: '50GB',
    maxAPICalls: 5000,
    featureAccess: {
      memoriaAnthology: true,
      brandDiagnostics: true,
      brandBuilder: true,
      bidSuite: false,
      customerDelight: true,
      multiDomainManagement: false,
      advancedAnalytics: false,
      prioritySupport: false,
      whiteLabeling: false,
      customIntegrations: false,
      bulkOperations: false,
      aiAssistants: {
        contentCreation: true,
        scheduling: true,
        analytics: false,
        strategy: false,
      },
    },
  },
  pricingTiers: [
    {
      name: 'Community Basic',
      price: 29.99,
      billingCycle: 'monthly',
      trialPeriod: 3, // 3-day free trial
      trialRestrictions: {
        maxUsers: 5,
        maxProjects: 3,
        featureRestrictions: ['bulkOperations', 'advancedAnalytics'],
      },
    },
    {
      name: 'Community Plus',
      price: 49.99,
      billingCycle: 'monthly',
      trialPeriod: 3, // 3-day free trial
      trialRestrictions: {
        maxUsers: 10,
        maxProjects: 5,
        featureRestrictions: ['bulkOperations'],
      },
    },
  ],
  metadata: {
    category: 'community',
    priority: 4,
    icon: 'community-leader-icon',
    color: '#4CAF50',
    recommendedFor: [
      'Community organizers',
      'Non-profit leaders',
      'Local government representatives',
      'Volunteer coordinators',
      'Neighborhood associations',
    ],
    solutions: {
      primary: 'MEMORIA_ANTHOLOGY',
      secondary: ['BRAND_DIAGNOSTICS', 'CUSTOMER_DELIGHT'],
    },
    adminAccess: {
      diamonsSao: true,
      sa: true,
    },
  },
};

export default COMMUNITY_LEADER;
