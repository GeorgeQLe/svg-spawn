'use client';

import { useCallback } from 'react';

export type NodeStatus = 'idle' | 'generating' | 'completed' | 'failed';

export interface GenerationNodeCardProps {
  id: string;
  prompt: string;
  status: NodeStatus;
  animatedSvg: string | null;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onBranch: (id: string) => void;
}

const statusConfig: Record<
  NodeStatus,
  { color: string; pulse: boolean; label: string }
> = {
  idle: { color: 'bg-gray-400', pulse: false, label: 'Idle' },
  generating: { color: 'bg-blue-500', pulse: true, label: 'Generating' },
  completed: { color: 'bg-green-500', pulse: false, label: 'Completed' },
  failed: { color: 'bg-red-500', pulse: false, label: 'Failed' },
};

export function GenerationNodeCard({
  id,
  prompt,
  status,
  animatedSvg,
  isSelected,
  onSelect,
  onBranch,
}: GenerationNodeCardProps) {
  const config = statusConfig[status];

  const handleSelect = useCallback(() => {
    onSelect(id);
  }, [id, onSelect]);

  const handleBranch = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onBranch(id);
    },
    [id, onBranch],
  );

  return (
    <div
      data-testid={`graph-node-${id}`}
      data-node-status={status}
      role="button"
      tabIndex={0}
      onClick={handleSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleSelect();
        }
      }}
      className={`group relative w-56 cursor-pointer rounded-lg border-2 bg-white p-3 shadow-sm transition-all hover:shadow-md ${
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-200'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Status badge */}
      <div className="mb-2 flex items-center gap-2">
        <span
          data-testid={`node-status-${id}`}
          className={`inline-block h-2.5 w-2.5 rounded-full ${config.color} ${
            config.pulse ? 'animate-pulse' : ''
          }`}
        />
        <span className="text-xs font-medium text-gray-500">
          {config.label}
        </span>
      </div>

      {/* SVG thumbnail */}
      {status === 'completed' && animatedSvg && (
        <div
          data-testid={`node-thumbnail-${id}`}
          className="mb-2 flex h-24 items-center justify-center overflow-hidden rounded border border-gray-100 bg-gray-50"
          dangerouslySetInnerHTML={{ __html: animatedSvg }}
        />
      )}

      {/* Generating placeholder */}
      {status === 'generating' && (
        <div className="mb-2 flex h-24 items-center justify-center rounded border border-gray-100 bg-gray-50">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
        </div>
      )}

      {/* Prompt text (truncated) */}
      <p
        className="line-clamp-2 text-sm text-gray-700"
        title={prompt}
      >
        {prompt || 'No prompt'}
      </p>

      {/* Branch button (visible on hover) */}
      {status === 'completed' && (
        <button
          data-testid={`node-branch-${id}`}
          onClick={handleBranch}
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 opacity-0 shadow-sm transition-opacity hover:bg-gray-50 group-hover:opacity-100"
        >
          Branch
        </button>
      )}
    </div>
  );
}
