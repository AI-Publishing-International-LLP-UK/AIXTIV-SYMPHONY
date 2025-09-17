// OAuth2 Middleware and Routes for MOCOA
const { OAuth2Service } = require('./oauth2-service');

function setupOAuth2Routes(app) {
  const oauth2Service = new OAuth2Service();

  // Cleanup expired sessions every hour
  setInterval(() => {
    oauth2Service.cleanupExpiredSessions();
  }, 60 * 60 * 1000);

  // Authentication middleware
  const requireAuth = (req, res, next) => {
    const sessionId = req.cookies?.session_id || req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionId) {
      return res.status(401).json({
        error: 'Authentication required',
        login_url: '/auth/login'
      });
    }

    const session = oauth2Service.validateSession(sessionId);
    if (!session) {
      return res.status(401).json({
        error: 'Invalid or expired session',
        login_url: '/auth/login'
      });
    }

    req.user = session.user;
    req.userRole = session.role;
    req.session = session;
    next();
  };

  // Role-based authorization middleware
  const requireRole = (roles) => {
    return (req, res, next) => {
      if (!req.userRole || !roles.includes(req.userRole.role)) {
        return res.status(403).json({
          error: 'Insufficient permissions',
          required_roles: roles,
          current_role: req.userRole?.role || 'none'
        });
      }
      next();
    };
  };

  // Login page - shows OAuth options
  app.get('/auth/login', (req, res) => {
    const returnUrl = req.query.return || '/';
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>MOCOA Authentication</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
            color: white;
            margin: 0;
            padding: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .auth-container {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 20px;
            padding: 40px;
            max-width: 400px;
            width: 90%;
            text-align: center;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          }
          .logo {
            font-size: 32px;
            font-weight: 900;
            background: linear-gradient(135deg, #FFD700, #0bb1bb);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
          }
          .subtitle {
            color: #0bb1bb;
            font-size: 14px;
            margin-bottom: 30px;
          }
          .auth-btn {
            display: block;
            width: 100%;
            padding: 12px 20px;
            margin: 10px 0;
            background: rgba(255, 255, 255, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            color: white;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
          }
          .auth-btn:hover {
            background: rgba(11, 177, 187, 0.2);
            border-color: #0bb1bb;
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(11, 177, 187, 0.3);
          }
          .provider-icon {
            width: 20px;
            height: 20px;
          }
        </style>
      </head>
      <body>
        <div class="auth-container">
          <div class="logo">ASOOS</div>
          <div class="subtitle">Testament Swarm Authentication</div>
          
          <a href="/auth/google?return=${encodeURIComponent(returnUrl)}" class="auth-btn">
            <svg class="provider-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </a>
          
          <a href="/auth/microsoft?return=${encodeURIComponent(returnUrl)}" class="auth-btn">
            <svg class="provider-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
            </svg>
            Continue with Microsoft
          </a>
          
          <a href="/auth/github?return=${encodeURIComponent(returnUrl)}" class="auth-btn">
            <svg class="provider-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118.174 1.91 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            Continue with GitHub
          </a>
          
          <div style="margin-top: 30px; font-size: 12px; color: #888;">
            Secure authentication for Testament Swarm access
          </div>
        </div>
      </body>
      </html>
    `);
  });

  // OAuth2 initiation routes
  ['google', 'microsoft', 'github'].forEach(provider => {
    app.get(`/auth/${provider}`, (req, res) => {
      const state = oauth2Service.generateState();
      const returnUrl = req.query.return || '/';
      
      // Store state and return URL in session
      res.cookie('oauth_state', state, { maxAge: 10 * 60 * 1000, httpOnly: true }); // 10 minutes
      res.cookie('oauth_return', returnUrl, { maxAge: 10 * 60 * 1000, httpOnly: true });
      
      try {
        const authUrl = oauth2Service.generateAuthUrl(provider, state);
        res.redirect(authUrl);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // OAuth2 callback routes
    app.get(`/auth/${provider}/callback`, async (req, res) => {
      const { code, state, error } = req.query;
      const expectedState = req.cookies.oauth_state;
      const returnUrl = req.cookies.oauth_return || '/';

      // Clear OAuth cookies
      res.clearCookie('oauth_state');
      res.clearCookie('oauth_return');

      if (error) {
        return res.redirect(`/auth/login?error=${encodeURIComponent(error)}`);
      }

      if (!code || !state || state !== expectedState) {
        return res.redirect('/auth/login?error=invalid_request');
      }

      try {
        // Exchange code for token
        const tokenData = await oauth2Service.exchangeCodeForToken(provider, code);
        
        // Get user info
        const userInfo = await oauth2Service.getUserInfo(provider, tokenData.access_token);
        
        // Create session
        const session = oauth2Service.createSession(userInfo);
        
        // Set session cookie
        res.cookie('session_id', session.id, {
          maxAge: 24 * 60 * 60 * 1000, // 24 hours
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        });

        // Redirect to return URL
        res.redirect(returnUrl);
      } catch (error) {
        console.error(`OAuth2 ${provider} callback error:`, error);
        res.redirect(`/auth/login?error=${encodeURIComponent('Authentication failed')}`);
      }
    });
  });

  // Logout route
  app.post('/auth/logout', (req, res) => {
    const sessionId = req.cookies?.session_id;
    if (sessionId) {
      oauth2Service.revokeSession(sessionId);
      res.clearCookie('session_id');
    }
    res.json({ message: 'Logged out successfully' });
  });

  // User info route
  app.get('/auth/user', requireAuth, (req, res) => {
    res.json({
      user: req.user,
      role: req.userRole,
      session: {
        id: req.session.id,
        createdAt: req.session.createdAt,
        lastActivity: req.session.lastActivity,
        expires: req.session.expires
      }
    });
  });

  // Protected route example
  app.get('/auth/admin', requireAuth, requireRole(['admin', 'diamond-sao']), (req, res) => {
    res.json({
      message: 'Admin access granted',
      user: req.user,
      role: req.userRole
    });
  });

  return {
    oauth2Service,
    requireAuth,
    requireRole
  };
}

module.exports = { setupOAuth2Routes };
