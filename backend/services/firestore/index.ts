/**
 * AIXTIV SYMPHONY™ Firestore Services
 * © 2025 AI Publishing International LLP
 *
 * This index file exports all Firestore services for easy importing throughout the application.
 * It serves as the main entry point for the backend/services/firestore module.
 */

// Import Firestore service modules
import {
  UserService,
  AuthService,
  OrganizationService,
  AgentService,
  IntegrationGatewayService,
  ActivityLoggerService,
  ConversationService,
  PerformanceMetricsService,
  S2DOService,
  RaysComputeService,
  AIXTIVUser,
  Organization,
  Agent,
  IntegrationGateway,
  PerformanceProfile,
  SecurityTier,
  GatewayType,
} from './core/as-backend-core';

// Re-export all services with documentation
/**
 * User Management Services
 * Provides functionality for user creation, authentication, and profile management
 */
export { UserService, AuthService, AIXTIVUser };

/**
 * Organization Management Services
 * Provides functionality for managing organizations, teams, and members
 */
export { OrganizationService, Organization };

/**
 * Agent Services
 * Manages AI agent instances, profiles, and capabilities
 */
export { AgentService, Agent, PerformanceProfile };

/**
 * Integration Gateway Services
 * Handles connections between services, authentication, and API orchestration
 */
export {
  IntegrationGatewayService,
  IntegrationGateway,
  SecurityTier,
  GatewayType,
};

/**
 * Activity and Monitoring Services
 * Tracks system activity and performance metrics
 */
export { ActivityLoggerService, PerformanceMetricsService };

/**
 * Conversation Services
 * Manages conversations, messages, and communication between users and agents
 */
export { ConversationService };

/**
 * Data Security Services
 * Handles secure data objects and encryption
 */
export { S2DOService };

/**
 * Compute Services
 * Manages distributed compute jobs and processing
 */
export { RaysComputeService };

// Import any initialization functions or configuration
// import { initializeFirestore } from './config/firestore-config';

/**
 * Initialize all Firestore services
 * @param options Configuration options
 * @returns Promise that resolves when initialization is complete
 */
export const initializeFirestoreServices = async (options: any = {}) => {
  console.log('Initializing Firestore services...');
  // Add initialization logic here if needed
  // await initializeFirestore(options);

  return {
    status: 'initialized',
    timestamp: new Date().toISOString(),
  };
};

// Default export for convenient import
export default {
  UserService,
  AuthService,
  OrganizationService,
  AgentService,
  IntegrationGatewayService,
  ActivityLoggerService,
  ConversationService,
  PerformanceMetricsService,
  S2DOService,
  RaysComputeService,
  initializeFirestoreServices,
};
