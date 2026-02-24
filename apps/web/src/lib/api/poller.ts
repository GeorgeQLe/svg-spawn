import { api } from './client';
import type { JobStatusResponse } from './client';

/**
 * Poll for job status updates at a regular interval.
 *
 * @param jobId - The job ID to poll
 * @param onUpdate - Callback invoked with each status update
 * @param interval - Polling interval in milliseconds (default: 1000)
 * @returns A cleanup function to stop polling
 */
export function pollJobStatus(
  jobId: string,
  onUpdate: (job: JobStatusResponse) => void,
  interval: number = 1000,
): () => void {
  let stopped = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  async function poll() {
    if (stopped) return;

    try {
      const job = await api.getJobStatus(jobId);
      if (stopped) return;

      onUpdate(job);

      // Stop polling if the job has reached a terminal state
      if (job.status === 'completed' || job.status === 'failed') {
        return;
      }
    } catch {
      // Swallow errors and keep polling
    }

    if (!stopped) {
      timeoutId = setTimeout(poll, interval);
    }
  }

  // Start polling
  poll();

  // Return cleanup function
  return () => {
    stopped = true;
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
  };
}
