import { HQRIX_CONFIG } from '../../config/hqrix-config';

/**
 * RBAC Core Service
 * © 2025 AI Publishing International LLP
 */

import { AuthorizeOptions, UserContext, RBACConfig } from '../types';
import { PermissionEngine } from './permission-engine';
import { RoleMapper } from './role-mapper';
import { DEFAULT_RBAC_CONFIG } from '../config/rbac-config';

class RBACService {
  private permissionEngine: PermissionEngine;
  private roleMapper: RoleMapper;

  constructor(config: RBACConfig) {
    this.permissionEngine = new PermissionEngine(config.roles);
    this.roleMapper = new RoleMapper();
  }

  /**
   * Checks if a user is authorized based on the given options.
   * @param userContext - The user's context.
   * @param options - Authorization options.
   */
  async isAuthorized(userContext: UserContext, options: AuthorizeOptions): Promise<boolean> {
    if (options.customCheck) {
      return options.customCheck(userContext);
    }

    if (options.role) {
      if (!this.permissionEngine.hasRole(userContext.roles, options.role)) {
        return false;
      }
    }

    if (options.all) {
      if (!this.permissionEngine.hasAllPermissions(userContext.permissions, options.all)) {
        return false;
      }
    }

    if (options.any) {
      if (!this.permissionEngine.hasAnyPermission(userContext.permissions, options.any)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Maps JWT claims to a user context.
   * @param claims - The JWT claims.
   */
  mapClaimsToContext(claims: any): UserContext {
    return this.roleMapper.map(claims);
  }

  /**
   * Checks if a user has a specific permission.
   * @param userContext - The user's context.
   * @param permission - The permission to check.
   */
  hasPermission(userContext: UserContext, permission: string): boolean {
    return this.permissionEngine.hasAnyPermission(userContext.permissions, [permission as any]);
  }

  /**
   * Gets the permissions for a given role.
   * @param role - The role.
   */
  getPermissionsForRole(role: string): string[] {
    const config = DEFAULT_RBAC_CONFIG.roles;
    return config[role as keyof typeof config] || [];
  }

  /**
   * Checks if an agent type has the required permissions for a given path and method
   * based on HQRIX security configuration.
   * @param agentType - The agent type (rix, crx, qrix, hqrix).
   * @param path - The requested path.
   * @param method - The HTTP method.
   */
  async hasRequiredPermissions(agentType: string, path: string, method: string): Promise<boolean> {
    const agentPermissions = HQRIX_CONFIG.agents.serviceAccounts[agentType.toLowerCase()]?.permissions;
    if (!agentPermissions) {
      return false;
    }

    // HQRIX agents have full access
    if (agentPermissions.includes('full-access')) {
      return true;
    }

    // Path-based permission checking
    if (path.includes('/admin') && !agentPermissions.includes('full-access')) {
      return false;
    }

    if (path.includes('/train') && !agentPermissions.includes('train')) {
      return false;
    }

    if (path.includes('/benchmark') && !agentPermissions.includes('benchmark')) {
      return false;
    }

    if (method === 'POST' || method === 'PUT' || method === 'DELETE') {
      if (!agentPermissions.includes('train') && !agentPermissions.includes('full-access')) {
        return false;
      }
    }

    return true;
  }
}

export const rbacService = new RBACService(DEFAULT_RBAC_CONFIG);
