'use client';

import { useCallback } from 'react';
import { LinearMode } from '@/components/linear/linear-mode';
import { GraphView, type GraphNode, type GraphEdge } from '@/components/graph/graph-view';
import { NodeDetailPanel } from '@/components/node/node-detail-panel';
import { ViewToggle } from '@/components/view-toggle';
import { ToastProvider } from '@/components/toast/toast-provider';
import { ErrorBoundary } from '@/components/error-boundary';
import { useProjectStore } from '@/store/project-store';

export default function ProjectPage() {
  const viewMode = useProjectStore((s) => s.viewMode);
  const setViewMode = useProjectStore((s) => s.setViewMode);
  const nodes = useProjectStore((s) => s.nodes);
  const edges = useProjectStore((s) => s.edges);
  const selectedNodeId = useProjectStore((s) => s.selectedNodeId);
  const selectNode = useProjectStore((s) => s.selectNode);

  // Convert Map<string, GenerationNodeState> to array for GraphView
  const graphNodes: GraphNode[] = Array.from(nodes.values()).map((n) => ({
    id: n.id,
    prompt: n.prompt,
    status: n.status,
    animatedSvg: n.animatedSvg,
    parentId: n.parentId,
  }));

  const graphEdges: GraphEdge[] = edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
  }));

  // Get the selected node for the detail panel
  const selectedNode = selectedNodeId ? nodes.get(selectedNodeId) ?? null : null;
  const detailNode = selectedNode
    ? {
        id: selectedNode.id,
        prompt: selectedNode.prompt,
        status: selectedNode.status,
        animatedSvg: selectedNode.animatedSvg,
        errorMessage: selectedNode.error,
        createdAt: new Date(selectedNode.createdAt).toISOString(),
      }
    : null;

  const handleCloseDetail = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  const handleRetry = useCallback(
    (_nodeId: string) => {
      // Retry logic: switch to linear mode prompt step
      // For now, just deselect and switch to linear
      selectNode(null);
      setViewMode('linear');
    },
    [selectNode, setViewMode],
  );

  const handleBranch = useCallback(
    (_parentId: string) => {
      // Branch logic: switch to linear mode for new prompt
      // For now, just deselect and switch to linear
      selectNode(null);
      setViewMode('linear');
    },
    [selectNode, setViewMode],
  );

  return (
    <ToastProvider>
      <ErrorBoundary>
        <div className="min-h-screen bg-gray-950">
          {viewMode === 'linear' ? (
            <LinearMode
              viewToggle={
                <ViewToggle activeView={viewMode} onViewChange={setViewMode} />
              }
            />
          ) : (
            <div className="flex min-h-screen flex-col">
              {/* Graph view header */}
              <header className="flex items-center justify-between border-b border-gray-800 px-6 py-4">
                <h1 className="text-lg font-semibold text-white">Generation Graph</h1>
                <ViewToggle activeView={viewMode} onViewChange={setViewMode} />
              </header>

              {/* Graph view content */}
              <main className="flex-1 p-6">
                <GraphView
                  nodes={graphNodes}
                  edges={graphEdges}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={selectNode}
                  onBranch={handleBranch}
                />
              </main>

              {/* Node detail panel (slides in from right) */}
              <NodeDetailPanel
                node={detailNode}
                isOpen={selectedNodeId !== null}
                onClose={handleCloseDetail}
                onRetry={handleRetry}
                onBranch={handleBranch}
              />
            </div>
          )}
        </div>
      </ErrorBoundary>
    </ToastProvider>
  );
}
