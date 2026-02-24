import { NextRequest, NextResponse } from 'next/server';
import { getJob } from '@/lib/db/store';

/**
 * GET /api/jobs/[id]
 * Get job status for polling.
 *
 * Returns: { id, status, progress, nodeId, error? }
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const job = await getJob(id);

    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: job.id,
      status: job.status,
      progress: job.progress,
      nodeId: job.nodeId,
      ...(job.error ? { error: job.error } : {}),
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
