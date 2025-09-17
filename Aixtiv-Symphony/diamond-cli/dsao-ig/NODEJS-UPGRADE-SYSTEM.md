# 🚀 Node.js Self-Monitoring Upgrade System

A comprehensive, automated system that monitors Node.js versions across your project and handles upgrades automatically to prevent future deployment failures.

## ✨ Features

- **🔍 Version Monitoring**: Automatically scans all project files for Node.js version specifications
- **📊 Compatibility Checking**: Validates dependencies against target Node.js versions
- **🤖 Automated Upgrades**: Creates PRs with version upgrades when new LTS is available
- **🩺 Health Monitoring**: Continuous deployment health checks with automatic rollbacks
- **📬 Notifications**: GitHub Issues and alerts for critical situations
- **🛡️ Rollback Protection**: Automatic rollback if upgrades cause failures

## 📁 System Components

### Scripts (`/scripts/`)
- **`nodejs-version-monitor.js`** - Core monitoring script that checks versions across the project
- **`dependency-compatibility-checker.js`** - Validates dependency compatibility before upgrades
- **`nodejs-upgrade-manager.js`** - Central management tool for all upgrade operations

### GitHub Workflows (`/.github/workflows/`)
- **`nodejs-auto-upgrade.yml`** - Automated upgrade workflow (runs weekly)
- **`deployment-health-monitor.yml`** - Health monitoring and rollback system

### Configuration Files
- **`package.json`** - Updated to require Node.js 24+
- **`Dockerfile.fixed`** - Updated to use Node.js 24
- **`app.yaml`** - Updated runtime configuration

## 🚀 Quick Start

### 1. System Status Check
```bash
node scripts/nodejs-upgrade-manager.js status
```

### 2. Version Monitoring
```bash
node scripts/nodejs-upgrade-manager.js check
```

### 3. Compatibility Check
```bash
node scripts/nodejs-upgrade-manager.js compatibility 24
```

### 4. Validate System
```bash
node scripts/nodejs-upgrade-manager.js validate
```

## 📊 Current Configuration

### Node.js Versions
- **Docker Images**: Node.js 24-alpine, Node.js 24-slim
- **GitHub Actions**: Node.js 24.x
- **Package.json**: `>=24.0.0`
- **App Engine**: nodejs22 (will upgrade to nodejs24 when available)
- **Cloud Functions**: nodejs22 (will upgrade to nodejs24 when available)

### Automated Schedules
- **Version Monitoring**: Every Monday at 9 AM UTC
- **Health Checks**: Every 15 minutes
- **Deployment Monitoring**: After each deployment

## 🔧 Manual Operations

### Check Current Versions
```bash
# Quick check
node scripts/nodejs-upgrade-manager.js check

# Detailed JSON output
node scripts/nodejs-upgrade-manager.js check --json
```

### Test Compatibility
```bash
# Check compatibility for Node.js 26 (future version)
node scripts/nodejs-upgrade-manager.js compatibility 26

# Force check even with warnings
node scripts/nodejs-upgrade-manager.js compatibility 26 --force
```

### Perform Manual Upgrade
```bash
# Dry run (no changes made)
node scripts/nodejs-upgrade-manager.js upgrade 26 --dry-run

# Actual upgrade
node scripts/nodejs-upgrade-manager.js upgrade 26

# Force upgrade despite compatibility issues
node scripts/nodejs-upgrade-manager.js upgrade 26 --force
```

## 🤖 Automated Workflows

### Weekly Version Check
- **Trigger**: Every Monday 9 AM UTC
- **Action**: Checks for new Node.js LTS versions
- **Output**: Creates GitHub Issue if upgrades needed
- **PR Creation**: Automatically creates upgrade PR if compatible

### Deployment Health Monitoring
- **Trigger**: After each deployment + every 15 minutes
- **Checks**: Service health, response times, Node.js versions
- **Rollback**: Automatic if critical failures detected
- **Notifications**: GitHub Issues for any problems

### Manual Triggers
```bash
# Trigger version check workflow
gh workflow run "Node.js Auto-Upgrade Monitor"

# Force upgrade even if no new version detected
gh workflow run "Node.js Auto-Upgrade Monitor" \
  --input force_upgrade=true \
  --input target_version=26

# Manual rollback with specific SHA
gh workflow run "Deployment Health Monitor & Rollback" \
  --input force_rollback=true \
  --input rollback_sha=abc123def456
```

## 📋 Monitoring Reports

### Version Report (`nodejs-version-report.json`)
```json
{
  "timestamp": "2025-08-27T11:32:13.045Z",
  "summary": {
    "filesScanned": 9,
    "upgradesRecommended": 0,
    "criticalWarnings": 0,
    "overallStatus": "up-to-date"
  },
  "currentVersions": {...},
  "latestVersions": {...},
  "recommendations": [...]
}
```

### Compatibility Report (`dependency-compatibility-report.json`)
```json
{
  "timestamp": "2025-08-27T11:33:42.157Z",
  "targetNodeVersion": "24",
  "summary": {
    "packageFilesChecked": 30,
    "compatibilityIssues": 2,
    "warnings": 35,
    "overallCompatibility": "incompatible"
  },
  "issues": [...],
  "recommendations": [...]
}
```

## ⚙️ Configuration Options

### Environment Variables
```bash
# GitHub Actions environment
GITHUB_ACTIONS=true          # Enables GitHub Actions output format
GITHUB_TOKEN=<token>         # Required for PR creation and issues
GCP_SA_KEY=<service-account> # Google Cloud authentication
GCP_PROJECT=<project-id>     # Google Cloud project
```

### Customization

#### Update Monitoring Schedule
Edit `.github/workflows/nodejs-auto-upgrade.yml`:
```yaml
schedule:
  - cron: '0 9 * * 1'  # Change to desired schedule
```

#### Modify Health Check Frequency
Edit `.github/workflows/deployment-health-monitor.yml`:
```yaml
schedule:
  - cron: '*/15 * * * *'  # Change to desired frequency
```

#### Add Custom Compatibility Rules
Edit `scripts/dependency-compatibility-checker.js`:
```javascript
const knownIssues = {
  26: [  // Add rules for Node.js 26
    { package: 'some-package', reason: 'Not compatible', alternative: 'new-package' }
  ]
};
```

## 🚨 Troubleshooting

### Common Issues

#### Compatibility Failures
```bash
# Check specific compatibility issues
node scripts/nodejs-upgrade-manager.js compatibility 24

# View detailed report
cat dependency-compatibility-report.json | jq '.issues'
```

#### Failed Health Checks
```bash
# Check deployment health manually
gh workflow run "Deployment Health Monitor & Rollback"

# View recent health reports
ls -la *health-report.json
```

#### Rollback Issues
```bash
# Manual rollback to specific commit
gh workflow run "Deployment Health Monitor & Rollback" \
  --input force_rollback=true \
  --input rollback_sha=$(git rev-parse HEAD~1)
```

### Debug Mode
```bash
# Enable verbose logging
DEBUG=1 node scripts/nodejs-upgrade-manager.js check

# JSON output for parsing
node scripts/nodejs-upgrade-manager.js status --json | jq
```

## 🔐 Security Considerations

### Secrets Required
- `GITHUB_TOKEN` - For creating PRs and issues
- `GCP_SA_KEY` - Google Cloud service account
- `GCP_PROJECT` - Google Cloud project ID

### Permissions
- **Contents**: Write (for creating branches and commits)
- **Pull Requests**: Write (for creating upgrade PRs)
- **Issues**: Write (for notifications and alerts)
- **Deployments**: Write (for rollback operations)

## 🎯 Benefits

### Proactive Management
- **Zero Downtime**: Prevents failures before they happen
- **Automated**: No manual intervention needed for routine upgrades
- **Safe**: Compatibility checks prevent breaking changes

### Monitoring & Alerting
- **Real-time**: Continuous health monitoring
- **Notifications**: Immediate alerts for issues
- **Rollback**: Automatic recovery from failed deployments

### Version Management
- **Current**: Always uses supported Node.js versions
- **Secure**: Automatic security updates
- **Compatible**: Validates dependencies before upgrading

## 📈 Next Steps

### Immediate
- [x] System deployed and validated
- [x] All components working correctly
- [x] Health monitoring active

### Future Enhancements
- [ ] Integration with additional cloud providers
- [ ] Extended compatibility database
- [ ] Performance impact analysis
- [ ] Custom notification channels (Slack, Teams, etc.)
- [ ] Advanced rollback strategies

## 💡 Usage Examples

### Daily Operations
```bash
# Morning check
node scripts/nodejs-upgrade-manager.js status

# If issues found
node scripts/nodejs-upgrade-manager.js check
node scripts/nodejs-upgrade-manager.js compatibility 24
```

### Pre-deployment
```bash
# Validate system before major deployments
node scripts/nodejs-upgrade-manager.js validate

# Check compatibility for planned upgrade
node scripts/nodejs-upgrade-manager.js compatibility 26 --dry-run
```

### Emergency Response
```bash
# Force rollback if issues detected
gh workflow run "Deployment Health Monitor & Rollback" \
  --input force_rollback=true

# Check system after rollback
node scripts/nodejs-upgrade-manager.js status
```

---

🔥 **Your Node.js infrastructure is now future-proof and will never fail due to version upgrades again!**

For questions or issues, check the generated reports or GitHub Issues created by the automation system.
