import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import LandingPageGenerator from '../LandingPageGenerator';
import { useAuth } from '../../hooks/useAuth';

// Mock the useAuth hook
jest.mock('../../hooks/useAuth');

// Mock fetch
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

describe('LandingPageGenerator', () => {
  const mockUser = {
    uid: 'test-user-id',
    displayName: 'Test User',
    email: 'test@example.com'
  };

  beforeEach(() => {
    useAuth.mockReturnValue({
      user: mockUser
    });
    
    localStorageMock.getItem.mockReturnValue('mock-auth-token');
    fetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('renders the landing page generator form', () => {
    render(<LandingPageGenerator />);
    
    expect(screen.getByText('AI Landing Page Generator')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Revolutionary SaaS Product Launch/)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Describe what your landing page should be about/)).toBeInTheDocument();
    expect(screen.getByText('Generate Landing Page')).toBeInTheDocument();
  });

  test('shows validation error when form is submitted without required fields', async () => {
    render(<LandingPageGenerator />);
    
    const generateButton = screen.getByText('Generate Landing Page');
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please provide a description for your landing page')).toBeInTheDocument();
    });
  });

  test('shows validation error when title is missing', async () => {
    render(<LandingPageGenerator />);
    
    const promptTextarea = screen.getByPlaceholderText(/Describe what your landing page should be about/);
    fireEvent.change(promptTextarea, { target: { value: 'Test prompt' } });
    
    const generateButton = screen.getByText('Generate Landing Page');
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please provide a title for your landing page')).toBeInTheDocument();
    });
  });

  test('submits form with valid data', async () => {
    const mockResponse = {
      success: true,
      data: {
        id: 'test-page-id',
        title: 'Test Page',
        status: 'draft',
        generatedCode: {
          html: '<html></html>',
          css: 'body {}',
          javascript: 'console.log("test");'
        },
        aiMetadata: {
          model: 'mock-development',
          processingTime: 1500,
          tokens: { total_tokens: 600 }
        },
        createdAt: new Date().toISOString()
      }
    };

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse
    });

    render(<LandingPageGenerator />);
    
    const titleInput = screen.getByPlaceholderText(/Revolutionary SaaS Product Launch/);
    const promptTextarea = screen.getByPlaceholderText(/Describe what your landing page should be about/);
    
    fireEvent.change(titleInput, { target: { value: 'Test Page' } });
    fireEvent.change(promptTextarea, { target: { value: 'Test prompt for landing page' } });
    
    const generateButton = screen.getByText('Generate Landing Page');
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/landing-pages/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-auth-token'
        },
        body: JSON.stringify({
          prompt: 'Test prompt for landing page',
          title: 'Test Page',
          businessType: '',
          targetAudience: '',
          callToAction: ''
        })
      });
    });

    await waitFor(() => {
      expect(screen.getByText('Page Generated Successfully!')).toBeInTheDocument();
      expect(screen.getByText('Test Page')).toBeInTheDocument();
    });
  });

  test('handles API error gracefully', async () => {
    const mockErrorResponse = {
      success: false,
      error: {
        message: 'API Error occurred'
      }
    };

    fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => mockErrorResponse
    });

    render(<LandingPageGenerator />);
    
    const titleInput = screen.getByPlaceholderText(/Revolutionary SaaS Product Launch/);
    const promptTextarea = screen.getByPlaceholderText(/Describe what your landing page should be about/);
    
    fireEvent.change(titleInput, { target: { value: 'Test Page' } });
    fireEvent.change(promptTextarea, { target: { value: 'Test prompt' } });
    
    const generateButton = screen.getByText('Generate Landing Page');
    fireEvent.click(generateButton);
    
    await waitFor(() => {
      expect(screen.getByText('API Error occurred')).toBeInTheDocument();
    });
  });

  test('shows loading state during generation', async () => {
    // Mock a delayed response
    fetch.mockImplementationOnce(() => 
      new Promise(resolve => 
        setTimeout(() => resolve({
          ok: true,
          json: async () => ({
            success: true,
            data: {
              id: 'test-id',
              title: 'Test',
              status: 'draft',
              generatedCode: { html: '', css: '', javascript: '' },
              aiMetadata: { model: 'test', processingTime: 1000, tokens: { total_tokens: 100 } },
              createdAt: new Date().toISOString()
            }
          })
        }), 100)
      )
    );

    render(<LandingPageGenerator />);
    
    const titleInput = screen.getByPlaceholderText(/Revolutionary SaaS Product Launch/);
    const promptTextarea = screen.getByPlaceholderText(/Describe what your landing page should be about/);
    
    fireEvent.change(titleInput, { target: { value: 'Test Page' } });
    fireEvent.change(promptTextarea, { target: { value: 'Test prompt' } });
    
    const generateButton = screen.getByText('Generate Landing Page');
    fireEvent.click(generateButton);
    
    // Check loading state
    expect(screen.getByText('Generating...')).toBeInTheDocument();
    expect(screen.getByText('Initializing...')).toBeInTheDocument();
    
    // Wait for completion
    await waitFor(() => {
      expect(screen.getByText('Page Generated Successfully!')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});