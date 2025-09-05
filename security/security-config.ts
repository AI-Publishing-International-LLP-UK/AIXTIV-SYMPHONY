/**
 * Centralized Security Configuration for Aixtiv Symphony Integration Gateway
 * © 2025 AI Publishing International LLP
 */

// =================================================================
// 1. Roles and Permissions (RBAC)
// =================================================================

/**
 * Defines all available roles within the ASOOS ecosystem.
 * Each role is mapped to a set of permissions.
 */
export const roles = {
  // Core Roles
  owner: ['all_access'], // Super user with unrestricted access
  admin: ['manage_users', 'manage_roles', 'view_reports', 'manage_agents', 'configure_system'],
  
  // AI Pilot Roles
  rix: ['operate_agents', 'read_reports', 'manage_delegation'],
  crx: ['companion_ops', 'support_humans', 'access_learning_env'],
  qrix: ['quantum_ops', 'ai_supervision'],
  hqrix: ['elite_ops', 'macro_manage'],
  
  // Specialized Roles
  pcp: ['pilot_control', 'system_ops'], // Pilot Control Panel
  delegate: ['delegated_ops'], // For delegated operations
  agent: ['agent_self_ops'], // Agent's own operations
  
  // Human and Basic Access
  human: ['read_profile', 'use_dashboard'],
  guest: ['view_public_content'],
};

/**
 * Defines all permissions available in the system.
 * These are granular permissions that can be assigned to roles.
 */
export const permissions = {
  all_access: 'Unrestricted access to all system features',
  
  // User and Role Management
  manage_users: 'Create, update, and delete users',
  manage_roles: 'Assign and revoke user roles',
  
  // Agent Management
  manage_agents: 'Full control over all 20,000,000 AI agents',
  operate_agents: 'Start, stop, and configure AI agents',
  
  // Pilot Operations
  companion_ops: 'CRX-specific companion operations',
  quantum_ops: 'QRIX quantum-level operations',
  elite_ops: 'HQRIX elite pilot operations',
  macro_manage: 'Strategic, high-level system management',
  pilot_control: 'Control pilot assignments and system operations',
  
  // System and Reporting
  configure_system: 'Modify system-level configurations',
  view_reports: 'View comprehensive system analytics and reports',
  read_reports: 'Read operational reports',
  
  // Other
  delegated_ops: 'Perform operations on behalf of another user/agent',
  agent_self_ops: 'Allows an agent to manage its own state',
  support_humans: 'Provide support to human users',
  access_learning_env: 'Access the Academy and learning materials',
  read_profile: 'Read user profile information',
  use_dashboard: 'Access to the basic user dashboard',
  view_public_content: 'Access to public-facing content'
};


// =================================================================
// 2. Access Policies
// =================================================================

/**
 * Defines access control policies for different parts of the system.
 */
export const accessPolicies = {
  // Access control for the Compass Field, which is for agents only
  compassField: {
    allowedRoles: ['rix', 'crx', 'qrix', 'hqrix', 'agent'],
    errorMessage: 'Access to Compass Field is restricted to authorized AI agents.',
  },
  
  // Access control for sensitive data archives (DIDC)
  didcArchives: {
    allowedRoles: ['owner', 'admin', 'hqrix'],
    errorMessage: 'Access to DIDC archives requires elite privileges.',
  },

  // Access to financial and billing systems
  financeAndBilling: {
    allowedRoles: ['owner', 'admin'],
    ipWhitelist: ['203.0.113.0/24'], // Example: Corporate IP range
    errorMessage: 'Access to financial systems is highly restricted.',
  },
};


// =================================================================
// 3. Compliance Flags
// =================================================================

/**
 * Defines compliance-related flags and settings for the system.
 */
export const complianceFlags = {
  // Data residency enforcement for all operations
  enforceDataResidency: true,
  allowedRegions: ['us-west1'],
  
  // Audit log retention policy in years
  logRetentionYears: 7,
  
  // Enable tracking for specific compliance standards
  enableHipaaCompliance: true,
  enableGdprCompliance: true,

  // Historical verification tracking for all agent actions
  historicalVerificationTracking: true,
};


// =================================================================
// 4. DDoS Protection and Rate Limiting
// =================================================================

/**
 * Configuration for DDoS protection and rate limiting.
 * These settings are integrated with Cloudflare.
 */
export const ddosAndRateLimiting = {
  // Cloudflare DDoS Protection Level
  protectionLevel: 'high', // Options: 'high', 'medium', 'low', 'under_attack'
  
  // Rate limiting settings for different types of requests
  rateLimits: {
    api: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // Max requests per IP in the window
    },
    login: {
      windowMs: 60 * 60 * 1000, // 1 hour
      max: 10, // Max login attempts per IP in the window
    },
    sensitiveOperations: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 50,
    },
  },
};


// =================================================================
// 5. Emergency Overrides
// =================================================================

/**
 * Defines settings for emergency overrides and system state.
 * This can be used to put the system into a restricted mode during incidents.
 */
export const emergencyOverrides = {
  // Activate emergency shutdown. If true, most non-essential services will be disabled.
  emergencyShutdownActive: false,
  
  // Message to display to users during an emergency shutdown
  shutdownMessage: 'The system is currently undergoing emergency maintenance. Please try again later.',
  
  // Allow a specific role to bypass the emergency shutdown
  bypassRole: 'owner',
  
  // Whitelisted IPs that can access the system during a shutdown
  bypassIPs: ['198.51.100.1', '198.51.100.2'],
};


