
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
      return `[Serialization Error: ${resolved.constructor?.name || 'Unknown'}]`;
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
