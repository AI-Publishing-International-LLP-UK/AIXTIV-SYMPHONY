/**
 * Update Aixtiv CLI for Domain Management
 * 
 * This script updates the Aixtiv CLI to support bulk domain updates
 * for Firebase hosting configuration.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  aixtivCliPath: path.join(__dirname, 'aixtiv-cli'),
  godaddyCredentialsPath: path.join(__dirname, '.godaddy-credentials.json'),
  logPath: path.join(__dirname, 'aixtiv-cli-update.log')
};

// Logger
const logger = {
  log: function(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    fs.appendFileSync(CONFIG.logPath, logMessage + '\n');
  },
  error: function(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ERROR: ${message}`;
    console.error(logMessage);
    fs.appendFileSync(CONFIG.logPath, logMessage + '\n');
  }
};

// Initialize log file
fs.writeFileSync(CONFIG.logPath, `=== Aixtiv CLI Update for Domain Management (${new Date().toISOString()}) ===\n\n`);

// Check if aixtiv-cli directory exists
const checkCliDirectory = () => {
  if (!fs.existsSync(CONFIG.aixtivCliPath)) {
    logger.error(`Aixtiv CLI directory not found at ${CONFIG.aixtivCliPath}`);
    return false;
  }
  return true;
};

// Create domain management command
const createDomainCommand = () => {
  const commandPath = path.join(CONFIG.aixtivCliPath, 'commands', 'domain.js');
  
  logger.log(`Creating domain management command at ${commandPath}...`);
  
  // Create commands directory if it doesn't exist
  const commandsDir = path.dirname(commandPath);
  if (!fs.existsSync(commandsDir)) {
    fs.mkdirSync(commandsDir, { recursive: true });
  }
  
  const commandContent = `/**
 * Domain management commands for Aixtiv CLI
 */

const { Command } = require('commander');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Domain command
const domainCommand = new Command('domain')
  .description('Manage domains for Aixtiv projects');

// Bulk update command
domainCommand
  .command('update-firebase')
  .description('Update all domains to point to Firebase hosting')
  .option('-e, --exclude <domains>', 'Comma-separated list of domains to exclude')
  .option('-v, --verify', 'Verify DNS records after update')
  .option('-c, --credentials <path>', 'Path to GoDaddy credentials file')
  .action(async (options) => {
    const scriptPath = path.join(__dirname, '..', '..', 'bulk-update-domains.js');
    
    // Build command
    let command = \`node \${scriptPath}\`;
    
    // Add verification if requested
    if (options.verify) {
      command += ' --verify';
    }
    
    // Run command
    console.log('Running bulk domain update...');
    try {
      execSync(command, { stdio: 'inherit' });
      console.log('Bulk domain update completed successfully.');
    } catch (error) {
      console.error('Error running bulk domain update:', error.message);
      process.exit(1);
    }
  });

// Firebase connection command
domainCommand
  .command('connect-firebase')
  .description('Connect domain to Firebase hosting')
  .argument('<domain>', 'Domain to connect')
  .option('-p, --project <project>', 'Firebase project ID', 'api-for-warp-drive')
  .option('-s, --site <site>', 'Firebase site name')
  .action(async (domain, options) => {
    // Ensure gcloud and firebase CLI are available
    try {
      execSync('which gcloud firebase', { stdio: 'ignore' });
    } catch (error) {
      console.error('Error: gcloud and/or firebase CLI not found');
      console.error('Please install them and try again');
      process.exit(1);
    }
    
    // Set project
    console.log(\`Setting Firebase project to \${options.project}...\`);
    execSync(\`firebase use \${options.project}\`, { stdio: 'inherit' });
    
    // Connect domain
    console.log(\`Connecting \${domain} to Firebase hosting...\`);
    
    const siteName = options.site || domain.replace(/[^a-z0-9]/g, '-');
    
    try {
      execSync(\`firebase hosting:sites:create \${siteName}\`, { stdio: 'inherit' });
    } catch (error) {
      console.log('Site may already exist, continuing...');
    }
    
    try {
      execSync(\`firebase hosting:channel:deploy production --site \${siteName}\`, { stdio: 'inherit' });
      console.log(\`\nDomain \${domain} connected to Firebase hosting at \${siteName}\`);
      console.log(\`\nNext steps:
1. Get the verification code from Firebase Console
2. Run: aixtiv domain verify \${domain} <verification-code>
3. Wait for DNS propagation (may take 24-48 hours)\`);
    } catch (error) {
      console.error('Error connecting domain to Firebase:', error.message);
      process.exit(1);
    }
  });

// Verify domain command
domainCommand
  .command('verify')
  .description('Add verification TXT record for domain')
  .argument('<domain>', 'Domain to verify')
  .argument('<code>', 'Firebase verification code')
  .option('-c, --credentials <path>', 'Path to GoDaddy credentials file')
  .action(async (domain, code, options) => {
    // Extract domain parts
    const parts = domain.split('.');
    const isSubdomain = parts.length > 2;
    const baseDomain = isSubdomain ? parts.slice(-2).join('.') : domain;
    const subdomain = isSubdomain ? parts.slice(0, -2).join('.') : '@';
    
    // Credentials path
    const credentialsPath = options.credentials || path.join(__dirname, '..', '..', '.godaddy-credentials.json');
    
    if (!fs.existsSync(credentialsPath)) {
      console.error(\`Error: Credentials file not found at \${credentialsPath}\`);
      process.exit(1);
    }
    
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    
    // Create verification script content
    const verifyScript = \`
const axios = require('axios');

// Configuration
const CONFIG = {
  domain: '\${baseDomain}',
  subdomain: '\${subdomain}',
  verificationCode: '\${code}',
  apiKey: '\${credentials.apiKey}',
  apiSecret: '\${credentials.apiSecret}',
  apiUrl: 'https://api.godaddy.com/v1'
};

// Create API client
const client = axios.create({
  baseURL: CONFIG.apiUrl,
  headers: {
    'Authorization': \\\`sso-key \\\${CONFIG.apiKey}:\\\${CONFIG.apiSecret}\\\`,
    'Content-Type': 'application/json'
  }
});

// Add verification TXT record
const addVerificationRecord = async () => {
  try {
    console.log(\\\`Adding TXT verification record for \\\${CONFIG.subdomain}.\\\${CONFIG.domain}...\\\`);
    
    const records = [{
      name: CONFIG.subdomain,
      type: 'TXT',
      data: \\\`firebase=\\\${CONFIG.verificationCode}\\\`,
      ttl: 3600
    }];
    
    await client.put(\\\`/domains/\\\${CONFIG.domain}/records/TXT/\\\${CONFIG.subdomain}\\\`, records);
    
    console.log('TXT verification record added successfully');
    return true;
  } catch (error) {
    console.error('Error adding TXT verification record:', error.message);
    
    if (error.response) {
      console.error('API response:', error.response.data);
    }
    
    return false;
  }
};

// Run the verification
addVerificationRecord()
  .then(success => {
    if (success) {
      console.log(\\\`
Verification record added successfully for \\\${CONFIG.subdomain}.\\\${CONFIG.domain}
The TXT record is: firebase=\\\${CONFIG.verificationCode}

Next steps:
1. Wait for DNS propagation (may take up to 24-48 hours)
2. Complete the verification in Firebase Console
3. Your domain should then be accessible via Firebase hosting
\\\`);
    } else {
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });
\`;
    
    // Create temporary verification script
    const tempScriptPath = path.join(__dirname, '..', '..', 'temp-verify.js');
    fs.writeFileSync(tempScriptPath, verifyScript);
    
    // Run verification script
    try {
      execSync(\`node \${tempScriptPath}\`, { stdio: 'inherit' });
    } catch (error) {
      console.error('Error running verification script:', error.message);
    } finally {
      // Clean up temporary script
      fs.unlinkSync(tempScriptPath);
    }
  });

// Check domain status command
domainCommand
  .command('status')
  .description('Check domain status')
  .argument('<domain>', 'Domain to check')
  .action(async (domain) => {
    console.log(\`Checking status for \${domain}...\`);
    
    // Check DNS
    console.log('Checking DNS records...');
    try {
      execSync(\`dig \${domain}\`, { stdio: 'inherit' });
    } catch (error) {
      console.error('Error checking DNS:', error.message);
    }
    
    // Check TXT records
    console.log('\\nChecking TXT records for domain verification...');
    try {
      execSync(\`dig TXT \${domain}\`, { stdio: 'inherit' });
    } catch (error) {
      console.error('Error checking TXT records:', error.message);
    }
    
    // Check HTTP status
    console.log('\\nChecking HTTP status...');
    try {
      execSync(\`curl -I https://\${domain}\`, { stdio: 'inherit' });
    } catch (error) {
      console.error('Error checking HTTP status:', error.message);
    }
    
    console.log('\\nStatus check completed.');
  });

module.exports = domainCommand;
`;

  fs.writeFileSync(commandPath, commandContent);
  logger.log('Domain management command created successfully.');
};

// Update index.js to include domain command
const updateCliIndex = () => {
  const indexPath = path.join(CONFIG.aixtivCliPath, 'index.js');
  
  if (!fs.existsSync(indexPath)) {
    logger.error(`CLI index file not found at ${indexPath}`);
    return false;
  }
  
  logger.log(`Updating CLI index at ${indexPath}...`);
  
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Check if domain command is already imported
  if (indexContent.includes('require(\'./commands/domain\')')) {
    logger.log('Domain command already imported in index.js');
    return true;
  }
  
  // Add domain command import
  const importPattern = /const program = new Command\(\);/;
  const newImport = 'const program = new Command();\nconst domainCommand = require(\'./commands/domain\');';
  indexContent = indexContent.replace(importPattern, newImport);
  
  // Add domain command to program
  const addCommandPattern = /program\.version\(([^)]+)\);/;
  const newAddCommand = `program.version($1);\nprogram.addCommand(domainCommand);`;
  indexContent = indexContent.replace(addCommandPattern, newAddCommand);
  
  fs.writeFileSync(indexPath, indexContent);
  logger.log('CLI index updated successfully.');
  return true;
};

// Update package.json to add required dependencies
const updatePackageJson = () => {
  const packagePath = path.join(CONFIG.aixtivCliPath, 'package.json');
  
  if (!fs.existsSync(packagePath)) {
    logger.error(`Package.json not found at ${packagePath}`);
    return false;
  }
  
  logger.log(`Updating package.json at ${packagePath}...`);
  
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  // Add required dependencies
  const requiredDeps = {
    'axios': '^1.3.4',
    'commander': '^10.0.0',
    'dotenv': '^16.0.3'
  };
  
  let depsChanged = false;
  
  for (const [dep, version] of Object.entries(requiredDeps)) {
    if (!packageJson.dependencies[dep]) {
      packageJson.dependencies[dep] = version;
      depsChanged = true;
    }
  }
  
  if (depsChanged) {
    fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
    logger.log('Package.json updated with required dependencies.');
  } else {
    logger.log('Package.json already has all required dependencies.');
  }
  
  return true;
};

// Install dependencies
const installDependencies = () => {
  logger.log('Installing dependencies for Aixtiv CLI...');
  
  try {
    execSync('cd ' + CONFIG.aixtivCliPath + ' && npm install', {
      stdio: 'inherit'
    });
    logger.log('Dependencies installed successfully.');
    return true;
  } catch (error) {
    logger.error(`Error installing dependencies: ${error.message}`);
    return false;
  }
};

// Create a symlink to the bulk-update-domains.js script in the aixtiv-cli directory
const createScriptSymlink = () => {
  const sourcePath = path.join(__dirname, 'bulk-update-domains.js');
  const targetPath = path.join(CONFIG.aixtivCliPath, 'scripts', 'bulk-update-domains.js');
  
  // Create scripts directory if it doesn't exist
  const scriptsDir = path.dirname(targetPath);
  if (!fs.existsSync(scriptsDir)) {
    fs.mkdirSync(scriptsDir, { recursive: true });
  }
  
  // Copy script to aixtiv-cli scripts directory
  logger.log(`Copying bulk-update-domains.js to ${targetPath}...`);
  fs.copyFileSync(sourcePath, targetPath);
  logger.log('Script copied successfully.');
  
  return true;
};

// Copy GoDaddy credentials to aixtiv-cli directory
const copyCredentials = () => {
  if (!fs.existsSync(CONFIG.godaddyCredentialsPath)) {
    logger.error(`GoDaddy credentials not found at ${CONFIG.godaddyCredentialsPath}`);
    return false;
  }
  
  const targetPath = path.join(CONFIG.aixtivCliPath, '.godaddy-credentials.json');
  
  logger.log(`Copying GoDaddy credentials to ${targetPath}...`);
  fs.copyFileSync(CONFIG.godaddyCredentialsPath, targetPath);
  logger.log('Credentials copied successfully.');
  
  return true;
};

// Main function
const main = async () => {
  logger.log('=== Updating Aixtiv CLI for Domain Management ===');
  
  // Check if aixtiv-cli directory exists
  if (!checkCliDirectory()) {
    logger.error('Aixtiv CLI directory not found, aborting update.');
    return;
  }
  
  // Create domain management command
  createDomainCommand();
  
  // Update CLI index.js
  updateCliIndex();
  
  // Update package.json
  updatePackageJson();
  
  // Install dependencies
  installDependencies();
  
  // Create script symlink
  createScriptSymlink();
  
  // Copy credentials
  copyCredentials();
  
  logger.log('\n=== Aixtiv CLI Update Completed ===');
  logger.log('The CLI now supports the following commands:');
  logger.log('  aixtiv domain update-firebase  - Update all domains to point to Firebase hosting');
  logger.log('  aixtiv domain connect-firebase - Connect a domain to Firebase hosting');
  logger.log('  aixtiv domain verify           - Add verification TXT record for a domain');
  logger.log('  aixtiv domain status           - Check domain status');
  logger.log('\nExample usage:');
  logger.log('  aixtiv domain update-firebase --exclude=philliproark.com,byfabriziodesign.com,kennedypartain.com,2100.group,fabriziosassano.com');
  logger.log('  aixtiv domain connect-firebase example.com --project=api-for-warp-drive');
  logger.log('  aixtiv domain verify example.com ABC123VERIFICATIONCODE');
  logger.log('  aixtiv domain status example.com');
};

// Run main function
main();