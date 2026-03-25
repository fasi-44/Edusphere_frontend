/**
 * useIdleTimeout Hook
 * Automatically logs out the user after a period of inactivity.
 * Listens for mouse, keyboard, scroll, and touch events.
 */

import { useEffect, useRef, useCallback } from 'react';

const IDLE_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click'] as const;

interface UseIdleTimeoutOptions {
    /** Timeout in milliseconds (default: 15 minutes) */
    timeout?: number;
    /** Callback when idle timeout is reached */
    onIdle: () => void;
    /** Whether the hook is enabled (default: true) */
    enabled?: boolean;
}

export const useIdleTimeout = ({
    timeout = 15 * 60 * 1000, // 15 minutes
    onIdle,
    enabled = true,
}: UseIdleTimeoutOptions): void => {
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const onIdleRef = useRef(onIdle);

    // Keep callback ref current without retriggering effects
    onIdleRef.current = onIdle;

    const resetTimer = useCallback(() => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        timerRef.current = setTimeout(() => {
            onIdleRef.current();
        }, timeout);
    }, [timeout]);

    useEffect(() => {
        if (!enabled) return;

        // Start the timer
        resetTimer();

        // Reset on user activity
        const handleActivity = () => resetTimer();

        IDLE_EVENTS.forEach((event) => {
            document.addEventListener(event, handleActivity, { passive: true });
        });

        return () => {
            if (timerRef.current) {
                clearTimeout(timerRef.current);
            }
            IDLE_EVENTS.forEach((event) => {
                document.removeEventListener(event, handleActivity);
            });
        };
    }, [enabled, resetTimer]);
};
