#!/usr/bin/env node

/**
 * Deployment Rollback Script
 * 
 * This script handles rolling back to a previous version in case of deployment failures.
 * 
 * Usage: node rollback.js <environment> [deployment-id]
 * If deployment-id is not specified, it will roll back to the most recent successful deployment.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
  environments: {
    staging: {
      url: 'https://staging.example.com',
      deploymentsDir: './deployments/staging',
      deploymentsHistoryFile: './deployments/staging-history.json',
      // Add staging-specific configuration
    },
    production: {
      url: 'https://example.com',
      deploymentsDir: './deployments/production',
      deploymentsHistoryFile: './deployments/production-history.json',
      // Add production-specific configuration
    }
  },
  maxRollbackAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  notifyOnRollback: true,
  notificationEndpoint: process.env.NOTIFICATION_ENDPOINT || null
};

// Logging utility
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}]`;
  console.log(`${prefix} ${message}`);
}

// Error handler
function handleError(error, step) {
  log(`Error during ${step}: ${error.message}`, 'ERROR');
  log(`Stack trace: ${error.stack}`, 'DEBUG');
  process.exit(1);
}

// Execute shell command with logging
function exec(command, options = {}) {
  log(`Executing: ${command}`, 'DEBUG');
  try {
    return execSync(command, { 
      stdio: 'pipe',
      encoding: 'utf-8',
      ...options
    });
  } catch (error) {
    log(`Command failed: ${command}`, 'ERROR');
    throw error;
  }
}

// Create directory if it doesn't exist
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    log(`Created directory: ${dirPath}`, 'DEBUG');
  }
}

// Get deployment history
function getDeploymentHistory(environment) {
  const historyFile = config.environments[environment].deploymentsHistoryFile;
  
  // Create history directory if it doesn't exist
  ensureDirectoryExists(path.dirname(historyFile));
  
  // If history file doesn't exist, create an empty one
  if (!fs.existsSync(historyFile)) {
    fs.writeFileSync(historyFile, JSON.stringify({ deployments: [] }));
    log(`Created new deployment history file: ${historyFile}`, 'DEBUG');
    return { deployments: [] };
  }
  
  try {
    const historyData = JSON.parse(fs.readFileSync(historyFile, 'utf-8'));
    return historyData;
  } catch (error) {
    log(`Failed to read deployment history: ${error.message}`, 'ERROR');
    return { deployments: [] };
  }
}

// Get the most recent successful deployment
function getLatestSuccessfulDeployment(environment) {
  const history = getDeploymentHistory(environment);
  const now = new Date().getTime();
  
  // Filter to only include successful deployments that aren't too old
  const validDeployments = history.deployments
    .filter(deployment => 
      deployment.status === 'success'