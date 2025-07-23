const { JSDOM } = require('jsdom');

/**
 * Advanced Code Sanitization Utilities
 * Provides comprehensive sanitization for HTML, CSS, and JavaScript code
 */

// Dangerous HTML elements that should be removed
const DANGEROUS_HTML_ELEMENTS = [
  'script', 'iframe', 'object', 'embed', 'applet', 'form', 'input', 'textarea',
  'select', 'button', 'link[rel="stylesheet"][href*="://"]', 'meta[http-equiv]'
];

// Dangerous HTML attributes that should be removed
const DANGEROUS_HTML_ATTRIBUTES = [
  'onload', 'onerror', 'onclick', 'onmouseover', 'onmouseout', 'onkeydown',
  'onkeyup', 'onkeypress', 'onfocus', 'onblur', 'onchange', 'onsubmit',
  'onreset', 'onselect', 'onabort', 'onunload', 'onresize', 'onscroll'
];

// Dangerous CSS properties and values
const DANGEROUS_CSS_PATTERNS = [
  /expression\s*\(/gi,           // CSS expressions (IE)
  /javascript\s*:/gi,            // JavaScript URLs
  /vbscript\s*:/gi,             // VBScript URLs
  /data\s*:\s*text\/html/gi,    // Data URLs with HTML
  /behavior\s*:/gi,             // IE behaviors
  /@import\s+url\s*\(/gi,       // External imports
  /binding\s*:/gi,              // XBL bindings
  /-moz-binding/gi,             // Mozilla bindings
  /filter\s*:\s*progid/gi       // IE filters
];

// Dangerous JavaScript patterns
const DANGEROUS_JS_PATTERNS = [
  /eval\s*\(/gi,                           // eval function
  /Function\s*\(/gi,                       // Function constructor
  /setTimeout\s*\(\s*["'`][^"'`]*["'`]/gi, // setTimeout with string
  /setInterval\s*\(\s*["'`][^"'`]*["'`]/gi, // setInterval with string
  /document\.write/gi,                     // document.write
  /document\.writeln/gi,                   // document.writeln
  /innerHTML\s*=/gi,                       // innerHTML assignment
  /outerHTML\s*=/gi,                       // outerHTML assignment
  /location\s*=/gi,                        // location assignment
  /window\.location/gi,                    // window.location
  /document\.location/gi,                  // document.location
  /XMLHttpRequest/gi,                      // AJAX requests
  /fetch\s*\(/gi,                         // Fetch API
  /import\s*\(/gi,                        // Dynamic imports
  /require\s*\(/gi,                       // CommonJS require
  /process\./gi,                          // Node.js process
  /global\./gi,                           // Global object
  /window\./gi                            // Window object access
];

/**
 * Comprehensive HTML sanitization
 * @param {string} html - HTML content to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized HTML
 */
const sanitizeHTML = (html, options = {}) => {
  if (!html || typeof html !== 'string') {
    return '';
  }
  
  try {
    const {
      allowForms = false,
      allowScripts = false,
      allowExternalLinks = false,
      preserveDoctype = true
    } = options;
    
    // Preserve DOCTYPE if present
    const hasDoctype = html.trim().toLowerCase().startsWith('<!doctype');
    
    // Create DOM instance
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    // Remove dangerous elements
    let elementsToRemove = [...DANGEROUS_HTML_ELEMENTS];
    if (allowForms) {
      elementsToRemove = elementsToRemove.filter(el => !['form', 'input', 'textarea', 'select', 'button'].includes(el));
    }
    if (allowScripts) {
      elementsToRemove = elementsToRemove.filter(el => el !== 'script');
    }
    
    elementsToRemove.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });
    
    // Remove dangerous attributes from all elements
    const allElements = document.querySelectorAll('*');
    allElements.forEach(el => {
      const attributes = [...el.attributes];
      attributes.forEach(attr => {
        // Remove event handlers
        if (DANGEROUS_HTML_ATTRIBUTES.some(dangerous => attr.name.toLowerCase().includes(dangerous.toLowerCase()))) {
          el.removeAttribute(attr.name);
        }
        
        // Handle href attributes
        if (attr.name === 'href') {
          if (attr.value.startsWith('javascript:') || attr.value.startsWith('vbscript:')) {
            el.removeAttribute(attr.name);
          } else if (!allowExternalLinks && (attr.value.startsWith('http://') || attr.value.startsWith('https://'))) {
            el.removeAttribute(attr.name);
          }
        }
        
        // Handle src attributes
        if (attr.name === 'src' && (attr.value.startsWith('javascript:') || attr.value.startsWith('data:text/html'))) {
          el.removeAttribute(attr.name);
        }
        
        // Handle style attributes
        if (attr.name === 'style') {
          const sanitizedStyle = sanitizeInlineCSS(attr.value);
          if (sanitizedStyle !== attr.value) {
            el.setAttribute(attr.name, sanitizedStyle);
          }
        }
      });
    });
    
    // Ensure proper HTML structure
    if (!document.querySelector('html')) {
      const htmlEl = document.createElement('html');
      htmlEl.setAttribute('lang', 'en');
      while (document.firstChild) {
        htmlEl.appendChild(document.firstChild);
      }
      document.appendChild(htmlEl);
    }
    
    if (!document.querySelector('head')) {
      const head = document.createElement('head');
      const html = document.querySelector('html');
      html.insertBefore(head, html.firstChild);
    }
    
    if (!document.querySelector('body')) {
      const body = document.createElement('body');
      const html = document.querySelector('html');
      const head = document.querySelector('head');
      
      // Move all non-head elements to body
      const elementsToMove = [...html.children].filter(child => child !== head);
      elementsToMove.forEach(el => body.appendChild(el));
      
      html.appendChild(body);
    }
    
    // Add essential meta tags
    const head = document.querySelector('head');
    if (!head.querySelector('meta[charset]')) {
      const charset = document.createElement('meta');
      charset.setAttribute('charset', 'UTF-8');
      head.insertBefore(charset, head.firstChild);
    }
    
    if (!head.querySelector('meta[name="viewport"]')) {
      const viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
      head.appendChild(viewport);
    }
    
    if (!head.querySelector('title')) {
      const title = document.createElement('title');
      title.textContent = 'Generated Landing Page';
      head.appendChild(title);
    }
    
    // Get sanitized HTML
    let sanitizedHTML = document.documentElement.outerHTML;
    
    // Add DOCTYPE back if it was present originally and preserveDoctype is true
    if (hasDoctype && preserveDoctype && !sanitizedHTML.toLowerCase().startsWith('<!doctype')) {
      sanitizedHTML = '<!DOCTYPE html>\n' + sanitizedHTML;
    }
    
    return sanitizedHTML;
    
  } catch (error) {
    console.error('HTML sanitization error:', error.message);
    // Return a safe fallback
    return generateSafeHTMLFallback(html);
  }
};

/**
 * Sanitize CSS content
 * @param {string} css - CSS content to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized CSS
 */
const sanitizeCSS = (css, options = {}) => {
  if (!css || typeof css !== 'string') {
    return '';
  }
  
  try {
    const { allowImports = false, allowExpressions = false } = options;
    
    let sanitizedCSS = css;
    
    // Remove dangerous patterns
    DANGEROUS_CSS_PATTERNS.forEach(pattern => {
      if (pattern.source.includes('@import') && allowImports) return;
      if (pattern.source.includes('expression') && allowExpressions) return;
      
      sanitizedCSS = sanitizedCSS.replace(pattern, '/* removed dangerous content */');
    });
    
    // Remove comments that might contain dangerous content
    sanitizedCSS = sanitizedCSS.replace(/\/\*[\s\S]*?\*\//g, (match) => {
      if (DANGEROUS_CSS_PATTERNS.some(pattern => pattern.test(match))) {
        return '/* sanitized comment */';
      }
      return match;
    });
    
    // Add basic responsive framework if missing
    if (!sanitizedCSS.includes('@media') && !sanitizedCSS.includes('responsive')) {
      sanitizedCSS += `\n\n/* Basic responsive framework */
@media (max-width: 768px) {
  body { font-size: 14px; padding: 10px; }
  .container { max-width: 100%; padding: 15px; }
  h1 { font-size: 24px; }
  h2 { font-size: 20px; }
  h3 { font-size: 18px; }
}

@media (max-width: 480px) {
  body { font-size: 12px; padding: 5px; }
  .container { padding: 10px; }
  h1 { font-size: 20px; }
  h2 { font-size: 18px; }
  h3 { font-size: 16px; }
}`;
    }
    
    return sanitizedCSS.trim();
    
  } catch (error) {
    console.error('CSS sanitization error:', error.message);
    return css; // Return original if sanitization fails
  }
};

/**
 * Sanitize JavaScript content
 * @param {string} js - JavaScript content to sanitize
 * @param {Object} options - Sanitization options
 * @returns {string} Sanitized JavaScript
 */
const sanitizeJavaScript = (js, options = {}) => {
  if (!js || typeof js !== 'string') {
    return '';
  }
  
  try {
    const { 
      allowEval = false, 
      allowDOM = false, 
      allowAjax = false,
      allowWindowAccess = false 
    } = options;
    
    let sanitizedJS = js;
    
    // Remove dangerous patterns
    DANGEROUS_JS_PATTERNS.forEach(pattern => {
      if (pattern.source.includes('eval') && allowEval) return;
      if (pattern.source.includes('innerHTML') && allowDOM) return;
      if (pattern.source.includes('XMLHttpRequest') && allowAjax) return;
      if (pattern.source.includes('window') && allowWindowAccess) return;
      
      sanitizedJS = sanitizedJS.replace(pattern, '/* removed dangerous content */');
    });
    
    // Replace dangerous functions with safe alternatives
    sanitizedJS = sanitizedJS
      .replace(/innerHTML\s*=/gi, 'textContent =')
      .replace(/outerHTML\s*=/gi, 'textContent =')
      .replace(/document\.write\s*\(/gi, 'console.log(')
      .replace(/document\.writeln\s*\(/gi, 'console.log(');
    
    // Remove or replace global object access
    if (!allowWindowAccess) {
      sanitizedJS = sanitizedJS
        .replace(/window\./gi, 'removed_window.')
        .replace(/global\./gi, 'removed_global.')
        .replace(/process\./gi, 'removed_process.');
    }
    
    // Wrap in safe execution context
    if (sanitizedJS.trim()) {
      sanitizedJS = `(function() {
  'use strict';
  
  // Safe execution context
  ${sanitizedJS}
  
})();`;
    }
    
    return sanitizedJS.trim();
    
  } catch (error) {
    console.error('JavaScript sanitization error:', error.message);
    return '/* JavaScript sanitization failed */';
  }
};

/**
 * Sanitize inline CSS (style attribute)
 * @param {string} inlineCSS - Inline CSS to sanitize
 * @returns {string} Sanitized inline CSS
 */
const sanitizeInlineCSS = (inlineCSS) => {
  if (!inlineCSS || typeof inlineCSS !== 'string') {
    return '';
  }
  
  let sanitized = inlineCSS;
  
  // Remove dangerous patterns from inline styles
  DANGEROUS_CSS_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '');
  });
  
  return sanitized.trim();
};

/**
 * Generate safe HTML fallback
 * @param {string} originalHTML - Original HTML that failed sanitization
 * @returns {string} Safe fallback HTML
 */
const generateSafeHTMLFallback = (originalHTML) => {
  const title = 'Generated Landing Page';
  const content = 'Content could not be safely processed.';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .error {
            color: #d32f2f;
            background: #ffebee;
            padding: 15px;
            border-radius: 4px;
            border-left: 4px solid #d32f2f;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>${title}</h1>
        <div class="error">
            <strong>Sanitization Notice:</strong> ${content}
        </div>
    </div>
</body>
</html>`;
};

/**
 * Validate sanitized content
 * @param {Object} sanitizedContent - Object with html, css, javascript
 * @returns {Object} Validation result
 */
const validateSanitizedContent = (sanitizedContent) => {
  try {
    const { html, css, javascript } = sanitizedContent;
    
    // Basic structure validation
    const dom = new JSDOM(html);
    const document = dom.window.document;
    
    const validation = {
      hasValidStructure: !!(document.querySelector('html') && document.querySelector('head') && document.querySelector('body')),
      hasTitle: !!document.querySelector('title'),
      hasViewport: !!document.querySelector('meta[name="viewport"]'),
      hasCharset: !!document.querySelector('meta[charset]'),
      hasContent: document.body ? document.body.textContent.trim().length > 0 : false,
      isResponsive: css.includes('@media') || css.includes('responsive'),
      estimatedSize: {
        html: html.length,
        css: css.length,
        javascript: javascript.length,
        total: html.length + css.length + javascript.length
      },
      securityScore: calculateSecurityScore(sanitizedContent)
    };
    
    return {
      success: true,
      validation,
      recommendations: generateSecurityRecommendations(validation)
    };
    
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Failed to validate sanitized content: ' + error.message
      }
    };
  }
};

/**
 * Calculate security score for sanitized content
 * @param {Object} content - Sanitized content
 * @returns {number} Security score (0-100)
 */
const calculateSecurityScore = (content) => {
  let score = 100;
  
  // Check for remaining dangerous patterns
  const allContent = content.html + content.css + content.javascript;
  
  DANGEROUS_JS_PATTERNS.forEach(pattern => {
    if (pattern.test(allContent)) {
      score -= 10;
    }
  });
  
  DANGEROUS_CSS_PATTERNS.forEach(pattern => {
    if (pattern.test(allContent)) {
      score -= 5;
    }
  });
  
  // Check for inline event handlers
  if (/on\w+\s*=/gi.test(content.html)) {
    score -= 15;
  }
  
  // Check for external resources
  if (/src\s*=\s*["']https?:\/\//gi.test(content.html)) {
    score -= 5;
  }
  
  return Math.max(0, score);
};

/**
 * Generate security recommendations
 * @param {Object} validation - Validation results
 * @returns {Array} Array of recommendations
 */
const generateSecurityRecommendations = (validation) => {
  const recommendations = [];
  
  if (!validation.hasValidStructure) {
    recommendations.push('Ensure proper HTML document structure with html, head, and body elements');
  }
  
  if (!validation.hasTitle) {
    recommendations.push('Add a descriptive title tag for better SEO and accessibility');
  }
  
  if (!validation.hasViewport) {
    recommendations.push('Add viewport meta tag for proper mobile responsiveness');
  }
  
  if (!validation.hasCharset) {
    recommendations.push('Add charset meta tag to prevent encoding issues');
  }
  
  if (!validation.isResponsive) {
    recommendations.push('Add responsive CSS media queries for better mobile experience');
  }
  
  if (validation.securityScore < 80) {
    recommendations.push('Review and remove any remaining potentially dangerous code patterns');
  }
  
  if (validation.estimatedSize.total > 100000) {
    recommendations.push('Consider optimizing code size for better performance');
  }
  
  return recommendations;
};

module.exports = {
  sanitizeHTML,
  sanitizeCSS,
  sanitizeJavaScript,
  sanitizeInlineCSS,
  validateSanitizedContent,
  generateSafeHTMLFallback,
  DANGEROUS_HTML_ELEMENTS,
  DANGEROUS_HTML_ATTRIBUTES,
  DANGEROUS_CSS_PATTERNS,
  DANGEROUS_JS_PATTERNS
};