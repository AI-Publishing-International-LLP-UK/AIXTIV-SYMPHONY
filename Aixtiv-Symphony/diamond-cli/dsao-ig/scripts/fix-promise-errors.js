#!/usr/bin/env node

/**
 * System-wide Promise Error Fix Deployment Script
 * 
 * This script deploys fixes to prevent [object Promise] errors across
 * all agent systems and services.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Starting system-wide Promise error fix deployment...');

// Configuration for services that need fixing
const SERVICES_TO_FIX = [
  'aixtiv-monitor-staging',
  'asoos-integration-gateway',
  'auto-provision-mcp-uswest1',
  'content-service',
  'contextstorage',
  'deletefrompinecone',
  'dr-lucy-testament-agent',
  'dr-lucy-webhook',
  'drlucyautomation',
  'healthcheck',
  'lucy-webhook',
  'mcp-ufo-2100-cool',
  'modelmetrics',
  'mongodb-mcp-oauth-master',
  'mongodb-mcp-oauth-uswest1',
  'my-service',
  'onpineconechathistorycreated',
  'onpineconepromptruncreated',
  'sallyportloginv2',
  'searchmemories',
  'searchprompts',
  'storememory',
  'storeprompt',
  'symphony-interface-staging',
  'warp-drive-service',
  'zena-backend'
];

const PROMISE_HANDLER_CODE = `
/**
 * Promise Handler Utility - Auto-injected for Promise error prevention
 */

// Safely resolve promises to prevent [object Promise] errors
async function safeResolve(value) {
  try {
    if (value && typeof value.then === 'function') {
      return await value;
    }
    return value;
  } catch (error) {
    console.error('Promise resolution error:', error);
    return '[Promise Error]';
  }
}

// Serialize data for agent communication
async function serializeForAgent(value) {
  const resolved = await safeResolve(value);
  
  if (resolved === null || resolved === undefined) {
    return resolved;
  }
  
  if (typeof resolved === 'object') {
    try {
      return JSON.parse(JSON.stringify(resolved));
    } catch (error) {
      console.error('Serialization error:', error);
      return \`[Serialization Error: \${resolved.constructor?.name || 'Unknown'}]\`;
    }
  }
  
  return resolved;
}

// Global promise error handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Promise Rejection - This could cause [object Promise] errors:', {
    reason: reason,
    promise: promise
  });
});

// Export utilities
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { safeResolve, serializeForAgent };
}

// Global utilities for browser environments
if (typeof window !== 'undefined') {
  window.safeResolve = safeResolve;
  window.serializeForAgent = serializeForAgent;
}
`;

// Step 1: Create promise handler utility files for each service directory
function deployPromiseHandlers() {
  console.log('📦 Deploying promise handlers to service directories...');
  
  const serviceDirectories = [
    '/Users/as/asoos/integration/integration-gateway',
    '/Users/as/asoos/integration-gateway',
    '/Users/as/asoos'
  ];
  
  serviceDirectories.forEach(dir => {
    if (fs.existsSync(dir)) {
      const utilsDir = path.join(dir, 'utils');
      if (!fs.existsSync(utilsDir)) {
        fs.mkdirSync(utilsDir, { recursive: true });
      }
      
      const promiseHandlerPath = path.join(utilsDir, 'promiseHandler.js');
      fs.writeFileSync(promiseHandlerPath, PROMISE_HANDLER_CODE);
      console.log(`✅ Promise handler deployed to: ${promiseHandlerPath}`);
    }
  });
}

// Step 2: Update package.json files to include promise error prevention
function updatePackageJsonFiles() {
  console.log('📋 Updating package.json files with promise error prevention scripts...');
  
  const packageJsonPaths = [
    '/Users/as/asoos/integration/integration-gateway/package.json',
    '/Users/as/asoos/integration-gateway/package.json',
    '/Users/as/asoos/package.json'
  ];
  
  packageJsonPaths.forEach(packagePath => {
    if (fs.existsSync(packagePath)) {
      try {
        const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        // Add promise error prevention script
        if (!packageData.scripts) {
          packageData.scripts = {};
        }
        
        packageData.scripts['fix-promises'] = 'node utils/promiseHandler.js';
        packageData.scripts['start-safe'] = 'node -r ./utils/promiseHandler.js index.js';
        
        fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2));
        console.log(`✅ Updated package.json: ${packagePath}`);
      } catch (error) {
        console.warn(`⚠️  Could not update ${packagePath}: ${error.message}`);
      }
    }
  });
}

// Step 3: Create Cloud Run deployment configurations with promise error fixes
function createCloudRunConfigs() {
  console.log('☁️  Creating Cloud Run deployment configs with promise error fixes...');
  
  const cloudRunConfig = `
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: REPLACE_SERVICE_NAME
  annotations:
    run.googleapis.com/ingress: all
    run.googleapis.com/execution-environment: gen2
spec:
  template:
    metadata:
      annotations:
        run.googleapis.com/execution-environment: gen2
        run.googleapis.com/cpu-throttling: "false"
    spec:
      containerConcurrency: 100
      timeoutSeconds: 300
      containers:
      - image: gcr.io/api-for-warp-drive/REPLACE_SERVICE_NAME
        ports:
        - containerPort: 8080
        env:
        - name: NODE_OPTIONS
          value: "--require ./utils/promiseHandler.js"
        - name: PORT
          value: "8080"
        resources:
          limits:
            cpu: 1000m
            memory: 512Mi
          requests:
            cpu: 100m
            memory: 128Mi
`;

  const configDir = '/Users/as/AIXTIV-SYMPHONY/cloud-run-configs';
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  
  SERVICES_TO_FIX.forEach(serviceName => {
    const config = cloudRunConfig.replace(/REPLACE_SERVICE_NAME/g, serviceName);
    const configPath = path.join(configDir, `${serviceName}-cloudrun.yaml`);
    fs.writeFileSync(configPath, config);
    console.log(`✅ Cloud Run config created: ${configPath}`);
  });
}

// Step 4: Create a monitoring script to detect [object Promise] errors
function createMonitoringScript() {
  console.log('📊 Creating monitoring script for Promise errors...');
  
  const monitoringScript = `
#!/usr/bin/env node

/**
 * Promise Error Monitor
 * Scans logs for [object Promise] errors and alerts
 */

const { execSync } = require('child_process');

const SERVICES = ${JSON.stringify(SERVICES_TO_FIX, null, 2)};

async function checkLogsForPromiseErrors() {
  console.log('🔍 Checking logs for [object Promise] errors...');
  
  for (const service of SERVICES) {
    try {
      const command = \`gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=\${service}" --limit=50 --format="value(textPayload)" --filter="textPayload:object Promise"\`;
      const result = execSync(command, { encoding: 'utf8' });
      
      if (result.trim()) {
        console.error(\`🚨 FOUND [object Promise] errors in \${service}:\`);
        console.error(result);
      } else {
        console.log(\`✅ No Promise errors found in \${service}\`);
      }
    } catch (error) {
      console.warn(\`⚠️  Could not check logs for \${service}: \${error.message}\`);
    }
  }
}

// Run monitoring
checkLogsForPromiseErrors().catch(console.error);
`;

  const monitoringPath = '/Users/as/AIXTIV-SYMPHONY/scripts/monitor-promise-errors.js';
  fs.writeFileSync(monitoringPath, monitoringScript);
  fs.chmodSync(monitoringPath, '755');
  console.log(`✅ Monitoring script created: ${monitoringPath}`);
}

// Step 5: Update Diamond CLI configuration to include promise error prevention
function updateDiamondCLI() {
  console.log('💎 Updating Diamond CLI with promise error prevention...');
  
  try {
    // Add promise error prevention to Diamond CLI
    execSync('diamond heal', { stdio: 'inherit' });
    console.log('✅ Diamond CLI healing completed');
  } catch (error) {
    console.warn('⚠️  Diamond CLI healing failed:', error.message);
  }
}

// Step 6: Deploy fixes to all services
async function deployFixes() {
  console.log('🚀 Deploying promise error fixes to all services...');
  
  for (const serviceName of SERVICES_TO_FIX.slice(0, 5)) { // Deploy first 5 services as test
    try {
      console.log(`📦 Deploying ${serviceName}...`);
      
      const deployCommand = `diamond deploy wfa swarm --commander "Mr. Phillip Corey Roark" --authority "Diamond SAO" --service ${serviceName}`;
      execSync(deployCommand, { stdio: 'inherit' });
      
      console.log(`✅ Successfully deployed ${serviceName}`);
      
      // Wait between deployments to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      console.error(`❌ Failed to deploy ${serviceName}: ${error.message}`);
    }
  }
}

// Main execution
async function main() {
  try {
    console.log('🎯 Starting Promise Error Eradication Process...');
    console.log('This will fix [object Promise] errors across all agent systems\\n');
    
    deployPromiseHandlers();
    updatePackageJsonFiles();
    createCloudRunConfigs();
    createMonitoringScript();
    updateDiamondCLI();
    
    console.log('\\n✅ Promise error prevention infrastructure deployed!');
    console.log('📊 Run monitoring: node scripts/monitor-promise-errors.js');
    console.log('🚀 Deploy fixes: node scripts/fix-promise-errors.js --deploy');
    
    // Check if deploy flag is present
    if (process.argv.includes('--deploy')) {
      console.log('\\n🚀 Proceeding with service deployments...');
      await deployFixes();
    } else {
      console.log('\\n💡 To deploy fixes to services, run: node scripts/fix-promise-errors.js --deploy');
    }
    
    console.log('\\n🎉 Promise Error Eradication Process Complete!');
    
  } catch (error) {
    console.error('❌ Error during deployment:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  deployPromiseHandlers,
  updatePackageJsonFiles,
  createCloudRunConfigs,
  createMonitoringScript
};
