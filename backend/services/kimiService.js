const axios = require('axios');

// AI API Configuration
const KIMI_API_URL = process.env.KIMI_API_URL || 'https://api.moonshot.ai/v1';
const GEMINI_API_URL = process.env.GEMINI_API_URL || 'https://generativelanguage.googleapis.com/v1beta';
const AI_REQUEST_TIMEOUT = parseInt(process.env.AI_REQUEST_TIMEOUT) || 30000;
const AI_MAX_RETRIES = parseInt(process.env.AI_MAX_RETRIES) || 3;

// Validate API configuration
const validateApiConfig = (model = 'kimi') => {
  if (model === 'kimi') {
    const KIMI_API_KEY = process.env.KIMI_API_KEY;
    if (!KIMI_API_KEY) {
      console.warn('KIMI_API_KEY not found');
      return false;
    }
    return true;
  } else if (model === 'gemini') {
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      console.warn('GEMINI_API_KEY not found');
      return false;
    }
    return true;
  }
  return false;
};

// Create axios instance for Kimi API
const createKimiClient = () => {
  const hasApiKey = validateApiConfig('kimi');
  if (!hasApiKey) {
    throw new Error('Cannot create Kimi client without API key');
  }

  const KIMI_API_KEY = process.env.KIMI_API_KEY;

  return axios.create({
    baseURL: KIMI_API_URL,
    timeout: AI_REQUEST_TIMEOUT,
    headers: {
      'Authorization': `Bearer ${KIMI_API_KEY}`,
      'Content-Type': 'application/json'
    }
  });
};

// Create axios instance for Gemini API
const createGeminiClient = () => {
  const hasApiKey = validateApiConfig('gemini');
  if (!hasApiKey) {
    throw new Error('Cannot create Gemini client without API key');
  }

  return axios.create({
    baseURL: GEMINI_API_URL,
    timeout: AI_REQUEST_TIMEOUT,
    headers: {
      'Content-Type': 'application/json'
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

      console.log(`API call failed (attempt ${attempt}/${maxRetries}):`, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message,
        data: error.response?.data
      });

      // Don't retry on client errors (4xx) - these are usually auth/config issues
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        console.error('Client error - not retrying:', error.response.status, error.response.statusText);
        throw error;
      }

      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

// Generate landing page using selected AI model
const generateLandingPage = async (prompt, options = {}) => {
  const selectedModel = options.model || 'gemini'; // Default to Gemini

  try {
    const hasApiKey = validateApiConfig(selectedModel);

    // If no API key, return mock response for development
    if (!hasApiKey) {
      console.log(`Using mock response for development (no ${selectedModel.toUpperCase()} API key)`);
      const mockContent = generateMockResponse(prompt);

      return {
        success: true,
        data: {
          content: mockContent,
          metadata: {
            model: 'mock-development',
            processingTime: 1500,
            tokens: { prompt_tokens: 100, completion_tokens: 500, total_tokens: 600 },
            finishReason: 'stop'
          }
        }
      };
    }

    if (selectedModel === 'kimi') {
      return await generateWithKimi(prompt, options);
    } else if (selectedModel === 'gemini') {
      return await generateWithGemini(prompt, options);
    } else {
      throw new Error(`Unsupported model: ${selectedModel}`);
    }

  } catch (error) {
    console.error(`${selectedModel.toUpperCase()} API error:`, error.message);

    return {
      success: false,
      error: {
        code: `${selectedModel.toUpperCase()}_API_ERROR`,
        message: error.message || 'An unexpected error occurred while generating the landing page.'
      }
    };
  }
};

// Generate with Kimi API
const generateWithKimi = async (prompt, options = {}) => {
  try {
    const client = createKimiClient();

    // Construct the system prompt for landing page generation
    const systemPrompt = `You are an expert web developer and designer. You MUST create a complete, functional landing page.

CRITICAL INSTRUCTION: Respond with ONLY a valid JSON object. No explanations, no markdown, no other text.

Your response must be EXACTLY this format:
{
  "html": "complete HTML code here",
  "css": "complete CSS code here", 
  "javascript": "complete JavaScript code here"
}

Requirements for the landing page:
- Complete HTML with DOCTYPE, head, body
- Full CSS styling (colors, layout, responsive design)
- Working JavaScript for interactions
- Professional, modern design
- Mobile responsive
- All images, forms, and content from user's prompt
- Proper meta tags and SEO optimization

EXAMPLE of correct response format:
{
  "html": "<!DOCTYPE html><html lang=\\"en\\"><head><meta charset=\\"UTF-8\\"><title>Page Title</title></head><body><h1>Content here</h1></body></html>",
  "css": "body{margin:0;font-family:Arial,sans-serif;background:#f5f5f5}h1{color:#333;text-align:center}",
  "javascript": "document.addEventListener('DOMContentLoaded',function(){console.log('Page loaded');});"
}

Remember: ONLY return the JSON object, nothing else!`;

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
    console.log('Kimi API URL:', KIMI_API_URL);
    console.log('Timeout set to:', AI_REQUEST_TIMEOUT, 'ms');

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

    // Debug: Log the raw AI response
    console.log('Raw Kimi response:', generatedContent.substring(0, 500) + '...');

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
    console.error('Kimi API detailed error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method,
        headers: error.config?.headers
      }
    });
    throw error;
  }
};

// Generate with Gemini API
const generateWithGemini = async (prompt, options = {}) => {
  try {
    const client = createGeminiClient();
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    // Construct the system prompt for landing page generation
    const systemPrompt = `You are an expert web developer and designer. You MUST create a complete, functional landing page.

CRITICAL INSTRUCTION: Respond with ONLY a valid JSON object. No explanations, no markdown, no other text.

Your response must be EXACTLY this format:
{
  "html": "complete HTML code here",
  "css": "complete CSS code here", 
  "javascript": "complete JavaScript code here"
}

Requirements for the landing page:
- Complete HTML with DOCTYPE, head, body
- Full CSS styling (colors, layout, responsive design)
- Working JavaScript for interactions
- Professional, modern design
- Mobile responsive
- All images, forms, and content from user's prompt
- Proper meta tags and SEO optimization

EXAMPLE of correct response format:
{
  "html": "<!DOCTYPE html><html lang=\\"en\\"><head><meta charset=\\"UTF-8\\"><title>Page Title</title></head><body><h1>Content here</h1></body></html>",
  "css": "body{margin:0;font-family:Arial,sans-serif;background:#f5f5f5}h1{color:#333;text-align:center}",
  "javascript": "document.addEventListener('DOMContentLoaded',function(){console.log('Page loaded');});"
}

Remember: ONLY return the JSON object, nothing else!

User's request: ${prompt}`;

    const requestPayload = {
      contents: [
        {
          parts: [
            {
              text: systemPrompt
            }
          ]
        }
      ],
      generationConfig: {
        temperature: options.temperature || 0.7,
        maxOutputTokens: options.maxTokens || 4000,
        topP: options.topP || 0.9
      }
    };

    console.log('Sending request to Gemini API...');
    console.log('Gemini API URL:', GEMINI_API_URL);

    const startTime = Date.now();

    const response = await retryApiCall(async () => {
      return await client.post(`/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, requestPayload);
    });

    const processingTime = Date.now() - startTime;
    console.log(`Gemini API response received in ${processingTime}ms`);

    // Extract and validate response
    const aiResponse = response.data;
    if (!aiResponse.candidates || !aiResponse.candidates[0] || !aiResponse.candidates[0].content) {
      throw new Error('Invalid response format from Gemini API');
    }

    const generatedContent = aiResponse.candidates[0].content.parts[0].text;

    // Debug: Log the raw AI response
    console.log('Raw Gemini response:', generatedContent.substring(0, 500) + '...');

    return {
      success: true,
      data: {
        content: generatedContent,
        metadata: {
          model: aiResponse.modelVersion || 'gemini-1.5-flash-latest',
          processingTime,
          tokens: aiResponse.usageMetadata || {},
          finishReason: aiResponse.candidates[0].finishReason
        }
      }
    };

  } catch (error) {
    console.error('Gemini API detailed error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method
      }
    });
    throw error;
  }
};

// Mock response for development when API key is not available
const generateMockResponse = (prompt) => {
  const mockHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Mock Landing Page</title>
</head>
<body>
    <header class="hero">
        <div class="container">
            <h1>Welcome to Our Amazing Product</h1>
            <p>This is a mock landing page generated for development purposes.</p>
            <p><strong>Your prompt:</strong> ${prompt}</p>
            <button class="cta-button">Get Started Now</button>
        </div>
    </header>
    
    <section class="features">
        <div class="container">
            <h2>Key Features</h2>
            <div class="feature-grid">
                <div class="feature">
                    <h3>Feature 1</h3>
                    <p>Amazing functionality that solves your problems.</p>
                </div>
                <div class="feature">
                    <h3>Feature 2</h3>
                    <p>Innovative solutions for modern challenges.</p>
                </div>
                <div class="feature">
                    <h3>Feature 3</h3>
                    <p>User-friendly interface with powerful capabilities.</p>
                </div>
            </div>
        </div>
    </section>
    
    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 Mock Company. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>`;

  const mockCss = `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
    line-height: 1.6;
    color: #333;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
}

.hero {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 100px 0;
    text-align: center;
}

.hero h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
    animation: fadeInUp 1s ease-out;
}

.hero p {
    font-size: 1.2rem;
    margin-bottom: 2rem;
    animation: fadeInUp 1s ease-out 0.2s both;
}

.cta-button {
    background: #ff6b6b;
    color: white;
    padding: 15px 30px;
    border: none;
    border-radius: 50px;
    font-size: 1.1rem;
    cursor: pointer;
    transition: all 0.3s ease;
    animation: fadeInUp 1s ease-out 0.4s both;
}

.cta-button:hover {
    background: #ff5252;
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(255, 107, 107, 0.3);
}

.features {
    padding: 80px 0;
    background: #f8f9fa;
}

.features h2 {
    text-align: center;
    font-size: 2.5rem;
    margin-bottom: 3rem;
    color: #333;
}

.feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
}

.feature {
    background: white;
    padding: 2rem;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.1);
    transition: transform 0.3s ease;
}

.feature:hover {
    transform: translateY(-5px);
}

.feature h3 {
    color: #667eea;
    margin-bottom: 1rem;
    font-size: 1.5rem;
}

.footer {
    background: #333;
    color: white;
    text-align: center;
    padding: 2rem 0;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@media (max-width: 768px) {
    .hero h1 {
        font-size: 2rem;
    }
    
    .hero p {
        font-size: 1rem;
    }
    
    .feature-grid {
        grid-template-columns: 1fr;
    }
}`;

  const mockJs = `document.addEventListener('DOMContentLoaded', function() {
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });
    
    // CTA button click handler
    const ctaButton = document.querySelector('.cta-button');
    if (ctaButton) {
        ctaButton.addEventListener('click', function() {
            alert('This is a mock landing page for development. CTA button clicked!');
        });
    }
    
    // Add scroll animation to features
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);
    
    document.querySelectorAll('.feature').forEach(feature => {
        feature.style.opacity = '0';
        feature.style.transform = 'translateY(20px)';
        feature.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(feature);
    });
    
    console.log('Mock landing page loaded successfully!');
});`;

  return JSON.stringify({
    html: mockHtml,
    css: mockCss,
    javascript: mockJs
  });
};

// Test API connection
const testConnection = async () => {
  try {
    const hasApiKey = validateApiConfig('gemini');
    if (!hasApiKey) {
      return {
        success: false,
        error: {
          code: 'NO_API_KEY',
          message: 'No API key found'
        }
      };
    }

    const client = createGeminiClient();
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

    // Simple test request
    const response = await client.post(`/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`, {
      contents: [
        {
          parts: [
            {
              text: 'Hello, please respond with "API connection successful"'
            }
          ]
        }
      ]
    });

    return {
      success: true,
      message: 'Gemini API connection successful',
      model: response.data.modelVersion || 'gemini-1.5-flash-latest'
    };

  } catch (error) {
    console.error('API connection test failed:', error.message);
    return {
      success: false,
      error: {
        code: 'CONNECTION_FAILED',
        message: 'Failed to connect to API'
      }
    };
  }
};

module.exports = {
  generateLandingPage,
  testConnection,
  validateApiConfig
};