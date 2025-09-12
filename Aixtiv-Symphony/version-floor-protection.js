/**
 * VERSION FLOOR PROTECTION SYSTEM
 * Diamond SAO Command Center - Critical Version Control
 * ABSOLUTE MINIMUM VERSION: 22.75
 * NO REGRESSION ALLOWED BELOW THIS THRESHOLD
 */

const MIN_VERSION = '22.75';
const CURRENT_VERSION = process.version;

class VersionFloorProtection {
  constructor() {
    this.minVersion = MIN_VERSION;
    this.currentVersion = CURRENT_VERSION;
    this.enforceFloor();
  }

  enforceFloor() {
    const current = this.parseVersion(this.currentVersion);
    const minimum = this.parseVersion(this.minVersion);
    
    if (this.isVersionBelow(current, minimum)) {
      console.error('🚨 CRITICAL VERSION VIOLATION DETECTED');
      console.error(`❌ Current: ${this.currentVersion}`);
      console.error(`🛡️  Minimum Required: ${this.minVersion}`);
      console.error('⚠️  DEPLOYMENT BLOCKED - VERSION TOO LOW');
      console.error('🔄 Please upgrade Node.js to version 22.75 or higher');
      process.exit(1);
    }
    
    console.log(`✅ Version Floor Protection: ${this.currentVersion} >= ${this.minVersion}`);
  }

  parseVersion(versionString) {
    const version = versionString.replace(/^v/, '');
    const parts = version.split('.').map(Number);
    return {
      major: parts[0] || 0,
      minor: parts[1] || 0,
      patch: parts[2] || 0
    };
  }

  isVersionBelow(current, minimum) {
    if (current.major < minimum.major) return true;
    if (current.major > minimum.major) return false;
    
    if (current.minor < minimum.minor) return true;
    if (current.minor > minimum.minor) return false;
    
    return current.patch < minimum.patch;
  }

  getVersionStatus() {
    return {
      current: this.currentVersion,
      minimum: this.minVersion,
      compliant: !this.isVersionBelow(
        this.parseVersion(this.currentVersion),
        this.parseVersion(this.minVersion)
      )
    };
  }
}

// Immediate enforcement on module load
const protection = new VersionFloorProtection();

export {
  VersionFloorProtection,
  MIN_VERSION
};

export const enforceMinimumVersion = () => protection.enforceFloor();
export const getVersionStatus = () => protection.getVersionStatus();

// Default export
export default {
  VersionFloorProtection,
  MIN_VERSION,
  enforceMinimumVersion: () => protection.enforceFloor(),
  getVersionStatus: () => protection.getVersionStatus()
};
