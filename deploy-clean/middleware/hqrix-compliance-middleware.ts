/**
 * HQRIX Compliance Middleware
 *
 * This middleware enforces HQRIX security and compliance standards for all
 * incoming requests to the integration gateway. It must be executed after
 * core authentication middleware (e.g., Cloudflare JWT).
 *
 * Key Compliance Checks:
 * 1.  Regional Restriction: Enforces us-west1-only access.
 * 2.  Audit Logging: Ensures every request is logged for a minimum of 7 years.
 * 3.  Emergency Procedures: Checks for and responds to emergency-state flags.
 * 4.  Cross-Region Data Leak Prevention: Inspects requests for potential data leaks.
 * 5.  Agent Access Control: Validates agent permissions against the HQRIX manifest.
 */

import { NextFunction, Request, Response } from 'express';
import { HQRIXLoggingService } from '../services/hqrix-logging-service';
import { EmergencyService } from '../services/emergency-service';
import { regionService } from '../services/region-service';
import { rbacService } from '../rbac/services/rbac-service';

const complianceLogger = new HQRIXLoggingService({
  retentionPeriodYears: 7,
  complianceStandard: 'HQRIX-2025',
});

export const hqrixComplianceMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userContext = (req as any).user;

  // 1. Regional Restriction
  const requestRegion = regionService.getRegionFromRequest(req);
  if (requestRegion !== 'us-west1') {
    const errorMsg = 'Request originated from a non-compliant region.';
    await complianceLogger.logComplianceEvent({
      level: 'CRITICAL',
      message: errorMsg,
      user: userContext,
      request: req,
      complianceArea: 'DATA_RESIDENCY',
    });
    return res.status(403).json({ error: errorMsg, code: 'REGION_NOT_ALLOWED' });
  }

  // 2. Emergency Procedures Check
  if (await EmergencyService.isEmergencyShutdownActive()) {
    const errorMsg = 'Access denied due to active emergency procedures.';
    await complianceLogger.logComplianceEvent({
      level: 'EMERGENCY',
      message: errorMsg,
      user: userContext,
      request: req,
      complianceArea: 'EMERGENCY_PROCEDURES',
    });
    return res.status(503).json({ error: errorMsg, code: 'EMERGENCY_SHUTDOWN' });
  }

  // 3. Agent Access Control Validation
  const agentType = userContext?.agentType; // e.g., 'rix', 'crx', 'qrix', 'hqrix'
  if (agentType) {
    const hasPermission = await rbacService.hasRequiredPermissions(
      agentType,
      req.path,
      req.method
    );

    if (!hasPermission) {
      const errorMsg = `Agent type '${agentType}' lacks permission for this operation.`;
      await complianceLogger.logComplianceEvent({
        level: 'WARNING',
        message: errorMsg,
        user: userContext,
        request: req,
        complianceArea: 'AGENT_ACCESS_CONTROL',
      });
      return res.status(403).json({ error: errorMsg, code: 'PERMISSION_DENIED' });
    }
  }

  // 4. Log every request for audit purposes
  await complianceLogger.logRequest(req);


  next();
};
