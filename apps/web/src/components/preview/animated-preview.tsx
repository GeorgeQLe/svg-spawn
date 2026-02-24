'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Loader2 } from 'lucide-react';

interface AnimatedPreviewProps {
  svgString: string | null;
  isGenerating?: boolean;
}

const SPEED_OPTIONS = [0.5, 1, 2] as const;

export function AnimatedPreview({ svgString, isGenerating = false }: AnimatedPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [speed, setSpeed] = useState<number>(1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const animations = containerRef.current.getAnimations({ subtree: true });
    for (const anim of animations) {
      anim.playbackRate = speed;
      if (isPlaying) {
        anim.play();
      } else {
        anim.pause();
      }
    }
  }, [isPlaying, speed, svgString]);

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-gray-700 bg-gray-900/50 p-12">
        <Loader2 className="h-10 w-10 animate-spin text-indigo-400" />
        <p className="text-sm text-gray-400">Generating animation...</p>
      </div>
    );
  }

  if (!svgString) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-gray-700 bg-gray-900/50 p-12">
        <p className="text-sm text-gray-500">No animation to preview yet.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={containerRef}
        className="flex items-center justify-center overflow-hidden rounded-xl border border-gray-700 bg-white p-4 [&>svg]:max-h-80 [&>svg]:max-w-full [&>svg]:h-auto [&>svg]:w-auto"
        dangerouslySetInnerHTML={{ __html: svgString }}
      />

      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="flex items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3 py-1.5 text-xs font-medium text-gray-300 transition-colors hover:bg-gray-700"
        >
          {isPlaying ? (
            <>
              <Pause className="h-3.5 w-3.5" />
              Pause
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5" />
              Play
            </>
          )}
        </button>

        <div className="flex items-center gap-1">
          {SPEED_OPTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                speed === s
                  ? 'bg-indigo-600 text-white'
                  : 'border border-gray-700 bg-gray-800 text-gray-400 hover:bg-gray-700'
              }`}
            >
              {s}x
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
