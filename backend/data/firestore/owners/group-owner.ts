import { UserType } from '../../../services/firestore/user-types/user-types';

/**
 * Group Owner Type - CORPORATE_GROUP_LEADER (C-L-G)
 *
 * This type represents leaders of groups within corporate organizations.
 * They have more capabilities than Team Owners but less than Enterprise Owners.
 */
export interface GroupOwner {
  type: UserType.CORPORATE_GROUP_LEADER;
  capabilities: {
    maxUsers: number;
    maxTeams: number;
    maxProjects: number;
    canCreateTeams: boolean;
    canInviteUsers: boolean;
    canAssignRoles: boolean;
    canAccessAnalytics: boolean;
    canConfigureWorkflows: boolean;
    canUseBrandDiagnostics: boolean;
    canUseBrandBuilder: boolean;
    canUseBidSuite: boolean;
    canUseCustomerDelight: boolean;
    hasPrioritySupport: boolean;
    hasCustomDomains: boolean;
    hasWhiteLabeling: boolean;
  };

  metadata: {
    displayName: string;
    description: string;
    iconUrl: string;
    availableSolutions: string[];
    recommendedFor: string[];
  };

  pricing: {
    freeTrial: {
      durationInDays: number;
      requiresCreditCard: boolean;
      limitations: string[];
    };
    monthly: {
      price: number;
      currency: string;
      billingCycle: string;
      features: string[];
    };
    annual: {
      price: number;
      currency: string;
      billingCycle: string;
      discount: number;
      features: string[];
    };
  };
}

export const GROUP_OWNER: GroupOwner = {
  type: UserType.CORPORATE_GROUP_LEADER,
  capabilities: {
    maxUsers: 15,
    maxTeams: 5,
    maxProjects: 30,
    canCreateTeams: true,
    canInviteUsers: true,
    canAssignRoles: true,
    canAccessAnalytics: true,
    canConfigureWorkflows: true,
    canUseBrandDiagnostics: true,
    canUseBrandBuilder: true,
    canUseBidSuite: false,
    canUseCustomerDelight: true,
    hasPrioritySupport: false,
    hasCustomDomains: false,
    hasWhiteLabeling: false,
  },

  metadata: {
    displayName: 'Group Owner',
    description:
      'Access for group leaders with collaboration features for medium-sized teams and projects.',
    iconUrl: '/assets/icons/group-owner.svg',
    availableSolutions: [
      'MEMORIA_ANTHOLOGY',
      'BRAND_DIAGNOSTICS',
      'BRAND_BUILDER',
      'CUSTOMER_DELIGHT',
    ],
    recommendedFor: [
      'Departmental leaders',
      'Project managers',
      'Team coordinators',
      'Group administrators',
    ],
  },

  pricing: {
    freeTrial: {
      durationInDays: 3,
      requiresCreditCard: true,
      limitations: [
        'Limited to 5 users during trial',
        'Only basic analytics available',
        'Limited template access',
      ],
    },
    monthly: {
      price: 69.99,
      currency: 'USD',
      billingCycle: 'monthly',
      features: [
        'Up to 15 users',
        '5 teams',
        '30 projects',
        'Brand Diagnostics',
        'Brand Builder',
        'Customer Delight',
        'Basic workflow customization',
      ],
    },
    annual: {
      price: 59.99,
      currency: 'USD',
      billingCycle: 'annual',
      discount: 15,
      features: [
        'All monthly features',
        'Annual savings of 15%',
        'Additional storage',
        'Extended file history',
      ],
    },
  },
};
