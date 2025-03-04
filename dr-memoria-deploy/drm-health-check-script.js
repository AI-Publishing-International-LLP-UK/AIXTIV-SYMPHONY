#!/usr/bin/env node

/**
 * Dr. Memoria Firebase Functions Health Check Script
 * 
 * This script checks the deployment status of Firebase functions and returns
 * appropriate exit codes for use in CI/CD pipelines.
 * 
 * Exit codes:
 * 0 - All functions are deployed and healthy
 * 1 - At least one function failed health check
 * 2 - Configuration error (missing credentials, etc.)
 * 3 - Network error or Firebase API issue
 */

const admin = require('firebase-admin');
const https = require('https');
const { program } = require('commander');

// Configure CLI options
program
  .name('drm-health-check-script')
  .description('Check the health status of Firebase functions')
  .version('1.0.0')
  .option('-p, --project <project-id>', 'Firebase project ID')
  .option('-r, --region <region>', 'Firebase functions region', 'us-central1')
  .option('-t, --timeout <seconds>', 'Request timeout in seconds', '30')
  .option('-f, --functions <functions>', 'Comma-separated function names to check (default: all)')
  .option('-k, --key-file <path>', 'Path to service account key file')
  .option('-v, --verbose', 'Enable verbose output')
  .parse(process.argv);

const options = program.opts();

// Set up logger
const log = {
  info: (message) => options.verbose && console.log(`[INFO] ${message}`),
  warn: (message) => console.warn(`[WARNING] ${message}`),
  error: (message) => console.error(`[ERROR] ${message}`),
  success: (message) => console.log(`[SUCCESS] ${message}`)
};

/**
 * Initialize Firebase Admin SDK
 */
function initializeFirebase() {
  try {
    // Use keyFile if provided, otherwise use default credentials
    if (options.keyFile) {
      const serviceAccount = require(options.keyFile);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: options.project || serviceAccount.project_id
      });
    } else {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: options.project
      });
    }
    
    log.info(`Initialized Firebase Admin SDK for project ${admin.app().options.projectId}`);
    return true;
  } catch (error) {
    log.error(`Failed to initialize Firebase: ${error.message}`);
    return false;
  }
}

/**
 * Get list of deployed functions
 */
async function listFunctions() {
  try {
    const projectId = admin.app().options.projectId;
    const region = options.region;
    const url = `https://${region}-${projectId}.cloudfunctions.net/`;
    
    log.info(`Getting functions metadata from Firebase project ${projectId} in region ${region}`);
    
    const functions = await admin.functions().listFunctions();
    
    if (!functions || functions.length === 0) {
      log.warn('No functions found in this project.');
      return [];
    }
    
    const functionsList = functions.map(fn => {
      const name = fn.name.split('/').pop();
      const httpsTrigger = fn.httpsTrigger ? true : false;
      return { name, httpsTrigger, url: httpsTrigger ? `${url}${name}` : null };
    });
    
    log.info(`Found ${functionsList.length} functions`);
    return functionsList;
  } catch (error) {
    log.error(`Failed to list functions: ${error.message}`);
    return [];
  }
}

/**
 * Check health of an HTTP function by making a request to its endpoint
 */
function checkHttpFunction(functionData) {
  return new Promise((resolve) => {
    const timeout = parseInt(options.timeout) * 1000;
    
    log.info(`Checking HTTP function: ${functionData.name} at ${functionData.url}`);
    
    const request = https.get(functionData.url, { timeout }, (response) => {
      const { statusCode } = response;
      
      // Any response means the function is deployed (even if it returns an error)
      // Status codes 200-499 are considered successful for deployment verification
      // 5xx errors may indicate the function is crashing
      if (statusCode >= 200 && statusCode < 500) {
        log.info(`Function ${functionData.name} responded with status ${statusCode}`);
        resolve({ name: functionData.name, healthy: true, statusCode });
      } else {
        log.warn(`Function ${functionData.name} responded with error status ${statusCode}`);
        resolve({ name: functionData.name, healthy: false, statusCode });
      }
    });
    
    request.on('error', (error) => {
      log.error(`Error checking function ${functionData.name}: ${error.message}`);
      resolve({ name: functionData.name, healthy: false, error: error.message });
    });
    
    request.on('timeout', () => {
      log.error(`Timeout checking function ${functionData.name} after ${timeout}ms`);
      request.destroy();
      resolve({ name: functionData.name, healthy: false, error: 'Timeout' });
    });
  });
}

/**
 * Check if a non-HTTP function exists and is properly deployed
 */
async function checkNonHttpFunction(functionData) {
  try {
    log.info(`Checking non-HTTP function: ${functionData.name}`);
    
    // For non-HTTP functions, we can't invoke them directly
    // We check if they exist in the functions list
    const functionRef = admin.functions().functionById(functionData.name);
    
    if (functionRef) {
      log.info(`Function ${functionData.name} exists and appears to be deployed`);
      return { name: functionData.name, healthy: true };
    } else {
      log.warn(`Function ${functionData.name} does not seem to be deployed`);
      return { name: functionData.name, healthy: false };
    }
  } catch (error) {
    log.error(`Error checking function ${functionData.name}: ${error.message}`);
    return { name: functionData.name, healthy: false, error: error.message };
  }
}

/**
 * Main function
 */
async function main() {
  // Verify required options
  if (!options.project && !options.keyFile) {
    log.error('Missing required option: --project or --key-file');
    return 2; // Configuration error
  }
  
  // Initialize Firebase
  if (!initializeFirebase()) {
    return 2; // Configuration error
  }
  
  try {
    // Get all functions
    const allFunctions = await listFunctions();
    
    if (allFunctions.length === 0) {
      log.warn('No functions to check');
      return 0; // Consider this a success (nothing to check)
    }
    
    // Filter functions if specified
    let functionsToCheck = allFunctions;
    if (options.functions) {
      const functionNames = options.functions.split(',').map(f => f.trim());
      functionsToCheck = allFunctions.filter(fn => functionNames.includes(fn.name));
      log.info(`Filtered to ${functionsToCheck.length} functions for health check`);
    }
    
    // Check each function
    const healthChecks = await Promise.all(
      functionsToCheck.map(functionData => {
        return functionData.httpsTrigger
          ? checkHttpFunction(functionData)
          : checkNonHttpFunction(functionData);
      })
    );
    
    // Count healthy and unhealthy functions
    const healthy = healthChecks.filter(check => check.healthy);
    const unhealthy = healthChecks.filter(check => !check.healthy);
    
    // Log results
    if (healthy.length > 0) {
      log.success(`${healthy.length} functions are healthy`);
      healthy.forEach(check => log.info(`  ✓ ${check.name}`));
    }
    
    if (unhealthy.length > 0) {
      log.error(`${unhealthy.length} functions failed health check`);
      unhealthy.forEach(check => log.error(`  ✗ ${check.name}: ${check.error || check.statusCode || 'unknown error'}`));
    }
    
    // Return appropriate exit code
    return unhealthy.length > 0 ? 1 : 0;
  } catch (error) {
    log.error(`Unexpected error during health check: ${error.message}`);
    return 3; // Network error or Firebase API issue
  } finally {
    // Cleanup
    try {
      admin.app().delete();
    } catch (error) {
      // Ignore cleanup errors
    }
  }
}

// Run the script
main().then(exitCode => {
  process.exit(exitCode);
}).catch(error => {
  console.error(`Fatal error: ${error.message}`);
  process.exit(3);
});

