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
export async function triggerFileDownload(url: string, suggestedFilename?: string) {
  const filename = suggestedFilename || 'mediaflow_download.mp4';

  try {
    const res = await fetch(url);
    if (res.ok) {
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.style.display = 'none';
      link.href = blobUrl;
      link.download = filename;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
      setTimeout(() => {
        window.URL.revokeObjectURL(blobUrl);
        try {
          if (link.parentNode) {
            document.body.removeChild(link);
          }
        } catch {
          // ignore
        }
      }, 30000);
      return;
    }
  } catch (err) {
    console.warn('[triggerFileDownload] Blob fetch failed, falling back to direct anchor:', err);
  }

  // Fallback: Direct anchor
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
