/**
 * Domain Context Protocol (DCP) Implementation
 * Module for managing domains through the Model Context Protocol (MCP)
 * Version: 1.0.0
 */

import axios, { AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { MCPError } from './model-context-protocol';

/**
 * Domain Management Configuration Interface
 */
export interface DomainMCPConfig {
  /** API endpoints for domain services */
  endpoints: {
    /** Firebase Hosting API endpoint */
    firebaseHosting: string;
    /** GoDaddy API endpoint */
    godaddy: string;
    /** Verification service endpoint */
    verification: string;
  };

  /** API keys and authentication */
  auth: {
    /** Firebase project ID */
    firebaseProjectId: string;
    /** GoDaddy API key */
    godaddyApiKey?: string;
    /** GoDaddy API secret */
    godaddyApiSecret?: string;
  };

  /** Domain family configurations */
  domainFamilies: {
    /** Domain family ID */
    [familyId: string]: {
      /** Primary hosting site ID */
      primarySiteId: string;
      /** Alternative site IDs */
      alternateSiteIds?: string[];
      /** Domain patterns belonging to this family */
      domainPatterns: string[];
    };
  };

  /** Human oversight requirements */
  humanOversight: {
    /** Operations requiring human approval */
    requiredFor: ('add' | 'delete' | 'update' | 'verify')[];
    /** Notification email for critical operations */
    notificationEmail?: string;
    /** Approval workflow timeout in hours */
    approvalTimeoutHours?: number;
  };

  /** Debug mode */
  debug?: boolean;
}

/**
 * Domain Record Interface
 */
export interface DomainRecord {
  /** Record type (A, CNAME, TXT, etc.) */
  type: 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV';
  /** Record name */
  name: string;
  /** Record data (IP address, hostname, etc.) */
  data: string;
  /** Time to live (TTL) in seconds */
  ttl: number;
  /** Priority (for MX and SRV records) */
  priority?: number;
}

/**
 * Domain Status Interface
 */
export interface DomainStatus {
  /** Domain name */
  domain: string;
  /** Domain verification status */
  verificationStatus: 'PENDING' | 'VERIFIED' | 'FAILED' | 'NOT_STARTED';
  /** Domain configuration status */
  configStatus: 'PENDING' | 'ACTIVE' | 'FAILED' | 'NOT_CONFIGURED';
  /** Provisioning status */
  provisioningStatus?: 'PENDING' | 'COMPLETE' | 'FAILED';
  /** Required DNS records */
  dnsRecords: DomainRecord[];
  /** Error message if any */
  errorMessage?: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Firebase site ID */
  siteId: string;
}

/**
 * Domain Addition Request Interface
 */
export interface AddDomainRequest {
  /** Domain name to add */
  domain: string;
  /** Firebase site ID */
  siteId?: string;
  /** Domain family ID */
  familyId?: string;
  /** Whether to configure DNS automatically */
  configureDns?: boolean;
  /** Custom DNS records to add/update */
  customDnsRecords?: DomainRecord[];
}

/**
 * Domain Verification Request Interface
 */
export interface VerifyDomainRequest {
  /** Domain name to verify */
  domain: string;
  /** Firebase site ID */
  siteId: string;
  /** Whether to force reverification */
  force?: boolean;
}

/**
 * Domain Update Request Interface
 */
export interface UpdateDomainDnsRequest {
  /** Domain name to update */
  domain: string;
  /** DNS records to update */
  dnsRecords: DomainRecord[];
  /** Whether to overwrite existing records */
  overwrite?: boolean;
}

/**
 * Operation Result Interface
 */
export interface OperationResult<T> {
  /** Success flag */
  success: boolean;
  /** Operation status */
  status: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REQUIRES_APPROVAL';
  /** Operation data */
  data?: T;
  /** Error message if any */
  error?: string;
  /** Operation tracking ID */
  trackingId: string;
  /** Operation timestamp */
  timestamp: string;
  /** Human oversight info */
  oversight?: {
    /** Required approvals */
    requiredApprovals: number;
    /** Received approvals */
    receivedApprovals: number;
    /** Approval deadline */
    approvalDeadline: string;
    /** Approval requestor */
    requestedBy: string;
  };
}

/**
 * Domain Management Error
 */
export class DomainManagementError extends MCPError {
  constructor(message: string, details: any = {}) {
    super({
      message,
      type: 'DOMAIN_MANAGEMENT_ERROR',
      retryable: details.retryable || false,
      details,
    });
    this.name = 'DomainManagementError';
  }
}

/**
 * Domain Context Protocol Implementation
 */
export class DomainContextProtocol {
  private config: DomainMCPConfig;
  private firebaseClient: AxiosInstance;
  private godaddyClient: AxiosInstance;
  private pendingOperations: Map<string, any>;
  private domainMappings: Map<string, string>;
  private familyMappings: Map<string, string[]>;

  /**
   * Create a new Domain Management instance
   */
  constructor(config: DomainMCPConfig) {
    this.config = {
      endpoints: {
        firebaseHosting: 'https://firebasehosting.googleapis.com/v1beta1',
        godaddy: 'https://api.godaddy.com',
        verification: 'https://verification.api.aixtiv.io',
        ...config.endpoints,
      },
      auth: {
        firebaseProjectId: 'api-for-warp-drive',
        ...config.auth,
      },
      domainFamilies: {
        ...config.domainFamilies,
      },
      humanOversight: {
        requiredFor: ['delete'],
        approvalTimeoutHours: 24,
        ...config.humanOversight,
      },
      debug: config.debug || false,
    };

    // Initialize Firebase client
    this.firebaseClient = axios.create({
      baseURL: this.config.endpoints.firebaseHosting,
      timeout: 30000,
    });

    // Initialize GoDaddy client
    this.godaddyClient = axios.create({
      baseURL: this.config.endpoints.godaddy,
      timeout: 30000,
      headers: this.getGoDaddyHeaders(),
    });

    this.pendingOperations = new Map();
    this.domainMappings = new Map();
    this.familyMappings = new Map();

    // Initialize domain mappings
    this.initializeDomainMappings();
  }

  /**
   * Initialize domain mappings from configuration
   */
  private initializeDomainMappings(): void {
    // Process domain families into mappings
    Object.entries(this.config.domainFamilies).forEach(([familyId, family]) => {
      // Store domain patterns for each family
      this.familyMappings.set(familyId, family.domainPatterns);

      // Create direct domain mappings for exact domain matches
      family.domainPatterns.forEach(pattern => {
        if (!pattern.includes('*')) {
          this.domainMappings.set(pattern, family.primarySiteId);
        }
      });
    });
  }

  /**
   * Get GoDaddy headers for API calls
   */
  private getGoDaddyHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.auth.godaddyApiKey && this.config.auth.godaddyApiSecret) {
      headers['Authorization'] = `sso-key ${this.config.auth.godaddyApiKey}:${this.config.auth.godaddyApiSecret}`;
    }

    return headers;
  }

  /**
   * Get site ID for a domain
   */
  private getSiteIdForDomain(domain: string): string {
    // Check for direct mapping
    if (this.domainMappings.has(domain)) {
      return this.domainMappings.get(domain) as string;
    }

    // Check pattern matching
    for (const [familyId, patterns] of this.familyMappings.entries()) {
      for (const pattern of patterns) {
        if (this.matchesDomainPattern(domain, pattern)) {
          return this.config.domainFamilies[familyId].primarySiteId;
        }
      }
    }

    // Fall back to default site
    return this.config.auth.firebaseProjectId;
  }

  /**
   * Check if a domain matches a pattern
   */
  private matchesDomainPattern(domain: string, pattern: string): boolean {
    if (pattern === domain) {
      return true;
    }

    if (pattern.startsWith('*.')) {
      const patternBase = pattern.substring(2);
      return domain.endsWith(patternBase) && domain.length > patternBase.length;
    }

    return false;
  }

  /**
   * Check if an operation requires human oversight
   */
  private requiresHumanOversight(operationType: 'add' | 'delete' | 'update' | 'verify'): boolean {
    return this.config.humanOversight.requiredFor.includes(operationType);
  }

  /**
   * Log operation for human oversight
   */
  private async logOperationForOversight(
    operationType: 'add' | 'delete' | 'update' | 'verify',
    domain: string,
    details: any
  ): Promise<string> {
    const trackingId = uuidv4();
    const deadline = new Date();
    deadline.setHours(deadline.getHours() + (this.config.humanOversight.approvalTimeoutHours || 24));

    const oversightData = {
      trackingId,
      operationType,
      domain,
      details,
      status: 'PENDING_APPROVAL',
      requiredApprovals: 1,
      receivedApprovals: 0,
      approvalDeadline: deadline.toISOString(),
      requestedAt: new Date().toISOString(),
      requestedBy: 'system',
    };

    // In a real implementation, this would store the oversight data in a database
    // and notify the approval authorities via email or other channels
    this.pendingOperations.set(trackingId, oversightData);

    if (this.config.debug) {
      console.log('Operation logged for oversight:', oversightData);
    }

    return trackingId;
  }

  /**
   * Get Firebase access token
   */
  private async getFirebaseAccessToken(): Promise<string> {
    // In a real implementation, this would use the Firebase Admin SDK
    // or a service account to obtain an access token
    // For now, we'll simulate it with a placeholder
    return 'firebase-access-token';
  }

  /**
   * Add a domain to Firebase Hosting
   */
  public async addDomain(request: AddDomainRequest): Promise<OperationResult<DomainStatus>> {
    try {
      const trackingId = uuidv4();
      const timestamp = new Date().toISOString();

      // Determine site ID if not provided
      const siteId = request.siteId || (request.familyId && this.config.domainFamilies[request.familyId]?.primarySiteId) || this.getSiteIdForDomain(request.domain);

      // Check if operation requires human oversight
      if (this.requiresHumanOversight('add')) {
        const oversightTrackingId = await this.logOperationForOversight('add', request.domain, {
          siteId,
          configureDns: request.configureDns,
          customDnsRecords: request.customDnsRecords,
        });

        return {
          success: true,
          status: 'REQUIRES_APPROVAL',
          trackingId: oversightTrackingId,
          timestamp,
          oversight: {
            requiredApprovals: 1,
            receivedApprovals: 0,
            approvalDeadline: new Date(Date.now() + (this.config.humanOversight.approvalTimeoutHours || 24) * 60 * 60 * 1000).toISOString(),
            requestedBy: 'system',
          },
        };
      }

      // Get Firebase access token
      const token = await this.getFirebaseAccessToken();

      // Add domain to Firebase Hosting
      const url = `${this.config.endpoints.firebaseHosting}/sites/${siteId}/domains`;
      const payload = {
        domainName: request.domain,
        type: 'USER_OWNED',
        site: `sites/${siteId}`,
      };

      const response = await this.firebaseClient.post(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const dnsRecords = response.data.dnsRecords || [];

      // Configure DNS if requested
      if (request.configureDns && dnsRecords.length > 0) {
        await this.updateDnsThroughGoDaddy(request.domain, dnsRecords);
      }

      // Add custom DNS records if provided
      if (request.customDnsRecords && request.customDnsRecords.length > 0) {
        await this.updateDnsThroughGoDaddy(request.domain, request.customDnsRecords);
      }

      // Return success result
      return {
        success: true,
        status: 'COMPLETED',
        data: {
          domain: request.domain,
          verificationStatus: 'PENDING',
          configStatus: 'PENDING',
          dnsRecords,
          updatedAt: timestamp,
          siteId,
        },
        trackingId,
        timestamp,
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'Failed to add domain';
      
      if (this.config.debug) {
        console.error('Add domain error:', error);
      }

      throw new DomainManagementError(errorMessage, {
        operation: 'addDomain',
        domain: request.domain,
        siteId: request.siteId,
        retryable: true,
      });
    }
  }

  /**
   * Verify a domain in Firebase Hosting
   */
  public async verifyDomain(request: VerifyDomainRequest): Promise<OperationResult<DomainStatus>> {
    try {
      const trackingId = uuidv4();
      const timestamp = new Date().toISOString();

      // Check if operation requires human oversight
      if (this.requiresHumanOversight('verify')) {
        const oversightTrackingId = await this.logOperationForOversight('verify', request.domain, {
          siteId: request.siteId,
          force: request.force,
        });

        return {
          success: true,
          status: 'REQUIRES_APPROVAL',
          trackingId: oversightTrackingId,
          timestamp,
          oversight: {
            requiredApprovals: 1,
            receivedApprovals: 0,
            approvalDeadline: new Date(Date.now() + (this.config.humanOversight.approvalTimeoutHours || 24) * 60 * 60 * 1000).toISOString(),
            requestedBy: 'system',
          },
        };
      }

      // Get Firebase access token
      const token = await this.getFirebaseAccessToken();

      // Verify domain in Firebase Hosting
      const url = `${this.config.endpoints.firebaseHosting}/sites/${request.siteId}/domains/${request.domain}:verifyDomain`;
      const payload = request.force ? { forceSslVerification: true } : {};

      const response = await this.firebaseClient.post(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      // Return success result
      return {
        success: true,
        status: 'COMPLETED',
        data: {
          domain: request.domain,
          verificationStatus: response.data.status || 'VERIFIED',
          configStatus: 'ACTIVE',
          dnsRecords: response.data.dnsRecords || [],
          updatedAt: timestamp,
          siteId: request.siteId,
        },
        trackingId,
        timestamp,
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'Failed to verify domain';
      
      if (this.config.debug) {
        console.error('Verify domain error:', error);
      }

      throw new DomainManagementError(errorMessage, {
        operation: 'verifyDomain',
        domain: request.domain,
        siteId: request.siteId,
        retryable: true,
      });
    }
  }

  /**
   * Update DNS records for a domain through GoDaddy
   */
  private async updateDnsThroughGoDaddy(domain: string, records: DomainRecord[]): Promise<boolean> {
    try {
      // Format records for GoDaddy API
      const formattedRecords = records.map(record => ({
        type: record.type,
        name: record.name,
        data: record.data,
        ttl: record.ttl,
        priority: record.priority,
      }));

      // Update DNS records
      const url = `${this.config.endpoints.godaddy}/v1/domains/${domain}/records`;
      await this.godaddyClient.put(url, formattedRecords);

      return true;
    } catch (error) {
      if (this.config.debug) {
        console.error('Update DNS error:', error);
      }

      throw new DomainManagementError(`Failed to update DNS records for ${domain}: ${(error as Error).message}`, {
        operation: 'updateDnsThroughGoDaddy',
        domain,
        retryable: true,
      });
    }
  }

  /**
   * Update DNS records for a domain
   */
  public async updateDomainDns(request: UpdateDomainDnsRequest): Promise<OperationResult<boolean>> {
    try {
      const trackingId = uuidv4();
      const timestamp = new Date().toISOString();

      // Check if operation requires human oversight
      if (this.requiresHumanOversight('update')) {
        const oversightTrackingId = await this.logOperationForOversight('update', request.domain, {
          dnsRecords: request.dnsRecords,
          overwrite: request.overwrite,
        });

        return {
          success: true,
          status: 'REQUIRES_APPROVAL',
          trackingId: oversightTrackingId,
          timestamp,
          oversight: {
            requiredApprovals: 1,
            receivedApprovals: 0,
            approvalDeadline: new Date(Date.now() + (this.config.humanOversight.approvalTimeoutHours || 24) * 60 * 60 * 1000).toISOString(),
            requestedBy: 'system',
          },
        };
      }

      // Update DNS records
      await this.updateDnsThroughGoDaddy(request.domain, request.dnsRecords);

      // Return success result
      return {
        success: true,
        status: 'COMPLETED',
        data: true,
        trackingId,
        timestamp,
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'Failed to update DNS records';
      
      if (this.config.debug) {
        console.error('Update DNS error:', error);
      }

      throw new DomainManagementError(errorMessage, {
        operation: 'updateDomainDns',
        domain: request.domain,
        retryable: true,
      });
    }
  }

  /**
   * Get domain status
   */
  public async getDomainStatus(domain: string, siteId?: string): Promise<OperationResult<DomainStatus>> {
    try {
      const trackingId = uuidv4();
      const timestamp = new Date().toISOString();

      // Determine site ID if not provided
      const actualSiteId = siteId || this.getSiteIdForDomain(domain);

      // Get Firebase access token
      const token = await this.getFirebaseAccessToken();

      // Get domain status from Firebase Hosting
      const url = `${this.config.endpoints.firebaseHosting}/sites/${actualSiteId}/domains/${domain}`;
      const response = await this.firebaseClient.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Return success result
      return {
        success: true,
        status: 'COMPLETED',
        data: {
          domain,
          verificationStatus: response.data.status || 'UNKNOWN',
          configStatus: response.data.provisioning?.status || 'UNKNOWN',
          provisioningStatus: response.data.provisioning?.status,
          dnsRecords: response.data.dnsRecords || [],
          errorMessage: response.data.error?.message,
          updatedAt: response.data.updateTime || timestamp,
          siteId: actualSiteId,
        },
        trackingId,
        timestamp,
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'Failed to get domain status';
      
      if (this.config.debug) {
        console.error('Get domain status error:', error);
      }

      throw new DomainManagementError(errorMessage, {
        operation: 'getDomainStatus',
        domain,
        siteId,
        retryable: true,
      });
    }
  }

  /**
   * Delete a domain from Firebase Hosting
   */
  public async deleteDomain(domain: string, siteId?: string): Promise<OperationResult<boolean>> {
    try {
      const trackingId = uuidv4();
      const timestamp = new Date().toISOString();

      // Determine site ID if not provided
      const actualSiteId = siteId || this.getSiteIdForDomain(domain);

      // Check if operation requires human oversight
      if (this.requiresHumanOversight('delete')) {
        const oversightTrackingId = await this.logOperationForOversight('delete', domain, {
          siteId: actualSiteId,
        });

        return {
          success: true,
          status: 'REQUIRES_APPROVAL',
          trackingId: oversightTrackingId,
          timestamp,
          oversight: {
            requiredApprovals: 1,
            receivedApprovals: 0,
            approvalDeadline: new Date(Date.now() + (this.config.humanOversight.approvalTimeoutHours || 24) * 60 * 60 * 1000).toISOString(),
            requestedBy: 'system',
          },
        };
      }

      // Get Firebase access token
      const token = await this.getFirebaseAccessToken();

      // Delete domain from Firebase Hosting
      const url = `${this.config.endpoints.firebaseHosting}/sites/${actualSiteId}/domains/${domain}`;
      await this.firebaseClient.delete(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Return success result
      return {
        success: true,
        status: 'COMPLETED',
        data: true,
        trackingId,
        timestamp,
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'Failed to delete domain';
      
      if (this.config.debug) {
        console.error('Delete domain error:', error);
      }

      throw new DomainManagementError(errorMessage, {
        operation: 'deleteDomain',
        domain,
        siteId,
        retryable: false,
      });
    }
  }

  /**
   * Get all domains for a site
   */
  public async getSiteDomains(siteId: string): Promise<OperationResult<string[]>> {
    try {
      const trackingId = uuidv4();
      const timestamp = new Date().toISOString();

      // Get Firebase access token
      const token = await this.getFirebaseAccessToken();

      // Get domains from Firebase Hosting
      const url = `${this.config.endpoints.firebaseHosting}/sites/${siteId}/domains`;
      const response = await this.firebaseClient.get(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const domains = (response.data.domains || []).map((domain: any) => domain.domainName);

      // Return success result
      return {
        success: true,
        status: 'COMPLETED',
        data: domains,
        trackingId,
        timestamp,
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'Failed to get site domains';
      
      if (this.config.debug) {
        console.error('Get site domains error:', error);
      }

      throw new DomainManagementError(errorMessage, {
        operation: 'getSiteDomains',
        siteId,
        retryable: true,
      });
    }
  }

  /**
   * Check operation approval status
   */
  public async checkOperationApprovalStatus(trackingId: string): Promise<OperationResult<any>> {
    try {
      const timestamp = new Date().toISOString();

      // Get operation data from pendingOperations
      const operation = this.pendingOperations.get(trackingId);

      if (!operation) {
        throw new DomainManagementError(`Operation with tracking ID ${trackingId} not found`, {
          operation: 'checkOperationApprovalStatus',
          trackingId,
          retryable: false,
        });
      }

      // Return operation status
      return {
        success: true,
        status: operation.status === 'APPROVED' ? 'COMPLETED' : 'PENDING',
        data: operation,
        trackingId,
        timestamp,
        oversight: {
          requiredApprovals: operation.requiredApprovals,
          receivedApprovals: operation.receivedApprovals,
          approvalDeadline: operation.approvalDeadline,
          requestedBy: operation.requestedBy,
        },
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'Failed to check operation approval status';
      
      if (this.config.debug) {
        console.error('Check operation approval status error:', error);
      }

      throw new DomainManagementError(errorMessage, {
        operation: 'checkOperationApprovalStatus',
        trackingId,
        retryable: true,
      });
    }
  }

  /**
   * Approve an operation
   */
  public async approveOperation(trackingId: string, approverUserId: string): Promise<OperationResult<any>> {
    try {
      const timestamp = new Date().toISOString();

      // Get operation data from pendingOperations
      const operation = this.pendingOperations.get(trackingId);

      if (!operation) {
        throw new DomainManagementError(`Operation with tracking ID ${trackingId} not found`, {
          operation: 'approveOperation',
          trackingId,
          retryable: false,
        });
      }

      // Check if operation can be approved
      if (operation.status !== 'PENDING_APPROVAL') {
        throw new DomainManagementError(`Operation with tracking ID ${trackingId} is not pending approval`, {
          operation: 'approveOperation',
          trackingId,
          status: operation.status,
          retryable: false,
        });
      }

      // Update operation status
      operation.receivedApprovals += 1;
      
      if (operation.receivedApprovals >= operation.requiredApprovals) {
        operation.status = 'APPROVED';
      }

      // Add approval record
      if (!operation.approvals) {
        operation.approvals = [];
      }
      
      operation.approvals.push({
        approverUserId,
        timestamp,
      });

      // Update operation in pendingOperations
      this.pendingOperations.set(trackingId, operation);

      // Execute operation if approved (in a real implementation, this would be done by a background job)
      if (operation.status === 'APPROVED') {
        // Implementation details depend on the operation type
      }

      // Return success result
      return {
        success: true,
        status: operation.status === 'APPROVED' ? 'COMPLETED' : 'PENDING',
        data: operation,
        trackingId,
        timestamp,
        oversight: {
          requiredApprovals: operation.requiredApprovals,
          receivedApprovals: operation.receivedApprovals,
          approvalDeadline: operation.approvalDeadline,
          requestedBy: operation.requestedBy,
        },
      };
    } catch (error) {
      const errorMessage = (error as Error).message || 'Failed to approve operation';
      
      if (this.config.debug) {
        console.error('Approve operation error:', error);
      }

      throw new DomainManagementError(errorMessage, {
        operation: 'approveOperation',
        trackingId,
        retryable: false,
      });
    }
  }
}

// Export singleton instance creator
export const createDomainProtocol = (config: DomainMCPConfig): DomainContextProtocol => {
  return new DomainContextProtocol(config);
};

export default createDomainProtocol;