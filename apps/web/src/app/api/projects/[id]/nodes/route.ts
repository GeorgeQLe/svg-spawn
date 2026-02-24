import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getProject, getNodesByProject, createNode, createJob } from '@/lib/db/store';
import { checkCredits } from '@/lib/billing/credits';
import { jobQueue } from '@/lib/jobs/job-queue';

/**
 * GET /api/projects/[id]/nodes
 * Get all generation nodes for a project.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const project = getProject(id);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const nodes = getNodesByProject(id);
    return NextResponse.json({ nodes });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST /api/projects/[id]/nodes
 * Create a new generation node and enqueue a job.
 *
 * Body: { prompt: string, parentNodeId?: string }
 * Returns: { nodeId, jobId }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: projectId } = await params;
    const project = getProject(projectId);
    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const body = await request.json();
    const { prompt, parentNodeId } = body as { prompt?: string; parentNodeId?: string };

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    // Check credits
    const creditStatus = checkCredits(project.workspaceId);
    if (!creditStatus.hasCredits) {
      return NextResponse.json(
        { error: 'No credits remaining', remaining: 0 },
        { status: 402 },
      );
    }

    const now = new Date().toISOString();
    const nodeId = uuidv4();
    const jobId = uuidv4();

    // Create generation node
    createNode({
      id: nodeId,
      projectId,
      parentNodeId,
      prompt,
      status: 'pending',
      createdAt: now,
    });

    // Create job
    createJob({
      id: jobId,
      nodeId,
      status: 'queued',
      progress: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Enqueue job for processing
    jobQueue.enqueue(jobId);

    return NextResponse.json({ nodeId, jobId });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
