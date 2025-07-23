// Input validation and sanitization utilities

const validateInput = (input, type = 'string', options = {}) => {
  const { required = true, minLength = 0, maxLength = Infinity } = options;
  
  // Check if required
  if (required && (!input || input.toString().trim().length === 0)) {
    return {
      isValid: false,
      error: 'This field is required'
    };
  }
  
  // If not required and empty, it's valid
  if (!required && (!input || input.toString().trim().length === 0)) {
    return { isValid: true };
  }
  
  const inputStr = input.toString().trim();
  
  // Check length constraints
  if (inputStr.length < minLength) {
    return {
      isValid: false,
      error: `Minimum length is ${minLength} characters`
    };
  }
  
  if (inputStr.length > maxLength) {
    return {
      isValid: false,
      error: `Maximum length is ${maxLength} characters`
    };
  }
  
  // Type-specific validation
  switch (type) {
    case 'email':
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(inputStr)) {
        return {
          isValid: false,
          error: 'Please enter a valid email address'
        };
      }
      break;
      
    case 'url':
      try {
        new URL(inputStr);
      } catch {
        return {
          isValid: false,
          error: 'Please enter a valid URL'
        };
      }
      break;
      
    case 'prompt':
      // Special validation for AI prompts
      if (inputStr.length < 10) {
        return {
          isValid: false,
          error: 'Prompt must be at least 10 characters long'
        };
      }
      if (inputStr.length > 8000) {
        return {
          isValid: false,
          error: 'Prompt is too long (maximum 8000 characters)'
        };
      }
      break;
  }
  
  return { isValid: true };
};

const sanitizeInput = (input) => {
  if (!input) return '';
  
  let sanitized = input.toString().trim();
  
  // Remove potentially dangerous characters but preserve HTML codes that might be intentional
  // We'll be more permissive since users might include HTML codes intentionally
  sanitized = sanitized
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .replace(/\s+/g, ' '); // Normalize whitespace
  
  return sanitized;
};

const validateLandingPageData = (data) => {
  const errors = {};
  
  // Validate title
  const titleValidation = validateInput(data.title, 'string', {
    required: true,
    minLength: 3,
    maxLength: 200
  });
  if (!titleValidation.isValid) {
    errors.title = titleValidation.error;
  }
  
  // Validate prompt
  const promptValidation = validateInput(data.prompt, 'prompt', {
    required: true
  });
  if (!promptValidation.isValid) {
    errors.prompt = promptValidation.error;
  }
  
  // Validate optional fields
  if (data.businessType) {
    const businessTypeValidation = validateInput(data.businessType, 'string', {
      required: false,
      maxLength: 100
    });
    if (!businessTypeValidation.isValid) {
      errors.businessType = businessTypeValidation.error;
    }
  }
  
  if (data.targetAudience) {
    const targetAudienceValidation = validateInput(data.targetAudience, 'string', {
      required: false,
      maxLength: 200
    });
    if (!targetAudienceValidation.isValid) {
      errors.targetAudience = targetAudienceValidation.error;
    }
  }
  
  if (data.callToAction) {
    const ctaValidation = validateInput(data.callToAction, 'string', {
      required: false,
      maxLength: 50
    });
    if (!ctaValidation.isValid) {
      errors.callToAction = ctaValidation.error;
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateGeneratedCode = (code) => {
  const errors = {};
  
  // Validate HTML
  if (!code.html || code.html.trim().length === 0) {
    errors.html = 'Generated HTML is empty';
  } else {
    // Basic HTML structure validation
    if (!code.html.includes('<!DOCTYPE') && !code.html.includes('<html')) {
      errors.html = 'Generated HTML is missing DOCTYPE or html tag';
    }
    if (!code.html.includes('<head>') || !code.html.includes('</head>')) {
      errors.html = 'Generated HTML is missing head section';
    }
    if (!code.html.includes('<body>') || !code.html.includes('</body>')) {
      errors.html = 'Generated HTML is missing body section';
    }
  }
  
  // CSS is optional but if present, should be valid
  if (code.css && code.css.trim().length > 0) {
    // Basic CSS validation - check for balanced braces
    const openBraces = (code.css.match(/\{/g) || []).length;
    const closeBraces = (code.css.match(/\}/g) || []).length;
    if (openBraces !== closeBraces) {
      errors.css = 'Generated CSS has unbalanced braces';
    }
  }
  
  // JavaScript is optional
  if (code.javascript && code.javascript.trim().length > 0) {
    // Basic JS validation - check for common syntax issues
    try {
      // This is a very basic check - in production you might want more sophisticated validation
      if (code.javascript.includes('eval(') || code.javascript.includes('Function(')) {
        errors.javascript = 'Generated JavaScript contains potentially unsafe code';
      }
    } catch (error) {
      errors.javascript = 'Generated JavaScript may have syntax issues';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

module.exports = {
  validateInput,
  sanitizeInput,
  validateLandingPageData,
  validateGeneratedCode
};