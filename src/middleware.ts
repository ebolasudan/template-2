import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public API routes that don't require authentication
const PUBLIC_API_ROUTES = [
  '/api/auth', // Authentication endpoints
];

// Define routes that require authentication
const PROTECTED_API_ROUTES = [
  '/api/anthropic',
  '/api/openai',
  '/api/replicate',
  '/api/deepgram',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a protected API route
  if (PROTECTED_API_ROUTES.some(route => pathname.startsWith(route))) {
    // Check for authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new NextResponse(
        JSON.stringify({ error: 'Authentication required' }),
        { 
          status: 401,
          headers: { 'content-type': 'application/json' }
        }
      );
    }

    // In production, you would verify the JWT token here
    // For now, we'll just check that a token exists
    const token = authHeader.substring(7);
    if (!token) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid authentication token' }),
        { 
          status: 401,
          headers: { 'content-type': 'application/json' }
        }
      );
    }
  }

  // Add security headers
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // CORS headers for API routes
  if (pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Origin', process.env.NEXT_PUBLIC_APP_URL || '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    response.headers.set(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};