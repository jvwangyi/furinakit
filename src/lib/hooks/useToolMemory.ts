'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'furinakit-tool-memory';
const MAX_TOOLS = 20;

interface ToolMemoryEntry {
  params: Record<string, unknown>;
  updatedAt: number;
}

interface ToolMemoryStore {
  [toolName: string]: ToolMemoryEntry;
}

function loadStore(): ToolMemoryStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

function saveStore(store: ToolMemoryStore): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {}
}

function evictOldest(store: ToolMemoryStore): ToolMemoryStore {
  const entries = Object.entries(store);
  if (entries.length <= MAX_TOOLS) return store;
  // Sort by updatedAt ascending, remove oldest
  entries.sort((a, b) => a[1].updatedAt - b[1].updatedAt);
  const trimmed = entries.slice(entries.length - MAX_TOOLS);
  return Object.fromEntries(trimmed);
}

/**
 * Hook to remember the last-used parameters for each tool.
 * Stores in localStorage under key `tool-memory:{toolName}` (aggregated in one key).
 *
 * @param toolName - The tool identifier (e.g. "pdf-merge")
 * @param defaultParams - Default parameter values to use when no memory exists
 */
export function useToolMemory<T extends Record<string, unknown>>(
  toolName: string,
  defaultParams: T
) {
  const [params, setParamsState] = useState<T>(defaultParams);
  const loadedRef = useRef(false);

  // Load saved params on mount
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    const store = loadStore();
    const entry = store[toolName];
    if (entry?.params) {
      // Merge: saved values override defaults, but keep any new default keys
      setParamsState({ ...defaultParams, ...entry.params } as T);
    }
  }, [toolName]); // eslint-disable-line react-hooks/exhaustive-deps

  const setParams = useCallback(
    (updater: T | ((prev: T) => T)) => {
      setParamsState(prev => {
        const next = typeof updater === 'function' ? (updater as (prev: T) => T)(prev) : updater;
        // Persist to localStorage
        const store = loadStore();
        store[toolName] = {
          params: next as Record<string, unknown>,
          updatedAt: Date.now(),
        };
        saveStore(evictOldest(store));
        return next;
      });
    },
    [toolName]
  );

  const clearMemory = useCallback(() => {
    const store = loadStore();
    delete store[toolName];
    saveStore(store);
    setParamsState(defaultParams);
  }, [toolName, defaultParams]);

  return { params, setParams, clearMemory } as const;
}
