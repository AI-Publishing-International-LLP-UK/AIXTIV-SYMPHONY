# Diamond SAO Command Center - Comprehensive Monitoring System

## Overview

The Diamond SAO Command Center is a comprehensive, autonomous monitoring and self-healing system designed for enterprise-grade infrastructure management. It provides Professional Co-Pilot (PCP) autonomous operations with OAuth2 compliance, predictive analytics, and multi-region resilience.

## 🚀 Features

### Core Components

1. **Master Orchestrator** (`master-orchestrator.js`)
   - Central coordination hub for all monitoring subsystems
   - Autonomous decision-making and cross-system correlation
   - Real-time health aggregation and system optimization

2. **Self-Healing Controller** (`self-healing-controller.js`)
   - Automatic pod restart and deployment scaling
   - Node health monitoring and recovery
   - Cloud Run service health checks with auto-remediation

3. **CIG Monitoring System** (`cig-monitor.js`)
   - Continuous Integration & Governance monitoring
   - Predictive analytics for resource usage and failure patterns
   - System metrics collection with trend analysis

4. **Resilience Framework** (`resilience-framework.js`)
   - Multi-region failover and traffic routing
   - Auto-scaling based on CPU/memory thresholds
   - High availability with redundancy validation

5. **OAuth2 Security Monitor** (`oauth2-security-monitor.js`)
   - Advanced threat detection and audit logging
   - Brute force attack prevention with IP blocking
   - SallyPort endpoint security monitoring

### 🛡️ Security Features

- **OAuth2 Compliance**: All components authenticate using OAuth2 standards
- **Encrypted Logging**: Sensitive security data is encrypted before storage
- **Threat Intelligence**: Real-time threat pattern recognition
- **Audit Trails**: Comprehensive compliance logging for Diamond SAO standards
- **SallyPort Integration**: Monitors security status of all SallyPort endpoints

### 📊 Monitoring Capabilities

- **Real-time System Metrics**: CPU, memory, disk, and network monitoring
- **Kubernetes Health**: Pod, node, and service status tracking
- **Cloud Run Monitoring**: Instance health and error rate tracking
- **Predictive Analytics**: Trend analysis for proactive issue prevention
- **Cross-system Correlation**: Event correlation across all subsystems

### 🔧 Self-Healing & Resilience

- **Automatic Recovery**: Failed pods and services are automatically restarted
- **Emergency Scaling**: Critical services are scaled up during incidents
- **Failover Management**: Automatic traffic routing to healthy regions
- **Resource Optimization**: Dynamic resource allocation based on demand
- **Preventive Measures**: Early warning system for potential issues

## 📁 File Structure

```
monitoring/
├── master-orchestrator.js      # Main coordination hub
├── self-healing-controller.js  # Auto-recovery system
├── cig-monitor.js              # CIG monitoring with analytics
├── resilience-framework.js     # High availability framework
├── oauth2-security-monitor.js  # Security and threat detection
├── start-monitoring.js         # System startup script
└── README.md                   # This documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ (required for OAuth2 compliance)
- kubectl configured and accessible
- Google Cloud SDK (gcloud) configured
- Access to Google Cloud Secret Manager
- Winston logging library

### Installation

1. **Install Dependencies**:
   ```bash
   cd /Users/as/asoos/integration-gateway
   npm install winston @google-cloud/secret-manager
   ```

2. **Set Environment Variables**:
   ```bash
   export GOOGLE_CLOUD_PROJECT="api-for-warp-drive"
   export CLOUD_ML_REGION="us-west1"
   ```

3. **Start the Monitoring System**:
   ```bash
   node monitoring/start-monitoring.js
   ```

### Alternative Start Methods

**Direct Master Orchestrator**:
```bash
node monitoring/master-orchestrator.js
```

**Individual Components** (for testing):
```bash
node monitoring/self-healing-controller.js
node monitoring/cig-monitor.js
node monitoring/resilience-framework.js
node monitoring/oauth2-security-monitor.js
```

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `GOOGLE_CLOUD_PROJECT` | Yes | GCP project ID | `api-for-warp-drive` |
| `CLOUD_ML_REGION` | Yes | Primary region | `us-west1` |
| `NODE_ENV` | No | Environment | `production` |

### Monitoring Intervals

- **Self-Healing**: 60 seconds
- **CIG Monitoring**: 30 seconds  
- **Security Monitoring**: 15 seconds
- **Resilience Checks**: 30 seconds
- **Master Coordination**: 30 seconds

### Alert Thresholds

- **CPU Usage**: 80% warning, 90% critical
- **Memory Usage**: 85% warning, 95% critical
- **Disk Usage**: 90% critical
- **Pod Restarts**: 5 restarts trigger investigation
- **Failed Authentication**: 5 attempts trigger IP block

## 📊 Dashboard & Monitoring

### Log Files

All logs are stored in `/var/log/` with appropriate subdirectories:

- `/var/log/master-orchestrator.log` - Master system coordination
- `/var/log/self-healing.log` - Auto-recovery actions
- `/var/log/cig-monitor.log` - System metrics and analytics
- `/var/log/resilience.log` - High availability actions
- `/var/log/oauth2-security.log` - Security events (encrypted)
- `/var/log/oauth2-audit.log` - Compliance audit trail

### Metrics Storage

- **System Metrics**: `/var/log/cig-monitoring/metrics/`
- **Security Events**: `/var/log/security/oauth2/`
- **Audit Logs**: `/var/log/security/audit/`
- **Compliance Reports**: `/var/log/security/compliance/`
- **Predictions**: `/var/log/cig-monitoring/predictions/`

### Dashboard Access

The monitoring dashboard is integrated with the Mocoa Owner Interface:
- **URL**: `https://mocoa-owner-interface/dashboard`
- **Version**: 34 (Diamond SAO Standards)
- **Authentication**: OAuth2 required

## 🛠️ API Operations

### Health Check
```bash
# Get overall system status
curl -H "Authorization: Bearer $OAUTH_TOKEN" \
     https://mocoa-owner-interface/api/monitoring/health
```

### Manual Actions
```javascript
// Trigger emergency stop
orchestrator.triggerManualAction('emergency_stop');

// Restart specific subsystem
orchestrator.triggerManualAction('restart_subsystem', { 
  subsystem: 'selfHealing' 
});

// Get detailed health check
const health = await orchestrator.triggerManualAction('health_check');
```

## 🔒 Security Compliance

### OAuth2 Integration

All components require OAuth2 authentication:
- Access tokens for API calls
- Refresh token rotation
- Scope-based permissions
- Encrypted token storage via Google Secret Manager

### Audit Requirements

The system maintains Diamond SAO compliance with:
- 90-day audit log retention
- Encrypted sensitive data storage
- Real-time security event logging
- Comprehensive access tracking
- Threat intelligence correlation

### SallyPort Security

Monitored endpoints include:
- `sallyport.2100.cool` - Main security gateway
- `mcp.asoos.2100.cool` - MCP template server
- `drclaude.live` - DNS management

## 🚨 Alerting & Notifications

### Alert Levels

1. **INFO**: General system information
2. **WARNING**: Potential issues requiring attention
3. **CRITICAL**: Immediate action required
4. **EMERGENCY**: System-wide critical failures

### Notification Channels

- **Console Logs**: Real-time monitoring output
- **File Logs**: Persistent storage for analysis
- **Diamond SAO Command Center**: Integrated alerting
- **System Events**: Kubernetes and Cloud Run integration

## 🔄 Auto-Recovery Actions

### Self-Healing Capabilities

1. **Pod Recovery**:
   - Automatic restart of failed pods
   - Deployment rollout restart
   - Resource allocation optimization

2. **Service Recovery**:
   - Health check endpoint validation
   - Traffic routing to healthy instances
   - Emergency scaling during outages

3. **Security Response**:
   - Automatic IP blocking for threats
   - Token revocation for suspicious activity
   - Access pattern analysis and blocking

### Recovery Scenarios

- **Pod Crash Loop**: Automatic deployment restart
- **High Resource Usage**: Auto-scaling activation
- **Security Threats**: IP blocking and access restriction
- **Health Check Failures**: Traffic rerouting and service restart
- **Node Failures**: Pod rescheduling and cluster management

## 📈 Predictive Analytics

### Machine Learning Features

1. **Resource Prediction**:
   - CPU usage trend analysis
   - Memory consumption forecasting
   - Storage growth predictions

2. **Failure Pattern Recognition**:
   - Pod restart pattern analysis
   - Service degradation prediction
   - Infrastructure failure forecasting

3. **Security Intelligence**:
   - Anomalous access pattern detection
   - Threat behavior analysis
   - Attack pattern recognition

### Data Sources

- System metrics (CPU, memory, disk, network)
- Kubernetes events and pod status
- Cloud Run service metrics
- Authentication and access logs
- Security event data
- Application performance metrics

## 🛑 Emergency Procedures

### Manual Override

```bash
# Emergency stop all monitoring
pkill -f "monitoring"

# Or use the API
node -e "
const orchestrator = require('./monitoring/master-orchestrator');
orchestrator.triggerManualAction('emergency_stop');
"
```

### Recovery from Failures

1. **Check system status**:
   ```bash
   kubectl get pods --all-namespaces
   gcloud run services list
   ```

2. **Restart monitoring**:
   ```bash
   node monitoring/start-monitoring.js
   ```

3. **Validate subsystem health**:
   ```bash
   tail -f /var/log/master-orchestrator.log
   ```

## 🔧 Troubleshooting

### Common Issues

1. **Permission Errors**:
   - Ensure `/var/log/` directory is writable
   - Verify Google Cloud authentication
   - Check kubectl cluster access

2. **Network Connectivity**:
   - Validate SallyPort endpoint access
   - Check Cloud Run service URLs
   - Verify Kubernetes cluster connectivity

3. **Resource Constraints**:
   - Monitor Node.js memory usage
   - Check system disk space
   - Validate log file rotation

### Debug Mode

Enable verbose logging:
```bash
NODE_ENV=development node monitoring/start-monitoring.js
```

### Performance Tuning

Adjust monitoring intervals in each component's constructor:
- Increase intervals for less critical monitoring
- Decrease intervals for mission-critical systems
- Balance between responsiveness and resource usage

## 📞 Support

For issues with the Diamond SAO Monitoring System:

1. **Check Logs**: Review `/var/log/master-orchestrator.log`
2. **System Status**: Use the health check API
3. **Manual Recovery**: Follow emergency procedures
4. **Configuration**: Verify environment variables and permissions

The system is designed for autonomous operation with minimal manual intervention, following Professional Co-Pilot (PCP) standards for enterprise-grade infrastructure management.

---

**Version**: 34.0-DIAMOND-SAO  
**Compliance**: OAuth2, Diamond SAO Standards  
**Support**: Professional Co-Pilot (PCP) Autonomous Operations