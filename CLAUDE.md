# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

```bash
# Development
npm run dev          # Start development server on http://localhost:3000

# Build and Production
npm run build        # Build for production
npm run start        # Start production server

# Code Quality
npm run lint         # Run ESLint for code quality checks
npm run typecheck    # TypeScript type checking
npm run format       # Format code with Prettier

# Analysis and Debugging
npm run analyze      # Bundle analysis with webpack-bundle-analyzer
npm run check:env    # Validate environment variables

# Code Generation
npm run create:component  # Generate new component with templates
npm run create:api       # Generate new API route with templates
```

## Architecture Overview

This is a Next.js 14 full-stack template designed for rapid AI application development. It provides pre-configured integrations with multiple AI services and a complete authentication system.

### Project Structure
- **`/src/app/`**: Next.js App Router pages, layouts, and API routes
- **`/src/components/`**: Reusable React components
- **`/src/lib/`**: Core utilities, contexts, hooks, and Firebase configuration
- **`/paths/`**: Template prompts for different application types

### Pre-configured Service Integrations

1. **Chat APIs** (using Vercel AI SDK for streaming):
   - OpenAI GPT-4o: `/api/openai/chat`
   - Anthropic Claude 3.5 Sonnet: `/api/anthropic/chat`
   - LM Studio (Local LLM): `/api/lmstudio/chat`

2. **Image Generation**:
   - Replicate Stable Diffusion: `/api/replicate/generate-image`

3. **Audio Transcription**:
   - Deepgram real-time transcription via context provider
   - API key endpoint: `/api/deepgram`

4. **Firebase Services**:
   - Authentication with Google sign-in
   - Firestore database
   - Firebase Storage for file uploads
   - Auth context at `/src/lib/contexts/AuthContext.tsx`

### Development Workflow

This template is designed to work with Cursor's Composer feature:
1. Navigate to `/paths/` directory
2. Choose a path template (chat.md, image-generation.md, etc.)
3. Use the path prompt with Cursor Composer to scaffold your application

### Environment Variables Required

```
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
NEXT_PUBLIC_FIREBASE_PROJECT_ID
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
NEXT_PUBLIC_FIREBASE_APP_ID

# AI Service API Keys
REPLICATE_API_TOKEN
DEEPGRAM_API_KEY
# AI Service Keys
OPENAI_API_KEY
ANTHROPIC_API_KEY
LM_STUDIO_BASE_URL
LM_STUDIO_API_KEY

# Firebase Admin (for secure JWT verification)
FIREBASE_ADMIN_PROJECT_ID
FIREBASE_ADMIN_PRIVATE_KEY
FIREBASE_ADMIN_CLIENT_EMAIL

# Redis (optional, for advanced caching)
REDIS_URL
```

### Key Technical Details

- **TypeScript**: Strict mode enabled with path alias `@/*` → `./src/*`
- **Validation**: Comprehensive Zod schemas for all API endpoints in `/src/lib/validation/`
- **Authentication**: Production-ready JWT verification with Firebase Admin SDK
- **Security**: Input sanitization with DOMPurify, XSS prevention, rate limiting
- **Performance**: React memoization, bundle splitting, optimized webpack configuration
- **Error Handling**: Enhanced error classes with request tracking and detailed context
- **Styling**: Tailwind CSS with performance optimizations
- **Image Domains**: Configured for placehold.co, replicate.com, and firebasestorage.googleapis.com
- **Streaming**: All chat endpoints use Vercel AI SDK's `streamText` for real-time responses
- **File Structure**: All project files must be saved in the `/src` folder per project conventions

### Development Guidelines

- **Components**: Use React.memo for pure components, useCallback/useMemo for expensive operations
- **API Routes**: Always use validation schemas and input sanitization
- **Authentication**: Use `requireAuth` or `requireRole` for protected routes
- **Error Handling**: Use `AppError.fromRequest()` for enhanced error context
- **Loading States**: Use `AsyncBoundary` for consistent UX patterns
- **Documentation**: Add JSDoc comments for all public APIs