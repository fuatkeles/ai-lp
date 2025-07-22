const request = require('supertest');
const express = require('express');
const landingPagesRoutes = require('../api/landing-pages');

// Mock the services
jest.mock('../services/kimiService');
jest.mock('../services/firebaseService');
jest.mock('../services/authService');

const { generateLandingPage } = require('../services/kimiService');
const { getFirestore } = require('../services/firebaseService');
const { verifyJWTToken } = require('../services/authService');

// Create test app
const app = express();
app.use(express.json());
app.use(require('cookie-parser')()); // Add cookie parser for tests
app.use('/api/landing-pages', landingPagesRoutes);

describe('Landing Pages API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/landing-pages/generate', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .post('/api/landing-pages/generate')
        .send({
          prompt: 'Create a landing page for a coffee shop'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('NO_TOKEN');
    });

    test('should validate prompt requirements', async () => {
      // Mock successful authentication
      verifyJWTToken.mockReturnValue({
        success: true,
        user: { uid: 'test-user', email: 'test@example.com' }
      });

      const response = await request(app)
        .post('/api/landing-pages/generate')
        .set('Authorization', 'Bearer test-token')
        .send({
          prompt: 'hi' // Too short
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('should generate landing page successfully', async () => {
      // Mock successful authentication
      verifyJWTToken.mockReturnValue({
        success: true,
        user: { uid: 'test-user', email: 'test@example.com' }
      });

      // Mock successful AI generation
      generateLandingPage.mockResolvedValue({
        success: true,
        data: {
          content: JSON.stringify({
            html: '<!DOCTYPE html><html><head><title>Coffee Shop</title></head><body><h1>Welcome</h1></body></html>',
            css: 'body { font-family: Arial; }',
            javascript: 'console.log("loaded");'
          }),
          metadata: {
            model: 'moonshot-v1-8k',
            processingTime: 1500,
            tokens: { total_tokens: 500 }
          }
        }
      });

      // Mock Firestore
      const mockDocRef = { id: 'test-page-id' };
      const mockCollection = {
        add: jest.fn().mockResolvedValue(mockDocRef)
      };
      const mockDb = {
        collection: jest.fn().mockReturnValue(mockCollection)
      };
      getFirestore.mockReturnValue(mockDb);

      const response = await request(app)
        .post('/api/landing-pages/generate')
        .set('Authorization', 'Bearer test-token')
        .send({
          prompt: 'Create a modern landing page for a coffee shop',
          title: 'Coffee Shop Landing Page'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('test-page-id');
      expect(response.body.data.title).toBe('Coffee Shop Landing Page');
      expect(response.body.data.generatedCode.html).toContain('<!DOCTYPE html>');
      expect(generateLandingPage).toHaveBeenCalled();
      expect(mockCollection.add).toHaveBeenCalled();
    });

    test('should handle AI generation failure', async () => {
      // Mock successful authentication
      verifyJWTToken.mockReturnValue({
        success: true,
        user: { uid: 'test-user', email: 'test@example.com' }
      });

      // Mock AI generation failure
      generateLandingPage.mockResolvedValue({
        success: false,
        error: {
          code: 'KIMI_API_ERROR_401',
          message: 'API authentication failed'
        }
      });

      const response = await request(app)
        .post('/api/landing-pages/generate')
        .set('Authorization', 'Bearer test-token')
        .send({
          prompt: 'Create a landing page for a coffee shop'
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error.code).toBe('KIMI_API_ERROR_401');
    });
  });

  describe('GET /api/landing-pages/list', () => {
    test('should require authentication', async () => {
      const response = await request(app)
        .get('/api/landing-pages/list');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    test('should return user landing pages', async () => {
      // Mock successful authentication
      verifyJWTToken.mockReturnValue({
        success: true,
        user: { uid: 'test-user', email: 'test@example.com' }
      });

      // Mock Firestore query
      const mockSnapshot = {
        forEach: jest.fn((callback) => {
          // Simulate two documents
          callback({
            id: 'page1',
            data: () => ({
              title: 'Coffee Shop',
              status: 'draft',
              createdAt: new Date(),
              analytics: { views: 10 }
            })
          });
          callback({
            id: 'page2',
            data: () => ({
              title: 'Restaurant',
              status: 'published',
              createdAt: new Date(),
              analytics: { views: 25 }
            })
          });
        })
      };

      const mockTotalSnapshot = { size: 2 };
      const mockQuery = {
        orderBy: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        offset: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue(mockSnapshot)
      };

      const mockCollection = {
        where: jest.fn().mockReturnValue({
          orderBy: jest.fn().mockReturnValue({
            offset: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                get: jest.fn().mockResolvedValue(mockSnapshot)
              })
            })
          }),
          get: jest.fn().mockResolvedValue(mockTotalSnapshot)
        })
      };

      const mockDb = {
        collection: jest.fn().mockReturnValue(mockCollection)
      };
      getFirestore.mockReturnValue(mockDb);

      const response = await request(app)
        .get('/api/landing-pages/list')
        .set('Authorization', 'Bearer test-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.landingPages).toHaveLength(2);
      expect(response.body.data.pagination.total).toBe(2);
    });
  });
});