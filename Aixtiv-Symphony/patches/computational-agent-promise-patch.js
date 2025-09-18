
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
    console.log(`🔄 Healing ${rixType} RIX computational agent...`);
    const result = await healComputationalAgentPromise(originalActivateRIX, rixType, name);
    console.log(`✅ ${rixType} RIX computational agent healed`);
    return await safeResolve(result);
  } catch (error) {
    console.error(`❌ ${rixType} RIX healing failed:, error`);
    showNotification(`${rixType} RIX healing failed - trying again...`, 'error');
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
