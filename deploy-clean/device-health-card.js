
/**
 * @file Device Health Card
 * @description This module creates a UI component to display device health check results.
 */

class DeviceHealthCard {
  /**
   * Initializes the DeviceHealthCard module.
   * @param {Object} healthResults - The device health check results.
   */
  constructor(healthResults) {
    this.healthResults = healthResults;
  }

  /**
   * Renders the device health card.
   * @returns {string} The HTML for the device health card.
   */
  render() {
    return `
      <div class="device-health-card">
        <h2>Device Health</h2>
        <ul>
          ${this.renderCheck('OS Version', this.healthResults.osVersion, this.healthResults.osVersionOk)}
          ${this.renderCheck('Disk Encryption', this.healthResults.diskEncryption, this.healthResults.diskEncryptionOk)}
          ${this.renderCheck('Biometrics', this.healthResults.biometrics, this.healthResults.biometricsOk)}
          ${this.renderCheck('Password', this.healthResults.passwordEnabled, this.healthResults.passwordEnabledOk)}
          ${this.renderCheck('Jailbreak/Root', this.healthResults.jailbreakRoot, this.healthResults.jailbreakRootOk)}
        </ul>
      </div>
    `;
  }

  /**
   * Renders a single health check item.
   * @param {string} label - The label for the check.
   * @param {string} value - The value of the check.
   * @param {boolean} isOk - Whether the check passed.
   * @returns {string} The HTML for the health check item.
   */
  renderCheck(label, value, isOk) {
    return `
      <li>
        <span class="label">${label}:</span>
        <span class="value">${value}</span>
        <span class="status ${isOk ? 'ok' : 'not-ok'}">${isOk ? 'OK' : 'Failed'}</span>
      </li>
    `;
  }
}

export default DeviceHealthCard;

