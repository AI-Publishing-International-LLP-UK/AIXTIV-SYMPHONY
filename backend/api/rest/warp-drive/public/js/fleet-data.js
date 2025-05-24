/**
 * Vision Lake Fleet Data
 * Contains information about the Antigravity Powercraft Timeliners and Timepressers
 */

const FLEET_DATA = {
  // Timeliners - Deliver today on schedule on demand
  timeliners: [
    {
      id: 'AG-110',
      name: 'AG-110 Super Timeliner',
      description: 'Antigravity Powercraft optimized for routine tasks with automated processes and error handling.',
      type: 'Timeliner',
      category: 'Standard Operations',
      specs: {
        capacity: 'Standard workload',
        frequency: 'Daily execution',
        reliability: '99.9%',
        maintenance: 'Low',
        scalability: 'Medium',
        antigravity: 'Standard Field Generator',
        mintMark: 'Queen Silver Standard'
      },
      features: [
        'Automated error recovery',
        'Consistent performance metrics',
        'Standard integration pathways',
        'Basic redundancy systems',
        'Antigravity propulsion system'
      ],
      wallet: {
        type: 'Queen Mint Mark Owner\'s Wallet',
        certification: 'Standard',
        transferable: true,
        securityLevel: 'High'
      },
      image: 'assets/images/fleet/AG-110.jpg',
      active: true
    },
    {
      id: 'AG-210',
      name: 'AG-210 Enhanced Timeliner',
      description: 'Advanced Antigravity Powercraft with improved performance and reliability for daily operations.',
      type: 'Timeliner',
      category: 'Enhanced Operations',
      specs: {
        capacity: 'Medium workload',
        frequency: 'Daily execution',
        reliability: '99.95%',
        maintenance: 'Low',
        scalability: 'High',
        antigravity: 'Enhanced Field Generator',
        mintMark: 'Queen Gold Standard'
      },
      features: [
        'Optimized performance pathways',
        'Enhanced error recovery',
        'Advanced monitoring',
        'Seamless integration with core systems',
        'Dual-core antigravity engines'
      ],
      wallet: {
        type: 'Queen Mint Mark Owner\'s Wallet',
        certification: 'Enhanced',
        transferable: true,
        securityLevel: 'Very High'
      },
      image: 'assets/images/fleet/AG-210.jpg',
      active: true
    },
    {
      id: 'AG-310',
      name: 'AG-310 Premium Timeliner',
      description: 'Premium Antigravity Powercraft solution for critical tasks requiring high reliability and performance.',
      type: 'Timeliner',
      category: 'Premium Operations',
      specs: {
        capacity: 'High workload',
        frequency: 'Continuous execution',
        reliability: '99.99%',
        maintenance: 'Low',
        scalability: 'Very High',
        antigravity: 'Premium Field Generator',
        mintMark: 'Queen Platinum Standard'
      },
      features: [
        'Real-time monitoring and alerts',
        'Autonomous error correction',
        'Predictive maintenance',
        'High performance optimizations',
        'Guaranteed SLAs',
        'Quantum antigravity stabilizers'
      ],
      wallet: {
        type: 'Queen Mint Mark Owner\'s Wallet',
        certification: 'Premium',
        transferable: true,
        securityLevel: 'Military Grade'
      },
      image: 'assets/images/fleet/AG-310.jpg',
      active: true
    },
    {
      id: 'AG-330',
      name: 'AG-330 Executive Timeliner',
      description: 'Executive-class Antigravity Powercraft designed for leadership and strategic operations.',
      type: 'Timeliner',
      category: 'Executive Operations',
      specs: {
        capacity: 'Specialized workload',
        frequency: 'On-demand execution',
        reliability: '99.999%',
        maintenance: 'Minimal',
        scalability: 'Customizable',
        antigravity: 'Executive Field Generator',
        mintMark: 'Queen Royal Standard'
      },
      features: [
        'Executive dashboard and controls',
        'Priority routing systems',
        'Strategic integration capabilities',
        'Personalized configuration options',
        'Premium support services',
        'Cloaked antigravity field'
      ],
      wallet: {
        type: 'Queen Mint Mark Owner\'s Wallet',
        certification: 'Executive',
        transferable: false,
        securityLevel: 'Ultra Secure'
      },
      image: 'assets/images/fleet/AG-330.jpg',
      active: true
    }
  ],
  
  // Timepressers - Deliver the future today or at the end of the process
  timepressers: [
    {
      id: 'AG-390',
      name: 'AG-390 Daily Timepresser',
      description: 'Antigravity Powercraft that handles daily operations with a focus on consistent future performance.',
      type: 'Timepresser',
      category: 'Daily Operations',
      specs: {
        horizon: 'Near-term',
        complexity: 'Low',
        accuracy: '95%',
        adaptability: 'Medium',
        integration: 'Standard',
        antigravity: 'Standard Temporal Field',
        mintMark: 'Queen Silver Future'
      },
      features: [
        'Daily operational forecasts',
        'Standard prediction models',
        'Basic trend analysis',
        'Integration with operational systems',
        'Time-sensitive antigravity adjustments'
      ],
      wallet: {
        type: 'Queen Mint Mark Owner\'s Wallet',
        certification: 'Future Standard',
        transferable: true,
        securityLevel: 'High'
      },
      image: 'assets/images/fleet/AG-390.jpg',
      active: true
    },
    {
      id: 'AG-490',
      name: 'AG-490 Strategic Timepresser',
      description: 'Strategic Antigravity Powercraft for medium-term planning and forecasting with temporal capabilities.',
      type: 'Timepresser',
      category: 'Strategic Operations',
      specs: {
        horizon: 'Medium-term',
        complexity: 'Medium',
        accuracy: '90%',
        adaptability: 'High',
        integration: 'Advanced',
        antigravity: 'Strategic Temporal Field',
        mintMark: 'Queen Gold Future'
      },
      features: [
        'Quarterly forecasting',
        'Advanced predictive models',
        'Comprehensive trend analysis',
        'What-if scenario planning',
        'Integration with strategic systems',
        'Temporal field manipulation'
      ],
      wallet: {
        type: 'Queen Mint Mark Owner\'s Wallet',
        certification: 'Future Enhanced',
        transferable: true,
        securityLevel: 'Very High'
      },
      image: 'assets/images/fleet/AG-490.jpg',
      active: true
    },
    {
      id: 'AG-590',
      name: 'AG-590 Visionary Timepresser',
      description: 'Long-term visionary Antigravity Powercraft for strategic planning and innovation with advanced temporal capabilities.',
      type: 'Timepresser',
      category: 'Visionary Operations',
      specs: {
        horizon: 'Long-term',
        complexity: 'High',
        accuracy: '85%',
        adaptability: 'Very High',
        integration: 'Comprehensive',
        antigravity: 'Visionary Temporal Field',
        mintMark: 'Queen Platinum Future'
      },
      features: [
        'Multi-year forecasting',
        'Advanced AI predictive models',
        'Emerging trend detection',
        'Disruptive innovation forecasting',
        'Strategic opportunity mapping',
        'Executive decision support',
        'Deep temporal field navigation'
      ],
      wallet: {
        type: 'Queen Mint Mark Owner\'s Wallet',
        certification: 'Future Premium',
        transferable: true,
        securityLevel: 'Military Grade'
      },
      image: 'assets/images/fleet/AG-590.jpg',
      active: true
    },
    {
      id: 'AG-690',
      name: 'AG-690 Sovereign Timepresser',
      description: 'Exclusive Antigravity Powercraft with sovereign capabilities for shaping long-term futures and strategic outcomes.',
      type: 'Timepresser',
      category: 'Sovereign Operations',
      specs: {
        horizon: 'Multi-generational',
        complexity: 'Ultra High',
        accuracy: '95%',
        adaptability: 'Sovereign',
        integration: 'Universal',
        antigravity: 'Sovereign Temporal Field',
        mintMark: 'Queen Sovereign Future'
      },
      features: [
        'Strategic future shaping',
        'Reality framework customization',
        'Outcome probability manipulation',
        'Temporal node navigation',
        'Future anchoring capabilities',
        'Sovereign decision support system',
        'Proprietary temporal field technology'
      ],
      wallet: {
        type: 'Queen Mint Mark Owner\'s Wallet',
        certification: 'Sovereign',
        transferable: false,
        securityLevel: 'Beyond Classification'
      },
      image: 'assets/images/fleet/AG-690.jpg',
      active: true
    }
  ],
  
  // Queen Mint Mark information
  mintMarks: {
    standard: {
      name: 'Queen Standard Mint Mark',
      description: 'Official certification for Antigravity Powercraft ownership',
      security: 'Multi-layered authentication system',
      transferProcess: 'Secure ownership transfer through Queen Mint verification',
      benefits: [
        'Verified craft authenticity',
        'Access to official maintenance services',
        'Insurance and liability coverage',
        'Operational certifications',
        'Resale value protection'
      ]
    },
    walletTypes: [
      {
        type: 'Standard',
        features: [
          'Basic ownership verification',
          'Standard security protocols',
          'Regular maintenance updates'
        ]
      },
      {
        type: 'Enhanced',
        features: [
          'Advanced ownership verification',
          'Enhanced security protocols',
          'Priority maintenance scheduling',
          'Performance optimization access'
        ]
      },
      {
        type: 'Premium',
        features: [
          'Premium ownership verification',
          'Military-grade security',
          'Immediate maintenance response',
          'Full performance optimization',
          'Exclusive feature unlocks'
        ]
      },
      {
        type: 'Executive',
        features: [
          'Executive ownership verification',
          'Ultra-secure protocols',
          'White-glove maintenance service',
          'Custom performance tuning',
          'Proprietary feature access',
          'Executive support services'
        ]
      },
      {
        type: 'Sovereign',
        features: [
          'Sovereign level authentication',
          'Beyond-classification security',
          'Personalized support team',
          'Reality-shaping capabilities',
          'Temporal field manipulation',
          'Strategic outcome influence'
        ]
      }
    ]
  }
};