import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextResponse } from 'next/server';
import { DEV_SESSION, makePipelineResult, VALID_SVG } from './helpers';
import { createProject, resetStore } from '@/lib/db/store';
import type { StoredProject } from '@/lib/db/store';

vi.mock('@/lib/auth', () => ({
  requireSession: vi.fn(),
}));

vi.mock('@svg-spawn/svg-pipeline', () => ({
  serializeSvg: vi.fn().mockReturnValue('<svg processed/>'),
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
import { GET } from '@/app/api/projects/[id]/route';

const mockRequireSession = vi.mocked(requireSession);

function makeRequest(): Request {
  return new Request('http://localhost/api/projects/proj-1');
}

describe('GET /api/projects/[id]', () => {
  beforeEach(async () => {
    await resetStore();
    vi.clearAllMocks();
    mockRequireSession.mockResolvedValue(DEV_SESSION);
  });

  it('should return 200 with project data when found', async () => {
    const now = new Date().toISOString();
    const project: StoredProject = {
      id: 'proj-1',
      workspaceId: 'ws-1',
      name: 'Test',
      createdAt: now,
      updatedAt: now,
      originalSvg: VALID_SVG,
      processedSvgDocumentId: 'proj-1',
      pipelineResult: makePipelineResult(),
    };
    await createProject(project);

    const res = await GET(makeRequest() as any, { params: Promise.resolve({ id: 'proj-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe('proj-1');
    expect(body.name).toBe('Test');
    expect(body.originalSvg).toBe(VALID_SVG);
    expect(body.processedSvg).toBe('<svg processed/>');
    expect(body.summary).toBeDefined();
    expect(body.complexity).toBeDefined();
    expect(body.createdAt).toBe(now);
  });

  it('should return 404 when project not found', async () => {
    const res = await GET(makeRequest() as any, { params: Promise.resolve({ id: 'nonexistent' }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toMatch(/not found/i);
  });

  it('should return null for processedSvg/summary/complexity when no pipelineResult', async () => {
    const now = new Date().toISOString();
    const project: StoredProject = {
      id: 'proj-2',
      workspaceId: 'ws-1',
      name: 'No Pipeline',
      createdAt: now,
      updatedAt: now,
      originalSvg: VALID_SVG,
      processedSvgDocumentId: 'proj-2',
    };
    await createProject(project);

    const res = await GET(makeRequest() as any, { params: Promise.resolve({ id: 'proj-2' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.processedSvg).toBeNull();
    expect(body.summary).toBeNull();
    expect(body.complexity).toBeNull();
  });

  it('should return 401 when unauthenticated', async () => {
    mockRequireSession.mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    );

    const res = await GET(makeRequest() as any, { params: Promise.resolve({ id: 'proj-1' }) });

    expect(res.status).toBe(401);
  });
});
