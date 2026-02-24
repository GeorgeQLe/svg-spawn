import type { SvgElement } from '@svg-spawn/core';
import { generateAnimationPlan, MockAiClient, GeminiClient } from '@svg-spawn/ai-client';
import type { AiClient } from '@svg-spawn/ai-client';
import { compile } from '@svg-spawn/compiler';
import { serializeSvg } from '@svg-spawn/svg-pipeline';
import { getJob, updateJob, getNode, updateNode, getProject } from '@/lib/db/store';
import { consumeCredit } from '@/lib/billing/credits';
import { getEnvConfig } from '@/lib/env';

/**
 * Collect all nodeUid values from an SvgElement tree.
 */
function collectNodeUids(element: SvgElement): string[] {
  const uids: string[] = [element.nodeUid];
  for (const child of element.children) {
    uids.push(...collectNodeUids(child));
  }
  return uids;
}

/**
 * Get or create an AI client.
 * Uses real Gemini client if API key is configured, otherwise uses MockAiClient.
 */
function getAiClient(): AiClient {
  const { geminiApiKey, geminiModelId } = getEnvConfig();
  if (geminiApiKey) {
    return new GeminiClient(geminiApiKey, geminiModelId);
  }
  // Fallback to mock for development/testing
  return new MockAiClient([]);
}

/**
 * Process a generation job through the full pipeline:
 * 1. Get job + node from store
 * 2. Update job status to 'processing'
 * 3. Get project's SVG, run through pipeline
 * 4. Call AI client (generateAnimationPlan)
 * 5. Compile the animation plan with the compiler
 * 6. Update node with animated SVG
 * 7. Update job status to 'completed'
 * 8. Decrement credits on success only
 *
 * On failure: update node/job to 'failed', do NOT decrement credits.
 */
export async function processGenerationJob(jobId: string): Promise<void> {
  const job = getJob(jobId);
  if (!job) {
    console.error(`[job-worker] Job not found: ${jobId}`);
    return;
  }

  const node = getNode(job.nodeId);
  if (!node) {
    updateJob(jobId, {
      status: 'failed',
      error: 'Generation node not found',
      updatedAt: new Date().toISOString(),
    });
    return;
  }

  const project = getProject(node.projectId);
  if (!project) {
    updateJob(jobId, {
      status: 'failed',
      error: 'Project not found',
      updatedAt: new Date().toISOString(),
    });
    updateNode(node.id, {
      status: 'failed',
      error: 'Project not found',
    });
    return;
  }

  // Update to processing
  updateJob(jobId, {
    status: 'processing',
    progress: 10,
    updatedAt: new Date().toISOString(),
  });
  updateNode(node.id, { status: 'generating' });

  try {
    // Ensure we have a pipeline result
    const pipelineResult = project.pipelineResult;
    if (!pipelineResult) {
      throw new Error('Project has no processed SVG data');
    }

    updateJob(jobId, { progress: 30, updatedAt: new Date().toISOString() });

    // Collect valid node UIDs from the SVG document
    const validNodeUids = collectNodeUids(pipelineResult.document.root);

    // Get AI client
    const client = getAiClient();

    // Generate animation plan
    const rawSvg = serializeSvg(pipelineResult.document.root);
    const planResult = await generateAnimationPlan({
      client,
      summary: pipelineResult.summary,
      userPrompt: node.prompt,
      validNodeUids,
      svgDocumentId: project.processedSvgDocumentId ?? project.id,
      rawSvg,
    });

    if (!planResult.ok) {
      throw new Error(`AI generation failed: ${planResult.error.message}`);
    }

    updateJob(jobId, { progress: 60, updatedAt: new Date().toISOString() });

    // Compile animation plan into animated SVG
    const compileResult = compile(planResult.value, pipelineResult.document);
    if (!compileResult.ok) {
      throw new Error(`Compilation failed: ${compileResult.error.message}`);
    }

    updateJob(jobId, { progress: 90, updatedAt: new Date().toISOString() });

    // Update node with result
    updateNode(node.id, {
      status: 'completed',
      animatedSvg: compileResult.value,
    });

    // Update job as completed
    updateJob(jobId, {
      status: 'completed',
      progress: 100,
      result: compileResult.value,
      updatedAt: new Date().toISOString(),
    });

    // Decrement credits only on success
    consumeCredit(project.workspaceId);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    updateNode(node.id, {
      status: 'failed',
      error: errorMessage,
    });

    updateJob(jobId, {
      status: 'failed',
      error: errorMessage,
      updatedAt: new Date().toISOString(),
    });

    // Do NOT decrement credits on failure
  }
}
