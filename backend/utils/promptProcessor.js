const { validateInput, sanitizeInput } = require('./validation');

// Enhanced prompt processing for better AI responses
const processLandingPageRequest = (requestData) => {
  try {
    const { prompt, title, options = {} } = requestData;
    
    // Validate input
    if (!prompt || !title) {
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Prompt and title are required'
        }
      };
    }
    
    // Sanitize inputs
    const sanitizedPrompt = sanitizeInput(prompt);
    const sanitizedTitle = sanitizeInput(title);
    
    // Extract special codes and widgets from prompt
    const specialCodes = extractSpecialCodes(sanitizedPrompt);
    
    // Build enhanced prompt with better instructions
    const enhancedPrompt = buildEnhancedPrompt({
      originalPrompt: sanitizedPrompt,
      title: sanitizedTitle,
      specialCodes,
      options
    });
    
    // Generate metadata for tracking
    const metadata = {
      originalPromptLength: prompt.length,
      enhancedPromptLength: enhancedPrompt.length,
      specialCodesFound: Object.keys(specialCodes).length,
      processingTime: Date.now()
    };
    
    return {
      success: true,
      data: {
        enhancedPrompt,
        title: sanitizedTitle,
        options,
        metadata,
        specialCodes
      }
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

// Extract special codes like iframes, embeds, widgets from prompt
const extractSpecialCodes = (prompt) => {
  const specialCodes = {};
  
  // Extract iframe codes
  const iframeMatches = prompt.match(/<iframe[^>]*>.*?<\/iframe>/gi);
  if (iframeMatches) {
    specialCodes.iframes = iframeMatches;
  }
  
  // Extract script tags
  const scriptMatches = prompt.match(/<script[^>]*>.*?<\/script>/gi);
  if (scriptMatches) {
    specialCodes.scripts = scriptMatches;
  }
  
  // Extract YouTube video URLs
  const youtubeMatches = prompt.match(/https:\/\/www\.youtube\.com\/watch\?v=[\w-]+(&t=\d+s)?/gi);
  if (youtubeMatches) {
    specialCodes.youtubeVideos = youtubeMatches;
  }
  
  // Extract image URLs
  const imageMatches = prompt.match(/https:\/\/[^\s]+\.(jpg|jpeg|png|webp|svg)/gi);
  if (imageMatches) {
    specialCodes.images = imageMatches;
  }
  
  // Extract anchor tags with specific patterns
  const anchorMatches = prompt.match(/<a[^>]*href="[^"]*"[^>]*>.*?<\/a>/gi);
  if (anchorMatches) {
    specialCodes.anchors = anchorMatches;
  }
  
  return specialCodes;
};

// Build enhanced prompt with better AI instructions
const buildEnhancedPrompt = ({ originalPrompt, title, specialCodes, options }) => {
  let enhancedPrompt = `Create a professional, conversion-focused landing page with the following specifications:

CRITICAL REQUIREMENTS:
1. You MUST respond with ONLY a valid JSON object in this EXACT format:
{
  "html": "complete HTML code here",
  "css": "complete CSS code here",
  "javascript": "complete JavaScript code here"
}

2. The HTML must be a complete, single-file landing page with:
   - DOCTYPE html declaration
   - Complete head section with meta tags
   - All CSS embedded in <style> tags within the head
   - All JavaScript embedded in <script> tags before closing </body>
   - Mobile-responsive design
   - Professional, modern styling

3. MANDATORY ELEMENTS TO INCLUDE:

`;

  // Add special codes with specific instructions
  if (specialCodes.iframes && specialCodes.iframes.length > 0) {
    enhancedPrompt += `
FORMS AND IFRAMES:
You MUST include these exact iframe codes in the HTML:
${specialCodes.iframes.map(iframe => `- ${iframe}`).join('\n')}

Place the main form iframe in the hero section and create a popup version that triggers after 10 seconds.
`;
  }

  if (specialCodes.scripts && specialCodes.scripts.length > 0) {
    enhancedPrompt += `
REQUIRED SCRIPTS:
You MUST include these exact script tags:
${specialCodes.scripts.map(script => `- ${script}`).join('\n')}
`;
  }

  if (specialCodes.youtubeVideos && specialCodes.youtubeVideos.length > 0) {
    enhancedPrompt += `
YOUTUBE TESTIMONIALS:
Create a testimonials section with embedded YouTube videos from these URLs:
${specialCodes.youtubeVideos.map(url => {
      const videoId = url.match(/v=([^&]+)/)?.[1];
      return `- ${url} (Embed as: <iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>)`;
    }).join('\n')}
`;
  }

  if (specialCodes.images && specialCodes.images.length > 0) {
    enhancedPrompt += `
REQUIRED IMAGES:
You MUST use ONLY these image URLs (do not use any other images):
${specialCodes.images.map(img => `- ${img}`).join('\n')}

Use these images for:
- Kitchen gallery section
- Platform logos section
- Partner logos section
- Any other image needs
`;
  }

  if (specialCodes.anchors && specialCodes.anchors.length > 0) {
    enhancedPrompt += `
REQUIRED LINKS:
You MUST include these exact anchor tags:
${specialCodes.anchors.map(anchor => `- ${anchor}`).join('\n')}
`;
  }

  // Add the original prompt with enhanced context
  enhancedPrompt += `

ORIGINAL REQUEST:
${originalPrompt}

ADDITIONAL REQUIREMENTS:
- Page title: "${title}"
- Industry: ${options.industry || 'general'}
- Target audience: ${options.targetAudience || 'general audience'}
- Call to action: ${options.callToAction || 'Get Started'}

DESIGN REQUIREMENTS:
- Modern, professional design with gradients and animations
- Mobile-first responsive design
- Fast loading and optimized code
- Conversion-focused layout with clear CTAs
- SEO-optimized with proper meta tags
- Accessibility compliant

TECHNICAL REQUIREMENTS:
- Single HTML file with embedded CSS and JavaScript
- No external dependencies except for the provided scripts/iframes
- Clean, semantic HTML structure
- Efficient CSS with media queries
- Vanilla JavaScript for interactions
- Cross-browser compatibility

Remember: Respond with ONLY the JSON object containing html, css, and javascript properties. No explanations, no markdown, no other text.`;

  return enhancedPrompt;
};

// Content policy check
const checkContentPolicy = (prompt) => {
  const prohibitedPatterns = [
    /malware|virus|hack/gi,
    /illegal|fraud|scam/gi,
    /adult|porn|sexual/gi,
    /violence|weapon|drug/gi
  ];
  
  for (const pattern of prohibitedPatterns) {
    if (pattern.test(prompt)) {
      return {
        allowed: false,
        reason: 'Content violates usage policy'
      };
    }
  }
  
  return { allowed: true };
};

// Validate prompt quality and completeness
const validatePromptQuality = (prompt) => {
  const issues = [];
  
  if (prompt.length < 50) {
    issues.push('Prompt is too short for quality results');
  }
  
  if (prompt.length > 10000) {
    issues.push('Prompt is too long and may cause processing issues');
  }
  
  if (!prompt.includes('landing page')) {
    issues.push('Prompt should clearly mention "landing page"');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    score: Math.max(0, 100 - (issues.length * 20))
  };
};

module.exports = {
  processLandingPageRequest,
  extractSpecialCodes,
  buildEnhancedPrompt,
  checkContentPolicy,
  validatePromptQuality
};