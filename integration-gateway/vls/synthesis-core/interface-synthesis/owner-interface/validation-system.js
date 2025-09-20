/**
 * Enterprise Validation and Sanitization System
 * Production-ready input validation, data sanitization, and security validation
 */

class EnterpriseValidationSystem {
  constructor() {
    this.validationRules = new Map();
    this.sanitizers = new Map();
    this.securityValidators = new Map();
    this.validationErrors = [];
    this.initialized = false;
    this.init();
  }

  init() {
    this.setupValidationRules();
    this.setupSanitizers();
    this.setupSecurityValidators();
    this.initialized = true;
    console.log('✅ Enterprise Validation System initialized');
  }

  // Validation Rules Setup
  setupValidationRules() {
    // Email validation
    this.validationRules.set('email', {
      pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      message: 'Invalid email format',
      required: true
    });

    // API Key validation
    this.validationRules.set('apiKey', {
      pattern: /^[a-zA-Z0-9_-]{32,}$/,
      message: 'API key must be at least 32 characters with valid characters only',
      required: true
    });

    // Username validation
    this.validationRules.set('username', {
      pattern: /^[a-zA-Z0-9_]{3,30}$/,
      message: 'Username must be 3-30 characters, alphanumeric and underscore only',
      required: true
    });

    // Password validation (enterprise grade)
    this.validationRules.set('password', {
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/,
      message: 'Password must be 12+ characters with uppercase, lowercase, number, and special character',
      required: true
    });

    // OAuth token validation
    this.validationRules.set('oauthToken', {
      pattern: /^[a-zA-Z0-9._-]+$/,
      minLength: 20,
      message: 'Invalid OAuth token format',
      required: true
    });

    // Service account validation
    this.validationRules.set('serviceAccount', {
      pattern: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.iam\.gserviceaccount\.com$/,
      message: 'Invalid service account email format',
      required: true
    });

    // URL validation
    this.validationRules.set('url', {
      pattern: /^https?:\/\/[^\s/$.?#].[^\s]*$/,
      message: 'Invalid URL format',
      required: false
    });

    // JSON validation
    this.validationRules.set('json', {
      validator: (value) => {
        try { JSON.parse(value); return true; }
        catch { return false; }
      },
      message: 'Invalid JSON format',
      required: false
    });
  }

  // Sanitization Setup
  setupSanitizers() {
    // HTML sanitizer
    this.sanitizers.set('html', (input) => {
      return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
    });

    // SQL injection prevention
    this.sanitizers.set('sql', (input) => {
      return input
        .replace(/'/g, '\'\'')
        .replace(/--/g, '')
        .replace(/\/\*/g, '')
        .replace(/\*\//g, '')
        .replace(/xp_/g, '')
        .replace(/sp_/g, '');
    });

    // XSS prevention
    this.sanitizers.set('xss', (input) => {
      return input
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    });

    // Command injection prevention
    this.sanitizers.set('command', (input) => {
      return input
        .replace(/[;&|`$(){}[\]\\]/g, '')
        .replace(/\.\./g, '')
        .trim();
    });

    // Path traversal prevention
    this.sanitizers.set('path', (input) => {
      return input
        .replace(/\.\./g, '')
        .replace(/[<>:"|?*]/g, '')
        .replace(/\\/g, '/')
        .replace(/\/+/g, '/');
    });
  }

  // Security Validators Setup
  setupSecurityValidators() {
    // Rate limiting validation
    this.securityValidators.set('rateLimit', {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100,
      requests: new Map(),
      validate: (identifier) => {
        const now = Date.now();
        const userRequests = this.securityValidators.get('rateLimit').requests.get(identifier) || [];
        
        // Clean old requests
        const validRequests = userRequests.filter(time => now - time < this.securityValidators.get('rateLimit').windowMs);
        
        if (validRequests.length >= this.securityValidators.get('rateLimit').maxRequests) {
          return { valid: false, message: 'Rate limit exceeded' };
        }
        
        validRequests.push(now);
        this.securityValidators.get('rateLimit').requests.set(identifier, validRequests);
        return { valid: true };
      }
    });

    // Input size validation
    this.securityValidators.set('inputSize', {
      maxSize: 10000, // 10KB max input
      validate: (input) => {
        if (input.length > this.securityValidators.get('inputSize').maxSize) {
          return { valid: false, message: 'Input size exceeds maximum allowed' };
        }
        return { valid: true };
      }
    });

    // Content type validation
    this.securityValidators.set('contentType', {
      allowedTypes: ['application/json', 'text/plain', 'multipart/form-data'],
      validate: (contentType) => {
        if (!this.securityValidators.get('contentType').allowedTypes.includes(contentType)) {
          return { valid: false, message: 'Unsupported content type' };
        }
        return { valid: true };
      }
    });
  }

  // Main validation method
  validate(value, type, options = {}) {
    this.validationErrors = [];

    if (!this.initialized) {
      throw new Error('Validation system not initialized');
    }

    // Security validations first
    const securityResult = this.performSecurityValidation(value, options);
    if (!securityResult.valid) {
      this.validationErrors.push(securityResult.message);
      return { valid: false, errors: this.validationErrors };
    }

    // Sanitize input
    const sanitizedValue = this.sanitizeInput(value, options.sanitize || []);

    // Perform validation
    const rule = this.validationRules.get(type);
    if (!rule) {
      this.validationErrors.push(`Unknown validation type: ${type}`);
      return { valid: false, errors: this.validationErrors };
    }

    // Required field check
    if (rule.required && (!sanitizedValue || sanitizedValue.trim() === '')) {
      this.validationErrors.push(`${type} is required`);
      return { valid: false, errors: this.validationErrors };
    }

    // Pattern validation
    if (rule.pattern && !rule.pattern.test(sanitizedValue)) {
      this.validationErrors.push(rule.message);
      return { valid: false, errors: this.validationErrors };
    }

    // Custom validator
    if (rule.validator && !rule.validator(sanitizedValue)) {
      this.validationErrors.push(rule.message);
      return { valid: false, errors: this.validationErrors };
    }

    // Length validation
    if (rule.minLength && sanitizedValue.length < rule.minLength) {
      this.validationErrors.push(`Minimum length is ${rule.minLength}`);
      return { valid: false, errors: this.validationErrors };
    }

    if (rule.maxLength && sanitizedValue.length > rule.maxLength) {
      this.validationErrors.push(`Maximum length is ${rule.maxLength}`);
      return { valid: false, errors: this.validationErrors };
    }

    return { valid: true, sanitizedValue, errors: [] };
  }

  // Security validation
  performSecurityValidation(value, options) {
    // Input size validation
    const sizeValidation = this.securityValidators.get('inputSize').validate(value);
    if (!sizeValidation.valid) return sizeValidation;

    // Rate limiting (if identifier provided)
    if (options.identifier) {
      const rateLimitValidation = this.securityValidators.get('rateLimit').validate(options.identifier);
      if (!rateLimitValidation.valid) return rateLimitValidation;
    }

    // Content type validation (if provided)
    if (options.contentType) {
      const contentTypeValidation = this.securityValidators.get('contentType').validate(options.contentType);
      if (!contentTypeValidation.valid) return contentTypeValidation;
    }

    return { valid: true };
  }

  // Input sanitization
  sanitizeInput(value, sanitizeTypes) {
    let sanitizedValue = value;

    sanitizeTypes.forEach(type => {
      const sanitizer = this.sanitizers.get(type);
      if (sanitizer) {
        sanitizedValue = sanitizer(sanitizedValue);
      }
    });

    return sanitizedValue;
  }

  // Form validation
  validateForm(formData, validationSchema) {
    const results = {};
    let allValid = true;

    for (const [field, config] of Object.entries(validationSchema)) {
      const value = formData[field];
      const result = this.validate(value, config.type, config.options || {});
      
      results[field] = result;
      if (!result.valid) {
        allValid = false;
      }
    }

    return {
      valid: allValid,
      results,
      sanitizedData: Object.keys(results).reduce((acc, field) => {
        if (results[field].valid && results[field].sanitizedValue !== undefined) {
          acc[field] = results[field].sanitizedValue;
        }
        return acc;
      }, {})
    };
  }

  // Batch validation
  validateBatch(items, type, options = {}) {
    return items.map(item => this.validate(item, type, options));
  }

  // Add custom validation rule
  addValidationRule(name, rule) {
    this.validationRules.set(name, rule);
  }

  // Add custom sanitizer
  addSanitizer(name, sanitizer) {
    this.sanitizers.set(name, sanitizer);
  }

  // Get validation statistics
  getValidationStats() {
    const rateLimiter = this.securityValidators.get('rateLimit');
    return {
      totalRequests: Array.from(rateLimiter.requests.values()).reduce((sum, arr) => sum + arr.length, 0),
      activeUsers: rateLimiter.requests.size,
      validationRulesCount: this.validationRules.size,
      sanitizersCount: this.sanitizers.size
    };
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = EnterpriseValidationSystem;
} else {
  window.EnterpriseValidationSystem = EnterpriseValidationSystem;
}

// Usage examples and tests
if (typeof window !== 'undefined') {
  // Initialize validation system
  window.validationSystem = new EnterpriseValidationSystem();

  // Example validation schema for the MOCOA interface
  window.mocoaValidationSchema = {
    email: {
      type: 'email',
      options: { sanitize: ['html', 'xss'] }
    },
    apiKey: {
      type: 'apiKey',
      options: { sanitize: ['command'] }
    },
    oauthToken: {
      type: 'oauthToken',
      options: { sanitize: ['html', 'xss'] }
    },
    serviceAccount: {
      type: 'serviceAccount',
      options: { sanitize: ['html'] }
    },
    chatMessage: {
      type: 'text',
      options: { sanitize: ['html', 'xss'], maxLength: 1000 }
    }
  };

  console.log('✅ Enterprise Validation System loaded and ready');
}
