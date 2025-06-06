/**
 * Server-side authentication utilities using Firebase Admin SDK
 * 
 * This module provides secure JWT token verification for API routes,
 * replacing the placeholder authentication with production-ready validation.
 */

import { auth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { AuthenticationError, AppError } from '@/lib/errors';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      }),
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    });
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
  }
}

export interface AuthenticatedUser {
  uid: string;
  email?: string;
  name?: string;
  picture?: string;
  emailVerified: boolean;
  customClaims?: Record<string, any>;
}

export interface ServerSession {
  user: AuthenticatedUser;
  token: string;
  issuedAt: number;
  expiresAt: number;
}

/**
 * Verify Firebase ID token and return decoded user information
 * 
 * @param token - Firebase ID token to verify
 * @returns Decoded token information or null if invalid
 */
export async function verifyAuthToken(token: string): Promise<auth.DecodedIdToken | null> {
  try {
    // Verify the token with Firebase Admin
    const decodedToken = await auth.verifyIdToken(token, true);
    
    // Additional security checks
    if (!decodedToken.uid) {
      console.warn('Token missing uid');
      return null;
    }
    
    // Check if token is not expired (additional safety check)
    const now = Math.floor(Date.now() / 1000);
    if (decodedToken.exp < now) {
      console.warn('Token has expired');
      return null;
    }
    
    // Check if token was issued too long ago (optional: implement token rotation)
    const tokenAge = now - decodedToken.iat;
    const maxTokenAge = 24 * 60 * 60; // 24 hours
    if (tokenAge > maxTokenAge) {
      console.warn('Token too old, consider refreshing');
      // Note: This is a warning, not an error. Adjust based on security requirements
    }
    
    return decodedToken;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

/**
 * Get authenticated user information from Firebase token
 * 
 * @param token - Firebase ID token
 * @returns User information or null if invalid
 */
export async function getAuthenticatedUser(token: string): Promise<AuthenticatedUser | null> {
  const decodedToken = await verifyAuthToken(token);
  
  if (!decodedToken) {
    return null;
  }
  
  try {
    // Get additional user information from Firebase Auth
    const userRecord = await auth.getUser(decodedToken.uid);
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name || userRecord.displayName,
      picture: decodedToken.picture || userRecord.photoURL,
      emailVerified: decodedToken.email_verified || userRecord.emailVerified,
      customClaims: userRecord.customClaims || {},
    };
  } catch (error) {
    console.error('Failed to get user record:', error);
    
    // Return basic information from token if user record fetch fails
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      name: decodedToken.name,
      picture: decodedToken.picture,
      emailVerified: decodedToken.email_verified || false,
      customClaims: {},
    };
  }
}

/**
 * Extract and validate authentication token from request headers
 * 
 * @param request - HTTP request object
 * @returns Authentication token or null if not found/invalid
 */
export function extractAuthToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader) {
    return null;
  }
  
  // Support both "Bearer token" and "token" formats
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Direct token format (less secure, but sometimes used)
  if (authHeader.length > 20) { // Basic length check for tokens
    return authHeader;
  }
  
  return null;
}

/**
 * Get server session with full authentication verification
 * 
 * @param request - HTTP request object
 * @returns Server session or null if not authenticated
 */
export async function getServerSession(request: Request): Promise<ServerSession | null> {
  try {
    const token = extractAuthToken(request);
    
    if (!token) {
      return null;
    }
    
    const decodedToken = await verifyAuthToken(token);
    
    if (!decodedToken) {
      return null;
    }
    
    const user = await getAuthenticatedUser(token);
    
    if (!user) {
      return null;
    }
    
    return {
      user,
      token,
      issuedAt: decodedToken.iat,
      expiresAt: decodedToken.exp,
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

/**
 * Require authentication middleware for API routes
 * 
 * @param handler - API route handler
 * @returns Wrapped handler that requires authentication
 * 
 * @example
 * ```typescript
 * export const POST = requireAuth(async (request, session) => {
 *   // Handler receives the validated session
 *   console.log('Authenticated user:', session.user.uid);
 *   return new Response('Success');
 * });
 * ```
 */
export function requireAuth<T extends any[]>(
  handler: (request: Request, session: ServerSession, ...args: T) => Promise<Response>
) {
  return async (request: Request, ...args: T): Promise<Response> => {
    const session = await getServerSession(request);
    
    if (!session) {
      throw AuthenticationError.fromRequest(
        'Valid authentication token required',
        request
      );
    }
    
    // Check if token is close to expiring (within 5 minutes)
    const now = Math.floor(Date.now() / 1000);
    const timeToExpiry = session.expiresAt - now;
    
    if (timeToExpiry < 300) { // 5 minutes
      console.warn(`Token expiring soon for user ${session.user.uid}: ${timeToExpiry}s remaining`);
      // You could implement token refresh logic here
    }
    
    return handler(request, session, ...args);
  };
}

/**
 * Check if user has specific role or permission
 * 
 * @param session - Server session
 * @param requiredRole - Required role/permission
 * @returns True if user has permission
 */
export function hasPermission(session: ServerSession, requiredRole: string): boolean {
  if (!session.user.customClaims) {
    return false;
  }
  
  const { roles, permissions } = session.user.customClaims;
  
  // Check roles array
  if (Array.isArray(roles) && roles.includes(requiredRole)) {
    return true;
  }
  
  // Check permissions array
  if (Array.isArray(permissions) && permissions.includes(requiredRole)) {
    return true;
  }
  
  // Check direct claim
  if (session.user.customClaims[requiredRole] === true) {
    return true;
  }
  
  return false;
}

/**
 * Require specific role/permission middleware
 * 
 * @param requiredRole - Required role or permission
 * @param handler - API route handler
 * @returns Wrapped handler that requires specific permission
 */
export function requireRole<T extends any[]>(
  requiredRole: string,
  handler: (request: Request, session: ServerSession, ...args: T) => Promise<Response>
) {
  return requireAuth(async (request: Request, session: ServerSession, ...args: T) => {
    if (!hasPermission(session, requiredRole)) {
      throw AppError.fromRequest(
        `Insufficient permissions. Required role: ${requiredRole}`,
        request,
        403,
        'INSUFFICIENT_PERMISSIONS'
      );
    }
    
    return handler(request, session, ...args);
  });
}

/**
 * Rate limiting by user ID
 * 
 * @param session - Server session
 * @param action - Action being performed (for logging)
 * @returns User identifier for rate limiting
 */
export function getUserRateLimitKey(session: ServerSession, action: string): string {
  return `user:${session.user.uid}:${action}`;
}

/**
 * Audit log entry for authenticated actions
 * 
 * @param session - Server session
 * @param action - Action performed
 * @param details - Additional details
 */
export function auditLog(
  session: ServerSession,
  action: string,
  details?: Record<string, any>
): void {
  const logEntry = {
    timestamp: new Date().toISOString(),
    userId: session.user.uid,
    userEmail: session.user.email,
    action,
    details,
  };
  
  // In production, send to logging service
  console.log('AUDIT:', JSON.stringify(logEntry));
}

/**
 * Validate that Firebase Admin is properly configured
 * 
 * @throws Error if configuration is invalid
 */
export function validateFirebaseAdminConfig(): void {
  const requiredEnvVars = [
    'FIREBASE_ADMIN_PROJECT_ID',
    'FIREBASE_ADMIN_PRIVATE_KEY',
    'FIREBASE_ADMIN_CLIENT_EMAIL',
  ];
  
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    throw new Error(
      `Missing required Firebase Admin environment variables: ${missingVars.join(', ')}`
    );
  }
}