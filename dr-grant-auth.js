/**
 * Dr. Grant Authentication Function - Immediate Access
 */
const functions = require('@google-cloud/functions-framework');

// Register the HTTP function
functions.http('drGrantAuth', (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  // Demo mode - immediate access
  if (process.env.DEMO_MODE === 'true' || req.query.demo === 'true') {
    return res.json({
      success: true,
      token: 'demo-token-' + Date.now(),
      user: {
        email: 'pr@coaching2100.com',
        role: 'Diamond SAO',
        permissions: ['all'],
        uid: 'demo-user-' + Date.now()
      },
      redirectUrl: 'https://asoos.2100.cool/dashboard',
      message: 'Demo access granted'
    });
  }

  // Handle authentication requests
  if (req.method === 'POST') {
    const { email, password } = req.body || {};
    
    // Basic authentication for immediate access
    if (email && (email.includes('pr@') || email.includes('coaching2100'))) {
      return res.json({
        success: true,
        token: 'auth-token-' + Date.now(),
        user: {
          email: email,
          role: 'Diamond SAO',
          permissions: ['all'],
          uid: 'user-' + Date.now()
        },
        redirectUrl: 'https://asoos.2100.cool/dashboard'
      });
    }
  }

  // Default response for GET requests
  res.json({
    service: 'Dr. Grant Authentication',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      login: 'POST /',
      demo: 'GET /?demo=true'
    }
  });
});

module.exports = { drGrantAuth };
