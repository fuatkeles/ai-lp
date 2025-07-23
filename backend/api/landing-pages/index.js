const express = require('express');
const router = express.Router();
const { generateLandingPage } = require('../../services/kimiService');
const { processLandingPageRequest, checkContentPolicy, validatePromptQuality } = require('../../utils/promptProcessor');
const { parseAIResponse, validateParsedContent } = require('../../utils/aiResponseParser');
const { validateLandingPageData, validateGeneratedCode } = require('../../utils/validation');
const { getFirestore } = require('../../services/firebaseService');
const { verifyJWTToken } = require('../../services/authService');
const {
  createLandingPage,
  getLandingPageById,
  getUserLandingPages,
  updateLandingPage,
  deleteLandingPage,
  getLandingPageAnalytics
} = require('../../services/landingPageService');

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
    const requestData = {
      prompt: req.body.prompt,
      title: req.body.title,
      options: {
        industry: req.body.businessType,
        targetAudience: req.body.targetAudience,
        callToAction: req.body.callToAction,
        model: req.body.model
      }
    };
    
    const processResult = processLandingPageRequest(requestData);
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
    
    // Generate landing page using selected AI model
    const selectedModel = req.body.model || 'gemini';
    console.log(`Calling ${selectedModel.toUpperCase()} AI service...`);
    const aiResult = await generateLandingPage(enhancedPrompt, { ...options, model: selectedModel });
    
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
    
    // Validate generated code quality
    const codeValidation = validateGeneratedCode(parseResult.data);
    if (!codeValidation.isValid) {
      console.error('Generated code validation failed:', codeValidation.errors);
      return res.status(500).json({
        success: false,
        error: {
          code: 'CODE_VALIDATION_FAILED',
          message: 'Generated code quality is insufficient',
          details: codeValidation.errors
        }
      });
    }
    
    // Save to Firestore using landing page service
    console.log('Saving landing page to database...');
    const landingPageData = {
      title: title,
      prompt: req.body.prompt,
      enhancedPrompt: enhancedPrompt,
      generatedCode: {
        html: parseResult.data.html,
        css: parseResult.data.css,
        javascript: parseResult.data.javascript
      },
      aiMetadata: {
        model: aiResult.data.metadata.model,
        processingTime: aiResult.data.metadata.processingTime,
        tokens: aiResult.data.metadata.tokens,
        parseMethod: parseResult.data.metadata.parseMethod,
        ...metadata
      }
    };
    
    const createResult = await createLandingPage(landingPageData, req.user.uid);
    
    if (!createResult.success) {
      console.error('Failed to create landing page:', createResult.error);
      return res.status(500).json(createResult);
    }
    
    const savedPage = createResult.data;
    console.log(`Landing page created successfully: ${savedPage.id}`);
    
    // Return success response
    res.status(201).json({
      success: true,
      data: {
        id: savedPage.id,
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
    const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      sortBy,
      sortOrder
    };
    
    const result = await getUserLandingPages(req.user.uid, options);
    
    if (!result.success) {
      return res.status(500).json(result);
    }
    
    res.json(result);
    
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
    const result = await getLandingPageById(req.params.id, req.user.uid);
    
    if (!result.success) {
      const statusCode = result.error.code === 'NOT_FOUND' ? 404 : 
                        result.error.code === 'ACCESS_DENIED' ? 403 : 500;
      return res.status(statusCode).json(result);
    }
    
    res.json(result);
    
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
    const result = await updateLandingPage(req.params.id, req.user.uid, req.body);
    
    if (!result.success) {
      const statusCode = result.error.code === 'NOT_FOUND' ? 404 : 
                        result.error.code === 'ACCESS_DENIED' ? 403 : 
                        result.error.code === 'VALIDATION_ERROR' ? 400 : 500;
      return res.status(statusCode).json(result);
    }
    
    res.json({
      ...result,
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
    const result = await deleteLandingPage(req.params.id, req.user.uid);
    
    if (!result.success) {
      const statusCode = result.error.code === 'NOT_FOUND' ? 404 : 
                        result.error.code === 'ACCESS_DENIED' ? 403 : 500;
      return res.status(statusCode).json(result);
    }
    
    res.json(result);
    
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

// GET /api/landing-pages/:id/analytics - Get landing page analytics
router.get('/:id/analytics', requireAuth, async (req, res) => {
  try {
    const result = await getLandingPageAnalytics(req.params.id, req.user.uid);
    
    if (!result.success) {
      const statusCode = result.error.code === 'NOT_FOUND' ? 404 : 
                        result.error.code === 'ACCESS_DENIED' ? 403 : 500;
      return res.status(statusCode).json(result);
    }
    
    res.json(result);
    
  } catch (error) {
    console.error('Get landing page analytics error:', error.message);
    res.status(500).json({
      success: false,
      error: {
        code: 'ANALYTICS_ERROR',
        message: 'Failed to retrieve analytics data'
      }
    });
  }
});

// GET /api/landing-pages/:id/preview - Get landing page preview
router.get('/:id/preview', requireAuth, async (req, res) => {
  try {
    const result = await getLandingPageById(req.params.id, req.user.uid);
    
    if (!result.success) {
      const statusCode = result.error.code === 'NOT_FOUND' ? 404 : 
                        result.error.code === 'ACCESS_DENIED' ? 403 : 500;
      return res.status(statusCode).json(result);
    }
    
    const data = result.data;
    
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