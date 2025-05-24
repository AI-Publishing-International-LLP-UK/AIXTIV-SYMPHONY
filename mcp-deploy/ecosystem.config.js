module.exports = {
  apps: [
    {
      name: 'mcp-server',
      script: 'mcp-test-server.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
        AUTH_TOKEN: 'oauth2',
        FIREBASE_PROJECT_ID: 'api-for-warp-drive',
        GODADDY_API_KEY: '{{GODADDY_API_KEY}}',
        GODADDY_API_SECRET: '{{GODADDY_API_SECRET}}',
        GOOGLE_APPLICATION_CREDENTIALS:
          '/root/mcp-server/credentials/service-account.json',
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
      },
      env_development: {
        NODE_ENV: 'development',
        DEBUG: 'mcp:*',
      },
    },
  ],
};
