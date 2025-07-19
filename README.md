# AI Landing Page Generator

AI-powered landing page generator with CRO analytics, built with Next.js, Firebase, and Kimi K2 AI integration.

## Project Structure

```
ai-landing-page-generator/
├── backend/                 # Express.js API server
│   ├── api/                # API route handlers
│   ├── services/           # Business logic services
│   ├── middleware/         # Custom middleware
│   └── utils/              # Backend utilities
├── frontend/
│   ├── client-app/         # User-facing Next.js app (port 3000)
│   └── admin-app/          # Admin Next.js app (port 3001)
├── shared/                 # Shared components and utilities
│   ├── components/         # Reusable UI components
│   ├── utils/              # Shared utility functions
│   └── constants/          # Application constants
└── generated-pages/        # Generated landing pages storage
```

## Tech Stack

- **Frontend**: Next.js 14, React 18, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express.js
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth with Google OAuth
- **AI Integration**: Kimi K2 API
- **Styling**: Tailwind CSS with dark/light theme support
- **Testing**: Jest, React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project with Firestore and Authentication enabled
- Kimi K2 API key

### Installation

1. Clone the repository
2. Install dependencies for all packages:
   ```bash
   npm run install:all
   ```

3. Set up environment variables:
   - Copy `.env.example` to `.env.local` in root
   - Copy `frontend/client-app/.env.local.example` to `frontend/client-app/.env.local`
   - Copy `frontend/admin-app/.env.local.example` to `frontend/admin-app/.env.local`
   - Copy `backend/.env.example` to `backend/.env`
   - Fill in your Firebase and Kimi K2 API credentials

4. Start the development servers:
   ```bash
   npm run dev
   ```

This will start:
- Backend API server on http://localhost:3000
- Client app on http://localhost:3000 (Next.js dev server)
- Admin app on http://localhost:3001

### Environment Variables

#### Firebase Configuration
- `NEXT_PUBLIC_FIREBASE_API_KEY`: Firebase API key
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Firebase auth domain
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Firebase project ID
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`: Firebase storage bucket
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`: Firebase messaging sender ID
- `NEXT_PUBLIC_FIREBASE_APP_ID`: Firebase app ID

#### Backend Configuration
- `FIREBASE_PROJECT_ID`: Firebase project ID for admin SDK
- `KIMI_API_KEY`: Kimi K2 API key
- `KIMI_API_URL`: Kimi K2 API base URL
- `JWT_SECRET`: Secret key for JWT tokens
- `CORS_ORIGIN`: Allowed CORS origins

## Available Scripts

### Root Level
- `npm run dev` - Start all development servers
- `npm run build` - Build all applications
- `npm run test` - Run all tests
- `npm run install:all` - Install dependencies for all packages

### Individual Applications
- `npm run dev:backend` - Start backend server only
- `npm run dev:client` - Start client app only
- `npm run dev:admin` - Start admin app only

## Features

- 🤖 AI-powered landing page generation using Kimi K2
- 🔐 Google OAuth authentication via Firebase
- 📊 Real-time analytics and CRO metrics
- 🎨 Modern UI with shadcn/ui components
- 🌙 Dark/light theme support
- 📱 Fully responsive design
- ⚡ Fast development with hot reload
- 🧪 Comprehensive testing setup

## Development Guidelines

- Use JavaScript (not TypeScript) as specified in requirements
- Follow the established folder structure
- Use shadcn/ui components for consistent UI
- Implement proper error handling and validation
- Write tests for new features
- Follow the existing code style and conventions

## Firebase Setup

1. Create a new Firebase project
2. Enable Firestore database
3. Enable Authentication with Google provider
4. Download the service account key and place it as `cro-generator-firebase-adminsdk-fbsvc-4008b78b11.json`
5. Configure security rules for Firestore
6. Set up Firebase Storage for generated pages

## Contributing

1. Follow the established project structure
2. Write tests for new features
3. Use conventional commit messages
4. Ensure all linting passes
5. Update documentation as needed

## License

MIT License