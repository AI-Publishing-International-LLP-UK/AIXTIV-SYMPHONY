/**
 * Example Agent Authentication Routes
 *
 * This file demonstrates how to use the agent authentication and batch operations
 * middleware to protect agent-to-agent and agent-to-API endpoints.
 */

const express = require('express');
const { agentAuthMiddleware, batchOperationsMiddleware } = require('../middleware');

const router = express.Router();

/**
 * Example route for agent-to-agent communication
 * Requires Cloudflare authentication and agent-only access
 */
router.post('/api/agents/communicate', agentAuthMiddleware, (req, res) => {
  const user = req.user;
  const impersonatedUser = req.impersonatedUser;
  const effectiveUser = impersonatedUser || user;

  res.json({
    message: 'Agent communication successful',
    agent: effectiveUser.id,
    squadron: effectiveUser.squadron,
    impersonated: !!impersonatedUser,
    originalAgent: impersonatedUser ? user.id : undefined,
  });
});

/**
 * Example route for agent API calls with impersonation
 * Demonstrates how impersonation works with special headers
 */
router.get('/api/agents/data/:agentId', agentAuthMiddleware, (req, res) => {
  const user = req.user;
  const impersonatedUser = req.impersonatedUser;
  const effectiveUser = impersonatedUser || user;
  const { agentId } = req.params;

  // Check if the agent is trying to access its own data or has permission to access others'
  if (effectiveUser.agentId !== agentId && effectiveUser.squadron !== 'elite_11' && effectiveUser.squadron !== 'mastery_33') {
    return res.status(403).json({
      error: 'Cannot access data for other agents without proper permissions',
      code: 'INSUFFICIENT_PERMISSIONS',
    });
  }

  res.json({
    agentId,
    data: `Data for agent ${agentId}`,
    accessedBy: effectiveUser.id,
    squadron: effectiveUser.squadron,
    impersonated: !!impersonatedUser,
  });
});

/**
 * Example batch operation route
 * Requires enhanced permissions for bulk operations
 */
router.post('/api/agents/batch/update', batchOperationsMiddleware, (req, res) => {
  const user = req.user;
  const impersonatedUser = req.impersonatedUser;
  const effectiveUser = impersonatedUser || user;
  const { agentIds, updateData } = req.body;

  if (!agentIds || !Array.isArray(agentIds)) {
    return res.status(400).json({
      error: 'Invalid batch update request',
      code: 'INVALID_REQUEST',
      message: 'agentIds must be an array',
    });
  }

  // Process batch update (mock implementation)
  const results = agentIds.map((agentId) => ({
    agentId,
    status: 'updated',
    updatedBy: effectiveUser.id,
  }));

  res.json({
    message: 'Batch update successful',
    updatedCount: agentIds.length,
    results,
    executedBy: effectiveUser.id,
    squadron: effectiveUser.squadron,
    impersonated: !!impersonatedUser,
  });
});

/**
 * Example Elite 11 exclusive route
 * Only accessible to Elite 11 squadron members
 */
router.get('/api/elite/strategic-overview', agentAuthMiddleware, (req, res) => {
  const user = req.user;
  const impersonatedUser = req.impersonatedUser;
  const effectiveUser = impersonatedUser || user;

  if (effectiveUser.squadron !== 'elite_11') {
    return res.status(403).json({
      error: 'Access denied: Elite 11 exclusive endpoint',
      code: 'ELITE_ONLY',
    });
  }

  res.json({
    message: 'Strategic overview data',
    squadron: 'elite_11',
    accessedBy: effectiveUser.id,
    level: 'macro_strategic',
    impersonated: !!impersonatedUser,
  });
});

/**
 * Example Mastery 33 exclusive route
 * Only accessible to Mastery 33 squadron members
 */
router.get('/api/mastery/operational-details', agentAuthMiddleware, (req, res) => {
  const user = req.user;
  const impersonatedUser = req.impersonatedUser;
  const effectiveUser = impersonatedUser || user;

  if (effectiveUser.squadron !== 'mastery_33') {
    return res.status(403).json({
      error: 'Access denied: Mastery 33 exclusive endpoint',
      code: 'MASTERY_ONLY',
    });
  }

  res.json({
    message: 'Operational details data',
    squadron: 'mastery_33',
    accessedBy: effectiveUser.id,
    level: 'operational_mastery',
    impersonated: !!impersonatedUser,
  });
});

module.exports = router;
