import axios, { AxiosInstance } from 'axios'
import pino from 'pino'
import rateLimit from 'express-rate-limit'
import { ClaudeConfig, ClaudeRequest, ClaudeResponse, QueuedRequest, ClaudeError } from './types'
import { validateConfig, defaultConfig } from './config'

export class ClaudeCoordinationSystem {
  private config: ClaudeConfig
  private axios: AxiosInstance
  private requestQueue: QueuedRequest[] = []
  private processing: boolean = false
  private logger: pino.Logger
  private rateLimiter: any

  constructor(config: Partial<ClaudeConfig> = {}) {
    this.config = validateConfig(config)
    this.logger = pino({ name: 'claude-coordination' })

    this.axios = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeout,
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json'
      }
    })

    this.rateLimiter = rateLimit({
      windowMs: 60 * 1000,
      max: this.config.rateLimitPerMinute
    })

    this.setupAxiosInterceptors()
  }

  private setupAxiosInterceptors() {
    this.axios.interceptors.response.use(
      response => response,
      async error => {
        const status = error.response?.status

        if (status === 429 || (status >= 500 && status < 600)) {
          const retryCount = error.config.__retryCount || 0

          if (retryCount < this.config.maxRetries) {
            error.config.__retryCount = retryCount + 1
            const delay = Math.pow(2, retryCount) * 1000
            await new Promise(resolve => setTimeout(resolve, delay))
            return this.axios(error.config)
          }
        }

        throw this.formatError(error)
      }
    )
  }

  private formatError(error: any): ClaudeError {
    const claudeError: ClaudeError = new Error(error.message) as ClaudeError
    claudeError.code = error.response?.data?.error?.code || 'UNKNOWN_ERROR'
    claudeError.status = error.response?.status
    claudeError.response = error.response
    return claudeError
  }

  async queueRequest(request: ClaudeRequest, priority: number = 1): Promise<ClaudeResponse> {
    return new Promise((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        id: Math.random().toString(36).substring(7),
        request,
        priority,
        timestamp: Date.now(),
        resolve,
        reject
      }

      this.requestQueue.push(queuedRequest)
      this.requestQueue.sort((a, b) => b.priority - a.priority)

      this.logger.info({ requestId: queuedRequest.id }, 'Request queued')

      if (!this.processing) {
        this.processQueue()
      }
    })
  }

  private async processQueue() {
    if (this.processing || this.requestQueue.length === 0) {
      return
    }

    this.processing = true

    try {
      while (this.requestQueue.length > 0) {
        const request = this.requestQueue.shift()!

        this.logger.info({ requestId: request.id }, 'Processing request')

        try {
          const response = await this.makeRequest(request.request)
          request.resolve(response)
          this.logger.info({ requestId: request.id }, 'Request completed')
        } catch (error) {
          request.reject(error)
          this.logger.error({ requestId: request.id, error }, 'Request failed')
        }

        // Rate limiting delay
        await new Promise(resolve => setTimeout(resolve, (60 * 1000) / this.config.rateLimitPerMinute))
      }
    } finally {
      this.processing = false
    }
  }

  private async makeRequest(request: ClaudeRequest): Promise<ClaudeResponse> {
    const response = await this.axios.post<ClaudeResponse>('/complete', {
      ...request,
      model: request.model || 'claude-2'
    })

    return response.data
  }

  // Middleware for request validation
  public validateRequestMiddleware() {
    return (req: any, res: any, next: any) => {
      const { prompt, model, temperature, maxTokens } = req.body

      if (!prompt || typeof prompt !== 'string') {
        return res.status(400).json({ error: 'Valid prompt is required' })
      }

      if (model && typeof model !== 'string') {
        return res.status(400).json({ error: 'Model must be a string' })
      }

      if (temperature && (typeof temperature !== 'number' || temperature < 0 || temperature > 1)) {
        return res.status(400).json({ error: 'Temperature must be between 0 and 1' })
      }

      if (maxTokens && (typeof maxTokens !== 'number' || maxTokens < 1)) {
        return res.status(400).json({ error: 'maxTokens must be a positive number' })
      }

      next()
    }
  }

  // Express middleware for rate limiting
  public getRateLimitMiddleware() {
    return this.rateLimiter
  }
}

export * from './types'
export { validateConfig, defaultConfig }
