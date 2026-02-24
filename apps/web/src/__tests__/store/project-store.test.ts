import { describe, it, expect, beforeEach } from 'vitest';
import { useProjectStore } from '@/store/project-store';

describe('project-store', () => {
  beforeEach(() => {
    useProjectStore.getState().reset();
  });

  it('should have empty initial state', () => {
    const state = useProjectStore.getState();
    expect(state.projectId).toBeNull();
    expect(state.projectName).toBe('Untitled Project');
    expect(state.originalSvg).toBeNull();
    expect(state.processedSvg).toBeNull();
    expect(state.nodes.size).toBe(0);
    expect(state.edges).toEqual([]);
    expect(state.selectedNodeId).toBeNull();
    expect(state.viewMode).toBe('linear');
  });

  it('should store original SVG with setOriginalSvg', () => {
    const svg = '<svg><circle r="10"/></svg>';
    useProjectStore.getState().setOriginalSvg(svg);
    expect(useProjectStore.getState().originalSvg).toBe(svg);
  });

  it('should store processed SVG with setProcessedSvg', () => {
    const svg = '<svg data-processed><circle r="10"/></svg>';
    useProjectStore.getState().setProcessedSvg(svg);
    expect(useProjectStore.getState().processedSvg).toBe(svg);
  });

  it('should create node with correct defaults via addNode', () => {
    const node = useProjectStore.getState().addNode({
      prompt: 'Make it bounce',
      status: 'idle',
      animatedSvg: null,
      error: null,
      parentId: null,
    });

    expect(node.id).toBeDefined();
    expect(node.id.length).toBeGreaterThan(0);
    expect(node.prompt).toBe('Make it bounce');
    expect(node.status).toBe('idle');
    expect(node.animatedSvg).toBeNull();
    expect(node.error).toBeNull();
    expect(node.parentId).toBeNull();
    expect(node.createdAt).toBeGreaterThan(0);

    const nodes = useProjectStore.getState().nodes;
    expect(nodes.size).toBe(1);
    expect(nodes.get(node.id)).toEqual(node);
  });

  it('should update an existing node via updateNode', () => {
    const node = useProjectStore.getState().addNode({
      prompt: 'Spin it',
      status: 'idle',
      animatedSvg: null,
      error: null,
      parentId: null,
    });

    useProjectStore.getState().updateNode(node.id, {
      status: 'completed',
      animatedSvg: '<svg animated/>',
    });

    const updated = useProjectStore.getState().nodes.get(node.id);
    expect(updated).toBeDefined();
    expect(updated!.status).toBe('completed');
    expect(updated!.animatedSvg).toBe('<svg animated/>');
    expect(updated!.prompt).toBe('Spin it');
  });

  it('should not throw when updating a non-existent node', () => {
    expect(() => {
      useProjectStore.getState().updateNode('nonexistent', { status: 'failed' });
    }).not.toThrow();
    expect(useProjectStore.getState().nodes.size).toBe(0);
  });

  it('should create edge via addEdge', () => {
    const node1 = useProjectStore.getState().addNode({
      prompt: 'Bounce',
      status: 'completed',
      animatedSvg: '<svg/>',
      error: null,
      parentId: null,
    });
    const node2 = useProjectStore.getState().addNode({
      prompt: 'Bounce faster',
      status: 'idle',
      animatedSvg: null,
      error: null,
      parentId: node1.id,
    });

    useProjectStore.getState().addEdge({
      source: node1.id,
      target: node2.id,
      type: 'branch',
    });

    const edges = useProjectStore.getState().edges;
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe(node1.id);
    expect(edges[0].target).toBe(node2.id);
    expect(edges[0].type).toBe('branch');
    expect(edges[0].id).toBeDefined();
  });

  it('should set selected node via selectNode', () => {
    const node = useProjectStore.getState().addNode({
      prompt: 'Fade in',
      status: 'idle',
      animatedSvg: null,
      error: null,
      parentId: null,
    });

    useProjectStore.getState().selectNode(node.id);
    expect(useProjectStore.getState().selectedNodeId).toBe(node.id);
  });

  it('should set selectedNodeId to null when selecting a nonexistent node', () => {
    const node = useProjectStore.getState().addNode({
      prompt: 'Test',
      status: 'idle',
      animatedSvg: null,
      error: null,
      parentId: null,
    });
    useProjectStore.getState().selectNode(node.id);
    expect(useProjectStore.getState().selectedNodeId).toBe(node.id);

    useProjectStore.getState().selectNode('nonexistent-id');
    expect(useProjectStore.getState().selectedNodeId).toBeNull();
  });

  it('should switch view mode via setViewMode', () => {
    expect(useProjectStore.getState().viewMode).toBe('linear');
    useProjectStore.getState().setViewMode('graph');
    expect(useProjectStore.getState().viewMode).toBe('graph');
    useProjectStore.getState().setViewMode('linear');
    expect(useProjectStore.getState().viewMode).toBe('linear');
  });

  it('should clear all state via reset', () => {
    useProjectStore.getState().setOriginalSvg('<svg/>');
    useProjectStore.getState().setProcessedSvg('<svg processed/>');
    useProjectStore.getState().addNode({
      prompt: 'Test',
      status: 'idle',
      animatedSvg: null,
      error: null,
      parentId: null,
    });
    useProjectStore.getState().setViewMode('graph');

    useProjectStore.getState().reset();

    const state = useProjectStore.getState();
    expect(state.originalSvg).toBeNull();
    expect(state.processedSvg).toBeNull();
    expect(state.nodes.size).toBe(0);
    expect(state.edges).toEqual([]);
    expect(state.selectedNodeId).toBeNull();
    expect(state.viewMode).toBe('linear');
  });

  it('should support multiple coexisting nodes', () => {
    const node1 = useProjectStore.getState().addNode({
      prompt: 'Bounce',
      status: 'idle',
      animatedSvg: null,
      error: null,
      parentId: null,
    });
    const node2 = useProjectStore.getState().addNode({
      prompt: 'Spin',
      status: 'generating',
      animatedSvg: null,
      error: null,
      parentId: null,
    });
    const node3 = useProjectStore.getState().addNode({
      prompt: 'Fade',
      status: 'completed',
      animatedSvg: '<svg animated/>',
      error: null,
      parentId: node1.id,
    });

    const nodes = useProjectStore.getState().nodes;
    expect(nodes.size).toBe(3);
    expect(nodes.get(node1.id)?.prompt).toBe('Bounce');
    expect(nodes.get(node2.id)?.prompt).toBe('Spin');
    expect(nodes.get(node3.id)?.prompt).toBe('Fade');
    expect(nodes.get(node3.id)?.parentId).toBe(node1.id);
  });

  it('should deselect node via selectNode(null)', () => {
    const node = useProjectStore.getState().addNode({
      prompt: 'Test',
      status: 'idle',
      animatedSvg: null,
      error: null,
      parentId: null,
    });
    useProjectStore.getState().selectNode(node.id);
    expect(useProjectStore.getState().selectedNodeId).toBe(node.id);

    useProjectStore.getState().selectNode(null);
    expect(useProjectStore.getState().selectedNodeId).toBeNull();
  });
});
