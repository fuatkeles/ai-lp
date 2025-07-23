const {
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
} = require('../utils/codeSanitizer');

describe('Code Sanitizer', () => {
  describe('sanitizeHTML', () => {
    test('should remove dangerous script tags', () => {
      const dangerousHTML = `
        <html>
          <head><title>Test</title></head>
          <body>
            <h1>Hello World</h1>
            <script>alert('xss');</script>
            <p>Safe content</p>
          </body>
        </html>
      `;
      
      const result = sanitizeHTML(dangerousHTML);
      
      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert(');
      expect(result).toContain('<h1>Hello World</h1>');
      expect(result).toContain('<p>Safe content</p>');
    });

    test('should remove dangerous event handlers', () => {
      const dangerousHTML = `
        <html>
          <body>
            <button onclick="alert('xss')">Click me</button>
            <div onmouseover="maliciousCode()">Hover me</div>
            <input onkeydown="stealData()">
          </body>
        </html>
      `;
      
      const result = sanitizeHTML(dangerousHTML);
      
      expect(result).not.toContain('onclick');
      expect(result).not.toContain('onmouseover');
      expect(result).not.toContain('onkeydown');
      expect(result).toContain('Click me');
      expect(result).toContain('Hover me');
    });

    test('should remove dangerous iframe and object tags', () => {
      const dangerousHTML = `
        <html>
          <body>
            <iframe src="http://malicious.com"></iframe>
            <object data="malicious.swf"></object>
            <embed src="malicious.swf">
            <p>Safe content</p>
          </body>
        </html>
      `;
      
      const result = sanitizeHTML(dangerousHTML);
      
      expect(result).not.toContain('<iframe');
      expect(result).not.toContain('<object');
      expect(result).not.toContain('<embed');
      expect(result).toContain('<p>Safe content</p>');
    });

    test('should sanitize javascript: URLs in href attributes', () => {
      const dangerousHTML = `
        <html>
          <body>
            <a href="javascript:alert('xss')">Malicious link</a>
            <a href="https://safe.com">Safe link</a>
          </body>
        </html>
      `;
      
      const result = sanitizeHTML(dangerousHTML);
      
      expect(result).not.toContain('javascript:');
      expect(result).toContain('Safe link');
      // Note: External links might be removed by default sanitization
    });

    test('should add essential meta tags if missing', () => {
      const basicHTML = '<html><head></head><body><h1>Test</h1></body></html>';
      
      const result = sanitizeHTML(basicHTML);
      
      expect(result).toContain('<meta charset="UTF-8">');
      expect(result).toContain('<meta name="viewport"');
      expect(result).toContain('<title>');
    });

    test('should preserve DOCTYPE if present', () => {
      const htmlWithDoctype = '<!DOCTYPE html><html><head></head><body><h1>Test</h1></body></html>';
      
      const result = sanitizeHTML(htmlWithDoctype);
      
      expect(result).toMatch(/^<!DOCTYPE html>/i);
    });

    test('should handle malformed HTML gracefully', () => {
      const malformedHTML = '<div><p>Unclosed tags<span>More content';
      
      const result = sanitizeHTML(malformedHTML);
      
      expect(result).toContain('<html');
      expect(result).toContain('<head');
      expect(result).toContain('<body');
      expect(result).toContain('More content');
    });

    test('should return safe fallback for severely broken HTML', () => {
      // This test is more about the fallback mechanism
      const result = generateSafeHTMLFallback('<invalid>html</invalid>');
      
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('Content could not be safely processed');
    });
  });

  describe('sanitizeCSS', () => {
    test('should remove dangerous CSS expressions', () => {
      const dangerousCSS = `
        body {
          background: expression(alert('xss'));
          color: blue;
        }
        .safe {
          font-size: 16px;
        }
      `;
      
      const result = sanitizeCSS(dangerousCSS);
      
      expect(result).not.toContain('expression(');
      expect(result).toContain('color: blue');
      expect(result).toContain('font-size: 16px');
    });

    test('should remove javascript: URLs in CSS', () => {
      const dangerousCSS = `
        .malicious {
          background-image: url('javascript:alert("xss")');
        }
        .safe {
          background-image: url('image.jpg');
        }
      `;
      
      const result = sanitizeCSS(dangerousCSS);
      
      expect(result).not.toContain('javascript:');
      expect(result).toContain('background-image: url(\'image.jpg\')');
    });

    test('should remove @import statements', () => {
      const dangerousCSS = `
        @import url('http://malicious.com/styles.css');
        body {
          font-family: Arial;
        }
      `;
      
      const result = sanitizeCSS(dangerousCSS);
      
      expect(result).not.toContain('@import');
      expect(result).toContain('font-family: Arial');
    });

    test('should remove IE behaviors', () => {
      const dangerousCSS = `
        .element {
          behavior: url(malicious.htc);
          -moz-binding: url(malicious.xml);
          color: red;
        }
      `;
      
      const result = sanitizeCSS(dangerousCSS);
      
      expect(result).not.toContain('behavior:');
      expect(result).not.toContain('-moz-binding:');
      expect(result).toContain('color: red');
    });

    test('should add responsive framework if missing', () => {
      const basicCSS = 'body { color: black; }';
      
      const result = sanitizeCSS(basicCSS);
      
      expect(result).toContain('@media (max-width: 768px)');
      expect(result).toContain('@media (max-width: 480px)');
      expect(result).toContain('color: black');
    });

    test('should not add responsive framework if already present', () => {
      const responsiveCSS = `
        body { color: black; }
        @media (max-width: 600px) {
          body { font-size: 14px; }
        }
      `;
      
      const result = sanitizeCSS(responsiveCSS);
      
      // Should not add duplicate responsive framework
      const mediaQueries = (result.match(/@media/g) || []).length;
      expect(mediaQueries).toBe(1);
    });
  });

  describe('sanitizeJavaScript', () => {
    test('should remove eval function calls', () => {
      const dangerousJS = `
        const safe = 'hello';
        eval('alert("xss")');
        console.log(safe);
      `;
      
      const result = sanitizeJavaScript(dangerousJS);
      
      expect(result).not.toContain('eval(');
      expect(result).toContain('console.log(safe)');
    });

    test('should remove Function constructor', () => {
      const dangerousJS = `
        const safe = 'hello';
        const malicious = new Function('alert("xss")');
        console.log(safe);
      `;
      
      const result = sanitizeJavaScript(dangerousJS);
      
      expect(result).not.toContain('Function(');
      expect(result).toContain('console.log(safe)');
    });

    test('should remove setTimeout/setInterval with strings', () => {
      const dangerousJS = `
        setTimeout('alert("xss")', 1000);
        setInterval('maliciousCode()', 5000);
        setTimeout(function() { console.log('safe'); }, 1000);
      `;
      
      const result = sanitizeJavaScript(dangerousJS);
      
      expect(result).not.toContain('setTimeout(\'alert');
      expect(result).not.toContain('setInterval(\'maliciousCode');
      // The function-based setTimeout might also be affected by sanitization
      expect(result).toContain('console.log(\'safe\')');
    });

    test('should replace innerHTML with textContent', () => {
      const dangerousJS = `
        element.innerHTML = '<script>alert("xss")</script>';
        element.textContent = 'safe content';
      `;
      
      const result = sanitizeJavaScript(dangerousJS);
      
      expect(result).not.toContain('innerHTML =');
      expect(result).toContain('textContent =');
      expect(result).toContain('textContent = \'safe content\'');
    });

    test('should remove document.write calls', () => {
      const dangerousJS = `
        document.write('<script>alert("xss")</script>');
        console.log('safe');
      `;
      
      const result = sanitizeJavaScript(dangerousJS);
      
      expect(result).not.toContain('document.write');
      expect(result).toContain('console.log(');
    });

    test('should remove window object access', () => {
      const dangerousJS = `
        window.location = 'http://malicious.com';
        const safe = 'hello';
      `;
      
      const result = sanitizeJavaScript(dangerousJS);
      
      expect(result).not.toContain('window.');
      expect(result).toContain('const safe = \'hello\'');
    });

    test('should wrap code in safe execution context', () => {
      const js = 'console.log("test");';
      
      const result = sanitizeJavaScript(js);
      
      expect(result).toContain('(function() {');
      expect(result).toContain('\'use strict\';');
      expect(result).toContain('})();');
      expect(result).toContain('console.log("test");');
    });

    test('should return empty string for empty input', () => {
      expect(sanitizeJavaScript('')).toBe('');
      expect(sanitizeJavaScript(null)).toBe('');
      expect(sanitizeJavaScript(undefined)).toBe('');
    });
  });

  describe('sanitizeInlineCSS', () => {
    test('should remove dangerous patterns from inline styles', () => {
      const dangerousInlineCSS = 'background: expression(alert("xss")); color: red; behavior: url(malicious.htc);';
      
      const result = sanitizeInlineCSS(dangerousInlineCSS);
      
      expect(result).not.toContain('expression(');
      expect(result).not.toContain('behavior:');
      expect(result).toContain('color: red');
    });

    test('should handle empty or invalid input', () => {
      expect(sanitizeInlineCSS('')).toBe('');
      expect(sanitizeInlineCSS(null)).toBe('');
      expect(sanitizeInlineCSS(undefined)).toBe('');
    });
  });

  describe('validateSanitizedContent', () => {
    test('should validate properly structured content', () => {
      const content = {
        html: '<!DOCTYPE html><html><head><title>Test</title><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head><body><h1>Hello</h1></body></html>',
        css: 'body { font-family: Arial; } @media (max-width: 768px) { body { font-size: 14px; } }',
        javascript: 'console.log("safe");'
      };
      
      const result = validateSanitizedContent(content);
      
      expect(result.success).toBe(true);
      expect(result.validation.hasValidStructure).toBe(true);
      expect(result.validation.hasTitle).toBe(true);
      expect(result.validation.hasViewport).toBe(true);
      expect(result.validation.hasCharset).toBe(true);
      expect(result.validation.hasContent).toBe(true);
      expect(result.validation.isResponsive).toBe(true);
      expect(result.validation.securityScore).toBeGreaterThan(80);
    });

    test('should identify missing essential elements', () => {
      const content = {
        html: '<html><body><p>Content</p></body></html>',
        css: 'body { color: black; }',
        javascript: ''
      };
      
      const result = validateSanitizedContent(content);
      
      expect(result.success).toBe(true);
      expect(result.validation.hasTitle).toBe(false);
      expect(result.validation.hasViewport).toBe(false);
      expect(result.validation.hasCharset).toBe(false);
      expect(result.validation.isResponsive).toBe(false);
      expect(result.recommendations).toContain('Add a descriptive title tag for better SEO and accessibility');
      expect(result.recommendations).toContain('Add viewport meta tag for proper mobile responsiveness');
    });

    test('should calculate security score correctly', () => {
      const dangerousContent = {
        html: '<html><body onload="alert()"><p>Content</p></body></html>',
        css: 'body { expression(alert()); }',
        javascript: 'eval("malicious");'
      };
      
      const result = validateSanitizedContent(dangerousContent);
      
      expect(result.success).toBe(true);
      expect(result.validation.securityScore).toBeLessThan(80);
      expect(result.recommendations).toContain('Review and remove any remaining potentially dangerous code patterns');
    });
  });

  describe('generateSafeHTMLFallback', () => {
    test('should generate safe fallback HTML', () => {
      const result = generateSafeHTMLFallback('broken html');
      
      expect(result).toContain('<!DOCTYPE html>');
      expect(result).toContain('<html lang="en">');
      expect(result).toContain('<meta charset="UTF-8">');
      expect(result).toContain('<meta name="viewport"');
      expect(result).toContain('Generated Landing Page');
      expect(result).toContain('Content could not be safely processed');
    });
  });

  describe('Constants', () => {
    test('should have dangerous HTML elements defined', () => {
      expect(DANGEROUS_HTML_ELEMENTS).toContain('script');
      expect(DANGEROUS_HTML_ELEMENTS).toContain('iframe');
      expect(DANGEROUS_HTML_ELEMENTS).toContain('object');
      expect(DANGEROUS_HTML_ELEMENTS).toContain('embed');
    });

    test('should have dangerous HTML attributes defined', () => {
      expect(DANGEROUS_HTML_ATTRIBUTES).toContain('onclick');
      expect(DANGEROUS_HTML_ATTRIBUTES).toContain('onload');
      expect(DANGEROUS_HTML_ATTRIBUTES).toContain('onerror');
    });

    test('should have dangerous CSS patterns defined', () => {
      expect(DANGEROUS_CSS_PATTERNS.length).toBeGreaterThan(0);
      expect(DANGEROUS_CSS_PATTERNS.some(pattern => pattern.source.includes('expression'))).toBe(true);
      expect(DANGEROUS_CSS_PATTERNS.some(pattern => pattern.source.includes('javascript'))).toBe(true);
    });

    test('should have dangerous JS patterns defined', () => {
      expect(DANGEROUS_JS_PATTERNS.length).toBeGreaterThan(0);
      expect(DANGEROUS_JS_PATTERNS.some(pattern => pattern.source.includes('eval'))).toBe(true);
      expect(DANGEROUS_JS_PATTERNS.some(pattern => pattern.source.includes('Function'))).toBe(true);
    });
  });
});