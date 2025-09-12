
#!/usr/bin/env node

/**
 * Promise Error Monitor
 * Scans logs for [object Promise] errors and alerts
 */

const { execSync } = require('child_process');

const SERVICES = [
  "aixtiv-monitor-staging",
  "asoos-integration-gateway",
  "auto-provision-mcp-uswest1",
  "content-service",
  "contextstorage",
  "deletefrompinecone",
  "dr-lucy-testament-agent",
  "dr-lucy-webhook",
  "drlucyautomation",
  "healthcheck",
  "lucy-webhook",
  "mcp-ufo-2100-cool",
  "modelmetrics",
  "mongodb-mcp-oauth-master",
  "mongodb-mcp-oauth-uswest1",
  "my-service",
  "onpineconechathistorycreated",
  "onpineconepromptruncreated",
  "sallyportloginv2",
  "searchmemories",
  "searchprompts",
  "storememory",
  "storeprompt",
  "symphony-interface-staging",
  "warp-drive-service",
  "zena-backend"
];

async function checkLogsForPromiseErrors() {
  console.log('🔍 Checking logs for [object Promise] errors...');
  
  for (const service of SERVICES) {
    try {
      const command = `gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=${service}" --limit=50 --format="value(textPayload)" --filter="textPayload:object Promise"`;
      const result = execSync(command, { encoding: 'utf8' });
      
      if (result.trim()) {
        console.error(`🚨 FOUND [object Promise] errors in ${service}:`);
        console.error(result);
      } else {
        console.log(`✅ No Promise errors found in ${service}`);
      }
    } catch (error) {
      console.warn(`⚠️  Could not check logs for ${service}: ${error.message}`);
    }
  }
}

// Run monitoring
checkLogsForPromiseErrors().catch(console.error);
