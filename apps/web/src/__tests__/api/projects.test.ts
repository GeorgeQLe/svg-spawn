import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextResponse } from 'next/server';
import { DEV_SESSION, makePipelineResult } from './helpers';

vi.mock('@/lib/auth', () => ({
  requireSession: vi.fn(),
}));

vi.mock('@/lib/server/process-svg', () => ({
  processUploadedSvg: vi.fn(),
}));

vi.mock('@svg-spawn/svg-pipeline', () => ({
  serializeSvg: vi.fn().mockReturnValue('<svg processed/>'),
}));

vi.mock('@/lib/auth-workspace', () => ({
  ensureWorkspace: vi.fn().mockResolvedValue('ws-test'),
}));

import { requireSession } from '@/lib/auth';
import { processUploadedSvg } from '@/lib/server/process-svg';
import { POST } from '@/app/api/projects/route';

const mockRequireSession = vi.mocked(requireSession);
const mockProcessSvg = vi.mocked(processUploadedSvg);

function makeRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('POST /api/projects', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireSession.mockResolvedValue(DEV_SESSION);
  });

  it('should return 200 with project data for valid body', async () => {
    const pipelineResult = makePipelineResult();
    mockProcessSvg.mockResolvedValue({ success: true, data: pipelineResult });

    const res = await POST(makeRequest({ name: 'My Project', svg: '<svg/>' }) as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBeDefined();
    expect(body.name).toBe('My Project');
    expect(body.processedSvg).toBe('<svg processed/>');
    expect(body.summary).toEqual(pipelineResult.summary);
    expect(body.complexity).toEqual(pipelineResult.complexity);
  });

  it('should return 400 when name is missing', async () => {
    const res = await POST(makeRequest({ svg: '<svg/>' }) as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/name is required/i);
  });

  it('should return 400 when svg is missing', async () => {
    const res = await POST(makeRequest({ name: 'Test' }) as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/svg is required/i);
  });

  it('should return 422 when pipeline fails', async () => {
    mockProcessSvg.mockResolvedValue({ success: false, error: 'Parse error' });

    const res = await POST(makeRequest({ name: 'Test', svg: '<bad>' }) as any);
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.error).toBe('Parse error');
  });

  it('should return 401 when unauthenticated', async () => {
    mockRequireSession.mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    );

    const res = await POST(makeRequest({ name: 'Test', svg: '<svg/>' }) as any);

    expect(res.status).toBe(401);
  });
});
