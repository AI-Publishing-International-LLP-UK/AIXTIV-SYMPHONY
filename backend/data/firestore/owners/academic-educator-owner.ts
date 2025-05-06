import { UserType } from '../../../services/firestore/user-types/user-types';
import { OwnerType } from './owner-type.interface';

/**
 * Academic Educator Owner Type
 *
 * Defined for educators in academic institutions who want to use
 * Dr. Memoria's Anthology for classroom instruction and academic research.
 */
export const ACADEMIC_EDUCATOR: OwnerType = {
  userType: UserType.ACADEMIC_EDUCATOR,
  name: 'Academic Educator',
  description:
    'For educators in academic institutions seeking to enhance teaching through AI-powered tools and content automation.',
  capabilities: {
    maxUsers: 50,
    maxTeams: 5,
    maxProjects: 20,
    storageLimit: '25GB',
    apiCallsPerDay: 5000,
    availableSolutions: [
      'MEMORIA_ANTHOLOGY',
      'MEMORIA_LINKEDIN_APP',
      'FLIGHT_MEMORY_SYSTEM',
      'DREAM_COMMANDER_LITE',
    ],
    features: {
      brandDiagnostics: true,
      contentGeneration: true,
      courseCreation: true,
      studentAssessment: true,
      researchAssistant: true,
      publishingAutomation: true,
      collaborativeEditing: true,
      classroomIntegration: true,
      learningAnalytics: true,
      academicPublishing: true,
    },
    support: {
      responseTime: '24 hours',
      dedicatedAgent: false,
      trainingHours: 5,
      onboarding: 'Standard',
    },
  },
  pricing: {
    freeTrial: {
      days: 3,
      requiresCardDetails: false,
      limitations: [
        'Limited to 10 users',
        'Limited to 3 projects',
        '5GB storage limit',
        'No academic publishing',
        'Basic support only',
      ],
    },
    tiers: [
      {
        name: 'Educator Basic',
        price: 29.99,
        billingPeriod: 'monthly',
        discount: {
          annual: 15,
          description: '15% discount with annual billing',
        },
      },
      {
        name: 'Educator Plus',
        price: 59.99,
        billingPeriod: 'monthly',
        discount: {
          annual: 20,
          description: '20% discount with annual billing',
        },
        additionalFeatures: [
          'Priority support',
          'Advanced analytics',
          'Unlimited project storage',
          'Full academic publishing integration',
        ],
      },
    ],
    enterprise: {
      available: true,
      description:
        'Custom pricing for department-wide or institution-wide deployments. Contact sales for details.',
    },
  },
  metadata: {
    idealFor: [
      'University professors',
      'K-12 teachers',
      'Educational content creators',
      'Academic researchers',
      'Department chairs',
      'Educational technology specialists',
    ],
    industries: [
      'Higher Education',
      'K-12 Education',
      'EdTech',
      'Academic Research',
      'Educational Publishing',
    ],
    useCases: [
      'Creating interactive course materials',
      'Automating assessment generation',
      'Building research publication workflows',
      'Developing student-focused learning content',
      'Managing classroom resources efficiently',
      'Creating academic publications',
    ],
    integrations: [
      'Learning Management Systems',
      'Google Classroom',
      'Microsoft Teams for Education',
      'Academic journals',
      'Reference management software',
      'Digital libraries',
    ],
  },
};
