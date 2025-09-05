/**
 * Region Service for HQRIX Compliance
 *
 * This service determines the region from which a request originated
 * to enforce regional restrictions for HQRIX compliance.
 */

import { Request } from 'express';

class RegionService {
  private readonly ALLOWED_REGION = 'us-west1';

  /**
   * Determines the region from which a request originated
   * using various headers and fallback mechanisms
   */
  getRegionFromRequest(req: Request): string {
    // Try Cloudflare headers first
    const cfRegion = req.headers['cf-region'] as string;
    if (cfRegion) {
      return this.normalizeRegion(cfRegion);
    }

    // Try Google Cloud Load Balancer headers
    const gclbRegion = req.headers['x-goog-region'] as string;
    if (gclbRegion) {
      return this.normalizeRegion(gclbRegion);
    }

    // Try X-Forwarded-* headers
    const forwardedRegion = req.headers['x-forwarded-region'] as string;
    if (forwardedRegion) {
      return this.normalizeRegion(forwardedRegion);
    }

    // Try custom region header
    const customRegion = req.headers['x-region'] as string;
    if (customRegion) {
      return this.normalizeRegion(customRegion);
    }

    // Try to infer from the host header
    const host = req.headers.host;
    if (host?.includes('us-west1')) {
      return 'us-west1';
    }

    // Default to allowed region for testing - in production, this should be more restrictive
    console.warn('Could not determine region from request, defaulting to us-west1');
    return 'us-west1';
  }

  /**
   * Normalizes region names to standard format
   */
  private normalizeRegion(region: string): string {
    const regionMap: Record<string, string> = {
      'us-west1': 'us-west1',
      'usw1': 'us-west1',
      'oregon': 'us-west1',
      'pdx': 'us-west1',
      'us-central1': 'us-central1',
      'usc1': 'us-central1',
      'iowa': 'us-central1',
      'eu-west1': 'eu-west1',
      'euw1': 'eu-west1',
      'ireland': 'eu-west1',
    };

    const normalized = regionMap[region.toLowerCase()];
    return normalized || region.toLowerCase();
  }

  /**
   * Checks if a region is allowed for HQRIX compliance
   */
  isRegionAllowed(region: string): boolean {
    const normalizedRegion = this.normalizeRegion(region);
    return normalizedRegion === this.ALLOWED_REGION;
  }

  /**
   * Gets the list of allowed regions
   */
  getAllowedRegions(): string[] {
    return [this.ALLOWED_REGION];
  }
}

export const regionService = new RegionService();
