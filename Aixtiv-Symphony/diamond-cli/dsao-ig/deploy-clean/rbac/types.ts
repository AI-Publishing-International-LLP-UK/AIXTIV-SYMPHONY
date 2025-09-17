/**
 * RBAC System Types
 * © 2025 AI Publishing International LLP
 */

import { UserType, PilotType } from '../../functions/lib/user-types/user-types';

// Core RBAC entities
export type Role = keyof typeof DefaultRoles;
export type Permission = keyof typeof DefaultPermissions;
export type Action = 'create' | 'read' | 'update' | 'delete' | 'execute';
export type Resource = string; // e.g., 'billing', 'courses:courseId', 'agents:agentId'

// User context derived from JWT
export interface UserContext {
  id: string;
  isHuman: boolean;
  type: UserType | 'agent';
  roles: Role[];
  permissions: Permission[];
  pilotType?: PilotType;
  agentId?: string;
  tenantId?: string;
  squadron?: string;
  // Impersonation fields
  impersonatedBy?: string;
  originalRoles?: Role[];
}

// RBAC configuration
export interface RBACConfig {
  roles: Record<Role, Permission[]>;
  permissions: Record<Permission, string>; // Description of permission
}

// Middleware and decorator options
export interface AuthorizeOptions {
  any?: Permission[];
  all?: Permission[];
  role?: Role;
  customCheck?: (user: UserContext, resource?: any) => boolean | Promise<boolean>;
}

// Impersonation-related types
export interface ImpersonationResult {
  success: boolean;
  message?: string;
  impersonatedUserContext?: UserContext;
}

export interface AuthorizedRequest extends Request {
  user?: UserContext;
  impersonatedUser?: UserContext;
}

export type Squadron = 'elite_11' | 'mastery_33';

export interface ElitePilotContext extends UserContext {
  squadron: Squadron;
  specialPermissions: Permission[];
}

