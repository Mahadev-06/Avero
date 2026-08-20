import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { apiClient } from '@/lib/api-client';

export type QueueItemStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface QueueItem {
  id: string;
  url: string;
  title?: string;
  platform: string;
  status: QueueItemStatus;
  progress: number;
  format?: string;
  availableFormats?: string[];
  thumbnail?: string;
  error?: string;
}

interface QueueState {
  items: QueueItem[];
  addItems: (urls: string[]) => Promise<void>;
  removeItem: (id: string) => void;
  updateItem: (id: string, updates: Partial<QueueItem>) => void;
  clearCompleted: () => void;
  clearAll: () => void;
  retryFailed: () => void;
}

export const useQueueStore = create<QueueState>()(
  persist(
    (set, get) => ({
      items: [],
      addItems: async (urls: string[]) => {
        const uniqueUrls = urls.filter((u) => u.trim().length > 0);
        if (uniqueUrls.length === 0) return;

        // 1. Instantly create pending queue placeholders
        const newItems: QueueItem[] = uniqueUrls.map((url) => ({
          id: `queue-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          url,
          platform: url.includes('youtu')
            ? 'YouTube'
            : url.includes('instagram')
            ? 'Instagram'
            : url.includes('tiktok')
            ? 'TikTok'
            : url.includes('pinterest') || url.includes('pin.it')
            ? 'Pinterest'
            : url.includes('facebook')
            ? 'Facebook'
            : url.includes('twitter') || url.includes('x.com')
            ? 'X (Twitter)'
            : 'Direct Media',
          status: 'completed' as QueueItemStatus,
          progress: 100,
          availableFormats: ['MP4 1080p', 'MP4 720p', 'MP3 320kbps'],
          format: 'MP4 720p',
        }));

        set((state) => ({ items: [...newItems, ...state.items] }));

        // 2. Fetch real metadata & formats from backend FastAPI API
        try {
          const response = await apiClient.analyzeUrls(uniqueUrls);

          response.results.forEach((info) => {
            const itemToUpdate = get().items.find((i) => i.url === info.url);
            if (itemToUpdate) {
              get().updateItem(itemToUpdate.id, {
                title: info.title || info.url,
                thumbnail: info.thumbnail_url,
                platform: info.platform ? info.platform.toUpperCase() : itemToUpdate.platform,
                status: 'completed',
                progress: 100,
                availableFormats: info.formats && info.formats.length > 0 ? info.formats : ['MP4 720p', 'MP3 320kbps'],
                format: info.formats && info.formats.length > 0 ? info.formats[0] : 'MP4 720p',
              });
            }
          });
        } catch (err) {
          console.error('Error analyzing URLs for queue:', err);
        }
      },
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        })),
      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((item) => (item.id === id ? { ...item, ...updates } : item)),
        })),
      clearCompleted: () =>
        set((state) => ({
          items: state.items.filter((item) => item.status !== 'completed'),
        })),
      clearAll: () => set({ items: [] }),
      retryFailed: () =>
        set((state) => ({
          items: state.items.map((item) =>
            item.status === 'failed' ? { ...item, status: 'processing', progress: 50, error: undefined } : item
          ),
        })),
    }),
    {
      name: 'avero-queue-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
