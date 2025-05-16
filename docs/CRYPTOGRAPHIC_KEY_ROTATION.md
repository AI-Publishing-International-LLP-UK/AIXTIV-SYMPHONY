# Cryptographic Key Rotation in Integration Gateway

This document provides an overview of the cryptographic key rotation system implemented for the Integration Gateway using Google Cloud KMS.

## Overview

Cryptographic key rotation is a security best practice that involves regularly changing encryption and signing keys to limit the potential impact of key compromise. The Integration Gateway implements automatic rotation for encryption keys and manual rotation for signing keys using Google Cloud KMS.

## Key Components

### 1. KMS Key Ring and Keys

- **Key Ring**: `integration-gateway-ring` in region `us-west1`
- **Encryption Key**: `igw-encryption-key` (automatically rotates every 30 days)
- **Signing Key**: `igw-signing-key` (requires manual rotation by creating new keys)

### 2. Configuration

The key rotation configuration is defined in the `gateway-config.yaml` file under the `crypto` section:

```yaml
crypto:
  kms:
    project_id: "api-for-warp-drive"
    location: "us-west1"
    key_ring: "integration-gateway-ring"
    encryption_key: "igw-encryption-key"
    signing_key: "igw-signing-key"
    rotation:
      encryption_key_period: "30d"
      # Note: Asymmetric signing keys don't support automatic rotation
      # Manual rotation is required for the signing key
  secret_manager:
    enabled: true
    project_id: "api-for-warp-drive"
    region: "us-west1"
```

### 3. Service Account

The `drlucyautomation@api-for-warp-drive.iam.gserviceaccount.com` service account is used to access KMS keys with the following IAM roles:

- `roles/cloudkms.cryptoKeyEncrypterDecrypter` for the encryption key
- `roles/cloudkms.signerVerifier` for the signing key

## Setup

The cryptographic key rotation system can be set up using the provided script:

```bash
# Make the script executable
chmod +x /Users/as/asoos/integration-gateway/utils/setup-crypto-key-rotation.sh

# Run the setup script
cd /Users/as/asoos/integration-gateway
./utils/setup-crypto-key-rotation.sh
```

This script will:

1. Create the key ring `integration-gateway-ring` in `us-west1` if it doesn't exist
2. Create the encryption key `igw-encryption-key` with a 30-day rotation period
3. Create the signing key `igw-signing-key` (asymmetric signing keys don't support automatic rotation)
4. Grant the service account the necessary IAM roles

## Usage

The Integration Gateway exposes the following cryptographic operations through the `crypto-service.js` module:

### Encryption & Decryption

```javascript
const cryptoService = require('../services/crypto-service');

// Encrypt data
const { ciphertext, keyVersion } = await cryptoService.encrypt('Sensitive data');

// Decrypt data
const plaintext = await cryptoService.decrypt(ciphertext, keyVersion);
```

### Signing & Verification

```javascript
const cryptoService = require('../services/crypto-service');

// Sign data
const { signature, keyVersion } = await cryptoService.signData('Data to sign');

// Verify signature
const isValid = await cryptoService.verifySignature(signature, 'Data to sign', keyVersion);
```

### Combined Operations

```javascript
const cryptoService = require('../services/crypto-service');

// Encrypt and sign data
const protected = await cryptoService.encryptAndSign({ 
  userId: 123, 
  permissions: ['admin', 'read'] 
});

// Verify and decrypt data
const data = await cryptoService.verifyAndDecrypt(protected, true); // true to parse as JSON
```

## Key Version Management

The cryptographic service automatically tracks key versions, ensuring that data can be decrypted or verified even after key rotation. Each encryption or signing operation returns the key version used, which should be stored alongside the encrypted data or signature.

## Integration with Dr. Grant's Authenticator

The cryptographic key rotation system integrates with Dr. Grant's Authenticator for role-based access control. The Authenticator can use the signing key to create and verify authentication tokens with the following benefits:

- Secure token signing
- Role-based access control for cryptographic operations
- Version-aware token verification

## Security Considerations

1. **Key Rotation Periods**: The rotation period (30 days) for encryption keys balances security and operational overhead.

2. **Manual Rotation for Signing Keys**: Asymmetric signing keys in Google Cloud KMS don't support automatic rotation or multiple versions. A process should be established to manually rotate these keys on a regular schedule (recommended every 90 days).

3. **Service Account Security**: The service account used for KMS operations should have restricted access and be monitored for suspicious activity.

4. **Key Version Management**: Always store the key version with encrypted data or signatures to ensure they can be decrypted/verified after key rotation.

5. **Audit Logging**: All cryptographic operations are logged for audit purposes.

## Manual Signing Key Rotation Procedure

Since asymmetric signing keys don't support automatic rotation or multiple versions within the same key, we use the following approach for rotation:

1. Run the signing key rotation script:
```bash
chmod +x /Users/as/asoos/integration-gateway/utils/rotate-signing-key.sh
cd /Users/as/asoos/integration-gateway
./utils/rotate-signing-key.sh
```

2. The script will:
   - Create a new signing key with an incremented version number (e.g., `igw-signing-key-v2`)
   - Grant the necessary IAM roles to the service account
   - Provide instructions for updating the configuration

3. Update the `gateway-config.yaml` file to use the new signing key:
```yaml
crypto:
  kms:
    signing_key: "igw-signing-key-v2"  # Update to the new key name
```

4. The crypto service will use the new key for signing new data while still being able to verify data signed with the old key.

## Troubleshooting

### Common Issues

1. **Permission Denied Errors**:
   - Check that the service account has the necessary IAM roles.
   - Verify that the service account key is properly set up.

2. **Decryption/Verification Failures**:
   - Ensure you're using the correct key version.
   - Check that the ciphertext or signature hasn't been corrupted.

3. **Configuration Issues**:
   - Verify that the `gateway-config.yaml` file contains the correct KMS configuration.
   - Ensure the key ring and keys exist in the correct region (`us-west1`).

### Debugging

To check the status of the KMS keys:

```bash
# List key rings
gcloud kms keyrings list --location=us-west1

# List keys in the key ring
gcloud kms keys list --keyring=integration-gateway-ring --location=us-west1

# List versions of a key
gcloud kms keys versions list --key=igw-encryption-key --keyring=integration-gateway-ring --location=us-west1

# List all signing keys
gcloud kms keys list --keyring=integration-gateway-ring --location=us-west1 --filter="name:igw-signing-key*"
```

## References

- [Google Cloud KMS Documentation](https://cloud.google.com/kms/docs)
- [Key Rotation Best Practices](https://cloud.google.com/kms/docs/key-rotation)
- [Asymmetric Key Management](https://cloud.google.com/kms/docs/create-asymmetric-keys)