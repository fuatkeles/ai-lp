// Utility functions for the AI Landing Page Generator

/**
 * Combines class names using clsx and tailwind-merge
 */
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Formats a date to a readable string
 */
export function formatDate(date, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  };
  
  return new Date(date).toLocaleDateString('tr-TR', defaultOptions);
}

/**
 * Formats a number to a readable string with commas
 */
export function formatNumber(number) {
  return new Intl.NumberFormat('tr-TR').format(number);
}

/**
 * Formats a percentage value
 */
export function formatPercentage(value, decimals = 1) {
  return `${(value * 100).toFixed(decimals)}%`;
}

/**
 * Truncates text to a specified length
 */
export function truncateText(text, maxLength = 100) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Generates a random ID
 */
export function generateId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Validates email format
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates URL format
 */
export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Deep clone an object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if object is empty
 */
export function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

/**
 * Capitalize first letter of a string
 */
export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Convert string to kebab-case
 */
export function toKebabCase(str) {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Convert string to camelCase
 */
export function toCamelCase(str) {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => {
      return index === 0 ? word.toLowerCase() : word.toUpperCase();
    })
    .replace(/\s+/g, '');
}
/**

 * AI and Landing Page specific utilities
 */

/**
 * Sanitizes HTML content to prevent XSS attacks
 */
export function sanitizeHtml(html) {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

/**
 * Validates landing page prompt
 */
export function validatePrompt(prompt) {
  if (!prompt || typeof prompt !== 'string') {
    return { isValid: false, error: 'Prompt is required' };
  }
  
  if (prompt.trim().length < 10) {
    return { isValid: false, error: 'Prompt must be at least 10 characters long' };
  }
  
  if (prompt.length > 2000) {
    return { isValid: false, error: 'Prompt must be less than 2000 characters' };
  }
  
  return { isValid: true };
}

/**
 * Generates a unique landing page URL slug
 */
export function generatePageSlug(title, userId) {
  const baseSlug = toKebabCase(title.substring(0, 50));
  const userPrefix = userId.substring(0, 8);
  const timestamp = Date.now().toString(36);
  return `${baseSlug}-${userPrefix}-${timestamp}`;
}

/**
 * Calculates conversion rate
 */
export function calculateConversionRate(conversions, views) {
  if (views === 0) return 0;
  return (conversions / views) * 100;
}

/**
 * Calculates bounce rate
 */
export function calculateBounceRate(bounces, views) {
  if (views === 0) return 0;
  return (bounces / views) * 100;
}

/**
 * Formats analytics metrics
 */
export function formatMetric(value, type = 'number') {
  switch (type) {
    case 'percentage':
      return `${value.toFixed(1)}%`;
    case 'duration':
      return formatDuration(value);
    case 'currency':
      return new Intl.NumberFormat('tr-TR', {
        style: 'currency',
        currency: 'TRY'
      }).format(value);
    default:
      return formatNumber(value);
  }
}

/**
 * Formats duration in seconds to readable format
 */
export function formatDuration(seconds) {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

/**
 * Extracts colors from CSS content
 */
export function extractColorsFromCSS(css) {
  const colorRegex = /#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)/g;
  const matches = css.match(colorRegex);
  return matches ? [...new Set(matches)] : [];
}

/**
 * Generates responsive breakpoint classes
 */
export function generateResponsiveClasses(baseClass, breakpoints = {}) {
  const { mobile, tablet, desktop } = breakpoints;
  let classes = baseClass;
  
  if (mobile) classes += ` sm:${mobile}`;
  if (tablet) classes += ` md:${tablet}`;
  if (desktop) classes += ` lg:${desktop}`;
  
  return classes;
}

/**
 * Validates generated HTML structure
 */
export function validateHtmlStructure(html) {
  const errors = [];
  
  // Check for basic HTML structure
  if (!html.includes('<html')) errors.push('Missing <html> tag');
  if (!html.includes('<head')) errors.push('Missing <head> tag');
  if (!html.includes('<body')) errors.push('Missing <body> tag');
  
  // Check for responsive meta tag
  if (!html.includes('viewport')) {
    errors.push('Missing viewport meta tag for responsive design');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Extracts meta information from generated HTML
 */
export function extractMetaInfo(html) {
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const descriptionMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  
  return {
    title: titleMatch ? titleMatch[1] : 'Untitled Page',
    description: descriptionMatch ? descriptionMatch[1] : '',
  };
}

/**
 * Generates SEO-friendly meta tags
 */
export function generateMetaTags(title, description, url, imageUrl) {
  return `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:url" content="${url}" />
    ${imageUrl ? `<meta property="og:image" content="${imageUrl}" />` : ''}
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    ${imageUrl ? `<meta name="twitter:image" content="${imageUrl}" />` : ''}
  `.trim();
}