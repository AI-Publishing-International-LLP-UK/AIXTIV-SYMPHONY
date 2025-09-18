#!/usr/bin/env node

/**
 * System-wide Promise Error Fix for ES Modules
 * 
 * Fixes [object Promise] errors in computational agents and healing systems
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Starting Promise error fix for computational agents...');

// Promise handler utility code
const PROMISE_HANDLER_CODE = `
/**
 * Promise Handler Utility - Auto-injected for Promise error prevention
 * Specifically designed for computational agent healing systems
 */

// Safely resolve promises to prevent [object Promise] errors
export async function safeResolve(value) {
  try {
    if (value && typeof value.then === 'function') {
      const resolved = await value;
      return resolved;
    }
    return value;
  } catch (error) {
    console.error('Promise resolution error:', error);
    return '[Promise Error - Check logs]';
  }
}

// Serialize data for computational agent communication
export async function serializeForAgent(value) {
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

// Enhanced promise wrapper for computational agents
export async function healComputationalAgentPromise(agentFunction, ...args) {
  try {
    console.log('🔄 Healing computational agent promise...');
    const result = await agentFunction(...args);
    const resolved = await safeResolve(result);
    console.log('✅ Computational agent promise healed successfully');
    return resolved;
  } catch (error) {
    console.error('❌ Computational agent healing failed:', error);
    return {
      error: true,
      message: 'Computational agent healing failed',
      details: error.message
    };
  }
}

// Global promise error handler
if (typeof process !== 'undefined') {
  process.on('unhandledRejection', (reason, promise) => {
    console.error('🚨 Unhandled Promise Rejection detected - This causes [object Promise] errors:', {
      reason: reason,
      promise: promise.toString()
    });
  });
}

// Global utilities for browser environments
if (typeof window !== 'undefined') {
  window.safeResolve = safeResolve;
  window.serializeForAgent = serializeForAgent;
  window.healComputationalAgentPromise = healComputationalAgentPromise;
  
  console.log('✅ Promise healing utilities loaded for browser');
}
`;

// Create promise handler utility
function createPromiseHandler() {
  console.log('📦 Creating promise handler utility...');
  
  const utilsDir = path.join(__dirname, '..', 'utils');
  if (!fs.existsSync(utilsDir)) {
    fs.mkdirSync(utilsDir, { recursive: true });
  }
  
  const promiseHandlerPath = path.join(utilsDir, 'promiseHandler.js');
  fs.writeFileSync(promiseHandlerPath, PROMISE_HANDLER_CODE);
  console.log(`✅ Promise handler created: ${promiseHandlerPath}`);
  
  return promiseHandlerPath;
}

// Create computational agent patch
function createComputationalAgentPatch() {
  console.log('🤖 Creating computational agent promise patch...');
  
  const patchCode = `
// Computational Agent Promise Healing Patch
// Add this to your mocoa-owner-interface-static.html

// Import the promise handler
import { safeResolve, serializeForAgent, healComputationalAgentPromise } from './utils/promiseHandler.js';

// Override sendCopilotMessage to properly handle promises
const originalSendCopilotMessage = window.sendCopilotMessage;
window.sendCopilotMessage = async function() {
  try {
    const result = await healComputationalAgentPromise(originalSendCopilotMessage);
    return await safeResolve(result);
  } catch (error) {
    console.error('Computational agent message error:', error);
    showNotification('Computational agent healing in progress...', 'info');
    return null;
  }
};

// Override activateRIX to handle promises properly
const originalActivateRIX = window.activateRIX;
window.activateRIX = async function(rixType, name) {
  try {
    console.log(\`🔄 Healing \${rixType} RIX computational agent...\`);
    const result = await healComputationalAgentPromise(originalActivateRIX, rixType, name);
    console.log(\`✅ \${rixType} RIX computational agent healed\`);
    return await safeResolve(result);
  } catch (error) {
    console.error(\`❌ \${rixType} RIX healing failed:, error\`);
    showNotification(\`\${rixType} RIX healing failed - trying again...\`, 'error');
    return null;
  }
};

// Add promise healing to QB RIX specifically
if (window.activateRIX) {
  const originalQBActivation = window.activateRIX;
  window.healQBRIX = async function() {
    try {
      console.log('🔄 Specifically healing QB RIX computational agents...');
      const result = await healComputationalAgentPromise(() => originalQBActivation('QB', 'Dr. Lucy'));
      console.log('✅ QB RIX computational agents healed successfully');
      showNotification('QB RIX computational agents restored', 'success');
      return result;
    } catch (error) {
      console.error('❌ QB RIX healing failed:', error);
      showNotification('QB RIX healing failed - manual intervention needed', 'error');
      return null;
    }
  };
}

console.log('🤖 Computational agent promise healing patch applied');
`;

  const patchPath = path.join(__dirname, '..', 'patches', 'computational-agent-promise-patch.js');
  const patchDir = path.dirname(patchPath);
  
  if (!fs.existsSync(patchDir)) {
    fs.mkdirSync(patchDir, { recursive: true });
  }
  
  fs.writeFileSync(patchPath, patchCode);
  console.log(`✅ Computational agent patch created: ${patchPath}`);
  
  return patchPath;
}

// Main execution
async function main() {
  try {
    console.log('🎯 Fixing [object Promise] errors in computational agents...');
    console.log('This specifically targets QB RIX and healing systems\\n');
    
    const handlerPath = createPromiseHandler();
    const patchPath = createComputationalAgentPatch();
    
    console.log('\\n✅ Promise error fixes deployed!');
    console.log('\\n📋 Next steps:');
    console.log('1. Add the promise handler to your mocoa interface');
    console.log('2. Test QB RIX computational agent healing');
    console.log('3. Verify no more [object Promise] errors appear');
    
    console.log(`\\n🔧 Files created:`);
    console.log(`   - Promise Handler: ${handlerPath}`);
    console.log(`   - Agent Patch: ${patchPath}`);
    
    console.log('\\n🎉 Computational agent promise healing ready!');
    
  } catch (error) {
    console.error('❌ Error during fix deployment:', error);
    process.exit(1);
  }
}

// Run the fix
main();