/**
 * Comprehensive 9-Box Personality Framework
 *
 * This framework provides a behavioral observation-based approach to understanding
 * personality styles in three key environments:
 * 1. Academy (learning environment)
 * 2. Workplace (professional environment)
 * 3. Vision Space (innovation/future-oriented environment)
 *
 * Rather than formal assessments, this model uses career trajectory analysis,
 * behavioral observation, and interaction patterns to identify styles.
 */

/**
 * The 9-Box Grid Dimensions:
 *
 * X-Axis: People Orientation (Low to High)
 * Y-Axis: Strategic Thinking (Low to High)
 * Z-Axis (implied): Process Orientation (Low to High)
 *
 * This creates a 3x3x3 space with 27 potential style combinations,
 * which can be further refined into numerous subcombinations based on
 * intensity and context-specific manifestations.
 */

const nineBoxFramework = {
  dimensions: {
    xAxis: {
      name: 'People Orientation',
      lowDescriptor: 'Task/Data-Focused',
      midDescriptor: 'Balanced Approach',
      highDescriptor: 'People/Relationship-Focused',
      behavioralIndicators: {
        low: [
          'Prefers independent work',
          'Communication focuses on facts and data',
          'Minimal social interaction in work context',
          'Evaluates success through objective metrics',
        ],
        mid: [
          'Comfortable in both solo and team settings',
          'Balances data with interpersonal considerations',
          'Selective but meaningful workplace relationships',
          'Considers both human and technical factors',
        ],
        high: [
          'Energized by collaborative work',
          'Communication emphasizes connection and engagement',
          'Extensive professional relationship network',
          'Evaluates success through team harmony and development',
        ],
      },
    },

    yAxis: {
      name: 'Strategic Thinking',
      lowDescriptor: 'Practical/Tactical',
      midDescriptor: 'Operational',
      highDescriptor: 'Visionary/Strategic',
      behavioralIndicators: {
        low: [
          'Focuses on immediate tasks and problems',
          'Prefers concrete, specific direction',
          'Works effectively within established systems',
          'Values practical application and efficiency',
        ],
        mid: [
          'Balances short and medium-term objectives',
          'Implements strategies within operational context',
          'Optimizes existing systems and processes',
          'Connects daily work to broader objectives',
        ],
        high: [
          'Naturally considers long-term implications',
          'Sees patterns and opportunities in complexity',
          'Questions and reimagines existing approaches',
          'Connects disparate ideas into coherent vision',
        ],
      },
    },

    zAxis: {
      name: 'Process Orientation',
      lowDescriptor: 'Fluid/Adaptive',
      midDescriptor: 'Balanced Structure',
      highDescriptor: 'Systematic/Structured',
      behavioralIndicators: {
        low: [
          'Comfortable with ambiguity and change',
          'Adapts approach based on situation',
          'Prefers flexible guidelines over rigid procedures',
          'Focuses on outcomes rather than methodology',
        ],
        mid: [
          'Creates appropriate structure for situation',
          'Follows critical processes while adapting non-essential ones',
          'Documents important elements without over-formalizing',
          'Balances consistency with contextual adaptation',
        ],
        high: [
          'Creates comprehensive systems and processes',
          'Values consistency, documentation and structure',
          'Preference for clearly defined expectations and roles',
          'Methodical approach to tasks and problems',
        ],
      },
    },
  },

  /**
   * Core Personality Styles (27 Primary Combinations)
   * Combining the three dimensions at different levels
   * produces 27 distinct core styles
   */
  coreStyles: {
    // Low Strategic Thinking (Bottom Row)
    LLL: {
      label: 'Adaptive Specialist',
      description:
        'Independent, tactical, and flexible problem solver who adapts quickly to changing tasks',
      commonCareerPatterns: [
        'Technical troubleshooting roles',
        'Emergency response positions',
        'Independent technical contractors',
        'Support specialists',
      ],
    },
    LLM: {
      label: 'Consistent Specialist',
      description:
        'Independent, tactical worker who establishes reliable routines and processes',
      commonCareerPatterns: [
        'Quality control specialists',
        'Technical maintenance roles',
        'Process technicians',
        'Specialized administrative support',
      ],
    },
    LLH: {
      label: 'Structured Specialist',
      description:
        'Detail-oriented individual contributor who creates and maintains critical systems',
      commonCareerPatterns: [
        'Database administrators',
        'Compliance specialists',
        'Documentation experts',
        'Systems administrators',
      ],
    },
    LML: {
      label: 'Adaptive Technician',
      description:
        'Task-focused operator who efficiently manages ongoing operations with flexibility',
      commonCareerPatterns: [
        'Field technicians',
        'IT support specialists',
        'Production operators',
        'Service technicians',
      ],
    },
    LMM: {
      label: 'Steady Technician',
      description:
        'Reliable task-focused implementer who maintains consistent performance in operations',
      commonCareerPatterns: [
        'Manufacturing specialists',
        'Logistics coordinators',
        'Technical operators',
        'Maintenance technicians',
      ],
    },
    LMH: {
      label: 'Process Guardian',
      description:
        'Process-oriented technical specialist who ensures consistent operational standards',
      commonCareerPatterns: [
        'Quality assurance specialists',
        'Safety compliance officers',
        'Process documentation specialists',
        'Regulatory affairs coordinators',
      ],
    },
    LHL: {
      label: 'Adaptive Coordinator',
      description:
        'Task-oriented facilitator who connects people to resources with practical flexibility',
      commonCareerPatterns: [
        'Technical customer support',
        'Resource coordinators',
        'Service dispatchers',
        'Flexible administrative roles',
      ],
    },
    LHM: {
      label: 'Supportive Coordinator',
      description:
        'Service-oriented facilitator who helps others through established channels',
      commonCareerPatterns: [
        'Administrative support',
        'Customer service representatives',
        'Technical team coordinators',
        'Support specialists',
      ],
    },
    LHH: {
      label: 'Process Facilitator',
      description:
        'People-supporting specialist who ensures others can navigate systems successfully',
      commonCareerPatterns: [
        'Benefits administrators',
        'HR operations specialists',
        'Training coordinators',
        'Onboarding specialists',
      ],
    },

    // Medium Strategic Thinking (Middle Row)
    MLL: {
      label: 'Tactical Innovator',
      description:
        'Independent problem-solver who develops creative solutions within operational contexts',
      commonCareerPatterns: [
        'Technical project leads',
        'Systems analysts',
        'Product specialists',
        'R&D technicians',
      ],
    },
    MLM: {
      label: 'Operational Architect',
      description:
        'Designs and implements practical systems that balance structure with efficiency',
      commonCareerPatterns: [
        'IT infrastructure specialists',
        'Process improvement analysts',
        'Operations analysts',
        'Technical project managers',
      ],
    },
    MLH: {
      label: 'Systematic Developer',
      description:
        'Creates comprehensive technical solutions with thorough documentation and structure',
      commonCareerPatterns: [
        'Software engineers',
        'Systems architects',
        'Quality engineers',
        'Regulatory affairs managers',
      ],
    },
    MML: {
      label: 'Operational Catalyst',
      description:
        'Balances operational excellence with adaptability to optimize performance',
      commonCareerPatterns: [
        'Operations supervisors',
        'Team leads',
        'Project coordinators',
        'Technical program managers',
      ],
    },
    MMM: {
      label: 'Balanced Manager',
      description:
        'The central archetype who balances people, strategy and process equally',
      commonCareerPatterns: [
        'Department managers',
        'Program managers',
        'Operations managers',
        'Team managers',
      ],
    },
    MMH: {
      label: 'Process Manager',
      description:
        'Ensures operational excellence through well-defined systems and measured outcomes',
      commonCareerPatterns: [
        'Quality managers',
        'Operational excellence leaders',
        'Process managers',
        'Production managers',
      ],
    },
    MHL: {
      label: 'Adaptive Team Leader',
      description:
        'People-focused operational leader who adapts approach based on team needs',
      commonCareerPatterns: [
        'Team leaders',
        'Project managers',
        'Client relationship managers',
        'Service delivery managers',
      ],
    },
    MHM: {
      label: 'Team Developer',
      description:
        'Builds team capability through balanced structure and people development',
      commonCareerPatterns: [
        'Team managers',
        'Training managers',
        'HR business partners',
        'Department leaders',
      ],
    },
    MHH: {
      label: 'Process Harmonizer',
      description:
        'Creates people-centric systems that promote both wellbeing and productivity',
      commonCareerPatterns: [
        'HR operations managers',
        'Employee experience leaders',
        'Organizational development specialists',
        'Training and compliance managers',
      ],
    },

    // High Strategic Thinking (Top Row)
    HLL: {
      label: 'Visionary Specialist',
      description:
        'Forward-thinking expert who develops innovative approaches independently',
      commonCareerPatterns: [
        'Research scientists',
        'Technical architects',
        'Strategic advisors',
        'Specialized consultants',
      ],
    },
    HLM: {
      label: 'Strategic Architect',
      description:
        'Designs comprehensive future-oriented systems with clear implementation paths',
      commonCareerPatterns: [
        'Enterprise architects',
        'Strategic planners',
        'Systems strategists',
        'Policy architects',
      ],
    },
    HLH: {
      label: 'Systematic Visionary',
      description:
        'Creates comprehensive frameworks for complex future challenges with detailed roadmaps',
      commonCareerPatterns: [
        'Chief architects',
        'Research directors',
        'Strategic planning officers',
        'Regulatory strategists',
      ],
    },
    HML: {
      label: 'Innovative Driver',
      description:
        'Implements strategic vision through practical, adaptable execution',
      commonCareerPatterns: [
        'Innovation managers',
        'Strategic implementation leaders',
        'Business development directors',
        'Change management leaders',
      ],
    },
    HMM: {
      label: 'Strategic Manager',
      description:
        'Translates vision into organized action while balancing structure and adaptability',
      commonCareerPatterns: [
        'Senior directors',
        'Business unit leaders',
        'Program directors',
        'Department heads',
      ],
    },
    HMH: {
      label: 'Strategic Organizer',
      description:
        'Creates comprehensive systems to implement long-term vision with thorough execution',
      commonCareerPatterns: [
        'COOs',
        'Chief strategy officers',
        'Organizational transformation leaders',
        'Strategic operations directors',
      ],
    },
    HHL: {
      label: 'Inspirational Leader',
      description:
        'Engages and inspires others toward ambitious vision through adaptive approaches',
      commonCareerPatterns: [
        'Executive directors',
        'Startup founders',
        'Change leaders',
        'Transformational coaches',
      ],
    },
    HHM: {
      label: 'People Strategist',
      description:
        'Develops strategic direction with strong focus on human capital and cultural factors',
      commonCareerPatterns: [
        'Chief people officers',
        'Culture transformation leaders',
        'Strategic HR directors',
        'Organizational design consultants',
      ],
    },
    HHH: {
      label: 'Transformational Architect',
      description:
        'Creates comprehensive change systems focused on both people and strategic outcomes',
      commonCareerPatterns: [
        'Organizational transformation executives',
        'Chief learning officers',
        'Cultural change architects',
        'Leadership development executives',
      ],
    },
  },

  /**
   * Each core style can be further refined by identifying intensity (1-3) on each dimension,
   * creating a potential 3^5 combinatorial space when including context variations
   */
  intensityRefinement: {
    intensityLevels: ['Mild', 'Moderate', 'Pronounced'],

    dimensionalWeighting: {
      xIntensity: 'Degree of independence vs. social energy',
      yIntensity: 'Depth of strategic vs. tactical orientation',
      zIntensity: 'Strength of systematic vs. adaptive preferences',
    },

    subtypeNotation:
      'Using a 5-character code: Position(3) + X-Intensity(1) + Z-Intensity(1)',

    example: {
      coreStyle: 'MHM', // Team Developer
      xIntensity: 3, // Pronounced people-orientation
      zIntensity: 1, // Mild process structure
      subtypeCode: 'MHM31',
      interpretation:
        'Team Developer with very strong people focus but only mild process preference',
      careerImplication:
        'Likely excels in people development roles with flexibility on procedures',
    },
  },

  /**
   * Context-Specific Manifestations Across Three Environments
   */
  environmentalManifestations: {
    academy: {
      description: 'How personality patterns manifest in learning environments',

      dimensionExpressions: {
        peopleOrientation: {
          low: [
            'Prefers independent study',
            'Direct, fact-based questions',
            'May contribute selectively in group settings',
            'Values objective assessment criteria',
          ],
          high: [
            'Thrives in collaborative learning',
            'Actively engages in discussions',
            'Forms study groups and learning communities',
            'Values peer feedback and social learning',
          ],
        },
        strategicThinking: {
          low: [
            'Focuses on mastering immediate course content',
            'Prefers clear, specific assignments',
            'May question relevance of theoretical content',
            'Learns best through concrete examples',
          ],
          high: [
            'Connects course material to broader concepts',
            'Self-directs learning beyond requirements',
            'Asks "why" questions about underlying principles',
            'Creates frameworks to organize knowledge',
          ],
        },
        processOrientation: {
          low: [
            'Flexible in approach to assignments',
            'May work in bursts of productivity',
            'Adapts study strategies based on content',
            'May challenge arbitrary procedures',
          ],
          high: [
            'Creates detailed study schedules',
            'Maintains organized notes and materials',
            'Prefers clear rubrics and expectations',
            'Follows recommended processes consistently',
          ],
        },
      },

      learningApproaches: {
        LLL: 'Hands-on, just-in-time learning of practical skills',
        MMM: 'Balanced mix of theory and application with moderate structure',
        HHH: 'Comprehensive learning systems integrating social and conceptual aspects',
        // Additional combinations as needed
      },

      instructionalStrategies: {
        LLL: [
          'Provide practical problems to solve independently',
          'Offer flexibility in demonstration of competency',
          'Focus on skill application over theory',
          'Allow space for individual troubleshooting',
        ],
        HHH: [
          'Create collaborative learning communities',
          'Connect learning to strategic impact and future implications',
          'Provide comprehensive frameworks and systems',
          'Structure learning journey with clear progression paths',
        ],
        // Additional combinations as needed
      },
    },

    workplace: {
      description:
        'How personality patterns manifest in professional environments',

      dimensionExpressions: {
        peopleOrientation: {
          low: [
            'Prefers defined interactions with clear purpose',
            'Communication focused on tasks and outcomes',
            'Values autonomy in work execution',
            'May need prompting for team updates',
          ],
          high: [
            'Regularly initiates collaboration',
            'Invests in relationship building across organization',
            'Attentive to team dynamics and morale',
            'Communicates proactively and frequently',
          ],
        },
        strategicThinking: {
          low: [
            'Focuses on excellence in assigned responsibilities',
            'Practicality and immediate impact drive decisions',
            'May question initiatives without clear outcomes',
            'Strong in tactical execution and problem-solving',
          ],
          high: [
            'Naturally connects work to organizational strategy',
            'Identifies future opportunities and challenges',
            'Considers systemic implications of decisions',
            'Proposes innovative approaches to existing processes',
          ],
        },
        processOrientation: {
          low: [
            'Adapts quickly to changing priorities',
            'May create minimalist documentation',
            'Focuses on outcomes over methodology',
            'Values efficiency and pragmatism',
          ],
          high: [
            'Creates and maintains detailed documentation',
            'Establishes clear procedures for recurring tasks',
            'Ensures compliance with established protocols',
            'Monitors process metrics for consistency',
          ],
        },
      },

      managementApproaches: {
        LLL: 'Provide clear objectives with flexibility on execution method',
        MMM: 'Balance direction with autonomy, providing context for assignments',
        HHH: 'Create comprehensive systems with clear people development paths',
        // Additional combinations as needed
      },

      careerDevelopmentStrategies: {
        LLL: [
          'Technical mastery and specialized expertise',
          'Increasing scope of independent responsibility',
          'Recognition for problem-solving effectiveness',
          'Opportunities for skill diversification',
        ],
        HHH: [
          'Leadership roles with organizational transformation focus',
          'Building cross-functional collaborative initiatives',
          'Creating systems for strategic organizational change',
          'Mentoring and developing future leaders',
        ],
        // Additional combinations as needed
      },
    },

    visionSpace: {
      description:
        'How personality patterns manifest in innovation and future-oriented contexts',

      dimensionExpressions: {
        peopleOrientation: {
          low: [
            'Innovates through deep technical exploration',
            'May develop breakthrough concepts independently',
            'Values ideas based on objective merit',
            'Focuses on solution elegance and feasibility',
          ],
          high: [
            'Innovates through collaborative ideation',
            'Builds diverse networks for inspiration',
            'Considers human impact and adoption in concepts',
            'Effectively enrolls others in visionary ideas',
          ],
        },
        strategicThinking: {
          low: [
            'Focuses on practical innovations with immediate application',
            'Improves existing systems incrementally',
            'Values tangible, implementable solutions',
            'Grounds ideas in current capabilities',
          ],
          high: [
            'Envisions transformative possibilities',
            'Connects disparate concepts into new paradigms',
            'Comfortable with long-term horizons',
            'Inspires fundamental rethinking of approaches',
          ],
        },
        processOrientation: {
          low: [
            'Explores ideas through rapid iteration',
            'Comfortable with ambiguity and experimentation',
            'Adapts approach based on emerging insights',
            'Resists premature formalization of concepts',
          ],
          high: [
            'Creates comprehensive frameworks for innovation',
            'Develops systematic approaches to idea development',
            'Documents vision evolution methodically',
            'Structures exploration through defined processes',
          ],
        },
      },

      innovationApproaches: {
        LLL: 'Rapid prototyping and practical problem-solving',
        MMM: 'Balanced approach to structured innovation with implementation focus',
        HHH: 'Comprehensive transformation frameworks with collaborative design',
        // Additional combinations as needed
      },

      creativeEnvironmentStrategies: {
        LLL: [
          'Provide space for independent exploration',
          'Focus on solving real-world problems',
          'Allow flexible experimentation without rigid process',
          'Evaluate ideas based on practical impact potential',
        ],
        HHH: [
          'Create collaborative innovation communities',
          'Develop comprehensive frameworks for transformative change',
          'Structure ideation through systematic approaches',
          'Connect vision to strategic impact and human experience',
        ],
        // Additional combinations as needed
      },
    },
  },

  /**
   * Development Patterns and Trajectories
   */
  developmentTrajectories: {
    description: 'How personality styles evolve and develop over time',

    commonPatterns: {
      dimensionalExpansion: {
        description:
          'Developing capacity in initially weaker dimensions while maintaining strengths',
        examples: [
          'Technical specialist (LLL) developing team leadership capabilities (LHL)',
          'Visionary strategist (HHL) developing implementation systems (HHM)',
          'Process manager (MMH) expanding strategic perspective (HMH)',
        ],
      },

      contextualFlexibility: {
        description:
          'Becoming more adaptable to different environments and requirements',
        examples: [
          'Developing ability to shift from structured (xxH) to flexible (xxL) approaches when needed',
          'Learning to toggle between people-focused (Hxx) and task-focused (Lxx) depending on context',
          'Balancing visionary thinking (Hxx) with tactical execution (Lxx) as situation requires',
        ],
      },

      integrationAndBalance: {
        description: 'Moving toward more balanced expression across dimensions',
        examples: [
          'Highly specialized technical expert (LLH) developing into balanced manager (MMM)',
          'Inspirational but unstructured leader (HHL) developing operational discipline (HMM)',
          'Detail-oriented implementer (LMH) developing strategic perspective (MMM)',
        ],
      },
    },

    growthChallenges: {
      overextension: {
        description:
          'Attempting to operate too far from natural style without sufficient support',
        examples: [
          'Systematic specialist (LLH) struggling in highly collaborative innovation role (HHL)',
          'People-focused leader (HHL) burning out in highly detailed process role (LLH)',
          'Strategic thinker (HxL) frustrated in highly procedural environment (xLH)',
        ],
      },

      inflexibility: {
        description:
          'Inability to adapt style to changing requirements or contexts',
        examples: [
          'Maintaining rigid processes when situation requires adaptation',
          'Focusing exclusively on technical solutions when people issues need attention',
          'Pursuing visionary ideas without practical implementation considerations',
        ],
      },

      naturalTendencyRetreat: {
        description: 'Under pressure, reverting strongly to base preferences',
        examples: [
          'Process-oriented person becoming extremely rigid during crisis',
          'People-oriented person avoiding necessary critical feedback',
          'Independent specialist withdrawing from collaboration during stress',
        ],
      },
    },

    developmentStrategies: {
      structuredExposure: {
        description:
          'Gradually increasing comfort in non-preferred areas through structured experiences',
        approaches: [
          'Assign projects requiring moderate stretch beyond preferences',
          'Provide mentoring and support during dimensional expansion',
          'Create safe practice environments for new approaches',
          'Offer specific feedback on growth area behaviors',
        ],
      },

      complementaryPartnerships: {
        description:
          'Pairing individuals with complementary styles for mutual learning',
        approaches: [
          'Create diverse teams with balanced style representation',
          'Establish co-leadership models with complementary strengths',
          'Develop appreciation for different approaches through partnership',
          'Structure collaboration to leverage diverse styles',
        ],
      },

      selfAwarenessAndAdaptation: {
        description:
          'Building conscious understanding of own tendencies and adaptation strategies',
        approaches: [
          'Provide behavioral pattern feedback without labeling',
          'Develop contextual awareness of when different approaches are needed',
          'Create personal adaptation strategies for specific situations',
          'Practice intentional flexibility with support and feedback',
        ],
      },
    },
  },

  /**
   * Practical Applications Across Organizational Functions
   */
  applicationsByFunction: {
    talentDevelopment: {
      description:
        'Using behavioral pattern recognition to optimize talent development',
      applications: [
        'Design development programs aligned with natural tendencies and growth edges',
        'Create career paths that leverage evolving style patterns',
        'Match learning approaches to behavioral preferences',
        'Build well-rounded teams with complementary styles',
      ],
    },

    leadershipDevelopment: {
      description:
        'Cultivating leadership effectiveness through pattern awareness',
      applications: [
        'Develop contextual leadership flexibility across dimensions',
        'Build awareness of impact of style on team dynamics',
        'Create complementary leadership partnerships',
        'Design succession planning based on style evolution',
      ],
    },

    teamComposition: {
      description: 'Creating high-performing teams through style diversity',
      applications: [
        'Balance team composition across key dimensions',
        'Assign roles aligned with natural behavioral patterns',
        'Develop appreciation for complementary approaches',
        'Structure collaboration to leverage diverse styles',
      ],
    },

    organizationalDesign: {
      description:
        'Structuring organizations to leverage natural style patterns',
      applications: [
        'Design roles and departments around natural style clusters',
        'Create systems that integrate diverse approaches',
        'Build bridges between functions with different dominant styles',
        'Structure processes to accommodate style diversity',
      ],
    },
  },

  /**
   * Observable Behavioral Indicators and Pattern Recognition
   */
  observationalFramework: {
    description:
      'Framework for observing and recognizing behavioral patterns without assessments',

    dataSourceCategories: [
      {
        category: 'Career History Patterns',
        indicators: [
          'Types of roles and environments selected',
          'Progression patterns and pace',
          'Tenure and transition triggers',
          'Achievements and recognition types',
          'Project selection and success patterns',
        ],
      },
      {
        category: 'Communication Artifacts',
        indicators: [
          'Email and message structure and focus',
          'Meeting contributions and patterns',
          'Documentation style and detail level',
          'Presentation approaches and content emphasis',
          'Question types and frequency',
        ],
      },
      {
        category: 'Work Environment Configuration',
        indicators: [
          'Workspace organization and personalization',
          'Tool selection and usage patterns',
          'Schedule structure and time management',
          'Boundary management approaches',
          'Adaptation to remote/in-person settings',
        ],
      },
      {
        category: 'Decision-Making Patterns',
        indicators: [
          'Information gathering approaches',
          'Consideration factors and priorities',
          'Risk tolerance and evaluation',
          'Decision speed and triggers',
          'Revision and adjustment patterns',
        ],
      },
      {
        category: 'Collaboration Behaviors',
        indicators: [
          'Initiation patterns and preferences',
          'Contribution style in group settings',
          'Follow-up and accountability approaches',
          'Conflict navigation strategies',
          'Leadership and follower-ship tendencies',
        ],
      },
    ],

    patternRecognitionProcess: [
      {
        step: 'Data Collection',
        approach:
          'Observe behavioral patterns across multiple contexts over time',
        examples: [
          'Note career history patterns during onboarding',
          'Observe communication patterns in initial interactions',
          'Track project approach and execution tendencies',
          'Notice environmental preferences and adaptations',
        ],
      },
      {
        step: 'Pattern Identification',
        approach: 'Recognize consistent tendencies across dimensions',
        examples: [
          'Identify recurring approaches to problem-solving',
          'Note consistent communication patterns',
          'Observe environmental adaptation strategies',
          'Track decision-making approaches',
        ],
      },
      {
        step: 'Contextual Validation',
        approach:
          'Verify patterns across different environments and requirements',
        examples: [
          'Compare behavior in structured vs. unstructured situations',
          'Observe adaptation to different team compositions',
          'Note responses to varying pressure levels',
          'Track consistency across projects and roles',
        ],
      },
      {
        step: 'Pattern Utilization',
        approach: 'Apply pattern insights to optimize experience and outcomes',
        examples: [
          'Match project assignments to natural tendencies',
          'Provide context and support for growth areas',
          'Structure teams for complementary strengths',
          'Design communication approaches for effectiveness',
        ],
      },
    ],
  },
};

module.exports = nineBoxFramework;
