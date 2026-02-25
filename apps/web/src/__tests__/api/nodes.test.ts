import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextResponse } from 'next/server';
import { DEV_SESSION, makePipelineResult, VALID_SVG } from './helpers';
import { createProject, createNode, initCredits, resetStore } from '@/lib/db/store';
import type { StoredProject } from '@/lib/db/store';

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

vi.mock('@/lib/jobs/job-queue', () => ({
  jobQueue: { enqueue: vi.fn() },
}));

import { requireSession } from '@/lib/auth';
import { jobQueue } from '@/lib/jobs/job-queue';
import { GET, POST } from '@/app/api/projects/[id]/nodes/route';

const mockRequireSession = vi.mocked(requireSession);
const mockEnqueue = vi.mocked(jobQueue.enqueue);

async function seedProject(id = 'proj-1', workspaceId = 'ws-1') {
  const now = new Date().toISOString();
  const project: StoredProject = {
    id,
    workspaceId,
    name: 'Test',
    createdAt: now,
    updatedAt: now,
    originalSvg: VALID_SVG,
    processedSvgDocumentId: id,
    pipelineResult: makePipelineResult(),
  };
  await createProject(project);
  await initCredits(workspaceId, 10);
  return project;
}

function makeGetRequest(): Request {
  return new Request('http://localhost/api/projects/proj-1/nodes');
}

function makePostRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/projects/proj-1/nodes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('GET /api/projects/[id]/nodes', () => {
  beforeEach(async () => {
    await resetStore();
    vi.clearAllMocks();
    mockRequireSession.mockResolvedValue(DEV_SESSION);
  });

  it('should return empty nodes for a project with no nodes', async () => {
    await seedProject();

    const res = await GET(makeGetRequest() as any, { params: Promise.resolve({ id: 'proj-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.nodes).toEqual([]);
  });

  it('should return nodes for a project', async () => {
    await seedProject();
    const now = new Date().toISOString();
    await createNode({
      id: 'node-1',
      projectId: 'proj-1',
      prompt: 'Make it spin',
      status: 'pending',
      createdAt: now,
    });

    const res = await GET(makeGetRequest() as any, { params: Promise.resolve({ id: 'proj-1' }) });
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.nodes).toHaveLength(1);
    expect(body.nodes[0].id).toBe('node-1');
    expect(body.nodes[0].prompt).toBe('Make it spin');
  });

  it('should return 404 when project not found', async () => {
    const res = await GET(makeGetRequest() as any, { params: Promise.resolve({ id: 'nonexistent' }) });
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toMatch(/not found/i);
  });

  it('should return 401 when unauthenticated', async () => {
    mockRequireSession.mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    );

    const res = await GET(makeGetRequest() as any, { params: Promise.resolve({ id: 'proj-1' }) });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/projects/[id]/nodes', () => {
  beforeEach(async () => {
    await resetStore();
    vi.clearAllMocks();
    mockRequireSession.mockResolvedValue(DEV_SESSION);
  });

  it('should return 200 with nodeId and jobId for valid request', async () => {
    await seedProject();

    const res = await POST(
      makePostRequest({ prompt: 'Make it bounce' }) as any,
      { params: Promise.resolve({ id: 'proj-1' }) },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.nodeId).toBeDefined();
    expect(body.jobId).toBeDefined();
    expect(mockEnqueue).toHaveBeenCalledWith(body.jobId);
  });

  it('should accept optional parentNodeId', async () => {
    await seedProject();
    await createNode({
      id: 'parent-node',
      projectId: 'proj-1',
      prompt: 'first',
      status: 'completed',
      createdAt: new Date().toISOString(),
    });

    const res = await POST(
      makePostRequest({ prompt: 'Make it spin', parentNodeId: 'parent-node' }) as any,
      { params: Promise.resolve({ id: 'proj-1' }) },
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.nodeId).toBeDefined();
    expect(body.jobId).toBeDefined();
  });

  it('should return 400 when prompt is missing', async () => {
    await seedProject();

    const res = await POST(
      makePostRequest({}) as any,
      { params: Promise.resolve({ id: 'proj-1' }) },
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/prompt is required/i);
  });

  it('should return 404 when project not found', async () => {
    const res = await POST(
      makePostRequest({ prompt: 'test' }) as any,
      { params: Promise.resolve({ id: 'nonexistent' }) },
    );
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toMatch(/not found/i);
  });

  it('should return 402 when credits exhausted', async () => {
    await seedProject();
    // Set credits to 0
    await initCredits('ws-1', 0);

    const res = await POST(
      makePostRequest({ prompt: 'Make it bounce' }) as any,
      { params: Promise.resolve({ id: 'proj-1' }) },
    );
    const body = await res.json();

    expect(res.status).toBe(402);
    expect(body.error).toMatch(/no credits/i);
    expect(mockEnqueue).not.toHaveBeenCalled();
  });

  it('should return 401 when unauthenticated', async () => {
    mockRequireSession.mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    );

    const res = await POST(
      makePostRequest({ prompt: 'test' }) as any,
      { params: Promise.resolve({ id: 'proj-1' }) },
    );

    expect(res.status).toBe(401);
  });
});
