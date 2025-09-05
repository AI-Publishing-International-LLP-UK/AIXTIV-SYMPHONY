/**
 * RBAC Role Definitions for Aixtiv Symphony
 */

export const DefaultRoles = {
  owner: ['all_access'],
  admin: ['manage_users', 'manage_roles', 'view_reports', 'manage_agents'],
  rix: ['operate_agents', 'read_reports', 'manage_delegation'],
  crx: ['companion_ops', 'support_humans', 'access_learning_env'],
  qrix: ['quantum_ops', 'ai_supervision'],
  hqrix: ['elite_ops', 'macro_manage'],
  pcp: ['pilot_control', 'system_ops'],
  delegate: ['delegated_ops'],
  agent: ['agent_self_ops'],
  human: ['read_profile', 'use_dashboard'],
} as const;

export type DefaultRole = keyof typeof DefaultRoles;

