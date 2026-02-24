import { describe, it, expect, beforeEach } from 'vitest';
import { useUploadStore } from '@/store/upload-store';

describe('upload-store', () => {
  beforeEach(() => {
    useUploadStore.getState().reset();
  });

  it('should have empty initial state', () => {
    const state = useUploadStore.getState();
    expect(state.file).toBeNull();
    expect(state.svgString).toBeNull();
    expect(state.preview).toBeNull();
    expect(state.error).toBeNull();
    expect(state.isProcessing).toBe(false);
  });

  it('should store SVG string with setSvgString', () => {
    const svg = '<svg><rect width="100" height="100"/></svg>';
    useUploadStore.getState().setSvgString(svg);

    const state = useUploadStore.getState();
    expect(state.svgString).toBe(svg);
    expect(state.error).toBeNull();
  });

  it('should set and clear error with setError', () => {
    useUploadStore.getState().setError('Invalid file format');
    expect(useUploadStore.getState().error).toBe('Invalid file format');

    useUploadStore.getState().setError(null);
    expect(useUploadStore.getState().error).toBeNull();
  });

  it('should toggle processing flag with setProcessing', () => {
    expect(useUploadStore.getState().isProcessing).toBe(false);

    useUploadStore.getState().setProcessing(true);
    expect(useUploadStore.getState().isProcessing).toBe(true);

    useUploadStore.getState().setProcessing(false);
    expect(useUploadStore.getState().isProcessing).toBe(false);
  });

  it('should clear all state with reset', () => {
    useUploadStore.getState().setSvgString('<svg/>');
    useUploadStore.getState().setError('some error');
    useUploadStore.getState().setProcessing(true);

    useUploadStore.getState().reset();

    const state = useUploadStore.getState();
    expect(state.file).toBeNull();
    expect(state.svgString).toBeNull();
    expect(state.preview).toBeNull();
    expect(state.error).toBeNull();
    expect(state.isProcessing).toBe(false);
  });
});
