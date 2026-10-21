import { useSyncExternalStore, useCallback } from 'react';

const getServerSnapshot = () => false;

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      if (typeof window === 'undefined' || !('matchMedia' in window)) {
        return () => {};
      }
      const media = window.matchMedia(query);
      media.addEventListener('change', callback);
      return () => {
        media.removeEventListener('change', callback);
      };
    },
    [query]
  );

  const getSnapshot = useCallback(() => {
    if (typeof window === 'undefined' || !('matchMedia' in window)) {
      return false;
    }
    return window.matchMedia(query).matches;
  }, [query]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
