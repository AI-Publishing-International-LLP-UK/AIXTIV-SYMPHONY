# Domain Management Tools

This directory contains scripts for managing DNS records and Firebase hosting connections for your domains.

## Overview

These tools help you:

1. Update DNS records to point to Firebase hosting
2. Add verification TXT records for Firebase domain ownership
3. Verify DNS configurations and website accessibility

## Scripts

### 1. 2100.cool Subdomain Manager

This script manages DNS records for 2100.cool subdomains, pointing them to Firebase hosting with specific exclusions.

```bash
# Generate an update plan (dry run, no changes made)
node 2100-cool-subdomain-manager.js

# Apply DNS updates
node 2100-cool-subdomain-manager.js --apply
```

The script excludes the following subdomains from updates:
- asoos.2100.cool
- zena.2100.cool
- vision.2100.cool
- app.2100.cool
- api.2100.cool

### 2. Add Verification Records

This script adds TXT verification records for domain ownership in Firebase.

```bash
# Add a verification record for a single domain
node add-verification-records.js domain.com VERIFICATION_CODE

# Add a verification record for a subdomain
node add-verification-records.js subdomain.domain.com VERIFICATION_CODE

# Add multiple verification records from a JSON file
node add-verification-records.js --from-file verifications.json
```

The verifications.json file should have this format:
```json
{
  "domain.com": "verification-code-1",
  "subdomain.domain.com": "verification-code-2"
}
```

### 3. Verify Domains

This script checks the DNS and HTTP status of domains to verify they're correctly pointing to Firebase hosting and accessible.

```bash
# Check a specific domain and all its subdomains
node verify-domains.js 2100.cool

# Check a specific subdomain
node verify-domains.js subdomain.2100.cool

# Check domains listed in a file
node verify-domains.js --from-file domains.txt
```

## Working with Multiple Hosting Families

When managing multiple hosting ID families (10-12 families with 15-20 domains each):

1. **Identify domain families**: Organize domains into groups that share the same hosting ID
2. **Create configuration files**: Create JSON files for each hosting family
3. **Run scripts family by family**: Update each family separately, allowing for human verification

## Example Workflow

1. **Prepare**: Identify which domains/subdomains need updates
2. **Plan**: Run the manager script without `--apply` to see what changes would be made
3. **Apply**: Run the manager script with `--apply` to update DNS records
4. **Verify**: After DNS propagation (can take 24-48 hours), run the verification script
5. **Connect in Firebase**: Add the domains in Firebase Hosting console
6. **Get verification codes**: Note the verification codes from Firebase
7. **Add verification records**: Use the add-verification-records.js script
8. **Final verification**: Run the verification script again to confirm everything works

## GoDaddy API Credentials

These scripts use the GoDaddy API with the following credentials:

- API Key: dKNvtCsmB3PX_VXx1ghzxNeBfdSHH5AaazX
- API Secret: NWFaniKptRBwGQ2ChkhpPT

## Notes

- DNS changes can take 24-48 hours to propagate globally
- Firebase SSL certificate provisioning may take additional time after DNS propagation
- Always review the plan before applying changes
- These scripts log all actions to help with troubleshooting