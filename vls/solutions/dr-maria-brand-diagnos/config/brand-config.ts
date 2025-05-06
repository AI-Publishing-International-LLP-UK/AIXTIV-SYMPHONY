/**
 * Brand Configuration Interface
 * Defines the configuration structure for the Brand Diagnos system
 */

export interface BrandConfig {
  /**
   * Brand identity settings
   */
  brandIdentity: {
    name: string;
    values: string[];
    voice: string;
    visualElements: string[];
  };

  /**
   * Customer experience settings
   */
  customerExperience: {
    journeyMappingEnabled: boolean;
    touchpoints: string[];
    feedbackCollection: {
      methods: string[];
      frequency: number; // in days
    };
  };

  /**
   * Analytics settings
   */
  analytics: {
    sentimentAnalysis: boolean;
    npsTracking: boolean;
    customerSatisfactionIndex: boolean;
    reportingFrequency: 'daily' | 'weekly' | 'monthly';
  };

  /**
   * Improvement framework
   */
  improvement: {
    enabled: boolean;
    automatedSuggestions: boolean;
    benchmarking: boolean;
  };
}
