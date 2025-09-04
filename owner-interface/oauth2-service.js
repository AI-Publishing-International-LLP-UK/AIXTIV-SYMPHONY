// OAuth2 Service for MOCOA - Multi-Provider Authentication
const crypto = require('crypto');

class OAuth2Service {
  constructor() {
    this.providers = {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret',
        redirectUri: process.env.GOOGLE_REDIRECT_URI || 'http://localhost:8080/auth/google/callback',
        authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
        scope: 'openid email profile'
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID || 'your-github-client-id',
        clientSecret: process.env.GITHUB_CLIENT_SECRET || 'your-github-client-secret',
        redirectUri: process.env.GITHUB_REDIRECT_URI || 'http://localhost:8080/auth/github/callback',
        authUrl: 'https://github.com/login/oauth/authorize',
        tokenUrl: 'https://github.com/login/oauth/access_token',
        userInfoUrl: 'https://api.github.com/user',
        scope: 'read:user user:email'
      },
      microsoft: {
        clientId: process.env.MICROSOFT_CLIENT_ID || 'your-microsoft-client-id',
        clientSecret: process.env.MICROSOFT_CLIENT_SECRET || 'your-microsoft-client-secret',
        redirectUri: process.env.MICROSOFT_REDIRECT_URI || 'http://localhost:8080/auth/microsoft/callback',
        authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        userInfoUrl: 'https://graph.microsoft.com/v1.0/me',
        scope: 'openid email profile User.Read'
      }
    };
    
    this.sessions = new Map();
    this.userRoles = new Map();
    this.initializeDefaultUsers();
  }

  initializeDefaultUsers() {
    // Initialize known users with their roles
    this.userRoles.set('phillip.roark@asoos.com', {
      role: 'diamond-sao',
      level: 'sovereign',
      permissions: ['all'],
      copilots: ['QB', 'SH', 'Q'],
      testament_access: true
    });
    
    this.userRoles.set('admin@asoos.com', {
      role: 'admin',
      level: 'enterprise',
      permissions: ['manage_tenants', 'view_all', 'configure'],
      copilots: ['QB', 'SH'],
      testament_access: true
    });
  }

  generateState() {
    return crypto.randomBytes(32).toString('hex');
  }

  generateAuthUrl(provider, state) {
    const config = this.providers[provider];
    if (!config) throw new Error(`Unsupported provider: ${provider}`);

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scope,
      response_type: 'code',
      state: state
    });

    // Provider-specific parameters
    if (provider === 'microsoft') {
      params.append('response_mode', 'query');
    }

    return `${config.authUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(provider, code) {
    const config = this.providers[provider];
    if (!config) throw new Error(`Unsupported provider: ${provider}`);

    const tokenData = {
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: code,
      redirect_uri: config.redirectUri,
      grant_type: 'authorization_code'
    };

    try {
      const response = await fetch(config.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        body: new URLSearchParams(tokenData)
      });

      if (!response.ok) {
        throw new Error(`Token exchange failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw new Error(`OAuth2 token exchange error: ${error.message}`);
    }
  }

  async getUserInfo(provider, accessToken) {
    const config = this.providers[provider];
    if (!config) throw new Error(`Unsupported provider: ${provider}`);

    try {
      const response = await fetch(config.userInfoUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`User info fetch failed: ${response.status}`);
      }

      const userInfo = await response.json();
      return this.normalizeUserInfo(provider, userInfo);
    } catch (error) {
      throw new Error(`OAuth2 user info error: ${error.message}`);
    }
  }

  normalizeUserInfo(provider, rawUserInfo) {
    let normalized = {
      id: '',
      email: '',
      name: '',
      avatar: '',
      provider: provider
    };

    switch (provider) {
      case 'google':
        normalized.id = rawUserInfo.id;
        normalized.email = rawUserInfo.email;
        normalized.name = rawUserInfo.name;
        normalized.avatar = rawUserInfo.picture;
        break;
      case 'github':
        normalized.id = rawUserInfo.id.toString();
        normalized.email = rawUserInfo.email;
        normalized.name = rawUserInfo.name || rawUserInfo.login;
        normalized.avatar = rawUserInfo.avatar_url;
        break;
      case 'microsoft':
        normalized.id = rawUserInfo.id;
        normalized.email = rawUserInfo.mail || rawUserInfo.userPrincipalName;
        normalized.name = rawUserInfo.displayName;
        normalized.avatar = ''; // Microsoft Graph doesn't provide avatar in basic profile
        break;
    }

    return normalized;
  }

  createSession(userInfo) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const userRole = this.userRoles.get(userInfo.email) || {
      role: 'user',
      level: 'individual',
      permissions: ['basic'],
      copilots: ['QB'],
      testament_access: false
    };

    const session = {
      id: sessionId,
      user: userInfo,
      role: userRole,
      createdAt: new Date(),
      lastActivity: new Date(),
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  validateSession(sessionId) {
    const session = this.sessions.get(sessionId);
    if (!session) return null;

    if (new Date() > session.expires) {
      this.sessions.delete(sessionId);
      return null;
    }

    // Update last activity
    session.lastActivity = new Date();
    return session;
  }

  revokeSession(sessionId) {
    return this.sessions.delete(sessionId);
  }

  getUserPermissions(email) {
    return this.userRoles.get(email) || {
      role: 'user',
      level: 'individual',
      permissions: ['basic'],
      copilots: ['QB'],
      testament_access: false
    };
  }

  // JWT-like token generation for stateless sessions
  generateJWT(payload) {
    const header = {
      alg: 'HS256',
      typ: 'JWT'
    };

    const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
    const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
    
    const secret = process.env.JWT_SECRET || 'asoos-mocoa-secret-key';
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }

  verifyJWT(token) {
    try {
      const [header, payload, signature] = token.split('.');
      const secret = process.env.JWT_SECRET || 'asoos-mocoa-secret-key';
      
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(`${header}.${payload}`)
        .digest('base64url');

      if (signature !== expectedSignature) {
        throw new Error('Invalid signature');
      }

      const decodedPayload = JSON.parse(Buffer.from(payload, 'base64url').toString());
      
      if (decodedPayload.exp && Date.now() >= decodedPayload.exp * 1000) {
        throw new Error('Token expired');
      }

      return decodedPayload;
    } catch (error) {
      throw new Error(`JWT verification failed: ${error.message}`);
    }
  }

  // Cleanup expired sessions
  cleanupExpiredSessions() {
    const now = new Date();
    for (const [sessionId, session] of this.sessions) {
      if (now > session.expires) {
        this.sessions.delete(sessionId);
      }
    }
  }
}

module.exports = { OAuth2Service };
