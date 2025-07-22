const axios = require('axios');

// Kimi K2 API Configuration
const KIMI_API_URL = process.env.KIMI_API_URL || 'https://api.moonshot.cn/v1';
const AI_REQUEST_TIMEOUT = parseInt(process.env.AI_REQUEST_TIMEOUT) || 30000;
const AI_MAX_RETRIES = parseInt(process.env.AI_MAX_RETRIES) || 3;

// Validate API configuration
const validateApiConfig = () => {
  const KIMI_API_KEY = process.env.KIMI_API_KEY; // Read fresh from env
  if (!KIMI_API_KEY) {
    throw new Error('KIMI_API_KEY environment variable is required');
  }
  return true;
};

// Create axios instance for Kimi API
const createKimiClient = () => {
  validateApiConfig();
  const KIMI_API_KEY = process.env.KIMI_API_KEY; // Read fresh from env
  
  return axios.create({
    baseURL: KIMI_API_URL,
    timeout: AI_REQUEST_TIMEOUT,
    headers: {
      'Authorization': `Bearer ${KIMI_API_KEY}`,
      'Content-Type': 'application/json',
      'User-Agent': 'AI-Landing-Page-Generator/1.0.0'
    }
  });
};

// Retry mechanism for API calls
const retryApiCall = async (apiCall, maxRetries = AI_MAX_RETRIES) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await apiCall();
    } catch (error) {
      lastError = error;
      
      // Don't retry on client errors (4xx)
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
        console.log(`Kimi API call failed (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

// Generate landing page using Kimi K2 API
const generateLandingPage = async (prompt, options = {}) => {
  try {
    const client = createKimiClient();
    
    // Construct the system prompt for landing page generation
    const systemPrompt = `You are an expert web developer and designer. Generate a complete, responsive landing page based on the user's prompt. 

Requirements:
- Create a modern, professional landing page
- Include HTML, CSS, and JavaScript in separate sections
- Make it fully responsive (mobile, tablet, desktop)
- Use modern CSS features (flexbox, grid, gradients)
- Include interactive elements and smooth animations
- Optimize for conversion (clear CTAs, compelling copy)
- Use semantic HTML structure
- Ensure accessibility compliance
- Include meta tags for SEO

Response format:
Return a JSON object with three properties:
{
  "html": "complete HTML structure",
  "css": "complete CSS styles", 
  "javascript": "complete JavaScript functionality"
}

Make each section unique and creative while maintaining professional quality.`;

    const requestPayload = {
      model: 'moonshot-v1-8k',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 4000,
      top_p: options.topP || 0.9,
      stream: false
    };

    console.log('Sending request to Kimi API...');
    const startTime = Date.now();
    
    const response = await retryApiCall(async () => {
      return await client.post('/chat/completions', requestPayload);
    });
    
    const processingTime = Date.now() - startTime;
    console.log(`Kimi API response received in ${processingTime}ms`);
    
    // Extract and validate response
    const aiResponse = response.data;
    if (!aiResponse.choices || !aiResponse.choices[0] || !aiResponse.choices[0].message) {
      throw new Error('Invalid response format from Kimi API');
    }
    
    const generatedContent = aiResponse.choices[0].message.content;
    
    return {
      success: true,
      data: {
        content: generatedContent,
        metadata: {
          model: aiResponse.model || 'moonshot-v1-8k',
          processingTime,
          tokens: aiResponse.usage || {},
          finishReason: aiResponse.choices[0].finish_reason
        }
      }
    };
    
  } catch (error) {
    console.error('Kimi API error:', error.message);
    
    // Handle different types of errors
    if (error.response) {
      const status = error.response.status;
      const errorData = error.response.data;
      
      return {
        success: false,
        error: {
          code: `KIMI_API_ERROR_${status}`,
          message: getErrorMessage(status, errorData),
          details: process.env.NODE_ENV === 'development' ? errorData : undefined
        }
      };
    } else if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: {
          code: 'KIMI_API_TIMEOUT',
          message: 'AI service request timed out. Please try again.'
        }
      };
    } else {
      return {
        success: false,
        error: {
          code: 'KIMI_API_UNKNOWN',
          message: 'An unexpected error occurred while generating the landing page.'
        }
      };
    }
  }
};

// Get user-friendly error messages
const getErrorMessage = (status, errorData) => {
  switch (status) {
    case 400:
      return 'Invalid request. Please check your prompt and try again.';
    case 401:
      return 'API authentication failed. Please contact support.';
    case 403:
      return 'Access forbidden. Please check your API permissions.';
    case 429:
      return 'Rate limit exceeded. Please wait a moment and try again.';
    case 500:
      return 'AI service is temporarily unavailable. Please try again later.';
    case 502:
    case 503:
    case 504:
      return 'AI service is experiencing issues. Please try again in a few minutes.';
    default:
      return errorData?.error?.message || 'An error occurred while processing your request.';
  }
};

// Test API connection
const testConnection = async () => {
  try {
    validateApiConfig();
    const client = createKimiClient();
    
    // Simple test request
    const response = await client.post('/chat/completions', {
      model: 'moonshot-v1-8k',
      messages: [
        {
          role: 'user',
          content: 'Hello, please respond with "API connection successful"'
        }
      ],
      max_tokens: 50
    });
    
    return {
      success: true,
      message: 'Kimi API connection successful',
      model: response.data.model
    };
    
  } catch (error) {
    console.error('Kimi API connection test failed:', error.message);
    return {
      success: false,
      error: {
        code: 'CONNECTION_FAILED',
        message: 'Failed to connect to Kimi API'
      }
    };
  }
};

module.exports = {
  generateLandingPage,
  testConnection,
  validateApiConfig
};