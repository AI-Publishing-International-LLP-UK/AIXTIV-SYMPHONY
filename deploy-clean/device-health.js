
/**
 * @file Device Health Detection Logic per Platform
 * @description Comprehensive device health checks for browser, mobile, and desktop platforms
 * Supporting WebAuthn, biometrics, and secure SallyPort bridge APIs
 */

class DeviceHealth {
  /**
   * Initializes the DeviceHealth module.
   */
  constructor() {
    this.results = {};
    this.platform = this.detectPlatform();
    this.userAgent = navigator.userAgent;
  }

  /**
   * Detects the current platform
   * @returns {string} Platform identifier
   */
  detectPlatform() {
    const ua = navigator.userAgent;
    
    if (/Android/.test(ua)) return 'android';
    if (/iPhone|iPad|iPod/.test(ua)) return 'ios';
    if (/Macintosh/.test(ua)) return 'macos';
    if (/Windows/.test(ua)) return 'windows';
    if (/Linux/.test(ua)) return 'linux';
    
    return 'unknown';
  }

  /**
   * Runs all device health checks.
   * @returns {Promise<Object>} A promise that resolves with the health check results.
   */
  async runChecks() {
    this.results.platform = this.platform;
    this.results.timestamp = new Date().toISOString();
    
    await this.checkOSVersion();
    await this.checkDiskEncryption();
    await this.checkWebAuthnSupport();
    await this.checkBiometrics();
    await this.checkPasswordStatus();
    await this.checkJailbreakRoot();
    await this.checkBrowserSecurity();
    await this.checkSecureContext();
    
    return this.results;
  }

  /**
   * Checks the operating system version.
   */
  async checkOSVersion() {
    this.results.osVersion = this.getOSVersion() || 'unknown';
    // Implement logic to validate against minimum required version
    this.results.osVersionOk = true; // Placeholder
  }

  /**
   * Checks if disk encryption is enabled.
   * (Requires native integration via SallyPort bridge)
   */
  async checkDiskEncryption() {
    if (this.platform === 'macos' || this.platform === 'windows') {
      // Use SallyPort bridge to check for FileVault (macOS) or BitLocker (Windows)
      this.results.diskEncryption = await this.sallyPortInvoke('getDiskEncryptionStatus');
      this.results.diskEncryptionOk = this.results.diskEncryption === 'enabled';
    } else {
      this.results.diskEncryption = 'not_applicable';
      this.results.diskEncryptionOk = true;
    }
  }

  /**
   * Checks for WebAuthn support in the browser.
   */
  async checkWebAuthnSupport() {
    const isWebAuthnSupported = !!(navigator.credentials && navigator.credentials.create);
    this.results.webAuthnSupported = isWebAuthnSupported;
  }

  /**
   * Checks for biometric authentication availability.
   */
  async checkBiometrics() {
    try {
      const isAvailable = await window.PublicKeyCredential?.isUserVerifyingPlatformAuthenticatorAvailable();
      this.results.biometrics = isAvailable ? 'available' : 'unavailable';
      this.results.biometricsOk = !!isAvailable;
    } catch (e) {
      this.results.biometrics = 'error';
      this.results.biometricsOk = false;
    }
  }

  /**
   * Checks if a device password is enabled.
   * (Requires native integration via SallyPort bridge)
   */
  async checkPasswordStatus() {
    // Use SallyPort bridge to check for password/PIN status
    this.results.passwordEnabled = await this.sallyPortInvoke('getPasswordStatus');
    this.results.passwordEnabledOk = this.results.passwordEnabled === 'enabled';
  }

  /**
   * Checks for jailbreak or root status.
   * (Requires native integration via SallyPort bridge)
   */
  async checkJailbreakRoot() {
    if (this.platform === 'ios' || this.platform === 'android') {
      // Use SallyPort bridge for root/jailbreak detection
      this.results.jailbreakRoot = await this.sallyPortInvoke('getJailbreakRootStatus');
      this.results.jailbreakRootOk = this.results.jailbreakRoot === 'not_detected';
    } else {
      this.results.jailbreakRoot = 'not_applicable';
      this.results.jailbreakRootOk = true;
    }
  }

  /**
   * Performs browser security checks.
   */
  async checkBrowserSecurity() {
    // Placeholder for more advanced browser checks (e.g., extensions, version)
    this.results.browser = this.getBrowserInfo();
    this.results.browserSecurityOk = true; // Placeholder
  }

  /**
   * Checks if the page is in a secure context (HTTPS).
   */
  async checkSecureContext() {
    this.results.isSecureContext = window.isSecureContext;
  }
  
  /**
   * Invokes a secure SallyPort bridge function.
   * @param {string} functionName - The function to invoke.
   * @returns {Promise<any>} The result from the SallyPort bridge.
   */
  async sallyPortInvoke(functionName) {
    // Placeholder for SallyPort bridge invocation
    console.log(`Invoking SallyPort bridge function: ${functionName}`);
    return 'mock_data'; 
  }

  /**
   * Extracts the OS version from the user agent string.
   * @returns {string|null} The OS version or null if not found.
   */
  getOSVersion() {
    const ua = this.userAgent;
    let match;

    if (this.platform === 'macos') {
      match = ua.match(/Mac OS X ([\d_]+)/);
      return match ? match[1].replace(/_/g, '.') : null;
    }

    if (this.platform === 'windows') {
      match = ua.match(/Windows NT ([\d.]+)/);
      return match ? match[1] : null;
    }

    if (this.platform === 'android') {
      match = ua.match(/Android ([\d.]+)/);
      return match ? match[1] : null;
    }

    if (this.platform === 'ios') {
      match = ua.match(/OS ([\d_]+) like Mac OS X/);
      return match ? match[1].replace(/_/g, '.') : null;
    }

    return null;
  }

  /**
   * Extracts browser information from the user agent string.
   * @returns {Object} Browser name and version.
   */
  getBrowserInfo() {
    const ua = this.userAgent;
    let match;

    if ((match = ua.match(/(opera|chrome|safari|firefox|msie|trident(?=\/))\/?\s*(\d+)/i)) && match[1]) {
      return { name: match[1], version: match[2] };
    }

    return { name: 'unknown', version: 'unknown' };
  }
}

export default DeviceHealth;

