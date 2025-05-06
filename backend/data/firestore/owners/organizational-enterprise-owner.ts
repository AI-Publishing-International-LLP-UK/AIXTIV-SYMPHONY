import { UserType } from '../../../services/firestore/user-types/user-types';

/**
 * Organizational Enterprise Owner Type
 *
 * Defines capabilities, metadata, and pricing for the Organizational Enterprise Owner type.
 * This owner type is geared toward large organizational settings like hospitals, universities,
 * or government agencies with enterprise-level needs.
 */
export const ORGANIZATIONAL_ENTERPRISE_LEADER = {
  userType: UserType.ORGANIZATIONAL_ENTERPRISE_LEADER, // O-L-E
  displayName: 'Organizational Enterprise Owner',
  description:
    'Full-featured access for large organizational entities with enterprise-level needs.',
  capabilities: {
    maxUsers: 1000,
    maxTeams: 200,
    maxProjects: 2000,
    maxStorage: '5TB',
    auditLog: true,
    customBranding: true,
    advancedAnalytics: true,
    dedicatedSupport: true,
    priorityResponseTime: '1 hour',
    customizableDashboards: true,
    ssoIntegration: true,
    apiAccess: true,
    complianceFeatures: true,
    dataMigrationService: true,
    customTraining: true,
    dedicatedAccountManager: true,
    highAvailabilityGuarantee: true,
    privateCloud: true,
    advancedSecurityFeatures: true,
    userManagement: {
      rbac: true,
      ldapIntegration: true,
      userProvisioning: true,
      multiDepartmentManagement: true,
    },
  },
  solutions: {
    memoriaAnthology: true,
    dreamCommander: true,
    drlucyFlightMemory: true,
    drburbyS2doBlockchain: true,
    professorLeeQ4dLenz: true,
    drsabinaDreamCommander: true,
    drgrantCybersecurity: true,
    drcypriotRewards: true,
    drmariaSupport: true,
    drroarkWishVision: true,
    drclaudeOrchestrator: true,
  },
  freeTrialOptions: {
    durationDays: 3,
    requiresPaymentMethod: false,
    limitations: {
      maxUsers: 100,
      maxProjects: 50,
      restrictedFeatures: [
        'privateCloud',
        'customTraining',
        'dataMigrationService',
      ],
    },
  },
  pricing: {
    monthly: 3999.99,
    annually: 39999.9, // 10 months for annual subscription
    setupFee: 5000.0,
    customizationFee: 'Custom quote',
    additionalUserCost: 20.0,
    paymentOptions: ['Credit Card', 'Invoice', 'Purchase Order'],
    enterpriseDiscount: {
      threshold: 500,
      discountPercentage: 15,
    },
  },
  metadata: {
    sector: 'Organizational',
    targetCustomers: [
      'Hospitals',
      'Universities',
      'Government Agencies',
      'Non-profit Organizations',
      'Public Institutions',
    ],
    useCases: [
      'Multi-department publishing workflow',
      'Organizational knowledge management',
      'Cross-department collaboration',
      'Regulatory compliance documentation',
      'Policy and procedure management',
      'Public information management',
    ],
    complianceCertifications: ['HIPAA', 'FERPA', 'FISMA', 'GDPR', 'ISO 27001'],
  },
};

export default ORGANIZATIONAL_ENTERPRISE_LEADER;
