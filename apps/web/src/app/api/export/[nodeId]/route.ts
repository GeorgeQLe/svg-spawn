import { NextRequest, NextResponse } from 'next/server';
import { getNode } from '@/lib/db/store';
import { requireSession } from '@/lib/auth';

/**
 * GET /api/export/[nodeId]
 * Export the animated SVG for a node as a downloadable file.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nodeId: string }> },
) {
  try {
    const sessionOrRes = await requireSession(request);
    if (sessionOrRes instanceof NextResponse) return sessionOrRes;

    const { nodeId } = await params;
    const node = await getNode(nodeId);

    if (!node) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 });
    }

    if (!node.animatedSvg) {
      return NextResponse.json(
        { error: 'No animated SVG available for this node' },
        { status: 404 },
      );
    }

    return new NextResponse(node.animatedSvg, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Disposition': `attachment; filename="animated-${nodeId}.svg"`,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
