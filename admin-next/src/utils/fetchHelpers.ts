/**
 * Fetch helper utilities for common API patterns
 */

/**
 * Options for fetch requests that should bypass browser cache.
 * Used for data that needs to be fresh on every request, like user settings.
 * Note: We only use cache: 'no-store' to bypass browser cache.
 * Do NOT add Cache-Control header as it causes CORS issues with cross-origin requests.
 */
export const noCacheFetchOptions: RequestInit = {
  cache: 'no-store' as RequestCache
};

/**
 * Helper to create a fetch request with no caching.
 * @param url - The URL to fetch
 * @param options - Additional fetch options to merge
 * @returns Promise<Response>
 */
export const fetchNoCache = (url: string, options?: RequestInit): Promise<Response> => {
  return fetch(url, {
    ...noCacheFetchOptions,
    ...options,
    headers: {
      ...options?.headers
    }
  });
};
