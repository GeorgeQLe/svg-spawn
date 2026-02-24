import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { createProject } from '@/lib/db/store';
import type { StoredProject } from '@/lib/db/store';
import { processUploadedSvg } from '@/lib/server/process-svg';
import { serializeSvg } from '@svg-spawn/svg-pipeline';

/**
 * POST /api/projects
 * Create a new project from an SVG string.
 *
 * Body: { name: string, svg: string }
 * Returns: { id, name, processedSvg, summary, complexity }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, svg } = body as { name?: string; svg?: string };

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }
    if (!svg || typeof svg !== 'string') {
      return NextResponse.json({ error: 'svg is required' }, { status: 400 });
    }

    // Process the SVG through the pipeline
    const result = await processUploadedSvg(svg);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 422 });
    }

    const now = new Date().toISOString();
    const projectId = uuidv4();
    const workspaceId = 'default'; // MVP: single workspace

    const project: StoredProject = {
      id: projectId,
      workspaceId,
      name,
      createdAt: now,
      updatedAt: now,
      originalSvg: svg,
      processedSvgDocumentId: projectId,
      pipelineResult: result.data,
    };

    createProject(project);

    const processedSvg = serializeSvg(result.data.document.root);

    return NextResponse.json({
      id: project.id,
      name: project.name,
      processedSvg,
      summary: result.data.summary,
      complexity: result.data.complexity,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
