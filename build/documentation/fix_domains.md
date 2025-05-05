# Manual Steps to Fix coaching2100.com SSL Issues

1. Go to the Firebase Console: https://console.firebase.google.com/project/api-for-warp-drive/hosting/sites
2. Click on "coaching2100" site
3. Click on "Connect domain" or "Add custom domain"
4. For the primary domain:
   - Add "coaching2100.com"
   - Follow the verification steps if needed
   - Choose the "Using Firebase Hosting" option for SSL
5. For the www subdomain:
   - Add "www.coaching2100.com"
   - Set it to redirect to "coaching2100.com" (recommended)
   - Follow the verification steps
6. Wait for the SSL certificates to be provisioned (may take up to 24 hours)
7. Confirm by visiting both domains in a browser

## DNS Settings

For both domains, ensure these DNS settings:
- coaching2100.com: A record pointing to Firebase IPs
- www.coaching2100.com: CNAME record pointing to coaching2100.com

## Troubleshooting

If SSL issues persist after 24 hours:
1. Temporarily disable the custom domains in Firebase Console
2. Re-add them using the steps above
3. Ensure DNS records are correct
4. Wait for new SSL certificates

## Confirmation

After completing these steps, use https://www.ssllabs.com/ssltest/ to test the SSL configuration.
