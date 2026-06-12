import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

interface DarkModeContextValue {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (value: boolean) => void;
}

const DarkModeContext = createContext<DarkModeContextValue | null>(null);

const DARK_MODE_KEY = 'admin-dark-mode';

// Helper to check localStorage synchronously
const getInitialDarkMode = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const saved = localStorage.getItem(DARK_MODE_KEY);
    console.log('[DarkMode] Init - localStorage value:', saved);
    if (saved !== null) {
      const result = saved === 'true';
      console.log('[DarkMode] Using saved value:', result);
      return result;
    }
    const systemPref = window.matchMedia('(prefers-color-scheme: dark)').matches;
    console.log('[DarkMode] Using system preference:', systemPref);
    return systemPref;
  } catch (e) {
    console.log('[DarkMode] Error reading localStorage:', e);
    return false;
  }
};

// Apply dark mode class synchronously to prevent flash
const applyDarkModeClass = (isDark: boolean) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (isDark) {
    root.classList.add('dark');
    root.style.background = '#111827';
    root.style.colorScheme = 'dark';
  } else {
    root.classList.remove('dark');
    root.style.background = '#f9fafb';
    root.style.colorScheme = 'light';
  }
};

interface DarkModeProviderProps {
  children: React.ReactNode;
}

export const DarkModeProvider: React.FC<DarkModeProviderProps> = ({ children }) => {
  // Track if this is the initial render to avoid overwriting localStorage
  const isInitialMount = useRef(true);
  
  // Start with false for SSR consistency — real value applied in useEffect
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  // Initial sync: Runs ONLY on the client, AFTER the first render.
  useEffect(() => {
    const initial = getInitialDarkMode();
    setIsDarkMode(initial);
    applyDarkModeClass(initial);
    setMounted(true);
  }, []);

  // Apply dark mode class to document whenever isDarkMode changes
  useEffect(() => {
    if (!mounted) return;
    applyDarkModeClass(isDarkMode);
    
    // Only persist to localStorage after initial mount (user-initiated changes)
    if (isInitialMount.current) {
      isInitialMount.current = false;
    } else {
      try {
        localStorage.setItem(DARK_MODE_KEY, String(isDarkMode));
      } catch {}
    }
  }, [isDarkMode, mounted]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  const setDarkMode = useCallback((value: boolean) => {
    setIsDarkMode(value);
  }, []);

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode, setDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
};

export const useDarkMode = (): DarkModeContextValue => {
  const context = useContext(DarkModeContext);
  if (!context) {
    // Return default if not in provider
    return {
      isDarkMode: false,
      toggleDarkMode: () => {},
      setDarkMode: () => {},
    };
  }
  return context;
};

export default DarkModeContext;
