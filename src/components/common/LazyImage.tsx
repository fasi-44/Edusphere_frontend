import { useState, useEffect, useRef, ImgHTMLAttributes } from 'react';

interface LazyImageProps extends ImgHTMLAttributes<HTMLImageElement> {
    src: string;
    alt: string;
    placeholder?: string;
    className?: string;
    onLoad?: () => void;
    onError?: () => void;
}

/**
 * LazyImage Component
 * Loads images only when they enter the viewport using Intersection Observer
 *
 * Features:
 * - Lazy loading with Intersection Observer
 * - Placeholder support
 * - Fade-in animation
 * - Error handling with fallback
 *
 * @example
 * <LazyImage
 *   src="/path/to/image.jpg"
 *   alt="Description"
 *   placeholder="/path/to/placeholder.jpg"
 *   className="w-32 h-32 rounded-full"
 * />
 */
export const LazyImage: React.FC<LazyImageProps> = ({
    src,
    alt,
    placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f3f4f6"/%3E%3C/svg%3E',
    className = '',
    onLoad,
    onError,
    ...props
}) => {
    const [imageSrc, setImageSrc] = useState<string>(placeholder);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [hasError, setHasError] = useState<boolean>(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        // If no src provided, show placeholder
        if (!src) {
            setIsLoading(false);
            return;
        }

        // Create intersection observer
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        // Load the image when it enters viewport
                        const img = new Image();
                        img.src = src;

                        img.onload = () => {
                            setImageSrc(src);
                            setIsLoading(false);
                            setHasError(false);
                            onLoad?.();
                        };

                        img.onerror = () => {
                            setIsLoading(false);
                            setHasError(true);
                            onError?.();
                        };

                        // Stop observing after loading
                        if (imgRef.current) {
                            observer.unobserve(imgRef.current);
                        }
                    }
                });
            },
            {
                rootMargin: '50px', // Start loading 50px before entering viewport
                threshold: 0.01,
            }
        );

        // Start observing
        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        // Cleanup
        return () => {
            if (imgRef.current) {
                observer.unobserve(imgRef.current);
            }
        };
    }, [src, onLoad, onError]);

    return (
        <img
            ref={imgRef}
            src={hasError ? placeholder : imageSrc}
            alt={alt}
            className={`transition-opacity duration-300 ${
                isLoading ? 'opacity-50' : 'opacity-100'
            } ${className}`}
            loading="lazy" // Native lazy loading as fallback
            {...props}
        />
    );
};

/**
 * Simple loading placeholder for images
 */
export const ImagePlaceholder: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <div
            className={`bg-gray-200 dark:bg-gray-700 animate-pulse flex items-center justify-center ${className}`}
        >
            <svg
                className="w-12 h-12 text-gray-400 dark:text-gray-600"
                fill="currentColor"
                viewBox="0 0 20 20"
            >
                <path
                    fillRule="evenodd"
                    d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                    clipRule="evenodd"
                />
            </svg>
        </div>
    );
};
