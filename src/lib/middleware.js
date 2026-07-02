import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function requireAuth(req) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return { error: 'Unauthorized', status: 401 };
  }
  return { user: session.user };
}

export async function requireRole(req, roles) {
  const auth = await requireAuth(req);
  if (auth.error) return auth;
  if (!roles.includes(auth.user.role)) {
    return { error: 'Forbidden', status: 403 };
  }
  return auth;
}

export function handleApiError(handler) {
  return async (req, ...args) => {
    try {
      return await handler(req, ...args);
    } catch (error) {
      console.error('API Error:', error);
      return Response.json(
        { error: error.message || 'Internal server error' },
        { status: error.status || 500 }
      );
    }
  };
}
