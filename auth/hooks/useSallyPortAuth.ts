/**
 * SallyPort Authentication Hook
 * Provides easy access to SallyPort authentication functionality
 */

import { useContext, useCallback, useEffect } from 'react';
import { AuthContext } from '../components/SallyPortAuth';

export interface UseSallyPortAuthOptions {
  /**
   * Whether to verify the session with SallyPort on mount and periodically
   */
  autoVerify?: boolean;
  
  /**
   * Interval in milliseconds to verify the session with SallyPort
   * Default: 5 minutes
   */
  verifyInterval?: number;
  
  /**
   * Callback to execute when the session is verified
   */
  onVerified?: (isValid: boolean) => void;
}

/**
 * Custom hook for SallyPort authentication
 * Provides functions for login, logout, and session verification
 */
export const useSallyPortAuth = (options: UseSallyPortAuthOptions = {}) => {
  const { 
    autoVerify = false, 
    verifyInterval = 5 * 60 * 1000, // 5 minutes
    onVerified,
  } = options;
  
  const auth = useContext(AuthContext);
  
  // Handle session verification
  const verifySession = useCallback(async () => {
    if (!auth.user) {
      return false;
    }
    
    const isValid = await auth.verifySession();
    
    if (onVerified) {
      onVerified(isValid);
    }
    
    return isValid;
  }, [auth, onVerified]);
  
  // Set up automatic verification
  useEffect(() => {
    if (!autoVerify || !auth.user) {
      return () => {};
    }
    
    // Verify immediately on mount
    verifySession();
    
    // Set up interval for periodic verification
    const intervalId = setInterval(verifySession, verifyInterval);
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [autoVerify, auth.user, verifyInterval, verifySession]);
  
  // Return auth context and additional functionality
  return {
    ...auth,
    verifySession,
  };
};

export default useSallyPortAuth;