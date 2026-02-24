import { describe, it, expect } from 'vitest';
import { selectBackendForProperty, assignBackends } from '../backend/select-backend.js';
import type { ResolvedChannel } from '../group-compiler/expand-groups.js';

describe('select-backend', () => {
  describe('selectBackendForProperty', () => {
    it('opacity → CSS', () => {
      expect(selectBackendForProperty('opacity', 'auto')).toBe('css');
    });

    it('transform → CSS', () => {
      expect(selectBackendForProperty('transform', 'auto')).toBe('css');
    });

    it('transform:translateX → CSS', () => {
      expect(selectBackendForProperty('transform:translateX', 'auto')).toBe('css');
    });

    it('d → SMIL', () => {
      expect(selectBackendForProperty('d', 'auto')).toBe('smil');
    });

    it('cx → SMIL', () => {
      expect(selectBackendForProperty('cx', 'auto')).toBe('smil');
    });

    it('cy → SMIL', () => {
      expect(selectBackendForProperty('cy', 'auto')).toBe('smil');
    });

    it('stroke-dashoffset → SMIL', () => {
      expect(selectBackendForProperty('stroke-dashoffset', 'auto')).toBe('smil');
    });

    it('fill → CSS in auto mode', () => {
      expect(selectBackendForProperty('fill', 'auto')).toBe('css');
    });

    it('explicit smil preference is honored', () => {
      expect(selectBackendForProperty('opacity', 'smil')).toBe('smil');
    });

    it('explicit css preference is honored', () => {
      expect(selectBackendForProperty('d', 'css')).toBe('css');
    });

    it('CSS custom properties → CSS', () => {
      expect(selectBackendForProperty('--my-var', 'auto')).toBe('css');
    });
  });

  describe('assignBackends', () => {
    it('assigns backends to channels', () => {
      const channels: ResolvedChannel[] = [
        {
          nodeUid: 'el-1',
          channel: {
            property: 'opacity',
            keyframes: [
              { offset: 0, value: 0 },
              { offset: 1, value: 1 },
            ],
            duration: 500,
            delay: 0,
            repeatCount: 1,
            fill: 'forwards',
            compilationBackend: 'auto',
          },
        },
      ];
      const result = assignBackends(channels);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      expect(result.value[0]!.backend).toBe('css');
    });

    it('detects duplicate property drivers', () => {
      const channels: ResolvedChannel[] = [
        {
          nodeUid: 'el-1',
          channel: {
            property: 'opacity',
            keyframes: [
              { offset: 0, value: 0 },
              { offset: 1, value: 1 },
            ],
            duration: 500,
            delay: 0,
            repeatCount: 1,
            fill: 'forwards',
            compilationBackend: 'auto',
          },
        },
        {
          nodeUid: 'el-1',
          channel: {
            property: 'opacity',
            keyframes: [
              { offset: 0, value: 1 },
              { offset: 1, value: 0 },
            ],
            duration: 500,
            delay: 0,
            repeatCount: 1,
            fill: 'forwards',
            compilationBackend: 'auto',
          },
        },
      ];
      const result = assignBackends(channels);
      expect(result.ok).toBe(false);
      if (result.ok) return;
      expect(result.error.property).toBe('opacity');
      expect(result.error.nodeUid).toBe('el-1');
    });
  });
});
