# Firebase Domain Manager

This script manages DNS records for domains and subdomains, pointing them to Firebase hosting with specific exclusions.

## Features

- Bulk update all domains to point to Firebase hosting
- Exclude specific domains from updates
- Handle both root domains and subdomains
- Generate detailed reports before applying changes
- Detailed logging of all operations

## Usage

```bash
# Generate update report for 2100.cool subdomains (dry run)
node firebase-domain-manager.js

# Apply updates to 2100.cool subdomains
node firebase-domain-manager.js --apply

# Generate update report for all domains (dry run)
node firebase-domain-manager.js --all

# Apply updates to all domains
node firebase-domain-manager.js --all --apply

# Show help
node firebase-domain-manager.js --help
```

## Configuration

The script uses the following configuration:

```javascript
const CONFIG = {
  domain: '2100.cool',         // Default domain for subdomain operations
  apiUrl: 'https://api.godaddy.com/v1',
  apiKey: 'YOUR_API_KEY',      // GoDaddy API key
  apiSecret: 'YOUR_API_SECRET', // GoDaddy API secret
  firebaseIP: '199.36.158.100', // Firebase hosting IP
  firebaseProject: 'api-for-warp-drive',
  firebaseSite: '2100-cool',   // Default site ID
  
  // List of subdomains to exclude (these will NOT be updated)
  excludedSubdomains: [
    'asoos',     // Exclude asoos from updates
    'zena',      // Exclude zena from updates
    'vision',    // Exclude vision from updates
    'app',       // Exclude app from updates
    'api'        // Exclude api from updates
  ],

  // List of domains to exclude completely (these will NOT be updated)
  excludedDomains: [
    'philliproark.com',
    'byfabriziodesign.com',
    'kennedypartain.com',
    '2100.group',
    'fabriziosassano.com'
  ],
  
  // Log file paths
  logFile: path.join(__dirname, 'domain-update.log'),
  resultsFile: path.join(__dirname, 'domain-update-results.json')
};
```

## Process Flow

When run with the `--all` flag:

1. The script retrieves all active domains from GoDaddy
2. For each domain (except excluded ones):
   - Checks current DNS configuration
   - Identifies domains that need A records updated to point to Firebase hosting
3. When run with `--apply`:
   - Updates A records for all identified domains
   - Updates both root (@) and www records to point to Firebase hosting IP

When run without the `--all` flag:

1. The script focuses only on subdomains of the configured domain (default: 2100.cool)
2. Follows a similar process for updating subdomains

## Output

- Console output with detailed progress and summary
- Comprehensive logs saved to `domain-update.log`
- Results saved to `domain-update-results.json`

## Notes

- The script first performs a dry run by default (no changes made)
- Use the `--apply` flag to actually apply the changes
- Always check the output of the dry run before applying changes
- The exclusion lists prevent any changes to those domains/subdomains