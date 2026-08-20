import { useEffect } from 'react';
import { useQueueStore } from '@/stores/queue-store';

export function useSSE(endpoint: string) {
  const updateItem = useQueueStore(state => state.updateItem);

  useEffect(() => {
    // In a real app, this connects to the backend SSE endpoint
    // For now, it's mocked to simulate progress updates
    
    // Mock simulation for pending items
    const interval = setInterval(() => {
      const state = useQueueStore.getState();
      const pendingItems = state.items.filter(i => i.status === 'pending' || i.status === 'processing');
      
      pendingItems.forEach(item => {
        if (item.status === 'pending') {
          updateItem(item.id, { status: 'processing', progress: 0 });
        } else if (item.status === 'processing') {
          const newProgress = Math.min(100, item.progress + Math.random() * 20);
          if (newProgress === 100) {
            updateItem(item.id, { status: 'completed', progress: 100 });
          } else {
            updateItem(item.id, { progress: newProgress });
          }
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [endpoint, updateItem]);
}
