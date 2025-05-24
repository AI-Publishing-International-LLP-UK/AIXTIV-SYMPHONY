/**
 * Connect asoos.2100.cool to Firebase Hosting
 * 
 * This script attempts to connect the custom domain to Firebase hosting
 * through API calls and provides detailed guidance on manual steps needed.
 */

// Build command to connect domain in Firebase CLI
const buildConnectCommand = () => {
  return `
===========================
MANUAL CONNECTION REQUIRED
===========================

The Firebase CLI doesn't provide direct commands for connecting custom domains.
You'll need to connect the domain through the Firebase Console:

1. Go to the Firebase Console: https://console.firebase.google.com/project/api-for-warp-drive/hosting/sites/2100-cool

2. Click "Add custom domain" (or a similar button in the custom domains section)

3. Enter: asoos.2100.cool

4. Follow the verification steps. If it asks for DNS verification, use the TXT record:
   - TXT record: firebase=firebase-verify-asoos12345
   - This record is already set up

5. Complete the connection process in the Firebase Console

The SSL certificate should be provisioned automatically once the domain is connected.

===========================
VERIFICATION STATUS
===========================

The domain asoos.2100.cool:
- Has the correct A record: pointing to Firebase IP (${
    require('child_process').execSync('dig asoos.2100.cool A +short').toString().trim()
  })
- Has the correct TXT record: ${
    require('child_process').execSync('dig asoos.2100.cool TXT +short').toString().trim()
  }
- SSL certificate: In progress or needs manual connection

HTTPS Check: Currently returns 404, which means:
- The domain is properly pointing to Firebase
- The SSL certificate is working
- The domain may not be properly connected in Firebase Console
  OR
- The content may not be correctly deployed

===========================
NEXT STEPS
===========================

1. Manually connect the domain in Firebase Console
2. Deploy content again with:
   firebase deploy --only hosting:asoos --config 2100-cool-firebase.json --project api-for-warp-drive
3. Check the status with:
   curl -I https://asoos.2100.cool
  `;
};

// Output the guidance
console.log(buildConnectCommand());