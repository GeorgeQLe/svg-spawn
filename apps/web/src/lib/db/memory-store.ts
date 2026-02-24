import type { GenerationNode, Job } from '@svg-spawn/core';
import type { StoredProject } from './store';
import type { Store } from './store-interface';

export class MemoryStore implements Store {
  private projects = new Map<string, StoredProject>();
  private nodes = new Map<string, GenerationNode>();
  private jobs = new Map<string, Job>();
  private credits = new Map<string, number>();
  private workspaces = new Map<string, { id: string; ownerId: string; creditsRemaining: number }>();

  async createProject(project: StoredProject): Promise<StoredProject> {
    this.projects.set(project.id, project);
    return project;
  }

  async getProject(id: string): Promise<StoredProject | undefined> {
    return this.projects.get(id);
  }

  async createNode(node: GenerationNode): Promise<GenerationNode> {
    this.nodes.set(node.id, node);
    return node;
  }

  async getNode(id: string): Promise<GenerationNode | undefined> {
    return this.nodes.get(id);
  }

  async updateNode(id: string, updates: Partial<GenerationNode>): Promise<GenerationNode | undefined> {
    const existing = this.nodes.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.nodes.set(id, updated);
    return updated;
  }

  async getNodesByProject(projectId: string): Promise<GenerationNode[]> {
    const result: GenerationNode[] = [];
    for (const node of this.nodes.values()) {
      if (node.projectId === projectId) {
        result.push(node);
      }
    }
    return result;
  }

  async createJob(job: Job): Promise<Job> {
    this.jobs.set(job.id, job);
    return job;
  }

  async getJob(id: string): Promise<Job | undefined> {
    return this.jobs.get(id);
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined> {
    const existing = this.jobs.get(id);
    if (!existing) return undefined;
    const updated = { ...existing, ...updates };
    this.jobs.set(id, updated);
    return updated;
  }

  async initCredits(workspaceId: string, amount: number): Promise<void> {
    this.credits.set(workspaceId, amount);
  }

  async getCredits(workspaceId: string): Promise<number | undefined> {
    return this.credits.get(workspaceId);
  }

  async decrementCredits(workspaceId: string): Promise<boolean> {
    const current = this.credits.get(workspaceId);
    if (current === undefined || current <= 0) return false;
    this.credits.set(workspaceId, current - 1);
    return true;
  }

  async getWorkspaceByOwnerId(ownerId: string): Promise<{ id: string; creditsRemaining: number } | undefined> {
    for (const ws of this.workspaces.values()) {
      if (ws.ownerId === ownerId) {
        return { id: ws.id, creditsRemaining: ws.creditsRemaining };
      }
    }
    return undefined;
  }

  async createWorkspace(ws: { id: string; ownerId: string; creditsRemaining: number }): Promise<void> {
    this.workspaces.set(ws.id, ws);
    this.credits.set(ws.id, ws.creditsRemaining);
  }

  async resetStore(): Promise<void> {
    this.projects.clear();
    this.nodes.clear();
    this.jobs.clear();
    this.credits.clear();
    this.workspaces.clear();
  }
}
