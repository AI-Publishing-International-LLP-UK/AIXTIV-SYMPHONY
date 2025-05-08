/**
 * TypeScript Interface Definitions for the ASOOS Gateway Component
 * Project: api-for-warp-drive
 * Region: us-west1b
 */

export interface BaseGatewayConfig {
  endpoint: string;
  timeout?: number;
  retryAttempts?: number;
  apiKey?: string;
  zone?: 'us-west1b';
}

export interface AuthToken {
  token: string;
  expiresAt: number;
  refreshToken?: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    totalCount?: number;
    page?: number;
    pageSize?: number;
  };
}

export interface ServiceClient {
  request<T>(path: string, method: 'GET'|'POST'|'PUT'|'DELETE', data?: unknown): Promise<ApiResponse<T>>;
  setAuthToken(token: AuthToken): void;
}

export interface EventPayload<T = unknown> {
  id: string;
  timestamp: number;
  type: string;
  source: string;
  data: T;
}
