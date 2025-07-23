// Mock Firebase Admin first
jest.mock('firebase-admin', () => ({
  firestore: {
    FieldValue: {
      serverTimestamp: jest.fn(() => new Date('2023-01-01T00:00:00Z'))
    }
  }
}));

// Mock aiResponseParser
jest.mock('../utils/aiResponseParser', () => ({
  cleanHTML: jest.fn((html) => html || ''),
  cleanCSS: jest.fn((css) => css || ''),
  cleanJavaScript: jest.fn((js) => js || ''),
  validateParsedContent: jest.fn(() => ({
    success: true,
    validation: {
      hasTitle: true,
      hasViewport: true,
      hasBody: true,
      hasContent: true,
      isResponsive: true,
      estimatedSize: { html: 100, css: 50, javascript: 25 }
    },
    recommendations: ['Add more responsive styles']
  }))
}));

// Mock codeSanitizer
jest.mock('../utils/codeSanitizer', () => ({
  sanitizeHTML: jest.fn((html) => html || ''),
  sanitizeCSS: jest.fn((css) => css || ''),
  sanitizeJavaScript: jest.fn((js) => js || '')
}));

// Create mock Firestore instance
const mockFirestore = {
  collection: jest.fn(),
  doc: jest.fn(),
  add: jest.fn(),
  get: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  offset: jest.fn(),
  limit: jest.fn()
};

// Mock Firebase Service
jest.mock('../services/firebaseService', () => ({
  getFirestore: jest.fn(() => mockFirestore)
}));

const {
  createLandingPage,
  getLandingPageById,
  getUserLandingPages,
  updateLandingPage,
  deleteLandingPage,
  getLandingPageAnalytics,
  sanitizeLandingPageData,
  sanitizeUpdateData,
  LANDING_PAGE_STATUS
} = require('../services/landingPageService');

describe('Landing Page Service', () => {
  const mockUserId = 'test-user-123';
  const mockPageId = 'test-page-123';
  
  const mockLandingPageData = {
    title: 'Test Landing Page',
    prompt: 'Create a landing page for a tech startup',
    enhancedPrompt: 'Create a modern, responsive landing page for a tech startup with hero section and features',
    generatedCode: {
      html: '<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Test Page</h1></body></html>',
      css: 'body { font-family: Arial, sans-serif; }',
      javascript: 'console.log("Test");'
    },
    aiMetadata: {
      model: 'kimi-k2',
      processingTime: 1500,
      tokens: 250
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset all mock functions
    mockFirestore.collection.mockClear();
    mockFirestore.doc.mockClear();
    mockFirestore.add.mockClear();
    mockFirestore.get.mockClear();
    mockFirestore.update.mockClear();
    mockFirestore.delete.mockClear();
    mockFirestore.where.mockClear();
    mockFirestore.orderBy.mockClear();
    mockFirestore.offset.mockClear();
    mockFirestore.limit.mockClear();
  });

  describe('sanitizeLandingPageData', () => {
    test('should sanitize valid landing page data', () => {
      const result = sanitizeLandingPageData(mockLandingPageData);
      
      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Test Landing Page');
      expect(result.data.prompt).toBe('Create a landing page for a tech startup');
      expect(result.data.generatedCode.html).toContain('<!DOCTYPE html>');
      expect(result.data.generatedCode.css).toContain('font-family');
      expect(result.data.generatedCode.javascript).toContain('console.log');
    });

    test('should reject data without title', () => {
      const invalidData = { ...mockLandingPageData };
      delete invalidData.title;
      
      const result = sanitizeLandingPageData(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.message).toContain('Title is required');
    });

    test('should reject data without prompt', () => {
      const invalidData = { ...mockLandingPageData };
      delete invalidData.prompt;
      
      const result = sanitizeLandingPageData(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.message).toContain('Prompt is required');
    });

    test('should reject data without HTML code', () => {
      const invalidData = { ...mockLandingPageData };
      delete invalidData.generatedCode.html;
      
      const result = sanitizeLandingPageData(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.message).toContain('Generated HTML code is required');
    });

    test('should limit title length', () => {
      const longTitle = 'A'.repeat(300);
      const dataWithLongTitle = { ...mockLandingPageData, title: longTitle };
      
      const result = sanitizeLandingPageData(dataWithLongTitle);
      
      expect(result.success).toBe(true);
      expect(result.data.title.length).toBeLessThanOrEqual(200);
    });

    test('should limit prompt length', () => {
      const longPrompt = 'A'.repeat(6000);
      const dataWithLongPrompt = { ...mockLandingPageData, prompt: longPrompt };
      
      const result = sanitizeLandingPageData(dataWithLongPrompt);
      
      expect(result.success).toBe(true);
      expect(result.data.prompt.length).toBeLessThanOrEqual(5000);
    });
  });

  describe('sanitizeUpdateData', () => {
    test('should sanitize valid update data', () => {
      const updateData = {
        title: 'Updated Title',
        status: LANDING_PAGE_STATUS.PUBLISHED,
        generatedCode: {
          html: '<html><body>Updated</body></html>',
          css: 'body { color: blue; }',
          javascript: 'console.log("updated");'
        }
      };
      
      const result = sanitizeUpdateData(updateData);
      
      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Updated Title');
      expect(result.data.status).toBe(LANDING_PAGE_STATUS.PUBLISHED);
      expect(result.data.generatedCode.html).toContain('Updated');
    });

    test('should reject invalid status', () => {
      const updateData = {
        status: 'invalid-status'
      };
      
      const result = sanitizeUpdateData(updateData);
      
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.message).toContain('Invalid status value');
    });

    test('should reject non-string title', () => {
      const updateData = {
        title: 123
      };
      
      const result = sanitizeUpdateData(updateData);
      
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
      expect(result.error.message).toContain('Title must be a string');
    });

    test('should only include allowed fields', () => {
      const updateData = {
        title: 'Updated Title',
        maliciousField: 'should be ignored',
        userId: 'should be ignored'
      };
      
      const result = sanitizeUpdateData(updateData);
      
      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Updated Title');
      expect(result.data.maliciousField).toBeUndefined();
      expect(result.data.userId).toBeUndefined();
    });
  });

  describe('createLandingPage', () => {
    test('should create landing page successfully', async () => {
      const mockAdd = jest.fn().mockResolvedValue({ id: mockPageId });
      mockFirestore.collection.mockReturnValue({ add: mockAdd });
      
      const result = await createLandingPage(mockLandingPageData, mockUserId);
      
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(mockPageId);
      expect(result.data.userId).toBe(mockUserId);
      expect(result.data.status).toBe(LANDING_PAGE_STATUS.DRAFT);
      expect(mockAdd).toHaveBeenCalledWith(expect.objectContaining({
        userId: mockUserId,
        title: mockLandingPageData.title,
        status: LANDING_PAGE_STATUS.DRAFT
      }));
    });

    test('should handle invalid data', async () => {
      const invalidData = { ...mockLandingPageData };
      delete invalidData.title;
      
      const result = await createLandingPage(invalidData, mockUserId);
      
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });

    test('should handle database errors', async () => {
      const mockAdd = jest.fn().mockRejectedValue(new Error('Database error'));
      mockFirestore.collection.mockReturnValue({ add: mockAdd });
      
      const result = await createLandingPage(mockLandingPageData, mockUserId);
      
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('CREATE_ERROR');
    });
  });

  describe('getLandingPageById', () => {
    test('should get landing page successfully', async () => {
      const mockDoc = {
        exists: true,
        id: mockPageId,
        data: () => ({ ...mockLandingPageData, userId: mockUserId })
      };
      
      const mockGet = jest.fn().mockResolvedValue(mockDoc);
      const mockDocRef = { get: mockGet };
      mockFirestore.collection.mockReturnValue({
        doc: jest.fn(() => mockDocRef)
      });
      
      const result = await getLandingPageById(mockPageId, mockUserId);
      
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(mockPageId);
      expect(result.data.title).toBe(mockLandingPageData.title);
    });

    test('should handle non-existent page', async () => {
      const mockDoc = { exists: false };
      
      const mockGet = jest.fn().mockResolvedValue(mockDoc);
      const mockDocRef = { get: mockGet };
      mockFirestore.collection.mockReturnValue({
        doc: jest.fn(() => mockDocRef)
      });
      
      const result = await getLandingPageById(mockPageId, mockUserId);
      
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('NOT_FOUND');
    });

    test('should handle access denied', async () => {
      const mockDoc = {
        exists: true,
        data: () => ({ ...mockLandingPageData, userId: 'different-user' })
      };
      
      const mockGet = jest.fn().mockResolvedValue(mockDoc);
      const mockDocRef = { get: mockGet };
      mockFirestore.collection.mockReturnValue({
        doc: jest.fn(() => mockDocRef)
      });
      
      const result = await getLandingPageById(mockPageId, mockUserId);
      
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('ACCESS_DENIED');
    });
  });

  describe('updateLandingPage', () => {
    test('should update landing page successfully', async () => {
      const mockDoc = {
        exists: true,
        data: () => ({ ...mockLandingPageData, userId: mockUserId })
      };
      
      const mockUpdatedDoc = {
        id: mockPageId,
        data: () => ({ ...mockLandingPageData, title: 'Updated Title', userId: mockUserId })
      };
      
      const mockUpdate = jest.fn().mockResolvedValue();
      const mockGet = jest.fn()
        .mockResolvedValueOnce(mockDoc)
        .mockResolvedValueOnce(mockUpdatedDoc);
      
      const mockDocRef = { get: mockGet, update: mockUpdate };
      mockFirestore.collection.mockReturnValue({
        doc: jest.fn(() => mockDocRef)
      });
      
      const updateData = { title: 'Updated Title' };
      const result = await updateLandingPage(mockPageId, mockUserId, updateData);
      
      expect(result.success).toBe(true);
      expect(result.data.title).toBe('Updated Title');
      expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Updated Title'
      }));
    });

    test('should handle invalid update data', async () => {
      const updateData = { status: 'invalid-status' };
      const result = await updateLandingPage(mockPageId, mockUserId, updateData);
      
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('deleteLandingPage', () => {
    test('should delete landing page successfully', async () => {
      const mockDoc = {
        exists: true,
        data: () => ({ ...mockLandingPageData, userId: mockUserId })
      };
      
      const mockDelete = jest.fn().mockResolvedValue();
      const mockGet = jest.fn().mockResolvedValue(mockDoc);
      
      const mockDocRef = { get: mockGet, delete: mockDelete };
      mockFirestore.collection.mockReturnValue({
        doc: jest.fn(() => mockDocRef)
      });
      
      const result = await deleteLandingPage(mockPageId, mockUserId);
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('deleted successfully');
      expect(mockDelete).toHaveBeenCalled();
    });

    test('should handle non-existent page', async () => {
      const mockDoc = { exists: false };
      
      const mockGet = jest.fn().mockResolvedValue(mockDoc);
      const mockDocRef = { get: mockGet };
      mockFirestore.collection.mockReturnValue({
        doc: jest.fn(() => mockDocRef)
      });
      
      const result = await deleteLandingPage(mockPageId, mockUserId);
      
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('NOT_FOUND');
    });
  });

  describe('getUserLandingPages', () => {
    test('should get user landing pages with pagination', async () => {
      const mockSnapshot = {
        forEach: jest.fn((callback) => {
          callback({
            id: 'page1',
            data: () => ({
              title: 'Page 1',
              status: LANDING_PAGE_STATUS.DRAFT,
              createdAt: new Date(),
              analytics: { views: 10 }
            })
          });
          callback({
            id: 'page2',
            data: () => ({
              title: 'Page 2',
              status: LANDING_PAGE_STATUS.PUBLISHED,
              createdAt: new Date(),
              analytics: { views: 25 }
            })
          });
        })
      };
      
      const mockTotalSnapshot = { size: 2 };
      
      const mockLimitQuery = {
        get: jest.fn().mockResolvedValue(mockSnapshot)
      };
      
      const mockOffsetQuery = {
        limit: jest.fn(() => mockLimitQuery)
      };
      
      const mockOrderByQuery = {
        offset: jest.fn(() => mockOffsetQuery)
      };
      
      const mockWhereQuery = {
        orderBy: jest.fn(() => mockOrderByQuery),
        get: jest.fn().mockResolvedValue(mockTotalSnapshot)
      };
      
      mockFirestore.collection.mockReturnValue({
        where: jest.fn(() => mockWhereQuery)
      });
      
      const result = await getUserLandingPages(mockUserId, { page: 1, limit: 10 });
      
      expect(result.success).toBe(true);
      expect(result.data.landingPages).toHaveLength(2);
      expect(result.data.pagination.total).toBe(2);
      expect(result.data.pagination.page).toBe(1);
      expect(result.data.pagination.limit).toBe(10);
    });
  });

  describe('getLandingPageAnalytics', () => {
    test('should get landing page analytics', async () => {
      const mockDoc = {
        exists: true,
        id: mockPageId,
        data: () => ({
          ...mockLandingPageData,
          userId: mockUserId,
          analytics: {
            views: 100,
            conversions: 5,
            bounceRate: 0.3,
            avgTimeOnPage: 120
          }
        })
      };
      
      const mockGet = jest.fn().mockResolvedValue(mockDoc);
      const mockDocRef = { get: mockGet };
      mockFirestore.collection.mockReturnValue({
        doc: jest.fn(() => mockDocRef)
      });
      
      const result = await getLandingPageAnalytics(mockPageId, mockUserId);
      
      expect(result.success).toBe(true);
      expect(result.data.analytics.views).toBe(100);
      expect(result.data.analytics.conversions).toBe(5);
      expect(result.data.analytics.conversionRate).toBe(5.00);
    });
  });

  describe('LANDING_PAGE_STATUS constants', () => {
    test('should have correct status values', () => {
      expect(LANDING_PAGE_STATUS.DRAFT).toBe('draft');
      expect(LANDING_PAGE_STATUS.PUBLISHED).toBe('published');
      expect(LANDING_PAGE_STATUS.ARCHIVED).toBe('archived');
    });
  });
});