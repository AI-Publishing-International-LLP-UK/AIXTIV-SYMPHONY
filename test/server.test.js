/**
 * Tests for the ASOOS Unified Server
 */

const { fastify } = require('../server');

// Mock search service
jest.mock('../src/services/search', () => ({
  searchWeb: jest.fn().mockResolvedValue({
    results: [
      { title: 'Test Result 1', url: 'https://example.com/1' },
      { title: 'Test Result 2', url: 'https://example.com/2' }
    ],
    totalResults: 2
  }),
  multiSearch: jest.fn().mockResolvedValue({
    web: [{ title: 'Web Result', url: 'https://example.com/web' }],
    images: [{ title: 'Image Result', url: 'https://example.com/image.jpg' }]
  })
}));

// Import UUID after mocking
jest.mock('uuid', () => ({
  v4: jest.fn().mockReturnValue('test-uuid-1234')
}));

describe('ASOOS Server', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await fastify.close();
  });

  describe('Health Check API', () => {
    it('should return health status', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/health'
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload.status).toBe('ok');
      expect(payload.version).toBe('1.0.1');
      expect(payload.service).toBe('Aixtiv Symphony API');
    });
  });

  describe('Status API', () => {
    it('should return operational status', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/status'
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload.message).toBe('Aixtiv Symphony Opus Operating System is operational');
      expect(payload).toHaveProperty('timestamp');
      expect(payload).toHaveProperty('environment');
    });
  });

  describe('Secrets API', () => {
    it('should return a list of secrets', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/secrets/list'
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('secrets');
      expect(payload).toHaveProperty('count');
      expect(Array.isArray(payload.secrets)).toBe(true);
      expect(payload.count).toBe(payload.secrets.length);
    });
  });

  describe('Search API', () => {
    it('should search web content', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/search/web',
        payload: {
          query: 'test query',
          options: { limit: 10 }
        }
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('results');
      expect(payload.results.length).toBe(2);
    });

    it('should perform multi-search', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/search/multi',
        payload: {
          query: 'test query',
          searchTypes: ['web', 'images']
        }
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('web');
      expect(payload).toHaveProperty('images');
    });
  });

  describe('Video Room API', () => {
    it('should create a video room', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/video/create-room',
        payload: {
          userId: 'user-123',
          sessionType: 'training'
        }
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload.success).toBe(true);
      expect(payload).toHaveProperty('room');
      expect(payload.room.name).toContain('aixtiv-sym-training');
    });

    it('should reject with missing parameters', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/video/create-room',
        payload: {
          userId: 'user-123'
          // Missing sessionType
        }
      });

      expect(response.statusCode).toBe(400);
      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('error');
      expect(payload).toHaveProperty('requiredFields');
    });
  });

  describe('Products API', () => {
    it('should return products', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/products'
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload.success).toBe(true);
      expect(payload).toHaveProperty('products');
      expect(Array.isArray(payload.products)).toBe(true);
    });

    it('should filter products by category', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/products?category=training'
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload.success).toBe(true);
      expect(payload.products.length).toBeGreaterThan(0);
      expect(payload.products.every(p => p.category === 'training')).toBe(true);
    });
  });

  describe('UUID Validation API', () => {
    it('should validate a valid UUID', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/validate-uuid',
        payload: {
          uuid: 'valid-uuid-123'
        }
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload.valid).toBe(true);
      expect(payload).toHaveProperty('metadata');
    });

    it('should reject an invalid UUID', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/validate-uuid',
        payload: {
          uuid: 'invalid'
        }
      });

      expect(response.statusCode).toBe(200);
      const payload = JSON.parse(response.payload);
      expect(payload.valid).toBe(false);
      expect(payload.metadata).toBeNull();
    });

    it('should require a UUID', async () => {
      const response = await fastify.inject({
        method: 'POST',
        url: '/api/validate-uuid',
        payload: {}
      });

      expect(response.statusCode).toBe(400);
      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('error');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for non-existent API routes', async () => {
      const response = await fastify.inject({
        method: 'GET',
        url: '/api/non-existent'
      });

      expect(response.statusCode).toBe(404);
      const payload = JSON.parse(response.payload);
      expect(payload).toHaveProperty('error');
      expect(payload.error).toBe('Not Found');
    });
  });
});