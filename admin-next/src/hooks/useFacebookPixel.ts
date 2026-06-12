import { useEffect } from 'react';
import type { FacebookPixelConfig } from '../types';

export function useFacebookPixel(cfg: FacebookPixelConfig) {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const remove = () => {
      // Only remove elements we created (identified by our custom IDs)
      document.getElementById('facebook-pixel-script')?.remove();
      document.getElementById('facebook-pixel-noscript')?.remove();
    };
    if (!cfg?.isEnabled || !cfg.pixelId) { remove(); return; }
    remove();
    const pixelId = cfg.pixelId.trim(), testId = cfg.enableTestEvent ? `TEST_${Date.now()}` : null;

    // Bootstrap the fbq stub (standard Meta Pixel snippet) so fbevents.js finds it
    const initFbq = () => {
      const w = window as any;
      if (w.fbq) return;
      const n: any = (w.fbq = function (...args: any[]) { n.callMethod ? n.callMethod.apply(n, args) : n.queue.push(args); });
      if (!w._fbq) w._fbq = n;
      n.push = n;
      n.loaded = true;
      n.version = '2.0';
      n.queue = [] as any[];
    };

    const load = () => {
      initFbq();
      const w = window as any;
      w.fbq('init', pixelId, undefined, testId ? { eventID: testId } : undefined);
      w.fbq('track', 'PageView');
      if (!document.getElementById('facebook-pixel-script')) {
        const s = Object.assign(document.createElement('script'), { id: 'facebook-pixel-script', async: true, src: 'https://connect.facebook.net/en_US/fbevents.js' });
        document.head.appendChild(s);
      }
      const ns = document.createElement('noscript'); ns.id = 'facebook-pixel-noscript'; ns.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1${cfg.enableTestEvent ? '&cd[event_source_url]=test' : ''}" />`;
      document.body.appendChild(ns);
    };
    'requestIdleCallback' in window ? (window as any).requestIdleCallback(load, { timeout: 1200 }) : setTimeout(load, 1200);
    return remove;
  }, [cfg]);
}
