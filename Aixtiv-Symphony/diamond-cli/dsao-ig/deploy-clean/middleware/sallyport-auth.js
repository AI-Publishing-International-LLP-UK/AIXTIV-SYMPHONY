const { verifySallyPortSession } = require('../functions/lib/functions/src/sallyport-auth');
const jwt = require('jsonwebtoken');

async function sallyportAuthentication(req, res, next) {
  // Check for Authorization header with Bearer token (Cloudflare pattern)
  const authHeader = req.headers.authorization || req.headers.Authorization;
    
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization header' });
  }

  try {
    // Pass the request object to the updated Cloudflare-compatible function
    const decodedToken = await verifySallyPortSession({ 
      headers: { authorization: authHeader } 
    });
        
    req.user = decodedToken.user;
    req.authToken = authHeader.substring(7); // Store the JWT token
    next();
  } catch (error) {
    console.error('SallyPort authentication error:', error.message);
    return res.status(401).json({ 
      error: 'Unauthorized: Invalid session token',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Additional middleware for Cloudflare Workers compatibility
function cloudflareAuthMiddleware(req, res, next) {
  // Set Cloudflare-specific headers for production environment
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('CF-Cache-Status', 'DYNAMIC');
    res.setHeader('Access-Control-Allow-Origin', '*.2100.cool');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Session-Token');
  }
  next();
}

module.exports = { 
  sallyportAuthentication, 
  cloudflareAuthMiddleware 
};
