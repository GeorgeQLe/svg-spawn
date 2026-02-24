import { getCredits, decrementCredits, initCredits } from '@/lib/db/store';
import { getEnvConfig } from '@/lib/env';

/**
 * Check whether a workspace has credits remaining.
 */
export async function checkCredits(workspaceId: string): Promise<{ hasCredits: boolean; remaining: number }> {
  let remaining = await getCredits(workspaceId);

  // Auto-initialize credits for new workspaces
  if (remaining === undefined) {
    const { maxCreditsFree } = getEnvConfig();
    await initCredits(workspaceId, maxCreditsFree);
    remaining = maxCreditsFree;
  }

  return {
    hasCredits: remaining > 0,
    remaining,
  };
}

/**
 * Consume a single credit from a workspace.
 * Returns false if the workspace has no credits remaining.
 */
export async function consumeCredit(workspaceId: string): Promise<boolean> {
  const remaining = await getCredits(workspaceId);

  // Auto-initialize if needed
  if (remaining === undefined) {
    const { maxCreditsFree } = getEnvConfig();
    await initCredits(workspaceId, maxCreditsFree);
  }

  return decrementCredits(workspaceId);
}
