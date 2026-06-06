'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'furinakit-favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch {}
    setLoaded(true);
  }, []);

  const toggleFavorite = useCallback((toolName: string) => {
    setFavorites(prev => {
      const updated = prev.includes(toolName)
        ? prev.filter(t => t !== toolName)
        : [...prev, toolName];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  const isFavorite = useCallback((toolName: string) => {
    return favorites.includes(toolName);
  }, [favorites]);

  return { favorites, toggleFavorite, isFavorite, loaded };
}
