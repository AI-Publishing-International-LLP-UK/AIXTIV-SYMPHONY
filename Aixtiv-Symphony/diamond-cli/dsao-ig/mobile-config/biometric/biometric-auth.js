
// Biometric Authentication Service for ASOOS Mobile
class ASOOSBiometricAuth {
  constructor() {
    this.isSupported = false;
    this.availableMethods = [];
    this.checkSupport();
  }

  async checkSupport() {
    // Check for various biometric methods
    if (window.PublicKeyCredential) {
      this.isSupported = true;
      console.log('🔐 WebAuthn biometrics supported');
    }

    if (navigator.credentials && navigator.credentials.create) {
      this.isSupported = true;
      console.log('🔐 Credentials API supported');
    }

    // Platform-specific checks
    if (window.TouchID) {
      this.availableMethods.push('TouchID');
    }
    if (window.FaceID) {
      this.availableMethods.push('FaceID');  
    }
    if (window.Fingerprint) {
      this.availableMethods.push('Fingerprint');
    }

    console.log(`🔐 Available biometric methods: ${this.availableMethods.join(', ')}`);
  }

  async authenticate(reason = 'Authenticate to access ASOOS Mobile') {
    if (!this.isSupported) {
      throw new Error('Biometric authentication not supported on this device');
    }

    try {
      // Try WebAuthn first (most secure)
      if (window.PublicKeyCredential) {
        return await this.authenticateWebAuthn(reason);
      }

      // Fallback to platform-specific methods
      if (window.TouchID) {
        return await this.authenticateTouchID(reason);
      }

      if (window.FaceID) {
        return await this.authenticateFaceID(reason);
      }

      if (window.Fingerprint) {
        return await this.authenticateFingerprint(reason);
      }

      throw new Error('No biometric authentication method available');

    } catch (error) {
      console.error('🔐 Biometric authentication failed:', error);
      throw error;
    }
  }

  async authenticateWebAuthn(reason) {
    const credential = await navigator.credentials.create({
      publicKey: {
        challenge: new Uint8Array(32),
        rp: { name: 'ASOOS Mobile', id: 'asoos.2100.cool' },
        user: {
          id: new Uint8Array(16),
          name: 'user@asoos.com',
          displayName: 'ASOOS User'
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required'
        },
        timeout: 60000,
        attestation: 'direct'
      }
    });

    console.log('🔐 WebAuthn authentication successful');
    return {
      success: true,
      method: 'WebAuthn',
      credentialId: credential.id
    };
  }

  async authenticateTouchID(reason) {
    return new Promise((resolve, reject) => {
      window.TouchID.authenticate(
        reason,
        (success) => {
          console.log('🔐 Touch ID authentication successful');
          resolve({
            success: true,
            method: 'TouchID'
          });
        },
        (error) => {
          console.error('🔐 Touch ID authentication failed:', error);
          reject(new Error(`Touch ID failed: ${error}`));
        }
      );
    });
  }

  async authenticateFaceID(reason) {
    return new Promise((resolve, reject) => {
      window.FaceID.authenticate(
        reason,
        (success) => {
          console.log('🔐 Face ID authentication successful');
          resolve({
            success: true,
            method: 'FaceID'
          });
        },
        (error) => {
          console.error('🔐 Face ID authentication failed:', error);
          reject(new Error(`Face ID failed: ${error}`));
        }
      );
    });
  }

  async authenticateFingerprint(reason) {
    return new Promise((resolve, reject) => {
      window.Fingerprint.authenticate(
        reason,
        (success) => {
          console.log('🔐 Fingerprint authentication successful');
          resolve({
            success: true,
            method: 'Fingerprint'
          });
        },
        (error) => {
          console.error('🔐 Fingerprint authentication failed:', error);
          reject(new Error(`Fingerprint failed: ${error}`));
        }
      );
    });
  }

  async enableBiometricLogin() {
    try {
      const authResult = await this.authenticate('Enable biometric login for ASOOS Mobile');
      
      // Store biometric credential securely
      const biometricData = {
        enabled: true,
        method: authResult.method,
        enabledAt: new Date().toISOString(),
        credentialId: authResult.credentialId
      };

      localStorage.setItem('asoos-biometric', JSON.stringify(biometricData));
      
      console.log('🔐 Biometric login enabled successfully');
      return true;

    } catch (error) {
      console.error('🔐 Failed to enable biometric login:', error);
      throw error;
    }
  }

  async isBiometricEnabled() {
    const biometricData = localStorage.getItem('asoos-biometric');
    return biometricData ? JSON.parse(biometricData).enabled : false;
  }

  async disableBiometricLogin() {
    localStorage.removeItem('asoos-biometric');
    console.log('🔐 Biometric login disabled');
  }

  getSecurityLevel() {
    if (this.availableMethods.includes('FaceID')) {
      return 'high'; // Face ID is most secure
    }
    if (this.availableMethods.includes('TouchID')) {
      return 'high'; // Touch ID is also highly secure
    }
    if (this.availableMethods.includes('Fingerprint')) {
      return 'medium'; // Fingerprint varies by implementation
    }
    return 'low';
  }
}

export default ASOOSBiometricAuth;
