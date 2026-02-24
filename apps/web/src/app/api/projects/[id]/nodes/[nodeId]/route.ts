import { NextRequest, NextResponse } from 'next/server';
import { getNode } from '@/lib/db/store';
import { requireSession } from '@/lib/auth';

/**
 * GET /api/projects/[id]/nodes/[nodeId]
 * Get a specific generation node by ID.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; nodeId: string }> },
) {
  try {
    const sessionOrRes = await requireSession(request);
    if (sessionOrRes instanceof NextResponse) return sessionOrRes;

    const { nodeId } = await params;
    const node = await getNode(nodeId);

    if (!node) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 });
    }

    return NextResponse.json(node);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
