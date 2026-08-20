import { useQueueStore } from '@/stores/queue-store';

export function useQueue() {
  const store = useQueueStore();
  
  const addUrls = (urls: string[]) => store.addItems(urls);
  const removeItem = (id: string) => store.removeItem(id);
  const clearCompleted = () => store.clearCompleted();
  const clearAll = () => store.clearAll();
  const retryFailed = () => store.retryFailed();
  
  const completedCount = store.items.filter(i => i.status === 'completed').length;
  const failedCount = store.items.filter(i => i.status === 'failed').length;
  const totalCount = store.items.length;
  
  return {
    items: store.items,
    addUrls,
    removeItem,
    clearCompleted,
    clearAll,
    retryFailed,
    completedCount,
    failedCount,
    totalCount
  };
}
