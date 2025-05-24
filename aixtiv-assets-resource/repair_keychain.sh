#!/bin/bash

# Verify and repair Keychain Access
security verify-cert -c /System/Library/Keychains/SystemRootCertificates.keychain

# Reset Keychain trust settings
security dump-trust-settings

# Restart security services
sudo killall -HUP securityd
sudo killall -HUP trustd
sudo killall -HUP loginwindow

# Monitor security logs for any new authentication errors
log show --predicate 'subsystem == "com.apple.security"' --info --last 1h

