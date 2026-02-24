import { describe, it, expect } from 'vitest';
import { GenerationNodeSchema, type GenerationNode } from '../../model/node.js';
import { validateWithSchema } from '../../validation/schema-utils.js';
import { isOk, isErr, unwrap } from '../../validation/result.js';

function makeValidNode(overrides: Partial<GenerationNode> = {}): Record<string, unknown> {
  return {
    id: 'node-1',
    projectId: 'proj-1',
    prompt: 'Animate the logo spinning',
    status: 'pending',
    createdAt: '2024-01-15T10:30:00Z',
    ...overrides,
  };
}

describe('GenerationNode schema', () => {
  it('parses a valid node with all required fields', () => {
    const data = makeValidNode();
    const result = validateWithSchema(GenerationNodeSchema, data);
    expect(isOk(result)).toBe(true);
    const node = unwrap(result);
    expect(node.id).toBe('node-1');
    expect(node.projectId).toBe('proj-1');
    expect(node.prompt).toBe('Animate the logo spinning');
    expect(node.status).toBe('pending');
  });

  describe('status transitions', () => {
    it.each(['pending', 'generating', 'completed', 'failed'] as const)(
      'accepts status "%s"',
      (status) => {
        const data = makeValidNode({ status });
        const result = validateWithSchema(GenerationNodeSchema, data);
        expect(isOk(result)).toBe(true);
        expect(unwrap(result).status).toBe(status);
      },
    );
  });

  describe('optional fields', () => {
    it('can omit parentNodeId', () => {
      const data = makeValidNode();
      delete (data as Record<string, unknown>).parentNodeId;
      const result = validateWithSchema(GenerationNodeSchema, data);
      expect(isOk(result)).toBe(true);
      expect(unwrap(result).parentNodeId).toBeUndefined();
    });

    it('can omit animationPlanId', () => {
      const data = makeValidNode();
      const result = validateWithSchema(GenerationNodeSchema, data);
      expect(isOk(result)).toBe(true);
      expect(unwrap(result).animationPlanId).toBeUndefined();
    });

    it('can omit animatedSvg', () => {
      const data = makeValidNode();
      const result = validateWithSchema(GenerationNodeSchema, data);
      expect(isOk(result)).toBe(true);
      expect(unwrap(result).animatedSvg).toBeUndefined();
    });

    it('can omit error', () => {
      const data = makeValidNode();
      const result = validateWithSchema(GenerationNodeSchema, data);
      expect(isOk(result)).toBe(true);
      expect(unwrap(result).error).toBeUndefined();
    });

    it('accepts all optional fields when provided', () => {
      const data = makeValidNode({
        parentNodeId: 'parent-1',
        animationPlanId: 'plan-1',
        animatedSvg: '<svg>animated</svg>',
        error: 'something went wrong',
      });
      const result = validateWithSchema(GenerationNodeSchema, data);
      expect(isOk(result)).toBe(true);
      const node = unwrap(result);
      expect(node.parentNodeId).toBe('parent-1');
      expect(node.animationPlanId).toBe('plan-1');
      expect(node.animatedSvg).toBe('<svg>animated</svg>');
      expect(node.error).toBe('something went wrong');
    });
  });

  describe('validation failures', () => {
    it('rejects an invalid status value', () => {
      const data = makeValidNode({ status: 'running' as GenerationNode['status'] });
      const result = validateWithSchema(GenerationNodeSchema, data);
      expect(isErr(result)).toBe(true);
    });

    it('rejects missing required fields', () => {
      const result = validateWithSchema(GenerationNodeSchema, { id: 'node-1' });
      expect(isErr(result)).toBe(true);
    });

    it('rejects an invalid createdAt format', () => {
      const data = makeValidNode({ createdAt: 'not-a-date' });
      const result = validateWithSchema(GenerationNodeSchema, data);
      expect(isErr(result)).toBe(true);
    });
  });
});
