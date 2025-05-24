// frontend/auth/salleyport-auth.ts
import { NextAuthOptions } from 'next-auth';
import { JWT } from 'next-auth/jwt';

/**
 * NOTE: Environment Variables Required
 * The following environment variables should be configured in your project's .env file:
 * - SALLEYPORT_AUTH_URL: URL of the Salleyport authentication service
 * - SALLEYPORT_AUDIT_URL: URL of the Salleyport audit logging service
 * - SALLEYPORT_AUDIT_API_KEY: API key for the Salleyport audit system
 */
/**
 * Salleyport Authentication Configuration
 * Integrates with the Salleyport security system for advanced authentication
 */
export const salleyportAuthOptions: NextAuthOptions = {
  providers: [
    // Existing providers configuration...
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // Add Salleyport token data to the JWT
      if (account && user) {
        token.salleyportAccessToken = account.access_token;
        token.salleyportRefreshToken = account.refresh_token;
        token.salleyportExpiresAt = account.expires_at;
        token.salleyportPermissions = user.permissions;
      }

      // Check for token expiration and refresh if needed
      if (
        token.salleyportExpiresAt &&
        Date.now() >= token.salleyportExpiresAt * 1000
      ) {
        return refreshSalleyportAccessToken(token);
      }

      return token;
    },
    async session({ session, token }) {
      // Add Salleyport security context to session
      session.user.salleyportPermissions = token.salleyportPermissions;
      session.salleyportSecurityContext = {
        environmentAccess: token.salleyportPermissions?.environments || [],
        securityClearance:
          token.salleyportPermissions?.clearanceLevel || 'standard',
        agentAccess: token.salleyportPermissions?.agentAccess || 'basic',
      };

      return session;
    },
  },
  events: {
    async signIn({ user }) {
      // Log security event to Salleyport audit system
      await logSalleyportSecurityEvent({
        eventType: 'USER_SIGN_IN',
        userId: user.id,
        timestamp: new Date().toISOString(),
        metadata: {
          userAgent: globalThis.navigator?.userAgent,
          ipAddress: '{{request.ip}}', // Will be replaced by middleware
        },
      });
    },
  },
  pages: {
    signIn: '/auth/salleyport-signin',
    error: '/auth/salleyport-error',
  },
};

/**
 * Refreshes an expired Salleyport access token
 */
async function refreshSalleyportAccessToken(token: JWT): Promise<JWT> {
  try {
    const response = await fetch(`${process.env.SALLEYPORT_AUTH_URL}/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refresh_token: token.salleyportRefreshToken,
      }),
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      throw refreshedTokens;
    }

    return {
      ...token,
      salleyportAccessToken: refreshedTokens.access_token,
      salleyportRefreshToken:
        refreshedTokens.refresh_token ?? token.salleyportRefreshToken,
      salleyportExpiresAt: Math.floor(
        Date.now() / 1000 + refreshedTokens.expires_in
      ),
    };
  } catch (error) {
    // Token refresh failed - force re-authentication
    return {
      ...token,
      error: 'RefreshSalleyportAccessTokenError',
    };
  }
}

/**
 * Logs security events to Salleyport audit system
 */
async function logSalleyportSecurityEvent(event: {
  eventType: string;
  userId: string;
  timestamp: string;
  metadata: Record<string, any>;
}) {
  try {
    await fetch(`${process.env.SALLEYPORT_AUDIT_URL}/log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.SALLEYPORT_AUDIT_API_KEY}`,
      },
      body: JSON.stringify(event),
    });
  } catch (error) {
    console.error('Failed to log security event to Salleyport:', error);
  }
}
