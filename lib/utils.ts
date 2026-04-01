import React from 'react';

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
