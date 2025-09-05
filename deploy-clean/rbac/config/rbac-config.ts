/**
 * RBAC Configuration
 * © 2025 AI Publishing International LLP
 */

import { RBACConfig } from '../types';
import { DefaultRoles } from '../roles';
import { DefaultPermissions } from '../permissions';

export const DEFAULT_RBAC_CONFIG: RBACConfig = {
  roles: DefaultRoles,
  permissions: DefaultPermissions,
};
