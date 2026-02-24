import type { GenerationNode, Job } from '@svg-spawn/core';
import type { StoredProject } from './store';

export interface Store {
  createProject(project: StoredProject): Promise<StoredProject>;
  getProject(id: string): Promise<StoredProject | undefined>;

  createNode(node: GenerationNode): Promise<GenerationNode>;
  getNode(id: string): Promise<GenerationNode | undefined>;
  updateNode(id: string, updates: Partial<GenerationNode>): Promise<GenerationNode | undefined>;
  getNodesByProject(projectId: string): Promise<GenerationNode[]>;

  createJob(job: Job): Promise<Job>;
  getJob(id: string): Promise<Job | undefined>;
  updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined>;

  initCredits(workspaceId: string, amount: number): Promise<void>;
  getCredits(workspaceId: string): Promise<number | undefined>;
  decrementCredits(workspaceId: string): Promise<boolean>;

  resetStore(): Promise<void>;
}
