const { JSDOM } = require('jsdom');
const { sanitizeHTML, sanitizeCSS, sanitizeJavaScript } = require('./codeSanitizer');

// Parse AI response and extract HTML, CSS, JavaScript
const parseAIResponse = (aiContent) => {
  try {
    if (!aiContent || typeof aiContent !== 'string') {
      throw new Error('Invalid AI response content');
    }
    
    // First try to parse as JSON (preferred format)
    const jsonResult = tryParseAsJSON(aiContent);
    if (jsonResult.success) {
      return jsonResult;
    }
    
    // Fallback: parse as markdown/text with code blocks
    const textResult = parseAsTextWithCodeBlocks(aiContent);
    if (textResult.success) {
      return textResult;
    }
    
    // Last resort: extract any HTML-like content
    const htmlResult = extractHTMLContent(aiContent);
    return htmlResult;
    
  } catch (error) {
    console.error('AI response parsing error:', error.message);
    return {
      success: false,
      error: {
        code: 'PARSING_ERROR',
        message: 'Failed to parse AI response: ' + error.message
      }
    };
  }
};

// Try to parse response as JSON
const tryParseAsJSON = (content) => {
  try {
    // Clean the content first - remove markdown code blocks if present
    let cleanContent = content.trim();
    
    // Remove markdown code block markers
    cleanContent = cleanContent.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Handle HTML-encoded quotes and other entities more comprehensively
    cleanContent = cleanContent
      .replace(/\\&quot;/g, '"')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/&nbsp;/g, ' ')
      .replace(/&copy;/g, '©')
      .replace(/&reg;/g, '®')
      .replace(/&trade;/g, '™');
    
    // Look for JSON object in the content - more flexible regex
    const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false };
    }
    
    cleanContent = jsonMatch[0];
    
    // Fix common JSON issues
    cleanContent = cleanContent
      .replace(/,\s*}/g, '}')  // Remove trailing commas
      .replace(/,\s*]/g, ']'); // Remove trailing commas in arrays
    
    // Try to fix escaped quotes in HTML content
    cleanContent = fixEscapedQuotesInJSON(cleanContent);
    
    const parsed = JSON.parse(cleanContent);
    
    // Validate required fields
    if (!parsed.html) {
      return { success: false };
    }
    
    // Decode HTML entities in the parsed content
    const decodedHtml = decodeHTMLEntities(parsed.html);
    const decodedCss = decodeHTMLEntities(parsed.css || '');
    const decodedJs = decodeHTMLEntities(parsed.javascript || '');
    
    return {
      success: true,
      data: {
        html: cleanHTML(decodedHtml),
        css: cleanCSS(decodedCss),
        javascript: cleanJavaScript(decodedJs),
        metadata: {
          parseMethod: 'json',
          originalLength: content.length
        }
      }
    };
    
  } catch (error) {
    console.log('JSON parse error:', error.message);
    // If JSON parsing fails, try to extract HTML directly from the response
    return tryParseAsDirectHTML(content);
  }
};

// Fix escaped quotes in JSON strings containing HTML
const fixEscapedQuotesInJSON = (jsonString) => {
  try {
    // This is a more sophisticated approach to handle escaped quotes in HTML content
    // We'll look for the pattern: "html": "..." and fix quotes within the HTML string
    
    const htmlMatch = jsonString.match(/"html"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (htmlMatch) {
      let htmlContent = htmlMatch[1];
      // Fix common escaping issues in HTML content
      htmlContent = htmlContent
        .replace(/\\"/g, '"')  // Unescape quotes
        .replace(/\\\\/g, '\\'); // Fix double backslashes
      
      // Replace the original HTML content with the fixed version
      jsonString = jsonString.replace(htmlMatch[0], `"html": ${JSON.stringify(htmlContent)}`);
    }
    
    const cssMatch = jsonString.match(/"css"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (cssMatch) {
      let cssContent = cssMatch[1];
      cssContent = cssContent
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
      
      jsonString = jsonString.replace(cssMatch[0], `"css": ${JSON.stringify(cssContent)}`);
    }
    
    const jsMatch = jsonString.match(/"javascript"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (jsMatch) {
      let jsContent = jsMatch[1];
      jsContent = jsContent
        .replace(/\\"/g, '"')
        .replace(/\\\\/g, '\\');
      
      jsonString = jsonString.replace(jsMatch[0], `"javascript": ${JSON.stringify(jsContent)}`);
    }
    
    return jsonString;
  } catch (error) {
    console.log('Error fixing escaped quotes:', error.message);
    return jsonString;
  }
};

// Decode HTML entities
const decodeHTMLEntities = (text) => {
  if (!text) return '';
  
  const entityMap = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&nbsp;': ' ',
    '&copy;': '©',
    '&reg;': '®',
    '&trade;': '™',
    '&hellip;': '…',
    '&mdash;': '—',
    '&ndash;': '–',
    '&lsquo;': "'",
    '&rsquo;': "'",
    '&ldquo;': '"',
    '&rdquo;': '"'
  };
  
  let decoded = text;
  for (const [entity, char] of Object.entries(entityMap)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }
  
  // Handle numeric entities
  decoded = decoded.replace(/&#(\d+);/g, (match, dec) => {
    return String.fromCharCode(dec);
  });
  
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });
  
  return decoded;
};

// Try to parse response as direct HTML (when AI returns HTML instead of JSON)
const tryParseAsDirectHTML = (content) => {
  try {
    // Clean the content first
    let cleanContent = content.trim();
    
    // Handle HTML-encoded quotes and other entities
    cleanContent = cleanContent
      .replace(/\\&quot;/g, '"')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/');
    
    // Look for HTML content - check if it starts with HTML tags
    const htmlMatch = cleanContent.match(/<html[\s\S]*<\/html>|<!DOCTYPE[\s\S]*<\/html>/i);
    
    if (htmlMatch) {
      const htmlContent = htmlMatch[0];
      
      // Try to extract CSS from style tags
      const styleMatch = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
      const cssContent = styleMatch ? styleMatch[1] : '';
      
      // Try to extract JavaScript from script tags
      const scriptMatch = htmlContent.match(/<script[^>]*>([\s\S]*?)<\/script>/i);
      const jsContent = scriptMatch ? scriptMatch[1] : '';
      
      return {
        success: true,
        data: {
          html: cleanHTML(htmlContent),
          css: cleanCSS(cssContent),
          javascript: cleanJavaScript(jsContent),
          metadata: {
            parseMethod: 'direct-html',
            originalLength: content.length,
            warning: 'Parsed HTML directly from AI response (not JSON format)'
          }
        }
      };
    }
    
    return { success: false };
    
  } catch (error) {
    console.log('Direct HTML parse error:', error.message);
    return { success: false };
  }
};

// Parse content with code blocks (markdown style)
const parseAsTextWithCodeBlocks = (content) => {
  try {
    const result = {
      html: '',
      css: '',
      javascript: ''
    };
    
    // Extract HTML code blocks
    const htmlMatches = content.match(/```html\n([\s\S]*?)\n```/gi) || 
                       content.match(/```\n([\s\S]*?)\n```/gi);
    if (htmlMatches && htmlMatches.length > 0) {
      result.html = htmlMatches[0].replace(/```html\n|```\n|```/g, '').trim();
    }
    
    // Extract CSS code blocks
    const cssMatches = content.match(/```css\n([\s\S]*?)\n```/gi);
    if (cssMatches && cssMatches.length > 0) {
      result.css = cssMatches[0].replace(/```css\n|```/g, '').trim();
    }
    
    // Extract JavaScript code blocks
    const jsMatches = content.match(/```javascript\n([\s\S]*?)\n```/gi) ||
                     content.match(/```js\n([\s\S]*?)\n```/gi);
    if (jsMatches && jsMatches.length > 0) {
      result.javascript = jsMatches[0].replace(/```javascript\n|```js\n|```/g, '').trim();
    }
    
    // Validate we got at least HTML
    if (!result.html) {
      return { success: false };
    }
    
    return {
      success: true,
      data: {
        html: cleanHTML(result.html),
        css: cleanCSS(result.css),
        javascript: cleanJavaScript(result.javascript),
        metadata: {
          parseMethod: 'codeblocks',
          originalLength: content.length
        }
      }
    };
    
  } catch (error) {
    return { success: false };
  }
};

// Extract any HTML-like content as fallback
const extractHTMLContent = (content) => {
  try {
    // Look for HTML tags in the content
    const htmlMatch = content.match(/<html[\s\S]*<\/html>|<body[\s\S]*<\/body>|<div[\s\S]*<\/div>/i);
    
    if (!htmlMatch) {
      // Generate basic HTML structure from text
      const basicHTML = generateBasicHTML(content);
      return {
        success: true,
        data: {
          html: basicHTML,
          css: generateBasicCSS(),
          javascript: '',
          metadata: {
            parseMethod: 'generated',
            originalLength: content.length,
            warning: 'Generated basic HTML from text content'
          }
        }
      };
    }
    
    return {
      success: true,
      data: {
        html: cleanHTML(htmlMatch[0]),
        css: '',
        javascript: '',
        metadata: {
          parseMethod: 'extracted',
          originalLength: content.length,
          warning: 'Extracted HTML without separate CSS/JS'
        }
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'EXTRACTION_ERROR',
        message: 'Failed to extract HTML content'
      }
    };
  }
};

// Clean and validate HTML content
const cleanHTML = (html) => {
  return sanitizeHTML(html, {
    allowForms: true,        // Allow forms for lead capture
    allowScripts: true,      // Allow scripts for functionality
    allowExternalLinks: true, // Allow external links
    preserveDoctype: true
  });
};

// Clean and validate CSS content
const cleanCSS = (css) => {
  return sanitizeCSS(css, {
    allowImports: false,
    allowExpressions: false
  });
};

// Clean and validate JavaScript content
const cleanJavaScript = (js) => {
  return sanitizeJavaScript(js, {
    allowEval: false,
    allowDOM: true,         // Allow DOM manipulation for interactivity
    allowAjax: false,
    allowWindowAccess: true  // Allow window access for basic functionality
  });
};

// Generate basic HTML structure from text
const generateBasicHTML = (content) => {
  const title = content.split('\n')[0] || 'Generated Landing Page';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { color: #333; }
        .content { white-space: pre-wrap; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title}</h1>
        <div class="content">${content}</div>
    </div>
</body>
</html>`;
};

// Generate basic CSS
const generateBasicCSS = () => {
  return `/* Basic responsive styles */
* {
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
    padding: 20px;
}

@media (max-width: 768px) {
    .container {
        padding: 10px;
    }
}`;
};

// Validate parsed landing page structure
const validateParsedContent = (parsedData) => {
  try {
    if (!parsedData || !parsedData.html) {
      return {
        success: false,
        error: {
          code: 'INVALID_STRUCTURE',
          message: 'Missing required HTML content'
        }
      };
    }
    
    // Check HTML structure
    const dom = new JSDOM(parsedData.html);
    const document = dom.window.document;
    
    const validationResults = {
      hasTitle: !!document.querySelector('title'),
      hasViewport: !!document.querySelector('meta[name="viewport"]'),
      hasBody: !!document.querySelector('body'),
      hasContent: document.body ? document.body.textContent.trim().length > 0 : false,
      isResponsive: parsedData.css.includes('@media') || parsedData.css.includes('responsive'),
      estimatedSize: {
        html: parsedData.html.length,
        css: parsedData.css.length,
        javascript: parsedData.javascript.length
      }
    };
    
    return {
      success: true,
      validation: validationResults,
      recommendations: generateRecommendations(validationResults)
    };
    
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Failed to validate parsed content: ' + error.message
      }
    };
  }
};

// Generate recommendations for improvement
const generateRecommendations = (validation) => {
  const recommendations = [];
  
  if (!validation.hasTitle) {
    recommendations.push('Add a descriptive title tag for better SEO');
  }
  
  if (!validation.hasViewport) {
    recommendations.push('Add viewport meta tag for mobile responsiveness');
  }
  
  if (!validation.isResponsive) {
    recommendations.push('Add responsive CSS media queries for better mobile experience');
  }
  
  if (validation.estimatedSize.html > 50000) {
    recommendations.push('Consider optimizing HTML size for better performance');
  }
  
  if (validation.estimatedSize.css > 20000) {
    recommendations.push('Consider optimizing CSS size for better performance');
  }
  
  return recommendations;
};

module.exports = {
  parseAIResponse,
  validateParsedContent,
  cleanHTML,
  cleanCSS,
  cleanJavaScript
};