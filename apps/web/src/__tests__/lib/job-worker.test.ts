import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { AnimationPlan, SvgDocument, SvgStructuredSummary } from '@svg-spawn/core';
import { ok, err } from '@svg-spawn/core';
import { AiError } from '@svg-spawn/ai-client';
import type { PipelineResult } from '@svg-spawn/svg-pipeline';
import {
  createProject,
  createNode,
  createJob,
  getJob,
  getNode,
  initCredits,
  getCredits,
  resetStore,
} from '@/lib/db/store';
import type { StoredProject } from '@/lib/db/store';

// Mock the AI generation module
vi.mock('@svg-spawn/ai-client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@svg-spawn/ai-client')>();
  return {
    ...actual,
    generateAnimationPlan: vi.fn(),
  };
});

// Mock the compiler module
vi.mock('@svg-spawn/compiler', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@svg-spawn/compiler')>();
  return {
    ...actual,
    compile: vi.fn(),
  };
});

// Mock the serializer
vi.mock('@svg-spawn/svg-pipeline', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@svg-spawn/svg-pipeline')>();
  return {
    ...actual,
    serializeSvg: vi.fn().mockReturnValue('<svg serialized/>'),
  };
});

// Mock env
vi.mock('@/lib/env', () => ({
  getEnvConfig: () => ({
    geminiApiKey: '',
    geminiModelId: 'gemini-2.5-pro',
    maxCreditsFree: 50,
  }),
}));

// Import mocked modules
import { generateAnimationPlan } from '@svg-spawn/ai-client';
import { compile } from '@svg-spawn/compiler';
import { processGenerationJob } from '@/lib/jobs/job-worker';

const mockGenerateAnimationPlan = vi.mocked(generateAnimationPlan);
const mockCompile = vi.mocked(compile);

// ── Test fixtures ─────────────────────────────────────────────────────────

function makeSvgDocument(): SvgDocument {
  return {
    root: {
      nodeUid: 'root-1',
      tagName: 'svg',
      attributes: { xmlns: 'http://www.w3.org/2000/svg', viewBox: '0 0 100 100' },
      children: [
        {
          nodeUid: 'circle-1',
          tagName: 'circle',
          attributes: { cx: '50', cy: '50', r: '40' },
          children: [],
        },
      ],
    },
    viewBox: { minX: 0, minY: 0, width: 100, height: 100 },
    namespaces: { xmlns: 'http://www.w3.org/2000/svg' },
  };
}

function makeSummary(): SvgStructuredSummary {
  return {
    viewBox: '0 0 100 100',
    dimensions: { width: 100, height: 100 },
    elementInventory: { circle: 1 },
    totalElements: 2,
    maxDepth: 1,
    features: {
      hasGradients: false,
      hasFilters: false,
      hasClipPaths: false,
      hasMasks: false,
      hasPatterns: false,
      hasText: false,
    },
    elements: [
      {
        nodeUid: 'circle-1',
        tagName: 'circle',
        path: ['svg', 'circle'],
        fill: undefined,
        stroke: undefined,
      },
    ],
  };
}

function makePipelineResult(): PipelineResult {
  return {
    document: makeSvgDocument(),
    summary: makeSummary(),
    complexity: {
      totalScore: 10,
      elementCount: 2,
      pathCount: 0,
      totalPathLength: 0,
      maxNestingDepth: 1,
      filterCount: 0,
      gradientCount: 0,
      clipPathCount: 0,
    },
    hadAnimations: false,
  };
}

function makeAnimationPlan(): AnimationPlan {
  return {
    id: 'plan-1',
    svgDocumentId: 'proj-1',
    groups: [
      {
        id: 'group-1',
        name: 'Bounce circle',
        effectType: 'bounce',
        targets: [{ type: 'element', nodeUid: 'circle-1' }],
        startTime: 0,
        duration: 1,
        easingPreset: 'ease-in-out',
        repeatCount: 'indefinite',
      },
    ],
    channels: {},
    metadata: {
      generatedAt: new Date().toISOString(),
      modelId: 'test',
      userPrompt: 'Make it bounce',
    },
  };
}

async function setupTestData() {
  const now = new Date().toISOString();

  const project: StoredProject = {
    id: 'proj-1',
    workspaceId: 'ws-1',
    name: 'Test Project',
    createdAt: now,
    updatedAt: now,
    originalSvg: '<svg><circle cx="50" cy="50" r="40"/></svg>',
    processedSvgDocumentId: 'proj-1',
    pipelineResult: makePipelineResult(),
  };
  await createProject(project);

  await createNode({
    id: 'node-1',
    projectId: 'proj-1',
    prompt: 'Make it bounce',
    status: 'pending',
    createdAt: now,
  });

  await createJob({
    id: 'job-1',
    nodeId: 'node-1',
    status: 'queued',
    progress: 0,
    createdAt: now,
    updatedAt: now,
  });

  await initCredits('ws-1', 10);
}

describe('job-worker', () => {
  beforeEach(async () => {
    await resetStore();
    vi.clearAllMocks();
  });

  it('should complete successfully: job completes, node updated, credit consumed', async () => {
    await setupTestData();

    mockGenerateAnimationPlan.mockResolvedValue(ok(makeAnimationPlan()));
    mockCompile.mockReturnValue(ok('<svg animated/>'));

    await processGenerationJob('job-1');

    const job = await getJob('job-1');
    expect(job!.status).toBe('completed');
    expect(job!.progress).toBe(100);
    expect(job!.result).toBe('<svg animated/>');

    const node = await getNode('node-1');
    expect(node!.status).toBe('completed');
    expect(node!.animatedSvg).toBe('<svg animated/>');

    // Credit was consumed
    expect(await getCredits('ws-1')).toBe(9);
  });

  it('should fail on AI error: job fails, no credit consumed', async () => {
    await setupTestData();

    mockGenerateAnimationPlan.mockResolvedValue(
      err(new AiError('Model overloaded', 'rate_limit')),
    );

    await processGenerationJob('job-1');

    const job = await getJob('job-1');
    expect(job!.status).toBe('failed');
    expect(job!.error).toContain('AI generation failed');

    const node = await getNode('node-1');
    expect(node!.status).toBe('failed');
    expect(node!.error).toContain('AI generation failed');

    // Credit was NOT consumed
    expect(await getCredits('ws-1')).toBe(10);
  });

  it('should fail on compile error: job fails, no credit consumed', async () => {
    await setupTestData();

    mockGenerateAnimationPlan.mockResolvedValue(ok(makeAnimationPlan()));
    mockCompile.mockReturnValue(
      err(new (await import('@svg-spawn/compiler')).CompilationError('Invalid transform')),
    );

    await processGenerationJob('job-1');

    const job = await getJob('job-1');
    expect(job!.status).toBe('failed');
    expect(job!.error).toContain('Compilation failed');

    const node = await getNode('node-1');
    expect(node!.status).toBe('failed');

    // Credit was NOT consumed
    expect(await getCredits('ws-1')).toBe(10);
  });

  it('should fail gracefully when node is missing', async () => {
    const now = new Date().toISOString();
    await resetStore();

    // Create job pointing to non-existent node
    await createJob({
      id: 'job-orphan',
      nodeId: 'nonexistent-node',
      status: 'queued',
      progress: 0,
      createdAt: now,
      updatedAt: now,
    });

    await processGenerationJob('job-orphan');

    const job = await getJob('job-orphan');
    expect(job!.status).toBe('failed');
    expect(job!.error).toContain('node not found');
  });

  it('should fail gracefully when project is missing', async () => {
    const now = new Date().toISOString();
    await resetStore();

    // Create node pointing to non-existent project
    await createNode({
      id: 'node-orphan',
      projectId: 'nonexistent-project',
      prompt: 'test',
      status: 'pending',
      createdAt: now,
    });

    await createJob({
      id: 'job-no-project',
      nodeId: 'node-orphan',
      status: 'queued',
      progress: 0,
      createdAt: now,
      updatedAt: now,
    });

    await processGenerationJob('job-no-project');

    const job = await getJob('job-no-project');
    expect(job!.status).toBe('failed');
    expect(job!.error).toContain('Project not found');

    const node = await getNode('node-orphan');
    expect(node!.status).toBe('failed');
    expect(node!.error).toContain('Project not found');
  });
});
