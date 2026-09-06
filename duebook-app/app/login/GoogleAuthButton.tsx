'use client';

import { useEffect, useRef, useState } from 'react';

interface Props {
  clientId: string;
  onCredential: (credential: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  disabled?: boolean;
}

// Loads Google Identity Services (the <script> lives in root layout) and
// renders the official Google button. If the script hasn't landed yet, we
// poll a few times before giving up so the button appears reliably.
export default function GoogleAuthButton({ clientId, onCredential, text = 'continue_with', disabled }: Props) {
  const holderRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;
    let tries = 0;
    const tick = () => {
      if (cancelled) return;
      const g = (window as any).google?.accounts?.id;
      if (g && holderRef.current) {
        try {
          g.initialize({
            client_id: clientId,
            callback: (resp: { credential?: string }) => {
              if (resp?.credential) onCredential(resp.credential);
            },
            ux_mode: 'popup',
            auto_select: false,
            itp_support: true,
          });
          holderRef.current.innerHTML = '';
          g.renderButton(holderRef.current, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text,
            shape: 'pill',
            logo_alignment: 'center',
            width: 280,
          });
          setReady(true);
        } catch {
          // ignore — try again below
        }
        return;
      }
      if (tries++ < 40) setTimeout(tick, 150);
    };
    tick();
    return () => { cancelled = true; };
  }, [clientId, onCredential, text]);

  if (!clientId) return null;

  return (
    <div className="w-full flex flex-col items-center">
      <div ref={holderRef} className={`flex justify-center ${disabled ? 'pointer-events-none opacity-50' : ''}`} />
      {!ready && (
        <div className="h-10 flex items-center text-[11px] text-gray-400">Loading Google…</div>
      )}
    </div>
  );
}
