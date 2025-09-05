/**
 * HQRIX Compliance Configuration
 *
 * This configuration file defines all HQRIX compliance settings,
 * including regional restrictions, audit logging, and agent access controls.
 */

export interface HQRIXConfig {
  compliance: {
    standard: string;
    version: string;
    auditRetentionYears: number;
  };
  regional: {
    allowedRegions: string[];
    primaryRegion: string;
    crossRegionDataTransferAllowed: boolean;
  };
  logging: {
    auditLogBucket: string;
    complianceLogTable: string;
    realTimeAlerting: boolean;
  };
  emergency: {
    emergencyBucket: string;
    emergencyStateFile: string;
  };
  agents: {
    serviceAccounts: Record<string, {
      fullName: string;
      permissions: string[];
      agentCount: number;
      roles: string[];
    }>;
  };
}

export const HQRIX_CONFIG: HQRIXConfig = {
  compliance: {
    standard: 'HQRIX-2025',
    version: '1.0.0',
    auditRetentionYears: 7,
  },
  regional: {
    allowedRegions: ['us-west1'],
    primaryRegion: 'us-west1',
    crossRegionDataTransferAllowed: false,
  },
  logging: {
    auditLogBucket: 'asoos-hqrix-audit-logs-us-west1',
    complianceLogTable: 'hqrix_compliance_audit',
    realTimeAlerting: true,
  },
  emergency: {
    emergencyBucket: 'asoos-hqrix-quarantine-us-west1',
    emergencyStateFile: 'emergency-shutdown-state.json',
  },
  agents: {
    serviceAccounts: {
      'rix-agents': {
        fullName: 'rix-agents@api-for-warp-drive.iam.gserviceaccount.com',
        permissions: ['read', 'query', 'evaluate'],
        agentCount: 3096000,
        roles: [
          'roles/storage.objectViewer',
          'roles/pubsub.subscriber',
          'roles/firestore.reader'
        ],
      },
      'crx-agents': {
        fullName: 'crx-agents@api-for-warp-drive.iam.gserviceaccount.com',
        permissions: ['read', 'query', 'train'],
        agentCount: 4128000,
        roles: [
          'roles/storage.objectViewer',
          'roles/pubsub.subscriber',
          'roles/firestore.reader',
          'roles/ml.admin'
        ],
      },
      'qrix-agents': {
        fullName: 'qrix-agents@api-for-warp-drive.iam.gserviceaccount.com',
        permissions: ['read', 'query', 'train', 'evaluate', 'benchmark'],
        agentCount: 2064000,
        roles: [
          'roles/storage.objectViewer',
          'roles/pubsub.subscriber',
          'roles/firestore.reader',
          'roles/ml.admin',
          'roles/monitoring.viewer'
        ],
      },
      'hqrix-agents': {
        fullName: 'hqrix-agents@api-for-warp-drive.iam.gserviceaccount.com',
        permissions: ['full-access'],
        agentCount: 3032000,
        roles: [
          'roles/storage.admin',
          'roles/pubsub.admin',
          'roles/firestore.admin',
          'roles/ml.admin',
          'roles/monitoring.admin',
          'roles/iam.serviceAccountAdmin'
        ],
      },
    },
  },
};
