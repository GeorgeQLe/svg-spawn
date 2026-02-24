import { describe, it, expect, beforeEach } from 'vitest';
import {
  createProject,
  getProject,
  createNode,
  getNode,
  updateNode,
  getNodesByProject,
  createJob,
  getJob,
  updateJob,
  initCredits,
  getCredits,
  decrementCredits,
  resetStore,
} from '@/lib/db/store';
import type { StoredProject } from '@/lib/db/store';
import type { GenerationNode, Job } from '@svg-spawn/core';

function makeProject(overrides: Partial<StoredProject> = {}): StoredProject {
  const now = new Date().toISOString();
  return {
    id: 'proj-1',
    workspaceId: 'ws-1',
    name: 'Test Project',
    createdAt: now,
    updatedAt: now,
    originalSvg: '<svg><rect/></svg>',
    ...overrides,
  };
}

function makeNode(overrides: Partial<GenerationNode> = {}): GenerationNode {
  return {
    id: 'node-1',
    projectId: 'proj-1',
    prompt: 'Bounce the circle',
    status: 'pending',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function makeJob(overrides: Partial<Job> = {}): Job {
  const now = new Date().toISOString();
  return {
    id: 'job-1',
    nodeId: 'node-1',
    status: 'queued',
    progress: 0,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

describe('db-store', () => {
  beforeEach(async () => {
    await resetStore();
  });

  it('should create and get a project', async () => {
    const project = makeProject();
    await createProject(project);

    const retrieved = await getProject('proj-1');
    expect(retrieved).toBeDefined();
    expect(retrieved!.id).toBe('proj-1');
    expect(retrieved!.name).toBe('Test Project');
    expect(retrieved!.originalSvg).toBe('<svg><rect/></svg>');

    // Non-existent project
    expect(await getProject('nonexistent')).toBeUndefined();
  });

  it('should create and get a node', async () => {
    const node = makeNode();
    await createNode(node);

    const retrieved = await getNode('node-1');
    expect(retrieved).toBeDefined();
    expect(retrieved!.id).toBe('node-1');
    expect(retrieved!.prompt).toBe('Bounce the circle');
    expect(retrieved!.status).toBe('pending');

    // Non-existent node
    expect(await getNode('nonexistent')).toBeUndefined();
  });

  it('should update node status', async () => {
    const node = makeNode();
    await createNode(node);

    const updated = await updateNode('node-1', {
      status: 'completed',
      animatedSvg: '<svg animated/>',
    });

    expect(updated).toBeDefined();
    expect(updated!.status).toBe('completed');
    expect(updated!.animatedSvg).toBe('<svg animated/>');
    expect(updated!.prompt).toBe('Bounce the circle');

    // Verify it persisted
    const retrieved = await getNode('node-1');
    expect(retrieved!.status).toBe('completed');

    // Update non-existent node returns undefined
    expect(await updateNode('nonexistent', { status: 'failed' })).toBeUndefined();
  });

  it('should get nodes by project', async () => {
    await createNode(makeNode({ id: 'node-1', projectId: 'proj-1', prompt: 'A' }));
    await createNode(makeNode({ id: 'node-2', projectId: 'proj-1', prompt: 'B' }));
    await createNode(makeNode({ id: 'node-3', projectId: 'proj-2', prompt: 'C' }));

    const proj1Nodes = await getNodesByProject('proj-1');
    expect(proj1Nodes).toHaveLength(2);
    expect(proj1Nodes.map((n) => n.prompt).sort()).toEqual(['A', 'B']);

    const proj2Nodes = await getNodesByProject('proj-2');
    expect(proj2Nodes).toHaveLength(1);
    expect(proj2Nodes[0].prompt).toBe('C');

    // Non-existent project returns empty
    expect(await getNodesByProject('nonexistent')).toHaveLength(0);
  });

  it('should create and update a job', async () => {
    const job = makeJob();
    await createJob(job);

    const retrieved = await getJob('job-1');
    expect(retrieved).toBeDefined();
    expect(retrieved!.status).toBe('queued');
    expect(retrieved!.progress).toBe(0);

    const updated = await updateJob('job-1', {
      status: 'processing',
      progress: 50,
    });
    expect(updated).toBeDefined();
    expect(updated!.status).toBe('processing');
    expect(updated!.progress).toBe(50);

    // Verify it persisted
    const retrieved2 = await getJob('job-1');
    expect(retrieved2!.status).toBe('processing');

    // Non-existent job
    expect(await getJob('nonexistent')).toBeUndefined();
    expect(await updateJob('nonexistent', { status: 'failed' })).toBeUndefined();
  });

  it('should handle credits CRUD', async () => {
    // Initially undefined
    expect(await getCredits('ws-1')).toBeUndefined();

    // Initialize
    await initCredits('ws-1', 10);
    expect(await getCredits('ws-1')).toBe(10);

    // Decrement
    expect(await decrementCredits('ws-1')).toBe(true);
    expect(await getCredits('ws-1')).toBe(9);

    // Decrement to zero
    await initCredits('ws-2', 1);
    expect(await decrementCredits('ws-2')).toBe(true);
    expect(await getCredits('ws-2')).toBe(0);

    // Cannot decrement past zero
    expect(await decrementCredits('ws-2')).toBe(false);
    expect(await getCredits('ws-2')).toBe(0);

    // Non-existent workspace
    expect(await decrementCredits('nonexistent')).toBe(false);
  });
});
