import { NextResponse } from 'next/server';
import { getEnvConfig } from './env';

export interface Session {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

const DEV_SESSION: Session = {
  user: {
    id: 'dev-user',
    name: 'Dev User',
    email: 'dev@localhost',
  },
};

let authInstance: ReturnType<typeof createAuth> | null = null;

function createAuth() {
  // Dynamic imports to avoid loading when auth is disabled
  const { betterAuth } = require('better-auth');
  const { drizzleAdapter } = require('better-auth/adapters/drizzle');
  const { getDb } = require('./db/connection');

  return betterAuth({
    database: drizzleAdapter(getDb(), { provider: 'pg' }),
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
      github: {
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      },
    },
  });
}

export function getAuth() {
  if (!authInstance) {
    authInstance = createAuth();
  }
  return authInstance;
}

/**
 * Get the current session from a request.
 * Returns a synthetic dev session when auth is disabled (no DATABASE_URL).
 */
export async function getSession(request: Request): Promise<Session | null> {
  const { authDisabled } = getEnvConfig();
  if (authDisabled) {
    return DEV_SESSION;
  }

  const auth = getAuth();
  const result = await auth.api.getSession({ headers: request.headers });
  if (!result) return null;

  return {
    user: {
      id: result.user.id,
      name: result.user.name,
      email: result.user.email,
      image: result.user.image ?? null,
    },
  };
}

/**
 * Require an authenticated session. Returns Session or a 401 NextResponse.
 */
export async function requireSession(
  request: Request,
): Promise<Session | NextResponse> {
  const session = await getSession(request);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return session;
}
