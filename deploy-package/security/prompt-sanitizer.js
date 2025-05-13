/**
 * Prompt Injection Sanitizer
 * 
 * Pattern-matching security layer to block potentially malicious inputs
 * before they reach agent systems, preventing prompt injection attacks.
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Configuration for sanitization rules
const SANITIZATION_RULES = {
  // Track rule version for updating
  RULES_VERSION: '1.3.4',
  
  // Suspicious command patterns
  COMMAND_PATTERNS: [
    // System command injection attempts
    { 
      regex: /system\.(exec|run|cmd|shell|command|spawn)/i,
      name: 'SYSTEM_COMMAND_INJECTION',
      severity: 'CRITICAL',
      description: 'Attempted to execute system commands'
    },
    
    // Role override attempts
    {
      regex: /ignore\s+(previous|above|all)\s+(instructions|prompt|context)|disregard\s+(previous|above|all)/i,
      name: 'ROLE_OVERRIDE_ATTEMPT',
      severity: 'HIGH',
      description: 'Attempted to override agent instructions'
    },
    
    // Directive manipulation
    {
      regex: /you\s+(are|will|must)\s+(now|instead)\s+(be|act|pretend|role)/i,
      name: 'DIRECTIVE_MANIPULATION',
      severity: 'HIGH',
      description: 'Attempted to alter agent directive'
    },
    
    // Jailbreak patterns
    {
      regex: /delimeter|ignore\s+constraints|bypass|restriction|limitation/i,
      name: 'JAILBREAK_ATTEMPT',
      severity: 'HIGH',
      description: 'Attempted to bypass system constraints'
    },
    
    // DAN (Do Anything Now) patterns
    {
      regex: /\bDAN\b|do\s+anything\s+now/i,
      name: 'DAN_PATTERN',
      severity: 'HIGH',
      description: 'Attempted DAN jailbreak'
    },
    
    // SQL injection patterns
    {
      regex: /('|;)\s*(--|drop|alter|create|truncate|update|insert|select|union)/i,
      name: 'SQL_INJECTION',
      severity: 'CRITICAL',
      description: 'Potential SQL injection pattern'
    },
    
    // XSS patterns
    {
      regex: /<script>|javascript:|onerror=|onload=/i,
      name: 'XSS_ATTEMPT',
      severity: 'HIGH',
      description: 'Potential XSS pattern'
    },
    
    // Path traversal
    {
      regex: /\.\.\/(\.\.\/)+/,
      name: 'PATH_TRAVERSAL',
      severity: 'HIGH',
      description: 'Directory traversal attempt'
    }
  ],
  
  // Restricted topics
  RESTRICTED_TOPICS: [
    {
      regex: /how\s+to\s+(hack|breach|exploit|bypass|crack)/i,
      name: 'HACKING_GUIDANCE',
      severity: 'MEDIUM',
      description: 'Request for hacking guidance'
    },
    {
      regex: /generate\s+(malware|virus|ransomware|exploit|rootkit)/i,
      name: 'MALWARE_GENERATION',
      severity: 'HIGH',
      description: 'Request to generate malware'
    }
  ],
  
  // Data exfiltration patterns
  DATA_EXFILTRATION: [
    {
      regex: /send\s+(all|the)\s+(data|information|content|knowledge)\s+to/i,
      name: 'DATA_EXFILTRATION',
      severity: 'HIGH',
      description: 'Request to exfiltrate data'
    },
    {
      regex: /your\s+(system|code|prompt|instructions|configuration)/i,
      name: 'PROMPT_EXTRACTION',
      severity: 'MEDIUM',
      description: 'Attempted to extract system prompts'
    }
  ],
  
  // Context switching tricks
  CONTEXT_MANIPULATION: [
    {
      regex: /\[ignore context\]|\[new context\]|\[system override\]/i,
      name: 'CONTEXT_BRACKET_MANIPULATION',
      severity: 'MEDIUM',
      description: 'Attempted to manipulate context with brackets'
    },
    {
      regex: /forget\s+(all|previous)\s+(context|conversation|instructions)/i,
      name: 'CONTEXT_RESET_ATTEMPT',
      severity: 'MEDIUM',
      description: 'Attempted to reset conversation context'
    }
  ],
  
  // JSON/YAML/XML structured injection
  STRUCTURED_INJECTION: [
    {
      regex: /"(system|user|assistant)":\s*"/i,
      name: 'CHAT_FORMAT_INJECTION',
      severity: 'MEDIUM',
      description: 'Attempted to inject structured chat format'
    },
    {
      regex: /<(system|user|assistant)>/i,
      name: 'XML_ROLE_INJECTION',
      severity: 'MEDIUM',
      description: 'Attempted to inject XML-style roles'
    }
  ],
  
  // Suspicious URL patterns
  URL_PATTERNS: [
    {
      regex: /https?:\/\/(?!asoos\.2100\.cool|anthology\.asoos\.2100\.cool|symphony\.asoos\.2100\.cool|drmemoria\.live|api-for-warp-drive\.firebase)/i,
      name: 'EXTERNAL_URL',
      severity: 'LOW',
      description: 'Non-allowlisted external URL detected'
    }
  ],
  
  // Allow patterns that should bypass restrictions
  ALLOWLIST: [
    {
      regex: /^(\/help|\/{1,2}[a-z]+)$/i,
      name: 'COMMAND_SYNTAX',
      description: 'Valid command syntax'
    },
    {
      regex: /data:\s*image\/[a-z]+;base64,/i,
      name: 'BASE64_IMAGE',
      description: 'Base64 encoded image data'
    }
  ]
};

/**
 * Sanitizes a prompt input to detect potential injection attacks
 * 
 * @param {string} prompt User input prompt to sanitize
 * @param {Object} options Configuration options
 * @returns {Object} Sanitization result
 */
function sanitizePrompt(prompt, options = {}) {
  // Default options
  const config = {
    logViolations: true,
    blockHighSeverity: true,
    maxLength: 10000,
    sanitizationLevel: 'standard',
    ...options
  };
  
  // Initialize result
  const result = {
    isClean: true,
    sanitizedPrompt: prompt,
    violations: [],
    hasHighSeverity: false
  };
  
  // Check if prompt is empty or too long
  if (!prompt || typeof prompt !== 'string') {
    return {
      isClean: false,
      sanitizedPrompt: '',
      violations: [{
        rule: 'INVALID_INPUT',
        severity: 'LOW',
        description: 'Empty or non-string input'
      }],
      hasHighSeverity: false
    };
  }
  
  if (prompt.length > config.maxLength) {
    return {
      isClean: false,
      sanitizedPrompt: prompt.substring(0, config.maxLength),
      violations: [{
        rule: 'EXCESSIVE_LENGTH',
        severity: 'MEDIUM',
        description: `Input exceeds maximum length of ${config.maxLength}`
      }],
      hasHighSeverity: false
    };
  }
  
  // First check against allowlist - these bypass other checks
  for (const allowRule of SANITIZATION_RULES.ALLOWLIST) {
    if (allowRule.regex.test(prompt)) {
      // If matches allowlist, return clean
      return result;
    }
  }
  
  // Check all rule categories
  const allRuleSets = [
    SANITIZATION_RULES.COMMAND_PATTERNS,
    SANITIZATION_RULES.RESTRICTED_TOPICS,
    SANITIZATION_RULES.DATA_EXFILTRATION,
    SANITIZATION_RULES.CONTEXT_MANIPULATION,
    SANITIZATION_RULES.STRUCTURED_INJECTION,
    SANITIZATION_RULES.URL_PATTERNS
  ];
  
  // Check each rule set
  for (const ruleSet of allRuleSets) {
    for (const rule of ruleSet) {
      if (rule.regex.test(prompt)) {
        // Record violation
        result.violations.push({
          rule: rule.name,
          severity: rule.severity,
          description: rule.description,
          pattern: rule.regex.toString()
        });
        
        // Mark result as not clean
        result.isClean = false;
        
        // Check if this is high severity
        if (rule.severity === 'HIGH' || rule.severity === 'CRITICAL') {
          result.hasHighSeverity = true;
        }
      }
    }
  }
  
  // Apply sanitization based on violations
  if (!result.isClean && config.sanitizationLevel !== 'none') {
    // For now, we're just handling by rejection, but could implement
    // more sophisticated replacement in the future
    result.sanitizedPrompt = result.hasHighSeverity && config.blockHighSeverity ? 
      '[Content blocked for security reasons]' : prompt;
  }
  
  // Log violations if enabled
  if (config.logViolations && result.violations.length > 0) {
    logSecurityViolation(prompt, result.violations);
  }
  
  return result;
}

/**
 * Logs security violations to Firestore and Cloud Logging
 */
async function logSecurityViolation(prompt, violations) {
  try {
    // Truncate prompt for logging
    const truncatedPrompt = prompt.length > 500 ? 
      `${prompt.substring(0, 500)}... [truncated]` : prompt;
    
    // Create violation record
    const violationRecord = {
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      prompt: truncatedPrompt,
      violations,
      hasHighSeverity: violations.some(v => v.severity === 'HIGH' || v.severity === 'CRITICAL')
    };
    
    // Log to Firestore
    await admin.firestore().collection('securityViolations').add(violationRecord);
    
    // Log to Cloud Logging
    functions.logger.warn('Prompt security violation detected', violationRecord);
    
    // For high severity violations, trigger an alert
    if (violationRecord.hasHighSeverity) {
      const highSeverityViolations = violations.filter(
        v => v.severity === 'HIGH' || v.severity === 'CRITICAL'
      );
      
      await admin.firestore().collection('securityAlerts').add({
        ...violationRecord,
        violations: highSeverityViolations,
        status: 'PENDING_REVIEW'
      });
      
      functions.logger.error('High severity prompt violation detected', {
        violations: highSeverityViolations,
        truncatedPrompt
      });
    }
  } catch (error) {
    // Ensure logging errors don't break the flow
    functions.logger.error('Error logging security violation', error);
  }
}

/**
 * Cloud Function to handle prompt sanitization
 */
exports.sanitizePromptRequest = functions.https.onCall((data, context) => {
  // Ensure authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Authentication required to access this function'
    );
  }
  
  const { prompt, options } = data;
  
  // Apply sanitization
  const sanitizationResult = sanitizePrompt(prompt, options);
  
  // If high severity and configured to block, reject the request
  if (sanitizationResult.hasHighSeverity && 
      (options?.blockHighSeverity !== false)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Input contains potentially harmful patterns',
      { violations: sanitizationResult.violations }
    );
  }
  
  return {
    isClean: sanitizationResult.isClean,
    sanitizedPrompt: sanitizationResult.sanitizedPrompt,
    hasViolations: sanitizationResult.violations.length > 0
  };
});

/**
 * Middleware function for Express-based API routes
 */
function promptSanitizerMiddleware(req, res, next) {
  const prompt = req.body.prompt || req.query.prompt;
  
  if (!prompt) {
    return next();
  }
  
  const sanitizationResult = sanitizePrompt(prompt, {
    logViolations: true,
    blockHighSeverity: true
  });
  
  if (sanitizationResult.hasHighSeverity) {
    return res.status(403).json({
      error: 'Input contains potentially harmful patterns',
      violations: sanitizationResult.violations
    });
  }
  
  // Replace with sanitized prompt
  if (req.body.prompt) {
    req.body.prompt = sanitizationResult.sanitizedPrompt;
  }
  if (req.query.prompt) {
    req.query.prompt = sanitizationResult.sanitizedPrompt;
  }
  
  next();
}

/**
 * Admin function to manage sanitization rules
 */
exports.manageSanitizationRules = functions.https.onCall(async (data, context) => {
  // Ensure user has admin privileges
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Admin privileges required to manage sanitization rules'
    );
  }
  
  const { action, rules } = data;
  
  switch (action) {
    case 'getVersion':
      return { version: SANITIZATION_RULES.RULES_VERSION };
      
    case 'getRules':
      return { rules: SANITIZATION_RULES };
      
    case 'updateRules':
      // This would normally update rules in a database
      // For now, we just acknowledge the request
      return { 
        success: true, 
        message: 'Rules would be updated in production' 
      };
      
    default:
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Unknown action for rule management'
      );
  }
});

module.exports = {
  sanitizePrompt,
  promptSanitizerMiddleware,
  sanitizePromptRequest: exports.sanitizePromptRequest,
  manageSanitizationRules: exports.manageSanitizationRules
};