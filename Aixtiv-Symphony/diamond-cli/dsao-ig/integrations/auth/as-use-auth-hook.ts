import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { authService } from './as-auth-service';
import { User, UserType, AuthState, USER_TYPES } from './user-auth-types';

// Vision Lake Solutions - Silent Authentication & SallyPort types
export interface BehavioralBiometric {
  typingPattern?: string;
  interactionTiming?: number[];
  scrollPattern?: number[];
  lastAnalyzed?: Date;
  confidenceScore?: number; // 0-100 scale
}

export interface DeviceIdentifier {
  deviceId: string;
  deviceType: 'mobile' | 'desktop' | 'tablet' | 'other';
  browser: string;
  os: string;
  lastSeen: Date;
  isTrusted: boolean;
  trustLevel: number; // 0-100 scale
}

export interface LocationData {
  country: string;
  region: string;
  city?: string;
  lastAccessed: Date;
  isAnomaly: boolean;
  ipAddress?: string;
}

export interface SilentAuthProfile {
  userId: string;
  behavioralBiometrics: BehavioralBiometric[];
  trustedDevices: DeviceIdentifier[];
  knownLocations: LocationData[];
  authStrength: number; // 0-100 scale
  lastUpdated: Date;
  riskScore: number; // 0-100 (higher = riskier)
}

export interface SallyPortVerification {
  verificationId: string;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  approverEmail?: string;
  approverName?: string;
  requestedAt: Date;
  expiresAt: Date;
  completedAt?: Date;
  accessLevel: string;
  purpose: string;
  deviceInfo: DeviceIdentifier;
  locationInfo: LocationData;
}

export interface MultiLevelAuthState extends AuthState {
  silentAuthProfile?: SilentAuthProfile;
  continuousAuthScore?: number; // Real-time score from 0-100
  activeSallyPortVerifications?: SallyPortVerification[];
  isSilentAuthEnabled: boolean;
  isSallyPortEnabled: boolean;
  authLevel: 'basic' | 'silent' | 'sallyport' | 'full'; // Progression of auth levels
}

// Create Auth Context
const AuthContext = createContext<{
  authState: MultiLevelAuthState;
  signInWithSocial: (provider: 'google' | 'microsoft' | 'linkedin') => void;
  signOut: () => Promise<void>;
  upgradeToDrGrant: (userId: string) => Promise<void>;
  addPaymentMethodAndUpgrade: (userId: string, paymentMethodId: string) => Promise<void>;
  activateTrialPeriod: (userId: string) => Promise<void>;
  upgradeToFullyRegistered: (userId: string, culturalEmpathyCode: string) => Promise<void>;
  // VLS Silent Authentication Methods
  enableSilentAuth: (userId: string) => Promise<void>;
  updateBehavioralBiometrics: (biometricData: Partial<BehavioralBiometric>) => Promise<void>;
  registerTrustedDevice: (deviceInfo: Omit<DeviceIdentifier, 'lastSeen' | 'isTrusted' | 'trustLevel'>) => Promise<void>;
  getSilentAuthProfile: (userId: string) => Promise<SilentAuthProfile | null>;
  verifySilentAuthScore: () => Promise<number>; // Returns current trust score
  // VLS SallyPort Methods
  requestSallyPortAccess: (purpose: string, accessLevel: string) => Promise<SallyPortVerification>;
  checkSallyPortStatus: (verificationId: string) => Promise<SallyPortVerification | null>;
  approveSallyPortRequest: (verificationId: string, approverEmail: string, approverName: string) => Promise<void>;
  rejectSallyPortRequest: (verificationId: string, reason: string) => Promise<void>;
  getActiveSallyPortVerifications: (userId: string) => Promise<SallyPortVerification[]>;
}>({
  authState: {
    isAuthenticated: false,
    user: null,
    userType: null,
    isLoading: true,
    error: null,
    isSilentAuthEnabled: false,
    isSallyPortEnabled: false,
    authLevel: 'basic',
    continuousAuthScore: 0
  },
  signInWithSocial: () => {},
  signOut: async () => {},
  upgradeToDrGrant: async () => {},
  addPaymentMethodAndUpgrade: async () => {},
  activateTrialPeriod: async () => {},
  upgradeToFullyRegistered: async () => {},
  enableSilentAuth: async () => {},
  updateBehavioralBiometrics: async () => {},
  registerTrustedDevice: async () => {},
  getSilentAuthProfile: async () => null,
  verifySilentAuthScore: async () => 0,
  requestSallyPortAccess: async () => ({ 
    verificationId: '', 
    status: 'pending', 
    requestedAt: new Date(), 
    expiresAt: new Date(), 
    accessLevel: '', 
    purpose: '',
    deviceInfo: { 
      deviceId: '', 
      deviceType: 'other', 
      browser: '', 
      os: '', 
      lastSeen: new Date(), 
      isTrusted: false, 
      trustLevel: 0 
    },
    locationInfo: { 
      country: '', 
      region: '', 
      lastAccessed: new Date(), 
      isAnomaly: false 
    }
  }),
  checkSallyPortStatus: async () => null,
  approveSallyPortRequest: async () => {},
  rejectSallyPortRequest: async () => {},
  getActiveSallyPortVerifications: async () => []
});

// Auth Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<MultiLevelAuthState>({
    isAuthenticated: false,
    user: null,
    userType: null,
    isLoading: true,
    error: null,
    isSilentAuthEnabled: false,
    isSallyPortEnabled: false,
    authLevel: 'basic',
    continuousAuthScore: 0
  });

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setAuthState({
        isAuthenticated: !!user,
        user,
        userType: user ? USER_TYPES[user.userType] : null,
        isLoading: false,
        error: null,
        isSilentAuthEnabled: false,
        isSallyPortEnabled: false,
        authLevel: 'basic',
        continuousAuthScore: 0
      });
    });

    return () => unsubscribe();
  }, []);

  // Sign in with social provider
  const signInWithSocial = (provider: 'google' | 'microsoft' | 'linkedin') => {
    if (provider === 'google') {
      authService.signInWithGoogle();
    } else if (provider === 'microsoft') {
      authService.signInWithOutlook();
    } else if (provider === 'linkedin') {
      authService.signInWithLinkedIn();
    }
  };





  // Sign out
  const signOut = async () => {
    setAuthState({ ...authState, isLoading: true, error: null });
    try {
      await authService.signOut();
      setAuthState({
        isAuthenticated: false,
        user: null,
        userType: null,
        isLoading: false,
        error: null
      });
    } catch (error) {
      setAuthState({
        ...authState,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Error signing out'
      });
    }
  };

  // Placeholder methods (not implemented in Cloudflare Auth)
  const upgradeToDrGrant = async (userId: string) => {
    console.log('upgradeToDrGrant not implemented with Cloudflare Auth');
  };

  const addPaymentMethodAndUpgrade = async (userId: string, paymentMethodId: string) => {
    console.log('addPaymentMethodAndUpgrade not implemented with Cloudflare Auth');
  };

  const activateTrialPeriod = async (userId: string) => {
    console.log('activateTrialPeriod not implemented with Cloudflare Auth');
  };

  const upgradeToFullyRegistered = async (userId: string, culturalEmpathyCode: string) => {
    console.log('upgradeToFullyRegistered not implemented with Cloudflare Auth');
  };

  return (
    <AuthContext.Provider
      value={{
        authState,
        signInWithSocial,
        signOut,
        upgradeToDrGrant,
        addPaymentMethodAndUpgrade,
        activateTrialPeriod,
        upgradeToFullyRegistered
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Hook for using auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
