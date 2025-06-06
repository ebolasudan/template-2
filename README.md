# Full-Stack AI Application Template

A modern, production-ready template for building AI-powered applications with Next.js 14, TypeScript, and multiple AI service integrations.

## 🚀 Features

- **Next.js 14 App Router** - Latest React framework with server components
- **TypeScript** - Type-safe development experience with comprehensive validation
- **Multiple AI Integrations**:
  - OpenAI GPT-4o for chat completions
  - Anthropic Claude 3.5 Sonnet for advanced reasoning
  - LM Studio for local LLM inference (privacy-focused)
  - Replicate Stable Diffusion for image generation
  - Deepgram for real-time audio transcription
  - **Smart AI Router** - Intelligent provider selection with automatic failover
- **Firebase Suite**:
  - Authentication with Google Sign-In
  - **Production JWT Verification** - Secure server-side authentication
  - Firestore for data persistence
  - Firebase Storage for file uploads
- **Security & Validation**:
  - **Comprehensive Input Sanitization** - XSS prevention with DOMPurify
  - **Zod Schema Validation** - Type-safe API request validation
  - **Rate Limiting** - Built-in protection against abuse
- **Performance Optimizations**:
  - **React Memoization** - Optimized component rendering
  - **Bundle Splitting** - Smart code chunking and caching
  - **Async Boundaries** - Consistent loading and error states
- **Developer Experience**:
  - **Comprehensive Documentation** - JSDoc comments with examples
  - **Enhanced Error Handling** - Detailed error context and request tracking
  - **Bundle Analysis** - Webpack analyzer integration
- **Tailwind CSS** - Utility-first styling
- **Vercel AI SDK** - Streaming AI responses
- **Pre-built Components** - Voice recorder, image upload, authentication

## 📋 Prerequisites

- Node.js 18+ and npm
- Firebase project with Authentication, Firestore, and Storage enabled
- API keys for AI services you plan to use

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd template-2
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Firebase Configuration
   NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

   # AI Service API Keys
   OPENAI_API_KEY=your_openai_api_key
   ANTHROPIC_API_KEY=your_anthropic_api_key
   REPLICATE_API_TOKEN=your_replicate_api_token
   DEEPGRAM_API_KEY=your_deepgram_api_key
   
   # LM Studio (for local LLM inference)
   LM_STUDIO_BASE_URL=http://localhost:1234
   LM_STUDIO_API_KEY=optional_api_key
   
   # Firebase Admin (for JWT verification)
   FIREBASE_ADMIN_PROJECT_ID=your_firebase_project_id
   FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
   FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account@your_project.iam.gserviceaccount.com
   
   # Redis (optional, for advanced caching)
   REDIS_URL=redis://localhost:6379
   ```

4. **Configure Firebase**
   - Enable Google Authentication in Firebase Console
   - Set up Firestore Database
   - Configure Storage rules for your use case

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) to see your application.

## 🏗️ Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   ├── anthropic/     # Claude chat endpoint
│   │   ├── deepgram/      # Audio transcription
│   │   ├── openai/        # GPT chat & transcription
│   │   └── replicate/     # Image generation
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ImageUpload.tsx    # Image upload component
│   ├── SignInWithGoogle.tsx # Authentication component
│   └── VoiceRecorder.tsx  # Audio recording component
└── lib/                   # Utilities and configuration
    ├── contexts/          # React contexts
    │   ├── AuthContext.tsx    # Authentication state
    │   └── DeepgramContext.tsx # Deepgram client
    ├── firebase/          # Firebase configuration
    │   ├── firebase.ts    # Firebase initialization
    │   └── firebaseUtils.ts # Helper functions
    └── hooks/             # Custom React hooks
        └── useAuth.ts     # Authentication hook
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Type checking with TypeScript
- `npm run analyze` - Bundle analysis with webpack analyzer
- `npm run check:env` - Validate environment variables
- `npm run create:component` - Generate new component with templates
- `npm run create:api` - Generate new API route with templates

## 📚 API Endpoints

### Chat Completions
- **POST `/api/openai/chat`** - Stream chat responses from GPT-4o
- **POST `/api/anthropic/chat`** - Stream chat responses from Claude 3.5 Sonnet
- **POST `/api/lmstudio/chat`** - Stream chat responses from local LLM via LM Studio

### Image Generation
- **POST `/api/replicate/generate-image`** - Generate images with Stable Diffusion
  ```json
  {
    "prompt": "A beautiful sunset",
    "width": 512,
    "height": 512,
    "num_inference_steps": 25,
    "guidance_scale": 7.5
  }
  ```

### Audio Services
- **GET `/api/deepgram`** - Get Deepgram API key for client-side transcription
- **POST `/api/openai/transcribe`** - Transcribe audio files

## 🚀 Quick Start Templates

The `/paths` directory contains starter templates for common AI applications:

- **`chat.md`** - AI chatbot application
- **`image-generation.md`** - AI image generator
- **`social-media.md`** - Social media content creator
- **`voice-notes.md`** - Voice note transcription app

### Using Templates with Cursor

1. Open the project in Cursor
2. Navigate to `/paths/` and choose a template
3. Use Cursor's Composer feature with the template prompt
4. The AI will scaffold your application based on the template

## 🔐 Authentication

### Client-Side Authentication
Firebase Authentication is pre-configured with Google Sign-In:

```tsx
import { useAuth } from '@/lib/hooks/useAuth';
import { SignInWithGoogle } from '@/components';

function MyComponent() {
  const { user, signIn, signOut } = useAuth();
  
  if (!user) {
    return <SignInWithGoogle />;
  }
  
  return (
    <div>
      <h1>Welcome, {user.displayName}!</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

### Server-Side Authentication
API routes use JWT verification for secure access:

```typescript
import { requireAuth } from '@/lib/auth/server-auth';

// Require authentication for API route
export const POST = requireAuth(async (request, session) => {
  // Access authenticated user
  console.log('User ID:', session.user.uid);
  console.log('Email:', session.user.email);
  
  return new Response('Authenticated response');
});

// Require specific role/permission
import { requireRole } from '@/lib/auth/server-auth';

export const DELETE = requireRole('admin', async (request, session) => {
  // Only users with 'admin' role can access
  return new Response('Admin-only response');
});
```

## 🧩 Component Usage

### Using AI Chat Hook
The enhanced useChat hook provides optimistic updates and error handling:

```tsx
import { useChat } from '@/lib/hooks/useChat';

function ChatComponent() {
  const { messages, sendMessage, isLoading, error } = useChat('openai');
  
  const handleSend = async (content: string) => {
    try {
      await sendMessage(content);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };
  
  return (
    <div>
      {messages.map(message => (
        <div key={message.id} className={`message ${message.role}`}>
          {message.content}
        </div>
      ))}
      {isLoading && <div>AI is thinking...</div>}
      {error && <div>Error: {error.message}</div>}
    </div>
  );
}
```

### Using Async Boundaries
Standardized loading and error states:

```tsx
import { AsyncBoundary } from '@/components/ui';

function App() {
  return (
    <AsyncBoundary
      fallback={<div>Loading chat...</div>}
      errorFallback={({ error, retry }) => (
        <div>
          <p>Error: {error.message}</p>
          <button onClick={retry}>Try Again</button>
        </div>
      )}
    >
      <ChatComponent />
    </AsyncBoundary>
  );
}
```

### Using Validation Schemas
Type-safe API validation:

```typescript
import { ChatRequestSchema, safeValidate } from '@/lib/validation';

export async function POST(request: Request) {
  const body = await request.json();
  
  // Validate and sanitize input
  const validatedData = safeValidate(
    ChatRequestSchema,
    body,
    'Chat API Request'
  );
  
  // Use validated data
  return processChat(validatedData);
}
```

### Using Input Sanitization
Secure user input handling:

```typescript
import { sanitizeInput } from '@/lib/validation/sanitization';

// Sanitize different types of content
const cleanText = sanitizeInput(userInput, 'TEXT_ONLY');
const cleanHtml = sanitizeInput(htmlContent, 'BASIC_HTML');
const cleanChat = sanitizeInput(chatMessage, 'CHAT_MESSAGE');
```

## 🎨 Styling

This template uses Tailwind CSS for styling. The configuration is in `tailwind.config.ts`.

```tsx
// Example component with Tailwind classes
<div className="flex items-center justify-center min-h-screen bg-gray-100">
  <h1 className="text-4xl font-bold text-gray-900">Hello World</h1>
</div>
```

## 📝 Environment Variables

### Required Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_FIREBASE_*` | Firebase configuration | Yes |
| `OPENAI_API_KEY` | OpenAI API key | If using OpenAI |
| `ANTHROPIC_API_KEY` | Anthropic API key | If using Claude |
| `REPLICATE_API_TOKEN` | Replicate API token | If using image generation |
| `DEEPGRAM_API_KEY` | Deepgram API key | If using transcription |
| `LM_STUDIO_BASE_URL` | LM Studio server URL | If using local LLM |
| `LM_STUDIO_API_KEY` | LM Studio API key (optional) | If LM Studio requires auth |

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- AI integrations powered by [Vercel AI SDK](https://sdk.vercel.ai/)
- Authentication by [Firebase](https://firebase.google.com/)
- Styling with [Tailwind CSS](https://tailwindcss.com/)

## 💡 Tips

- Keep your API keys secure and never commit them to version control
- Configure Firebase Security Rules appropriately for production
- Use the provided components as starting points and customize as needed
- Leverage the Vercel AI SDK for easy streaming implementations
- Check the `/paths` directory for application ideas and templates

## 🐛 Troubleshooting

### Common Issues

1. **API Key Errors**: Ensure all required environment variables are set
2. **Firebase Errors**: Check Firebase project configuration and enabled services
3. **Build Errors**: Run `npm run lint` to check for code issues
4. **CORS Issues**: Verify API routes are properly configured

For more help, check the [Next.js documentation](https://nextjs.org/docs) or file an issue in the repository.