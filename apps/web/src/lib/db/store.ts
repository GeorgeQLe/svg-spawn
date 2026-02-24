import type { Project, GenerationNode, Job } from '@svg-spawn/core';
import type { PipelineResult } from '@svg-spawn/svg-pipeline';
import type { Store } from './store-interface';
import { MemoryStore } from './memory-store';

/**
 * Extended project stored in the DB.
 * Includes the processed pipeline result alongside the core Project fields.
 */
export interface StoredProject extends Project {
  pipelineResult?: PipelineResult;
}

function createStore(): Store {
  if (process.env.DATABASE_URL) {
    // Dynamic import to avoid loading postgres.js when not needed
    const { PgStore } = require('./pg-store');
    return new PgStore();
  }
  return new MemoryStore();
}

const store: Store = createStore();

// ── Project CRUD ──────────────────────────────────────────────────────────

export function createProject(project: StoredProject): Promise<StoredProject> {
  return store.createProject(project);
}

export function getProject(id: string): Promise<StoredProject | undefined> {
  return store.getProject(id);
}

// ── Node CRUD ─────────────────────────────────────────────────────────────

export function createNode(node: GenerationNode): Promise<GenerationNode> {
  return store.createNode(node);
}

export function getNode(id: string): Promise<GenerationNode | undefined> {
  return store.getNode(id);
}

export function updateNode(id: string, updates: Partial<GenerationNode>): Promise<GenerationNode | undefined> {
  return store.updateNode(id, updates);
}

export function getNodesByProject(projectId: string): Promise<GenerationNode[]> {
  return store.getNodesByProject(projectId);
}

// ── Job CRUD ──────────────────────────────────────────────────────────────

export function createJob(job: Job): Promise<Job> {
  return store.createJob(job);
}

export function getJob(id: string): Promise<Job | undefined> {
  return store.getJob(id);
}

export function updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined> {
  return store.updateJob(id, updates);
}

// ── Credits CRUD ──────────────────────────────────────────────────────────

export function initCredits(workspaceId: string, amount: number): Promise<void> {
  return store.initCredits(workspaceId, amount);
}

export function getCredits(workspaceId: string): Promise<number | undefined> {
  return store.getCredits(workspaceId);
}

export function decrementCredits(workspaceId: string): Promise<boolean> {
  return store.decrementCredits(workspaceId);
}

// ── Workspace CRUD ───────────────────────────────────────────────────────

export function getWorkspaceByOwnerId(ownerId: string): Promise<{ id: string; creditsRemaining: number } | undefined> {
  return store.getWorkspaceByOwnerId(ownerId);
}

export function createWorkspace(ws: { id: string; ownerId: string; creditsRemaining: number }): Promise<void> {
  return store.createWorkspace(ws);
}

/**
 * Reset the store. Primarily for testing.
 */
export function resetStore(): Promise<void> {
  return store.resetStore();
}
