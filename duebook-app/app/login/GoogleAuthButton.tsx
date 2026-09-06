'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export interface GooglePayload {
  idToken: string;
  email: string;
  name?: string;
  photoURL?: string;
}

interface Props {
  onCredential: (payload: GooglePayload) => Promise<void> | void;
  label?: string;
  disabled?: boolean;
}

// Firebase is lazy-loaded — the ~150KB SDK only downloads once the user
// clicks the Google button, keeping the login page fast for email users.
async function loadFirebase() {
  const [authMod, cfg] = await Promise.all([
    import('firebase/auth'),
    import('@/lib/firebase'),
  ]);
  return { authMod, cfg };
}

export default function GoogleAuthButton({ onCredential, label = 'Continue with Google', disabled }: Props) {
  const [busy, setBusy] = useState(false);

  async function handleClick() {
    if (busy || disabled) return;
    setBusy(true);
    try {
      const { authMod, cfg } = await loadFirebase();
      const result = await authMod.signInWithPopup(cfg.auth, cfg.provider);
      const user = result.user;
      if (!user?.email) throw new Error('No email returned from Google');
      const cred = authMod.GoogleAuthProvider.credentialFromResult(result);
      const idToken = cred?.idToken || await user.getIdToken();
      await onCredential({
        idToken,
        email: user.email,
        name: user.displayName || undefined,
        photoURL: user.photoURL || undefined,
      });
    } catch (err: any) {
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // user closed the popup — silent
      } else {
        console.error('[google] sign-in failed', err);
        throw err;
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button type="button" onClick={handleClick} disabled={busy || disabled}
      className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 active:scale-[0.98] transition-all text-[13px] font-semibold text-gray-700 shadow-sm disabled:opacity-60">
      {busy ? (
        <Loader2 size={16} className="animate-spin text-gray-500" />
      ) : (
        <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
          <path fill="#FFC107" d="M43.6 20.5H42V20.4H24v7.2h11.3c-1.5 4.2-5.5 7.2-11.3 7.2-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.1-5.1C33.9 5.4 29.2 3.6 24 3.6 12.7 3.6 3.6 12.7 3.6 24S12.7 44.4 24 44.4c11.4 0 20.4-8.2 20.4-20.4 0-1.2-.1-2.4-.4-3.5z"/>
          <path fill="#FF3D00" d="M6.3 14.7l5.9 4.3C13.8 15.1 18.6 12 24 12c3.1 0 5.9 1.2 8 3.1l5.1-5.1C33.9 5.4 29.2 3.6 24 3.6 16.3 3.6 9.7 8 6.3 14.7z"/>
          <path fill="#4CAF50" d="M24 44.4c5.1 0 9.7-1.9 13.2-5.1l-6.1-5c-2 1.5-4.5 2.3-7.1 2.3-5.7 0-10.5-3.7-12.2-8.8l-6 4.6C9.5 39.7 16.2 44.4 24 44.4z"/>
          <path fill="#1976D2" d="M43.6 20.5H42V20.4H24v7.2h11.3c-.7 2-2 3.8-3.8 5.1l6.1 5c-.4.4 6.8-4.9 6.8-13.8 0-1.2-.1-2.4-.4-3.5z"/>
        </svg>
      )}
      <span>{busy ? 'Signing in…' : label}</span>
    </button>
  );
}
