'use client';

import { useMemo } from 'react';
import {
  GenerationNodeCard,
  type NodeStatus,
} from './generation-node-card';

export interface GraphNode {
  id: string;
  prompt: string;
  status: NodeStatus;
  animatedSvg: string | null;
  parentId: string | null;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
}

export interface GraphViewProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  onBranch: (parentId: string) => void;
}

interface LayoutNode {
  id: string;
  x: number;
  y: number;
  depth: number;
}

/**
 * Computes a simple tree layout for the graph nodes.
 * Root nodes (no parentId) are placed at the top row.
 * Children are placed in subsequent rows, arranged left-to-right
 * below their parent.
 */
function computeLayout(
  nodes: GraphNode[],
  edges: GraphEdge[],
): LayoutNode[] {
  if (nodes.length === 0) return [];

  // Build adjacency: parent -> children
  const childrenMap = new Map<string, string[]>();
  for (const edge of edges) {
    const existing = childrenMap.get(edge.source) ?? [];
    existing.push(edge.target);
    childrenMap.set(edge.source, existing);
  }

  // Find root nodes (no incoming edge / no parentId)
  const targetSet = new Set(edges.map((e) => e.target));
  const roots = nodes.filter((n) => !targetSet.has(n.id));

  // If no roots found (all nodes are targets), just use the first node
  if (roots.length === 0 && nodes.length > 0) {
    roots.push(nodes[0]);
  }

  const nodeWidth = 240;
  const nodeHeight = 180;
  const horizontalGap = 32;
  const verticalGap = 64;

  const layoutMap = new Map<string, LayoutNode>();
  const depthCounts = new Map<number, number>();

  function placeNode(nodeId: string, depth: number) {
    if (layoutMap.has(nodeId)) return;

    const col = depthCounts.get(depth) ?? 0;
    depthCounts.set(depth, col + 1);

    layoutMap.set(nodeId, {
      id: nodeId,
      x: col * (nodeWidth + horizontalGap),
      y: depth * (nodeHeight + verticalGap),
      depth,
    });

    const children = childrenMap.get(nodeId) ?? [];
    for (const childId of children) {
      placeNode(childId, depth + 1);
    }
  }

  // Place all roots and their subtrees
  for (const root of roots) {
    placeNode(root.id, 0);
  }

  // Place any orphan nodes not reached
  for (const node of nodes) {
    if (!layoutMap.has(node.id)) {
      placeNode(node.id, 0);
    }
  }

  return Array.from(layoutMap.values());
}

/**
 * Computes the SVG lines for edges between nodes based on layout positions.
 */
function computeEdgeLines(
  edges: GraphEdge[],
  layoutMap: Map<string, LayoutNode>,
): Array<{ id: string; x1: number; y1: number; x2: number; y2: number }> {
  const nodeWidth = 240;
  const nodeHeight = 180;

  return edges
    .map((edge) => {
      const source = layoutMap.get(edge.source);
      const target = layoutMap.get(edge.target);
      if (!source || !target) return null;

      return {
        id: edge.id,
        x1: source.x + nodeWidth / 2,
        y1: source.y + nodeHeight,
        x2: target.x + nodeWidth / 2,
        y2: target.y,
      };
    })
    .filter(
      (line): line is { id: string; x1: number; y1: number; x2: number; y2: number } =>
        line !== null,
    );
}

export function GraphView({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onBranch,
}: GraphViewProps) {
  const nodeMap = useMemo(
    () => new Map(nodes.map((n) => [n.id, n])),
    [nodes],
  );

  const layoutNodes = useMemo(
    () => computeLayout(nodes, edges),
    [nodes, edges],
  );

  const layoutMap = useMemo(
    () => new Map(layoutNodes.map((ln) => [ln.id, ln])),
    [layoutNodes],
  );

  const edgeLines = useMemo(
    () => computeEdgeLines(edges, layoutMap),
    [edges, layoutMap],
  );

  // Compute canvas bounds
  const canvasWidth = useMemo(() => {
    if (layoutNodes.length === 0) return 400;
    const maxX = Math.max(...layoutNodes.map((n) => n.x));
    return maxX + 240 + 64; // nodeWidth + padding
  }, [layoutNodes]);

  const canvasHeight = useMemo(() => {
    if (layoutNodes.length === 0) return 300;
    const maxY = Math.max(...layoutNodes.map((n) => n.y));
    return maxY + 180 + 64; // nodeHeight + padding
  }, [layoutNodes]);

  if (nodes.length === 0) {
    return (
      <div
        data-testid="graph-view-empty"
        className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50"
      >
        <p className="text-sm text-gray-500">
          No nodes yet. Upload an SVG and generate an animation to get started.
        </p>
      </div>
    );
  }

  return (
    <div
      data-testid="graph-view"
      className="overflow-auto rounded-lg border border-gray-200 bg-gray-50"
    >
      <div
        className="relative"
        style={{
          width: `${canvasWidth}px`,
          height: `${canvasHeight}px`,
          minWidth: '100%',
          minHeight: '300px',
        }}
      >
        {/* Edge lines drawn as SVG overlay */}
        <svg
          className="pointer-events-none absolute inset-0"
          width={canvasWidth}
          height={canvasHeight}
          data-testid="graph-edges"
        >
          {edgeLines.map((line) => (
            <line
              key={line.id}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#94a3b8"
              strokeWidth="2"
              strokeDasharray="6 3"
            />
          ))}
        </svg>

        {/* Positioned node cards */}
        {layoutNodes.map((layoutNode) => {
          const node = nodeMap.get(layoutNode.id);
          if (!node) return null;

          return (
            <div
              key={node.id}
              className="absolute"
              style={{
                left: `${layoutNode.x}px`,
                top: `${layoutNode.y}px`,
              }}
            >
              <GenerationNodeCard
                id={node.id}
                prompt={node.prompt}
                status={node.status}
                animatedSvg={node.animatedSvg}
                isSelected={selectedNodeId === node.id}
                onSelect={onSelectNode}
                onBranch={onBranch}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
