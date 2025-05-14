/**
 * AIXTIV SYMPHONY™ User Type System for Multi-Tenancy
 * © 2025 AI Publishing International LLP
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This is proprietary software of AI Publishing International LLP.
 * All rights reserved. No part of this software may be reproduced,
 * modified, or distributed without prior written permission.
 */

import { Timestamp } from 'firebase/firestore';

/**
 * User Type Enum - The comprehensive user classification system for AIXTIV SYMPHONY
 * Designed for multi-tenant architecture with role-based access control
 */
export enum UserType {
  // -------------------- TRACK IDENTIFIERS --------------------
  CORPORATE = 'C',
  ORGANIZATIONAL = 'O',
  ACADEMIC = 'A',
  COMMUNITY = 'CM',

  // -------------------- POSITION IDENTIFIERS --------------------
  LEADER = 'L',
  MEMBER = 'M',
  STUDENT = 'S',
  EDUCATOR = 'E',
  FACULTY = 'F',
  INDIVIDUAL = 'I',

  // -------------------- LEVEL IDENTIFIERS --------------------
  ENTERPRISE = 'E',
  TEAM = 'T',
  GROUP = 'G',
  DEPARTMENT = 'D',
  CLASS = 'C',
  LEVEL_INDIVIDUAL = 'I',

  // -------------------- SPECIALIZED ROLE IDENTIFIERS --------------------
  VISIONARY_VOICE = 'VV',
  CO_PILOT = 'CP',
  PILOT = 'PI',

  // -------------------- PAYMENT TERM IDENTIFIERS --------------------
  MONTHLY_SUBSCRIBER = 'M',
  QUARTERLY_SUBSCRIBER = 'Q',
  ANNUAL_SUBSCRIBER = 'A',
  ENTERPRISE_LICENSE = 'EL',

  // -------------------- COMPLETE USER TYPES --------------------
  // Corporate Track - Enterprise Level
  CORPORATE_ENTERPRISE_LEADER = 'C-L-E',
  CORPORATE_ENTERPRISE_MEMBER = 'C-M-E',

  // Corporate Track - Team Level
  CORPORATE_TEAM_LEADER = 'C-L-T',
  CORPORATE_TEAM_MEMBER = 'C-M-T',

  // Corporate Track - Group Level
  CORPORATE_GROUP_LEADER = 'C-L-G',
  CORPORATE_GROUP_MEMBER = 'C-M-G',

  // Organizational Track
  ORGANIZATIONAL_ENTERPRISE_LEADER = 'O-L-E',
  ORGANIZATIONAL_DEPARTMENT_LEADER = 'O-L-D',
  ORGANIZATIONAL_TEAM_MEMBER = 'O-M-T',

  // Academic Track
  ACADEMIC_FACULTY = 'A-F-C',
  ACADEMIC_EDUCATOR = 'A-E-C',
  ACADEMIC_STUDENT = 'A-S-C',

  // Community Track
  COMMUNITY_LEADER = 'CM-L-I',
  COMMUNITY_MEMBER = 'CM-M-I',
}

/**
 * Solution Codes - Enum for solutions available in the AIXTIV SYMPHONY system
 */
export enum CoreSolution {
  DREAM_COMMANDER = 'DC',
  LENZ_ANALYST = 'LA',
  WISH_GRANTER = 'WG',
  MEMORIA_ANTHOLOGY = 'MA',
  BRAND_DIAGNOSTIC = 'BD',
  BRAND_BUILDER = 'BB',
  CUSTOMER_DELIGHT = 'CD',
  BID_SUITE = 'BS',
}

/**
 * Pilot Types - Specialized agents in the AIXTIV SYMPHONY ecosystem
 */
export enum PilotType {
  // R1 Core Squadron
  DR_LUCY_R1_CORE_01 = 'DLR1C01',
  DR_LUCY_R1_CORE_02 = 'DLR1C02',
  DR_LUCY_R1_CORE_03 = 'DLR1C03',

  // Specialized Agent Pilots
  DR_CLAUDE_PILOT = 'DCP', // Workflow Delegation & Quality Control
  DR_ROARK_PILOT = 'DRP', // Visionary Leadership
  DR_MEMORIA_PILOT = 'DMP', // AI Automated Publishing

  // Operational Agents
  PROFESSOR_LEE_PILOT = 'PLP', // Lenz and Dream Commander Operations
  DR_MATCH_PILOT = 'DMaP', // Marketing & Communications

  // Relationship and Historical Agents
  DR_CYPRIOT_PILOT = 'DCyP', // Human-AI Relationships
  DR_MARIA_HISTORICAL_01 = 'DMH01', // Internationalization
  DR_MARIA_HISTORICAL_02 = 'DMH02', // Personalization
  DR_MARIA_HISTORICAL_03 = 'DMH03', // Global Cultural Adaptation

  // Governance and Compliance Agents
  DR_BURBY_PILOT = 'DBP', // CFO/GC, Risk Management
}

/**
 * Integration Type - Available integrations for the AIXTIV SYMPHONY system
 */
export enum IntegrationType {
  MATCH_LINKEDIN_APP = 'ML-A',
  MEMORIA_LINKEDIN_APP = 'MM-A',
  GOOGLE_WORKSPACE = 'GW-A',
  BLOCKCHAIN_VALIDATOR = 'BC-V',
  STRIPE_PAYMENT = 'ST-P',
  CRM_INTEGRATION = 'CRM-I',
}

/**
 * Security Option - Security features available in the system
 */
export enum SecurityOption {
  SINGLE_SIGN_ON = 'SSO',
  MULTI_FACTOR_AUTH = 'MFA',
  BIOMETRIC_AUTH = 'BA',
  BLOCKCHAIN_VERIFICATION = 'BCV',
  ROLE_BASED_ACCESS = 'RBAC',
  IP_RESTRICTIONS = 'IPR',
}

/**
 * Tenant Type - Types of tenants in the multi-tenant system
 */
export enum TenantType {
  INDIVIDUAL = 'INDIVIDUAL',
  GROUP = 'GROUP',
  ENTERPRISE = 'ENTERPRISE',
  ORGANIZATIONAL = 'ORGANIZATIONAL',
  ACADEMIC = 'ACADEMIC',
}

/**
 * User Interface for the multi-tenant system
 */
export interface AIXTIVUser {
  id: string;
  userCode: string;
  tenantId: string;
  tenantType: TenantType;
  track: UserType;
  position: UserType;
  level: UserType;
  entityId: string;
  specializedRoles: UserType[];
  paymentTerm: UserType;
  solutions: CoreSolution[];
  integrations: IntegrationType[];
  securityOptions: SecurityOption[];
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLogin?: Timestamp;
  blockchainAddress?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  userMetadata: Record<string, any>;
}

/**
 * Tenant interface for the multi-tenant system
 */
export interface Tenant {
  id: string;
  name: string;
  type: TenantType;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  ownerId: string;
  contactEmail: string;
  contactPhone?: string;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  billingInfo: {
    stripeCustomerId?: string;
    plan: string;
    subscriptionId?: string;
    subscriptionStatus?: string;
    paymentMethod?: string;
  };
  settings: {
    branding: {
      logo?: string;
      primaryColor?: string;
      secondaryColor?: string;
      customDomain?: string;
    };
    features: {
      [feature: string]: boolean;
    };
    securityOptions: SecurityOption[];
    integrations: IntegrationType[];
  };
  userLimits: {
    maxUsers: number;
    currentUsers: number;
    maxAdmins: number;
    currentAdmins: number;
  };
  metadata: Record<string, any>;
}

/**
 * Role interface for role-based access control
 */
export interface Role {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  permissions: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  isCustom: boolean;
  isSystem: boolean;
  metadata: Record<string, any>;
}

/**
 * User Role assignment interface
 */
export interface UserRole {
  userId: string;
  roleId: string;
  tenantId: string;
  assignedAt: Timestamp;
  assignedBy: string;
  metadata: Record<string, any>;
}

/**
 * Permission interface for granular access control
 */
export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete' | 'execute' | 'manage';
  conditions?: Record<string, any>;
  metadata: Record<string, any>;
}

/**
 * Metadata for user types - provides additional context and capabilities for each user type
 */
export const UserTypeMetadata: Record<
  string,
  {
    baseCapabilities: string[];
    eligibleSpecializedRoles: UserType[];
    availablePaymentTiers: UserType[];
    availableSolutions: CoreSolution[];
    maxIntegrations: number;
    securityLevel: 'basic' | 'enhanced' | 'maximum';
    blockchainEnabled: boolean;
  }
> = {
  [UserType.CORPORATE_ENTERPRISE_LEADER]: {
    baseCapabilities: [
      'Dream Commander',
      'Bid Suite',
      'LENZ Analyst',
      'Strategic Planning',
      'Team Management',
    ],
    eligibleSpecializedRoles: [UserType.VISIONARY_VOICE, UserType.CO_PILOT],
    availablePaymentTiers: [
      UserType.QUARTERLY_SUBSCRIBER,
      UserType.ANNUAL_SUBSCRIBER,
      UserType.ENTERPRISE_LICENSE,
    ],
    availableSolutions: [
      CoreSolution.DREAM_COMMANDER,
      CoreSolution.LENZ_ANALYST,
      CoreSolution.BID_SUITE,
      CoreSolution.MEMORIA_ANTHOLOGY,
      CoreSolution.BRAND_DIAGNOSTIC,
    ],
    maxIntegrations: 10,
    securityLevel: 'maximum',
    blockchainEnabled: true,
  },
  [UserType.CORPORATE_TEAM_MEMBER]: {
    baseCapabilities: ['Task Management', 'Content Development', 'Reporting'],
    eligibleSpecializedRoles: [UserType.PILOT],
    availablePaymentTiers: [
      UserType.MONTHLY_SUBSCRIBER,
      UserType.QUARTERLY_SUBSCRIBER,
    ],
    availableSolutions: [
      CoreSolution.WISH_GRANTER,
      CoreSolution.CUSTOMER_DELIGHT,
    ],
    maxIntegrations: 3,
    securityLevel: 'enhanced',
    blockchainEnabled: true,
  },
  [UserType.ACADEMIC_STUDENT]: {
    baseCapabilities: [
      'Learning Path',
      'Content Access',
      'Project Collaboration',
    ],
    eligibleSpecializedRoles: [],
    availablePaymentTiers: [
      UserType.MONTHLY_SUBSCRIBER,
      UserType.QUARTERLY_SUBSCRIBER,
    ],
    availableSolutions: [CoreSolution.LENZ_ANALYST, CoreSolution.WISH_GRANTER],
    maxIntegrations: 2,
    securityLevel: 'basic',
    blockchainEnabled: false,
  },
  // Additional user type metadata entries would follow the same pattern
};

/**
 * System-defined roles for the multi-tenant platform
 */
export const SystemRoles = {
  // Tenant-level roles
  TENANT_OWNER: {
    name: 'Tenant Owner',
    description:
      'Has full access to manage the tenant, including users, roles, and settings',
    permissions: [
      'tenant:manage',
      'users:manage',
      'roles:manage',
      'billing:manage',
      'settings:manage',
    ],
  },
  TENANT_ADMIN: {
    name: 'Tenant Administrator',
    description: 'Can manage users and most tenant settings',
    permissions: ['users:manage', 'roles:read', 'settings:manage'],
  },
  BILLING_ADMIN: {
    name: 'Billing Administrator',
    description: 'Can manage billing information and subscriptions',
    permissions: ['billing:manage', 'users:read'],
  },

  // User-level roles
  GROUP_LEADER: {
    name: 'Group Leader',
    description: 'Can manage users in their assigned group',
    permissions: ['group:manage', 'users:read'],
  },
  STANDARD_USER: {
    name: 'Standard User',
    description: 'Standard user with basic access to platform features',
    permissions: ['content:read', 'profile:manage'],
  },

  // Feature-specific roles
  VISUALIZATION_ADMIN: {
    name: 'Visualization Center Administrator',
    description:
      'Can configure and manage the Visualization Center for their tenant',
    permissions: ['visualization:manage', 'content:manage'],
  },
  CONTENT_CREATOR: {
    name: 'Content Creator',
    description: 'Can create and manage content in the platform',
    permissions: ['content:create', 'content:update', 'content:delete'],
  },
  VIEWER: {
    name: 'Viewer',
    description: 'Read-only access to content and visualizations',
    permissions: ['content:read', 'visualization:view'],
  },
};

/**
 * Exports all components
 */
export default {
  UserType,
  CoreSolution,
  PilotType,
  IntegrationType,
  SecurityOption,
  TenantType,
  UserTypeMetadata,
  SystemRoles,
};
