import { lazy, ComponentType } from 'react';

/**
 * Robust React.lazy wrapper with automatic chunk load retry.
 * Handles new Vercel / hosting deployments where old chunks are replaced by new hashed chunks.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>
) {
  return lazy(async () => {
    const pageHasBeenRefreshed = JSON.parse(
      window.sessionStorage.getItem('chunk_retry_refreshed') || 'false'
    );

    try {
      const component = await componentImport();
      window.sessionStorage.setItem('chunk_retry_refreshed', 'false');
      return component;
    } catch (error: any) {
      console.warn('Chunk load failed (likely due to a new deployment). Retrying with fresh reload...', error);

      if (!pageHasBeenRefreshed) {
        window.sessionStorage.setItem('chunk_retry_refreshed', 'true');
        window.location.reload();
        return new Promise(() => {}); // Wait for reload
      }

      // If already refreshed once and still failing, throw error
      throw error;
    }
  });
}
