import { useState, useEffect, useCallback } from 'react';

/**
 * useState that persists to sessionStorage.
 * Restores state on mount, saves on change.
 */
export function usePersistedState<T>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((prev: T) => T)) => void] {
  const storageKey = `furinakit:${key}`;

  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored !== null) {
        return JSON.parse(stored);
      }
    } catch {
      // ignore parse errors
    }
    return defaultValue;
  });

  // Save to sessionStorage whenever state changes
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // sessionStorage might be full or unavailable
    }
  }, [state, storageKey]);

  return [state, setState];
}

/**
 * Persist only specific keys of an object to sessionStorage.
 * Useful when you want to persist some fields but not others (e.g. skip streaming/loading states).
 */
export function usePersistedFields<T extends Record<string, unknown>>(
  key: string,
  fields: (keyof T)[],
  defaults: T,
): [T, (patch: Partial<T> | ((prev: T) => Partial<T>)) => void] {
  const storageKey = `furinakit:${key}`;

  const [state, setState] = useState<T>(() => {
    if (typeof window === 'undefined') return defaults;
    try {
      const stored = sessionStorage.getItem(storageKey);
      if (stored !== null) {
        const parsed = JSON.parse(stored);
        // Merge stored fields with defaults (so new fields get defaults)
        const result = { ...defaults };
        for (const f of fields) {
          if (f in parsed) {
            (result as Record<string, unknown>)[f as string] = parsed[f as string];
          }
        }
        return result;
      }
    } catch {
      // ignore
    }
    return defaults;
  });

  // Only persist the specified fields
  useEffect(() => {
    try {
      const toStore: Record<string, unknown> = {};
      for (const f of fields) {
        toStore[f as string] = state[f as string];
      }
      sessionStorage.setItem(storageKey, JSON.stringify(toStore));
    } catch {
      // ignore
    }
  }, [state, fields, storageKey]);

  const patch = useCallback(
    (patch: Partial<T> | ((prev: T) => Partial<T>)) => {
      setState((prev) => {
        const patchObj = typeof patch === 'function' ? patch(prev) : patch;
        return { ...prev, ...patchObj };
      });
    },
    [],
  );

  return [state, patch];
}
