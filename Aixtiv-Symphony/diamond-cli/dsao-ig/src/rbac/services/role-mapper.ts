/**
 * Role Mapper for RBAC System
 * Maps JWT claims to user context and roles
 * © 2025 AI Publishing International LLP
 */

import { UserContext, Role, Permission } from '../types';
import { UserType, PilotType } from '../../../functions/lib/user-types/user-types';
import { DefaultRoles } from '../roles';
import { PermissionGroups, DefaultPermissions } from '../permissions';

export class RoleMapper {
  /**
   * Maps JWT claims to a UserContext with appropriate roles and permissions.
   * @param claims - JWT claims from authentication
   */
  map(claims: any): UserContext {
    const context: UserContext = {
      id: claims.sub || claims.id || claims.user_id,
      isHuman: !claims.agent_id,
      type: claims.user_type || (claims.agent_id ? 'agent' : 'human'),
      roles: [],
      permissions: [],
      pilotType: claims.pilot_type,
      agentId: claims.agent_id,
      tenantId: claims.tenant_id,
      squadron: claims.squadron,
    };

    // Map based on user type and roles from JWT
    this.mapRoles(context, claims);
    this.mapPermissions(context, claims);

    return context;
  }

  private mapRoles(context: UserContext, claims: any): void {
    const roles: Role[] = [];

    // Check explicit roles from JWT
    if (claims.roles && Array.isArray(claims.roles)) {
      roles.push(...claims.roles.filter(role => role in DefaultRoles));
    }

    // Map user types to roles
    if (context.isHuman) {
      this.mapHumanRoles(context, claims, roles);
    } else {
      this.mapAgentRoles(context, claims, roles);
    }

    // Add owner/admin roles based on special claims
    if (claims.is_owner || claims.owner) {
      roles.push('owner');
    }
    if (claims.is_admin || claims.admin) {
      roles.push('admin');
    }

    context.roles = [...new Set(roles)]; // Remove duplicates
  }

  private mapHumanRoles(context: UserContext, claims: any, roles: Role[]): void {
    // Special mapping for Morgan - Head of Finance
    if (context.id === 'morgan-001' || claims.name === 'Morgan' || claims.role === 'Head of Finance') {
      roles.push('owner');
      roles.push('admin');
      return; // Morgan gets owner access, no need for other role mappings
    }

    // Map pilot types to roles
    if (context.pilotType) {
      switch (context.pilotType) {
        case 'DR_LUCY_R1_CORE_01':
        case 'DR_LUCY_R1_CORE_02':
        case 'DR_LUCY_R1_CORE_03':
          roles.push('rix');
          break;
        case 'DR_CLAUDE_PILOT':
        case 'DR_ROARK_PILOT':
        case 'DR_MEMORIA_PILOT':
          roles.push('crx');
          break;
        case 'PROFESSOR_LEE_PILOT':
          roles.push('qrix');
          break;
        default:
          roles.push('pcp');
      }
    }

    // Map user types to roles
    if (context.type && typeof context.type === 'string') {
      const userType = context.type as UserType;
      
      if (userType.includes('LEADER') || userType.includes('ENTERPRISE')) {
        roles.push('admin');
      } else if (userType.includes('FACULTY') || userType.includes('EDUCATOR')) {
        roles.push('delegate');
      } else {
        roles.push('human');
      }
    }

    // Squadron-based role assignment
    if (context.squadron) {
      if (context.squadron === 'elite_11') {
        roles.push('hqrix');
      } else if (context.squadron === 'mastery_33') {
        roles.push('qrix');
      }
    }
  }

  private mapAgentRoles(context: UserContext, claims: any, roles: Role[]): void {
    // All agents get the base agent role
    roles.push('agent');

    // Map agent types to specialized roles
    if (claims.agent_type) {
      switch (claims.agent_type) {
        case 'RIX':
          roles.push('rix');
          break;
        case 'CRX':
          roles.push('crx');
          break;
        case 'QRIX':
          roles.push('qrix');
          break;
        case 'HQRIX':
          roles.push('hqrix');
          break;
        case 'PCP':
          roles.push('pcp');
          break;
      }
    }

    // Special agent capabilities
    if (claims.delegation_capability) {
      roles.push('delegate');
    }
  }

  private mapPermissions(context: UserContext, claims: any): void {
    const permissions = new Set<Permission>();

    // Add permissions based on roles
    context.roles.forEach(role => {
      const rolePermissions = DefaultRoles[role] as Permission[];
      if (rolePermissions) {
        rolePermissions.forEach(permission => permissions.add(permission));
      }
    });

    // Add explicit permissions from JWT
    if (claims.permissions && Array.isArray(claims.permissions)) {
      claims.permissions.forEach((permission: string) => {
        if (permission in DefaultPermissions) {
          permissions.add(permission as Permission);
        }
      });
    }

    // Add context-specific permissions
    if (context.isHuman) {
      PermissionGroups.BASIC.forEach(permission => permissions.add(permission));
    }

    // Agent-specific permissions
    if (!context.isHuman) {
      permissions.add('agent_self_ops');
    }

    // SallyPort claim-based permissions
    if (claims.delegate) {
      permissions.add('delegate');
    }
    if (claims.copilot_admin) {
      permissions.add('copilot_admin');
    }
    if (claims.vision_access) {
      permissions.add('vision_access');
    }
    if (claims.subscription_level) {
      permissions.add('subscription_access');
      // Add additional permissions based on subscription level
      if (claims.subscription_level === 'premium' || claims.subscription_level === 'enterprise') {
        permissions.add('access_learning_env');
        permissions.add('view_reports');
      }
    }

    context.permissions = Array.from(permissions);
  }
}
