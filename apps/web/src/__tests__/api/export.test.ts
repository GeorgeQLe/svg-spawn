import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextResponse } from 'next/server';
import { DEV_SESSION } from './helpers';
import { createNode, resetStore } from '@/lib/db/store';

vi.mock('@/lib/auth', () => ({
  requireSession: vi.fn(),
}));

vi.mock('@/lib/env', () => ({
  getEnvConfig: () => ({
    geminiApiKey: '',
    geminiModelId: 'gemini-2.5-pro',
    maxCreditsFree: 50,
    authDisabled: true,
  }),
}));

import { requireSession } from '@/lib/auth';
import { GET } from '@/app/api/export/[nodeId]/route';

const mockRequireSession = vi.mocked(requireSession);

function makeRequest(): Request {
  return new Request('http://localhost/api/export/node-1');
}

describe('GET /api/export/[nodeId]', () => {
  beforeEach(async () => {
    await resetStore();
    vi.clearAllMocks();
    mockRequireSession.mockResolvedValue(DEV_SESSION);
  });

  it('should return 200 with SVG content for completed node', async () => {
    const now = new Date().toISOString();
    await createNode({
      id: 'node-1',
      projectId: 'proj-1',
      prompt: 'Make it bounce',
      status: 'completed',
      animatedSvg: '<svg xmlns="http://www.w3.org/2000/svg"><circle r="40"/></svg>',
      createdAt: now,
    });

    const res = await GET(makeRequest() as any, {
      params: Promise.resolve({ nodeId: 'node-1' }),
    });

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('image/svg+xml');
    expect(res.headers.get('Content-Disposition')).toContain('attachment');
    expect(res.headers.get('Content-Disposition')).toContain('animated-node-1.svg');

    const text = await res.text();
    expect(text).toBe('<svg xmlns="http://www.w3.org/2000/svg"><circle r="40"/></svg>');
  });

  it('should return 404 when node not found', async () => {
    const res = await GET(makeRequest() as any, {
      params: Promise.resolve({ nodeId: 'nonexistent' }),
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toMatch(/not found/i);
  });

  it('should return 404 when node has no animatedSvg', async () => {
    const now = new Date().toISOString();
    await createNode({
      id: 'node-2',
      projectId: 'proj-1',
      prompt: 'Pending animation',
      status: 'pending',
      createdAt: now,
    });

    const res = await GET(makeRequest() as any, {
      params: Promise.resolve({ nodeId: 'node-2' }),
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toMatch(/no animated svg/i);
  });

  it('should return 401 when unauthenticated', async () => {
    mockRequireSession.mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    );

    const res = await GET(makeRequest() as any, {
      params: Promise.resolve({ nodeId: 'node-1' }),
    });

    expect(res.status).toBe(401);
  });
});
