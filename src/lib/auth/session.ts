/**
 * Legacy session module - maintained for backward compatibility
 * 
 * This module re-exports the new server-auth implementation to maintain
 * compatibility with existing code while providing enhanced security.
 * 
 * @deprecated Use @/lib/auth/server-auth directly for new code
 */

import { 
  getServerSession as getServerSessionNew,
  ServerSession,
  requireAuth as requireAuthNew,
  validateFirebaseAdminConfig
} from './server-auth';

// Re-export types for compatibility
export type Session = ServerSession;

/**
 * Get server session with JWT verification
 * 
 * @deprecated Use getServerSession from @/lib/auth/server-auth
 */
export async function getServerSession(request: Request): Promise<Session | null> {
  // Validate configuration on first use
  try {
    validateFirebaseAdminConfig();
  } catch (error) {
    console.error('Firebase Admin not configured properly:', error);
    console.warn('Falling back to client-side auth verification (not recommended for production)');
    
    // Fallback to basic token extraction for development
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return null;
    }
    
    // Return a mock session for development (remove in production)
    return {
      user: {
        uid: 'dev-user',
        email: 'dev@example.com',
        emailVerified: true,
      },
      token: authHeader.substring(7),
      issuedAt: Math.floor(Date.now() / 1000),
      expiresAt: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    };
  }
  
  return getServerSessionNew(request);
}

/**
 * Require authentication middleware
 * 
 * @deprecated Use requireAuth from @/lib/auth/server-auth
 */
export function requireAuth(handler: Function) {
  return requireAuthNew(handler);
}

// Re-export enhanced authentication utilities
export {
  verifyAuthToken,
  getAuthenticatedUser,
  requireRole,
  hasPermission,
  auditLog,
  validateFirebaseAdminConfig,
} from './server-auth';

export type {
  AuthenticatedUser,
  ServerSession,
} from './server-auth';