import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Force browser to trigger a native file download prompt
 * Works across all browsers (Chrome, Edge, Safari, Firefox) for cross-origin APIs.
 * Converts response to a same-origin Blob URL so the `download` attribute is strictly respected.
 */
export async function triggerFileDownload(url: string, suggestedFilename?: string, signal?: AbortSignal) {
  if (signal?.aborted) return;
  const filename = suggestedFilename || 'mediaflow_download.mp4';

  try {
    const res = await fetch(url, { mode: 'cors', signal });
    if (signal?.aborted) return;
    if (res.ok) {
      const blob = await res.blob();
      if (signal?.aborted) return;
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = blobUrl;
      link.download = filename;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        try {
          if (link.parentNode) {
            document.body.removeChild(link);
          }
        } catch {
          // ignore
        }
      }, 60000);
      return;
    }
  } catch (err: any) {
    if (err?.name === 'AbortError' || signal?.aborted) {
      return;
    }
    console.warn('[triggerFileDownload] Blob fetch failed, falling back to direct navigation:', err);
  }

  if (signal?.aborted) return;

  // Fallback 1: Direct anchor with download attribute
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = url;
  link.download = filename;
  link.setAttribute('download', filename);
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    try {
      if (link.parentNode) {
        document.body.removeChild(link);
      }
    } catch {
      // ignore
    }
  }, 10000);
}
