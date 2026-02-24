import { eq, sql } from 'drizzle-orm';
import type { GenerationNode, Job } from '@svg-spawn/core';
import type { PipelineResult } from '@svg-spawn/svg-pipeline';
import type { StoredProject } from './store';
import type { Store } from './store-interface';
import { getDb } from './connection';
import { workspaces, projects, generationNodes, jobs } from './schema';

export class PgStore implements Store {
  private get db() {
    return getDb();
  }

  async createProject(project: StoredProject): Promise<StoredProject> {
    await this.db.insert(projects).values({
      id: project.id,
      workspaceId: project.workspaceId,
      name: project.name,
      originalSvg: project.originalSvg,
      processedSvgDocumentId: project.processedSvgDocumentId ?? null,
      pipelineResult: project.pipelineResult ?? null,
      createdAt: new Date(project.createdAt),
      updatedAt: new Date(project.updatedAt),
    });
    return project;
  }

  async getProject(id: string): Promise<StoredProject | undefined> {
    const rows = await this.db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (rows.length === 0) return undefined;
    return this.rowToProject(rows[0]);
  }

  async createNode(node: GenerationNode): Promise<GenerationNode> {
    await this.db.insert(generationNodes).values({
      id: node.id,
      projectId: node.projectId,
      parentNodeId: node.parentNodeId ?? null,
      prompt: node.prompt,
      status: node.status,
      animationPlanId: node.animationPlanId ?? null,
      animatedSvg: node.animatedSvg ?? null,
      error: node.error ?? null,
      createdAt: new Date(node.createdAt),
    });
    return node;
  }

  async getNode(id: string): Promise<GenerationNode | undefined> {
    const rows = await this.db.select().from(generationNodes).where(eq(generationNodes.id, id)).limit(1);
    if (rows.length === 0) return undefined;
    return this.rowToNode(rows[0]);
  }

  async updateNode(id: string, updates: Partial<GenerationNode>): Promise<GenerationNode | undefined> {
    const setValues: Record<string, unknown> = {};
    if (updates.status !== undefined) setValues.status = updates.status;
    if (updates.animatedSvg !== undefined) setValues.animatedSvg = updates.animatedSvg;
    if (updates.animationPlanId !== undefined) setValues.animationPlanId = updates.animationPlanId;
    if (updates.error !== undefined) setValues.error = updates.error;
    if (updates.parentNodeId !== undefined) setValues.parentNodeId = updates.parentNodeId;

    if (Object.keys(setValues).length === 0) {
      return this.getNode(id);
    }

    const rows = await this.db
      .update(generationNodes)
      .set(setValues)
      .where(eq(generationNodes.id, id))
      .returning();

    if (rows.length === 0) return undefined;
    return this.rowToNode(rows[0]);
  }

  async getNodesByProject(projectId: string): Promise<GenerationNode[]> {
    const rows = await this.db
      .select()
      .from(generationNodes)
      .where(eq(generationNodes.projectId, projectId));
    return rows.map((r) => this.rowToNode(r));
  }

  async createJob(job: Job): Promise<Job> {
    await this.db.insert(jobs).values({
      id: job.id,
      nodeId: job.nodeId,
      status: job.status,
      progress: job.progress,
      result: job.result ?? null,
      error: job.error ?? null,
      createdAt: new Date(job.createdAt),
      updatedAt: new Date(job.updatedAt),
    });
    return job;
  }

  async getJob(id: string): Promise<Job | undefined> {
    const rows = await this.db.select().from(jobs).where(eq(jobs.id, id)).limit(1);
    if (rows.length === 0) return undefined;
    return this.rowToJob(rows[0]);
  }

  async updateJob(id: string, updates: Partial<Job>): Promise<Job | undefined> {
    const setValues: Record<string, unknown> = {};
    if (updates.status !== undefined) setValues.status = updates.status;
    if (updates.progress !== undefined) setValues.progress = updates.progress;
    if (updates.result !== undefined) setValues.result = updates.result;
    if (updates.error !== undefined) setValues.error = updates.error;
    if (updates.updatedAt !== undefined) setValues.updatedAt = new Date(updates.updatedAt);

    if (Object.keys(setValues).length === 0) {
      return this.getJob(id);
    }

    const rows = await this.db
      .update(jobs)
      .set(setValues)
      .where(eq(jobs.id, id))
      .returning();

    if (rows.length === 0) return undefined;
    return this.rowToJob(rows[0]);
  }

  async initCredits(workspaceId: string, amount: number): Promise<void> {
    await this.db
      .insert(workspaces)
      .values({ id: workspaceId, creditsRemaining: amount })
      .onConflictDoUpdate({
        target: workspaces.id,
        set: { creditsRemaining: amount },
      });
  }

  async getCredits(workspaceId: string): Promise<number | undefined> {
    const rows = await this.db
      .select({ creditsRemaining: workspaces.creditsRemaining })
      .from(workspaces)
      .where(eq(workspaces.id, workspaceId))
      .limit(1);
    if (rows.length === 0) return undefined;
    return rows[0].creditsRemaining;
  }

  async decrementCredits(workspaceId: string): Promise<boolean> {
    const rows = await this.db
      .update(workspaces)
      .set({
        creditsRemaining: sql`${workspaces.creditsRemaining} - 1`,
      })
      .where(
        sql`${workspaces.id} = ${workspaceId} AND ${workspaces.creditsRemaining} > 0`,
      )
      .returning({ creditsRemaining: workspaces.creditsRemaining });
    return rows.length > 0;
  }

  async resetStore(): Promise<void> {
    await this.db.delete(jobs);
    await this.db.delete(generationNodes);
    await this.db.delete(projects);
    await this.db.delete(workspaces);
  }

  // ── Row → domain type mappers ──────────────────────────────────────────

  private rowToProject(row: typeof projects.$inferSelect): StoredProject {
    return {
      id: row.id,
      workspaceId: row.workspaceId,
      name: row.name,
      originalSvg: row.originalSvg,
      processedSvgDocumentId: row.processedSvgDocumentId ?? undefined,
      pipelineResult: (row.pipelineResult as PipelineResult) ?? undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private rowToNode(row: typeof generationNodes.$inferSelect): GenerationNode {
    return {
      id: row.id,
      projectId: row.projectId,
      parentNodeId: row.parentNodeId ?? undefined,
      prompt: row.prompt,
      status: row.status as GenerationNode['status'],
      animationPlanId: row.animationPlanId ?? undefined,
      animatedSvg: row.animatedSvg ?? undefined,
      error: row.error ?? undefined,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private rowToJob(row: typeof jobs.$inferSelect): Job {
    return {
      id: row.id,
      nodeId: row.nodeId,
      status: row.status as Job['status'],
      progress: row.progress,
      result: row.result ?? undefined,
      error: row.error ?? undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
