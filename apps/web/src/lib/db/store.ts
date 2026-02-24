import type { Project, GenerationNode, Job } from '@svg-spawn/core';
import type { PipelineResult } from '@svg-spawn/svg-pipeline';

/**
 * Extended project stored in the in-memory DB.
 * Includes the processed pipeline result alongside the core Project fields.
 */
export interface StoredProject extends Project {
  pipelineResult?: PipelineResult;
}

/**
 * In-memory data store for MVP. Resets on server restart.
 */
interface InMemoryStore {
  projects: Map<string, StoredProject>;
  nodes: Map<string, GenerationNode>;
  jobs: Map<string, Job>;
  credits: Map<string, number>; // workspaceId -> remaining credits
}

function createInMemoryStore(): InMemoryStore {
  return {
    projects: new Map(),
    nodes: new Map(),
    jobs: new Map(),
    credits: new Map(),
  };
}

/** Singleton in-memory database instance. */
export const db = createInMemoryStore();

// ── Project CRUD ──────────────────────────────────────────────────────────

export function createProject(project: StoredProject): StoredProject {
  db.projects.set(project.id, project);
  return project;
}

export function getProject(id: string): StoredProject | undefined {
  return db.projects.get(id);
}

// ── Node CRUD ─────────────────────────────────────────────────────────────

export function createNode(node: GenerationNode): GenerationNode {
  db.nodes.set(node.id, node);
  return node;
}

export function getNode(id: string): GenerationNode | undefined {
  return db.nodes.get(id);
}

export function updateNode(id: string, updates: Partial<GenerationNode>): GenerationNode | undefined {
  const existing = db.nodes.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates };
  db.nodes.set(id, updated);
  return updated;
}

export function getNodesByProject(projectId: string): GenerationNode[] {
  const result: GenerationNode[] = [];
  for (const node of db.nodes.values()) {
    if (node.projectId === projectId) {
      result.push(node);
    }
  }
  return result;
}

// ── Job CRUD ──────────────────────────────────────────────────────────────

export function createJob(job: Job): Job {
  db.jobs.set(job.id, job);
  return job;
}

export function getJob(id: string): Job | undefined {
  return db.jobs.get(id);
}

export function updateJob(id: string, updates: Partial<Job>): Job | undefined {
  const existing = db.jobs.get(id);
  if (!existing) return undefined;
  const updated = { ...existing, ...updates };
  db.jobs.set(id, updated);
  return updated;
}

// ── Credits CRUD ──────────────────────────────────────────────────────────

export function initCredits(workspaceId: string, amount: number): void {
  db.credits.set(workspaceId, amount);
}

export function getCredits(workspaceId: string): number | undefined {
  return db.credits.get(workspaceId);
}

export function decrementCredits(workspaceId: string): boolean {
  const current = db.credits.get(workspaceId);
  if (current === undefined || current <= 0) return false;
  db.credits.set(workspaceId, current - 1);
  return true;
}

/**
 * Reset the store. Primarily for testing.
 */
export function resetStore(): void {
  db.projects.clear();
  db.nodes.clear();
  db.jobs.clear();
  db.credits.clear();
}
