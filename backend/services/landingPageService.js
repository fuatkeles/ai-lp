const { getFirestore } = require('./firebaseService');
const { cleanHTML, cleanCSS, cleanJavaScript, validateParsedContent } = require('../utils/aiResponseParser');
const admin = require('firebase-admin');

/**
 * Landing Page Data Model Service
 * Handles CRUD operations and data validation for landing pages
 */

// Landing Page Status Constants
const LANDING_PAGE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

// Landing Page Collection Name
const COLLECTION_NAME = 'landingPages';

/**
 * Create a new landing page
 * @param {Object} landingPageData - Landing page data
 * @param {string} userId - User ID who owns the page
 * @returns {Object} Result with success status and data
 */
const createLandingPage = async (landingPageData, userId) => {
  try {
    const db = getFirestore();
    
    // Validate and sanitize the input data
    const sanitizedData = sanitizeLandingPageData(landingPageData);
    if (!sanitizedData.success) {
      return sanitizedData;
    }
    
    // Create the landing page document
    const now = admin.firestore.FieldValue.serverTimestamp();
    const pageData = {
      userId: userId,
      title: sanitizedData.data.title,
      prompt: sanitizedData.data.prompt,
      enhancedPrompt: sanitizedData.data.enhancedPrompt || sanitizedData.data.prompt,
      generatedCode: {
        html: sanitizedData.data.generatedCode.html,
        css: sanitizedData.data.generatedCode.css,
        javascript: sanitizedData.data.generatedCode.javascript
      },
      status: LANDING_PAGE_STATUS.DRAFT,
      url: null, // Will be set when published
      createdAt: now,
      updatedAt: now,
      analytics: {
        views: 0,
        conversions: 0,
        bounceRate: 0,
        avgTimeOnPage: 0
      },
      aiMetadata: sanitizedData.data.aiMetadata || {},
      validation: sanitizedData.validation || null,
      recommendations: sanitizedData.recommendations || []
    };
    
    const docRef = await db.collection(COLLECTION_NAME).add(pageData);
    
    return {
      success: true,
      data: {
        id: docRef.id,
        ...pageData
      }
    };
    
  } catch (error) {
    console.error('Create landing page error:', error.message);
    return {
      success: false,
      error: {
        code: 'CREATE_ERROR',
        message: 'Failed to create landing page'
      }
    };
  }
};

/**
 * Get landing page by ID
 * @param {string} pageId - Landing page ID
 * @param {string} userId - User ID for ownership verification
 * @returns {Object} Result with success status and data
 */
const getLandingPageById = async (pageId, userId) => {
  try {
    const db = getFirestore();
    const doc = await db.collection(COLLECTION_NAME).doc(pageId).get();
    
    if (!doc.exists) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Landing page not found'
        }
      };
    }
    
    const data = doc.data();
    
    // Check ownership
    if (data.userId !== userId) {
      return {
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You do not have access to this landing page'
        }
      };
    }
    
    return {
      success: true,
      data: {
        id: doc.id,
        ...data
      }
    };
    
  } catch (error) {
    console.error('Get landing page error:', error.message);
    return {
      success: false,
      error: {
        code: 'GET_ERROR',
        message: 'Failed to retrieve landing page'
      }
    };
  }
};

/**
 * Get user's landing pages with pagination and filtering
 * @param {string} userId - User ID
 * @param {Object} options - Query options (page, limit, status, sortBy, sortOrder)
 * @returns {Object} Result with success status and data
 */
const getUserLandingPages = async (userId, options = {}) => {
  try {
    const db = getFirestore();
    const {
      page = 1,
      limit = 10,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;
    
    let query = db.collection(COLLECTION_NAME)
      .where('userId', '==', userId);
    
    // Filter by status if provided
    if (status && Object.values(LANDING_PAGE_STATUS).includes(status)) {
      query = query.where('status', '==', status);
    }
    
    // Add sorting
    query = query.orderBy(sortBy, sortOrder);
    
    // Apply pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);
    query = query.offset(offset).limit(parseInt(limit));
    
    const snapshot = await query.get();
    const landingPages = [];
    
    snapshot.forEach(doc => {
      const data = doc.data();
      landingPages.push({
        id: doc.id,
        title: data.title,
        status: data.status,
        url: data.url,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        analytics: data.analytics,
        aiMetadata: {
          model: data.aiMetadata?.model,
          processingTime: data.aiMetadata?.processingTime,
          tokens: data.aiMetadata?.tokens
        }
      });
    });
    
    // Get total count for pagination
    const totalQuery = db.collection(COLLECTION_NAME).where('userId', '==', userId);
    if (status && Object.values(LANDING_PAGE_STATUS).includes(status)) {
      totalQuery.where('status', '==', status);
    }
    const totalSnapshot = await totalQuery.get();
    const total = totalSnapshot.size;
    
    return {
      success: true,
      data: {
        landingPages,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    };
    
  } catch (error) {
    console.error('Get user landing pages error:', error.message);
    return {
      success: false,
      error: {
        code: 'LIST_ERROR',
        message: 'Failed to retrieve landing pages'
      }
    };
  }
};

/**
 * Update landing page
 * @param {string} pageId - Landing page ID
 * @param {string} userId - User ID for ownership verification
 * @param {Object} updateData - Data to update
 * @returns {Object} Result with success status and data
 */
const updateLandingPage = async (pageId, userId, updateData) => {
  try {
    const db = getFirestore();
    const docRef = db.collection(COLLECTION_NAME).doc(pageId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Landing page not found'
        }
      };
    }
    
    const data = doc.data();
    
    // Check ownership
    if (data.userId !== userId) {
      return {
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You do not have access to this landing page'
        }
      };
    }
    
    // Validate and sanitize update data
    const sanitizedUpdate = sanitizeUpdateData(updateData);
    if (!sanitizedUpdate.success) {
      return sanitizedUpdate;
    }
    
    // Add timestamp
    sanitizedUpdate.data.updatedAt = admin.firestore.FieldValue.serverTimestamp();
    
    await docRef.update(sanitizedUpdate.data);
    
    // Get updated document
    const updatedDoc = await docRef.get();
    
    return {
      success: true,
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data()
      }
    };
    
  } catch (error) {
    console.error('Update landing page error:', error.message);
    return {
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update landing page'
      }
    };
  }
};

/**
 * Delete landing page
 * @param {string} pageId - Landing page ID
 * @param {string} userId - User ID for ownership verification
 * @returns {Object} Result with success status
 */
const deleteLandingPage = async (pageId, userId) => {
  try {
    const db = getFirestore();
    const docRef = db.collection(COLLECTION_NAME).doc(pageId);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Landing page not found'
        }
      };
    }
    
    const data = doc.data();
    
    // Check ownership
    if (data.userId !== userId) {
      return {
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You do not have access to this landing page'
        }
      };
    }
    
    await docRef.delete();
    
    return {
      success: true,
      message: 'Landing page deleted successfully'
    };
    
  } catch (error) {
    console.error('Delete landing page error:', error.message);
    return {
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: 'Failed to delete landing page'
      }
    };
  }
};

/**
 * Get landing page analytics
 * @param {string} pageId - Landing page ID
 * @param {string} userId - User ID for ownership verification
 * @returns {Object} Result with success status and analytics data
 */
const getLandingPageAnalytics = async (pageId, userId) => {
  try {
    const pageResult = await getLandingPageById(pageId, userId);
    if (!pageResult.success) {
      return pageResult;
    }
    
    const analytics = pageResult.data.analytics || {
      views: 0,
      conversions: 0,
      bounceRate: 0,
      avgTimeOnPage: 0
    };
    
    // Calculate additional metrics
    const conversionRate = analytics.views > 0 ? (analytics.conversions / analytics.views * 100).toFixed(2) : 0;
    
    return {
      success: true,
      data: {
        pageId,
        title: pageResult.data.title,
        status: pageResult.data.status,
        analytics: {
          ...analytics,
          conversionRate: parseFloat(conversionRate)
        },
        lastUpdated: pageResult.data.updatedAt
      }
    };
    
  } catch (error) {
    console.error('Get landing page analytics error:', error.message);
    return {
      success: false,
      error: {
        code: 'ANALYTICS_ERROR',
        message: 'Failed to retrieve analytics data'
      }
    };
  }
};

/**
 * Sanitize and validate landing page data
 * @param {Object} data - Raw landing page data
 * @returns {Object} Sanitized data or error
 */
const sanitizeLandingPageData = (data) => {
  try {
    // Validate required fields
    if (!data.title || typeof data.title !== 'string') {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Title is required and must be a string'
        }
      };
    }
    
    if (!data.prompt || typeof data.prompt !== 'string') {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Prompt is required and must be a string'
        }
      };
    }
    
    if (!data.generatedCode || !data.generatedCode.html) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Generated HTML code is required'
        }
      };
    }
    
    // Sanitize the data
    const sanitizedData = {
      title: data.title.trim().substring(0, 200), // Limit title length
      prompt: data.prompt.trim().substring(0, 5000), // Limit prompt length
      enhancedPrompt: data.enhancedPrompt ? data.enhancedPrompt.trim().substring(0, 10000) : null,
      generatedCode: {
        html: cleanHTML(data.generatedCode.html),
        css: cleanCSS(data.generatedCode.css || ''),
        javascript: cleanJavaScript(data.generatedCode.javascript || '')
      },
      aiMetadata: data.aiMetadata || {}
    };
    
    // Validate the generated code
    const validationResult = validateParsedContent(sanitizedData.generatedCode);
    
    return {
      success: true,
      data: sanitizedData,
      validation: validationResult.success ? validationResult.validation : null,
      recommendations: validationResult.success ? validationResult.recommendations : []
    };
    
  } catch (error) {
    console.error('Data sanitization error:', error.message);
    return {
      success: false,
      error: {
        code: 'SANITIZATION_ERROR',
        message: 'Failed to sanitize landing page data'
      }
    };
  }
};

/**
 * Sanitize update data
 * @param {Object} updateData - Data to update
 * @returns {Object} Sanitized update data or error
 */
const sanitizeUpdateData = (updateData) => {
  try {
    const allowedFields = ['title', 'status', 'generatedCode', 'url'];
    const sanitized = {};
    
    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        switch (field) {
          case 'title':
            if (typeof updateData[field] !== 'string') {
              return {
                success: false,
                error: {
                  code: 'VALIDATION_ERROR',
                  message: 'Title must be a string'
                }
              };
            }
            sanitized[field] = updateData[field].trim().substring(0, 200);
            break;
            
          case 'status':
            if (!Object.values(LANDING_PAGE_STATUS).includes(updateData[field])) {
              return {
                success: false,
                error: {
                  code: 'VALIDATION_ERROR',
                  message: 'Invalid status value'
                }
              };
            }
            sanitized[field] = updateData[field];
            break;
            
          case 'generatedCode':
            if (!updateData[field] || typeof updateData[field] !== 'object') {
              return {
                success: false,
                error: {
                  code: 'VALIDATION_ERROR',
                  message: 'Generated code must be an object'
                }
              };
            }
            sanitized[field] = {
              html: cleanHTML(updateData[field].html || ''),
              css: cleanCSS(updateData[field].css || ''),
              javascript: cleanJavaScript(updateData[field].javascript || '')
            };
            break;
            
          case 'url':
            if (updateData[field] && typeof updateData[field] !== 'string') {
              return {
                success: false,
                error: {
                  code: 'VALIDATION_ERROR',
                  message: 'URL must be a string'
                }
              };
            }
            sanitized[field] = updateData[field] ? updateData[field].trim() : null;
            break;
        }
      }
    }
    
    return {
      success: true,
      data: sanitized
    };
    
  } catch (error) {
    console.error('Update data sanitization error:', error.message);
    return {
      success: false,
      error: {
        code: 'SANITIZATION_ERROR',
        message: 'Failed to sanitize update data'
      }
    };
  }
};

module.exports = {
  LANDING_PAGE_STATUS,
  createLandingPage,
  getLandingPageById,
  getUserLandingPages,
  updateLandingPage,
  deleteLandingPage,
  getLandingPageAnalytics,
  sanitizeLandingPageData,
  sanitizeUpdateData
};