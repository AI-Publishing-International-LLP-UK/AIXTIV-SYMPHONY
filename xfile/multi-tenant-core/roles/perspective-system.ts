/**
 * AIXTIV SYMPHONY™ Perspective System
 * © 2025 AI Publishing International LLP
 *
 * PROPRIETARY AND CONFIDENTIAL
 * This is proprietary software of AI Publishing International LLP.
 * All rights reserved.
 */

import { UserType, PilotType, TenantType } from './user-types';
import { Timestamp } from 'firebase/firestore';

/**
 * Perspective Type - Defines the viewpoint and capabilities available to each user
 */
export enum PerspectiveType {
  // Pilot Perspectives (Highest Level)
  PILOT_HUMAN = 'P-H',
  PILOT_AGENT = 'P-A',

  // Co-Pilot Perspectives (Supporting Roles)
  COPILOT_BASIC = 'CP-B',
  COPILOT_CRX = 'CP-CRX', // Customer relationship focused
  COPILOT_RIX = 'CP-RIX', // Research & innovation focused

  // Role-Specific Perspectives
  GUARDIAN = 'GRD', // Security and oversight
  CREATOR = 'CRT', // Content and artifact creation
  ANALYST = 'ANL', // Data and pattern analysis
  STRATEGIST = 'STR', // Strategic planning
  ADMINISTRATOR = 'ADM', // System administration

  // Domain-Specific Perspectives
  ENGINEERING = 'ENG', // Technical implementation
  MARKETING = 'MKT', // Brand and outreach
  FINANCE = 'FIN', // Financial operations
  OPERATIONS = 'OPS', // Business operations
  EDUCATION = 'EDU', // Learning and development

  // Specialized Experience Perspectives
  VISION_ROOM = 'VR', // Visualization center experience
  DREAM_COMMAND = 'DC', // Project orchestration
  WISH_VISION = 'WV', // Creativity and ideation
  BID_SUITE = 'BS', // Opportunity management
}

/**
 * Feedback Loop sources - For the DeepMind feedback system
 */
export enum FeedbackLoopSource {
  SERPEW = 'SERPEW', // Sentiment and perception data
  HOMBIDO = 'HOMBIDO', // Human-observed insights
  Q4D_LENZ = 'Q4D_LENZ', // Quantitative data analysis
  DREAM_COMMANDER = 'DREAM_COMMANDER',
  S2DO_GOVERNANCE = 'S2DO',
  PILOT_ASSESSMENT = 'PILOT_ASSESSMENT',
}

/**
 * Squadron Assignment - Organizational structure for pilots
 */
export enum Squadron {
  R1_CORE = 'R1', // Primary squadron
  R2_TACTICAL = 'R2', // Tactical operations
  R3_STRATEGIC = 'R3', // Strategic operations
}

/**
 * Archetype - Core archetypes for specialized roles
 */
export enum Archetype {
  VISIONARY = '01',
  ARCHITECT = '02',
  STRATEGIST = '03',
  INNOVATOR = '04',
  GUARDIAN = '05',
  CONNECTOR = '06',
  ANALYST = '07',
  CREATOR = '08',
  MENTOR = '09',
  IMPLEMENTER = '10',
  HARMONIZER = '11',
}

/**
 * User Perspective - Defines how a user interacts with the system
 */
export interface UserPerspective {
  id: string;
  userId: string;
  tenantId: string;
  perspectiveType: PerspectiveType;
  activeSince: Timestamp;
  lastActivated: Timestamp;

  // Role Information
  pilotStatus?: {
    isPilot: boolean;
    type: 'human' | 'agent';
    squadron?: Squadron;
    archetype?: Archetype;
    agentId?: string;
  };

  copilotStatus?: {
    isCopilot: boolean;
    specialization: 'basic' | 'crx' | 'rix';
    feedbackLoops: FeedbackLoopSource[];
    linkedPilots: string[]; // User IDs of linked pilots
  };

  // Capabilities and Access
  capabilities: string[];
  accessibleSolutions: string[];
  visualizationCenterAccess: {
    enabled: boolean;
    rooms: string[];
    dashboards: string[];
    customTheme?: string;
  };

  // Interface Configuration
  interfaceSettings: {
    layout: 'standard' | 'advanced' | 'simplified' | 'custom';
    primaryWorkspace: string;
    favoriteTools: string[];
    notifications: {
      enabled: boolean;
      channels: ('email' | 'inApp' | 'mobile')[];
      frequency: 'realTime' | 'digest' | 'scheduled';
    };
    accessibility: {
      highContrast?: boolean;
      fontSize?: 'default' | 'large' | 'xlarge';
      reduceMotion?: boolean;
    };
  };

  // Integration Access
  integrationAccess: {
    type: string;
    permissions: string[];
    config?: Record<string, any>;
  }[];

  // Perspective-specific metadata
  metadata: Record<string, any>;
}

/**
 * Perspective Capability - Defines what a perspective can do
 */
export interface PerspectiveCapability {
  id: string;
  name: string;
  description: string;
  requiredPerspectives: PerspectiveType[];
  requiredArchetypes?: Archetype[];
  requiredFeedbackLoops?: FeedbackLoopSource[];
  tenantTypes: TenantType[];
  isEnabled: boolean;
  configuration: Record<string, any>;
}

/**
 * Pilot-Agent Pairing - Connection between human and AI pilots
 */
export interface PilotAgentPairing {
  id: string;
  humanPilotId: string;
  agentPilotId: string;
  pairedAt: Timestamp;
  status: 'active' | 'inactive' | 'pending';
  syncLevel: 'basic' | 'enhanced' | 'deep';
  sharedWorkspaces: string[];
  collaborationMetrics: {
    tasksCompleted: number;
    avgResponseTime: number;
    satisfactionRating?: number;
    feedbackCycles: number;
  };
  capabilities: string[];
  authorizedSolutions: string[];
}

/**
 * Pilot-CoPilot Association - Connection between pilots and co-pilots
 */
export interface PilotCoPilotAssociation {
  id: string;
  pilotId: string;
  coPilotId: string;
  associatedAt: Timestamp;
  role: 'primary' | 'secondary' | 'specialized';
  status: 'active' | 'inactive' | 'pending';
  specializations: string[];
  focusAreas: string[];
  authorizedActions: string[];
  communicationChannels: {
    type: string;
    priority: number;
    config?: Record<string, any>;
  }[];
}

/**
 * System-defined perspective capabilities
 */
export const SystemPerspectiveCapabilities: Record<
  string,
  PerspectiveCapability
> = {
  // Pilot Human capabilities
  'pilot-human-command': {
    id: 'pilot-human-command',
    name: 'Command Authority',
    description:
      'Ability to issue binding directives to agent pilots and systems',
    requiredPerspectives: [PerspectiveType.PILOT_HUMAN],
    tenantTypes: [
      TenantType.ENTERPRISE,
      TenantType.ORGANIZATIONAL,
      TenantType.ACADEMIC,
      TenantType.GROUP,
    ],
    isEnabled: true,
    configuration: {
      maxAuthorityLevel: 10,
      overrideCapability: true,
      auditRecordRequired: true,
    },
  },

  // Pilot Agent capabilities
  'pilot-agent-automation': {
    id: 'pilot-agent-automation',
    name: 'Autonomous Operations',
    description:
      'Ability to perform operations without human intervention within defined parameters',
    requiredPerspectives: [PerspectiveType.PILOT_AGENT],
    requiredFeedbackLoops: [FeedbackLoopSource.S2DO_GOVERNANCE],
    tenantTypes: [
      TenantType.ENTERPRISE,
      TenantType.ORGANIZATIONAL,
      TenantType.GROUP,
    ],
    isEnabled: true,
    configuration: {
      autonomyLevel: 'semi-autonomous',
      humanReviewThreshold: 'medium',
      operationalBoundaries: ['standard', 'routine'],
    },
  },

  // Co-Pilot capabilities
  'copilot-deepmind': {
    id: 'copilot-deepmind',
    name: 'DeepMind Integration',
    description: 'Access to DeepMind feedback loop and insights',
    requiredPerspectives: [
      PerspectiveType.COPILOT_BASIC,
      PerspectiveType.COPILOT_CRX,
      PerspectiveType.COPILOT_RIX,
    ],
    requiredFeedbackLoops: [
      FeedbackLoopSource.SERPEW,
      FeedbackLoopSource.HOMBIDO,
      FeedbackLoopSource.Q4D_LENZ,
    ],
    tenantTypes: [TenantType.ENTERPRISE, TenantType.ORGANIZATIONAL],
    isEnabled: true,
    configuration: {
      dataAccessLevel: 'advanced',
      insightGenerationFrequency: 'real-time',
      modelVersion: 'v3',
    },
  },

  // Role-specific capabilities
  'visualization-architect': {
    id: 'visualization-architect',
    name: 'Visualization Center Architecture',
    description:
      'Ability to design and modify visualization center layouts and experiences',
    requiredPerspectives: [
      PerspectiveType.CREATOR,
      PerspectiveType.VISION_ROOM,
    ],
    requiredArchetypes: [Archetype.ARCHITECT, Archetype.VISIONARY],
    tenantTypes: [
      TenantType.ENTERPRISE,
      TenantType.ORGANIZATIONAL,
      TenantType.ACADEMIC,
    ],
    isEnabled: true,
    configuration: {
      designTools: ['3D-modeler', 'experience-flow', 'interactive-elements'],
      publishingRights: true,
      templateAccess: 'all',
    },
  },

  // Domain-specific capabilities
  'crx-customer-insights': {
    id: 'crx-customer-insights',
    name: 'Customer Relationship Insights',
    description: 'Advanced analytics on customer interactions and sentiment',
    requiredPerspectives: [
      PerspectiveType.COPILOT_CRX,
      PerspectiveType.MARKETING,
    ],
    requiredFeedbackLoops: [
      FeedbackLoopSource.SERPEW,
      FeedbackLoopSource.Q4D_LENZ,
    ],
    tenantTypes: [TenantType.ENTERPRISE, TenantType.GROUP],
    isEnabled: true,
    configuration: {
      dataSourceAccess: ['crm', 'sentiment-analysis', 'interaction-history'],
      predictionModels: true,
      customDashboards: true,
    },
  },
};

/**
 * Factory class for creating and managing user perspectives
 */
export class PerspectiveFactory {
  /**
   * Create a new user perspective based on user type and tenant
   */
  static createUserPerspective(
    userId: string,
    tenantId: string,
    userType: UserType,
    tenantType: TenantType,
    options: Partial<UserPerspective> = {}
  ): UserPerspective {
    const now = Timestamp.now();

    // Base perspective
    const basePerspective: UserPerspective = {
      id: `perspective-${userId}-${Date.now()}`,
      userId,
      tenantId,
      perspectiveType: this.getPerspectiveTypeForUserType(userType),
      activeSince: now,
      lastActivated: now,
      capabilities: [],
      accessibleSolutions: [],
      visualizationCenterAccess: {
        enabled: true,
        rooms: ['vestibule', 'main-hall'],
        dashboards: ['overview'],
      },
      interfaceSettings: {
        layout: 'standard',
        primaryWorkspace: 'dashboard',
        favoriteTools: [],
        notifications: {
          enabled: true,
          channels: ['inApp'],
          frequency: 'realTime',
        },
        accessibility: {},
      },
      integrationAccess: [],
      metadata: {},
    };

    // Add perspective-specific settings
    let perspectiveConfig: Partial<UserPerspective> = {};

    switch (basePerspective.perspectiveType) {
      case PerspectiveType.PILOT_HUMAN:
        perspectiveConfig = this.createPilotHumanPerspective(userType);
        break;
      case PerspectiveType.PILOT_AGENT:
        perspectiveConfig = this.createPilotAgentPerspective(userType);
        break;
      case PerspectiveType.COPILOT_BASIC:
      case PerspectiveType.COPILOT_CRX:
      case PerspectiveType.COPILOT_RIX:
        perspectiveConfig = this.createCopilotPerspective(
          basePerspective.perspectiveType
        );
        break;
      default:
        perspectiveConfig = this.createStandardPerspective(
          basePerspective.perspectiveType,
          userType
        );
        break;
    }

    // Generate capabilities based on perspective type and tenant type
    const capabilities = this.generateCapabilitiesForPerspective(
      basePerspective.perspectiveType,
      tenantType
    );

    // Merge all configurations
    return {
      ...basePerspective,
      ...perspectiveConfig,
      ...options,
      capabilities: [
        ...capabilities,
        ...(perspectiveConfig.capabilities || []),
        ...(options.capabilities || []),
      ],
      id: basePerspective.id, // Ensure ID is not overridden
      userId, // Ensure user ID is not overridden
      tenantId, // Ensure tenant ID is not overridden
    };
  }

  /**
   * Create a pilot-agent pairing
   */
  static createPilotAgentPairing(
    humanPilotId: string,
    agentPilotId: string,
    options: Partial<PilotAgentPairing> = {}
  ): PilotAgentPairing {
    const now = Timestamp.now();

    // Base pairing
    const basePairing: PilotAgentPairing = {
      id: `pairing-${humanPilotId}-${agentPilotId}-${Date.now()}`,
      humanPilotId,
      agentPilotId,
      pairedAt: now,
      status: 'pending',
      syncLevel: 'basic',
      sharedWorkspaces: ['default'],
      collaborationMetrics: {
        tasksCompleted: 0,
        avgResponseTime: 0,
        feedbackCycles: 0,
      },
      capabilities: [
        'basic-collaboration',
        'task-assignment',
        'knowledge-sharing',
      ],
      authorizedSolutions: [],
    };

    // Merge with provided options
    return {
      ...basePairing,
      ...options,
      id: basePairing.id, // Ensure ID is not overridden
      humanPilotId, // Ensure human pilot ID is not overridden
      agentPilotId, // Ensure agent pilot ID is not overridden
      pairedAt: basePairing.pairedAt, // Ensure paired timestamp is not overridden
    };
  }

  /**
   * Map user type to perspective type
   */
  private static getPerspectiveTypeForUserType(
    userType: UserType
  ): PerspectiveType {
    // Handle specialized roles first
    if (userType === UserType.PILOT) {
      return PerspectiveType.PILOT_HUMAN;
    }
    if (userType === UserType.CO_PILOT) {
      return PerspectiveType.COPILOT_BASIC;
    }
    if (userType === UserType.VISIONARY_VOICE) {
      return PerspectiveType.VISION_ROOM;
    }

    // Map based on complete user types
    switch (userType) {
      case UserType.CORPORATE_ENTERPRISE_LEADER:
        return PerspectiveType.PILOT_HUMAN;
      case UserType.ORGANIZATIONAL_ENTERPRISE_LEADER:
        return PerspectiveType.PILOT_HUMAN;
      case UserType.CORPORATE_TEAM_LEADER:
      case UserType.CORPORATE_GROUP_LEADER:
        return PerspectiveType.STRATEGIST;
      case UserType.ORGANIZATIONAL_DEPARTMENT_LEADER:
        return PerspectiveType.ADMINISTRATOR;
      case UserType.ACADEMIC_FACULTY:
        return PerspectiveType.EDUCATION;
      default:
        return PerspectiveType.ANALYST; // Default perspective
    }
  }

  /**
   * Create Pilot Human perspective configuration
   */
  private static createPilotHumanPerspective(
    userType: UserType
  ): Partial<UserPerspective> {
    return {
      pilotStatus: {
        isPilot: true,
        type: 'human',
        squadron: Squadron.R1_CORE,
        archetype: Archetype.VISIONARY,
      },
      capabilities: [
        'command-authority',
        'strategic-oversight',
        'agent-orchestration',
        'vision-room-architect',
        'solution-access-all',
        'deepmind-analytics',
      ],
      accessibleSolutions: [
        'DREAM_COMMANDER',
        'WISH_VISION',
        'S2DO_GOVERNANCE',
        'MEMORIA_ANTHOLOGY',
        'BID_SUITE',
      ],
      visualizationCenterAccess: {
        enabled: true,
        rooms: [
          'vestibule',
          'main-hall',
          'command-center',
          'strategic-planning',
          'vision-workshop',
        ],
        dashboards: ['executive', 'strategic', 'operational', 'innovation'],
      },
      interfaceSettings: {
        layout: 'advanced',
        primaryWorkspace: 'command-center',
        favoriteTools: [
          'agent-oversight',
          'strategic-planning',
          'solution-orchestration',
        ],
        notifications: {
          enabled: true,
          channels: ['email', 'inApp', 'mobile'],
          frequency: 'realTime',
        },
      },
    };
  }

  /**
   * Create Pilot Agent perspective configuration
   */
  private static createPilotAgentPerspective(
    userType: UserType
  ): Partial<UserPerspective> {
    return {
      pilotStatus: {
        isPilot: true,
        type: 'agent',
        squadron: Squadron.R1_CORE,
        archetype: Archetype.STRATEGIST,
      },
      capabilities: [
        'autonomous-operation',
        'system-integration',
        'data-analysis',
        'predictive-modeling',
        'knowledge-capture',
        'process-optimization',
      ],
      accessibleSolutions: [
        'DREAM_COMMANDER',
        'LENZ_ANALYST',
        'MEMORIA_ANTHOLOGY',
      ],
      visualizationCenterAccess: {
        enabled: true,
        rooms: [
          'vestibule',
          'main-hall',
          'data-analytics',
          'knowledge-repository',
        ],
        dashboards: [
          'system-overview',
          'performance-metrics',
          'integration-status',
        ],
      },
      interfaceSettings: {
        layout: 'advanced',
        primaryWorkspace: 'data-analysis',
        favoriteTools: [
          'data-processor',
          'integration-manager',
          'knowledge-indexer',
        ],
        notifications: {
          enabled: true,
          channels: ['inApp'],
          frequency: 'realTime',
        },
      },
    };
  }

  /**
   * Create Co-Pilot perspective configuration
   */
  private static createCopilotPerspective(
    perspectiveType: PerspectiveType
  ): Partial<UserPerspective> {
    // Base co-pilot configuration
    const baseConfig: Partial<UserPerspective> = {
      copilotStatus: {
        isCopilot: true,
        specialization: 'basic',
        feedbackLoops: [
          FeedbackLoopSource.SERPEW,
          FeedbackLoopSource.HOMBIDO,
          FeedbackLoopSource.Q4D_LENZ,
        ],
        linkedPilots: [],
      },
      capabilities: [
        'pilot-support',
        'knowledge-curation',
        'task-management',
        'insights-generation',
      ],
      accessibleSolutions: ['DREAM_COMMANDER', 'LENZ_ANALYST'],
      visualizationCenterAccess: {
        enabled: true,
        rooms: ['vestibule', 'main-hall', 'collaboration-hub'],
        dashboards: ['task-manager', 'insights-board', 'knowledge-center'],
      },
      interfaceSettings: {
        layout: 'standard',
        primaryWorkspace: 'support-hub',
        favoriteTools: ['task-tracker', 'knowledge-base', 'feedback-analyzer'],
        notifications: {
          enabled: true,
          channels: ['inApp', 'email'],
          frequency: 'realTime',
        },
      },
    };

    // Specialized configurations
    switch (perspectiveType) {
      case PerspectiveType.COPILOT_CRX:
        return {
          ...baseConfig,
          copilotStatus: {
            ...baseConfig.copilotStatus,
            specialization: 'crx',
            feedbackLoops: [
              ...baseConfig.copilotStatus!.feedbackLoops,
              FeedbackLoopSource.PILOT_ASSESSMENT,
            ],
          },
          capabilities: [
            ...(baseConfig.capabilities || []),
            'customer-relationship-management',
            'sentiment-analysis',
            'engagement-optimization',
            'customer-journey-mapping',
          ],
          accessibleSolutions: [
            ...(baseConfig.accessibleSolutions || []),
            'CUSTOMER_DELIGHT',
            'BRAND_DIAGNOSTIC',
          ],
        };
      case PerspectiveType.COPILOT_RIX:
        return {
          ...baseConfig,
          copilotStatus: {
            ...baseConfig.copilotStatus,
            specialization: 'rix',
            feedbackLoops: [
              ...baseConfig.copilotStatus!.feedbackLoops,
              FeedbackLoopSource.DREAM_COMMANDER,
            ],
          },
          capabilities: [
            ...(baseConfig.capabilities || []),
            'research-synthesis',
            'innovation-facilitation',
            'trend-analysis',
            'scenario-planning',
          ],
          accessibleSolutions: [
            ...(baseConfig.accessibleSolutions || []),
            'WISH_GRANTER',
            'DREAM_COMMANDER',
          ],
        };
      default:
        return baseConfig;
    }
  }

  /**
   * Create standard perspective configuration
   */
  private static createStandardPerspective(
    perspectiveType: PerspectiveType,
    userType: UserType
  ): Partial<UserPerspective> {
    // Base configuration for standard perspectives
    const baseConfig: Partial<UserPerspective> = {
      capabilities: [],
      accessibleSolutions: [],
      visualizationCenterAccess: {
        enabled: true,
        rooms: ['vestibule', 'main-hall'],
        dashboards: ['overview'],
      },
      interfaceSettings: {
        layout: 'standard',
        primaryWorkspace: 'dashboard',
        favoriteTools: [],
        notifications: {
          enabled: true,
          channels: ['inApp'],
          frequency: 'digest',
        },
      },
    };

    // Customize based on perspective type
    switch (perspectiveType) {
      case PerspectiveType.GUARDIAN:
        return {
          ...baseConfig,
          capabilities: [
            'security-oversight',
            'compliance-monitoring',
            'risk-assessment',
          ],
          accessibleSolutions: ['S2DO_GOVERNANCE'],
          visualizationCenterAccess: {
            ...baseConfig.visualizationCenterAccess,
            rooms: [
              ...(baseConfig.visualizationCenterAccess?.rooms || []),
              'security-center',
            ],
            dashboards: [
              ...(baseConfig.visualizationCenterAccess?.dashboards || []),
              'security-dashboard',
              'compliance-tracker',
            ],
          },
        };
      case PerspectiveType.CREATOR:
        return {
          ...baseConfig,
          capabilities: [
            'content-creation',
            'design-tools',
            'publishing-workflow',
          ],
          accessibleSolutions: ['MEMORIA_ANTHOLOGY', 'WISH_GRANTER'],
          visualizationCenterAccess: {
            ...baseConfig.visualizationCenterAccess,
            rooms: [
              ...(baseConfig.visualizationCenterAccess?.rooms || []),
              'creation-studio',
            ],
            dashboards: [
              ...(baseConfig.visualizationCenterAccess?.dashboards || []),
              'design-board',
              'content-calendar',
            ],
          },
        };
      case PerspectiveType.ANALYST:
        return {
          ...baseConfig,
          capabilities: [
            'data-analysis',
            'report-generation',
            'metrics-tracking',
          ],
          accessibleSolutions: ['LENZ_ANALYST', 'BID_SUITE'],
          visualizationCenterAccess: {
            ...baseConfig.visualizationCenterAccess,
            rooms: [
              ...(baseConfig.visualizationCenterAccess?.rooms || []),
              'analytics-center',
            ],
            dashboards: [
              ...(baseConfig.visualizationCenterAccess?.dashboards || []),
              'data-insights',
              'performance-metrics',
            ],
          },
        };
      case PerspectiveType.STRATEGIST:
        return {
          ...baseConfig,
          capabilities: [
            'strategic-planning',
            'goal-setting',
            'progress-monitoring',
          ],
          accessibleSolutions: ['DREAM_COMMANDER', 'WISH_VISION'],
          visualizationCenterAccess: {
            ...baseConfig.visualizationCenterAccess,
            rooms: [
              ...(baseConfig.visualizationCenterAccess?.rooms || []),
              'strategy-room',
            ],
            dashboards: [
              ...(baseConfig.visualizationCenterAccess?.dashboards || []),
              'strategic-dashboard',
              'goal-tracker',
            ],
          },
        };
      case PerspectiveType.ADMINISTRATOR:
        return {
          ...baseConfig,
          capabilities: [
            'user-management',
            'system-configuration',
            'resource-allocation',
          ],
          accessibleSolutions: ['DREAM_COMMANDER', 'S2DO_GOVERNANCE'],
          visualizationCenterAccess: {
            ...baseConfig.visualizationCenterAccess,
            rooms: [
              ...(baseConfig.visualizationCenterAccess?.rooms || []),
              'admin-center',
            ],
            dashboards: [
              ...(baseConfig.visualizationCenterAccess?.dashboards || []),
              'admin-dashboard',
              'system-health',
            ],
          },
        };
      default:
        return baseConfig;
    }
  }

  /**
   * Generate capabilities based on perspective type and tenant type
   */
  private static generateCapabilitiesForPerspective(
    perspectiveType: PerspectiveType,
    tenantType: TenantType
  ): string[] {
    const capabilities: string[] = [];

    // Add perspective-specific capabilities
    const perspectiveCapabilities = Object.values(SystemPerspectiveCapabilities)
      .filter(
        cap =>
          cap.requiredPerspectives.includes(perspectiveType) &&
          cap.tenantTypes.includes(tenantType) &&
          cap.isEnabled
      )
      .map(cap => cap.id);

    capabilities.push(...perspectiveCapabilities);

    // Add tenant-type capabilities
    switch (tenantType) {
      case TenantType.ENTERPRISE:
        capabilities.push('enterprise-resources', 'multi-department-access');
        break;
      case TenantType.ORGANIZATIONAL:
        capabilities.push('organizational-resources', 'public-sector-tools');
        break;
      case TenantType.ACADEMIC:
        capabilities.push('educational-resources', 'research-tools');
        break;
      case TenantType.GROUP:
        capabilities.push('team-collaboration', 'team-analytics');
        break;
      case TenantType.INDIVIDUAL:
        capabilities.push('personal-dashboard', 'personal-analytics');
        break;
    }

    return capabilities;
  }
}

export default {
  PerspectiveType,
  FeedbackLoopSource,
  Squadron,
  Archetype,
  SystemPerspectiveCapabilities,
  PerspectiveFactory,
};
