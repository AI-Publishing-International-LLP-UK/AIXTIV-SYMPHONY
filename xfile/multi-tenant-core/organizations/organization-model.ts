/**
 * AIXTIV SYMPHONY™ Organization Model for Multi-Tenancy
 * © 2025 AI Publishing International LLP
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This is proprietary software of AI Publishing International LLP.
 * All rights reserved.
 */

import { Timestamp } from 'firebase/firestore';
import { TenantType } from '../roles/user-types';

/**
 * Organization interface for enterprise and organizational tenants
 */
export interface Organization {
  id: string;
  name: string;
  tenantId: string;
  type: TenantType;
  industry: string;
  size: 'small' | 'medium' | 'large' | 'enterprise';
  website?: string;
  description?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Contact Information
  primaryContact: {
    name: string;
    email: string;
    phone?: string;
    title?: string;
  };

  // Address
  address?: {
    street1: string;
    street2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  // Organizational Structure
  structure: {
    departments: Department[];
    teams: Team[];
  };

  // Branding
  branding: {
    logo?: string;
    primaryColor?: string;
    secondaryColor?: string;
    customDomain?: string;
  };

  // Billing
  billing: {
    plan: string;
    subscriptionId?: string;
    paymentMethod?: string;
    billingCycle: 'monthly' | 'quarterly' | 'annual';
    contactEmail: string;
    contactName: string;
  };

  // Integrations
  integrations: {
    type: string;
    config: Record<string, any>;
    status: 'active' | 'inactive' | 'pending';
    lastSynced?: Timestamp;
  }[];

  // Settings
  settings: {
    allowSelfRegistration: boolean;
    defaultUserRole: string;
    securitySettings: {
      enforceSSO: boolean;
      enforceMFA: boolean;
      passwordPolicy: {
        minLength: number;
        requireSpecialChar: boolean;
        requireNumber: boolean;
        requireUpperCase: boolean;
        expirationDays: number;
      };
    };
    visualizationCenter: {
      enabled: boolean;
      customTheme?: string;
      defaultDashboards: string[];
      features: Record<string, boolean>;
    };
  };

  // Metadata
  metadata: Record<string, any>;
}

/**
 * Department within an organization
 */
export interface Department {
  id: string;
  name: string;
  description?: string;
  managerId?: string;
  parentDepartmentId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Department-specific settings
  settings?: {
    budgetCode?: string;
    costCenter?: string;
    visualizationAccess?: boolean;
    customFields?: Record<string, any>;
  };
}

/**
 * Team within an organization or department
 */
export interface Team {
  id: string;
  name: string;
  description?: string;
  departmentId?: string;
  leaderId?: string;
  members: string[]; // Array of user IDs
  createdAt: Timestamp;
  updatedAt: Timestamp;

  // Team-specific settings
  settings?: {
    projectCodes?: string[];
    visualizationDashboards?: string[];
    customFields?: Record<string, any>;
  };
}

/**
 * Organization Factory - Creates organization templates based on type
 */
export class OrganizationFactory {
  /**
   * Create a new organization based on the tenant type
   */
  static createOrganization(
    name: string,
    tenantType: TenantType,
    primaryContact: { name: string; email: string; phone?: string },
    additionalData?: Partial<Organization>
  ): Partial<Organization> {
    const now = Timestamp.now();

    // Base organization
    const baseOrg: Partial<Organization> = {
      name,
      type: tenantType,
      primaryContact,
      createdAt: now,
      updatedAt: now,
      structure: {
        departments: [],
        teams: [],
      },
      branding: {},
      settings: {
        allowSelfRegistration: false,
        defaultUserRole: 'standard_user',
        securitySettings: {
          enforceSSO: false,
          enforceMFA: true,
          passwordPolicy: {
            minLength: 8,
            requireSpecialChar: true,
            requireNumber: true,
            requireUpperCase: true,
            expirationDays: 90,
          },
        },
        visualizationCenter: {
          enabled: true,
          defaultDashboards: ['overview'],
          features: {
            analytics: true,
            reporting: true,
            realTimeData: true,
          },
        },
      },
      metadata: {},
    };

    // Merge with type-specific templates
    let templateOrg: Partial<Organization> = {};

    switch (tenantType) {
      case TenantType.ENTERPRISE:
        templateOrg = this.enterpriseTemplate();
        break;
      case TenantType.ORGANIZATIONAL:
        templateOrg = this.organizationalTemplate();
        break;
      case TenantType.ACADEMIC:
        templateOrg = this.academicTemplate();
        break;
      case TenantType.GROUP:
        templateOrg = this.groupTemplate();
        break;
      case TenantType.INDIVIDUAL:
        templateOrg = this.individualTemplate();
        break;
    }

    // Merge base, template, and additional data
    return {
      ...baseOrg,
      ...templateOrg,
      ...additionalData,
    };
  }

  /**
   * Enterprise organization template
   */
  private static enterpriseTemplate(): Partial<Organization> {
    return {
      industry: 'Technology',
      size: 'enterprise',
      billing: {
        plan: 'enterprise',
        billingCycle: 'annual',
        contactEmail: '',
        contactName: '',
      },
      settings: {
        allowSelfRegistration: false,
        defaultUserRole: 'standard_user',
        securitySettings: {
          enforceSSO: true,
          enforceMFA: true,
          passwordPolicy: {
            minLength: 12,
            requireSpecialChar: true,
            requireNumber: true,
            requireUpperCase: true,
            expirationDays: 60,
          },
        },
        visualizationCenter: {
          enabled: true,
          defaultDashboards: ['executive', 'department', 'team'],
          features: {
            analytics: true,
            reporting: true,
            realTimeData: true,
            customDashboards: true,
            dataMining: true,
            advancedVisualizations: true,
          },
        },
      },
      structure: {
        departments: [
          {
            id: 'exec',
            name: 'Executive',
            description: 'Executive leadership team',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          },
          {
            id: 'marketing',
            name: 'Marketing',
            description: 'Marketing department',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          },
          {
            id: 'sales',
            name: 'Sales',
            description: 'Sales department',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          },
          {
            id: 'product',
            name: 'Product',
            description: 'Product department',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          },
          {
            id: 'engineering',
            name: 'Engineering',
            description: 'Engineering department',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          },
        ],
        teams: [],
      },
    };
  }

  /**
   * Organizational template (non-profit, government, etc.)
   */
  private static organizationalTemplate(): Partial<Organization> {
    return {
      industry: 'Government',
      size: 'large',
      billing: {
        plan: 'organizational',
        billingCycle: 'annual',
        contactEmail: '',
        contactName: '',
      },
      settings: {
        allowSelfRegistration: false,
        defaultUserRole: 'standard_user',
        securitySettings: {
          enforceSSO: true,
          enforceMFA: true,
          passwordPolicy: {
            minLength: 12,
            requireSpecialChar: true,
            requireNumber: true,
            requireUpperCase: true,
            expirationDays: 60,
          },
        },
        visualizationCenter: {
          enabled: true,
          defaultDashboards: ['organization', 'department', 'public'],
          features: {
            analytics: true,
            reporting: true,
            realTimeData: true,
            publicDashboards: true,
            dataCompliance: true,
          },
        },
      },
      structure: {
        departments: [
          {
            id: 'admin',
            name: 'Administration',
            description: 'Administration department',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          },
          {
            id: 'programs',
            name: 'Programs',
            description: 'Programs department',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          },
          {
            id: 'outreach',
            name: 'Outreach',
            description: 'Outreach department',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          },
        ],
        teams: [],
      },
    };
  }

  /**
   * Academic template (universities, schools)
   */
  private static academicTemplate(): Partial<Organization> {
    return {
      industry: 'Education',
      size: 'large',
      billing: {
        plan: 'academic',
        billingCycle: 'annual',
        contactEmail: '',
        contactName: '',
      },
      settings: {
        allowSelfRegistration: true,
        defaultUserRole: 'student',
        securitySettings: {
          enforceSSO: true,
          enforceMFA: true,
          passwordPolicy: {
            minLength: 10,
            requireSpecialChar: true,
            requireNumber: true,
            requireUpperCase: true,
            expirationDays: 120,
          },
        },
        visualizationCenter: {
          enabled: true,
          defaultDashboards: ['faculty', 'student', 'research'],
          features: {
            analytics: true,
            reporting: true,
            realTimeData: false,
            learningAnalytics: true,
            researchData: true,
          },
        },
      },
      structure: {
        departments: [
          {
            id: 'admin',
            name: 'Administration',
            description: 'University administration',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          },
          {
            id: 'faculty',
            name: 'Faculty',
            description: 'Academic faculty',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          },
          {
            id: 'students',
            name: 'Students',
            description: 'Student body',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          },
        ],
        teams: [],
      },
    };
  }

  /**
   * Group template (small businesses, teams)
   */
  private static groupTemplate(): Partial<Organization> {
    return {
      industry: 'Small Business',
      size: 'small',
      billing: {
        plan: 'group',
        billingCycle: 'monthly',
        contactEmail: '',
        contactName: '',
      },
      settings: {
        allowSelfRegistration: false,
        defaultUserRole: 'team_member',
        securitySettings: {
          enforceSSO: false,
          enforceMFA: true,
          passwordPolicy: {
            minLength: 8,
            requireSpecialChar: true,
            requireNumber: true,
            requireUpperCase: true,
            expirationDays: 90,
          },
        },
        visualizationCenter: {
          enabled: true,
          defaultDashboards: ['team'],
          features: {
            analytics: true,
            reporting: true,
            realTimeData: false,
          },
        },
      },
      structure: {
        departments: [],
        teams: [
          {
            id: 'main',
            name: 'Main Team',
            description: 'Primary team',
            members: [],
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now(),
          },
        ],
      },
    };
  }

  /**
   * Individual template
   */
  private static individualTemplate(): Partial<Organization> {
    return {
      industry: 'Individual',
      size: 'small',
      billing: {
        plan: 'individual',
        billingCycle: 'monthly',
        contactEmail: '',
        contactName: '',
      },
      settings: {
        allowSelfRegistration: false,
        defaultUserRole: 'owner',
        securitySettings: {
          enforceSSO: false,
          enforceMFA: true,
          passwordPolicy: {
            minLength: 8,
            requireSpecialChar: true,
            requireNumber: true,
            requireUpperCase: true,
            expirationDays: 90,
          },
        },
        visualizationCenter: {
          enabled: true,
          defaultDashboards: ['personal'],
          features: {
            analytics: true,
            reporting: true,
            realTimeData: false,
          },
        },
      },
      structure: {
        departments: [],
        teams: [],
      },
    };
  }
}

export default {
  OrganizationFactory,
};
