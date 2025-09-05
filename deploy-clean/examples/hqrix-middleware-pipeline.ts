/**
 * HQRIX Middleware Pipeline Example
 *
 * This example demonstrates how to set up a complete middleware pipeline
 * that ensures HQRIX compliance for all API requests.
 */

import express from 'express';
import {
  cloudflareJwtMiddleware,
  agentAuthMiddleware,
  hqrixComplianceMiddleware
} from '../middleware';

const app = express();

// 1. Basic request parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 2. Cloudflare JWT authentication (required first)
app.use(cloudflareJwtMiddleware);

// 3. Agent-specific authentication and impersonation
app.use(agentAuthMiddleware);

// 4. HQRIX compliance enforcement (critical - must be after authentication)
app.use(hqrixComplianceMiddleware);

// Example protected route
app.get('/api/wake-vision/dataset', (req, res) => {
  const userContext = (req as any).user;
  
  res.json({
    message: 'Dataset access granted',
    agentType: userContext?.agentType,
    complianceStatus: 'HQRIX-COMPLIANT',
    timestamp: new Date().toISOString(),
  });
});

// Example admin-only route (HQRIX agents only)
app.post('/api/admin/emergency-shutdown', (req, res) => {
  const userContext = (req as any).user;
  
  if (userContext?.agentType !== 'hqrix') {
    return res.status(403).json({
      error: 'Admin access required',
      code: 'HQRIX_ADMIN_REQUIRED'
    });
  }

  res.json({
    message: 'Emergency shutdown initiated',
    initiatedBy: userContext.agentType,
    timestamp: new Date().toISOString(),
  });
});

// Example training route (CRX, QRIX, HQRIX agents only)
app.post('/api/training/start', (req, res) => {
  const userContext = (req as any).user;
  const allowedAgents = ['crx', 'qrix', 'hqrix'];
  
  if (!allowedAgents.includes(userContext?.agentType)) {
    return res.status(403).json({
      error: 'Training access denied',
      code: 'TRAINING_PERMISSION_REQUIRED'
    });
  }

  res.json({
    message: 'Training session started',
    agentType: userContext.agentType,
    sessionId: `train_${Date.now()}`,
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint (bypasses most middleware)
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    compliance: 'HQRIX-2025',
    region: 'us-west1',
    timestamp: new Date().toISOString(),
  });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('HQRIX Middleware Pipeline Error:', err);
  
  res.status(err.status || 500).json({
    error: 'Internal server error',
    code: 'HQRIX_PIPELINE_ERROR',
    timestamp: new Date().toISOString(),
  });
});

export default app;

/**
 * Example Usage Instructions:
 * 
 * 1. Start the server:
 *    ```typescript
 *    import app from './hqrix-middleware-pipeline';
 *    app.listen(3000, () => console.log('HQRIX-compliant server running on port 3000'));
 *    ```
 * 
 * 2. Test with a valid JWT token:
 *    ```bash
 *    curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
 *         -H "X-Region: us-west1" \
 *         http://localhost:3000/api/wake-vision/dataset
 *    ```
 * 
 * 3. Test emergency shutdown (HQRIX agents only):
 *    ```bash
 *    curl -X POST \
 *         -H "Authorization: Bearer HQRIX_AGENT_TOKEN" \
 *         -H "X-Region: us-west1" \
 *         http://localhost:3000/api/admin/emergency-shutdown
 *    ```
 * 
 * The middleware pipeline ensures:
 * - All requests are authenticated via Cloudflare JWT
 * - Agent identity is verified and permissions are checked
 * - Regional compliance is enforced (us-west1 only)
 * - All requests are logged for audit purposes (7-year retention)
 * - Emergency shutdown procedures are respected
 * - Cross-region data leaks are prevented
 */
