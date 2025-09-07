
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
      return `[Serialization Error: ${resolved.constructor?.name || 'Unknown'}]`;
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
