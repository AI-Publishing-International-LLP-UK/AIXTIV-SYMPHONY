/**
 * Demo/Bypass Middleware for Investor Presentations - Production Ready
 * © 2025 AI Publishing International LLP
 * 
 * This middleware provides controlled bypass of authentication for demo purposes
 * with query parameter support (?mode=demo&bypass=1) for easy investor sharing.
 */

import { NextFunction, Request, Response } from 'express';
import { NextRequest, NextResponse } from 'next/server';

// Production configuration
const DEMO_CONFIG = {
  enabled: true, // Always enabled in production
  queryParams: {
    mode: ['demo', 'investor', 'presentation'],
    bypass: ['1', 'true', 'on']
  },
  paths: {
    demo: ['/demo', '/api/demo', '/investor', '/presentation', '/dashboard'],
    public: ['/public', '/api/public', '/health', '/status']
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 200
  }
};

// Simple in-memory rate limiting
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Check if request has valid demo bypass parameters
 */
function hasDemoBypass(req: Request | NextRequest): boolean {
  const url = new URL(req.url, `http://${req.headers.get?.('host') || (req as any).get?.('host') || 'localhost'}`);
  const query = url.searchParams;
  
  // Check for ?mode=demo or similar
  const mode = query.get('mode');
  if (mode && DEMO_CONFIG.queryParams.mode.includes(mode.toLowerCase())) {
    return true;
  }
  
  // Check for ?bypass=1 or similar
  const bypass = query.get('bypass');
  if (bypass && DEMO_CONFIG.queryParams.bypass.includes(bypass.toLowerCase())) {
    return true;
  }
  
  return false;
}

/**
 * Check if path is demo-accessible
 */
function isDemoPath(pathname: string): boolean {
  return [...DEMO_CONFIG.paths.demo, ...DEMO_CONFIG.paths.public].some(path => 
    pathname === path || pathname.startsWith(path + '/')
  );
}

/**
 * Rate limiting check
 */
function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(clientId);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(clientId, {
      count: 1,
      resetTime: now + DEMO_CONFIG.rateLimit.windowMs
    });
    return true;
  }
  
  if (record.count >= DEMO_CONFIG.rateLimit.maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}

/**
 * Express middleware for demo bypass
 */
export const demoBypassMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Check if demo mode is enabled
    if (!DEMO_CONFIG.enabled) {
      return next();
    }
    
    // Check for demo bypass parameters or demo paths
    const hasBypass = hasDemoBypass(req);
    const isDemo = isDemoPath(req.path);
    
    if (!hasBypass && !isDemo) {
      return next();
    }
    
    // Rate limiting
    const clientId = req.ip || req.connection?.remoteAddress || 'unknown';
    if (!checkRateLimit(clientId)) {
      return res.status(429).json({
        error: 'Too many demo requests',
        code: 'DEMO_RATE_LIMITED',
        message: 'Please wait before making more demo requests'
      });
    }
    
    // Grant demo access
    (req as any).user = {
      id: 'demo-user-' + Date.now(),
      email: 'demo@aixtiv.com',
      roles: ['demo_user', 'investor', 'viewer'],
      userType: { name: 'Demo User', level: 1 },
      authLevel: 1,
      authProvider: 'DEMO_BYPASS',
      isDemoUser: true,
      permissions: ['read', 'view_dashboard', 'view_analytics'],
      demoAccess: true
    };
    
    // Add demo headers
    res.setHeader('X-Demo-Mode', 'true');
    res.setHeader('X-Auth-Bypass', 'demo');
    res.setHeader('X-Access-Level', 'demo-read-only');
    
    console.log(`✅ Demo access granted: ${req.method} ${req.path} from ${clientId}`);
    next();
    
  } catch (error) {
    console.error('Demo bypass error:', error);
    next(); // Continue with normal auth on error
  }
};

/**
 * Cloudflare Worker demo bypass
 */
export const cloudflareWorkerDemoBypass = async (request: Request): Promise<Response | null> => {
  try {
    if (!DEMO_CONFIG.enabled) {
      return null;
    }
    
    const url = new URL(request.url);
    const hasBypass = hasDemoBypass(request);
    const isDemo = isDemoPath(url.pathname);
    
    if (!hasBypass && !isDemo) {
      return null;
    }
    
    // Rate limiting
    const clientId = request.headers.get('cf-connecting-ip') || 
                    request.headers.get('x-forwarded-for') || 
                    'unknown';
    
    if (!checkRateLimit(clientId)) {
      return new Response(
        JSON.stringify({
          error: 'Too many demo requests',
          code: 'DEMO_RATE_LIMITED'
        }),
        {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Attach demo context
    (request as any).user = {
      id: 'demo-user-' + Date.now(),
      email: 'demo@aixtiv.com',
      roles: ['demo_user', 'investor', 'viewer'],
      userType: { name: 'Demo User', level: 1 },
      authLevel: 1,
      authProvider: 'DEMO_BYPASS',
      isDemoUser: true,
      demoAccess: true
    };
    
    console.log(`✅ Demo access granted: ${request.method} ${url.pathname} from ${clientId}`);
    return null; // Continue processing
    
  } catch (error) {
    console.error('Worker demo bypass error:', error);
    return null;
  }
};

/**
 * Next.js middleware for demo bypass
 */
export const nextJsDemoBypass = async (request: NextRequest) => {
  try {
    if (!DEMO_CONFIG.enabled) {
      return NextResponse.next();
    }
    
    const url = new URL(request.url);
    const hasBypass = hasDemoBypass(request);
    const isDemo = isDemoPath(url.pathname);
    
    if (!hasBypass && !isDemo) {
      return NextResponse.next();
    }
    
    // Rate limiting
    const clientId = request.headers.get('x-forwarded-for') || 
                    request.headers.get('x-real-ip') || 
                    'unknown';
    
    if (!checkRateLimit(clientId)) {
      return NextResponse.json(
        { error: 'Too many demo requests', code: 'DEMO_RATE_LIMITED' },
        { status: 429 }
      );
    }
    
    // Create response with demo context
    const response = NextResponse.next();
    
    response.headers.set('X-Demo-Mode', 'true');
    response.headers.set('X-Auth-Bypass', 'demo');
    response.headers.set('x-user-context', JSON.stringify({
      id: 'demo-user-' + Date.now(),
      email: 'demo@aixtiv.com',
      roles: ['demo_user', 'investor', 'viewer'],
      userType: { name: 'Demo User', level: 1 },
      authLevel: 1,
      authProvider: 'DEMO_BYPASS',
      isDemoUser: true,
      demoAccess: true
    }));
    
    console.log(`✅ Demo access granted: ${request.method} ${url.pathname} from ${clientId}`);
    return response;
    
  } catch (error) {
    console.error('Next.js demo bypass error:', error);
    return NextResponse.next();
  }
};

/**
 * Get demo access URL with bypass parameters
 */
export const generateDemoUrl = (baseUrl: string, path: string = '/demo'): string => {
  const url = new URL(path, baseUrl);
  url.searchParams.set('mode', 'demo');
  url.searchParams.set('bypass', '1');
  return url.toString();
};

/**
 * Demo mode status endpoint
 */
export const getDemoStatus = () => {
  return {
    enabled: DEMO_CONFIG.enabled,
    environment: process.env.NODE_ENV,
    paths: DEMO_CONFIG.paths,
    queryParams: DEMO_CONFIG.queryParams,
    activeConnections: rateLimitStore.size,
    rateLimit: DEMO_CONFIG.rateLimit
  };
};

/**
 * Clear rate limiting data
 */
export const clearDemoCache = () => {
  rateLimitStore.clear();
  console.log('Demo cache cleared');
};
