import { describe, it, expect } from 'vitest';
import { expandGroups } from '../group-compiler/expand-groups.js';
import { createTestDocument, createGroup } from './fixtures.js';

describe('expand-groups', () => {
  const doc = createTestDocument();

  it('bounce effect produces translateY keyframes', () => {
    const groups = [createGroup({ effectType: 'bounce', targets: [{ type: 'element', nodeUid: 'circle-1' }] })];
    const result = expandGroups(groups, doc);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.length).toBeGreaterThanOrEqual(1);
    const channel = result.value[0]!;
    expect(channel.channel.property).toBe('transform:translateY');
    expect(channel.channel.keyframes[0]!.value).toBe('0px');
    expect(channel.channel.keyframes[1]!.value).toBe('-20px');
    expect(channel.channel.keyframes[2]!.value).toBe('0px');
  });

  it('fade effect produces opacity 0→1 channel', () => {
    const groups = [createGroup({ effectType: 'fade' })];
    const result = expandGroups(groups, doc);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(1);
    const channel = result.value[0]!;
    expect(channel.channel.property).toBe('opacity');
    expect(channel.channel.keyframes[0]!.value).toBe(0);
    expect(channel.channel.keyframes[1]!.value).toBe(1);
  });

  it('draw-on effect produces stroke-dashoffset channel', () => {
    const groups = [createGroup({
      effectType: 'draw-on',
      targets: [{ type: 'element', nodeUid: 'path-1' }],
    })];
    const result = expandGroups(groups, doc);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(1);
    expect(result.value[0]!.channel.property).toBe('stroke-dashoffset');
  });

  it('timing maps correctly (startTime→delay, duration, repeatCount)', () => {
    const groups = [createGroup({
      startTime: 200,
      duration: 800,
      repeatCount: 3,
    })];
    const result = expandGroups(groups, doc);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const channel = result.value[0]!.channel;
    expect(channel.delay).toBe(200);
    expect(channel.duration).toBe(800);
    expect(channel.repeatCount).toBe(3);
  });

  it('nonexistent target nodeUid returns error', () => {
    const groups = [createGroup({
      targets: [{ type: 'element', nodeUid: 'does-not-exist' }],
    })];
    const result = expandGroups(groups, doc);
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.error.message).toContain('does-not-exist');
  });

  it('expands to multiple targets', () => {
    const groups = [createGroup({
      targets: [
        { type: 'element', nodeUid: 'circle-1' },
        { type: 'element', nodeUid: 'rect-1' },
      ],
    })];
    const result = expandGroups(groups, doc);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toHaveLength(2);
    expect(result.value[0]!.nodeUid).toBe('circle-1');
    expect(result.value[1]!.nodeUid).toBe('rect-1');
  });
});
