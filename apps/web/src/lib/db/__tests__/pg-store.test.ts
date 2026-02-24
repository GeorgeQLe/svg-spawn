import { describe, it, expect, beforeEach, beforeAll, afterAll } from 'vitest';
import type { GenerationNode, Job } from '@svg-spawn/core';

/**
 * PgStore integration tests.
 * Requires a running PostgreSQL with DATABASE_URL set.
 * Skipped by default — run with: DATABASE_URL=... pnpm --filter @svg-spawn/web test
 */

const skip = !process.env.DATABASE_URL;

describe.skipIf(skip)('PgStore (integration)', () => {
  // Lazily loaded so we don't error when DATABASE_URL is unset
  let PgStore: typeof import('../pg-store').PgStore;
  let store: InstanceType<typeof import('../pg-store').PgStore>;
  let closePgPool: typeof import('../connection').closePgPool;

  beforeAll(async () => {
    const pgMod = await import('../pg-store');
    const connMod = await import('../connection');
    PgStore = pgMod.PgStore;
    closePgPool = connMod.closePgPool;
    store = new PgStore();
  });

  afterAll(async () => {
    await closePgPool();
  });

  beforeEach(async () => {
    await store.resetStore();
  });

  const now = () => new Date().toISOString();

  it('should create and get a project', async () => {
    const project = {
      id: 'proj-1',
      workspaceId: 'ws-1',
      name: 'Test',
      originalSvg: '<svg/>',
      createdAt: now(),
      updatedAt: now(),
    };

    // Ensure workspace exists for FK
    await store.initCredits('ws-1', 10);
    await store.createProject(project);

    const retrieved = await store.getProject('proj-1');
    expect(retrieved).toBeDefined();
    expect(retrieved!.name).toBe('Test');

    expect(await store.getProject('nonexistent')).toBeUndefined();
  });

  it('should CRUD nodes', async () => {
    await store.initCredits('ws-1', 10);
    await store.createProject({
      id: 'proj-1',
      workspaceId: 'ws-1',
      name: 'P',
      originalSvg: '<svg/>',
      createdAt: now(),
      updatedAt: now(),
    });

    const node: GenerationNode = {
      id: 'node-1',
      projectId: 'proj-1',
      prompt: 'Bounce',
      status: 'pending',
      createdAt: now(),
    };
    await store.createNode(node);

    const got = await store.getNode('node-1');
    expect(got!.prompt).toBe('Bounce');

    const updated = await store.updateNode('node-1', { status: 'completed', animatedSvg: '<svg/>' });
    expect(updated!.status).toBe('completed');

    const nodes = await store.getNodesByProject('proj-1');
    expect(nodes).toHaveLength(1);
  });

  it('should CRUD jobs', async () => {
    await store.initCredits('ws-1', 10);
    await store.createProject({
      id: 'proj-1',
      workspaceId: 'ws-1',
      name: 'P',
      originalSvg: '<svg/>',
      createdAt: now(),
      updatedAt: now(),
    });
    await store.createNode({
      id: 'node-1',
      projectId: 'proj-1',
      prompt: 'test',
      status: 'pending',
      createdAt: now(),
    });

    const job: Job = {
      id: 'job-1',
      nodeId: 'node-1',
      status: 'queued',
      progress: 0,
      createdAt: now(),
      updatedAt: now(),
    };
    await store.createJob(job);

    const got = await store.getJob('job-1');
    expect(got!.status).toBe('queued');

    const updated = await store.updateJob('job-1', { status: 'processing', progress: 50 });
    expect(updated!.progress).toBe(50);
  });

  it('should handle credits atomically', async () => {
    await store.initCredits('ws-1', 2);
    expect(await store.getCredits('ws-1')).toBe(2);

    expect(await store.decrementCredits('ws-1')).toBe(true);
    expect(await store.getCredits('ws-1')).toBe(1);

    expect(await store.decrementCredits('ws-1')).toBe(true);
    expect(await store.getCredits('ws-1')).toBe(0);

    // Cannot go below zero
    expect(await store.decrementCredits('ws-1')).toBe(false);
    expect(await store.getCredits('ws-1')).toBe(0);

    // Non-existent workspace
    expect(await store.decrementCredits('nonexistent')).toBe(false);
  });
});
