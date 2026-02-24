import { describe, it, expect, beforeEach } from 'vitest';
import { useGenerationStore } from '@/store/generation-store';

describe('generation-store', () => {
  beforeEach(() => {
    useGenerationStore.getState().reset();
  });

  it('should have correct initial state: not generating', () => {
    const state = useGenerationStore.getState();
    expect(state.isGenerating).toBe(false);
    expect(state.currentNodeId).toBeNull();
    expect(state.progress).toBe(0);
    expect(state.error).toBeNull();
  });

  it('should set generating state with startGeneration', () => {
    useGenerationStore.getState().startGeneration('node-123');

    const state = useGenerationStore.getState();
    expect(state.isGenerating).toBe(true);
    expect(state.currentNodeId).toBe('node-123');
    expect(state.progress).toBe(0);
    expect(state.error).toBeNull();
  });

  it('should update progress with setProgress', () => {
    useGenerationStore.getState().startGeneration('node-456');
    useGenerationStore.getState().setProgress(50);

    expect(useGenerationStore.getState().progress).toBe(50);

    useGenerationStore.getState().setProgress(75);
    expect(useGenerationStore.getState().progress).toBe(75);
  });

  it('should reset generating state with completeGeneration', () => {
    useGenerationStore.getState().startGeneration('node-789');
    useGenerationStore.getState().setProgress(50);
    useGenerationStore.getState().completeGeneration();

    const state = useGenerationStore.getState();
    expect(state.isGenerating).toBe(false);
    expect(state.currentNodeId).toBeNull();
    expect(state.progress).toBe(100);
    expect(state.error).toBeNull();
  });

  it('should set error with failGeneration', () => {
    useGenerationStore.getState().startGeneration('node-fail');
    useGenerationStore.getState().failGeneration('API request failed');

    const state = useGenerationStore.getState();
    expect(state.isGenerating).toBe(false);
    expect(state.error).toBe('API request failed');
    expect(state.currentNodeId).toBe('node-fail');
  });
});
