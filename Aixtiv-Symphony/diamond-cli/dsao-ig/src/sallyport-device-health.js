
/**
 * @file SallyPort Device Health
 * @description Initiates device health checks and integrates with SallyPort authentication.
 */

import DeviceHealth from './device-health.js';
import DeviceHealthCard from './device-health-card.js';

class SallyPortDeviceHealth {
  constructor() {
    this.deviceHealth = new DeviceHealth();
    this.uiContainer = document.getElementById('sallyport-health-check');
  }

  /**
   * Runs the device health assessment and updates the UI.
   */
  async runAssessment() {
    if (!this.uiContainer) {
      console.error('SallyPort UI container not found');
      return;
    }

    // 1. Run Device Health Checks
    const healthResults = await this.deviceHealth.runChecks();

    // 2. Create and Render Health Card
    const healthCard = new DeviceHealthCard(healthResults);
    this.uiContainer.innerHTML = healthCard.render();

    // 3. Send health data to the backend
    this.sendHealthData(healthResults);
  }

  /**
   * Sends device health data to the SallyPort backend.
   * @param {Object} healthData - The device health results.
   */
  sendHealthData(healthData) {
    // This would be an API call to your backend
    console.log('Sending health data to SallyPort backend:', healthData);
    
    fetch('/api/sallyport/device-health', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(healthData),
    })
      .then(response => response.json())
      .then(data => {
        console.log('SallyPort backend response:', data);
      // Handle backend response, e.g., proceed with login or show remediation steps
      })
      .catch(error => {
        console.error('Error sending device health data:', error);
      });
  }
}

export default SallyPortDeviceHealth;

