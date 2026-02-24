import { NextRequest, NextResponse } from 'next/server';
import { processUploadedSvg } from '@/lib/server/process-svg';
import { serializeSvg } from '@svg-spawn/svg-pipeline';

/**
 * POST /api/upload
 * Upload an SVG file and process it through the pipeline.
 *
 * Accepts: FormData with an 'svg' file field.
 * Returns: { rawSvg, processedResult }
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('svg');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'svg file is required' }, { status: 400 });
    }

    if (!file.name.endsWith('.svg') && file.type !== 'image/svg+xml') {
      return NextResponse.json({ error: 'File must be an SVG' }, { status: 400 });
    }

    const rawSvg = await file.text();

    if (!rawSvg.trim()) {
      return NextResponse.json({ error: 'SVG file is empty' }, { status: 400 });
    }

    const result = await processUploadedSvg(rawSvg);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error, rawSvg },
        { status: 422 },
      );
    }

    const processedSvg = serializeSvg(result.data.document.root);

    return NextResponse.json({
      rawSvg,
      processedResult: {
        processedSvg,
        summary: result.data.summary,
        complexity: result.data.complexity,
        hadAnimations: result.data.hadAnimations,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
