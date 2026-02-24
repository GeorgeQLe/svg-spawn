import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface GenerationNodeState {
  id: string;
  prompt: string;
  status: 'idle' | 'generating' | 'completed' | 'failed';
  animatedSvg: string | null;
  error: string | null;
  parentId: string | null;
  createdAt: number;
}

export interface EdgeState {
  id: string;
  source: string;
  target: string;
  type: 'branch' | 'refine';
}

export interface ProjectState {
  // Project
  projectId: string | null;
  projectName: string;

  // SVG
  originalSvg: string | null;
  processedSvg: string | null;

  // Nodes (generation tree)
  nodes: Map<string, GenerationNodeState>;
  edges: EdgeState[];
  selectedNodeId: string | null;

  // View
  viewMode: 'linear' | 'graph';

  // Actions
  setOriginalSvg: (svg: string) => void;
  setProcessedSvg: (svg: string) => void;
  addNode: (node: Omit<GenerationNodeState, 'id' | 'createdAt'>) => GenerationNodeState;
  updateNode: (id: string, updates: Partial<GenerationNodeState>) => void;
  addEdge: (edge: { source: string; target: string; type: 'branch' | 'refine' }) => void;
  selectNode: (id: string | null) => void;
  setViewMode: (mode: 'linear' | 'graph') => void;
  reset: () => void;
}

const initialState = {
  projectId: null,
  projectName: 'Untitled Project',
  originalSvg: null,
  processedSvg: null,
  nodes: new Map<string, GenerationNodeState>(),
  edges: [] as EdgeState[],
  selectedNodeId: null,
  viewMode: 'linear' as const,
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  ...initialState,

  setOriginalSvg: (svg: string) => set({ originalSvg: svg }),

  setProcessedSvg: (svg: string) => set({ processedSvg: svg }),

  addNode: (nodeInput) => {
    const node: GenerationNodeState = {
      ...nodeInput,
      id: uuidv4(),
      createdAt: Date.now(),
    };
    set((state) => {
      const nodes = new Map(state.nodes);
      nodes.set(node.id, node);
      return { nodes };
    });
    return node;
  },

  updateNode: (id: string, updates: Partial<GenerationNodeState>) => {
    set((state) => {
      const nodes = new Map(state.nodes);
      const existing = nodes.get(id);
      if (existing) {
        nodes.set(id, { ...existing, ...updates });
      }
      return { nodes };
    });
  },

  addEdge: (edge) => {
    const newEdge: EdgeState = {
      id: uuidv4(),
      ...edge,
    };
    set((state) => ({
      edges: [...state.edges, newEdge],
    }));
  },

  selectNode: (id: string | null) => {
    if (id === null) {
      set({ selectedNodeId: null });
      return;
    }
    const nodes = get().nodes;
    if (nodes.has(id)) {
      set({ selectedNodeId: id });
    } else {
      set({ selectedNodeId: null });
    }
  },

  setViewMode: (mode: 'linear' | 'graph') => set({ viewMode: mode }),

  reset: () =>
    set({
      ...initialState,
      nodes: new Map<string, GenerationNodeState>(),
      edges: [],
    }),
}));
