'use client';

import { useCallback } from 'react';
import type { NodeStatus } from '../graph/generation-node-card';

export interface NodeDetailPanelProps {
  node: {
    id: string;
    prompt: string;
    status: NodeStatus;
    animatedSvg: string | null;
    errorMessage: string | null;
    createdAt: string;
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onRetry: (nodeId: string) => void;
  onBranch: (nodeId: string) => void;
}

const statusLabels: Record<NodeStatus, string> = {
  idle: 'Idle',
  generating: 'Generating...',
  completed: 'Completed',
  failed: 'Failed',
};

const statusColors: Record<NodeStatus, string> = {
  idle: 'bg-gray-100 text-gray-700',
  generating: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
  failed: 'bg-red-100 text-red-700',
};

export function NodeDetailPanel({
  node,
  isOpen,
  onClose,
  onRetry,
  onBranch,
}: NodeDetailPanelProps) {
  const handleRetry = useCallback(() => {
    if (node) onRetry(node.id);
  }, [node, onRetry]);

  const handleBranch = useCallback(() => {
    if (node) onBranch(node.id);
  }, [node, onBranch]);

  if (!isOpen || !node) return null;

  const formattedDate = (() => {
    try {
      return new Date(node.createdAt).toLocaleString();
    } catch {
      return node.createdAt;
    }
  })();

  return (
    <div
      data-testid="node-detail-panel"
      className="fixed right-0 top-0 z-40 flex h-full w-96 flex-col border-l border-gray-200 bg-white shadow-xl transition-transform"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <h2 className="text-lg font-semibold text-gray-900">Node Details</h2>
        <button
          data-testid="node-detail-close"
          onClick={onClose}
          className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Close panel"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Status badge */}
        <div className="mb-4">
          <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Status
          </span>
          <div className="mt-1">
            <span
              data-testid="node-detail-status"
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[node.status]}`}
            >
              {node.status === 'generating' && (
                <span className="mr-1.5 h-2 w-2 animate-pulse rounded-full bg-blue-500" />
              )}
              {statusLabels[node.status]}
            </span>
          </div>
        </div>

        {/* Generating progress indicator */}
        {node.status === 'generating' && (
          <div
            data-testid="node-detail-progress"
            className="mb-4 rounded-lg border border-blue-200 bg-blue-50 p-3"
          >
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
              <span className="text-sm text-blue-700">
                Generating animation...
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-blue-200">
              <div className="h-full animate-pulse rounded-full bg-blue-500" style={{ width: '60%' }} />
            </div>
          </div>
        )}

        {/* SVG Preview */}
        {node.status === 'completed' && node.animatedSvg && (
          <div className="mb-4">
            <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
              Preview
            </span>
            <div
              data-testid="node-detail-preview"
              className="mt-1 flex items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white p-2"
              style={{ minHeight: '200px' }}
              dangerouslySetInnerHTML={{ __html: node.animatedSvg }}
            />
          </div>
        )}

        {/* Error message */}
        {node.status === 'failed' && node.errorMessage && (
          <div
            data-testid="node-detail-error"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3"
          >
            <p className="text-sm font-medium text-red-800">Error</p>
            <p className="mt-1 text-sm text-red-700">{node.errorMessage}</p>
          </div>
        )}

        {/* Prompt */}
        <div className="mb-4">
          <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Prompt
          </span>
          <p
            data-testid="node-detail-prompt"
            className="mt-1 whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700"
          >
            {node.prompt || 'No prompt provided'}
          </p>
        </div>

        {/* Timestamp */}
        <div className="mb-4">
          <span className="text-xs font-medium uppercase tracking-wider text-gray-500">
            Created
          </span>
          <p
            data-testid="node-detail-timestamp"
            className="mt-1 text-sm text-gray-600"
          >
            {formattedDate}
          </p>
        </div>
      </div>

      {/* Footer actions */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex gap-2">
          {node.status === 'failed' && (
            <button
              data-testid="node-detail-retry"
              onClick={handleRetry}
              className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
            >
              Retry
            </button>
          )}
          {node.status === 'completed' && (
            <button
              data-testid="node-detail-branch"
              onClick={handleBranch}
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
            >
              Branch from this
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
