 (cd "$(git rev-parse --show-toplevel)" && git apply --3way <<'EOF' 
diff --git a/lib/utils.js b/lib/utils.js
index c2a1f4a..80128b8 100644
--- a/lib/utils.js
+++ b/lib/utils.js
@@ -56,81 +56,81 @@ function formatResourcesTable(resources) {
  */
 function formatAuthorizationsTable(authorizations) {
   const headers = [
     'Agent ID',
     'Principal',
     'Resource ID',
     'Access Type',
     'Special Access',
     'Created At',
   ];
 
   const rows = authorizations.map((auth) => [
     chalk.cyan(auth.agentId),
     auth.principal,
     auth.resourceId,
     auth.accessType || 'full',
     auth.specialAccess ? chalk.green('Yes') : chalk.red('No'),
     auth.createdAt ? new Date(auth.createdAt).toLocaleString() : 'Unknown',
   ]);
 
   return createTable([headers, ...rows]);
 }
 
 /**
  * Display an operation result with proper formatting
- * @param {object} result - Operation result
+ *
+ * This helper originally expected an object with success, message and error
+ * fields. Many commands, however, call it using a simplified
+ * `displayResult('some message', 'error')` form. This updated implementation
+ * supports both styles for backwards compatibility.
+ *
+ * @param {object|string} resultOrMessage - Result object or message string
+ * @param {string} [type='info'] - Result type when using shorthand syntax
  */
-function displayResult(params) {
-  // Debug: Show internal thought process
-  console.log('\n🧠 INTERNAL REASONING:');
-  console.log('-'.repeat(50));
-  if (params.details && params.details.reasoning) {
-    console.log(params.details.reasoning);
-  } else {
-    console.log('No detailed reasoning available for this operation');
-  }
-  console.log('-'.repeat(50));
-  
-  // Display regular output with clear label
-  console.log('\n📊 EXECUTION RESULT:');
-  console.log('-'.repeat(50));
-  // Debug: Show internal thought process
+function displayResult(resultOrMessage, type = 'info') {
+  const params =
+    typeof resultOrMessage === 'object' && resultOrMessage !== null
+      ? resultOrMessage
+      : { success: type !== 'error', message: resultOrMessage };
+
+  // Debug: Show internal thought process when available
   console.log('\n🧠 INTERNAL REASONING:');
   console.log('-'.repeat(50));
-  if (params.details && params.details.reasoning) {
-    console.log(params.details.reasoning);
+  const reasoning = params.details?.reasoning || params.reasoning;
+  if (reasoning) {
+    console.log(reasoning);
   } else {
     console.log('No detailed reasoning available for this operation');
   }
   console.log('-'.repeat(50));
 
   // Display regular output with clear label
   console.log('\n📊 EXECUTION RESULT:');
   console.log('-'.repeat(50));
-  const { success, message, error } = params;
 
+  const { success, message, error } = params;
   if (success) {
     console.log(chalk.green('✓ Success:'), message);
   } else {
     console.log(chalk.red('✗ Error:'), message);
     if (error) {
       console.log(chalk.gray(error));
     }
   }
 
   console.log(); // Empty line
 }
 
 /**
  * Create a spinner with the given text
  * @param {string} text - Spinner text
  * @returns {object} Ora spinner instance
  */
 function createSpinner(text) {
   return ora({
     text,
     spinner: 'dots',
     color: 'cyan',
   });
 }
 
 
EOF
)
  ];

  const rows = resources.map((resource) => [
    chalk.cyan(resource.resourceId),
    resource.name,
    resource.authorizedAgents.join(', '),
    resource.authorizedPrincipals.join(', '),
    resource.createdAt ? new Date(resource.createdAt).toLocaleString() : 'Unknown',
  ]);

  return createTable([headers, ...rows]);
}

/**
 * Format authorization data into a displayable table
 * @param {Array<object>} authorizations - List of authorizations
 * @returns {string} Formatted table
 */
function formatAuthorizationsTable(authorizations) {
  const headers = [
    'Agent ID',
    'Principal',
    'Resource ID',
    'Access Type',
    'Special Access',
    'Created At',
  ];

  const rows = authorizations.map((auth) => [
    chalk.cyan(auth.agentId),
    auth.principal,
    auth.resourceId,
    auth.accessType || 'full',
    auth.specialAccess ? chalk.green('Yes') : chalk.red('No'),
    auth.createdAt ? new Date(auth.createdAt).toLocaleString() : 'Unknown',
  ]);

  return createTable([headers, ...rows]);
}

/**
 * Display an operation result with proper formatting
 *
 * This helper originally expected an object with success, message and error
 * fields. Many commands, however, call it using a simplified
 * `displayResult('some message', 'error')` form. This updated implementation
 * supports both styles for backwards compatibility.
 *
 * @param {object|string} resultOrMessage - Result object or message string
 * @param {string} [type='info'] - Result type when using shorthand syntax
 */
function displayResult(resultOrMessage, type = 'info') {
  const params =
    typeof resultOrMessage === 'object' && resultOrMessage !== null
      ? resultOrMessage
      : { success: type !== 'error', message: resultOrMessage };

  // Debug: Show internal thought process when available
  console.log('\n🧠 INTERNAL REASONING:');
  console.log('-'.repeat(50));
  const reasoning = params.details?.reasoning || params.reasoning;
  if (reasoning) {
    console.log(reasoning);
  } else {
    console.log('No detailed reasoning available for this operation');
  }
  console.log('-'.repeat(50));

  // Display regular output with clear label
  console.log('\n📊 EXECUTION RESULT:');
  console.log('-'.repeat(50));

  const { success, message, error } = params;
  if (success) {
    console.log(chalk.green('✓ Success:'), message);
  } else {
    console.log(chalk.red('✗ Error:'), message);
    if (error) {
      console.log(chalk.gray(error));
    }
  }

  console.log(); // Empty line
}

/**
 * Create a spinner with the given text
 * @param {string} text - Spinner text
 * @returns {object} Ora spinner instance
 */
function createSpinner(text) {
  return ora({
    text,
    spinner: 'dots',
    color: 'cyan',
  });
}

/**
 * Execute an async function with a spinner
 * @param {string} text - Spinner text
 * @param {Function} fn - Async function to execute
 * @param {Array} args - Arguments to pass to the function
 * @returns {Promise<any>} Function result
 */
async function withSpinner(text, fn, ...args) {
  const spinner = createSpinner(text);
  spinner.start();

  try {
    const result = await fn(...args);
    spinner.succeed();
    return result;
  } catch (error) {
    spinner.fail();
    throw error;
  }
}

/**
 * Format an error message for display
 * @param {Error} error - Error object
 * @returns {string} Formatted error message
 */
function formatError(error) {
  return chalk.red(`Error: ${error.message}`);
}

/**
 * Parse command-line arguments with defaults
 * @param {object} options - CLI options
 * @param {object} defaults - Default values
 * @returns {object} Parsed options
 */
function parseOptions(options, defaults = {}) {
  return {
    ...defaults,
    ...Object.entries(options).reduce((acc, [key, value]) => {
      if (value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {}),
  };
}

module.exports = {
  createTable,
  formatResourcesTable,
  formatAuthorizationsTable,
  displayResult,
  createSpinner,
  withSpinner,
  formatError,
  parseOptions,
};
