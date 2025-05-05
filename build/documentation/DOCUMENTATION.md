# Wing Rollback System Documentation

## 1. System Architecture Overview

The Wing Rollback System provides a robust and comprehensive solution for emergency recovery operations in the WING orchestration and workflow management system. It enables administrators to quickly restore system functionality in case of critical failures or data corruption events.

### Core Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   Wing Rollback System                       │
├─────────────┬─────────────┬────────────────┬────────────────┤
│ Backup      │ Restore     │ Health         │ Security &     │
│ Management  │ Operations  │ Monitoring     │ Authentication │
├─────────────┴─────────────┴────────────────┴────────────────┤
│                   Component Adapters                         │
├─────────────┬─────────────┬────────────────┬────────────────┤
│ VisionLake  │ Auth        │ Agent          │ Squadron       │
│ Backup      │ Backup      │ Backup         │ Backup         │
└─────────────┴─────────────┴────────────────┴────────────────┘
         │             │              │               │
         ▼             ▼              ▼               ▼
┌─────────────┬─────────────┬────────────────┬────────────────┐
│ VisionLake  │ Auth        │ Agent          │ Squadron       │
│ System      │ System      │ System         │ System         │
└─────────────┴─────────────┴────────────────┴────────────────┘
```

The system follows a modular design with the following key components:

1. **RollbackSystem** (main controller): Orchestrates the entire rollback process, manages component interactions, and provides the public API.

2. **BackupManager**: Handles scheduled backups, backup rotation, retention policies, and backup verification.

3. **Component-specific Adapters**: Specialized modules that understand how to back up and restore specific system components:
   - VisionLakeBackup
   - AuthBackup
   - AgentBackup
   - SquadronBackup

4. **HealthMonitor**: Continuously monitors system health, detects failures, and verifies system integrity after rollbacks.

## 2. Component Descriptions

### VisionLake Backup Component

VisionLake serves as the central memory and knowledge repository for all agents in the Wing system. The VisionLakeBackup component is responsible for:

- Creating consistent snapshots of the Vision Lake data store
- Supporting both full and incremental backups
- Compressing and optionally encrypting backup data
- Verifying data integrity during restoration
- Providing validation mechanisms for restored data

The VisionLake component has the highest restoration priority since it contains the core knowledge needed by other components.

### Auth Backup Component

The Auth component manages authentication sessions, user credentials, and access controls. The AuthBackup component handles:

- Secure backup of authentication tokens and session data
- Restoration of user sessions after rollback
- Preservation of emergency access credentials
- Token validation and security context verification
- Session state reconciliation to prevent unauthorized access

Auth restoration happens second in the sequence to ensure proper security context is available for subsequent operations.

### Agent Backup Component

Agents are the core operational units in the Wing system. The AgentBackup component manages:

- Agent state and configuration backups
- Agent memory and knowledge preservation
- Integration state with other systems
- Performance metrics and operational parameters
- Agent relationship mappings

Agent restoration occurs after VisionLake and Auth to ensure agents have access to both knowledge and security context.

### Squadron Backup Component

Squadrons represent organizational groupings of agents. The SquadronBackup component handles:

- Squadron composition and structure
- Mission assignments and task allocations
- Inter-squadron communication configurations
- Hierarchical relationships between squadrons
- Operational parameters and constraints

Squadron restoration happens last as it depends on the availability of individual agents.

## 3. Backup and Restore Flow Diagrams

### Backup Process Flow

```
┌──────────┐     ┌───────────────┐     ┌────────────────┐
│  Trigger │     │ BackupManager │     │ Component      │
│  Event   │────▶│ scheduleBackup│────▶│ createBackup() │
└──────────┘     └───────────────┘     └────────────────┘
                                               │
                                               ▼
┌──────────────┐     ┌───────────────┐     ┌────────────────┐
│  Store       │     │ Compress &    │     │ Generate       │
│  Metadata    │◀────│ Encrypt       │◀────│ Snapshot       │
└──────────────┘     └───────────────┘     └────────────────┘
       │
       ▼
┌──────────────┐     ┌───────────────┐
│  Verify      │────▶│ Apply         │
│  Backup      │     │ Retention     │
└──────────────┘     └───────────────┘
```

### Emergency Rollback Flow

```
┌──────────────┐     ┌───────────────┐     ┌────────────────┐
│  Admin       │     │ Authenticate  │     │ Find 24-hour   │
│  Request     │────▶│ Admin         │────▶│ Backup         │
└──────────────┘     └───────────────┘     └────────────────┘
                                                   │
                                                   ▼
┌──────────────┐     ┌───────────────┐     ┌────────────────┐
│  Restore     │     │ Stop          │     │ Pre-Rollback   │
│  Components  │◀────│ Services      │◀────│ Health Check   │
└──────────────┘     └───────────────┘     └────────────────┘
       │
       ▼
┌──────────────┐     ┌───────────────┐     ┌────────────────┐
│  Verify      │────▶│ Restart       │────▶│ Post-Rollback  │
│  Integrity   │     │ Services      │     │ Health Check   │
└──────────────┘     └───────────────┘     └────────────────┘
                                                   │
                                                   ▼
                                           ┌────────────────┐
                                           │ Recovery       │
                                           │ (if needed)    │
                                           └────────────────┘
```

### Component Restoration Sequence

```
┌──────────────┐
│  Start       │
│  Rollback    │
└──────────────┘
       │
       ▼
┌──────────────┐
│  Restore     │
│  VisionLake  │────┐
└──────────────┘    │
                    ▼
┌──────────────┐    │    ┌────────────────┐
│  Restore     │    │    │ Verify          │
│  Auth        │◀───┼────│ VisionLake     │
└──────────────┘    │    └────────────────┘
       │            │
       ▼            │
┌──────────────┐    │    ┌────────────────┐
│  Restore     │    │    │ Verify         │
│  Agents      │◀───┼────│ Auth           │
└──────────────┘    │    └────────────────┘
       │            │
       ▼            │
┌──────────────┐    │    ┌────────────────┐
│  Restore     │    │    │ Verify         │
│  Squadrons   │◀───┼────│ Agents         │
└──────────────┘    │    └────────────────┘
       │            │
       ▼            │
┌──────────────┐    │    ┌────────────────┐
│  Complete    │    └────│ Verify         │
│  Rollback    │         │ Squadrons      │
└──────────────┘         └────────────────┘
```

## 4. Security Considerations

The rollback system includes several key security measures:

### Authentication and Authorization

- **Admin-only access**: Emergency rollbacks can only be initiated by authenticated administrators with appropriate permissions
- **Two-factor authentication**: Critical rollback operations should require 2FA verification
- **Audit logging**: All rollback operations are comprehensively logged with timestamps, initiator details, and reasons
- **Session validation**: Authentication sessions are validated before and after rollback

### Data Protection

- **Encryption at rest**: Backup data is stored with encryption to protect sensitive information
- **Secure key management**: Encryption keys are managed securely with proper rotation
- **Access controls**: Backup files have strict filesystem permissions
- **Sanitization**: Sensitive data can be optionally filtered during backup

### Operational Security

- **Rate limiting**: Emergency operations are rate-limited to prevent abuse
- **Geographical restrictions**: Admin access can be restricted by IP or location
- **Recovery credentials**: Special emergency credentials are preserved during rollbacks
- **Secure recovery mode**: System can enter a limited-access recovery mode during rollbacks

## 5. How to Use the Emergency Rollback Feature

The emergency rollback feature allows administrators to restore the system to its state from approximately 24 hours ago. This is useful in situations where critical data is corrupted or when system malfunctions cannot be quickly resolved through standard procedures.

### Prerequisites

Before initiating an emergency rollback, ensure:

1. You have administrator credentials
2. You have communicated the planned rollback to all relevant stakeholders
3. You understand that data created or modified in the past 24 hours will be lost
4. You have documented the issue that necessitates the rollback

### Command Line Interface

To execute an emergency rollback via command line:

```bash
# Quick rollback to previous version
npm run rollback:quick

# Full rollback with data verification
npm run rollback:full

# Rollback with specific admin credentials
npm run rollback:emergency -- --username=admin --reason="Critical data corruption"
```

### Programmatic API

To execute an emergency rollback programmatically:

```typescript
import { RollbackSystem } from './wing/rollback';

// Initialize the rollback system
const rollbackSystem = new RollbackSystem();
await rollbackSystem.initialize();

// Execute emergency rollback
try {
  const result = await rollbackSystem.emergencyRollback(
    'admin',  // Admin username
    'secure-password',  // Admin password
    'Emergency rollback due to data inconsistency'  // Reason for rollback
  );
  
  if (result.success) {
    console.log(`Rollback ${result.rollbackId} completed successfully: ${result.message}`);
  } else {
    console.error(`Rollback failed: ${result.error}`);
  }
} catch (error) {
  console.error('Emergency rollback failed:', error.message);
}
```

### Web Admin Interface

The rollback system can also be accessed through the Wing Admin Portal:

1. Navigate to the Wing Admin Portal
2. Go to "System Management" → "Emergency Operations"
3. Select "24-Hour Emergency Rollback"
4. Enter your reason for the rollback
5. Confirm your administrator credentials
6. Review the warning about data loss
7. Click "Execute Emergency Rollback"

## 6. Common Troubleshooting Steps

### Component Verification Failures

If a component fails verification after rollback:

1. Check the rollback logs at `wing/logs/rollback-{ROLLBACK_ID}.log`
2. Run the component-specific health check:
   ```bash
   npm run health:check -- --component=vision-lake
   ```
3. Try to repair the component:
   ```bash
   npm run repair:component -- --component=vision-lake
   ```
4. If repair fails, try rolling back to an older backup:
   ```bash
   npm run rollback:custom -- --hours=48
   ```

### Authentication Issues After Rollback

If authentication sessions are invalidated:

1. Reset admin credentials:
   ```bash
   npm run auth:reset-admin
   ```
2. Restore auth service:
   ```bash
   npm run auth:restore
   ```
3. Clear auth caches:
   ```bash
   npm run auth:clear-cache
   ```

### Vision Lake Synchronization Errors

If Vision Lake fails to sync after rollback:

1. Check sync status:
   ```bash
   npm run vision-lake:status
   ```
2. Force resynchronization:
   ```bash
   npm run resync:vision-lake -- --force
   ```
3. Verify data integrity:
   ```bash
   npm run vision-lake:verify
   ```

### Agent Restoration Failures

If agents fail to restore properly:

1. Check agent initialization logs
2. Reset agent configurations:
   ```bash
   npm run agent:reset-config
   ```
3. Restart agent services:
   ```bash
   npm run agent:restart
   ```
4. Manually restore specific agents:
   ```bash
   npm run agent:restore -- --id=<agent-id>
   ```

### Recovery from Failed Rollback

If the rollback process itself fails:

1. Check the emergency recovery mode:
   ```bash
   npm run rollback:status
   ```
2. Attempt rollback cleanup:
   ```bash
   npm run rollback:cleanup
   ```
3. Force restart in safe mode:
   ```bash
   npm run system:safe-mode
   ```
4. Restore from alternative backup:
   ```bash
   npm run restore:alternative -- --backup-id=<id>
   ```

## 7. Integration with Other Wing Systems

The rollback system integrates with several other Wing components:

### Integration with Domain Management

- Domain Management is notified before and after rollbacks
- Domain configurations are synchronized after restoration
- Domain validation runs automatically after rollbacks

### Integration with Dream-Commander

- Dream-Commander initiatives are placed on hold during rollback
- Notifications are sent to initiative owners
- Initiative timelines are adjusted automatically

### Integration with Wish-Vision

- Analytics data is preserved but flagged as potentially affected
- Predictive models are re-verified after rollback
- Dashboards show rollback events in timeline views

### Integration with Agent Framework

- Agent states are properly preserved and restored
- Training data is protected during rollbacks
- Agent metrics are adjusted to account for rollback events

### Integration with Monitoring Systems

- System metrics during rollback are captured
- Alerts are automatically configured for post-rollback monitoring
- Performance baselines are adjusted after rollbacks

### Integration with Notification Systems

- Administrators receive progress notifications
- Users receive appropriate service notices
- System status pages are updated automatically

### Integration with Audit Systems

- All rollback operations are comprehensively logged
- Audit trails are maintained for regulatory compliance
- Rollback events are included in system reports

