/**
 * Permission Engine for RBAC System
 * © 2025 AI Publishing International LLP
 */

import { Permission, Role } from '../types';

export class PermissionEngine {
  private rolePermissions: Record<string, string[]>;

  constructor(rolePermissions: Record<string, string[]>) {
    this.rolePermissions = rolePermissions;
  }

  /**
   * Checks if the user has the specified role.
   * @param userRoles - The user's roles.
   * @param requiredRole - The required role.
   */
  hasRole(userRoles: Role[], requiredRole: Role): boolean {
    return userRoles.includes(requiredRole);
  }

  /**
   * Checks if the user has all of the specified permissions.
   * @param userPermissions - The user's permissions.
   * @param requiredPermissions - The required permissions.
   */
  hasAllPermissions(userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
    return requiredPermissions.every(permission => userPermissions.includes(permission));
  }

  /**
   * Checks if the user has any of the specified permissions.
   * @param userPermissions - The user's permissions.
   * @param requiredPermissions - The required permissions.
   */
  hasAnyPermission(userPermissions: Permission[], requiredPermissions: Permission[]): boolean {
    return requiredPermissions.some(permission => userPermissions.includes(permission));
  }

  /**
   * Gets all permissions for a given role.
   * @param role - The role to get permissions for.
   */
  getPermissionsForRole(role: Role): Permission[] {
    return (this.rolePermissions[role] || []) as Permission[];
  }

  /**
   * Expands roles to their corresponding permissions.
   * @param roles - The roles to expand.
   */
  expandRolesToPermissions(roles: Role[]): Permission[] {
    const permissions = new Set<Permission>();
    
    roles.forEach(role => {
      const rolePermissions = this.getPermissionsForRole(role);
      rolePermissions.forEach(permission => permissions.add(permission));
    });

    return Array.from(permissions);
  }
}
