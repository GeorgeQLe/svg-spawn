import { NextRequest, NextResponse } from 'next/server';
import { getEnvConfig } from '@/lib/env';

async function handler(request: NextRequest) {
  const { authDisabled } = getEnvConfig();
  if (authDisabled) {
    return NextResponse.json({ error: 'Auth is disabled' }, { status: 404 });
  }

  const { toNextJsHandler } = await import('better-auth/next-js');
  const { getAuth } = await import('@/lib/auth');
  const authHandler = toNextJsHandler(getAuth());

  // toNextJsHandler returns { GET, POST } — pick the right one
  if (request.method === 'GET') {
    return authHandler.GET(request);
  }
  return authHandler.POST(request);
}

export const GET = handler;
export const POST = handler;
