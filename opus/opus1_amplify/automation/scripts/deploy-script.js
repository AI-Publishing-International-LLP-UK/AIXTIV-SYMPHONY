#!/usr/bin/env node

/**
 * Deployment Script
 *
 * This script handles the deployment process for different environments.
 * Usage: node deploy.js <environment> [--debug] [--skip-tests]
 *
 * Example:
 *   node deploy.js staging
 *   node deploy.js production --skip-tests
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const config = {
  environments: {
    staging: {
      url: 'https://staging.example.com',
      // Add your staging-specific configuration here
    },
    production: {
      url: 'https://example.com',
      // Add your production-specific configuration here
    },
  },
  buildDir: path.join(process.cwd(), 'dist'),
  timeout: 300000, // 5 minutes in milliseconds
};

// Parse command-line arguments
const args = process.argv.slice(2);
const environment = args[0]?.toLowerCase();
const debugMode = args.includes('--debug');
const skipTests = args.includes('--skip-tests');

// Log with timestamps and optional debug info
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}]`;
  console.log(`${prefix} ${message}`);
}

// For debug mode only logs
function debug(message) {
  if (debugMode) {
    log(message, 'DEBUG');
  }
}

// Handle errors
function handleError(error, step) {
  log(`Error during ${step}: ${error.message}`, 'ERROR');
  if (debugMode) {
    log(`Stack trace: ${error.stack}`, 'DEBUG');
  }
  process.exit(1);
}

// Execute shell command with logging
function exec(command, options = {}) {
  debug(`Executing: ${command}`);
  try {
    return execSync(command, {
      stdio: 'pipe',
      encoding: 'utf-8',
      timeout: config.timeout,
      ...options,
    });
  } catch (error) {
    log(`Command failed: ${command}`, 'ERROR');
    log(`Error output: ${error.stderr || error.message}`, 'ERROR');
    throw error;
  }
}

// Validate environment and build
function validateEnvironment() {
  if (!environment || !config.environments[environment]) {
    log(
      `Invalid environment: '${environment}'. Must be one of: ${Object.keys(config.environments).join(', ')}`,
      'ERROR'
    );
    process.exit(1);
  }

  log(`Starting deployment to ${environment.toUpperCase()}`);

  // Check if build exists
  if (!fs.existsSync(config.buildDir)) {
    log(`Build directory not found: ${config.buildDir}`, 'ERROR');
    log('Run build script first: npm run build', 'ERROR');
    process.exit(1);
  }

  // Read package.json for version info
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
    log(`Deploying version ${packageJson.version}`);
    return packageJson.version;
  } catch (error) {
    handleError(error, 'reading package.json');
  }
}

// Run tests before deployment (if not skipped)
function runTests() {
  if (skipTests) {
    log('Skipping pre-deployment tests');
    return;
  }

  log('Running pre-deployment tests');
  try {
    exec('npm test');
    log('Tests completed successfully');
  } catch (error) {
    handleError(error, 'running tests');
  }
}

// Deploy to the specified environment
function deployToEnvironment(version) {
  const envConfig = config.environments[environment];

  log(`Deploying to ${environment} environment: ${envConfig.url}`);

  try {
    // Create a deployment directory with timestamp
    const timestamp = new Date()
      .toISOString()
      .replace(/:/g, '-')
      .replace(/\..+/, '');
    const deployId = `${version}-${timestamp}`;

    // Example deployment steps:
    // 1. Create deployment directory
    log(`Creating deployment package: ${deployId}`);

    // 2. Perform environment-specific deployment steps
    log(`Running ${environment} deployment process`);

    if (environment === 'staging') {
      // Staging deployment example (customize as needed)
      log('Deploying to staging server');
      // exec(`scp -r ${config.buildDir}/* user@staging-server:/var/www/html/`);

      // Simulate deployment
      debug('Simulating staging deployment');
      exec('sleep 2');
    } else if (environment === 'production') {
      // Production deployment example (customize as needed)
      log('Running production deployment checks');
      // exec('npm run verify-prod-readiness');

      log('Deploying to production server');
      // exec(`aws s3 sync ${config.buildDir} s3://production-bucket/ --delete`);
      // exec(`aws cloudfront create-invalidation --distribution-id DIST_ID --paths "/*"`);

      // Simulate deployment
      debug('Simulating production deployment');
      exec('sleep 3');
    }

    // 3. Verify deployment
    log('Verifying deployment');
    // Run verification steps like HTTP checks
    // exec(`curl -f ${envConfig.url}`);

    // Simulate verification
    debug('Simulating verification');
    exec('sleep 1');

    log(`🚀 Deployment to ${environment} completed successfully!`);
    log(`🔗 URL: ${envConfig.url}`);

    return {
      success: true,
      deployId,
      url: envConfig.url,
      version,
    };
  } catch (error) {
    handleError(error, `deployment to ${environment}`);
  }
}

// Main execution
function main() {
  try {
    log('============================================');
    log(`Deployment Script - ${new Date().toISOString()}`);
    log('============================================');

    if (debugMode) {
      log('Debug mode enabled', 'DEBUG');
    }

    const version = validateEnvironment();
    runTests();
    const result = deployToEnvironment(version);

    // Output result for CI/CD systems
    console.log('\nDEPLOYMENT_RESULT=' + JSON.stringify(result));

    process.exit(0);
  } catch (error) {
    handleError(error, 'deployment process');
  }
}

// Execute
main();
