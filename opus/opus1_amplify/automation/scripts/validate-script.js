#!/usr/bin/env node

/**
 * Pre-Deployment Validation Script
 *
 * This script validates that a build is ready for deployment by performing
 * various checks on the build artifacts and configuration.
 *
 * Usage: node validate-deployment.js <environment>
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
  environments: {
    staging: {
      requiredFiles: ['index.html', 'main.js', 'styles.css'],
      requiredEnvVars: ['STAGE_API_URL', 'STAGE_AUTH_DOMAIN'],
      sizeLimit: 50 * 1024 * 1024, // 50MB
    },
    production: {
      requiredFiles: ['index.html', 'main.js', 'styles.css'],
      requiredEnvVars: ['PROD_API_URL', 'PROD_AUTH_DOMAIN'],
      sizeLimit: 50 * 1024 * 1024, // 50MB
      performanceThreshold: 90, // Lighthouse score
    },
  },
  buildDir: 'dist',
  configFile: 'config.json',
  verboseLogging: process.argv.includes('--verbose'),
};

// Collect validation results
const results = {
  environment: '',
  checks: [],
  passingChecks: 0,
  totalChecks: 0,
  valid: true,
};

// Log messages
function log(message, type = 'info') {
  const prefix =
    type === 'error'
      ? '❌ ERROR'
      : type === 'warning'
        ? '⚠️ WARNING'
        : type === 'success'
          ? '✅ SUCCESS'
          : 'ℹ️ INFO';
  console.log(`${prefix}: ${message}`);
}

// Verbose logging
function verbose(message) {
  if (config.verboseLogging) {
    console.log(`  - ${message}`);
  }
}

// Add a check result
function addCheckResult(name, passed, message = null, details = null) {
  results.totalChecks++;

  if (passed) {
    results.passingChecks++;
    log(`${name}: Passed`, 'success');
    if (message) verbose(message);
  } else {
    results.valid = false;
    log(`${name}: Failed - ${message || 'No details provided'}`, 'error');
  }

  results.checks.push({
    name,
    passed,
    message,
    details,
  });
}

// Get total size of a directory
function getTotalSize(dirPath) {
  let totalSize = 0;

  function processDirectory(dirPath) {
    const files = fs.readdirSync(dirPath);

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);

      if (stats.isDirectory()) {
        processDirectory(filePath);
      } else {
        totalSize += stats.size;
      }
    }
  }

  processDirectory(dirPath);
  return totalSize;
}

// Format bytes to human readable
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

// Check if build directory exists
function checkBuildExists() {
  const buildPath = path.join(process.cwd(), config.buildDir);
  const exists = fs.existsSync(buildPath);

  addCheckResult(
    'Build Directory Exists',
    exists,
    exists
      ? `Build directory found at ${buildPath}`
      : `Build directory not found at ${buildPath}`
  );

  return exists;
}

// Check required files
function checkRequiredFiles(environment) {
  const buildPath = path.join(process.cwd(), config.buildDir);
  const requiredFiles = config.environments[environment].requiredFiles;
  const missingFiles = [];

  for (const file of requiredFiles) {
    const filePath = path.join(buildPath, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  }

  addCheckResult(
    'Required Files',
    missingFiles.length === 0,
    missingFiles.length === 0
      ? `All required files are present`
      : `Missing required files: ${missingFiles.join(', ')}`,
    { requiredFiles, missingFiles }
  );

  return missingFiles.length === 0;
}

// Check build size
function checkBuildSize(environment) {
  const buildPath = path.join(process.cwd(), config.buildDir);
  const sizeLimit = config.environments[environment].sizeLimit;

  const totalSize = getTotalSize(buildPath);
  const withinLimit = totalSize <= sizeLimit;

  addCheckResult(
    'Build Size',
    withinLimit,
    withinLimit
      ? `Build size is ${formatBytes(totalSize)} (limit: ${formatBytes(sizeLimit)})`
      : `Build size of ${formatBytes(totalSize)} exceeds the limit of ${formatBytes(sizeLimit)}`,
    { totalSize, limit: sizeLimit, formattedSize: formatBytes(totalSize) }
  );

  return withinLimit;
}

// Check environment variables
function checkEnvironmentVariables(environment) {
  const requiredEnvVars = config.environments[environment].requiredEnvVars;
  const missingVars = [];

  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      missingVars.push(varName);
    }
  }

  addCheckResult(
    'Environment Variables',
    missingVars.length === 0,
    missingVars.length === 0
      ? `All required environment variables are set`
      : `Missing required environment variables: ${missingVars.join(', ')}`,
    { requiredEnvVars, missingVars }
  );

  return missingVars.length === 0;
}

// Check configuration file
function checkConfigFile(environment) {
  const configPath = path.join(
    process.cwd(),
    config.buildDir,
    config.configFile
  );

  // Skip if config file is not required
  if (
    !config.environments[environment].requiredFiles.includes(config.configFile)
  ) {
    verbose(`Config file check skipped - ${config.configFile} is not required`);
    return true;
  }

  if (!fs.existsSync(configPath)) {
    addCheckResult(
      'Configuration File',
      false,
      `Configuration file not found at ${configPath}`
    );
    return false;
  }

  try {
    const configData = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    const hasEnvironmentConfig = configData && configData[environment];

    addCheckResult(
      'Configuration File',
      hasEnvironmentConfig,
      hasEnvironmentConfig
        ? `Configuration for ${environment} found in ${config.configFile}`
        : `No configuration for ${environment} found in ${config.configFile}`
    );

    return hasEnvironmentConfig;
  } catch (error) {
    addCheckResult(
      'Configuration File',
      false,
      `Failed to parse configuration file: ${error.message}`
    );
    return false;
  }
}

// Main validation function
function validateDeployment() {
  const environment = process.argv[2];

  // Validate environment argument
  if (!environment || !config.environments[environment]) {
    log(
      `Invalid environment: ${environment}. Must be one of: ${Object.keys(config.environments).join(', ')}`,
      'error'
    );
    process.exit(1);
  }

  results.environment = environment;
  log(
    `Validating deployment for ${environment.toUpperCase()} environment`,
    'info'
  );

  // Run checks
  const buildExists = checkBuildExists();

  // Only continue if build exists
  if (buildExists) {
    checkRequiredFiles(environment);
    checkBuildSize(environment);
    checkEnvironmentVariables(environment);
    checkConfigFile(environment);
  }

  // Print summary
  console.log('\n=============================================');
  console.log(`VALIDATION SUMMARY FOR ${environment.toUpperCase()}`);
  console.log('=============================================');
  console.log(
    `Passing Checks: ${results.passingChecks}/${results.totalChecks}`
  );
  console.log(`Overall Result: ${results.valid ? '✅ VALID' : '❌ INVALID'}`);
  console.log('=============================================\n');

  // Write results to file for CI/CD integration
  fs.writeFileSync(
    'deployment-validation-results.json',
    JSON.stringify(results, null, 2)
  );

  // Exit with appropriate code
  process.exit(results.valid ? 0 : 1);
}

// Run validation
validateDeployment();
