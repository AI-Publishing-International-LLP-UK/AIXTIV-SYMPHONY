#!/usr/bin/env node

/**
 * Comprehensive System Health Check Script
 *
 * This script performs various checks on the system and reports their status.
 * Place this file in the scripts/ directory of your repository.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
  requiredFiles: ['.github/workflows/24-7-monitoring.yml', 'package.json'],
  requiredEnvVars: ['GITHUB_TOKEN', 'GITHUB_REPOSITORY'],
  endpoints: [
    {
      name: 'GitHub API',
      url: 'https://api.github.com/zen',
      headers: { 'User-Agent': 'HealthCheck' },
      expectedStatus: 200,
    },
  ],
  diskSpaceThreshold: 90, // Percentage
};

// Track check results
const results = {
  checks: [],
  overallStatus: 'success',
  startTime: new Date(),
  endTime: null,
};

/**
 * Add a check result to the results object
 */
function addResult(name, status, message = null, details = null) {
  const result = {
    name,
    status,
    timestamp: new Date().toISOString(),
  };

  if (message) result.message = message;
  if (details) result.details = details;

  results.checks.push(result);

  console.log(
    `[${status.toUpperCase()}] ${name}${message ? ': ' + message : ''}`
  );

  // Update overall status
  if (status === 'failure' && results.overallStatus !== 'failure') {
    results.overallStatus = 'failure';
  }
}

/**
 * Check if required environment variables are set
 */
function checkEnvironmentVariables() {
  console.log('Checking environment variables...');

  const missingVars = config.requiredEnvVars.filter(varName => {
    return !process.env[varName];
  });

  if (missingVars.length > 0) {
    addResult(
      'Environment Variables',
      'failure',
      `Missing required environment variables: ${missingVars.join(', ')}`
    );
    return false;
  }

  addResult(
    'Environment Variables',
    'success',
    'All required environment variables are set'
  );
  return true;
}

/**
 * Check if required files exist
 */
function checkRequiredFiles() {
  console.log('Checking required files...');

  const missingFiles = config.requiredFiles.filter(filePath => {
    return !fs.existsSync(path.join(process.cwd(), filePath));
  });

  if (missingFiles.length > 0) {
    addResult(
      'Required Files',
      'failure',
      `Missing required files: ${missingFiles.join(', ')}`
    );
    return false;
  }

  addResult('Required Files', 'success', 'All required files are present');
  return true;
}

/**
 * Check disk space usage
 */
function checkDiskSpace() {
  console.log('Checking disk space...');

  try {
    // This works on Linux and macOS
    const output = execSync("df -h / | awk 'NR==2{print $5}'")
      .toString()
      .trim();
    const usagePercentage = parseInt(output.replace('%', ''));

    if (usagePercentage >= config.diskSpaceThreshold) {
      addResult(
        'Disk Space',
        'failure',
        `Disk usage is high: ${usagePercentage}%`,
        { threshold: config.diskSpaceThreshold, current: usagePercentage }
      );
      return false;
    }

    addResult(
      'Disk Space',
      'success',
      `Disk usage is acceptable: ${usagePercentage}%`,
      { threshold: config.diskSpaceThreshold, current: usagePercentage }
    );
    return true;
  } catch (error) {
    // If running on Windows or command fails
    addResult('Disk Space', 'warning', 'Could not check disk space', {
      error: error.message,
    });
    return true; // Not critical, so return true
  }
}

/**
 * Check connectivity to important endpoints
 */
function checkEndpoints() {
  console.log('Checking endpoint connectivity...');

  return Promise.all(
    config.endpoints.map(endpoint => {
      return new Promise(resolve => {
        const options = {
          method: 'GET',
          headers: endpoint.headers || {},
        };

        const req = https.request(endpoint.url, options, res => {
          const statusMatch = res.statusCode === endpoint.expectedStatus;

          if (statusMatch) {
            addResult(
              `Endpoint: ${endpoint.name}`,
              'success',
              `Connected successfully (${res.statusCode})`,
              { url: endpoint.url, statusCode: res.statusCode }
            );
          } else {
            addResult(
              `Endpoint: ${endpoint.name}`,
              'failure',
              `Unexpected status code: ${res.statusCode}`,
              {
                url: endpoint.url,
                statusCode: res.statusCode,
                expected: endpoint.expectedStatus,
              }
            );
          }

          resolve(statusMatch);
        });

        req.on('error', error => {
          addResult(
            `Endpoint: ${endpoint.name}`,
            'failure',
            `Connection failed: ${error.message}`,
            { url: endpoint.url, error: error.message }
          );

          resolve(false);
        });

        req.end();
      });
    })
  );
}

/**
 * Check GitHub Actions environment
 */
function checkGitHubActions() {
  console.log('Checking GitHub Actions environment...');

  if (process.env.GITHUB_ACTIONS === 'true') {
    addResult(
      'GitHub Actions Environment',
      'success',
      'Running in GitHub Actions environment'
    );
  } else {
    addResult(
      'GitHub Actions Environment',
      'warning',
      'Not running in GitHub Actions environment'
    );
  }

  return true;
}

/**
 * Run all health checks
 */
async function runHealthChecks() {
  console.log('Starting health checks...');

  checkGitHubActions();
  checkEnvironmentVariables();
  checkRequiredFiles();
  checkDiskSpace();
  await checkEndpoints();

  // Record finish time
  results.endTime = new Date();
  results.duration = (results.endTime - results.startTime) / 1000;

  // Print summary
  console.log('\n=== Health Check Summary ===');
  console.log(`Status: ${results.overallStatus.toUpperCase()}`);
  console.log(`Checks run: ${results.checks.length}`);
  console.log(`Duration: ${results.duration.toFixed(2)} seconds`);

  // Write results to file
  fs.writeFileSync(
    'health-check-results.json',
    JSON.stringify(results, null, 2)
  );

  // Exit with appropriate code
  if (results.overallStatus === 'failure') {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Run the health checks
runHealthChecks().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
