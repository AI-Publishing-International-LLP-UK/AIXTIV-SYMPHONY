/**
 * Schedule Domain Automation
 * 
 * This script sets up scheduled jobs to automatically update DNS and connect domains to Firebase.
 * It can be run as a cron job or using a scheduling library like node-cron.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const cron = require('node-cron');

// Configuration
const CONFIG = {
  scripts: {
    updateDns: path.join(__dirname, 'update-all-domains-firebase.js'),
    connectDomains: path.join(__dirname, 'connect-all-domains-firebase.js')
  },
  
  // Schedule settings (cron format)
  schedule: {
    updateDns: '0 2 * * *',      // Run DNS update at 2 AM every day
    connectDomains: '0 4 * * *'  // Run domain connection at 4 AM every day
  },
  
  // Logs directory
  logsDir: path.join(__dirname, 'automation-logs')
};

// Ensure logs directory exists
if (!fs.existsSync(CONFIG.logsDir)) {
  fs.mkdirSync(CONFIG.logsDir, { recursive: true });
}

// Logger function
function log(message) {
  const timestamp = new Date().toISOString();
  const formattedMessage = `[${timestamp}] ${message}`;
  
  console.log(formattedMessage);
  
  // Also append to log file
  const logFile = path.join(CONFIG.logsDir, `scheduler-${new Date().toISOString().slice(0, 10)}.log`);
  fs.appendFileSync(logFile, formattedMessage + '\n');
}

// Run a script and capture output
function runScript(scriptPath) {
  return new Promise((resolve, reject) => {
    log(`Running script: ${scriptPath}`);
    
    // Create log file for this script run
    const scriptName = path.basename(scriptPath, '.js');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputFile = path.join(CONFIG.logsDir, `${scriptName}-${timestamp}.log`);
    const outputStream = fs.createWriteStream(outputFile);
    
    log(`Logging output to: ${outputFile}`);
    
    // Start the script process
    const process = spawn('node', [scriptPath]);
    
    // Capture output
    process.stdout.pipe(outputStream);
    process.stderr.pipe(outputStream);
    
    // Handle process completion
    process.on('close', (code) => {
      if (code === 0) {
        log(`Script ${scriptPath} completed successfully.`);
        resolve({ success: true, outputFile });
      } else {
        log(`Script ${scriptPath} failed with code ${code}.`);
        resolve({ success: false, code, outputFile });
      }
    });
    
    // Handle process error
    process.on('error', (error) => {
      log(`Error running script ${scriptPath}: ${error.message}`);
      reject(error);
    });
  });
}

// Schedule DNS update job
function scheduleDnsUpdate() {
  log(`Scheduling DNS update job: ${CONFIG.schedule.updateDns}`);
  
  cron.schedule(CONFIG.schedule.updateDns, async () => {
    log('Running scheduled DNS update job.');
    try {
      const result = await runScript(CONFIG.scripts.updateDns);
      log(`DNS update job ${result.success ? 'succeeded' : 'failed'}. Output logged to ${result.outputFile}`);
    } catch (error) {
      log(`Error in DNS update job: ${error.message}`);
    }
  });
}

// Schedule domain connection job
function scheduleDomainConnection() {
  log(`Scheduling domain connection job: ${CONFIG.schedule.connectDomains}`);
  
  cron.schedule(CONFIG.schedule.connectDomains, async () => {
    log('Running scheduled domain connection job.');
    try {
      const result = await runScript(CONFIG.scripts.connectDomains);
      log(`Domain connection job ${result.success ? 'succeeded' : 'failed'}. Output logged to ${result.outputFile}`);
    } catch (error) {
      log(`Error in domain connection job: ${error.message}`);
    }
  });
}

// Run scripts immediately if requested
async function runScriptsNow() {
  if (process.argv.includes('--run-now')) {
    log('Running scripts immediately as requested.');
    
    try {
      log('Running DNS update...');
      const dnsResult = await runScript(CONFIG.scripts.updateDns);
      log(`DNS update ${dnsResult.success ? 'succeeded' : 'failed'}. Output logged to ${dnsResult.outputFile}`);
      
      log('Running domain connection...');
      const connectionResult = await runScript(CONFIG.scripts.connectDomains);
      log(`Domain connection ${connectionResult.success ? 'succeeded' : 'failed'}. Output logged to ${connectionResult.outputFile}`);
    } catch (error) {
      log(`Error running scripts: ${error.message}`);
    }
  }
}

// Main function
async function main() {
  log('=== Domain Automation Scheduler Started ===');
  
  // Run scripts immediately if requested
  await runScriptsNow();
  
  // Schedule jobs
  scheduleDnsUpdate();
  scheduleDomainConnection();
  
  log('All jobs scheduled. Scheduler is running.');
  
  // Keep process alive
  process.stdin.resume();
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('Scheduler stopping due to SIGINT...');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    log('Scheduler stopping due to SIGTERM...');
    process.exit(0);
  });
}

// Run the scheduler
main();