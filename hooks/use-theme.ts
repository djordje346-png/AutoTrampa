'use client';

import { useState, useEffect, useCallback } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'autotrampa_theme';

let globalTheme: Theme = 'dark';
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
  globalTheme = stored || 'dark';
  if (globalTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

const listeners = new Set<(theme: Theme) => void>();

function setGlobalTheme(theme: Theme) {
  globalTheme = theme;
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
  listeners.forEach((listener) => listener(theme));
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(globalTheme);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const listener = (newTheme: Theme) => setTheme(newTheme);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setGlobalTheme(globalTheme === 'dark' ? 'light' : 'dark');
  }, []);

  const setThemeExplicit = useCallback((t: Theme) => {
    setGlobalTheme(t);
  }, []);

  return { theme, toggleTheme, setTheme: setThemeExplicit, mounted };
}
