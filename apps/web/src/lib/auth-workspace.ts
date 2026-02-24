import { v4 as uuidv4 } from 'uuid';
import { getWorkspaceByOwnerId, createWorkspace } from './db/store';
import { getEnvConfig } from './env';

/**
 * Get or create a workspace for the given user.
 * Returns the workspace ID.
 */
export async function ensureWorkspace(userId: string): Promise<string> {
  const existing = await getWorkspaceByOwnerId(userId);
  if (existing) {
    return existing.id;
  }

  const { maxCreditsFree } = getEnvConfig();
  const ws = {
    id: uuidv4(),
    ownerId: userId,
    creditsRemaining: maxCreditsFree,
  };
  await createWorkspace(ws);
  return ws.id;
}
