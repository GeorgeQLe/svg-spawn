'use client';

export type ViewMode = 'linear' | 'graph';

export interface ViewToggleProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

export function ViewToggle({ activeView, onViewChange }: ViewToggleProps) {
  return (
    <div
      data-testid="view-toggle"
      className="inline-flex rounded-lg border border-gray-200 bg-gray-100 p-0.5"
      role="tablist"
      aria-label="View mode"
    >
      <button
        role="tab"
        aria-selected={activeView === 'linear'}
        data-testid="view-toggle-linear"
        onClick={() => onViewChange('linear')}
        className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
          activeView === 'linear'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Linear
      </button>
      <button
        role="tab"
        aria-selected={activeView === 'graph'}
        data-testid="view-toggle-graph"
        onClick={() => onViewChange('graph')}
        className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
          activeView === 'graph'
            ? 'bg-white text-gray-900 shadow-sm'
            : 'text-gray-600 hover:text-gray-900'
        }`}
      >
        Graph
      </button>
    </div>
  );
}
