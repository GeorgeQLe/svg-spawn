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
import { GET } from '@/app/api/projects/[id]/nodes/[nodeId]/route';

const mockRequireSession = vi.mocked(requireSession);

function makeRequest(): Request {
  return new Request('http://localhost/api/projects/proj-1/nodes/node-1');
}

describe('GET /api/projects/[id]/nodes/[nodeId]', () => {
  beforeEach(async () => {
    await resetStore();
    vi.clearAllMocks();
    mockRequireSession.mockResolvedValue(DEV_SESSION);
  });

  it('should return 200 with node data when found', async () => {
    const now = new Date().toISOString();
    await createNode({
      id: 'node-1',
      projectId: 'proj-1',
      prompt: 'Make it spin',
      status: 'pending',
      createdAt: now,
    });

    const res = await GET(makeRequest() as any, {
      params: Promise.resolve({ id: 'proj-1', nodeId: 'node-1' }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('node-1');
    expect(body.projectId).toBe('proj-1');
    expect(body.prompt).toBe('Make it spin');
    expect(body.status).toBe('pending');
  });

  it('should return 200 with animatedSvg for completed node', async () => {
    const now = new Date().toISOString();
    await createNode({
      id: 'node-2',
      projectId: 'proj-1',
      prompt: 'Make it bounce',
      status: 'completed',
      animatedSvg: '<svg animated/>',
      createdAt: now,
    });

    const res = await GET(makeRequest() as any, {
      params: Promise.resolve({ id: 'proj-1', nodeId: 'node-2' }),
    });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('completed');
    expect(body.animatedSvg).toBe('<svg animated/>');
  });

  it('should return 404 when node not found', async () => {
    const res = await GET(makeRequest() as any, {
      params: Promise.resolve({ id: 'proj-1', nodeId: 'nonexistent' }),
    });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toMatch(/not found/i);
  });

  it('should return 401 when unauthenticated', async () => {
    mockRequireSession.mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    );

    const res = await GET(makeRequest() as any, {
      params: Promise.resolve({ id: 'proj-1', nodeId: 'node-1' }),
    });

    expect(res.status).toBe(401);
  });
});
