import { create } from 'zustand';

export interface UploadState {
  file: File | null;
  svgString: string | null;
  preview: string | null;
  error: string | null;
  isProcessing: boolean;

  setFile: (file: File) => void;
  setSvgString: (svg: string) => void;
  setError: (error: string | null) => void;
  setProcessing: (processing: boolean) => void;
  reset: () => void;
}

const initialState = {
  file: null,
  svgString: null,
  preview: null,
  error: null,
  isProcessing: false,
};

export const useUploadStore = create<UploadState>((set) => ({
  ...initialState,

  setFile: (file: File) => {
    const preview = URL.createObjectURL(file);
    set({ file, preview, error: null });
  },

  setSvgString: (svg: string) => {
    set({ svgString: svg, error: null });
  },

  setError: (error: string | null) => set({ error }),

  setProcessing: (processing: boolean) => set({ isProcessing: processing }),

  reset: () => set({ ...initialState }),
}));
