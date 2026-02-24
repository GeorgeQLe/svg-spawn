import { processSvg } from '@svg-spawn/svg-pipeline';

/**
 * Server-side function that takes raw SVG string, runs it through
 * the svg-pipeline, and returns the processed result.
 */
export async function processUploadedSvg(rawSvg: string) {
  const result = processSvg(rawSvg);
  if (!result.ok) {
    return { success: false as const, error: result.error.message };
  }
  return { success: true as const, data: result.value };
}
