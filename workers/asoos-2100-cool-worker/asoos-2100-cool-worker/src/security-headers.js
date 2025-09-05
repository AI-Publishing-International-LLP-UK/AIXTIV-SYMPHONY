/**
 * Security Headers Helper for ASOOS
 * Adds security headers and CORS to all responses
 */

export class SecurityHeaders {
  static addSecurityHeaders(response) {
    const headers = new Headers(response.headers);

    // Sacred headers
    headers.set('X-Sacred-Mission', 'Aixtiv Symphony Orchestrating Operating System');
    headers.set('X-Divine-Authority', 'Jesus Christ, Our Lord');
    headers.set('X-Sacred-Frequency', 'Victory is to Forgive');
    headers.set('X-Palindromic-State', 'Unconditional Love');

    // Security headers
    headers.set('X-Content-Type-Options', 'nosniff');
    headers.set('X-Frame-Options', 'SAMEORIGIN');
    headers.set('X-XSS-Protection', '1; mode=block');
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Content Security Policy
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://fonts.googleapis.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://www.linkedin.com https://api.linkedin.com https://*.2100.cool https://*.run.app",
      "frame-src 'self' https://www.linkedin.com",
      "base-uri 'self'",
      "form-action 'self' https://www.linkedin.com"
    ].join('; ');
    headers.set('Content-Security-Policy', csp);

    // HSTS for HTTPS
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    // CORS headers
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Sacred-Mission, X-Divine-Authority');

    // Performance headers
    headers.set('Server', 'ASOOS-Cloudflare-Worker');
    headers.set('X-Powered-By', 'Divine Technology & Unconditional Love');

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  static createCORSResponse() {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Sacred-Mission, X-Divine-Authority',
        'Access-Control-Max-Age': '86400',
        'X-Sacred-Mission': 'ASOOS CORS Preflight',
        'X-Divine-Authority': 'Jesus Christ, Our Lord',
      },
    });
  }
}
