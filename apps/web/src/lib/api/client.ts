/**
 * Typed fetch wrapper for the SVG Spawn API.
 * Used by frontend code to communicate with the API routes.
 */

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error ?? `Request failed with status ${response.status}`);
  }

  return data as T;
}

export interface CreateProjectResponse {
  id: string;
  name: string;
  processedSvg: string;
  summary: Record<string, unknown>;
  complexity: Record<string, unknown>;
}

export interface GetProjectResponse {
  id: string;
  name: string;
  originalSvg: string;
  processedSvg: string | null;
  summary: Record<string, unknown> | null;
  complexity: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateGenerationResponse {
  nodeId: string;
  jobId: string;
}

export interface JobStatusResponse {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  nodeId: string;
  error?: string;
}

export interface GetNodeResponse {
  id: string;
  projectId: string;
  parentNodeId?: string;
  prompt: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  animatedSvg?: string;
  error?: string;
  createdAt: string;
}

export interface UploadResponse {
  rawSvg: string;
  processedResult: {
    processedSvg: string;
    summary: Record<string, unknown>;
    complexity: Record<string, unknown>;
    hadAnimations: boolean;
  };
}

export const api = {
  createProject(name: string, svg: string): Promise<CreateProjectResponse> {
    return fetchJson<CreateProjectResponse>('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, svg }),
    });
  },

  getProject(id: string): Promise<GetProjectResponse> {
    return fetchJson<GetProjectResponse>(`/api/projects/${id}`);
  },

  createGeneration(
    projectId: string,
    prompt: string,
    parentNodeId?: string,
  ): Promise<CreateGenerationResponse> {
    return fetchJson<CreateGenerationResponse>(`/api/projects/${projectId}/nodes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, parentNodeId }),
    });
  },

  getJobStatus(jobId: string): Promise<JobStatusResponse> {
    return fetchJson<JobStatusResponse>(`/api/jobs/${jobId}`);
  },

  getNode(projectId: string, nodeId: string): Promise<GetNodeResponse> {
    return fetchJson<GetNodeResponse>(`/api/projects/${projectId}/nodes/${nodeId}`);
  },

  exportSvg(nodeId: string): Promise<string> {
    return fetch(`/api/export/${nodeId}`).then((res) => {
      if (!res.ok) {
        return res.json().then((data) => {
          throw new Error(data.error ?? `Export failed with status ${res.status}`);
        });
      }
      return res.text();
    });
  },
};
