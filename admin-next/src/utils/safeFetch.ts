/**
 * Fetch wrapper that handles storage quota exceeded errors
 */

import { handleStorageQuotaExceeded } from './storageCleanup';

const originalFetch = window.fetch;

/**
 * Wrapped fetch that catches and handles storage quota errors
 */
export async function safefetch(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  try {
    return await originalFetch(input, init);
  } catch (error) {
    const errorMessage = String((error as any)?.message || error || '');
    
    if (
      errorMessage.includes('NO_SPACE') ||
      errorMessage.includes('FILE_ERROR_NO_SPACE') ||
      errorMessage.includes('QuotaExceededError') ||
      errorMessage.includes('IO error')
    ) {
      console.error('[SafeFetch] Storage quota error detected:', error);
      
      // Attempt to cleanup storage
      try {
        await handleStorageQuotaExceeded();
        
        // Retry the fetch after cleanup
        console.log('[SafeFetch] Retrying fetch after storage cleanup');
        return await originalFetch(input, init);
      } catch (cleanupError) {
        console.error('[SafeFetch] Failed to cleanup storage:', cleanupError);
        throw error;
      }
    }
    
    throw error;
  }
}

/**
 * Replace global fetch with our safe version
 */
export function initializeSafeFetch(): void {
  if (typeof window !== 'undefined' && typeof window.fetch !== 'undefined') {
    // Only wrap if not already wrapped
    if (window.fetch !== safefetch) {
      (window.fetch as any) = safefetch;
      console.log('[SafeFetch] Global fetch wrapper installed');
    }
  }
}
