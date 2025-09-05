/**
 * RBAC Utility Functions
 * © 2025 AI Publishing International LLP
 */

import { Request } from 'express';
import { UserContext } from '../types';
import { rbacService } from '../services/rbac-service';

/**
 * Extracts user context from an Express request object.
 * @param req - The Express request object
 */
export function extractUserContextFromRequest(req: Request): UserContext | null {
  // Check if user context is already attached (from authentication middleware)
  if ((req as any).user && (req as any).user.id) {
    return (req as any).user as UserContext;
  }

  // Extract from JWT claims if available
  if ((req as any).cloudflareJWT) {
    return rbacService.mapClaimsToContext((req as any).cloudflareJWT);
  }

  // Extract from other JWT sources
  if ((req as any).jwt) {
    return rbacService.mapClaimsToContext((req as any).jwt);
  }

  return null;
}

/**
 * Checks if a user has a specific permission.
 * @param userContext - The user's context
 * @param permission - The permission to check
 */
export function hasPermission(userContext: UserContext, permission: string): boolean {
  return userContext.permissions.includes(permission as any);
}

/**
 * Checks if a user has a specific role.
 * @param userContext - The user's context
 * @param role - The role to check
 */
export function hasRole(userContext: UserContext, role: string): boolean {
  return userContext.roles.includes(role as any);
}

/**
 * Checks if a user is an agent.
 * @param userContext - The user's context
 */
export function isAgent(userContext: UserContext): boolean {
  return !userContext.isHuman && !!userContext.agentId;
}

/**
 * Checks if a user is a human.
 * @param userContext - The user's context
 */
export function isHuman(userContext: UserContext): boolean {
  return userContext.isHuman;
}

/**
 * Gets the squadron for a user (for Elite 11 and Mastery 33).
 * @param userContext - The user's context
 */
export function getSquadron(userContext: UserContext): string | null {
  return userContext.squadron || null;
}

/**
 * Checks if a user belongs to Elite 11 squadron.
 * @param userContext - The user's context
 */
export function isElite11(userContext: UserContext): boolean {
  return userContext.squadron === 'elite_11' || hasRole(userContext, 'hqrix');
}

/**
 * Checks if a user belongs to Mastery 33 squadron.
 * @param userContext - The user's context
 */
export function isMastery33(userContext: UserContext): boolean {
  return userContext.squadron === 'mastery_33' || 
         (hasRole(userContext, 'qrix') && !isElite11(userContext));
}

/**
 * Creates a resource-specific permission check.
 * @param resource - The resource identifier
 * @param action - The action to perform
 */
export function createResourceCheck(resource: string, action: string) {
  return (userContext: UserContext) => {
    // For agents, they can only access their own resources
    if (isAgent(userContext)) {
      if (resource.startsWith('agents:') && !resource.includes(userContext.agentId!)) {
        return false;
      }
    }

    // Check if user has general permission for the action
    const generalPermissions = {
      'create': 'manage_',
      'read': 'view_',
      'update': 'manage_',
      'delete': 'manage_',
      'execute': 'operate_'
    };

    const prefix = generalPermissions[action as keyof typeof generalPermissions];
    if (prefix) {
      const resourceType = resource.split(':')[0];
      const requiredPermission = `${prefix}${resourceType}`;
      
      if (hasPermission(userContext, requiredPermission)) {
        return true;
      }
    }

    // Check for super permissions
    if (hasPermission(userContext, 'all_access')) {
      return true;
    }

    return false;
  };
}
