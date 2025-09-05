import { cloudflareAuthService, CloudflareAuthService, User, UserType, USER_TYPES } from '../../src/core/cloudflare-auth-service';

// Re-export centralized service and types
export { cloudflareAuthService as authService, CloudflareAuthService as AuthService };
export { User, UserType, USER_TYPES };

// Legacy wrapper class for backwards compatibility
export class LegacyAuthService {
  private static instance: LegacyAuthService;
  
  private constructor() {}
  
  public static getInstance(): LegacyAuthService {
    if (!LegacyAuthService.instance) {
      LegacyAuthService.instance = new LegacyAuthService();
    }
    return LegacyAuthService.instance;
  }
  
  public getCurrentUser(): User | null {
    return cloudflareAuthService.getCurrentUser();
  }
  
  public signInWithSocial(provider: 'google' | 'microsoft' | 'linkedin'): void {
    const providerMap = {
      'microsoft': 'outlook'
    };
    const mappedProvider = providerMap[provider] || provider;
    
    if (mappedProvider === 'google') {
      cloudflareAuthService.signInWithGoogle();
    } else if (mappedProvider === 'outlook') {
      cloudflareAuthService.signInWithOutlook();
    } else if (mappedProvider === 'linkedin') {
      cloudflareAuthService.signInWithLinkedIn();
    }
  }
  
  public signOut(): void {
    cloudflareAuthService.signOut();
  }
  
  public onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return cloudflareAuthService.onAuthStateChanged(callback as any);
  }
  
  public getUserType(userTypeId: string): UserType | null {
    return USER_TYPES[userTypeId] || null;
  }
}

// Export legacy instance for backwards compatibility
export const legacyAuthService = LegacyAuthService.getInstance();
