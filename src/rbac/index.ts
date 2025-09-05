/**
 * AIXTIV Symphony Role-Based Access Control (RBAC) System
 * © 2025 AI Publishing International LLP
 * 
 * Comprehensive RBAC implementation supporting:
 * - 20,000,000 agent entities
 * - Human users across all pilot types
 * - Dynamic role mapping from JWT claims
 * - Per-route and per-action authorization
 * - Extensible permission system
 * - Multi-tier access control
 */

export * from './types';
export * from './permissions';
export * from './roles';
export * from './middleware';
export * from './decorators';
export * from './services/rbac-service';
export * from './services/permission-engine';
export * from './services/role-mapper';
export * from './utils/rbac-utils';

// Default RBAC configuration
export { DEFAULT_RBAC_CONFIG } from './config/rbac-config';

// Core RBAC functionality
export { RBACSystem } from './core/rbac-system';
