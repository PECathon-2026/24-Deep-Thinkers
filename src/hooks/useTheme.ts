import { useEffect, useState, useCallback } from 'react';
import { db } from '../lib/db';
import type { Settings } from '../types';

export function useTheme() {
  const [settings, setSettings] = useState<Settings>({
    id: 'current',
    sharingEnabled: false,
    theme: 'system',
    fontSize: 'base',
    fontFamily: 'serif',
  });

  const [isLoading, setIsLoading] = useState(true);

  // Load from Dexie on mount
  useEffect(() => {
    let isMounted = true;
    db.settings.get('current').then((saved) => {
      if (isMounted && saved) {
        setSettings(saved);
      }
      if (isMounted) setIsLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Apply dark class to document
  useEffect(() => {
    const root = document.documentElement;
    const isDark =
      settings.theme === 'dark' ||
      (settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

    if (isDark) {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', isDark ? '#0c0a09' : '#fafaf9');
    }
  }, [settings.theme]);

  const updateSettings = useCallback(async (partial: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      db.settings.put(next).catch(console.error);
      return next;
    });
  }, []);

  return { settings, updateSettings, isLoading };
}
