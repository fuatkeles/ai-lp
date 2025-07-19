import {
  cn,
  formatDate,
  formatNumber,
  formatPercentage,
  truncateText,
  generateId,
  isValidEmail,
  isValidUrl,
  validatePrompt,
  generatePageSlug,
  calculateConversionRate,
  sanitizeHtml
} from '../utils';

describe('Utility Functions', () => {
  test('cn combines classes correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
    expect(cn('class1', null, 'class2')).toBe('class1 class2');
  });

  test('formatDate formats dates correctly', () => {
    const date = new Date('2024-01-15');
    const formatted = formatDate(date);
    expect(formatted).toContain('2024');
  });

  test('formatNumber formats numbers correctly', () => {
    expect(formatNumber(1234)).toBe('1.234');
    expect(formatNumber(1234567)).toBe('1.234.567');
  });

  test('formatPercentage formats percentages correctly', () => {
    expect(formatPercentage(0.1234)).toBe('12.3%');
    expect(formatPercentage(0.5)).toBe('50.0%');
  });

  test('truncateText truncates text correctly', () => {
    const longText = 'This is a very long text that should be truncated';
    expect(truncateText(longText, 20)).toBe('This is a very long...');
  });

  test('generateId generates unique IDs', () => {
    const id1 = generateId();
    const id2 = generateId();
    expect(id1).not.toBe(id2);
    expect(id1).toHaveLength(8);
  });

  test('isValidEmail validates emails correctly', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('invalid-email')).toBe(false);
    expect(isValidEmail('test@')).toBe(false);
  });

  test('isValidUrl validates URLs correctly', () => {
    expect(isValidUrl('https://example.com')).toBe(true);
    expect(isValidUrl('http://example.com')).toBe(true);
    expect(isValidUrl('invalid-url')).toBe(false);
  });

  test('validatePrompt validates prompts correctly', () => {
    expect(validatePrompt('Valid prompt text')).toEqual({ isValid: true });
    expect(validatePrompt('Short')).toEqual({ 
      isValid: false, 
      error: 'Prompt must be at least 10 characters long' 
    });
    expect(validatePrompt('')).toEqual({ 
      isValid: false, 
      error: 'Prompt is required' 
    });
  });

  test('generatePageSlug generates valid slugs', () => {
    const slug = generatePageSlug('My Awesome Page', 'user123');
    expect(slug).toMatch(/^my-awesome-page-user123-[a-z0-9]+$/);
  });

  test('calculateConversionRate calculates correctly', () => {
    expect(calculateConversionRate(10, 100)).toBe(10);
    expect(calculateConversionRate(0, 100)).toBe(0);
    expect(calculateConversionRate(5, 0)).toBe(0);
  });

  test('sanitizeHtml removes dangerous content', () => {
    const dangerousHtml = '<script>alert("xss")</script><p>Safe content</p>';
    const sanitized = sanitizeHtml(dangerousHtml);
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('<p>Safe content</p>');
  });
});