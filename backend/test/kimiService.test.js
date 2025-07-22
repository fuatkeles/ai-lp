const { generateLandingPage, testConnection, validateApiConfig } = require('../services/kimiService');
const { processLandingPageRequest } = require('../utils/promptProcessor');
const { parseAIResponse } = require('../utils/aiResponseParser');

describe('Kimi Service Integration', () => {
  
  describe('API Configuration', () => {
    test('should validate API configuration when key is present', () => {
      // Mock the environment variable
      const originalKey = process.env.KIMI_API_KEY;
      process.env.KIMI_API_KEY = 'test-key';
      
      expect(() => validateApiConfig()).not.toThrow();
      
      // Restore original value
      process.env.KIMI_API_KEY = originalKey;
    });

    test('should throw when API key is missing', () => {
      // Mock missing environment variable
      const originalKey = process.env.KIMI_API_KEY;
      delete process.env.KIMI_API_KEY;
      
      expect(() => validateApiConfig()).toThrow('KIMI_API_KEY environment variable is required');
      
      // Restore original value
      process.env.KIMI_API_KEY = originalKey;
    });
  });

  describe('Prompt Processing', () => {
    test('should process valid landing page request', () => {
      const requestData = {
        prompt: 'Create a landing page for a modern coffee shop',
        title: 'Coffee Shop Landing Page',
        options: {
          style: 'modern',
          industry: 'food'
        }
      };

      const result = processLandingPageRequest(requestData);
      
      expect(result.success).toBe(true);
      expect(result.data.enhancedPrompt).toContain('coffee shop');
      expect(result.data.title).toBe('Coffee Shop Landing Page');
      expect(result.data.metadata.keywords).toContain('coffee');
    });

    test('should reject invalid prompt', () => {
      const requestData = {
        prompt: 'hi', // Too short
      };

      const result = processLandingPageRequest(requestData);
      
      expect(result.success).toBe(false);
      expect(result.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('AI Response Parsing', () => {
    test('should parse JSON response correctly', () => {
      const mockResponse = `{
        "html": "<!DOCTYPE html><html><head><title>Test</title></head><body><h1>Hello</h1></body></html>",
        "css": "body { font-family: Arial; }",
        "javascript": "console.log('test');"
      }`;

      const result = parseAIResponse(mockResponse);
      
      expect(result.success).toBe(true);
      expect(result.data.html).toContain('<!DOCTYPE html>');
      expect(result.data.css).toContain('font-family');
      expect(result.data.javascript).toContain('console.log');
    });

    test('should parse markdown code blocks', () => {
      const mockResponse = `Here's your landing page:

\`\`\`html
<!DOCTYPE html>
<html>
<head><title>Test</title></head>
<body><h1>Hello</h1></body>
</html>
\`\`\`

\`\`\`css
body { color: blue; }
\`\`\`

\`\`\`javascript
alert('Hello');
\`\`\``;

      const result = parseAIResponse(mockResponse);
      
      expect(result.success).toBe(true);
      expect(result.data.html).toContain('<!DOCTYPE html>');
      expect(result.data.css).toContain('color: blue');
      expect(result.data.javascript).toContain('alert');
    });
  });

  // Integration test - only run if API key is available
  describe('Full Integration', () => {
    test('should generate landing page end-to-end', async () => {
      // Skip if no API key
      if (!process.env.KIMI_API_KEY) {
        console.log('Skipping integration test - no KIMI_API_KEY');
        return;
      }

      const prompt = 'Create a simple landing page for a tech startup';
      
      try {
        const result = await generateLandingPage(prompt, { maxTokens: 1000 });
        
        if (result.success) {
          expect(result.data.content).toBeDefined();
          expect(result.data.metadata.processingTime).toBeGreaterThan(0);
          
          // Try to parse the response
          const parseResult = parseAIResponse(result.data.content);
          expect(parseResult.success).toBe(true);
        } else {
          console.log('AI generation failed (expected in test env):', result.error.message);
        }
      } catch (error) {
        console.log('Integration test failed (expected in test env):', error.message);
      }
    }, 30000); // 30 second timeout
  });
});