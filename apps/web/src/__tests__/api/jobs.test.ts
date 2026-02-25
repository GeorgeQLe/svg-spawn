import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextResponse } from 'next/server';
import { DEV_SESSION } from './helpers';
import { createJob, resetStore } from '@/lib/db/store';

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
import { GET } from '@/app/api/jobs/[id]/route';

const mockRequireSession = vi.mocked(requireSession);

function makeRequest(): Request {
  return new Request('http://localhost/api/jobs/job-1');
}

describe('GET /api/jobs/[id]', () => {
  beforeEach(async () => {
    await resetStore();
    vi.clearAllMocks();
    mockRequireSession.mockResolvedValue(DEV_SESSION);
  });

  it('should return 200 with job data for queued job', async () => {
    const now = new Date().toISOString();
    await createJob({
      id: 'job-1',
      nodeId: 'node-1',
      status: 'queued',
      progress: 0,
      createdAt: now,
      updatedAt: now,
    });

    const res = await GET(makeRequest() as any, { params: Promise.resolve({ id: 'job-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('job-1');
    expect(body.status).toBe('queued');
    expect(body.progress).toBe(0);
    expect(body.nodeId).toBe('node-1');
    expect(body.error).toBeUndefined();
  });

  it('should return 200 with error field for failed job', async () => {
    const now = new Date().toISOString();
    await createJob({
      id: 'job-2',
      nodeId: 'node-1',
      status: 'failed',
      progress: 10,
      error: 'AI generation failed',
      createdAt: now,
      updatedAt: now,
    });

    const res = await GET(makeRequest() as any, { params: Promise.resolve({ id: 'job-2' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('failed');
    expect(body.error).toBe('AI generation failed');
  });

  it('should return 200 with progress 100 for completed job', async () => {
    const now = new Date().toISOString();
    await createJob({
      id: 'job-3',
      nodeId: 'node-1',
      status: 'completed',
      progress: 100,
      result: '<svg animated/>',
      createdAt: now,
      updatedAt: now,
    });

    const res = await GET(makeRequest() as any, { params: Promise.resolve({ id: 'job-3' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe('completed');
    expect(body.progress).toBe(100);
  });

  it('should return 404 when job not found', async () => {
    const res = await GET(makeRequest() as any, { params: Promise.resolve({ id: 'nonexistent' }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toMatch(/not found/i);
  });

  it('should return 401 when unauthenticated', async () => {
    mockRequireSession.mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    );

    const res = await GET(makeRequest() as any, { params: Promise.resolve({ id: 'job-1' }) });

    expect(res.status).toBe(401);
  });
});
