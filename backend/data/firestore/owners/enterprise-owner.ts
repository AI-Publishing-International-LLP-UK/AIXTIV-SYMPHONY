import { UserType } from '../../../services/firestore/user-types/user-types';

/**
 * Enterprise Owner Type Definition
 *
 * Defines the capabilities, metadata, and pricing for Enterprise Owner accounts
 * in the AIXTIV Symphony ecosystem. Enterprise Owners have access to the full suite
 * of platform features with maximum capacity and advanced customization options.
 *
 * User Type: CORPORATE_ENTERPRISE_LEADER ('C-L-E')
 */

export interface EnterpriseOwnerCapabilities {
  // Platform access capabilities
  maxUsers: number;
  maxTeams: number;
  maxProjects: number;
  maxStorage: string;

  // Feature access
  hasFullAccess: boolean;
  hasCustomBranding: boolean;
  hasAdvancedAnalytics: boolean;
  hasPrioritySupport: boolean;
  hasAPIAccess: boolean;
  hasWhiteGloveSetup: boolean;
  hasCustomIntegrations: boolean;
  hasDomainManagement: boolean;

  // Dr. Memoria's Anthology specific features
  hasBrandDiagnosticsAccess: boolean;
  hasBrandBuilderAccess: boolean;
  hasBidSuiteAccess: boolean;
  hasCustomerDelightAccess: boolean;
  hasPublishingAutomation: boolean;
  hasCustomWorkflows: boolean;
}

export interface EnterpriseOwnerMetadata {
  userType: UserType;
  description: string;
  capabilities: EnterpriseOwnerCapabilities;
  trialPeriodDays: number;
  pricing: {
    monthly: number;
    annual: number;
    setupFee: number;
  };
}

/**
 * Enterprise Owner definition with full capabilities
 * and enterprise-level pricing
 */
export const EnterpriseOwner: EnterpriseOwnerMetadata = {
  userType: UserType.CORPORATE_ENTERPRISE_LEADER, // 'C-L-E'
  description:
    'Enterprise-level account with full platform access, unlimited users, and custom solutions',
  capabilities: {
    // Platform access capabilities
    maxUsers: 500,
    maxTeams: 100,
    maxProjects: 1000,
    maxStorage: '10TB',

    // Feature access
    hasFullAccess: true,
    hasCustomBranding: true,
    hasAdvancedAnalytics: true,
    hasPrioritySupport: true,
    hasAPIAccess: true,
    hasWhiteGloveSetup: true,
    hasCustomIntegrations: true,
    hasDomainManagement: true,

    // Dr. Memoria's Anthology specific features
    hasBrandDiagnosticsAccess: true,
    hasBrandBuilderAccess: true,
    hasBidSuiteAccess: true,
    hasCustomerDelightAccess: true,
    hasPublishingAutomation: true,
    hasCustomWorkflows: true,
  },
  trialPeriodDays: 3,
  pricing: {
    monthly: 2999.99,
    annual: 32399.89, // 10% discount for annual billing
    setupFee: 5000.0,
  },
};

/**
 * Access control definition for Enterprise Owners
 * Specifies which roles have access to manage Enterprise Owner data
 */
export const EnterpriseOwnerAccess = {
  manageableBy: ['Diamons-SAO', 'SA'], // Super Admin Only and System Administrators
  viewableBy: ['Diamons-SAO', 'SA', 'CRX-E'], // Includes Enterprise CRX agents
  hasBackOfficeAccess: true,
};

export default EnterpriseOwner;
