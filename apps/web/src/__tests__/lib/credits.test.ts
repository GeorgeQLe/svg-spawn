import { describe, it, expect, beforeEach, vi } from 'vitest';
import { checkCredits, consumeCredit } from '@/lib/billing/credits';
import { initCredits, resetStore, getCredits } from '@/lib/db/store';

// Mock env to control MAX_CREDITS_FREE
vi.mock('@/lib/env', () => ({
  getEnvConfig: () => ({
    geminiApiKey: '',
    geminiModelId: 'gemini-2.5-pro',
    maxCreditsFree: 5,
  }),
}));

describe('credits', () => {
  beforeEach(async () => {
    await resetStore();
  });

  it('should start with N credits (auto-initialized)', async () => {
    const result = await checkCredits('ws-1');
    expect(result.hasCredits).toBe(true);
    expect(result.remaining).toBe(5);
  });

  it('should decrement on success', async () => {
    // Auto-init by checking
    await checkCredits('ws-1');

    const consumed = await consumeCredit('ws-1');
    expect(consumed).toBe(true);

    const result = await checkCredits('ws-1');
    expect(result.remaining).toBe(4);
  });

  it('should not decrement on failure/retry (no call to consumeCredit)', async () => {
    await initCredits('ws-1', 10);

    // Simulate: generation fails, so we simply don't call consumeCredit
    // Verify credits remain unchanged
    const result = await checkCredits('ws-1');
    expect(result.remaining).toBe(10);

    // Now consume one for a successful generation
    await consumeCredit('ws-1');
    expect((await checkCredits('ws-1')).remaining).toBe(9);

    // Simulate another failure - don't call consumeCredit
    // Credits should still be 9
    expect((await checkCredits('ws-1')).remaining).toBe(9);
  });

  it('should reject when exhausted (0 credits)', async () => {
    await initCredits('ws-1', 1);

    // Consume the last credit
    const consumed = await consumeCredit('ws-1');
    expect(consumed).toBe(true);
    expect(await getCredits('ws-1')).toBe(0);

    // Now exhausted
    const result = await checkCredits('ws-1');
    expect(result.hasCredits).toBe(false);
    expect(result.remaining).toBe(0);

    // Further consume attempts should fail
    const consumedAgain = await consumeCredit('ws-1');
    expect(consumedAgain).toBe(false);
  });

  it('should isolate credits across multiple workspaces', async () => {
    await initCredits('ws-1', 10);
    await initCredits('ws-2', 3);

    await consumeCredit('ws-1');
    await consumeCredit('ws-1');

    expect((await checkCredits('ws-1')).remaining).toBe(8);
    expect((await checkCredits('ws-2')).remaining).toBe(3);

    await consumeCredit('ws-2');
    await consumeCredit('ws-2');
    await consumeCredit('ws-2');

    expect((await checkCredits('ws-1')).remaining).toBe(8);
    expect((await checkCredits('ws-2')).remaining).toBe(0);
    expect((await checkCredits('ws-2')).hasCredits).toBe(false);
  });
});
