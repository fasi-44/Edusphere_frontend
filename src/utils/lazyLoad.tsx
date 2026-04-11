import { lazy, Suspense, ComponentType, LazyExoticComponent } from 'react';
import { LoadingSpinner } from '../components';

/**
 * Custom lazy load wrapper with loading fallback
 * Provides consistent loading UI across all lazy-loaded components
 */
export function lazyLoad<T extends ComponentType<any>>(
    importFunc: () => Promise<{ default: T }>,
    _fallback?: React.ReactNode
): LazyExoticComponent<T> {
    const LazyComponent = lazy(importFunc);

    // Return a wrapped component with Suspense
    return LazyComponent;
}

/**
 * Suspense wrapper component for lazy-loaded routes
 */
export function SuspenseWrapper({ children }: { children: React.ReactNode }) {
    return (
        <Suspense fallback={<LoadingSpinner fullHeight message="Loading..." />}>
            {children}
        </Suspense>
    );
}

/**
 * Lazy load a component with custom fallback
 */
export function lazyLoadWithFallback<T extends ComponentType<any>>(
    importFunc: () => Promise<{ default: T }>,
    fallback: React.ReactNode = <LoadingSpinner fullHeight message="Loading..." />
) {
    const LazyComponent = lazy(importFunc);

    return (props: any) => (
        <Suspense fallback={fallback}>
            <LazyComponent {...props} />
        </Suspense>
    );
}
