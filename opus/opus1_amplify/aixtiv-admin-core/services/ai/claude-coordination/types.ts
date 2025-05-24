import { AxiosResponse } from 'axios'

export interface ClaudeConfig {
  apiKey: string
  baseUrl: string
  maxRetries: number
  timeout: number
  rateLimitPerMinute: number
}

export interface ClaudeRequest {
  prompt: string
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface ClaudeResponse {
  id: string
  completion: string
  model: string
  stop_reason: string
  truncated: boolean
}

export interface QueuedRequest {
  id: string
  request: ClaudeRequest
  priority: number
  timestamp: number
  resolve: (value: ClaudeResponse) => void
  reject: (error: Error) => void
}

export interface ClaudeError extends Error {
  code: string
  status?: number
  response?: AxiosResponse
}
