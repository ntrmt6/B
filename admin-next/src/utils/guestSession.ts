/**
 * Guest Session Utility
 *
 * Ensures every visitor has a persistent unique ID that isn't tied to a login.
 * The ID survives page reloads and is used to attribute guest chat messages
 * and retrieve conversation history from the backend.
 */

const GUEST_SESSION_STORAGE_KEY = 'guest_chat_session_id';

/**
 * Returns the current guest session ID, creating one if it doesn't exist yet.
 * The ID is persisted in localStorage so it's stable across page reloads.
 */
export const getGuestSessionId = (): string => {
  if (typeof window === 'undefined') {
    // SSR fallback — will be replaced on hydration
    return `guest_ssr_${Date.now()}`;
  }

  let sessionId = localStorage.getItem(GUEST_SESSION_STORAGE_KEY);

  if (!sessionId) {
    sessionId = `guest_${Math.random().toString(36).substring(2, 15)}_${Date.now()}`;
    localStorage.setItem(GUEST_SESSION_STORAGE_KEY, sessionId);
  }

  return sessionId;
};

/**
 * Clear the guest session (e.g. when a user logs in and no longer needs it).
 */
export const clearGuestSessionId = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(GUEST_SESSION_STORAGE_KEY);
  }
};
