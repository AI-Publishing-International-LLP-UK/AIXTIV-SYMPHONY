import { ClaudeConfig } from './types'

export const defaultConfig: ClaudeConfig = {
  apiKey: process.env.CLAUDE_API_KEY || '',
  baseUrl: 'https://api.anthropic.com/v1',
  maxRetries: 3,
  timeout: 30000,
  rateLimitPerMinute: 50
}

export function validateConfig(config: Partial<ClaudeConfig>): ClaudeConfig {
  const finalConfig = { ...defaultConfig, ...config }

  if (!finalConfig.apiKey) {
    throw new Error('CLAUDE_API_KEY is required')
  }

  if (finalConfig.maxRetries < 0) {
    throw new Error('maxRetries must be >= 0')
  }

  if (finalConfig.timeout < 1000) {
    throw new Error('timeout must be >= 1000ms')
  }

  if (finalConfig.rateLimitPerMinute < 1) {
    throw new Error('rateLimitPerMinute must be >= 1')
  }

  return finalConfig
}
