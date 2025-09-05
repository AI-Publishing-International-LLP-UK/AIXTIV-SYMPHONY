/**
 * RBAC Permission Definitions for Aixtiv Symphony
 */

export const DefaultPermissions = {
  // Super permissions
  all_access: 'Complete system access',
  
  // User Management
  manage_users: 'Create, update, delete users',
  manage_roles: 'Assign and revoke roles',
  view_users: 'View user profiles and lists',
  
  // Agent Management (20,000,000 agents)
  manage_agents: 'Full agent lifecycle management',
  operate_agents: 'Start, stop, configure agents',
  view_agents: 'View agent status and metrics',
  agent_self_ops: 'Agent can manage its own operations',
  
  // Pilot Operations
  pilot_control: 'Control pilot assignments and operations',
  companion_ops: 'CRX companion operations',
  quantum_ops: 'QRIX quantum operations', 
  elite_ops: 'HQRIX elite operations',
  macro_manage: 'High-level strategic management',
  
  // Delegation
  manage_delegation: 'Create and manage delegation chains',
  delegated_ops: 'Perform operations through delegation',
  
  // Learning Environment
  access_learning_env: 'Access academy and learning resources',
  create_courses: 'Create and manage courses',
  
  // System Operations
  system_ops: 'System-level operations',
  view_reports: 'View system reports and analytics',
  read_reports: 'Read operational reports',
  
  // Basic Operations
  read_profile: 'Read own profile information',
  update_profile: 'Update own profile',
  use_dashboard: 'Access basic dashboard features',
  
  // AI Support
  ai_supervision: 'Supervise AI operations',
  support_humans: 'Provide human support services',
  
  // SallyPort-specific permissions
  delegate: 'Delegate operations to other users or agents',
  copilot_admin: 'Administer co-pilot operations and configurations',
  vision_access: 'Access vision-related features and data',
  subscription_access: 'Access subscription-based features',
} as const;

export type DefaultPermission = keyof typeof DefaultPermissions;

// Permission groups for easier management
export const PermissionGroups = {
  ADMIN: ['manage_users', 'manage_roles', 'view_reports', 'manage_agents'] as DefaultPermission[],
  AGENT_OPS: ['operate_agents', 'view_agents', 'agent_self_ops'] as DefaultPermission[],
  PILOT_OPS: ['pilot_control', 'companion_ops', 'quantum_ops', 'elite_ops'] as DefaultPermission[],
  BASIC: ['read_profile', 'update_profile', 'use_dashboard'] as DefaultPermission[],
} as const;
