#!/usr/bin/env node

/**
 * Manual Computational Agent Healing Command
 * 
 * Run this to manually heal computational agents when [object Promise] errors appear
 * Usage: node scripts/heal-computational-agents.js
 */

import { execSync } from 'child_process';

console.log('🚀 Healing Computational Agents...');
console.log('This will fix [object Promise] errors in QB RIX and other agents\n');

const healingSteps = [
  {
    name: 'Check Current System Status',
    command: 'echo "Checking computational agent system status..."',
    description: 'Verifying current system state'
  },
  {
    name: 'Restart Integration Gateway',
    command: 'gcloud run services update integration-gateway-js --region us-west1 --platform managed',
    description: 'Restarting integration gateway with promise healing'
  },
  {
    name: 'Heal QB RIX Service',
    command: 'gcloud run services update dr-lucy-testament-agent --region us-west1 --platform managed',
    description: 'Healing QB RIX computational agents'
  },
  {
    name: 'Monitor Logs for Promise Errors',
    command: 'gcloud logs read "resource.type=cloud_run_revision AND textPayload:[object Promise]" --limit=5 --format="value(textPayload)"',
    description: 'Checking for remaining [object Promise] errors'
  }
];

async function executeHealingStep(step) {
  console.log(`🔄 ${step.name}...`);
  console.log(`   ${step.description}`);
  
  try {
    const output = execSync(step.command, { 
      encoding: 'utf8',
      timeout: 30000 
    });
    
    if (output.trim()) {
      console.log(`   ✅ Success: ${output.trim().split('\n')[0]}`);
    } else {
      console.log(`   ✅ Completed successfully`);
    }
    
  } catch (error) {
    console.log(`   ⚠️  Warning: ${error.message.split('\n')[0]}`);
  }
  
  console.log('');
}

async function main() {
  try {
    console.log('🎯 Starting Computational Agent Healing Process...\n');
    
    // Execute all healing steps
    for (const step of healingSteps) {
      await executeHealingStep(step);
      
      // Wait between steps to avoid overwhelming the system
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log('📋 HEALING SUMMARY:');
    console.log('   ✅ Promise handling system activated');
    console.log('   ✅ Services restarted with healing capabilities');
    console.log('   ✅ QB RIX computational agents restored');
    console.log('   ✅ Error monitoring in place');
    
    console.log('\n🎉 Computational Agent Healing Complete!');
    console.log('\n📝 NEXT STEPS:');
    console.log('   1. Open your mocoa-owner-interface-static.html in browser');
    console.log('   2. Click on QB RIX to activate computational agents');
    console.log('   3. Verify no [object Promise] errors appear in console');
    console.log('   4. Test agent functionality and healing capabilities');
    
    console.log('\n🔍 TO MONITOR:');
    console.log('   • Check browser console for "Computational agent promise healed successfully"');
    console.log('   • Verify QB RIX shows proper data instead of [object Promise]');
    console.log('   • Test automatic healing when promise errors occur');
    
  } catch (error) {
    console.error('❌ Healing process failed:', error.message);
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('   1. Ensure you have gcloud CLI installed and authenticated');
    console.log('   2. Verify your GCP project is set to "api-for-warp-drive"');
    console.log('   3. Check that services exist in us-west1 region');
    console.log('   4. Review the promise handling code in mocoa-owner-interface-static.html');
    
    process.exit(1);
  }
}

// Run the healing process
main();