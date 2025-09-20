import js from "@eslint/js";
import globals from "globals";

export default [
  // Base configuration
  js.configs.recommended,

  // Global configuration
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2024,
      },
    },
    rules: {
      // Allow console.log for development and operations
      "no-console": "off",

      // Warn on unused variables instead of error for development
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],

      // Basic code quality rules
      "no-debugger": "error",
      "no-undef": "error",
      "no-unreachable": "error",
      "no-duplicate-imports": "error",
      "prefer-const": "error",
      "no-var": "error",
      eqeqeq: ["error", "always"],
      curly: ["error", "all"],

      // Style preferences
      semi: ["error", "always"],
      quotes: ["error", "single", { avoidEscape: true }],

      // Relaxed magic numbers for infrastructure code
      "no-magic-numbers": [
        "warn",
        {
          ignore: [
            0, 1, -1, 15, 60, 200, 201, 400, 401, 403, 404, 500, 502, 503, 1000,
            3000, 8080, 10000, 20000000, 30, 22, 24,
          ],
          ignoreArrayIndexes: true,
          enforceConst: false,
        },
      ],
    },
  },

  // Specific configurations for different file types
  {
    files: ["*-worker.js", "worker*.js"],
    languageOptions: {
      globals: {
        ...globals.worker,
        Response: "readonly",
        Request: "readonly",
        URL: "readonly",
        fetch: "readonly",
        crypto: "readonly",
        addEventListener: "readonly",
      },
    },
  },

  // Configuration for Node.js specific files
  {
    files: ["server.js", "**/deploy*.js", "**/setup*.js", "**/config*.js"],
    rules: {
      "no-process-exit": "off",
    },
  },

  // Configuration for test files
  {
    files: [
      "**/*.test.js",
      "**/*.spec.js",
      "**/test/**/*.js",
      "**/tests/**/*.js",
    ],
    languageOptions: {
      globals: {
        ...globals.jest,
        describe: "readonly",
        it: "readonly",
        test: "readonly",
        expect: "readonly",
        beforeAll: "readonly",
        beforeEach: "readonly",
        afterAll: "readonly",
        afterEach: "readonly",
      },
    },
  },

  // Ignore patterns
  {
    ignores: [
      // Dependencies and generated files
      "node_modules/**",
      "dist/**",
      "build/**",
      ".next/**",
      ".nuxt/**",
      ".cache/**",
      "coverage/**",
      ".nyc_output/**",

      // Development and IDE files
      ".vscode/**",
      ".idea/**",
      "**/.DS_Store",
      "**/Thumbs.db",
      "**/*.log",
      "logs/**",

      // Environment and config files
      ".env*",
      "*.min.js",
      "**/*.min.js",

      // Backup and temporary files
      "**/*.backup",
      "**/*.bak",
      "**/.*.swp",
      "**/.*.swo",
      "**/*.tmp",
      "**/*.temp",

      // Data files that don't need linting
      "**/*.json",
      "**/*.md",
      "**/*.txt",
      "**/*.csv",
      "**/*.yaml",
      "**/*.yml",

      // Problematic directories with spaces and special characters
      "integration-gateway/.workspace/**",
      "integration-gateway/vls/solutions/solutions/dr.*/**",
      "**/dr.*/**",
      "**/.workspace/**",
      "**/staging-extras/**",

      // AI and ML training data
      "venv/**",
      "**/venv/**",
      "**/__pycache__/**",
      "**/*.pyc",

      // Large generated files and blobs
      "**/.wrangler/**",
      "**/blobs/**",

      // Specific large or problematic files
      "**/puppeteer-core-browser.js",
      "**/dep-*.js",
      "**/bundle-*.js",

      // Archive and backup directories
      "archive/**",
      "backup/**",
      "backups/**",
      "**/backup_*/**",
      "**/BACKUP_*/**",

      // Temporary migration files
      "temp_files/**",
      "migration-*/**",

      // Security quarantine directories
      "**/SECURITY_QUARANTINE_*/**",
    ],
  },
];
