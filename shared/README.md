# AI Landing Page Generator - Shared Components

This package contains shared components, utilities, and constants used across the AI Landing Page Generator application.

## Components

### Theme System

#### ThemeProvider
Provides theme context to the entire application with support for light, dark, and system themes.

```jsx
import { ThemeProvider } from 'ai-landing-page-generator-shared';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="ai-landing-page-theme">
      {/* Your app content */}
    </ThemeProvider>
  );
}
```

#### ThemeToggle
A dropdown component for switching between light, dark, and system themes.

```jsx
import { ThemeToggle } from 'ai-landing-page-generator-shared';

function Header() {
  return (
    <header>
      <ThemeToggle />
    </header>
  );
}
```

### UI Components

All UI components are built with shadcn/ui and Tailwind CSS:

- **Button**: Customizable button with multiple variants
- **Card**: Container component with header, content, and footer
- **Input**: Form input component
- **Textarea**: Multi-line text input
- **Badge**: Status and label component
- **LoadingSpinner**: Animated loading indicator
- **DropdownMenu**: Accessible dropdown menu component

```jsx
import { 
  Button, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  Badge,
  LoadingSpinner 
} from 'ai-landing-page-generator-shared';

function Example() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Example Card</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="default">Click me</Button>
        <Badge variant="secondary">Status</Badge>
        <LoadingSpinner size="lg" />
      </CardContent>
    </Card>
  );
}
```

## Utilities

### Core Utilities

- `cn()`: Combines class names using clsx and tailwind-merge
- `formatDate()`: Formats dates for Turkish locale
- `formatNumber()`: Formats numbers with Turkish formatting
- `formatPercentage()`: Formats percentage values
- `truncateText()`: Truncates text with ellipsis
- `generateId()`: Generates random IDs
- `isValidEmail()`: Email validation
- `isValidUrl()`: URL validation
- `debounce()`: Debounce function calls

### AI & Landing Page Utilities

- `sanitizeHtml()`: Sanitizes HTML content for security
- `validatePrompt()`: Validates AI prompts
- `generatePageSlug()`: Creates URL-friendly page slugs
- `calculateConversionRate()`: Calculates conversion rates
- `calculateBounceRate()`: Calculates bounce rates
- `formatMetric()`: Formats analytics metrics
- `extractColorsFromCSS()`: Extracts colors from CSS
- `validateHtmlStructure()`: Validates generated HTML
- `generateMetaTags()`: Generates SEO meta tags

```javascript
import { 
  cn, 
  validatePrompt, 
  generatePageSlug, 
  sanitizeHtml 
} from 'ai-landing-page-generator-shared';

// Combine classes
const buttonClass = cn('btn', 'btn-primary', isActive && 'active');

// Validate prompt
const { isValid, error } = validatePrompt(userPrompt);

// Generate page slug
const slug = generatePageSlug('My Awesome Page', userId);

// Sanitize HTML
const safeHtml = sanitizeHtml(generatedHtml);
```

## Constants

### Application Configuration

- `APP_CONFIG`: Application metadata
- `API_ENDPOINTS`: API endpoint constants
- `PAGE_STATUS`: Landing page status values
- `USER_ROLES`: User role constants
- `THEME_CONFIG`: Theme color configurations

### AI & Analytics

- `AI_CONFIG`: AI service configuration
- `ANALYTICS_EVENTS`: Analytics event types
- `PERFORMANCE_THRESHOLDS`: CRO performance thresholds
- `PROMPT_TEMPLATES`: Pre-built prompt templates
- `COLOR_SCHEMES`: Landing page color schemes

```javascript
import { 
  API_ENDPOINTS, 
  PAGE_STATUS, 
  PROMPT_TEMPLATES,
  ERROR_MESSAGES 
} from 'ai-landing-page-generator-shared';

// Use API endpoints
const response = await fetch(API_ENDPOINTS.LANDING_PAGES.GENERATE);

// Check page status
if (page.status === PAGE_STATUS.PUBLISHED) {
  // Handle published page
}

// Use prompt template
const prompt = PROMPT_TEMPLATES.BUSINESS
  .replace('{businessName}', 'Acme Corp')
  .replace('{businessDescription}', 'innovative solutions');
```

## Hooks

### useLocalStorage
Custom hook for managing localStorage with React state.

```javascript
import { useLocalStorage } from 'ai-landing-page-generator-shared';

function MyComponent() {
  const [settings, setSettings] = useLocalStorage('app-settings', {});
  
  return (
    <button onClick={() => setSettings({ theme: 'dark' })}>
      Set Dark Theme
    </button>
  );
}
```

## Styling

The package includes a Tailwind CSS configuration with:

- Custom color variables for theming
- Gradient utilities
- Animation classes
- Responsive breakpoints

Import the global styles in your application:

```css
@import 'ai-landing-page-generator-shared/styles/globals.css';
```

## Development

### Running Tests

```bash
npm test
```

### Building

```bash
npm run build
```

## Dependencies

- React 18+
- Radix UI primitives
- Tailwind CSS
- Lucide React icons
- clsx and tailwind-merge for class management