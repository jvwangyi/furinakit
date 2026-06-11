'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from 'react';
import {
  ApiKeyModal,
  getStoredLLMSettings,
  storeLLMSettings,
  type LLMSettings,
} from '@/components/academic/ApiKeyModal';
import { apiPath } from '@/lib/utils';

/** A single saved key entry (from server or localStorage). */
export interface SavedKeyEntry {
  id: string;
  provider: string;
  name: string;
  apiKey: string;
  model: string | null;
  baseUrl: string | null;
  saveMode: string;
  isActive: boolean;
  updatedAt?: string;
}

interface LLMContextValue {
  settings: LLMSettings | null;
  /** All saved keys grouped by provider (from server). */
  allKeys: SavedKeyEntry[];
  /** Select a key by id and update active settings. */
  selectKey: (keyId: string) => void;
  /** Get the next available key for a provider (round-robin, skipping inactive). */
  getNextKey: (provider: string) => string | null;
  /** Get all active API keys for a provider (for multi-key retry). */
  getAllKeysForProvider: (provider: string) => string[];
  /** Get full LLMConfig object with apiKeys array for streamLLM. */
  getLLMConfig: () => { provider: string; apiKey: string; apiKeys: string[]; model?: string; baseUrl?: string } | null;
  /** Report a key failure so it's deprioritized in rotation. */
  reportKeyFailure: (provider: string, keyPreview: string) => void;
  openSettings: (presetIdOrEvent?: string | React.MouseEvent) => void;
  refreshKeys: () => void;
}

const LLMContext = createContext<LLMContextValue>({
  settings: null,
  allKeys: [],
  selectKey: () => {},
  getNextKey: () => null,
  getAllKeysForProvider: () => [],
  getLLMConfig: () => null,
  reportKeyFailure: () => {},
  openSettings: () => {},
  refreshKeys: () => {},
});

export function useLLM() {
  return useContext(LLMContext);
}

interface LLMProviderProps {
  children: ReactNode;
}

export function LLMProvider({ children }: LLMProviderProps) {
  const [settings, setSettings] = useState<LLMSettings | null>(null);
  const [allKeys, setAllKeys] = useState<SavedKeyEntry[]>([]);
  const [mounted, setMounted] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [initialPresetId, setInitialPresetId] = useState<string | undefined>(undefined);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Round-robin index per provider
  const rotationIndexRef = useRef<Record<string, number>>({});
  // Track recently failed keys to deprioritize them
  const failedKeysRef = useRef<Record<string, Set<string>>>({});

  // Check login status on mount
  useEffect(() => {
    fetch(apiPath('/api/user/me'))
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setIsLoggedIn(true);
      })
      .catch(() => {});
  }, []);

  // Fetch all saved keys from server
  const fetchAllKeys = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const res = await fetch(apiPath('/api/academic/llm-config'));
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setAllKeys(data.data || []);
      }
    } catch {
      // ignore
    }
  }, [isLoggedIn]);

  useEffect(() => {
    fetchAllKeys();
  }, [fetchAllKeys]);

  // Re-read from localStorage when modal closes (in case settings changed)
  const handleOpenChange = useCallback(
    (open: boolean) => {
      setModalOpen(open);
      if (!open) {
        setInitialPresetId(undefined);
        const saved = getStoredLLMSettings();
        setSettings(saved);
        // Also refresh server keys in case new ones were added
        fetchAllKeys();
      }
    },
    [fetchAllKeys],
  );

  const openSettings = useCallback((presetIdOrEvent?: string | React.MouseEvent) => {
    const presetId = typeof presetIdOrEvent === 'string' ? presetIdOrEvent : undefined;
    setInitialPresetId(presetId);
    setModalOpen(true);
  }, []);

  const handleSave = useCallback((s: LLMSettings) => {
    setSettings(s);
  }, []);

  const selectKey = useCallback((keyId: string) => {
    const key = allKeys.find((k) => k.id === keyId);
    if (!key) return;
    const newSettings: LLMSettings = {
      provider: key.provider as LLMSettings['provider'],
      apiKey: key.apiKey,
      model: key.model || undefined,
      baseUrl: key.baseUrl || undefined,
      saveMode: key.saveMode as LLMSettings['saveMode'],
    };
    storeLLMSettings(newSettings);
    setSettings(newSettings);
    window.dispatchEvent(new Event('llm-config-changed'));
  }, [allKeys]);

  // Sync on mount (read from localStorage after hydration)
  useEffect(() => {
    setMounted(true);
    const saved = getStoredLLMSettings();
    if (saved) setSettings(saved);
  }, []);

  // Listen for config-changed events (e.g. from handleDelete in settings page)
  useEffect(() => {
    const handleChange = () => {
      const saved = getStoredLLMSettings();
      setSettings(saved);
    };
    window.addEventListener('llm-config-changed', handleChange);
    return () => window.removeEventListener('llm-config-changed', handleChange);
  }, []);

  // Listen for llm-config-changed events (e.g. from settings page delete)
  useEffect(() => {
    const handleChange = () => {
      const saved = getStoredLLMSettings();
      setSettings(saved);
      fetchAllKeys();
    };
    window.addEventListener('llm-config-changed', handleChange);
    return () => window.removeEventListener('llm-config-changed', handleChange);
  }, [fetchAllKeys]);

  /**
   * Get the next available API key for a provider.
   * Priority: active server keys (round-robin) → localStorage fallback.
   * Recently failed keys are deprioritized (tried last).
   */
  const getNextKey = useCallback(
    (provider: string): string | null => {
      // Get active server keys for this provider
      const providerKeys = allKeys.filter(
        (k) => k.provider === provider && k.isActive,
      );

      if (providerKeys.length === 0) {
        // No server keys — fall back to localStorage
        const local = getStoredLLMSettings();
        if (local && local.provider === provider) return local.apiKey;
        return null;
      }

      // Separate into non-failed and recently-failed
      const failed = failedKeysRef.current[provider] || new Set();
      const active = providerKeys.filter((k) => !failed.has(k.apiKey));
      const deprioritized = providerKeys.filter((k) => failed.has(k.apiKey));
      const ordered = [...active, ...deprioritized];

      // Round-robin
      const idx = rotationIndexRef.current[provider] || 0;
      const selected = ordered[idx % ordered.length];
      rotationIndexRef.current[provider] = (idx + 1) % ordered.length;

      return selected.apiKey;
    },
    [allKeys],
  );

  /**
   * Get all active API keys for a provider (for multi-key retry in streamLLM).
   * Falls back to localStorage key if no server keys exist.
   */
  const getAllKeysForProvider = useCallback(
    (provider: string): string[] => {
      const providerKeys = allKeys
        .filter((k) => k.provider === provider && k.isActive)
        .map((k) => k.apiKey);

      if (providerKeys.length === 0) {
        // No server keys — fall back to localStorage
        const local = getStoredLLMSettings();
        if (local && local.provider === provider) return [local.apiKey];
        return [];
      }

      return providerKeys;
    },
    [allKeys],
  );

  /**
   * Get full LLMConfig object with apiKeys array for streamLLM.
   * This is the main method pipeline stages should use.
   */
  const getLLMConfig = useCallback(
    (): { provider: string; apiKey: string; apiKeys: string[]; model?: string; baseUrl?: string } | null => {
      if (!settings) return null;
      const allProviderKeys = getAllKeysForProvider(settings.provider);
      return {
        provider: settings.provider,
        apiKey: settings.apiKey,
        apiKeys: allProviderKeys,
        model: settings.model,
        baseUrl: settings.baseUrl,
      };
    },
    [settings, getAllKeysForProvider],
  );

  /**
   * Report that a specific key failed. It will be deprioritized in future rotations
   * (tried last instead of round-robin).
   */
  const reportKeyFailure = useCallback((provider: string, keyVal: string) => {
    if (!failedKeysRef.current[provider]) {
      failedKeysRef.current[provider] = new Set();
    }
    failedKeysRef.current[provider].add(keyVal);

    // Clear the failure after 5 minutes (rate limits usually expire)
    setTimeout(() => {
      failedKeysRef.current[provider]?.delete(keyVal);
    }, 5 * 60 * 1000);
  }, []);

  return (
    <LLMContext.Provider
      value={{
        settings: mounted ? settings : null,
        allKeys,
        selectKey,
        getNextKey,
        getAllKeysForProvider,
        getLLMConfig,
        reportKeyFailure,
        openSettings,
        refreshKeys: fetchAllKeys,
      }}
    >
      {children}
      <ApiKeyModal
        open={modalOpen}
        onOpenChange={handleOpenChange}
        onSave={handleSave}
        isLoggedIn={isLoggedIn}
        initialPresetId={initialPresetId}
      />
    </LLMContext.Provider>
  );
}
