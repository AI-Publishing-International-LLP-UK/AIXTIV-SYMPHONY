# Device Health Checks and Authentication Flow

This document outlines the device health checks supported by SallyPort and their integration into the ASOOS authentication flow, ensuring alignment with Cloudflare and ASOOS UX standards.

## 1. Supported Device Health Checks

The following checks will be performed on a user's device to ensure it meets the security requirements of the ASOOS ecosystem.

### Device Integrity
- **OS Version:** Ensures the device is running a secure and up-to-date operating system.
- **Disk Encryption:** Verifies that the device's storage is encrypted to protect data at rest.
- **Root/Jailbreak Status:** Detects if the device has been rooted (Android) or jailbroken (iOS), which could compromise its security.
- **Secure Enclave/TPM:** Checks for the presence and proper functioning of a hardware-based secure enclave or Trusted Platform Module (TPM).

### User Authentication
- **Device Password/PIN:** Confirms that a device-level password or PIN is enabled.
- **Biometrics:** Verifies that biometric authentication (e.g., Face ID, Touch ID) is configured.

### Session & Network Security
- **Browser Security:** Ensures the web browser is up-to-date and meets security standards.
- **Cloudflare Session:** Validates that the user has an active and valid session with Cloudflare.

## 2. Authentication Flow Mapping

The device health card will be displayed as part of the SallyPort authentication flow, which is integrated with Cloudflare.

1.  **User Initiates Login:** The user attempts to access an ASOOS service that requires authentication.
2.  **Redirect to Cloudflare:** The user is redirected to Cloudflare Access for authentication.
3.  **Device Health Check:** After successful authentication with Cloudflare, the user is redirected to SallyPort, where the device health checks are performed.
4.  **Device Health Card Display:** The device health card is displayed to the user, showing the results of the security checks.
    - If the device passes all checks, the user is seamlessly redirected to the ASOOS service.
    - If the device fails any of the checks, the user is presented with a page detailing the issues and providing instructions on how to remediate them.
5.  **Access Granted:** Once the device passes the health checks, the user is granted access to the ASOOS service.

