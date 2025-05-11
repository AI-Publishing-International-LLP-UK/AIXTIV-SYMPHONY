/**
 * Dr. Claude Orchestrator
 * OAuth 2.0 Authentication Fix for Aixtiv Symphony
 * 
 * This script resolves authentication issues by refreshing OAuth tokens
 * and ensuring proper authorization for Firebase and Google Cloud services.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
  PROJECT_ID: 'api-for-warp-drive',
  AUTH_CONFIG_FILE: path.join(process.env.HOME, '.config', 'gcloud', 'application_default_credentials.json'),
  BACKUP_DIR: path.join(__dirname, 'backups', 'auth'),
  FIREBASE_RC_FILE: path.join(__dirname, '.firebaserc'),
  SERVICE_ACCOUNT_KEY: path.join(__dirname, 'service-account-key.json'),
};

// Ensure backup directory exists
if (!fs.existsSync(CONFIG.BACKUP_DIR)) {
  fs.mkdirSync(CONFIG.BACKUP_DIR, { recursive: true });
}

// Helper for formatted logging
function log(message, type = 'info') {
  const prefix = {
    info: '[ INFO ]',
    error: '[ERROR ]',
    success: '[  OK  ]',
    warning: '[ WARN ]'
  }[type] || '[ INFO ]';
  
  console.log(`${prefix} ${message}`);
}

/**
 * Check Firebase authentication status
 */
function checkFirebaseAuth() {
  try {
    const result = execSync('firebase projects:list --json', { encoding: 'utf8' });
    const projects = JSON.parse(result);
    
    if (projects && projects.length > 0) {
      log('Firebase CLI is properly authenticated', 'success');
      return true;
    } else {
      log('Firebase CLI authenticated but no projects found', 'warning');
      return false;
    }
  } catch (error) {
    log(`Firebase authentication failed: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Check Google Cloud authentication
 */
function checkGcloudAuth() {
  try {
    const result = execSync('gcloud auth list --format=json', { encoding: 'utf8' });
    const accounts = JSON.parse(result);
    
    if (accounts && accounts.length > 0) {
      const activeAccount = accounts.find(a => a.status === 'ACTIVE');
      if (activeAccount) {
        log(`Google Cloud authenticated as ${activeAccount.account}`, 'success');
        return true;
      } else {
        log('Google Cloud has accounts but none are active', 'warning');
        return false;
      }
    } else {
      log('No Google Cloud accounts found', 'warning');
      return false;
    }
  } catch (error) {
    log(`Google Cloud authentication failed: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Backup authentication files
 */
function backupAuthFiles() {
  const timestamp = new Date().toISOString().replace(/[:\.]/g, '-');
  
  try {
    // Backup application default credentials if exists
    if (fs.existsSync(CONFIG.AUTH_CONFIG_FILE)) {
      const backupPath = path.join(CONFIG.BACKUP_DIR, `adc_${timestamp}.json`);
      fs.copyFileSync(CONFIG.AUTH_CONFIG_FILE, backupPath);
      log(`Backed up application default credentials to ${backupPath}`, 'success');
    }
    
    // Backup .firebaserc if exists
    if (fs.existsSync(CONFIG.FIREBASE_RC_FILE)) {
      const backupPath = path.join(CONFIG.BACKUP_DIR, `firebaserc_${timestamp}.json`);
      fs.copyFileSync(CONFIG.FIREBASE_RC_FILE, backupPath);
      log(`Backed up .firebaserc to ${backupPath}`, 'success');
    }
    
    // Backup service account key if exists
    if (fs.existsSync(CONFIG.SERVICE_ACCOUNT_KEY)) {
      const backupPath = path.join(CONFIG.BACKUP_DIR, `service_account_${timestamp}.json`);
      fs.copyFileSync(CONFIG.SERVICE_ACCOUNT_KEY, backupPath);
      log(`Backed up service account key to ${backupPath}`, 'success');
    }
    
    return true;
  } catch (error) {
    log(`Failed to backup authentication files: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Refresh OAuth tokens
 */
function refreshOAuthTokens() {
  try {
    log('Refreshing OAuth tokens...');
    
    // Login to gcloud
    execSync('gcloud auth login --no-launch-browser', { stdio: 'inherit' });
    
    // Create application default credentials
    execSync('gcloud auth application-default login --no-launch-browser', { stdio: 'inherit' });
    
    // Login to Firebase
    execSync('firebase login --no-localhost', { stdio: 'inherit' });
    
    log('OAuth tokens refreshed successfully', 'success');
    return true;
  } catch (error) {
    log(`Failed to refresh OAuth tokens: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Configure service account authentication
 */
function configureServiceAccount() {
  try {
    log('Checking for service account key...');
    
    if (!fs.existsSync(CONFIG.SERVICE_ACCOUNT_KEY)) {
      log('Service account key not found, creating new key...', 'warning');
      
      // Create directory if it doesn't exist
      const dir = path.dirname(CONFIG.SERVICE_ACCOUNT_KEY);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      // Create service account
      const serviceAccountName = 'dr-claude-orchestrator';
      execSync(`gcloud iam service-accounts create ${serviceAccountName} --display-name="Dr. Claude Orchestrator" --project=${CONFIG.PROJECT_ID}`, { stdio: 'inherit' });
      
      // Grant roles
      execSync(`gcloud projects add-iam-policy-binding ${CONFIG.PROJECT_ID} --member="serviceAccount:${serviceAccountName}@${CONFIG.PROJECT_ID}.iam.gserviceaccount.com" --role="roles/firebase.admin"`, { stdio: 'inherit' });
      execSync(`gcloud projects add-iam-policy-binding ${CONFIG.PROJECT_ID} --member="serviceAccount:${serviceAccountName}@${CONFIG.PROJECT_ID}.iam.gserviceaccount.com" --role="roles/firebase.hostingAdmin"`, { stdio: 'inherit' });
      
      // Create key
      execSync(`gcloud iam service-accounts keys create ${CONFIG.SERVICE_ACCOUNT_KEY} --iam-account=${serviceAccountName}@${CONFIG.PROJECT_ID}.iam.gserviceaccount.com`, { stdio: 'inherit' });
    }
    
    // Activate service account
    execSync(`gcloud auth activate-service-account --key-file=${CONFIG.SERVICE_ACCOUNT_KEY}`, { stdio: 'inherit' });
    
    // Set environment variable
    process.env.GOOGLE_APPLICATION_CREDENTIALS = CONFIG.SERVICE_ACCOUNT_KEY;
    console.log(`export GOOGLE_APPLICATION_CREDENTIALS="${CONFIG.SERVICE_ACCOUNT_KEY}"`);
    
    log('Service account configured successfully', 'success');
    return true;
  } catch (error) {
    log(`Failed to configure service account: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Set up Firebase project configuration
 */
function setupFirebaseProject() {
  try {
    log('Setting up Firebase project configuration...');
    
    // Create .firebaserc if it doesn't exist
    if (!fs.existsSync(CONFIG.FIREBASE_RC_FILE)) {
      const config = {
        projects: {
          default: CONFIG.PROJECT_ID
        }
      };
      
      fs.writeFileSync(CONFIG.FIREBASE_RC_FILE, JSON.stringify(config, null, 2));
      log('Created .firebaserc file', 'success');
    } else {
      // Update existing .firebaserc
      const config = JSON.parse(fs.readFileSync(CONFIG.FIREBASE_RC_FILE, 'utf8'));
      config.projects.default = CONFIG.PROJECT_ID;
      fs.writeFileSync(CONFIG.FIREBASE_RC_FILE, JSON.stringify(config, null, 2));
      log('Updated .firebaserc file', 'success');
    }
    
    return true;
  } catch (error) {
    log(`Failed to set up Firebase project configuration: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Test authentication by running a sample command
 */
function testAuthentication() {
  try {
    log('Testing authentication...');
    
    // Test gcloud
    execSync('gcloud projects describe api-for-warp-drive --format=json', { stdio: 'pipe' });
    log('Google Cloud authentication successful', 'success');
    
    // Test Firebase
    execSync('firebase projects:list --json', { stdio: 'pipe' });
    log('Firebase authentication successful', 'success');
    
    return true;
  } catch (error) {
    log(`Authentication test failed: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Generate authentication report
 */
function generateAuthReport() {
  const reportFile = path.join(CONFIG.BACKUP_DIR, `auth_report_${new Date().toISOString().replace(/[:\.]/g, '-')}.txt`);
  
  try {
    let report = '============================================\n';
    report += '    Dr. Claude Orchestrator Auth Report      \n';
    report += '============================================\n\n';
    
    // Firebase CLI version
    try {
      const firebaseVersion = execSync('firebase --version', { encoding: 'utf8' }).trim();
      report += `Firebase CLI Version: ${firebaseVersion}\n`;
    } catch (e) {
      report += 'Firebase CLI Version: Not installed or not in PATH\n';
    }
    
    // gcloud CLI version
    try {
      const gcloudVersion = execSync('gcloud --version', { encoding: 'utf8' }).split('\n')[0];
      report += `${gcloudVersion}\n`;
    } catch (e) {
      report += 'gcloud CLI: Not installed or not in PATH\n';
    }
    
    // Node.js version
    try {
      const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
      report += `Node.js Version: ${nodeVersion}\n`;
    } catch (e) {
      report += 'Node.js Version: Not installed or not in PATH\n';
    }
    
    report += '\n============================================\n';
    report += 'Authentication Status\n';
    report += '============================================\n\n';
    
    // Firebase auth status
    try {
      const firebaseProjects = JSON.parse(execSync('firebase projects:list --json', { encoding: 'utf8' }));
      report += `Firebase: Authenticated (${firebaseProjects.length} projects available)\n`;
      firebaseProjects.forEach(project => {
        report += `  - ${project.projectId}: ${project.displayName}\n`;
      });
    } catch (e) {
      report += 'Firebase: Not authenticated\n';
    }
    
    // gcloud auth status
    try {
      const gcloudAuth = JSON.parse(execSync('gcloud auth list --format=json', { encoding: 'utf8' }));
      const activeAccount = gcloudAuth.find(a => a.status === 'ACTIVE');
      if (activeAccount) {
        report += `gcloud: Authenticated as ${activeAccount.account}\n`;
      } else {
        report += 'gcloud: No active account\n';
      }
    } catch (e) {
      report += 'gcloud: Not authenticated\n';
    }
    
    // Service account
    if (fs.existsSync(CONFIG.SERVICE_ACCOUNT_KEY)) {
      const key = JSON.parse(fs.readFileSync(CONFIG.SERVICE_ACCOUNT_KEY, 'utf8'));
      report += `Service Account: ${key.client_email}\n`;
    } else {
      report += 'Service Account: No key file found\n';
    }
    
    // Application default credentials
    if (fs.existsSync(CONFIG.AUTH_CONFIG_FILE)) {
      report += 'Application Default Credentials: Configured\n';
    } else {
      report += 'Application Default Credentials: Not configured\n';
    }
    
    // Write report to file
    fs.writeFileSync(reportFile, report);
    log(`Authentication report saved to ${reportFile}`, 'success');
    console.log('\n' + report);
    
    return true;
  } catch (error) {
    log(`Failed to generate authentication report: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Main function
 */
function main() {
  console.log('\n============================================');
  console.log('  Dr. Claude Orchestrator - OAuth 2.0 Fix  ');
  console.log('============================================\n');
  
  // Step 1: Check current authentication status
  log('Step 1: Checking current authentication status');
  const firebaseAuthOk = checkFirebaseAuth();
  const gcloudAuthOk = checkGcloudAuth();
  
  // Step 2: Backup authentication files
  log('\nStep 2: Backing up authentication files');
  backupAuthFiles();
  
  // Step 3: Refresh OAuth tokens if needed
  if (!firebaseAuthOk || !gcloudAuthOk) {
    log('\nStep 3: Refreshing OAuth tokens');
    refreshOAuthTokens();
  } else {
    log('\nStep 3: Skipping OAuth token refresh (already authenticated)', 'success');
  }
  
  // Step 4: Configure service account authentication
  log('\nStep 4: Configuring service account authentication');
  configureServiceAccount();
  
  // Step 5: Set up Firebase project configuration
  log('\nStep 5: Setting up Firebase project configuration');
  setupFirebaseProject();
  
  // Step 6: Test authentication
  log('\nStep 6: Testing authentication');
  testAuthentication();
  
  // Step 7: Generate authentication report
  log('\nStep 7: Generating authentication report');
  generateAuthReport();
  
  console.log('\n============================================');
  console.log('  OAuth 2.0 Authentication Fix Complete!   ');
  console.log('============================================\n');
  
  console.log('To use the new authentication settings in your current terminal session, run:');
  console.log(`export GOOGLE_APPLICATION_CREDENTIALS="${CONFIG.SERVICE_ACCOUNT_KEY}"`);
  console.log('\nVerify that authentication is working:');
  console.log('firebase projects:list');
  console.log('gcloud projects list');
}

// Run the main function
main();