const express = require('express');
const router = express.Router();
const { generateLandingPage } = require('../../services/kimiService');
const { processLandingPageRequest, checkContentPolicy } = require('../../utils/promptProcessor');
const { parseAIResponse, validateParsedContent } = require('../../utils/aiResponseParser');
const { getFirestore } = require('../../services/firebaseService');
const { verifyJWTToken } = require('../../services/authService');

// Middleware to verify authentication
const requireAuth = (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_TOKEN',
          message: 'Authentication token required'
        }
      });
    }
    
    const tokenResult = verifyJWTToken(token);
    if (!tokenResult.success) {
      return res.status(401).json({
        success: false,
        error: tokenResult.error
      });
    }
    
    req.user = tokenResult.user;
    next();
    
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed'
      }
    });
  }
};

// POST /api/landing-pages/generate - Generate new landing page
router.post('/generate', requireAuth, async (req, res) => {
  try {
    console.log(`Landing page generation request from user: ${req.user.uid}`);
    
    // Process and validate the request
    const processResult = processLandingPageRequest(req.body);
    if (!processResult.success) {
      return res.status(400).json(processResult);
    }
    
    const { enhancedPrompt, title, options, metadata } = processResult.data;
    
    // Check content policy
    const policyCheck = checkContentPolicy(enhancedPrompt);
    if (!policyCheck.allowed) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CONTENT_POLICY_VIOLATION',
          message: policyCheck.reason || 'Content violates usage policy'
        }
      });
    }
    
    // Generate landing page using AI
    console.log('Calling Kimi AI service...');
    const aiResult = await generateLandingPage(enhancedPrompt, options);
    
    if (!aiResult.success) {
      console.error('AI generation failed:', aiResult.error);
      return res.status(500).json(aiResult);
    }
    
    // Parse AI response
    console.log('Parsing AI response...');
    const parseResult = parseAIResponse(aiResult.data.content);
    
    if (!parseResult.success) {
      console.error('AI response parsing failed:', parseResult.error);
      return res.status(500).json({
        success: false,
        error: {
          code: 'PARSING_FAILED',
          message: 'Failed to parse AI response into usable code'
        }
      });
    }
    
    // Validate parsed content
    const validationResult = validateParsedContent(parseResult.data);
    
    // Save to Firestore
    console.log('Saving landing page to database...');
    const db = getFirestore();
    const landingPageData = {
      userId: req.user.uid,
      title: title,
      prompt: req.body.prompt,
      enhancedPrompt: enhancedPrompt,
      generatedCode: {
        html: parseResult.data.html,
        css: parseResult.data.css,
        javascript: parseResult.data.javascript
      },
      status: 'draft',
      url: null, // Will be set when published
      createdAt: new Date(),
      updatedAt: new Date(),
      analytics: {
        views: 0,
        conversions: 0,
        bounceRate: 0,
        avgTimeOnPage: 0
      },
      aiMetadata: {
        model: aiResult.data.metadata.model,
        processingTime: aiResult.data.metadata.processingTime,
        tokens: aiResult.data.metadata.tokens,
        parseMethod: parseResult.data.metadata.parseMethod,
        ...metadata
      },
      validation: validationResult.success ? validationResult.validation : null,
      recommendations: validationResult.success ? validationResult.recommendations : []
    };
    
    const docRef = await db.collection('landingPages').add(landingPageData);
    const savedPage = { id: docRef.id, ...landingPageData };
    
    console.log(`Landing page created successfully: ${docRef.id}`);
    
    // Return success response
    res.status(201).json({
      success: true,
      data: {
        id: docRef.id,
        title: savedPage.title,
        status: savedPage.status,
        generatedCode: savedPage.generatedCode,
        aiMetadata: savedPage.aiMetadata,
        validation: savedPage.validation,
        recommendations: savedPage.recommendations,
        createdAt: savedPage.createdAt
      },
      message: 'Landing page generated successfully'
    });
    
  } catch (error) {
    console.error('Landing page generation error:', error.message);
    res.status(500).json({
      success: false,
      error: {
        code: 'GENERATION_ERROR',
        message: 'An error occurred while generating the landing page'
      }
    });
  }
});

// GET /api/landing-pages/list - Get user's landing pages
router.get('/list', requireAuth, async (req, res) => {
  try {
    const db = getFirestore();
    const { page = 1, limit = 10, status } = req.query;
    
    let query = db.collection('landingPages')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc');
    
    // Filter by status if provided
    if (status && ['draft', 'published', 'archived'].includes(status)) {
      query = query.where('status', '==', status);
    }
    
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
          processingTime: data.aiMetadata?.processingTime
        }
      });
    });
    
    // Get total count for pagination
    const totalQuery = db.collection('landingPages').where('userId', '==', req.user.uid);
    const totalSnapshot = await totalQuery.get();
    const total = totalSnapshot.size;
    
    res.json({
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
    });
    
  } catch (error) {
    console.error('List landing pages error:', error.message);
    res.status(500).json({
      success: false,
      error: {
        code: 'LIST_ERROR',
        message: 'Failed to retrieve landing pages'
      }
    });
  }
});

// GET /api/landing-pages/:id - Get specific landing page
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const db = getFirestore();
    const doc = await db.collection('landingPages').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Landing page not found'
        }
      });
    }
    
    const data = doc.data();
    
    // Check if user owns this landing page
    if (data.userId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You do not have access to this landing page'
        }
      });
    }
    
    res.json({
      success: true,
      data: {
        id: doc.id,
        ...data
      }
    });
    
  } catch (error) {
    console.error('Get landing page error:', error.message);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_ERROR',
        message: 'Failed to retrieve landing page'
      }
    });
  }
});

// PUT /api/landing-pages/:id - Update landing page
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const db = getFirestore();
    const docRef = db.collection('landingPages').doc(req.params.id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Landing page not found'
        }
      });
    }
    
    const data = doc.data();
    
    // Check if user owns this landing page
    if (data.userId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You do not have access to this landing page'
        }
      });
    }
    
    // Prepare update data
    const allowedUpdates = ['title', 'status', 'generatedCode'];
    const updateData = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    
    updateData.updatedAt = new Date();
    
    await docRef.update(updateData);
    
    // Get updated document
    const updatedDoc = await docRef.get();
    
    res.json({
      success: true,
      data: {
        id: updatedDoc.id,
        ...updatedDoc.data()
      },
      message: 'Landing page updated successfully'
    });
    
  } catch (error) {
    console.error('Update landing page error:', error.message);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_ERROR',
        message: 'Failed to update landing page'
      }
    });
  }
});

// DELETE /api/landing-pages/:id - Delete landing page
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const db = getFirestore();
    const docRef = db.collection('landingPages').doc(req.params.id);
    const doc = await docRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Landing page not found'
        }
      });
    }
    
    const data = doc.data();
    
    // Check if user owns this landing page
    if (data.userId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You do not have access to this landing page'
        }
      });
    }
    
    await docRef.delete();
    
    res.json({
      success: true,
      message: 'Landing page deleted successfully'
    });
    
  } catch (error) {
    console.error('Delete landing page error:', error.message);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_ERROR',
        message: 'Failed to delete landing page'
      }
    });
  }
});

// GET /api/landing-pages/:id/preview - Get landing page preview
router.get('/:id/preview', requireAuth, async (req, res) => {
  try {
    const db = getFirestore();
    const doc = await db.collection('landingPages').doc(req.params.id).get();
    
    if (!doc.exists) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Landing page not found'
        }
      });
    }
    
    const data = doc.data();
    
    // Check if user owns this landing page
    if (data.userId !== req.user.uid) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCESS_DENIED',
          message: 'You do not have access to this landing page'
        }
      });
    }
    
    // Combine HTML, CSS, and JavaScript into a complete page
    const { html, css, javascript } = data.generatedCode;
    
    let completeHTML = html;
    
    // Inject CSS if not already included
    if (css && !html.includes('<style>') && !html.includes('</style>')) {
      completeHTML = completeHTML.replace(
        '</head>',
        `    <style>\n${css}\n    </style>\n</head>`
      );
    }
    
    // Inject JavaScript if not already included
    if (javascript && !html.includes('<script>') && !html.includes('</script>')) {
      completeHTML = completeHTML.replace(
        '</body>',
        `    <script>\n${javascript}\n    </script>\n</body>`
      );
    }
    
    // Set appropriate content type and return HTML
    res.setHeader('Content-Type', 'text/html');
    res.send(completeHTML);
    
  } catch (error) {
    console.error('Preview landing page error:', error.message);
    res.status(500).json({
      success: false,
      error: {
        code: 'PREVIEW_ERROR',
        message: 'Failed to generate preview'
      }
    });
  }
});

module.exports = router;