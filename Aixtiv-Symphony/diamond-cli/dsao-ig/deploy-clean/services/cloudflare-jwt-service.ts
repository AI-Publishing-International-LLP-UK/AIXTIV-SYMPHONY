
import { Request } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { User, UserType, AuthProvider, UserAuthLevel, USER_TYPES } from '../../integrations/auth/user-auth-types';

const CLOUDFLARE_TEAM_DOMAIN = process.env.CLOUDFLARE_TEAM_DOMAIN; // e.g., 'your-team.cloudflareaccess.com'
const JWKS_URL = `https://${CLOUDFLARE_TEAM_DOMAIN}/cdn-cgi/access/certs`;

const client = jwksClient({
  jwksUri: JWKS_URL,
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  if (!header.kid) {
    return callback(new Error('No KID in JWT header'));
  }
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      return callback(err);
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

export interface CloudflareJWTClaims extends jwt.JwtPayload {
  email: string;
  identity_nonce: string;
  country: string;
  // Custom claims from your identity provider
  roles?: string[];
  userType?: string;
  subscriber_level?: string;
  // SallyPort-specific claims
  delegate?: boolean;
  copilot_admin?: boolean;
  vision_access?: boolean;
  subscription_level?: string;
}

export interface CloudflareUserContext {
  id: string;
  email: string;
  roles: string[];
  userType: UserType;
  authLevel: UserAuthLevel;
  authProvider: AuthProvider;
  [key: string]: any; // Allow other claims
}

export const validateCloudflareJWT = (token: string): Promise<CloudflareJWTClaims | null> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, { audience: process.env.CLOUDFLARE_AUDIENCE, issuer: `https://${CLOUDFLARE_TEAM_DOMAIN}` }, (err, decoded) => {
      if (err) {
        console.error('JWT validation error:', err);
        return resolve(null);
      }
      resolve(decoded as CloudflareJWTClaims);
    });
  });
};

export function getTokenFromRequest(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  const cfJwtHeader = req.headers['cf-access-jwt-assertion'];
  if (typeof cfJwtHeader === 'string') {
    return cfJwtHeader;
  }

  if (req.cookies && req.cookies.CF_Authorization) {
    return req.cookies.CF_Authorization;
  }

  return null;
}

export function extractUserContext(claims: CloudflareJWTClaims): CloudflareUserContext {
    const userTypeKey = claims.userType || 'authenticated';
    const userType = USER_TYPES[userTypeKey] || USER_TYPES.guest;
  
    const userContext: CloudflareUserContext = {
      id: claims.sub || claims.email, // Use subject, fallback to email
      email: claims.email,
      roles: claims.roles || [],
      userType: userType,
      authLevel: userType.level,
      authProvider: AuthProvider.CLOUDFLARE,
      ...claims // include all other claims
    };
  
    return userContext;
  }

