import { auth } from '@/lib/firebase/firebase';
import { User } from 'firebase/auth';

export interface Session {
  user: User;
  token: string;
}

export async function getServerSession(request: Request): Promise<Session | null> {
  try {
    // Extract the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    
    // In a real implementation, you would verify the Firebase token here
    // For now, we'll create a basic validation
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return null;
    }

    return {
      user: currentUser,
      token
    };
  } catch (error) {
    console.error('Session validation error:', error);
    return null;
  }
}

export function requireAuth(handler: Function) {
  return async (request: Request, ...args: any[]) => {
    const session = await getServerSession(request);
    
    if (!session) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Add session to request context
    return handler(request, ...args);
  };
}