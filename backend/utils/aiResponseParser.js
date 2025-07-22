const { JSDOM } = require('jsdom');

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
    // Look for JSON object in the content
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false };
    }
    
    const jsonStr = jsonMatch[0];
    const parsed = JSON.parse(jsonStr);
    
    // Validate required fields
    if (!parsed.html || !parsed.css) {
      return { success: false };
    }
    
    return {
      success: true,
      data: {
        html: cleanHTML(parsed.html),
        css: cleanCSS(parsed.css),
        javascript: cleanJavaScript(parsed.javascript || ''),
        metadata: {
          parseMethod: 'json',
          originalLength: content.length
        }
      }
    };
    
  } catch (error) {
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
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  try {
    // Preserve DOCTYPE if present
    const hasDoctype = html.trim().toLowerCase().startsWith('<!doctype');
    
    // Use JSDOM to parse and clean HTML
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Remove potentially dangerous elements
    const dangerousElements = document.querySelectorAll('script, iframe, object, embed, form[action]');
    dangerousElements.forEach(el => el.remove());
    
    // Remove dangerous attributes
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      // Remove event handlers
      const attributes = [...el.attributes];
      attributes.forEach(attr => {
        if (attr.name.startsWith('on') || attr.name === 'href' && attr.value.startsWith('javascript:')) {
          el.removeAttribute(attr.name);
        }
      });
    });
    
    // Get cleaned HTML
    let cleanedHTML = document.documentElement.outerHTML;
    
    // Add DOCTYPE back if it was present originally
    if (hasDoctype && !cleanedHTML.toLowerCase().startsWith('<!doctype')) {
      cleanedHTML = '<!DOCTYPE html>\n' + cleanedHTML;
    }
    
    // Add viewport meta tag if missing
    if (!cleanedHTML.includes('viewport')) {
      cleanedHTML = cleanedHTML.replace(
        '<head>',
        '<head>\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">'
      );
    }
    
    return cleanedHTML;
    
  } catch (error) {
    console.error('HTML cleaning error:', error.message);
    // Return original if cleaning fails
    return html;
  }
};

// Clean and validate CSS content
const cleanCSS = (css) => {
  if (!css || typeof css !== 'string') {
    return '';
  }
  
  try {
    // Remove potentially dangerous CSS
    let cleanedCSS = css
      .replace(/@import\s+url\([^)]*\);?/gi, '') // Remove @import statements
      .replace(/expression\s*\([^)]*\)/gi, '') // Remove CSS expressions
      .replace(/javascript:/gi, '') // Remove javascript: in CSS
      .replace(/behavior\s*:/gi, 'removed-behavior:'); // Remove IE behaviors
    
    // Add basic responsive styles if missing
    if (!cleanedCSS.includes('@media')) {
      cleanedCSS += `\n\n/* Basic responsive styles */
@media (max-width: 768px) {
  body { font-size: 14px; }
  .container { padding: 10px; }
}`;
    }
    
    return cleanedCSS.trim();
    
  } catch (error) {
    console.error('CSS cleaning error:', error.message);
    return css;
  }
};

// Clean and validate JavaScript content
const cleanJavaScript = (js) => {
  if (!js || typeof js !== 'string') {
    return '';
  }
  
  try {
    // Remove potentially dangerous JavaScript
    let cleanedJS = js
      .replace(/eval\s*\(/gi, 'removed_eval(') // Remove eval
      .replace(/Function\s*\(/gi, 'removed_Function(') // Remove Function constructor
      .replace(/setTimeout\s*\(\s*["'`][^"'`]*["'`]/gi, '') // Remove setTimeout with string
      .replace(/setInterval\s*\(\s*["'`][^"'`]*["'`]/gi, '') // Remove setInterval with string
      .replace(/document\.write/gi, 'removed_document_write') // Remove document.write
      .replace(/innerHTML\s*=/gi, 'textContent ='); // Replace innerHTML with textContent
    
    return cleanedJS.trim();
    
  } catch (error) {
    console.error('JavaScript cleaning error:', error.message);
    return js;
  }
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