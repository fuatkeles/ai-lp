// Application constants
export const APP_CONFIG = {
  NAME: 'AI Landing Page Generator',
  VERSION: '1.0.0',
  DESCRIPTION: 'AI-powered landing page generator with CRO analytics'
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    GOOGLE_LOGIN: '/api/auth/google-login',
    PROFILE: '/api/auth/profile',
    LOGOUT: '/api/auth/logout',
    VERIFY_TOKEN: '/api/auth/verify-token'
  },
  LANDING_PAGES: {
    GENERATE: '/api/landing-pages/generate',
    LIST: '/api/landing-pages/list',
    GET: '/api/landing-pages',
    UPDATE: '/api/landing-pages',
    DELETE: '/api/landing-pages',
    PREVIEW: '/api/landing-pages'
  },
  ANALYTICS: {
    TRACK: '/api/analytics/track',
    DASHBOARD: '/api/analytics/dashboard',
    CRO_SUGGESTIONS: '/api/analytics/cro-suggestions'
  },
  ADMIN: {
    USERS: '/api/admin/users',
    SYSTEM_STATS: '/api/admin/system-stats',
    API_USAGE: '/api/admin/api-usage'
  }
};

// Landing page statuses
export const PAGE_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived'
};

// User roles
export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin'
};

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise'
};

// Analytics event types
export const ANALYTICS_EVENTS = {
  VIEW: 'view',
  CONVERSION: 'conversion',
  BOUNCE: 'bounce',
  INTERACTION: 'interaction'
};

// AI service configuration
export const AI_CONFIG = {
  MODEL: 'kimi-k2',
  MAX_TOKENS: 4000,
  TEMPERATURE: 0.7,
  TIMEOUT: 30000,
  MAX_RETRIES: 3
};

// Theme configuration
export const THEME_CONFIG = {
  LIGHT: {
    primary: '#3b82f6',
    secondary: '#8b5cf6',
    accent: '#06b6d4',
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#1e293b'
  },
  DARK: {
    primary: '#60a5fa',
    secondary: '#a78bfa',
    accent: '#22d3ee',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#f1f5f9'
  }
};

// Responsive breakpoints
export const BREAKPOINTS = {
  MOBILE: 768,
  TABLET: 1024,
  DESKTOP: 1280
};
// Land
ing page templates and categories
export const PAGE_CATEGORIES = {
  BUSINESS: 'business',
  ECOMMERCE: 'ecommerce',
  PORTFOLIO: 'portfolio',
  BLOG: 'blog',
  EVENT: 'event',
  NONPROFIT: 'nonprofit',
  RESTAURANT: 'restaurant',
  REAL_ESTATE: 'real-estate',
  HEALTH: 'health',
  EDUCATION: 'education'
};

// Common color schemes for landing pages
export const COLOR_SCHEMES = {
  BLUE_GRADIENT: {
    primary: '#3b82f6',
    secondary: '#1e40af',
    accent: '#06b6d4',
    background: '#ffffff',
    text: '#1e293b'
  },
  PURPLE_GRADIENT: {
    primary: '#8b5cf6',
    secondary: '#7c3aed',
    accent: '#a78bfa',
    background: '#ffffff',
    text: '#1e293b'
  },
  GREEN_GRADIENT: {
    primary: '#10b981',
    secondary: '#059669',
    accent: '#34d399',
    background: '#ffffff',
    text: '#1e293b'
  },
  ORANGE_GRADIENT: {
    primary: '#f59e0b',
    secondary: '#d97706',
    accent: '#fbbf24',
    background: '#ffffff',
    text: '#1e293b'
  },
  DARK_THEME: {
    primary: '#60a5fa',
    secondary: '#3b82f6',
    accent: '#22d3ee',
    background: '#0f172a',
    text: '#f1f5f9'
  }
};

// AI prompt templates
export const PROMPT_TEMPLATES = {
  BUSINESS: 'Create a professional business landing page for {businessName} that {businessDescription}. Include a hero section, services, testimonials, and contact form.',
  ECOMMERCE: 'Design an e-commerce landing page for {productName} that {productDescription}. Include product showcase, features, pricing, and buy now section.',
  PORTFOLIO: 'Build a creative portfolio landing page for {name} who is a {profession}. Showcase work samples, skills, about section, and contact information.',
  EVENT: 'Create an event landing page for {eventName} happening on {eventDate}. Include event details, speakers, schedule, and registration form.',
  RESTAURANT: 'Design a restaurant landing page for {restaurantName} specializing in {cuisine}. Include menu highlights, location, hours, and reservation system.'
};

// Performance thresholds for CRO analysis
export const PERFORMANCE_THRESHOLDS = {
  CONVERSION_RATE: {
    EXCELLENT: 5.0,
    GOOD: 2.5,
    AVERAGE: 1.0,
    POOR: 0.5
  },
  BOUNCE_RATE: {
    EXCELLENT: 25,
    GOOD: 40,
    AVERAGE: 55,
    POOR: 70
  },
  TIME_ON_PAGE: {
    EXCELLENT: 120, // 2 minutes
    GOOD: 60,       // 1 minute
    AVERAGE: 30,    // 30 seconds
    POOR: 15        // 15 seconds
  }
};

// File size limits
export const FILE_LIMITS = {
  MAX_HTML_SIZE: 500 * 1024,      // 500KB
  MAX_CSS_SIZE: 100 * 1024,       // 100KB
  MAX_JS_SIZE: 50 * 1024,         // 50KB
  MAX_IMAGE_SIZE: 2 * 1024 * 1024 // 2MB
};

// Rate limiting
export const RATE_LIMITS = {
  AI_GENERATION: {
    FREE: 5,        // 5 generations per day
    PRO: 50,        // 50 generations per day
    ENTERPRISE: 500 // 500 generations per day
  },
  API_REQUESTS: {
    FREE: 100,      // 100 requests per hour
    PRO: 1000,      // 1000 requests per hour
    ENTERPRISE: 10000 // 10000 requests per hour
  }
};

// Error messages
export const ERROR_MESSAGES = {
  AUTH: {
    INVALID_TOKEN: 'Invalid authentication token',
    EXPIRED_TOKEN: 'Authentication token has expired',
    INSUFFICIENT_PERMISSIONS: 'Insufficient permissions for this action',
    LOGIN_REQUIRED: 'Please log in to continue'
  },
  AI: {
    GENERATION_FAILED: 'Failed to generate landing page. Please try again.',
    INVALID_PROMPT: 'Please provide a valid prompt for page generation',
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded. Please try again later.',
    SERVICE_UNAVAILABLE: 'AI service is temporarily unavailable'
  },
  VALIDATION: {
    REQUIRED_FIELD: 'This field is required',
    INVALID_EMAIL: 'Please enter a valid email address',
    INVALID_URL: 'Please enter a valid URL',
    FILE_TOO_LARGE: 'File size exceeds the maximum limit',
    INVALID_FILE_TYPE: 'Invalid file type'
  },
  GENERAL: {
    NETWORK_ERROR: 'Network error. Please check your connection.',
    SERVER_ERROR: 'Server error. Please try again later.',
    UNKNOWN_ERROR: 'An unexpected error occurred'
  }
};

// Success messages
export const SUCCESS_MESSAGES = {
  PAGE_GENERATED: 'Landing page generated successfully!',
  PAGE_SAVED: 'Landing page saved successfully!',
  PAGE_PUBLISHED: 'Landing page published successfully!',
  PAGE_DELETED: 'Landing page deleted successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!'
};

// Default page settings
export const DEFAULT_PAGE_SETTINGS = {
  responsive: true,
  seoOptimized: true,
  analyticsEnabled: true,
  darkModeSupport: false,
  animationsEnabled: true,
  compressionEnabled: true
};