
import { User, UserType, AuthProvider, UserAuthLevel, USER_TYPES } from '../../integrations/auth/user-auth-types';
import { mcpAsoosFunctoryTemplate, McpFactoryConfig } from '../../mcp-factory/mcp-asoos-factory-template';

// Re-export types for backwards compatibility
export { 
  User, 
  UserType, 
  AuthProvider, 
  UserAuthLevel, 
  USER_TYPES 
} from '../../integrations/auth/user-auth-types';

interface SalleyportClaims {
  roark_delegate?: boolean;
  vision_access?: boolean;
  copilot_admin?: boolean;
  subscriber_level?: 'authenticated' | 'purchased' | 'premium';
  access_token?: string;
}

interface CloudflareUser {
  id: string;
  email: string;
  name?: string;
  verified: boolean;
  created_at: string;
  custom_claims: SalleyportClaims;
}

export class CloudflareAuthService {
  private static instance: CloudflareAuthService;
  private currentUser: User | null = null;
  private authCallbacks: ((user: CloudflareUser | null) => void)[] = [];

  private constructor() {
    this.initializeCloudflareAuth();
  }

  private async initializeCloudflareAuth(): Promise<void> {
    try {
      const accessJwt = this.getCloudflareAccessJWT();
      if (accessJwt) {
        const user = await this.validateCloudflareToken(accessJwt);
        await this.setCurrentUser(user as any);
      }
    } catch (error) {
      console.error('Error initializing Cloudflare authentication:', error);
    }
  }

  private getCloudflareAccessJWT(): string | null {
    const cookies = document.cookie.split(';');
    const accessCookie = cookies.find(cookie => 
      cookie.trim().startsWith('CF_Authorization=')
    );
    
    if (accessCookie) {
      return accessCookie.split('=')[1].trim();
    }
    
    return null;
  }

  private async validateCloudflareToken(token: string): Promise<CloudflareUser | null> {
    try {
      const response = await fetch('/api/auth/validate-token', {
        headers: {
          'CF-Access-Jwt-Assertion': token,
          'Authorization': `Bearer ${token}`
        }
      });
      
      if(response.ok) {
        const data = await response.json();
        return data.user;
      }
      return null;
    } catch (error) {
      console.error('Token validation failed:', error);
      return null;
    }
  }

  public static getInstance(): CloudflareAuthService {
    if (!CloudflareAuthService.instance) {
      CloudflareAuthService.instance = new CloudflareAuthService();
    }
    return CloudflareAuthService.instance;
  }

  private async setCurrentUser(user: CloudflareUser | null, authContext?: any): Promise<void> {
    this.currentUser = user as any; // Cast to User
    
    // If user is authenticated and has business domain, link to company and spawn MCP
    if (user && authContext?.businessDomain) {
      try {
        await this.linkOwnerSubscriberToCompany(user, authContext.businessDomain);
      } catch (error) {
        console.error('Failed to complete company linking during authentication:', error);
        // Don't fail the authentication, but log the error
      }
    }
    
    this.authCallbacks.forEach(callback => callback(user));
  }

  public onAuthStateChanged(callback: (user: CloudflareUser | null) => void) {
    this.authCallbacks.push(callback);
    
    return () => {
      const index = this.authCallbacks.indexOf(callback);
      if (index > -1) {
        this.authCallbacks.splice(index, 1);
      }
    };
  }
  
  public getCurrentUser(): User | null {
    return this.currentUser;
  }ALL SYSTEM  OUTLOOK WITH A BUSSINESS DOMAIN, GOOGLEWORKFORCE WITH A BUINESS DOMAIN, LINKEDIN BUT WITH THEIR BUSINESS' DOMAIN AND WHATS APP WITH A LINK TO RELATED BUSINESS DOMAIN.  IF ONE DOES NOT WISH TO DISCLSE A COMPANY FOR AFILIATION 
THE GO INTO MCP.UFO.2100.COOL WITH A SPPH'

  public async signInWithGoogle(workspaceDomain?: string): Promise<User> {
    return this.initiateOAuth2Flow({ 
      provider: 'google', 
      businessDomain: workspaceDomain,
      requireBusinessVerification: !!workspaceDomain 
    });
  }

  public async signInWithOutlook(businessDomain?: string): Promise<User> {
    return this.initiateOAuth2Flow({ 
      provider: 'outlook', 
      businessDomain,
      requireBusinessVerification: !!businessDomain 
    });
  }

  public async signInWithLinkedIn(companyDomain?: string): Promise<User> {
    return this.initiateOAuth2Flow({ 
      provider: 'linkedin', 
      businessDomain: companyDomain,
      requireBusinessVerification: !!companyDomain 
    });
  }

  public async signInWithWhatsApp(businessDomain?: string): Promise<User> {
    if (!businessDomain) {
      throw new Error('WhatsApp authentication requires a verified business domain. Use mcp.ufo.2100.cool for personal/anonymous access.');
    }
    return this.initiateOAuth2Flow({ 
      provider: 'whatsapp', 
      businessDomain,
      requireBusinessVerification: true 
    });
  }

  public async signInWithWhatsAppBusiness(businessDomain: string): Promise<User> {
    if (!businessDomain) {
      throw new Error('WhatsApp Business authentication requires a verified business domain.');
    }
    return this.initiateOAuth2Flow({ 
      provider: 'whatsapp_business', 
      businessDomain,
      requireBusinessVerification: true 
    });
  }

  public async signInWithEmail(email: string, password: string): Promise<User> {
    return this.initiateOAuth2Flow({ email, password });
  }

  /**
   * Anonymous/Personal authentication through MCP UFO system
   * For users who don't wish to disclose company affiliation
   */
  public async signInWithMcpUfo(spphCode?: string): Promise<User> {
    return this.initiateOAuth2Flow({ 
      provider: 'mcp_ufo', 
      domain: 'mcp.ufo.2100.cool',
      spphCode,
      anonymousAccess: true 
    });
  }

  public async registerWithEmail(email: string, password: string, displayName: string): Promise<User> {
    return this.initiateOAuth2Flow({ 
      email, 
      password, 
      displayName, 
      mode: 'register' 
    });
  }

  public async signOut(): Promise<void> {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      this.setCurrentUser(null);
      const logoutUrl = '/cdn-cgi/access/logout';
      window.location.href = logoutUrl;
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  private async initiateOAuth2Flow(options: any): Promise<User> {
    try {
      // Use service account for OAuth 2.0 flow operationalization
      const serviceAccountCredentials = await this.getServiceAccountCredentials();
      
      const oauth2Config = {
        provider: options.provider,
        businessDomain: options.businessDomain,
        requireBusinessVerification: options.requireBusinessVerification,
        serviceAccount: serviceAccountCredentials,
        redirectUri: this.getOAuth2RedirectUri(),
        scopes: this.getProviderScopes(options.provider),
        state: this.generateSecureState()
      };

      // Generate OAuth 2.0 authorization URL
      const authUrl = await this.buildOAuth2AuthorizationUrl(oauth2Config);
      
      if (options.mobile) {
        // For mobile, return the auth URL for manual completion
        throw new Error(`Complete authentication at: ${authUrl}`);
      }
      
      // For web, redirect to OAuth 2.0 provider
      window.location.href = authUrl;
      
      // Return promise that resolves when auth state changes
      return new Promise((resolve, reject) => {
        const unsubscribe = this.onAuthStateChanged((user) => {
          if (user) {
            unsubscribe();
            resolve(user as any);
          }
        });

        // Extended timeout for OAuth 2.0 flow completion
        setTimeout(() => {
          unsubscribe();
          reject(new Error('OAuth 2.0 authentication timeout'));
        }, 300000); // 5 minutes
      });
      
    } catch (error) {
      console.error('OAuth 2.0 flow failed:', error);
      throw error;
    }
  }

  /**
   * Get Google Cloud Service Account credentials for OAuth 2.0 operationalization
   */
  private async getServiceAccountCredentials(): Promise<any> {
    try {
      // Leverage GCP Secret Manager for service account credentials
      const response = await fetch('/api/auth/service-account-credentials', {
        headers: {
          'Authorization': `Bearer ${this.getCloudflareAccessJWT()}`
        }
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      throw new Error('Failed to retrieve service account credentials');
    } catch (error) {
      console.error('Service account credential retrieval failed:', error);
      throw error;
    }
  }

  /**
   * Get OAuth 2.0 redirect URI for your GCP environment
   */
  private getOAuth2RedirectUri(): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/auth/oauth2/callback`;
  }

  /**
   * Get provider-specific OAuth 2.0 scopes
   */
  private getProviderScopes(provider: string): string[] {
    const scopeMap: { [key: string]: string[] } = {
      'google': [
        'openid',
        'profile', 
        'email',
        'https://www.googleapis.com/auth/userinfo.profile'
      ],
      'outlook': [
        'openid',
        'profile',
        'email',
        'https://graph.microsoft.com/User.Read'
      ],
      'linkedin': [
        'r_liteprofile',
        'r_emailaddress',
        'r_organization_social'
      ],
      'whatsapp': [
        'whatsapp_business_management',
        'whatsapp_business_messaging'
      ],
      'whatsapp_business': [
        'whatsapp_business_management',
        'whatsapp_business_messaging',
        'business_management'
      ]
    };
    
    return scopeMap[provider] || ['openid', 'profile', 'email'];
  }

  /**
   * Generate secure state parameter for OAuth 2.0
   */
  private generateSecureState(): string {
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    return Array.from(randomBytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Build OAuth 2.0 authorization URL using service account operationalization
   */
  private async buildOAuth2AuthorizationUrl(config: any): Promise<string> {
    try {
      const response = await fetch('/api/auth/oauth2/authorization-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getCloudflareAccessJWT()}`
        },
        body: JSON.stringify(config)
      });
      
      if (response.ok) {
        const { authorizationUrl } = await response.json();
        return authorizationUrl;
      }
      
      throw new Error('Failed to build OAuth 2.0 authorization URL');
    } catch (error) {
      console.error('OAuth 2.0 URL generation failed:', error);
      throw error;
    }
  }

  /**
   * Link owner subscriber to company account and spawn MCP server
   * Called after successful OAuth 2.0 authentication
   */
  private async linkOwnerSubscriberToCompany(user: CloudflareUser, businessDomain?: string): Promise<void> {
    try {
      if (!businessDomain) {
        console.warn('No business domain provided for MCP server spawning');
        return;
      }

      // Extract company name from business domain
      const companyName = this.extractCompanyNameFromDomain(businessDomain);
      
      // Spawn company-specific MCP server
      const mcpServerUrl = await this.spawnCompanyMcpServer(companyName, user);
      
      // Link owner subscriber to company account
      await this.linkOwnerSubscriber({
        userId: user.id,
        email: user.email,
        companyName,
        businessDomain,
        mcpServerUrl,
        ownerSubscriberRole: 'primary'
      });
      
      console.log(`Successfully linked owner subscriber ${user.email} to company ${companyName} with MCP server: ${mcpServerUrl}`);
      
    } catch (error) {
      console.error('Failed to link owner subscriber to company:', error);
      throw error;
    }
  }

  /**
   * Extract company name from business domain
   */
  private extractCompanyNameFromDomain(businessDomain: string): string {
    // Remove common TLDs and format for MCP server naming
    const companyName = businessDomain
      .replace(/\.(com|org|net|io|co|inc|llc|corp)$/i, '')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();
    
    return companyName || 'defaultcompany';
  }

  /**
   * Spawn company-specific MCP server with enterprise-grade data isolation
   * Part of the first 10,000 MCP servers rollout with day-1 security
   */
  private async spawnCompanyMcpServer(companyName: string, ownerSubscriber: CloudflareUser): Promise<string> {
    try {
      const mcpServerUrl = `mcp-${companyName}-2100.cool`;
      
      const spawnConfig = {
        companyName,
        mcpServerUrl,
        masterTemplate: 'mcp.asoos.2100.cool', // Master MCP server template
        
        // Enterprise Security Configuration
        dataIsolation: {
          enabled: true,
          isolatedDatabase: `mongodb-atlas-${companyName}`,
          isolatedFirestore: `firestore-${companyName}`,
          isolatedPinecone: `pinecone-${companyName}`,
          isolatedSecrets: `secret-manager-${companyName}`,
          encryptionLevel: 'AES-256-GCM'
        },
        
        // Company Data Protection
        companyProtection: {
          trademarkProtection: true,
          brandSecretIsolation: true,
          employeeDataSegmentation: true,
          crossContaminationPrevention: true,
          auditLogging: true,
          complianceMode: 'ENTERPRISE'
        },
        
        // GCP Infrastructure Isolation
        gcpIsolation: {
          dedicatedProject: `api-for-warp-drive-${companyName}`,
          isolatedVPC: `vpc-${companyName}`,
          privateSubnets: true,
          isolatedCloudRun: true,
          isolatedCloudBuild: true,
          region: 'us-west1',
          multiRegionBackup: ['us-central1', 'eu-west1']
        },
        
        ownerSubscriber: {
          id: ownerSubscriber.id,
          email: ownerSubscriber.email,
          name: ownerSubscriber.name,
          claims: ownerSubscriber.custom_claims,
          role: 'COMPANY_OWNER',
          permissions: [
            'FULL_ACCESS',
            'USER_MANAGEMENT',
            'DATA_GOVERNANCE',
            'SECURITY_ADMIN'
          ]
        },
        
        // First 10K Launch Configuration
        launchConfig: {
          priority: 'TOP_10K',
          supportTier: 'ENTERPRISE_ONBOARDING',
          securityReview: true,
          dedicatedSupport: true,
          onboardingAssistance: true
        },
        
        environment: 'production'
      };
      
      const response = await fetch('/api/mcp/spawn-isolated-company-server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getCloudflareAccessJWT()}`,
          'X-Security-Level': 'ENTERPRISE',
          'X-Data-Isolation': 'REQUIRED'
        },
        body: JSON.stringify(spawnConfig)
      });
      
      if (response.ok) {
        const result = await response.json();
        
        // Verify isolation was properly implemented
        await this.verifyDataIsolation(companyName, result.mcpServerUrl);
        
        return result.mcpServerUrl;
      }
      
      throw new Error(`Failed to spawn isolated MCP server for company: ${companyName}`);
      
    } catch (error) {
      console.error('Isolated MCP server spawning failed:', error);
      throw error;
    }
  }

  /**
   * Verify data isolation implementation for company MCP server
   * Critical for protecting company secrets and trademarks from day 1
   */
  private async verifyDataIsolation(companyName: string, mcpServerUrl: string): Promise<void> {
    try {
      const verificationResponse = await fetch('/api/mcp/verify-isolation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getCloudflareAccessJWT()}`,
          'X-Security-Verification': 'REQUIRED'
        },
        body: JSON.stringify({
          companyName,
          mcpServerUrl,
          verificationChecks: [
            'DATABASE_ISOLATION',
            'SECRET_ISOLATION', 
            'NETWORK_ISOLATION',
            'STORAGE_ISOLATION',
            'CROSS_CONTAMINATION_PREVENTION',
            'TRADEMARK_PROTECTION',
            'BRAND_SECRET_ISOLATION'
          ]
        })
      });
      
      if (!verificationResponse.ok) {
        throw new Error('Data isolation verification failed');
      }
      
      const { verified, isolationScore } = await verificationResponse.json();
      
      if (!verified || isolationScore < 0.95) {
        throw new Error(`Insufficient isolation score: ${isolationScore}. Minimum required: 0.95`);
      }
      
      console.log(`✅ Data isolation verified for ${companyName}: ${isolationScore}`);
      
    } catch (error) {
      console.error('Data isolation verification failed:', error);
      throw error;
    }
  }

  /**
   * Link owner subscriber to their company account with enterprise security
   * Includes data isolation setup for protecting company secrets from day 1
   */
  private async linkOwnerSubscriber(linkingData: {
    userId: string;
    email: string;
    companyName: string;
    businessDomain: string;
    mcpServerUrl: string;
    ownerSubscriberRole: string;
  }): Promise<void> {
    try {
      const response = await fetch('/api/auth/link-owner-subscriber-secure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getCloudflareAccessJWT()}`,
          'X-Security-Level': 'ENTERPRISE',
          'X-Data-Protection': 'COMPANY_SECRETS'
        },
        body: JSON.stringify({
          ...linkingData,
          timestamp: new Date().toISOString(),
          
          // Enterprise Security Settings
          securityConfig: {
            dataIsolation: true,
            trademarkProtection: true,
            brandSecretProtection: true,
            employeeDataSegmentation: true,
            crossContaminationPrevention: true,
            auditLogging: 'COMPREHENSIVE',
            complianceLevel: 'ENTERPRISE'
          },
          
          // Registry Configuration
          registryConfig: {
            mcpRegistry: true,
            agentRegistry: 'mongodb-atlas-isolated',
            sallyPortVerified: true,
            isolatedEnvironment: true
          },
          
          // First 10K Launch Support
          launchSupport: {
            priority: 'TOP_10K',
            onboardingAssistance: true,
            dedicatedSupport: true,
            securityReview: true,
            employeeTraining: true
          }
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to link owner subscriber with enterprise security');
      }
      
      console.log(`✅ Owner subscriber ${linkingData.email} securely linked to ${linkingData.companyName} with data isolation`);
      
      // Initialize employee onboarding security
      await this.initializeEmployeeOnboardingSecurity(linkingData.companyName, linkingData.userId);
      
    } catch (error) {
      console.error('Secure owner subscriber linking failed:', error);
      throw error;
    }
  }
  
  /**
   * Initialize secure employee onboarding for company
   * Protects company data as employees try the system
   */
  private async initializeEmployeeOnboardingSecurity(companyName: string, ownerId: string): Promise<void> {
    try {
      const securityConfig = {
        companyName,
        ownerId,
        
        // Employee Data Protection
        employeeProtection: {
          isolatedOnboarding: true,
          dataSegmentation: true,
          accessControls: 'STRICT',
          trainingRequired: true,
          securityBriefing: true
        },
        
        // Company Asset Protection
        assetProtection: {
          trademarkIsolation: true,
          brandSecretProtection: true,
          intellectualPropertyShielding: true,
          competitiveInformationProtection: true
        },
        
        // System Trial Security
        trialSecurity: {
          sandboxEnvironment: true,
          limitedAccess: true,
          auditedInteractions: true,
          dataLeakagePrevention: true
        }
      };
      
      const response = await fetch('/api/mcp/initialize-employee-security', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getCloudflareAccessJWT()}`,
          'X-Security-Init': 'EMPLOYEE_PROTECTION'
        },
        body: JSON.stringify(securityConfig)
      });
      
      if (response.ok) {
        console.log(`✅ Employee onboarding security initialized for ${companyName}`);
      } else {
        console.warn(`⚠️ Failed to initialize employee security for ${companyName}`);
      }
      
    } catch (error) {
      console.error('Employee onboarding security initialization failed:', error);
      // Don't fail the entire process, but log the error
    }
  }

  /**
   * Handle OAuth2 callback and complete company linking
   * Called from OAuth2 redirect handler
   */
  public async handleOAuth2Callback(authCode: string, state: string, businessDomain?: string): Promise<User> {
    try {
      // Exchange authorization code for access token using service account
      const tokenResponse = await fetch('/api/auth/oauth2/token-exchange', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getCloudflareAccessJWT()}`
        },
        body: JSON.stringify({
          authCode,
          state,
          businessDomain
        })
      });
      
      if (!tokenResponse.ok) {
        throw new Error('Failed to exchange authorization code for tokens');
      }
      
      const { user, accessToken } = await tokenResponse.json();
      
      // Set current user with business domain context for MCP linking
      await this.setCurrentUser(user, { businessDomain });
      
      return user;
      
    } catch (error) {
      console.error('OAuth2 callback handling failed:', error);
      throw error;
    }
  }

  /**
   * Get existing company MCP server URL or spawn new one
   */
  public async getCompanyMcpServer(businessDomain: string): Promise<string> {
    try {
      const companyName = this.extractCompanyNameFromDomain(businessDomain);
      const mcpServerUrl = `mcp-${companyName}-2100.cool`;
      
      // Check if MCP server already exists
      const checkResponse = await fetch(`/api/mcp/check-server/${companyName}`, {
        headers: {
          'Authorization': `Bearer ${this.getCloudflareAccessJWT()}`
        }
      });
      
      if (checkResponse.ok) {
        const { exists, serverUrl } = await checkResponse.json();
        if (exists) {
          return serverUrl;
        }
      }
      
      // MCP server doesn't exist, return the expected URL (will be spawned on next auth)
      return mcpServerUrl;
      
    } catch (error) {
      console.error('Failed to get company MCP server:', error);
      throw error;
    }
  }
}

export const cloudflareAuthService = CloudflareAuthService.getInstance();
