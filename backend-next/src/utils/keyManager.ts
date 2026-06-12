import { GoogleGenerativeAI } from '@google/generative-ai';

// ── Key Manager: Multi-Key Failover & Round-Robin ────────────────────────────

interface ManagedKey {
  key: string;
  blacklistedUntil: number;
}

/**
 * Manages multiple Gemini API keys with round-robin selection and
 * automatic blacklisting on rate-limit (429) or server (500) errors.
 *
 * Reads keys from environment variables:
 *   GEMINI_KEY_1, GEMINI_KEY_2, GEMINI_KEY_3, GEMINI_API_KEY (fallback)
 *
 * Duplicate keys are filtered out automatically.
 */
export class KeyManager {
  private keys: ManagedKey[] = [];
  private currentIndex = 0;
  private static readonly BLACKLIST_DURATION_MS = 60_000; // 60 seconds

  constructor(label = 'KeyManager') {
    const envKeys = [
      process.env.GEMINI_KEY_1,
      process.env.GEMINI_KEY_2,
      process.env.GEMINI_KEY_3,
      process.env.GEMINI_API_KEY, // fallback to single-key env var
    ];
    for (const k of envKeys) {
      if (k && !this.keys.some((mk) => mk.key === k)) {
        this.keys.push({ key: k, blacklistedUntil: 0 });
      }
    }
    if (this.keys.length > 0) {
      console.log(`[${label}] KeyManager initialized with ${this.keys.length} key(s)`);
    } else {
      console.log(`[${label}] Warning: No GEMINI API keys found`);
    }
  }

  /** Whether at least one key is configured. */
  get hasKeys(): boolean {
    return this.keys.length > 0;
  }

  /** Get the next available key via round-robin, skipping blacklisted ones. */
  getNextKey(): string | null {
    const now = Date.now();
    const total = this.keys.length;
    for (let i = 0; i < total; i++) {
      const idx = (this.currentIndex + i) % total;
      if (this.keys[idx].blacklistedUntil <= now) {
        this.currentIndex = (idx + 1) % total;
        return this.keys[idx].key;
      }
    }
    return null; // all keys blacklisted
  }

  /** Blacklist a key for 60 seconds after a 429 or 500 error. */
  blacklistKey(apiKey: string): void {
    const entry = this.keys.find((k) => k.key === apiKey);
    if (entry) {
      entry.blacklistedUntil = Date.now() + KeyManager.BLACKLIST_DURATION_MS;
      const keyIndex = this.keys.indexOf(entry) + 1;
      const nextAvailable = this.availableCount;
      console.log(`[KeyManager] Blacklisted key #${keyIndex} for 60s — ${nextAvailable} key(s) still available`);
    }
  }

  /** Get count of available (non-blacklisted) keys. */
  get availableCount(): number {
    const now = Date.now();
    return this.keys.filter((k) => k.blacklistedUntil <= now).length;
  }

  /**
   * Convenience: create a GoogleGenerativeAI instance using the next
   * available key.  Returns null when every key is blacklisted.
   */
  getGenAI(): { genAI: GoogleGenerativeAI; apiKey: string } | null {
    const apiKey = this.getNextKey();
    if (!apiKey) return null;
    return { genAI: new GoogleGenerativeAI(apiKey), apiKey };
  }
}

/** Exponential backoff with jitter: wait 2^attempt × 1000 + random(0-1000) ms */
export function backoffWithJitter(attempt: number): Promise<void> {
  const baseMs = Math.pow(2, attempt) * 1000;
  const jitterMs = Math.floor(Math.random() * 1000);
  const delayMs = Math.min(baseMs + jitterMs, 32_000); // cap at 32 s
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}
