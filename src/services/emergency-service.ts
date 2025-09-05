/**
 * Emergency Service for HQRIX Compliance
 *
 * This service manages emergency shutdown procedures and state checking
 * to ensure the system can be immediately locked down if necessary.
 */

import { Storage } from '@google-cloud/storage';

export class EmergencyService {
  private static EMERGENCY_BUCKET = 'asoos-hqrix-quarantine-us-west1';
  private static EMERGENCY_FILE = 'emergency-shutdown-state.json';
  private static storage = new Storage({
    projectId: 'api-for-warp-drive',
  });

  /**
   * Checks if an emergency shutdown is currently active
   */
  static async isEmergencyShutdownActive(): Promise<boolean> {
    try {
      const bucket = this.storage.bucket(this.EMERGENCY_BUCKET);
      const file = bucket.file(this.EMERGENCY_FILE);
      
      const [exists] = await file.exists();
      if (!exists) {
        return false;
      }

      const [contents] = await file.download();
      const emergencyState = JSON.parse(contents.toString());
      
      return emergencyState.active === true;
    } catch (error) {
      console.error('Error checking emergency shutdown state:', error);
      // In case of error, default to safe state (shutdown active)
      return true;
    }
  }

  /**
   * Activates emergency shutdown
   */
  static async activateEmergencyShutdown(reason: string): Promise<void> {
    try {
      const bucket = this.storage.bucket(this.EMERGENCY_BUCKET);
      const file = bucket.file(this.EMERGENCY_FILE);
      
      const emergencyState = {
        active: true,
        activatedAt: new Date().toISOString(),
        reason: reason,
        activatedBy: 'HQRIX_EMERGENCY_SYSTEM'
      };

      await file.save(JSON.stringify(emergencyState), {
        metadata: {
          contentType: 'application/json',
        },
      });
    } catch (error) {
      console.error('Error activating emergency shutdown:', error);
      throw error;
    }
  }

  /**
   * Deactivates emergency shutdown
   */
  static async deactivateEmergencyShutdown(): Promise<void> {
    try {
      const bucket = this.storage.bucket(this.EMERGENCY_BUCKET);
      const file = bucket.file(this.EMERGENCY_FILE);
      
      const emergencyState = {
        active: false,
        deactivatedAt: new Date().toISOString(),
        deactivatedBy: 'HQRIX_ADMIN'
      };

      await file.save(JSON.stringify(emergencyState), {
        metadata: {
          contentType: 'application/json',
        },
      });
    } catch (error) {
      console.error('Error deactivating emergency shutdown:', error);
      throw error;
    }
  }
}
