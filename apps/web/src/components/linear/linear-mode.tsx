'use client';

import { useState, useCallback, type ReactNode } from 'react';
import { ArrowLeft, Sparkles, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { SvgUpload } from '@/components/upload/svg-upload';
import { PromptInput } from '@/components/prompt/prompt-input';
import { AnimatedPreview } from '@/components/preview/animated-preview';
import { ExportDialog } from '@/components/export/export-dialog';
import { useUploadStore } from '@/store/upload-store';
import { useProjectStore } from '@/store/project-store';
import { useGenerationStore } from '@/store/generation-store';
import { useToast } from '@/components/toast/toast-provider';

type Step = 'upload' | 'prompt' | 'preview' | 'export';

const STEPS: Step[] = ['upload', 'prompt', 'preview', 'export'];

const STEP_LABELS: Record<Step, string> = {
  upload: 'Upload SVG',
  prompt: 'Describe Animation',
  preview: 'Preview',
  export: 'Export',
};

interface LinearModeProps {
  viewToggle?: ReactNode;
}

/**
 * Poll a job for completion by checking the API at an interval.
 * Returns the completed job data or throws on failure/timeout.
 */
async function pollJobCompletion(
  projectId: string,
  jobId: string,
  { interval = 1000, maxAttempts = 60 } = {},
): Promise<{ animatedSvg: string }> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((resolve) => setTimeout(resolve, interval));

    const response = await fetch(`/api/projects/${projectId}/jobs/${jobId}`);
    if (!response.ok) {
      throw new Error('Failed to check job status');
    }

    const data = await response.json();

    if (data.status === 'completed' && data.result?.animatedSvg) {
      return { animatedSvg: data.result.animatedSvg };
    }

    if (data.status === 'failed') {
      throw new Error(data.error || 'Generation failed');
    }
  }

  throw new Error('Generation timed out');
}

/**
 * Simulate a mock generation by wrapping the SVG with a simple animation placeholder.
 */
function mockGenerate(svgString: string | null): string | null {
  if (!svgString) return null;
  return svgString.replace(
    '<svg',
    '<svg style="animation: spawn-pulse 2s ease-in-out infinite"',
  );
}

export function LinearMode({ viewToggle }: LinearModeProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>('upload');
  const { svgString } = useUploadStore();
  const { addNode, updateNode, setOriginalSvg, projectId } = useProjectStore();
  const { isGenerating, startGeneration, completeGeneration, failGeneration } =
    useGenerationStore();
  const [animatedSvg, setAnimatedSvg] = useState<string | null>(null);
  const { showToast } = useToast();

  const currentStepIndex = STEPS.indexOf(currentStep);

  const handleSvgUploaded = useCallback(() => {
    if (svgString) {
      setOriginalSvg(svgString);
      setCurrentStep('prompt');
      showToast('SVG uploaded successfully', 'success');
    }
  }, [svgString, setOriginalSvg, showToast]);

  const handlePromptSubmit = useCallback(
    async (prompt: string) => {
      const node = addNode({
        prompt,
        status: 'generating',
        animatedSvg: null,
        error: null,
        parentId: null,
      });

      startGeneration(node.id);

      try {
        // Attempt API call first
        const response = await fetch(`/api/projects/${projectId ?? 'default'}/nodes`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt, svgString }),
        });

        if (response.ok) {
          const { jobId } = await response.json();

          showToast('Generation started', 'info');

          // Poll for job completion
          const result = await pollJobCompletion(projectId ?? 'default', jobId);

          updateNode(node.id, {
            status: 'completed',
            animatedSvg: result.animatedSvg,
          });
          setAnimatedSvg(result.animatedSvg);
          completeGeneration();
          setCurrentStep('preview');
          showToast('Animation generated successfully', 'success');
          return;
        }

        // Non-ok response: fall through to mock
        throw new Error('API returned non-ok response');
      } catch {
        // Fallback to mock generation if API is not available
        try {
          await new Promise((resolve) => setTimeout(resolve, 2000));

          const mockAnimated = mockGenerate(svgString);

          updateNode(node.id, {
            status: 'completed',
            animatedSvg: mockAnimated,
          });
          setAnimatedSvg(mockAnimated);
          completeGeneration();
          setCurrentStep('preview');
          showToast('Preview generated (mock)', 'info');
        } catch {
          updateNode(node.id, {
            status: 'failed',
            error: 'Generation failed. Please try again.',
          });
          failGeneration('Generation failed. Please try again.');
          showToast('Generation failed. Please try again.', 'error');
        }
      }
    },
    [
      svgString,
      projectId,
      addNode,
      updateNode,
      startGeneration,
      completeGeneration,
      failGeneration,
      showToast,
    ],
  );

  const handleTryVariation = useCallback(() => {
    setCurrentStep('prompt');
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/')}
            className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            <span className="text-lg font-semibold text-white">SVG Spawn</span>
          </div>
        </div>

        {/* Step indicator */}
        <nav className="flex items-center gap-2">
          {STEPS.map((step, idx) => (
            <div key={step} className="flex items-center gap-2">
              <div
                className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  idx === currentStepIndex
                    ? 'bg-indigo-600 text-white'
                    : idx < currentStepIndex
                      ? 'bg-gray-700 text-gray-300'
                      : 'bg-gray-800/50 text-gray-500'
                }`}
              >
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-current/20 text-[10px]">
                  {idx + 1}
                </span>
                {STEP_LABELS[step]}
              </div>
              {idx < STEPS.length - 1 && (
                <ChevronRight className="h-3.5 w-3.5 text-gray-600" />
              )}
            </div>
          ))}
        </nav>

        {/* View toggle (or empty spacer) */}
        <div className="flex w-auto min-w-[80px] items-center justify-end">
          {viewToggle ?? <div className="w-20" />}
        </div>
      </header>

      {/* Main content */}
      <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
        {currentStep === 'upload' && (
          <div className="flex flex-col items-center gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">Upload your SVG</h2>
              <p className="mt-1 text-sm text-gray-400">
                Start by uploading the SVG file you want to animate.
              </p>
            </div>
            <SvgUpload />
            {svgString && (
              <button
                onClick={handleSvgUploaded}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
              >
                Continue
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        )}

        {currentStep === 'prompt' && (
          <div className="flex flex-col items-center gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">Describe the animation</h2>
              <p className="mt-1 text-sm text-gray-400">
                Tell us how you want your SVG to animate.
              </p>
            </div>
            <PromptInput onSubmit={handlePromptSubmit} isLoading={isGenerating} />
          </div>
        )}

        {currentStep === 'preview' && (
          <div className="flex flex-col items-center gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">Preview your animation</h2>
              <p className="mt-1 text-sm text-gray-400">
                Here is the generated animation. You can adjust playback or try a variation.
              </p>
            </div>
            <div className="w-full max-w-lg">
              <AnimatedPreview svgString={animatedSvg} />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleTryVariation}
                className="rounded-lg border border-gray-700 bg-gray-800 px-4 py-2 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-700"
              >
                Try a variation
              </button>
              <button
                onClick={() => setCurrentStep('export')}
                className="flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-500"
              >
                Continue to Export
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {currentStep === 'export' && animatedSvg && (
          <div className="flex flex-col items-center gap-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-white">Export your animation</h2>
              <p className="mt-1 text-sm text-gray-400">
                Download the animated SVG file.
              </p>
            </div>
            <div className="w-full max-w-lg">
              <AnimatedPreview svgString={animatedSvg} />
            </div>
            <ExportDialog svgString={animatedSvg} />
          </div>
        )}
      </main>
    </div>
  );
}
