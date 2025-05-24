# Dr. Claude Interface

This secure interface for Dr. Claude is designed to be deployed behind a firewall and provides a protected environment for interacting with the Dr. Claude orchestration system. The interface allows users to chat with Dr. Claude and delegate projects to the orchestration system.

## Features

- Secure authentication system
- Protected route architecture
- Project delegation to Dr. Claude
- Conversational interface with Dr. Claude
- Integration with the Dr. Claude API

## Deployment Instructions

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Firebase CLI
- Google Cloud account with access to the project

### Deployment Steps

1. **Clone the repository** (if you haven't already)

2. **Navigate to the interface directory**
   ```bash
   cd /Users/as/asoos/vls/solutions/dr-claude-orchestrator/interface
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Make the deployment script executable**
   ```bash
   chmod +x deploy-claude-interface.sh
   ```

5. **Run the deployment script**
   ```bash
   ./deploy-claude-interface.sh
   ```

   This script will:
   - Build the React application
   - Configure Firebase hosting to target the dr-claude-interface
   - Deploy the interface to Firebase hosting in the us-west1 region

6. **After deployment, the interface will be available at:**
   ```
   https://dr-claude-interface-api-for-warp-drive.web.app
   ```

## Authentication

The interface uses a secure authentication system to ensure that only authorized users can access it.

### Default Credentials (Development Only)

- **Username:** admin
- **Password:** securepass

**Note:** For production, you should implement a proper authentication system using Firebase Authentication or other secure authentication providers.

## Accessing the Interface

1. Navigate to the deployed URL in your browser
2. You will be redirected to the authentication page
3. Enter your credentials to log in
4. Once authenticated, you will have access to the Dr. Claude Interface

## Integration with Dr. Claude API

The interface connects to the Dr. Claude API endpoint at:
```
https://us-west1-aixtiv-symphony.cloudfunctions.net/dr-claude/projects/delegate
```

Ensure that this API endpoint is accessible from your deployment environment.

## Troubleshooting

### Common Issues

1. **Authentication Failures**
   - Check that your credentials are correct
   - Ensure the authentication service is running
   - Check browser console for any CORS or network errors

2. **API Connection Issues**
   - Verify that the Dr. Claude API is deployed and running
   - Check that the API endpoint URL is correct in the configuration
   - Ensure your network allows connections to the API endpoint

3. **Deployment Failures**
   - Make sure you have the necessary permissions for Firebase deployment
   - Check that your Firebase CLI is authenticated with the correct account
   - Verify that the project ID in the deployment script is correct

4. **Interface Not Loading**
   - Check browser console for JavaScript errors
   - Verify that all build assets were deployed correctly
   - Ensure the Firebase hosting configuration is correct

### Debugging Tips

- Use browser developer tools to inspect network requests and errors
- Check Firebase Hosting logs for any deployment issues
- Examine the application logs in the browser console
- Try clearing browser cache and cookies if you encounter persistent issues

## Security Considerations

This interface is designed to be deployed behind a firewall and should not be made publicly accessible. Ensure that:

1. Proper authentication is implemented
2. API access is restricted to authenticated users
3. All communications are secured with HTTPS
4. Firewall rules are configured to restrict access to authorized IPs only

## Support

For additional support, contact the ASOOS team or refer to the Dr. Claude Command Suite documentation.

