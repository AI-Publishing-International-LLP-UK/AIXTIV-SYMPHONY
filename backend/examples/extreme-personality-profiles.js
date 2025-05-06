/**
 * Extreme Corner Personality Profiles Based on Career Trajectory Analysis
 *
 * This file demonstrates four distinct personality patterns we might observe
 * at the extreme edges of our 9-box model, based on career trajectory analysis
 * and behavioral observation (not formal assessments).
 */

// Four extreme profile examples based on observable career patterns

const extremeProfileExamples = {
  /**
   * PROFILE 1: The Analytical Specialist
   * Position: Upper Left Corner (High Analytical, High Detail, Low People-Orientation)
   */
  analyticalSpecialist: {
    careerPatterns: {
      // Observable career history patterns
      typicalRoles: [
        'Research Scientist',
        'Data Analyst',
        'Specialized Engineer',
        'Technical Specialist',
      ],

      careerProgressionPath:
        'Depth over breadth - increasing technical specialization rather than management',

      transitionSignals: [
        'Transitions rarely involve people management',
        'Moves toward roles with greater autonomy and specialization',
        'Seeks environments with clear processes and structure',
        'Values precision and accuracy in work outputs',
      ],

      projectChoices: [
        'Gravitates toward complex technical challenges',
        'Prefers solo work on well-defined problems',
        'Builds deep expertise in specific knowledge domains',
        'Documentation and systems are detailed and precise',
      ],
    },

    observableBehaviors: {
      communicationStyle: {
        patterns: [
          'Concise and fact-based communication',
          'Prefers written over verbal interaction',
          'Focuses on accuracy and technical details',
          'May seem reserved in group settings',
        ],
        signsInWrittenWork: [
          'Detailed explanations with supporting data',
          'Logical structure with clear reasoning',
          'Limited use of emotional language',
          'Precision in terminology',
        ],
      },

      decisionApproach: {
        patterns: [
          'Systematic evaluation of options',
          'Data-driven decision making',
          'Thorough research before action',
          'Preference for objective criteria',
        ],
      },

      workspaceSignals: [
        'Organized and structured workspace',
        'Technical reference materials prominent',
        'Limited personal items or decoration',
        'Tools for analysis and precision work',
      ],

      collaborationTendencies: [
        'Works effectively but selectively with others',
        'Prefers clear roles and responsibilities',
        'Values competence over relationship-building',
        'Direct and focused in meetings',
      ],
    },

    careerSatisfactionCorrelations: {
      highSatisfactionEnvironments: [
        'Research institutions',
        'Technical development roles',
        'Environments valuing precision and expertise',
        'Roles with clear objectives and metrics',
      ],

      lowSatisfactionEnvironments: [
        'Sales-oriented organizations',
        'Highly social work environments',
        'Roles requiring constant collaboration',
        'Positions with ambiguous objectives',
      ],

      motivationalDrivers: [
        'Intellectual challenge',
        'Technical mastery',
        'Quality and precision',
        'Recognition for expertise',
      ],
    },

    interactionInsights: {
      howToEngage: [
        'Present information logically and precisely',
        'Respect their expertise and knowledge depth',
        'Allow time for processing and analysis',
        'Focus on facts over personal experiences',
      ],

      potentialBlindSpots: [
        'May underestimate importance of relationship-building',
        'Could miss emotional aspects of workplace dynamics',
        'Might prefer perfect solutions over practical implementation',
        'May struggle with ambiguity',
      ],
    },
  },

  /**
   * PROFILE 2: The Dynamic Influencer
   * Position: Upper Right Corner (High People-Orientation, High Strategic, Low Detail)
   */
  dynamicInfluencer: {
    careerPatterns: {
      // Observable career history patterns
      typicalRoles: [
        'Marketing Executive',
        'Sales Leader',
        'Business Development',
        'Entrepreneurial Ventures',
      ],

      careerProgressionPath:
        'Rapid advancement through relationship-building and visible impact',

      transitionSignals: [
        'Frequent moves to larger scope of influence',
        'Often changes organizations to gain advancement',
        'Gravitates toward high-visibility positions',
        'Takes calculated risks in career moves',
      ],

      projectChoices: [
        'Leads initiatives with high organizational visibility',
        'Focuses on growth and expansion projects',
        'Builds teams and coalitions',
        'Prefers creative, open-ended challenges',
      ],
    },

    observableBehaviors: {
      communicationStyle: {
        patterns: [
          'Expressive and animated verbal communication',
          'Story-driven presentation of ideas',
          'Emphasizes possibilities and vision',
          'Builds rapport quickly with diverse audiences',
        ],
        signsInWrittenWork: [
          'Persuasive language focusing on impact',
          'Emphasis on big-picture outcomes',
          'Motivational and action-oriented tone',
          'Less detail, more vision and strategy',
        ],
      },

      decisionApproach: {
        patterns: [
          'Quick, intuitive decision-making',
          'Weighs people impact and organizational perception',
          'Comfortable with ambiguity and calculated risk',
          'Values speed and momentum over perfect information',
        ],
      },

      workspaceSignals: [
        'Dynamic, often social workspace',
        'Multiple ongoing conversations and projects',
        'Recognition and relationship artifacts visible',
        'Less structured, more adaptable environment',
      ],

      collaborationTendencies: [
        'Builds wide networks of relationships',
        'Brings people together across boundaries',
        'Inspires and motivates team members',
        'Creates enthusiasm for initiatives',
      ],
    },

    careerSatisfactionCorrelations: {
      highSatisfactionEnvironments: [
        'Growth-oriented organizations',
        'Entrepreneurial cultures',
        'Roles with external influence',
        'Environments valuing innovation and change',
      ],

      lowSatisfactionEnvironments: [
        'Highly structured, process-driven organizations',
        'Technical specialist roles',
        'Positions requiring extended solo work',
        'Environments with rigid hierarchies',
      ],

      motivationalDrivers: [
        'Impact and influence',
        'Recognition and visibility',
        'Variety and new challenges',
        'Relationship building',
      ],
    },

    interactionInsights: {
      howToEngage: [
        'Focus on possibilities and opportunities',
        'Allow for interactive and dynamic discussion',
        'Recognize their ideas and contributions',
        'Connect work to broader mission and impact',
      ],

      potentialBlindSpots: [
        'May overlook important details in execution',
        'Could underestimate process and structure needs',
        'Might focus on new ideas at expense of follow-through',
        'Can be overly optimistic about timeframes',
      ],
    },
  },

  /**
   * PROFILE 3: The Supportive Stabilizer
   * Position: Lower Left Corner (High Process, High People-Support, Low Strategic)
   */
  supportiveStabilizer: {
    careerPatterns: {
      // Observable career history patterns
      typicalRoles: [
        'Administrative Leadership',
        'Project Coordinator',
        'HR Specialist',
        'Customer Support Manager',
      ],

      careerProgressionPath:
        'Steady advancement within organizations through reliability and team support',

      transitionSignals: [
        'Long tenure in organizations',
        'Transitions focused on team and cultural fit',
        'Seeks environments with clear expectations',
        'Values stability and predictability',
      ],

      projectChoices: [
        'Focuses on improving systems for people',
        'Implements practical solutions to ongoing needs',
        'Builds infrastructure for team success',
        'Maintains and enhances existing processes',
      ],
    },

    observableBehaviors: {
      communicationStyle: {
        patterns: [
          'Diplomatic and considerate in interactions',
          'Attentive listening and thoughtful responses',
          'Focuses on harmony and team cohesion',
          'Patient explanation of processes and expectations',
        ],
        signsInWrittenWork: [
          'Clear instructions and guidance',
          'Supportive and inclusive language',
          'Practical application emphasis',
          'Consideration of diverse perspectives',
        ],
      },

      decisionApproach: {
        patterns: [
          'Consultative and consensus-building',
          'Careful consideration of people impact',
          'Values proven approaches over innovation',
          'Emphasizes consistency and fairness',
        ],
      },

      workspaceSignals: [
        'Organized systems focused on accessibility',
        'Tools for supporting others prominent',
        'Comfortable and inclusive environment',
        'Resources organized for team use',
      ],

      collaborationTendencies: [
        'Facilitates group cohesion and process',
        'Ensures all voices are heard',
        'Builds strong, stable relationships',
        'Reliable follow-through on commitments',
      ],
    },

    careerSatisfactionCorrelations: {
      highSatisfactionEnvironments: [
        'Stable, established organizations',
        'Team-oriented cultures',
        'Service-oriented missions',
        'Environments valuing consistency and support',
      ],

      lowSatisfactionEnvironments: [
        'Highly competitive organizations',
        'Frequently changing priorities',
        'Environments requiring constant innovation',
        'Roles with high ambiguity or risk',
      ],

      motivationalDrivers: [
        'Helping others succeed',
        'Creating stable systems',
        'Building harmonious teams',
        'Consistent, quality outcomes',
      ],
    },

    interactionInsights: {
      howToEngage: [
        'Provide clear expectations and processes',
        'Acknowledge their contributions to team success',
        'Build rapport through reliability and consistency',
        'Show appreciation for their support of others',
      ],

      potentialBlindSpots: [
        'May resist necessary change to maintain stability',
        'Could focus too much on process over outcomes',
        'Might avoid conflict even when needed',
        'May struggle with rapid shifts in direction',
      ],
    },
  },

  /**
   * PROFILE 4: The Strategic Executor
   * Position: Lower Right Corner (High Implementation, High Strategic, Low Process)
   */
  strategicExecutor: {
    careerPatterns: {
      // Observable career history patterns
      typicalRoles: [
        'Operations Executive',
        'Implementation Leader',
        'Program Director',
        'COO/CIO',
      ],

      careerProgressionPath:
        'Advancement through successful delivery of challenging strategic initiatives',

      transitionSignals: [
        'Moves toward roles with greater implementation challenge',
        'Transitions after successful completion of major initiatives',
        'Seeks organizations needing transformation',
        'Values results and practical outcomes',
      ],

      projectChoices: [
        'Tackles projects requiring both vision and execution',
        'Builds systems that translate strategy to action',
        'Focuses on measurable outcomes and implementation',
        'Revitalizes struggling operations or programs',
      ],
    },

    observableBehaviors: {
      communicationStyle: {
        patterns: [
          'Direct and outcomes-focused communication',
          'Clear expectations and accountability emphasis',
          'Balances big picture with practical steps',
          'Minimal time on process details unless critical',
        ],
        signsInWrittenWork: [
          'Action-oriented plans with clear ownership',
          'Focus on measurable results and timelines',
          'Strategic context with tactical implementation',
          'Emphasis on execution excellence',
        ],
      },

      decisionApproach: {
        patterns: [
          'Pragmatic and outcome-focused',
          'Weighs strategic impact against practical constraints',
          'Comfortable making tough calls with limited information',
          'Values proving concepts through initial execution',
        ],
      },

      workspaceSignals: [
        'Visual tracking of key initiatives and metrics',
        'Combination of strategic and tactical tools',
        'Meeting spaces designed for action planning',
        'Evidence of completed projects and outcomes',
      ],

      collaborationTendencies: [
        'Builds action-oriented teams',
        'Clear direction and delegation',
        'Focuses collaboration on tangible outcomes',
        'Drives accountability for results',
      ],
    },

    careerSatisfactionCorrelations: {
      highSatisfactionEnvironments: [
        'Organizations needing strategic execution',
        'Turnaround or growth situations',
        'Results-focused cultures',
        'Environments valuing practical innovation',
      ],

      lowSatisfactionEnvironments: [
        'Highly theoretical organizations',
        'Excessive process and bureaucracy',
        'Environments resistant to change',
        'Positions without decision authority',
      ],

      motivationalDrivers: [
        'Delivering measurable results',
        'Solving complex implementation challenges',
        'Building high-performing execution systems',
        'Driving visible change and improvement',
      ],
    },

    interactionInsights: {
      howToEngage: [
        'Focus on outcomes and results',
        'Present both strategy and practical implementation',
        'Be direct about challenges and constraints',
        'Demonstrate commitment to execution excellence',
      ],

      potentialBlindSpots: [
        'May underestimate importance of process sustainability',
        'Could push too hard for results without buy-in',
        'Might overlook maintenance in favor of new initiatives',
        'May become impatient with consensus-building',
      ],
    },
  },
};

/**
 * Demonstrates how career trajectory analysis reveals personality patterns
 * without formal assessments
 */
function analyzeBehavioralPatterns(careerData) {
  // Example function showing how we would analyze career data
  // to identify personality patterns through observable behavior
  console.log(
    'Analyzing career trajectory data to identify behavioral patterns...'
  );
  console.log('NO FORMAL ASSESSMENTS USED - purely observational analysis');

  // Identify pattern matches with our known profiles
  // based on career progression, communication artifacts, and work outcomes
  // rather than psychological tests or instruments

  return {
    patternMatches: [
      { profileType: 'analyticalSpecialist', matchScore: 0.82 },
      { profileType: 'strategicExecutor', matchScore: 0.65 },
      { profileType: 'dynamicInfluencer', matchScore: 0.34 },
      { profileType: 'supportiveStabilizer', matchScore: 0.21 },
    ],

    confidenceLevel: 0.82, // High confidence based on clear pattern recognition

    behavioralEvidence: [
      'Career history shows increasing technical specialization',
      'Communication artifacts demonstrate logical structure and precision',
      'Project selection history reveals preference for complex technical problems',
      'Workspace organization signals systematic approach to information',
    ],

    careerInsights: {
      environmentFit: 'Strong match for research-oriented organizations',
      potentialChallenges:
        'May need support in highly collaborative environments',
      developmentOpportunities: 'Building influence skills for broader impact',
      valueProposition: 'Deep expertise and analytical excellence',
    },
  };
}

module.exports = {
  extremeProfileExamples,
  analyzeBehavioralPatterns,
};
