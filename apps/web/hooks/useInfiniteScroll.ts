import { useEffect, useRef, useCallback } from 'react';

export const useInfiniteScroll = (
  callback: () => void,
  hasMore: boolean,
  loading: boolean
) => {
  const observer = useRef<IntersectionObserver | null>(null);
  const callbackRef = useRef(callback);
  
  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      // Disconnect previous observer
      if (observer.current) {
        observer.current.disconnect();
      }
      
      // Don't observe if loading or no more items
      if (loading || !hasMore) return;
      
      // Create new observer
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            // Use the latest callback
            callbackRef.current();
          }
        },
        {
          root: null,
          rootMargin: '200px', // Start loading 200px before reaching the bottom
          threshold: 0,
        }
      );
      
      // Start observing the node
      if (node) {
        observer.current.observe(node);
      }
    },
    [loading, hasMore]
  );
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);
  
  return lastElementRef;
};