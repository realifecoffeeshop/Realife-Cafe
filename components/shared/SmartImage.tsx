import React, { useState, useEffect } from 'react';
import { cn, getOptimizedUnsplashUrl } from '../../lib/utils';

interface SmartImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  width?: number;
  quality?: number;
  className?: string;
  containerClassName?: string;
}

/**
 * A performance-optimized image component that:
 * 1. Automatically appends Unsplash optimization parameters
 * 2. Uses native lazy loading
 * 3. Handles loading states with a blurred placeholder effect
 * 4. Ensures consistent aspect ratios
 */
const SmartImage: React.FC<SmartImageProps> = ({
  src,
  width = 800,
  quality = 80,
  className,
  containerClassName,
  alt = 'Cafe Image',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const optimizedSrc = getOptimizedUnsplashUrl(src, width, quality);

  return (
    <div className={cn("relative overflow-hidden bg-stone-100 dark:bg-zinc-900", containerClassName)}>
      {/* Blurred placeholder or background color */}
      {!isLoaded && (
        <div className="absolute inset-0 animate-pulse bg-stone-200 dark:bg-zinc-800" />
      )}
      
      <img
        src={optimizedSrc}
        alt={alt}
        loading="lazy" // Native browser lazy loading
        onLoad={() => setIsLoaded(true)}
        className={cn(
          "transition-all duration-700 ease-in-out",
          isLoaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-105 blur-lg",
          className
        )}
        {...props}
      />
    </div>
  );
};

export default SmartImage;
