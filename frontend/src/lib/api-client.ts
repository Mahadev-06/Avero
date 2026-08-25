export interface PlatformCapability {
  name: string;
  enabled: boolean;
  search_supported: boolean;
  metadata_supported: boolean;
  download_supported: boolean;
  embed_supported: boolean;
  official_api_required: boolean;
  legal_notes: string;
  limitations: string[];
  max_duration_seconds?: number;
}

export interface FormatOption {
  format_id: string;
  ext: string;
  quality: string;
  file_size_formatted: string;
  media_category: 'video' | 'audio' | 'image';
}

export interface MediaInfo {
  url: string;
  platform: string;
  title?: string;
  thumbnail_url?: string;
  media_type?: string;
  formats?: string[];
  format_options?: FormatOption[];
  file_size?: number;
  duration?: number;
  download_url?: string;
  download_supported: boolean;
  embed_html?: string;
  embed_supported: boolean;
  limitations?: string[];
  muted?: boolean;
  error?: string;
  error_message?: string;
}

export interface JobResponse {
  id: string;
  url: string;
  platform: string;
  status: 'WAITING' | 'ANALYZING' | 'READY' | 'PENDING' | 'PROCESSING' | 'DOWNLOADING' | 'CONVERTING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
  title?: string;
  thumbnail_url?: string;
  formats?: string[];
  selected_format?: string;
  progress: number;
  file_size?: number;
  media_type?: string;
  error_message?: string;
  error_code?: string;
  created_at: string;
  updated_at: string;
}

export interface SearchResult {
  id: string;
  title: string;
  thumbnail_url: string;
  channel: string;
  view_count?: number;
  duration?: number;
  published_at?: string;
  url: string;
  platform: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  has_more: boolean;
}

export interface AnalyzeResponse {
  results: MediaInfo[];
}

export interface DownloadStartResponse {
  job_id: string;
  status: string;
  message: string;
}

export interface DownloadProgress {
  job_id: string;
  status: 'PENDING' | 'DOWNLOADING' | 'CONVERTING' | 'COMPLETED' | 'FAILED' | 'EXPIRED';
  percent: number;
  speed: string;
  eta: string;
  file_size: number | null;
  filename: string | null;
  error: string | null;
  error_code?: string | null;
}

class ApiClient {
  private get baseUrl(): string {
    const raw = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    let clean = raw.trim().replace(/\/+$/, '');
    if (clean.endsWith('/api/v1')) {
      clean = clean.slice(0, -7).replace(/\/+$/, '');
    }
    return clean;
  }

  private async fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
      const res = await fetch(`${this.baseUrl}/api/v1${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options?.headers,
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: 'Request failed', code: 'UNKNOWN' }));
        throw new Error(errorData.error || `HTTP ${res.status}`);
      }

      return await res.json();
    } catch (err: unknown) {
      console.warn(`[MediaFlow API] ${endpoint} unavailable, using offline fallback.`, err);
      throw err;
    }
  }

  async getPlatforms(): Promise<{ platforms: PlatformCapability[] }> {
    return this.fetchJson('/platforms');
  }

  async analyzeUrls(urls: string[]): Promise<AnalyzeResponse> {
    return this.fetchJson('/analyze', {
      method: 'POST',
      body: JSON.stringify({ urls }),
    });
  }

  async createJob(url: string, format?: string): Promise<JobResponse> {
    return this.fetchJson('/jobs', {
      method: 'POST',
      body: JSON.stringify({ url, preferred_format: format }),
    });
  }

  async createBatchJobs(urls: string[]): Promise<JobResponse[]> {
    return this.fetchJson('/jobs/batch', {
      method: 'POST',
      body: JSON.stringify({ urls }),
    });
  }

  async getJob(id: string): Promise<JobResponse> {
    return this.fetchJson(`/jobs/${id}`);
  }

  async cancelJob(id: string): Promise<void> {
    return this.fetchJson(`/jobs/${id}`, { method: 'DELETE' });
  }

  async retryJob(id: string): Promise<JobResponse> {
    return this.fetchJson(`/jobs/${id}/retry`, { method: 'POST' });
  }

  async search(query: string, platform = 'youtube', page = 1): Promise<SearchResponse> {
    const params = new URLSearchParams({ query, platform, page: page.toString() });
    return this.fetchJson(`/search?${params.toString()}`);
  }

  async getSearchSuggestions(query: string): Promise<string[]> {
    if (!query || query.trim().length === 0) return [];
    try {
      const res = await this.fetchJson<{ suggestions: string[] }>(`/search/suggestions?q=${encodeURIComponent(query.trim())}`);
      return res.suggestions || [];
    } catch {
      return [];
    }
  }

  getDownloadUrl(jobId: string): string {
    return `${this.baseUrl}/api/v1/download/${jobId}`;
  }

  // --- New Download Engine Methods ---

  async startDownload(url: string, format: string = 'mp4', quality: string = 'best'): Promise<DownloadStartResponse> {
    return this.fetchJson('/download/start', {
      method: 'POST',
      body: JSON.stringify({ url, format, quality }),
    });
  }

  subscribeProgress(
    jobId: string,
    onProgress: (progress: DownloadProgress) => void,
  ): { cancel: () => void; done: Promise<DownloadProgress> } {
    const controller = new AbortController();

    const done = new Promise<DownloadProgress>((resolve, reject) => {
      const url = `${this.baseUrl}/api/v1/download/${jobId}/progress`;

      fetch(url, { signal: controller.signal })
        .then(async (response) => {
          if (!response.ok || !response.body) {
            reject(new Error(`SSE connection failed: ${response.status}`));
            return;
          }

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let lastProgress: DownloadProgress | null = null;

          try {
            while (true) {
              const { done: streamDone, value } = await reader.read();
              if (streamDone) break;

              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split('\n');
              buffer = lines.pop() || '';

              for (const line of lines) {
                if (line.startsWith('data: ')) {
                  try {
                    const progress: DownloadProgress = JSON.parse(line.slice(6));
                    lastProgress = progress;
                    onProgress(progress);

                    if (progress.status === 'COMPLETED' || progress.status === 'FAILED') {
                      resolve(progress);
                      return;
                    }
                  } catch {
                    // Skip malformed JSON lines
                  }
                }
              }
            }

            if (lastProgress) {
              resolve(lastProgress);
            } else {
              reject(new Error('SSE stream ended without progress data'));
            }
          } catch (err) {
            if (controller.signal.aborted) {
              resolve(lastProgress || { job_id: jobId, status: 'FAILED', percent: 0, speed: '', eta: '', file_size: null, filename: null, error: 'Cancelled' });
            } else {
              reject(err);
            }
          }
        })
        .catch((err) => {
          if (!controller.signal.aborted) {
            reject(err);
          }
        });
    });

    return {
      cancel: () => controller.abort(),
      done,
    };
  }

  getDownloadFileUrl(jobId: string, filename?: string): string {
    const params = filename ? `?filename=${encodeURIComponent(filename)}` : '';
    return `${this.baseUrl}/api/v1/download/${jobId}/file${params}`;
  }

  async submitTakedown(data: { name: string; email: string; work: string; url: string; explanation: string }): Promise<{ success: boolean }> {
    return this.fetchJson('/contact/takedown', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiClient = new ApiClient();
