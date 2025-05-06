/**
 * Rewards Configuration Interface
 * Defines the configuration structure for the Cypriot Rewards system
 */

export interface RewardsConfig {
  /**
   * Token system settings
   */
  tokenSystem: {
    enabled: boolean;
    tokenName: string;
    decimalPlaces: number;
    initialSupply: number;
  };

  /**
   * Achievement tracking settings
   */
  achievements: {
    enabled: boolean;
    categories: string[];
    publicLeaderboard: boolean;
  };

  /**
   * Gamification elements
   */
  gamification: {
    enabled: boolean;
    levels: number;
    pointMultipliers: Record<string, number>;
  };

  /**
   * Integration settings
   */
  integrations: {
    walletProvider: string;
    eventTracking: boolean;
    notificationsEnabled: boolean;
    blockchainConnection: boolean;
  };

  /**
   * Authentication and access control
   */
  authentication: {
    requiredLevel: number; // Minimum level 3 authentication
    verifyAccountStatus: boolean;
    accessControlRules: string[];
  };

  /**
   * Entity types eligible for rewards
   */
  eligibleEntities: {
    aiPilots: boolean;
    agents: boolean;
    groundCrew: boolean;
    flightServices: boolean;
    humanOperators: boolean;
    ownerSubscribers: boolean;
  };
}
