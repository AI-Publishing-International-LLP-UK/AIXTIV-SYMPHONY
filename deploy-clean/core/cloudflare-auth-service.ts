
import { User, UserType, AuthProvider, UserAuthLevel, USER_TYPES } from '../../integrations/auth/user-auth-types';

// Re-export types for backwards compatibility
export { 
  User, 
  UserType, 
  AuthProvider, 
  UserAuthLevel, 
  USER_TYPES 
} from '../../integrations/auth/user-auth-types';

interface SalleyportClaims {
  roark_delegate?: boolean;
  vision_access?: boolean;
  copilot_admin?: boolean;
  subscriber_level?: 'authenticated' | 'purchased' | 'premium';
  access_token?: string;
}

interface CloudflareUser {
  id: string;
  email: string;
  name?: string;
  verified: boolean;
  created_at: string;
  custom_claims: SalleyportClaims;
}

export class CloudflareAuthService {
  private static instance: CloudflareAuthService;
  private currentUser: User | null = null;
  private authCallbacks: ((user: CloudflareUser | null) => void)[] = [];

  private constructor() {
    this.initializeCloudflareAuth();
  }

  private async initializeCloudflareAuth(): Promise<void> {
    try {
      const accessJwt = this.getCloudflareAccessJWT();
      if (accessJwt) {
        const user = await this.validateCloudflareToken(accessJwt);
        this.setCurrentUser(user as any);
      }
    } catch (error) {
      console.error('Error initializing Cloudflare authentication:', error);
    }
  }

  private getCloudflareAccessJWT(): string | null {
    const cookies = document.cookie.split(';');
    const accessCookie = cookies.find(cookie => 
      cookie.trim().startsWith('CF_Authorization=')
    );
    
    if (accessCookie) {
      return accessCookie.split('=')[1].trim();
    }
    
    return null;
  }

  private async validateCloudflareToken(token: string): Promise<CloudflareUser | null> {
    try {
      const response = await fetch('/api/auth/validate-token', {
        headers: {
          'CF-Access-Jwt-Assertion': token,
          'Authorization': `Bearer ${token}`
        }
      });
      
      if(response.ok) {
        const data = await response.json();
        return data.user;
      }
      return null;
    } catch (error) {
      console.error('Token validation failed:', error);
      return null;
    }
  }

  public static getInstance(): CloudflareAuthService {
    if (!CloudflareAuthService.instance) {
      CloudflareAuthService.instance = new CloudflareAuthService();
    }
    return CloudflareAuthService.instance;
  }

  private setCurrentUser(user: CloudflareUser | null): void {
    this.currentUser = user as any; // Cast to User
    this.authCallbacks.forEach(callback => callback(user));
  }

  public onAuthStateChanged(callback: (user: CloudflareUser | null) => void) {
    this.authCallbacks.push(callback);
    
    return () => {
      const index = this.authCallbacks.indexOf(callback);
      if (index > -1) {
        this.authCallbacks.splice(index, 1);
      }
    };
  }
  
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public async signInWithGoogle(): Promise<User> {
    return this.initiateOAuth2Flow({ provider: 'google' });
  }

  public async signInWithOutlook(): Promise<User> {
    return this.initiateOAuth2Flow({ provider: 'outlook' });
  }

  public async signInWithLinkedIn(): Promise<User> {
    return this.initiateOAuth2Flow({ provider: 'linkedin' });
  }

  public async signInWithEmail(email: string, password: string): Promise<User> {
    return this.initiateOAuth2Flow({ email, password });
  }

  public async registerWithEmail(email: string, password: string, displayName: string): Promise<User> {
    return this.initiateOAuth2Flow({ 
      email, 
      password, 
      displayName, 
      mode: 'register' 
    });
  }

  public async signOut(): Promise<void> {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      this.setCurrentUser(null);
      const logoutUrl = '/cdn-cgi/access/logout';
      window.location.href = logoutUrl;
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  private async initiateOAuth2Flow(options: any): Promise<User> {
    try {
      const response = await fetch('/api/auth/oauth-flow', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json',
          },
          body: JSON.stringify(options),
      });

      if(response.ok) {
          const { authUrl } = await response.json();
          if (options.mobile) {
              throw new Error(`Please complete authentication at: ${authUrl}`);
          }
          
          return new Promise((resolve, reject) => {
              const unsubscribe = this.onAuthStateChanged((user) => {
                  if (user) {
                      unsubscribe();
                      resolve(user as any);
                  }
              });

              setTimeout(() => {
                  unsubscribe();
                  reject(new Error('Authentication timeout'));
              }, 30000); 
          });
      }
      throw new Error("Failed to initiate OAuth2 flow")
      
    } catch (error) {
      console.error('OAuth2 flow failed:', error);
      throw error;
    }
  }
}

export const cloudflareAuthService = CloudflareAuthService.getInstance();

