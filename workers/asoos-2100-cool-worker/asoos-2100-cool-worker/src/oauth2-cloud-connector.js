/**
 * OAuth2 Cloud-to-Cloud Connector
 * Handles OAuth2 authentication flows with MOCOA backend services
 * for Diamond SAO feature activation
 * 
 * FIXED: Promise resolution issues that caused "object promise" responses
 */

// Import promise resolver to fix OAuth2 promise issues
const { safeResolve, resolveOAuth2Response } = require('../../../lib/promise-resolver');

export class OAuth2CloudConnector {
  constructor(env) {
    this.env = env;
    
    // Cloud service endpoints
    this.services = {
      mocoa_gateway: 'https://asoos-integration-gateway-service.asoos-system.svc.cluster.local',
      victory36: 'https://victory36.api-for-warp-drive.asoos.cloud',
      victory36_api: 'https://victory36-api.api-for-warp-drive.asoos.cloud',
      ai_agents: 'https://ai-agents.api-for-warp-drive.asoos.cloud',
      sallyport: 'https://sallyport.asoos.2100.cool'
    };
    
    // OAuth2 configuration for each service
    this.oauth2Config = {
      mocoa_gateway: {
        client_id: env.MOCOA_CLIENT_ID,
        client_secret: env.MOCOA_CLIENT_SECRET,
        authorization_endpoint: `${this.services.mocoa_gateway}/oauth/authorize`,
        token_endpoint: `${this.services.mocoa_gateway}/oauth/token`,
        scopes: ['elite11:read', 'elite11:activate', 'mastery33:read', 'mastery33:activate', 'victory36:read', 'victory36:activate']
      },
      victory36: {
        client_id: env.VICTORY36_CLIENT_ID,
        client_secret: env.VICTORY36_CLIENT_SECRET,
        authorization_endpoint: `${this.services.victory36}/oauth/authorize`,
        token_endpoint: `${this.services.victory36}/oauth/token`,
        scopes: ['victory36:prediction', 'victory36:coordination', 'victory36:shields']
      },
      sallyport: {
        client_id: env.SALLYPORT_CLIENT_ID,
        client_secret: env.SALLYPORT_CLIENT_SECRET,
        authorization_endpoint: `${this.services.sallyport}/oauth/authorize`,
        token_endpoint: `${this.services.sallyport}/oauth/token`,
        scopes: ['diamond_sao:settings', 'diamond_sao:activate', 'llp:member']
      }
    };
  }

  /**
   * Handle Diamond SAO Settings OAuth2 Flow
   */
  async handleDiamondSAOAuth(request) {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const service = url.searchParams.get('service');
    
    switch (action) {
    case 'initiate':
      return this.initiateOAuth2Flow(service);
    case 'callback':
      return this.handleOAuth2Callback(request, service);
    case 'activate_features':
      return this.activateFeatures(request);
    case 'get_status':
      return this.getFeatureStatus(request);
    default:
      return new Response('Invalid action', { status: 400 });
    }
  }

  /**
   * Initiate OAuth2 authorization flow
   */
  async initiateOAuth2Flow(service) {
    const config = this.oauth2Config[service];
    if (!config) {
      return new Response('Unknown service', { status: 400 });
    }

    // Generate secure state parameter
    const state = this.generateSecureState();
    
    // Store state for validation
    // In production, this would be stored in KV or database
    
    const authUrl = new URL(config.authorization_endpoint);
    authUrl.searchParams.set('client_id', config.client_id);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', config.scopes.join(' '));
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('redirect_uri', `https://2100.cool/api/oauth2/callback?service=${service}`);

    return Response.json({
      authorization_url: authUrl.toString(),
      state: state,
      service: service
    });
  }

  /**
   * Handle OAuth2 callback from cloud services
   */
  async handleOAuth2Callback(request, service) {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      return Response.json({
        success: false,
        error: error,
        error_description: url.searchParams.get('error_description')
      });
    }

    if (!code || !state) {
      return Response.json({
        success: false,
        error: 'missing_parameters'
      });
    }

    // Exchange code for access token
    const tokenResponse = await this.exchangeCodeForToken(service, code, state);
    
    if (tokenResponse.success) {
      // Store tokens securely and return success
      return Response.json({
        success: true,
        service: service,
        access_granted: true,
        features_available: await this.getAvailableFeatures(service, tokenResponse.access_token)
      });
    } else {
      return Response.json({
        success: false,
        error: tokenResponse.error
      });
    }
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(service, code, state) {
    const config = this.oauth2Config[service];
    
    try {
      const tokenRequest = new Request(config.token_endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${config.client_id}:${config.client_secret}`)}`
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: `https://2100.cool/api/oauth2/callback?service=${service}`,
          client_id: config.client_id
        })
      });

      const response = await fetch(tokenRequest);
      const data = await response.json();

      if (response.ok) {
        return {
          success: true,
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_in: data.expires_in,
          scope: data.scope
        };
      } else {
        return {
          success: false,
          error: data.error || 'token_exchange_failed'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'network_error'
      };
    }
  }

  /**
   * Activate Elite11, Mastery33, Victory36 features
   */
  async activateFeatures(request) {
    const body = await request.json();
    const { features, llp_member_email } = body;

    const activationResults = {};

    // Activate each requested feature using OAuth2 authenticated calls
    for (const feature of features) {
      try {
        let result;
        switch (feature) {
        case 'elite11':
          result = await this.activateElite11(llp_member_email);
          break;
        case 'mastery33':
          result = await this.activateMastery33(llp_member_email);
          break;
        case 'victory36':
          result = await this.activateVictory36(llp_member_email);
          break;
        default:
          result = { success: false, error: 'unknown_feature' };
        }
        activationResults[feature] = result;
      } catch (error) {
        activationResults[feature] = { 
          success: false, 
          error: error.message 
        };
      }
    }

    return Response.json({
      success: true,
      activation_results: activationResults
    });
  }

  /**
   * Activate Elite11 workflows via OAuth2
   */
  async activateElite11(llpMemberEmail) {
    // This would make OAuth2-authenticated calls to your MOCOA services
    const accessToken = await this.getServiceAccessToken('mocoa_gateway');
    
    const response = await fetch(`${this.services.mocoa_gateway}/api/elite11/activate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        llp_member: llpMemberEmail,
        feature: 'elite11',
        workflows: ['strategic_oversight', 'macro_coordination', 'enterprise_management'],
        wing_access: 'squadron_4_elite_11'
      })
    });

    const data = await response.json();
    return {
      success: response.ok,
      data: data
    };
  }

  /**
   * Activate Mastery33 workflows via OAuth2
   */
  async activateMastery33(llpMemberEmail) {
    const accessToken = await this.getServiceAccessToken('mocoa_gateway');
    
    const response = await fetch(`${this.services.mocoa_gateway}/api/mastery33/activate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        llp_member: llpMemberEmail,
        feature: 'mastery33',
        workflows: ['operational_mastery', 'wing_coordination', 'deployment_management'],
        wing_access: 'wings_1_2_3_mastery_33'
      })
    });

    const data = await response.json();
    return {
      success: response.ok,
      data: data
    };
  }

  /**
   * Activate Victory36 workflows via OAuth2
   */
  async activateVictory36(llpMemberEmail) {
    const accessToken = await this.getServiceAccessToken('victory36');
    
    const response = await fetch(`${this.services.victory36}/api/activate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        llp_member: llpMemberEmail,
        feature: 'victory36',
        workflows: ['protective_shields', 'prediction_engine', 'coordination_protocols'],
        squadron: 'wing_4_victory36',
        experience: '3240_years'
      })
    });

    const data = await response.json();
    return {
      success: response.ok,
      data: data
    };
  }

  /**
   * Get current feature activation status
   */
  async getFeatureStatus(request) {
    const url = new URL(request.url);
    const llpMemberEmail = url.searchParams.get('member');

    const status = {
      elite11: await this.checkFeatureStatus('elite11', llpMemberEmail),
      mastery33: await this.checkFeatureStatus('mastery33', llpMemberEmail),
      victory36: await this.checkFeatureStatus('victory36', llpMemberEmail),
      integration_gateway: await this.checkMOCOAStatus(),
      sallyport_auth: await this.checkSallyPortStatus()
    };

    return Response.json({
      success: true,
      feature_status: status,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Check individual feature status via OAuth2
   */
  async checkFeatureStatus(feature, llpMemberEmail) {
    try {
      const service = feature === 'victory36' ? 'victory36' : 'mocoa_gateway';
      const accessToken = await this.getServiceAccessToken(service);
      
      const response = await fetch(`${this.services[service]}/api/${feature}/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'X-LLP-Member': llpMemberEmail
        }
      });

      if (response.ok) {
        const data = await response.json();
        return {
          active: data.active || false,
          workflows: data.workflows || [],
          last_activated: data.last_activated,
          access_level: data.access_level
        };
      } else {
        return {
          active: false,
          error: 'service_unavailable'
        };
      }
    } catch (error) {
      return {
        active: false,
        error: error.message
      };
    }
  }

  /**
   * Get service access token (using client credentials flow)
   * FIXED: Properly resolve promises to prevent "object promise" responses
   */
  async getServiceAccessToken(service) {
    const config = this.oauth2Config[service];
    
    // Check if we have a cached token
    // In production, implement proper token caching with KV storage
    
    try {
      const tokenRequest = new Request(config.token_endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${btoa(`${config.client_id}:${config.client_secret}`)}`
        },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          scope: config.scopes.join(' ')
        })
      });

      const response = await fetch(tokenRequest);
      
      // FIXED: Properly resolve the response promise
      const data = await safeResolve(response.json());

      if (response.ok) {
        // FIXED: Ensure we return a resolved value, not a promise
        const accessToken = await safeResolve(data.access_token);
        return accessToken;
      } else {
        throw new Error(`Token request failed: ${data.error}`);
      }
    } catch (error) {
      console.error(`[OAuth2CloudConnector] Token request failed for ${service}:`, error.message);
      throw new Error(`OAuth2 token request failed: ${error.message}`);
    }
  }

  /**
   * Check MOCOA Integration Gateway status
   */
  async checkMOCOAStatus() {
    try {
      const response = await fetch(`${this.services.mocoa_gateway}/health`);
      const data = await response.json();
      
      return {
        active: response.ok,
        service: 'MOCOA Integration Gateway',
        status: data.status,
        agents: data.total_agents || 'unknown'
      };
    } catch (error) {
      return {
        active: false,
        error: 'connection_failed'
      };
    }
  }

  /**
   * Check SallyPort authentication status
   */
  async checkSallyPortStatus() {
    try {
      const response = await fetch(`${this.services.sallyport}/health`);
      const data = await response.json();
      
      return {
        active: response.ok,
        service: 'SallyPort Authentication',
        status: data.status
      };
    } catch (error) {
      return {
        active: false,
        error: 'connection_failed'
      };
    }
  }

  /**
   * Get available features for authenticated service
   */
  async getAvailableFeatures(service, accessToken) {
    try {
      const response = await fetch(`${this.services[service]}/api/features`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.features || [];
      }
      return [];
    } catch (error) {
      return [];
    }
  }

  /**
   * Generate secure state parameter for OAuth2
   */
  generateSecureState() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }
}
