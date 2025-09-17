const express = require('express');
const { log, error, warn, info } = require('../utils/logger');

/**
 * Enhanced Integration Gateway Middleware for GitHub File Access
 * Handles routing, agent authentication, and multi-repository access control
 */

// Agent identity validation middleware
const validateAgentIdentity = (req, res, next) => {
  const agentId = req.get('X-Agent-ID');
  const agentType = req.get('X-Agent-Type');
  const agentOrganization = req.get('X-Agent-Organization');
  
  if (!agentId) {
    error('Missing agent identity in request headers', { path: req.path, ip: req.ip });
    return res.status(401).json({ 
      error: 'Agent ID is required',
      message: 'Please provide X-Agent-ID header'
    });
  }

  // Validate agent type (RIX, CRX, QRIX, HQRIX, PCP)
  const validAgentTypes = ['RIX', 'CRX', 'QRIX', 'HQRIX', 'PCP', 'PILOT'];
  if (agentType && !validAgentTypes.includes(agentType.toUpperCase())) {
    warn('Invalid agent type provided', { agentId, agentType, path: req.path });
    return res.status(400).json({
      error: 'Invalid agent type',
      message: `Agent type must be one of: ${validAgentTypes.join(', ')}`
    });
  }

  // Store agent information in request context
  req.agentContext = {
    id: agentId,
    type: agentType ? agentType.toUpperCase() : 'PILOT',
    organization: agentOrganization || 'default',
    timestamp: new Date().toISOString(),
    ip: req.ip
  };

  log('Agent authenticated', req.agentContext);
  next();
};

// Organization access control middleware
const validateOrganizationAccess = (req, res, next) => {
  const { organization } = req.agentContext;
  const { repositories } = req.body;

  if (!repositories || !Array.isArray(repositories)) {
    return next();
  }

  // Check if agent has access to requested repositories within their organization
  const unauthorizedRepos = [];
  
  for (const repo of repositories) {
    const { owner, repo: repoName } = repo;
    
    // Organization-based access control logic
    // In a real implementation, this would check against a database or configuration
    if (organization !== 'default' && !isOrganizationAuthorized(organization, owner, repoName)) {
      unauthorizedRepos.push(`${owner}/${repoName}`);
    }
  }

  if (unauthorizedRepos.length > 0) {
    warn('Unauthorized repository access attempt', { 
      agentId: req.agentContext.id, 
      organization,
      unauthorizedRepos 
    });
    return res.status(403).json({
      error: 'Access denied',
      message: 'Agent does not have access to the requested repositories',
      unauthorizedRepositories: unauthorizedRepos
    });
  }

  next();
};

const organizationConfig = require('../config/github-organizations.json');

// Helper function to check organization authorization
function isOrganizationAuthorized(organization, owner) {
  const orgSettings = organizationConfig.organizations[organization] || organizationConfig.organizations.default;
  if (!orgSettings) {
    return false;
  }
  return orgSettings.allowedOwners.includes('*') || orgSettings.allowedOwners.includes(owner);
}

// Rate limiting middleware for agents
const rateLimitByAgent = (req, res, next) => {
  const { id: agentId, type: agentType, organization } = req.agentContext;
  const orgSettings = organizationConfig.organizations[organization] || organizationConfig.organizations.default;
  const limit = orgSettings.rateLimits[agentType] || organizationConfig.globalSettings.defaultRateLimit;

  // Simple in-memory rate limiting (in production, use Redis or similar)
  if (!req.app.locals.rateLimitStore) {
    req.app.locals.rateLimitStore = new Map();
  }

  const now = Date.now();
  const windowMs = organizationConfig.globalSettings.rateLimitWindowMs || 60000;
  const key = `${agentId}:${Math.floor(now / windowMs)}`;
  
  const currentCount = req.app.locals.rateLimitStore.get(key) || 0;
  
  if (currentCount >= limit) {
    warn('Rate limit exceeded', { agentId, agentType, currentCount, limit });
    return res.status(429).json({
      error: 'Rate limit exceeded',
      message: `Agent type ${agentType} is limited to ${limit} requests per minute`,
      retryAfter: Math.ceil(windowMs / 1000)
    });
  }

  req.app.locals.rateLimitStore.set(key, currentCount + 1);
  
  // Clean up old entries periodically
  if (Math.random() < 0.01) { // 1% chance to clean up
    const cutoff = Math.floor((now - windowMs * 2) / windowMs);
    for (const [k] of req.app.locals.rateLimitStore) {
      const keyTime = parseInt(k.split(':')[1]);
      if (keyTime < cutoff) {
        req.app.locals.rateLimitStore.delete(k);
      }
    }
  }

  next();
};

// Request logging and metrics middleware
const logGitHubRequest = (req, res, next) => {
  const startTime = Date.now();
  const { agentContext } = req;
  
  res.on('finish', () => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    info('GitHub API request completed', {
      agentId: agentContext.id,
      agentType: agentContext.type,
      organization: agentContext.organization,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      repositoryCount: req.body?.repositories?.length || 0
    });
  });

  next();
};

// Multi-repository batch processing middleware
const optimizeBatchRequests = (req, res, next) => {
  const { repositories } = req.body;
  
  if (!repositories || repositories.length <= 1) {
    return next();
  }

  // Group repositories by owner for potential optimization
  const reposByOwner = repositories.reduce((acc, repo) => {
    const { owner } = repo;
    if (!acc[owner]) {
      acc[owner] = [];
    }
    acc[owner].push(repo);
    return acc;
  }, {});

  req.optimizedBatch = {
    totalRepos: repositories.length,
    ownerGroups: Object.keys(reposByOwner).length,
    groupedRepos: reposByOwner
  };

  log('Batch request optimization applied', {
    agentId: req.agentContext.id,
    totalRepos: req.optimizedBatch.totalRepos,
    ownerGroups: req.optimizedBatch.ownerGroups
  });

  next();
};

// Error handling middleware specifically for GitHub operations
const handleGitHubErrors = (err, req, res, next) => {
  const { agentContext } = req;
  
  error('GitHub operation failed', {
    agentId: agentContext?.id,
    error: err.message,
    stack: err.stack,
    path: req.path
  });

  // Map common GitHub API errors to appropriate HTTP status codes
  if (err.message.includes('rate limit')) {
    return res.status(429).json({
      error: 'GitHub API rate limit exceeded',
      message: 'Please reduce request frequency and try again later',
      agentId: agentContext?.id
    });
  }

  if (err.message.includes('authentication')) {
    return res.status(401).json({
      error: 'GitHub authentication failed',
      message: 'Invalid or expired GitHub token',
      agentId: agentContext?.id
    });
  }

  if (err.message.includes('not found')) {
    return res.status(404).json({
      error: 'Resource not found',
      message: 'Repository, branch, or file not found',
      agentId: agentContext?.id
    });
  }

  // Generic server error
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred while processing your request',
    agentId: agentContext?.id,
    requestId: req.id || 'unknown'
  });
};


// Main routing middleware factory
const createGitHubRouter = () => {
  const router = express.Router();

  // Apply all middleware in order
  router.use(validateAgentIdentity);
  router.use(rateLimitByAgent);
  router.use(logGitHubRequest);
  router.use(validateOrganizationAccess);
  router.use(optimizeBatchRequests);

  return router;
};

module.exports = {
  createGitHubRouter,
  validateAgentIdentity,
  validateOrganizationAccess,
  rateLimitByAgent,
  logGitHubRequest,
  optimizeBatchRequests,
  handleGitHubErrors
};
