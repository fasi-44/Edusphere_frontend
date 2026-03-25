import { useRef, useCallback } from 'react';

/**
 * Custom hook for throttling a callback function
 * Ensures the callback is called at most once per specified time period
 *
 * @param callback - The function to throttle
 * @param delay - The delay in milliseconds (default: 1000ms)
 * @returns A throttled version of the callback
 *
 * @example
 * const handleScroll = useThrottle(() => {
 *   console.log('Scrolling...');
 * }, 200);
 *
 * useEffect(() => {
 *   window.addEventListener('scroll', handleScroll);
 *   return () => window.removeEventListener('scroll', handleScroll);
 * }, [handleScroll]);
 */
export function useThrottle<T extends (...args: any[]) => any>(
    callback: T,
    delay: number = 1000
): (...args: Parameters<T>) => void {
    const lastRun = useRef<number>(Date.now());
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    return useCallback(
        (...args: Parameters<T>) => {
            const now = Date.now();
            const timeSinceLastRun = now - lastRun.current;

            if (timeSinceLastRun >= delay) {
                // Enough time has passed, execute immediately
                callback(...args);
                lastRun.current = now;
            } else {
                // Schedule execution at the end of the delay period
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                }

                timeoutRef.current = setTimeout(() => {
                    callback(...args);
                    lastRun.current = Date.now();
                }, delay - timeSinceLastRun);
            }
        },
        [callback, delay]
    );
}
