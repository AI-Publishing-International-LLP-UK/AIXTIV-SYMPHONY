/**
 * Core RBAC System
 * © 2025 AI Publishing International LLP
 */

import { RBACConfig, UserContext, AuthorizeOptions } from '../types';
import { RBACService } from '../services/rbac-service';
import { DEFAULT_RBAC_CONFIG } from '../config/rbac-config';

export class RBACSystem {
  private config: RBACConfig;
  private rbacService: RBACService;

  constructor(config: RBACConfig = DEFAULT_RBAC_CONFIG) {
    this.config = config;
    this.rbacService = new RBACService(config);
  }

  /**
   * Checks authorization for a user context against options.
   * @param userContext - The user's context
   * @param options - Authorization options
   */
  async authorize(userContext: UserContext, options: AuthorizeOptions): Promise<boolean> {
    return this.rbacService.isAuthorized(userContext, options);
  }

  /**
   * Maps JWT claims to user context.
   * @param claims - JWT claims
   */
  mapClaimsToContext(claims: any): UserContext {
    return this.rbacService.mapClaimsToContext(claims);
  }

  /**
   * Gets the current configuration.
   */
  getConfig(): RBACConfig {
    return this.config;
  }

  /**
   * Updates the configuration.
   * @param config - New configuration
   */
  updateConfig(config: RBACConfig): void {
    this.config = config;
    this.rbacService = new RBACService(config);
  }
}
