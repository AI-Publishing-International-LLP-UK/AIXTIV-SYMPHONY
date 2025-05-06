import { UserType } from '../../../services/firestore/user-types/user-types';
import { OwnerType } from './owner-type.interface';

/**
 * Academic Faculty Owner Type
 *
 * Represents faculty members in academic institutions with capabilities
 * focused on educational content creation, curriculum development,
 * and student engagement.
 */
export const ACADEMIC_FACULTY: OwnerType = {
  typeCode: UserType.ACADEMIC_FACULTY, // 'A-F-C'
  displayName: 'Academic Faculty',
  description:
    'For professors, instructors, and academic staff creating educational content',

  capabilities: {
    maxUsers: 50, // Support for up to 50 students/assistants
    maxProjects: 20, // Up to 20 courses/research projects
    maxTeams: 5, // Up to 5 teaching/research teams
    contentStorage: '50GB',
    apiRequests: 5000,

    features: {
      brandDiagnostics: true,
      brandBuilder: true,
      customerDelight: true,
      bidSuite: false, // Not typically needed in academic context
      workflows: {
        basic: true,
        advanced: true,
        custom: false,
      },
      contentGeneration: {
        basic: true,
        advanced: true,
        custom: false,
      },
      analytics: {
        basic: true,
        advanced: true,
        predictive: false,
      },
      publishing: {
        academic: true,
        social: true,
        enterprise: false,
      },
    },

    // Academic-specific capabilities
    academicFeatures: {
      curriculumDevelopment: true,
      studentAssessment: true,
      researchCollaboration: true,
      academicPublishing: true,
      conferencePresentation: true,
    },
  },

  // Resources available during free trial & subscription
  resources: {
    memoriaTools: [
      'content-generator',
      'curriculum-builder',
      'assessment-creator',
    ],
    integrations: ['lms-connector', 'academic-databases', 'library-access'],
    templates: [
      'course-syllabus',
      'research-proposal',
      'academic-paper',
      'lecture-notes',
    ],
    support: {
      email: true,
      chat: true,
      phone: false,
      dedicated: false,
    },
  },

  // Free trial configuration
  trial: {
    durationDays: 3,
    requiresCreditCard: false,
    limitations: {
      maxProjects: 5,
      contentStorage: '10GB',
      apiRequests: 1000,
    },
  },

  // Pricing information
  pricing: {
    model: 'subscription',
    billingCycle: ['monthly', 'annually'],
    tiers: [
      {
        name: 'Academic Basic',
        price: {
          monthly: 39.99,
          annually: 399.9, // 2 months free
        },
        features: 'All core academic features with limited content generation',
      },
      {
        name: 'Academic Pro',
        price: {
          monthly: 69.99,
          annually: 699.9, // 2 months free
        },
        features:
          'Full academic features with advanced content generation and analytics',
      },
    ],
    discount: {
      type: 'institutional',
      amount: 20, // 20% institutional discount
      description: 'Available with verified institutional email domain',
    },
  },

  // Metadata for system use
  metadata: {
    icon: 'academic-cap',
    color: '#4A90E2',
    category: 'academic',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: '1.0.0',
    priority: 3,
  },
};

export default ACADEMIC_FACULTY;
