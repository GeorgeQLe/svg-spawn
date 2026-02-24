import { NextRequest, NextResponse } from 'next/server';
import { getProject } from '@/lib/db/store';
import { serializeSvg } from '@svg-spawn/svg-pipeline';
import { requireSession } from '@/lib/auth';

/**
 * GET /api/projects/[id]
 * Retrieve a project by ID.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const sessionOrRes = await requireSession(request);
    if (sessionOrRes instanceof NextResponse) return sessionOrRes;

    const { id } = await params;
    const project = await getProject(id);

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const processedSvg = project.pipelineResult
      ? serializeSvg(project.pipelineResult.document.root)
      : null;

    return NextResponse.json({
      id: project.id,
      name: project.name,
      originalSvg: project.originalSvg,
      processedSvg,
      summary: project.pipelineResult?.summary ?? null,
      complexity: project.pipelineResult?.complexity ?? null,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
