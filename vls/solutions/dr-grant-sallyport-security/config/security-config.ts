/**
 * Security Configuration Interface
 * Defines the configuration structure for the SallyPort Security system
 */

export interface SecurityConfig {
  /**
   * Enable zero-trust security model
   */
  enableZeroTrust: boolean;

  /**
   * Authentication providers to use
   */
  authProviders: string[];

  /**
   * Encryption settings
   */
  encryption: {
    algorithm: string;
    keyLength: number;
    dataAtRest: boolean;
    dataInTransit: boolean;
  };

  /**
   * Logging and monitoring configuration
   */
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    enableAudit: boolean;
    retentionDays: number;
  };

  /**
   * Threat detection settings
   */
  threatDetection: {
    enabled: boolean;
    scanInterval: number; // in minutes
    autoRemediation: boolean;
  };
}
