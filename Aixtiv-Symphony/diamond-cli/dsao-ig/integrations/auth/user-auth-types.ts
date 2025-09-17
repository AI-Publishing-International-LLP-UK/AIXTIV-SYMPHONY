// User Authentication Levels
export enum UserAuthLevel {
  NON_AUTHENTICATED = 0,
  DR_MATCH = 1,
  DR_GRANT = 2,
  PAYMENT_VERIFIED = 2.5,
  TRIAL_PERIOD = 2.75,
  FULLY_REGISTERED = 3,
}

// Authentication Provider Types
export enum AuthProvider {
  NONE = 'none',
  GOOGLE = 'google',
  OUTLOOK = 'outlook',
  LINKEDIN = 'linkedin',
  EMAIL_PASSWORD = 'email_password',
  CLOUDFLARE = 'cloudflare',
  WHATSAPP = 'whatsapp',
  WHATSAPP_BUSINESS = 'whatsapp_business'
}

// User interface
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  userType: string;
  authLevel: UserAuthLevel;
  authProvider: AuthProvider;
  verifiedEmail: boolean;
  verifiedPaymentMethod: boolean;
  culturalEmpathyCode?: string;
  paymentMethodId?: string;
  trialStartDate?: Date;
  trialEndDate?: Date;
  dreamCommanderInStasis?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// User Type interface
export interface UserType {
  id: string;
  level: UserAuthLevel;
  name: string;
  description: string;
  privileges: string[];
  allowedOperations: string[];
}

// Auth State interface
export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  userType: UserType | null;
  isLoading: boolean;
  error: string | null;
}

// Default User Types
export const USER_TYPES: { [key: string]: UserType } = {
  guest: {
    id: 'guest',
    level: UserAuthLevel.NON_AUTHENTICATED,
    name: 'Guest',
    description: 'Non-authenticated user with limited access',
    privileges: ['view_public_content'],
    allowedOperations: ['read_public'],
  },
  authenticated: {
    id: 'authenticated',
    level: UserAuthLevel.DR_MATCH,
    name: 'Dr. Match Authenticated',
    description: 'Basic authenticated user',
    privileges: ['view_public_content', 'view_basic_features', 'comment'],
    allowedOperations: ['read_public', 'read_basic', 'write_comments'],
  },
  verified: {
    id: 'verified',
    level: UserAuthLevel.DR_GRANT,
    name: 'Dr. Grant Verified',
    description: 'Email verified user with free publication',
    privileges: [
      'view_public_content',
      'view_basic_features',
      'comment',
      'publish_free',
    ],
    allowedOperations: [
      'read_public',
      'read_basic',
      'write_comments',
      'write_publications',
    ],
  },
  paymentVerified: {
    id: 'paymentVerified',
    level: UserAuthLevel.PAYMENT_VERIFIED,
    name: 'Payment Method Verified',
    description: 'User with validated payment method',
    privileges: [
      'view_public_content',
      'view_basic_features',
      'comment',
      'publish_free',
      'access_premium_content',
    ],
    allowedOperations: [
      'read_public',
      'read_basic',
      'read_premium',
      'write_comments',
      'write_publications',
    ],
  },
  trialPeriod: {
    id: 'trialPeriod',
    level: UserAuthLevel.TRIAL_PERIOD,
    name: 'Trial Period User',
    description: 'User in 3-day free trial with validated payment',
    privileges: [
      'view_public_content',
      'view_basic_features',
      'comment',
      'publish_free',
      'access_premium_content',
      'access_trial_features',
    ],
    allowedOperations: [
      'read_public',
      'read_basic',
      'read_premium',
      'write_comments',
      'write_publications',
      'create_dream_commander',
    ],
  },
  fullyRegistered: {
    id: 'fullyRegistered',
    level: UserAuthLevel.FULLY_REGISTERED,
    name: 'Fully Registered User',
    description: 'Permanent registered user with cultural-empathy code',
    privileges: [
      'view_public_content',
      'view_basic_features',
      'comment',
      'publish_free',
      'access_premium_content',
      'access_all_features',
      'download_content',
    ],
    allowedOperations: [
      'read_public',
      'read_basic',
      'read_premium',
      'write_comments',
      'write_publications',
      'create_dream_commander',
      'download_lenz',
      'download_co_pilot_nft',
    ],
  },
};
