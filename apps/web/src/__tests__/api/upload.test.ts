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

import { requireSession } from '@/lib/auth';
import { processUploadedSvg } from '@/lib/server/process-svg';
import { POST } from '@/app/api/upload/route';

const mockRequireSession = vi.mocked(requireSession);
const mockProcessSvg = vi.mocked(processUploadedSvg);

/**
 * Create a File instance with a working .text() method.
 * jsdom's File class may lack Blob.text(), so we patch it.
 */
function makeFile(content: string, name: string, type: string): File {
  const file = new File([content], name, { type });
  if (typeof file.text !== 'function') {
    (file as any).text = async () => content;
  }
  return file;
}

function makeRequest(file?: File) {
  const formData = new FormData();
  if (file) {
    formData.set('svg', file);
  }
  const req = new Request('http://localhost/api/upload', { method: 'POST' });
  (req as any).formData = async () => formData;
  return req;
}

describe('POST /api/upload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRequireSession.mockResolvedValue(DEV_SESSION);
  });

  it('should return 200 with processed SVG for a valid upload', async () => {
    const pipelineResult = makePipelineResult();
    mockProcessSvg.mockResolvedValue({ success: true, data: pipelineResult });

    const file = makeFile('<svg><circle/></svg>', 'test.svg', 'image/svg+xml');
    const res = await POST(makeRequest(file) as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.rawSvg).toBe('<svg><circle/></svg>');
    expect(body.processedResult.processedSvg).toBe('<svg processed/>');
    expect(body.processedResult.summary).toEqual(pipelineResult.summary);
    expect(body.processedResult.complexity).toEqual(pipelineResult.complexity);
    expect(body.processedResult.hadAnimations).toBe(false);
  });

  it('should return 400 when svg field is missing', async () => {
    const res = await POST(makeRequest() as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/svg file is required/i);
  });

  it('should return 400 for wrong file type', async () => {
    const file = makeFile('not svg', 'test.txt', 'text/plain');
    const res = await POST(makeRequest(file) as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/must be an SVG/i);
  });

  it('should return 400 for empty SVG file', async () => {
    const file = makeFile('   ', 'test.svg', 'image/svg+xml');
    const res = await POST(makeRequest(file) as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/empty/i);
  });

  it('should return 422 when pipeline fails', async () => {
    mockProcessSvg.mockResolvedValue({ success: false, error: 'Invalid SVG structure' });

    const file = makeFile('<svg>bad</svg>', 'test.svg', 'image/svg+xml');
    const res = await POST(makeRequest(file) as any);
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.error).toBe('Invalid SVG structure');
  });

  it('should return 401 when unauthenticated', async () => {
    mockRequireSession.mockResolvedValue(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    );

    const file = makeFile('<svg/>', 'test.svg', 'image/svg+xml');
    const res = await POST(makeRequest(file) as any);

    expect(res.status).toBe(401);
  });
});
