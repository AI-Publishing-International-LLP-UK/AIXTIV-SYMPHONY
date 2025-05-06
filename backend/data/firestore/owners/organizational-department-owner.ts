import { UserType } from '../../../services/firestore/user-types/user-types';

/**
 * Organizational Department Owner Type
 *
 * This owner type represents leaders of departments within larger organizations.
 * They have capabilities to manage their specific department's resources and users.
 */
export interface OrganizationalDepartmentOwnerType {
  userType: string;
  name: string;
  description: string;
  capabilities: {
    maxUsers: number;
    maxProjects: number;
    maxTeams: number;
    solutions: string[];
    features: string[];
  };
  freeTrial: {
    durationDays: number;
    limitations: string[];
  };
  pricing: {
    monthly: number;
    annually: number;
    discount: number;
    currency: string;
    tier: string;
  };
  metadata: {
    domain: string;
    businessFunctions: string[];
    integrationType: string;
    supportLevel: string;
    customizationOptions: string[];
  };
  adminRoles: string[];
}

export const OrganizationalDepartmentOwner: OrganizationalDepartmentOwnerType =
  {
    userType: UserType.ORGANIZATIONAL_DEPARTMENT_LEADER, // 'O-L-D'
    name: 'Organizational Department Leader',
    description:
      'Owner subscription for department leaders within organizations who need to manage users, projects, and resources for their specific department.',
    capabilities: {
      maxUsers: 50,
      maxProjects: 30,
      maxTeams: 5,
      solutions: [
        'MEMORIA_ANTHOLOGY',
        'MEMORIA_LINKEDIN_APP',
        'S2DO_GOVERNANCE',
        'DREAM_COMMANDER',
        'WISH_VISION',
      ],
      features: [
        'Department-level analytics',
        'Resource allocation tools',
        'Department budget management',
        'Team performance tracking',
        'Department-specific knowledge base',
        'Cross-department collaboration tools',
        'Specialized department reporting',
        'Custom department workflows',
      ],
    },
    freeTrial: {
      durationDays: 3,
      limitations: [
        'Limited to 10 users during trial',
        'Maximum 5 projects during trial',
        'Limited reporting features',
        'Basic analytics only',
      ],
    },
    pricing: {
      monthly: 499.99,
      annually: 4999.9,
      discount: 15,
      currency: 'USD',
      tier: 'Department',
    },
    metadata: {
      domain: 'organizational',
      businessFunctions: [
        'HR',
        'Finance',
        'Marketing',
        'IT',
        'Operations',
        'R&D',
      ],
      integrationType: 'department-focused',
      supportLevel: 'priority',
      customizationOptions: [
        'Custom department onboarding',
        'Department-specific dashboards',
        'Role-based permission templates',
        'Department workflow templates',
      ],
    },
    adminRoles: [
      'Diamons-SAO',
      'SA',
      'Department Administrator',
      'Department Manager',
    ],
  };

export default OrganizationalDepartmentOwner;
