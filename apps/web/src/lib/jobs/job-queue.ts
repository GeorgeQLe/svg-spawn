import { processGenerationJob } from './job-worker';

export interface JobHandler {
  processJob(jobId: string): Promise<void>;
}

/**
 * Create a simple in-process job queue.
 * Jobs are processed asynchronously (fire-and-forget) in the same Node.js process.
 */
export function createJobQueue(): { enqueue(jobId: string): void } {
  return {
    enqueue(jobId: string): void {
      // Fire-and-forget: process the job asynchronously
      processGenerationJob(jobId).catch((error) => {
        console.error(`[job-queue] Unhandled error processing job ${jobId}:`, error);
      });
    },
  };
}

/** Singleton job queue instance. */
export const jobQueue = createJobQueue();
