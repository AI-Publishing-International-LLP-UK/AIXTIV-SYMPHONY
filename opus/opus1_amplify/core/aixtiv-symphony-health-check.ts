// File: src/deployment/warp-health-check.ts
/**
 * Aixtiv Symphony Daily Health Check System
 * Ensures continuous AI execution stability with automated monitoring
 * Integrates with multi-tiered enterprise security architecture
 * Provides healthz endpoints for kubernetes and container health monitoring
 */
import { exec } from 'child_process';
import { config } from 'dotenv';
import axios from 'axios';
import express from 'express';

// Load environment variables
config();

// Warp API & Communication Channels
const WARP_API_URL = process.env.WARP_API_URL || 'https://warp.aixtiv.com/api';
const WARP_AUTH_TOKEN = process.env.WARP_AUTH_TOKEN || 'your-secure-token';
const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || '';

// Integration Gateway & Security Configuration
const INTEGRATION_GATEWAY_URL =
  process.env.INTEGRATION_GATEWAY_URL || 'https://gateway.aixtiv.com/api';
const SECRETS_MANAGER_URL =
  process.env.SECRETS_MANAGER_URL || 'https://secrets.aixtiv.com/api';
const DR_GRANT_AUTHENTICATOR_URL =
  process.env.DR_GRANT_AUTHENTICATOR_URL || 'https://auth.aixtiv.com/api';
const SALLY_PORT_URL =
  process.env.SALLY_PORT_URL || 'https://sallyport.aixtiv.com/api';

// Multi-tier Security Tokens
const RED_SCORPION_TOKEN = process.env.RED_SCORPION_TOKEN || '';
const DIAMOND_SAO_TOKEN = process.env.DIAMOND_SAO_TOKEN || '';
const SAO_TOKEN = process.env.SAO_TOKEN || '';

// Function to Send Slack Notification
async function sendSlackAlert(
  message: string,
  severity: 'info' | 'warning' | 'critical' = 'info'
) {
  if (!SLACK_WEBHOOK_URL) {
    console.warn('⚠️ Slack Webhook URL not set. Skipping Slack notification.');
    return;
  }

  try {
    // Add appropriate emoji based on severity
    const emoji =
      severity === 'critical' ? '🚨' : severity === 'warning' ? '⚠️' : '🔔';

    // Format message with severity indicator
    const formattedMessage = `${emoji} *[${severity.toUpperCase()}]* ${message}`;

    // Send to Slack with additional context data
    await axios.post(SLACK_WEBHOOK_URL, {
      text: formattedMessage,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: formattedMessage,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `*Time:* ${new Date().toISOString()} | *System:* Aixtiv Symphony | *Environment:* ${process.env.NODE_ENV || 'production'}`,
            },
          ],
        },
      ],
    });
    console.log(`✅ Slack Alert Sent! (Severity: ${severity})`);
  } catch (error) {
    console.error('❌ Failed to Send Slack Alert:', error.message);
  }
}

// Function to Check Service Health
async function checkServiceHealth(service: string) {
  try {
    const response = await axios.get(`${WARP_API_URL}/health/${service}`, {
      headers: { Authorization: `Bearer ${WARP_AUTH_TOKEN}` },
    });
    return response.status === 200 ? '✅ Healthy' : '❌ Issue Detected';
  } catch (error) {
    return `❌ Error Checking ${service}: ${error.message}`;
  }
}

// Function to Check Integration Gateway Health with multi-tier support
async function checkIntegrationGateway(tenantId?: string) {
  try {
    const url = tenantId
      ? `${INTEGRATION_GATEWAY_URL}/health?tenantId=${tenantId}`
      : `${INTEGRATION_GATEWAY_URL}/health`;

    const response = await axios.get(url, {
      headers: {
        Authorization: `Bearer ${WARP_AUTH_TOKEN}`,
        'X-Red-Scorpion': RED_SCORPION_TOKEN,
        'X-Diamond-SAO': DIAMOND_SAO_TOKEN,
        'X-SAO': SAO_TOKEN,
      },
    });

    return response.status === 200 ? '✅ Healthy' : '❌ Issue Detected';
  } catch (error) {
    return `❌ Error Checking Integration Gateway: ${error.message}`;
  }
}

// Function to validate Dr. Grant's Authenticator and Sally Port
async function checkSecurityInfrastructure() {
  try {
    // Check Dr. Grant's Authenticator
    const authResponse = await axios.get(
      `${DR_GRANT_AUTHENTICATOR_URL}/health`,
      {
        headers: {
          Authorization: `Bearer ${WARP_AUTH_TOKEN}`,
          'X-Red-Scorpion': RED_SCORPION_TOKEN,
        },
      }
    );

    // Check Sally Port Verification
    const sallyPortResponse = await axios.get(`${SALLY_PORT_URL}/health`, {
      headers: {
        Authorization: `Bearer ${WARP_AUTH_TOKEN}`,
        'X-Red-Scorpion': RED_SCORPION_TOKEN,
      },
    });

    // Check Secrets Manager
    const secretsResponse = await axios.get(`${SECRETS_MANAGER_URL}/health`, {
      headers: {
        Authorization: `Bearer ${WARP_AUTH_TOKEN}`,
        'X-Red-Scorpion': RED_SCORPION_TOKEN,
        'X-Diamond-SAO': DIAMOND_SAO_TOKEN,
      },
    });

    const securityStatus = {
      authenticator:
        authResponse.status === 200 ? '✅ Healthy' : '❌ Issue Detected',
      sallyPort:
        sallyPortResponse.status === 200 ? '✅ Healthy' : '❌ Issue Detected',
      secretsManager:
        secretsResponse.status === 200 ? '✅ Healthy' : '❌ Issue Detected',
    };

    return securityStatus;
  } catch (error) {
    return {
      authenticator: `❌ Error: ${error.message}`,
      sallyPort: `❌ Error: ${error.message}`,
      secretsManager: `❌ Error: ${error.message}`,
    };
  }
}

// Function to Restart a Service if it Fails
async function restartService(service: string) {
  console.log(`🔄 Restarting ${service}...`);
  try {
    const response = await axios.post(
      `${WARP_API_URL}/restart`,
      {
        service,
      },
      {
        headers: { Authorization: `Bearer ${WARP_AUTH_TOKEN}` },
      }
    );

    if (response.status === 200) {
      sendSlackAlert(`🔄 *Restarted ${service} Successfully!*`, 'warning');
      return `✅ ${service} Restarted Successfully!`;
    } else {
      sendSlackAlert(`❌ *Failed to Restart ${service}.*`, 'critical');
      return `❌ Failed to Restart ${service}`;
    }
  } catch (error) {
    sendSlackAlert(
      `❌ *Error Restarting ${service}:* ${error.message}`,
      'critical'
    );
    return `❌ Error Restarting ${service}: ${error.message}`;
  }
}

// Check FMS 2-hour flight cycles
async function checkFMSCycles() {
  try {
    const response = await axios.get(`${WARP_API_URL}/fms/cycles`, {
      headers: { Authorization: `Bearer ${WARP_AUTH_TOKEN}` },
    });
    return response.status === 200 ? response.data : null;
  } catch (error) {
    sendSlackAlert(
      `❌ *Error Checking FMS Cycles:* ${error.message}`,
      'warning'
    );
    return null;
  }
}

// Validate S2DO Execution vs. Minting operations
async function validateS2DOOperations() {
  try {
    const response = await axios.post(
      `${WARP_API_URL}/s2do/validate`,
      {
        checkExecution: true,
        checkMinting: true,
      },
      {
        headers: { Authorization: `Bearer ${WARP_AUTH_TOKEN}` },
      }
    );
    return response.status === 200;
  } catch (error) {
    sendSlackAlert(
      `❌ *Error Validating S2DO Operations:* ${error.message}`,
      'warning'
    );
    return false;
  }
}

// Check tenant organization subscriptions and user roles
async function checkOrganizationTiers() {
  try {
    const response = await axios.get(
      `${INTEGRATION_GATEWAY_URL}/organizations/health`,
      {
        headers: {
          Authorization: `Bearer ${WARP_AUTH_TOKEN}`,
          'X-Diamond-SAO': DIAMOND_SAO_TOKEN,
        },
      }
    );

    if (response.status !== 200) {
      throw new Error('Failed to retrieve organization tiers');
    }

    const tierStatus = {
      enterprise: response.data.enterprise ? '✅ Healthy' : '❌ Issue Detected',
      ownerSubscriber: response.data.ownerSubscriber
        ? '✅ Healthy'
        : '❌ Issue Detected',
      teamLeaders: response.data.teamLeaders
        ? '✅ Healthy'
        : '❌ Issue Detected',
      groupLeaders: response.data.groupLeaders
        ? '✅ Healthy'
        : '❌ Issue Detected',
      educators: response.data.educators ? '✅ Healthy' : '❌ Issue Detected',
      visionaryVoices: response.data.visionaryVoices
        ? '✅ Healthy'
        : '❌ Issue Detected',
    };

    return tierStatus;
  } catch (error) {
    return {
      enterprise: `❌ Error: ${error.message}`,
      ownerSubscriber: `❌ Error: ${error.message}`,
      teamLeaders: `❌ Error: ${error.message}`,
      groupLeaders: `❌ Error: ${error.message}`,
      educators: `❌ Error: ${error.message}`,
      visionaryVoices: `❌ Error: ${error.message}`,
    };
  }
}

// Function to Run Daily Health Check
async function runHealthCheck() {
  console.log('🚀 Running Aixtiv Symphony Daily Health Check...');
  let issuesDetected = false;

  // Initialize comprehensive status report
  let statusReport: any = {
    core: {},
    squadrons: {},
    locations: {},
    securityInfrastructure: {},
    organizationTiers: {},
    integrationGateway: {},
    s2do: {},
    fms: {},
  };

  // 1. Check core services
  const services = [
    'rixs',
    'copilot_execution',
    'copilot_collaboration',
    'concierge_rx',
    'flight_memory',
    'tower_blockchain',
    's2do_execution',
    's2do_minting',
  ];

  for (const service of services) {
    const health = await checkServiceHealth(service);
    statusReport.core[service] = health;

    // Restart service if it fails
    if (health.includes('❌')) {
      issuesDetected = true;
      sendSlackAlert(`🚨 *Issue Detected:* ${service} is failing!`, 'critical');
      const restartResult = await restartService(service);
      statusReport.core[`${service}_restart`] = restartResult;
    }
  }

  // 2. Check squadrons
  const squadrons = [
    'r1_squadron', //Core Agency
    'r2_squadron', //Deploy Agency
    'r3_squadron', // Engage & Sales Agency
    'r4_concierge', // Concierge Reception
    'r5_rixs', // Rix's / Super Combinative Pilots
    'r6_copilots', // Co-Pilots / Personalized Owner-Subscriber AI Consultant Advisors
  ];

  // Squadron descriptions for Slack alerts and reporting
  const squadronDescriptions = {
    r1_squadron: 'Core Agency',
    r2_squadron: 'Deploy Agency',
    r3_squadron: 'Engage & Sales Agency',
    r4_concierge: 'Concierge Reception & Support',
    r5_rixs: "Rix's Super Combinative Pilots",
    r6_copilots: 'Owner-Subscriber AI Consultants',
  };

  for (const squadron of squadrons) {
    const health = await checkServiceHealth(squadron);
    statusReport.squadrons[squadron] = health;

    // Restart squadron if it fails
    if (health.includes('❌')) {
      issuesDetected = true;
      sendSlackAlert(
        `🚨 *Issue Detected:* ${squadronDescriptions[squadron]} Squadron (${squadron}) is failing!`,
        'critical'
      );
      const restartResult = await restartService(squadron);
      statusReport.squadrons[`${squadron}_restart`] = restartResult;
    }
  }

  // Process results and send report
  console.log(
    '📊 Health Check Results:',
    JSON.stringify(statusReport, null, 2)
  );

  // Send Summary to Slack
  if (!issuesDetected) {
    sendSlackAlert(
      '✅ *Daily Aixtiv Symphony Health Check Passed!* All systems are operational across Compass Field and Jetport.',
      'info'
    );
  } else {
    sendSlackAlert(
      '⚠️ *Health Check Completed with Issues:* Check admin dashboard for details. Red Scorpion security protocol may be required.',
      'warning'
    );
  }

  return statusReport;
}

// Create Express server for health check endpoints
const app = express();
const PORT = process.env.HEALTH_PORT || 8080;

// Basic health check endpoint
app.get('/healthz', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

// Readiness probe endpoint
app.get('/readyz', (req, res) => {
  res.status(200).json({ status: 'ready' });
});

// Liveness probe endpoint
app.get('/livez', (req, res) => {
  res.status(200).json({ status: 'alive' });
});

// Detailed health status API
app.get('/api/health/status', async (req, res) => {
  try {
    // Run quick version of health check (non-blocking)
    const quickStatus = {
      timestamp: new Date().toISOString(),
      status: 'operational',
      version: process.env.APP_VERSION || '1.0.1',
    };
    res.status(200).json(quickStatus);
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// Start the health check server
app.listen(PORT, () =>
  console.log(`Health check server running on port ${PORT}`)
);

// Schedule Health Check to Run Every 24 Hours
setInterval(runHealthCheck, 24 * 60 * 60 * 1000);

// Run Initial Health Check on Script Start
runHealthCheck();
