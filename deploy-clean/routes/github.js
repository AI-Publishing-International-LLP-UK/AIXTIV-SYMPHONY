
const express = require('express');
const router = express.Router();
const githubFileAccess = require('../services/github-file-access');
const { log, error } = require('../utils/logger');

// Middleware to check for agent identity
router.use((req, res, next) => {
  const agentId = req.get('X-Agent-ID');
  if (!agentId) {
    return res.status(401).json({ error: 'Agent ID not provided. Access denied.' });
  }
  // In a real application, you would validate the agentId against a database or authentication service
  log(`Request from agent: ${agentId}`);
  req.agentId = agentId;
  next();
});

/**
 * @swagger
 * /api/github/files:
 *   post:
 *     summary: Access files in a GitHub repository
 *     description: Allows authenticated agents to perform file operations (read, list, search) on one or more GitHub repositories.
 *     tags:
 *       - GitHub
 *     security:
 *       - AgentID: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - action
 *               - repositories
 *             properties:
 *               action:
 *                 type: string
 *                 description: The action to perform.
 *                 enum: [list, get, search]
 *               repositories:
 *                 type: array
 *                 description: A list of repositories to perform the action on.
 *                 items:
 *                   type: object
 *                   required:
 *                     - owner
 *                     - repo
 *                   properties:
 *                     owner:
 *                       type: string
 *                       description: The owner of the repository.
 *                     repo:
 *                       type: string
 *                       description: The name of the repository.
 *                     path:
 *                       type: string
 *                       description: The path to the file or directory (required for 'list' and 'get').
 *                     branch:
 *                       type: string
 *                       description: The branch to use.
 *                     query:
 *                       type: string
 *                       description: The search query (required for 'search').
 *     responses:
 *       '200':
 *         description: The result of the file operation.
 *       '400':
 *         description: Bad request, missing or invalid parameters.
 *       '401':
 *         description: Unauthorized, agent ID not provided.
 *       '500':
 *         description: Internal server error.
 */
router.post('/files', async (req, res) => {
  const { action, repositories } = req.body;

  if (!action || !Array.isArray(repositories) || repositories.length === 0) {
    return res.status(400).json({ error: 'Invalid request body. "action" and a non-empty "repositories" array are required.' });
  }

  const results = [];
  for (const repoInfo of repositories) {
    const { owner, repo, path, branch, query } = repoInfo;

    try {
      let result;
      switch (action) {
        case 'list':
          if (!path) {
            throw new Error('"path" is required for the "list" action.');
          }
          result = await githubFileAccess.listRepoContents(owner, repo, path, branch);
          break;
        case 'get':
          if (!path) {
            throw new Error('"path" is required for the "get" action.');
          }
          result = await githubFileAccess.getFile(owner, repo, path, branch);
          break;
        case 'search':
          if (!query) {
            throw new Error('"query" is required for the "search" action.');
          }
          result = await githubFileAccess.searchFiles(owner, repo, query);
          break;
        default:
          throw new Error(`Invalid action: ${action}`);
      }
      results.push({ repository: `${owner}/${repo}`, status: 'success', data: result });
    } catch (err) {
      error(`Failed to perform action "${action}" on repository ${owner}/${repo}`, { error: err.message, agentId: req.agentId });
      results.push({ repository: `${owner}/${repo}`, status: 'error', message: err.message });
    }
  }

  res.json(results);
});

module.exports = router;

