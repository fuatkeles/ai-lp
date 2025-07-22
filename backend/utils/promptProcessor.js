const Joi = require('joi');

// Validation schema for landing page generation request
const landingPagePromptSchema = Joi.object({
  prompt: Joi.string()
    .min(10)
    .max(2000)
    .required()
    .messages({
      'string.empty': 'Prompt cannot be empty',
      'string.min': 'Prompt must be at least 10 characters long',
      'string.max': 'Prompt cannot exceed 2000 characters',
      'any.required': 'Prompt is required'
    }),
  
  title: Joi.string()
    .min(3)
    .max(100)
    .optional()
    .messages({
      'string.min': 'Title must be at least 3 characters long',
      'string.max': 'Title cannot exceed 100 characters'
    }),
    
  options: Joi.object({
    temperature: Joi.number().min(0).max(2).optional(),
    maxTokens: Joi.number().min(100).max(8000).optional(),
    topP: Joi.number().min(0).max(1).optional(),
    style: Joi.string().valid('modern', 'classic', 'minimal', 'creative').optional(),
    industry: Joi.string().max(50).optional(),
    targetAudience: Joi.string().max(100).optional()
  }).optional()
});

// Validate landing page generation request
const validateLandingPageRequest = (requestData) => {
  const { error, value } = landingPagePromptSchema.validate(requestData, {
    abortEarly: false,
    stripUnknown: true
  });
  
  if (error) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request data',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      }
    };
  }
  
  return {
    success: true,
    data: value
  };
};

// Clean and sanitize prompt text
const sanitizePrompt = (prompt) => {
  if (!prompt || typeof prompt !== 'string') {
    return '';
  }
  
  // Remove potentially harmful content
  let cleaned = prompt
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframe tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
  
  // Normalize whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  return cleaned;
};

// Enhance prompt with context and instructions
const enhancePrompt = (originalPrompt, options = {}) => {
  const sanitized = sanitizePrompt(originalPrompt);
  
  if (!sanitized) {
    throw new Error('Prompt cannot be empty after sanitization');
  }
  
  // Build enhanced prompt with context
  let enhancedPrompt = `Create a landing page for: ${sanitized}`;
  
  // Add style preferences
  if (options.style) {
    enhancedPrompt += `\n\nDesign Style: ${options.style}`;
  }
  
  // Add industry context
  if (options.industry) {
    enhancedPrompt += `\n\nIndustry: ${options.industry}`;
  }
  
  // Add target audience
  if (options.targetAudience) {
    enhancedPrompt += `\n\nTarget Audience: ${options.targetAudience}`;
  }
  
  // Add specific requirements
  enhancedPrompt += `\n\nSpecific Requirements:
- Make it conversion-focused with clear call-to-action buttons
- Ensure mobile-first responsive design
- Include modern animations and micro-interactions
- Use professional color schemes and typography
- Add social proof elements if relevant
- Optimize for fast loading and good SEO
- Include contact forms or lead capture if appropriate`;
  
  return enhancedPrompt;
};

// Extract keywords from prompt for categorization
const extractKeywords = (prompt) => {
  if (!prompt || typeof prompt !== 'string') {
    return [];
  }
  
  // Common business/industry keywords
  const businessKeywords = [
    'restaurant', 'food', 'cafe', 'coffee', 'hotel', 'travel', 'tourism',
    'fitness', 'gym', 'health', 'medical', 'doctor', 'clinic',
    'education', 'school', 'course', 'training', 'learning',
    'technology', 'software', 'app', 'saas', 'startup',
    'ecommerce', 'shop', 'store', 'product', 'service',
    'consulting', 'agency', 'marketing', 'design', 'creative',
    'real estate', 'property', 'construction', 'architecture',
    'finance', 'banking', 'investment', 'insurance',
    'automotive', 'car', 'vehicle', 'repair', 'maintenance',
    'beauty', 'salon', 'spa', 'wellness', 'cosmetics'
  ];
  
  const lowerPrompt = prompt.toLowerCase();
  const foundKeywords = businessKeywords.filter(keyword => 
    lowerPrompt.includes(keyword)
  );
  
  return foundKeywords;
};

// Detect prompt language (basic detection)
const detectLanguage = (prompt) => {
  if (!prompt || typeof prompt !== 'string') {
    return 'en';
  }
  
  // Simple language detection based on character patterns
  const turkishChars = /[çğıöşüÇĞIİÖŞÜ]/;
  const turkishWords = /\b(ve|bir|bu|için|ile|olan|olan|değil|çok|daha|en|her|kendi|sonra|kadar|ancak|böyle|şey|zaman|yer|kişi|gün|yıl|el|göz|baş|iş|ev|su|kan|yol|para|halk|devlet|millet|ülke|dünya)\b/i;
  
  if (turkishChars.test(prompt) || turkishWords.test(prompt)) {
    return 'tr';
  }
  
  return 'en'; // Default to English
};

// Validate and process complete request
const processLandingPageRequest = (requestData) => {
  try {
    // First validate the request structure
    const validation = validateLandingPageRequest(requestData);
    if (!validation.success) {
      return validation;
    }
    
    const { prompt, title, options = {} } = validation.data;
    
    // Process and enhance the prompt
    const enhancedPrompt = enhancePrompt(prompt, options);
    const keywords = extractKeywords(prompt);
    const language = detectLanguage(prompt);
    
    // Prepare final request data
    const processedData = {
      originalPrompt: prompt,
      enhancedPrompt,
      title: title || generateTitleFromPrompt(prompt),
      options: {
        temperature: options.temperature || 0.7,
        maxTokens: options.maxTokens || 4000,
        topP: options.topP || 0.9,
        ...options
      },
      metadata: {
        keywords,
        language,
        promptLength: prompt.length,
        processedAt: new Date().toISOString()
      }
    };
    
    return {
      success: true,
      data: processedData
    };
    
  } catch (error) {
    console.error('Prompt processing error:', error.message);
    return {
      success: false,
      error: {
        code: 'PROCESSING_ERROR',
        message: 'Failed to process prompt: ' + error.message
      }
    };
  }
};

// Generate a title from prompt if not provided
const generateTitleFromPrompt = (prompt) => {
  if (!prompt || typeof prompt !== 'string') {
    return 'Generated Landing Page';
  }
  
  // Extract first meaningful part of prompt
  const words = prompt.trim().split(/\s+/).slice(0, 6);
  let title = words.join(' ');
  
  // Capitalize first letter
  title = title.charAt(0).toUpperCase() + title.slice(1);
  
  // Ensure reasonable length
  if (title.length > 50) {
    title = title.substring(0, 47) + '...';
  }
  
  return title || 'Generated Landing Page';
};

// Check for inappropriate content (basic filter)
const checkContentPolicy = (prompt) => {
  if (!prompt || typeof prompt !== 'string') {
    return { allowed: true };
  }
  
  // Basic inappropriate content patterns
  const inappropriatePatterns = [
    /\b(hack|crack|pirate|illegal|fraud|scam)\b/i,
    /\b(adult|porn|sex|nude|explicit)\b/i,
    /\b(violence|weapon|bomb|kill|murder)\b/i,
    /\b(drug|cocaine|heroin|marijuana)\b/i
  ];
  
  for (const pattern of inappropriatePatterns) {
    if (pattern.test(prompt)) {
      return {
        allowed: false,
        reason: 'Content violates usage policy'
      };
    }
  }
  
  return { allowed: true };
};

module.exports = {
  validateLandingPageRequest,
  sanitizePrompt,
  enhancePrompt,
  extractKeywords,
  detectLanguage,
  processLandingPageRequest,
  generateTitleFromPrompt,
  checkContentPolicy
};