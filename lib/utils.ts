import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combine tailwind classes safely
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Optimize Unsplash URLs with performance parameters
 */
export const getOptimizedUnsplashUrl = (url: string, width: number = 800, quality: number = 80) => {
  if (!url || typeof url !== 'string' || !url.includes('images.unsplash.com')) return url;
  
  // Remove existing parameters if any
  const baseUrl = url.split('?')[0];
  
  // Add performance parameters
  return `${baseUrl}?q=${quality}&w=${width}&auto=format&fit=crop`;
};

/**
 * Helper to handle flaky dynamic imports (e.g. network blips or stale cache)
 * It will attempt to reload the page once if the import fails, which often
 * resolves issues with stale chunks after a deployment.
 */
export const lazyWithRetry = (componentImport: () => Promise<any>) =>
  React.lazy(async () => {
    const STORAGE_KEY = 'last-reload-timestamp';
    const RELOAD_THRESHOLD = 5000; // 5 seconds

    try {
      return await componentImport();
    } catch (error) {
      const lastReload = parseInt(window.localStorage.getItem(STORAGE_KEY) || '0', 10);
      const now = Date.now();

      // Only auto-reload if we haven't reloaded in the last 5 seconds to avoid infinite loops
      if (now - lastReload > RELOAD_THRESHOLD) {
        window.localStorage.setItem(STORAGE_KEY, now.toString());
        console.warn('Dynamic import failed, reloading page...', error);
        window.location.reload();
        return { default: () => null }; // Return dummy component while reloading
      }

      throw error;
    }
  });
