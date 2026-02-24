import { getCredits, decrementCredits, initCredits } from '@/lib/db/store';
import { getEnvConfig } from '@/lib/env';

/**
 * Check whether a workspace has credits remaining.
 */
export function checkCredits(workspaceId: string): { hasCredits: boolean; remaining: number } {
  let remaining = getCredits(workspaceId);

  // Auto-initialize credits for new workspaces
  if (remaining === undefined) {
    const { maxCreditsFree } = getEnvConfig();
    initCredits(workspaceId, maxCreditsFree);
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
export function consumeCredit(workspaceId: string): boolean {
  const remaining = getCredits(workspaceId);

  // Auto-initialize if needed
  if (remaining === undefined) {
    const { maxCreditsFree } = getEnvConfig();
    initCredits(workspaceId, maxCreditsFree);
  }

  return decrementCredits(workspaceId);
}
