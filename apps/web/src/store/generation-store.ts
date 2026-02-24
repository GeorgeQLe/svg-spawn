import { create } from 'zustand';

export interface GenerationState {
  isGenerating: boolean;
  currentNodeId: string | null;
  progress: number;
  error: string | null;

  startGeneration: (nodeId: string) => void;
  setProgress: (progress: number) => void;
  completeGeneration: () => void;
  failGeneration: (error: string) => void;
  reset: () => void;
}

const initialState = {
  isGenerating: false,
  currentNodeId: null,
  progress: 0,
  error: null,
};

export const useGenerationStore = create<GenerationState>((set) => ({
  ...initialState,

  startGeneration: (nodeId: string) =>
    set({
      isGenerating: true,
      currentNodeId: nodeId,
      progress: 0,
      error: null,
    }),

  setProgress: (progress: number) => set({ progress }),

  completeGeneration: () =>
    set({
      isGenerating: false,
      currentNodeId: null,
      progress: 100,
      error: null,
    }),

  failGeneration: (error: string) =>
    set({
      isGenerating: false,
      error,
    }),

  reset: () => set({ ...initialState }),
}));
