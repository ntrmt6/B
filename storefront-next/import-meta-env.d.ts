interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_STORAGE_BUCKET?: string;
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string;
  readonly VITE_CDN_BASE_URL?: string;
  readonly VITE_CDN_CACHE_DEFAULT?: string;
  readonly VITE_CDN_CACHE_IMAGES?: string;
  readonly VITE_CDN_CACHE_STATIC?: string;
  readonly VITE_CDN_ENABLED?: string;
  readonly VITE_CDN_IMAGE_FIT?: string;
  readonly VITE_CDN_IMAGE_FORMAT?: string;
  readonly VITE_CDN_IMAGE_QUALITY?: string;
  readonly VITE_CDN_IMAGE_TRANSFORM?: string;
  readonly VITE_CDN_IMAGE_URL?: string;
  readonly VITE_CDN_PROVIDER?: string;
  readonly VITE_CDN_STATIC_URL?: string;
  readonly VITE_DEFAULT_TENANT_SLUG?: string;
  readonly VITE_PRIMARY_DOMAIN?: string;
  readonly VITE_ADDITIONAL_DOMAINS?: string;
  readonly VITE_REMOTE_SAVE_DEBOUNCE_MS?: string;
  readonly VITE_DISABLE_REMOTE_SAVE?: string;
  readonly VITE_GEMINI_API_KEY?: string;
  readonly MODE?: string;
  readonly DEV?: boolean;
  readonly PROD?: boolean;
  readonly SSR?: boolean;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}