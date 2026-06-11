/**
 * useLLMKeys — provides key rotation for pipeline components.
 *
 * Wraps useLLM() and adds fetchLLM() for automatic key rotation.
 */

'use client';

import { useCallback, useRef, useState, useEffect } from 'react';
import { useLLM } from '@/components/academic/LLMProvider';
import { apiPath } from '@/lib/utils';
import type { LLMSettings } from '@/components/academic/ApiKeyModal';

interface KeyEntry {
  id: string;
  provider: string;
  apiKey: string;
  name: string;
  baseUrl?: string;
  isActive: boolean;
}

interface UseLLMKeysReturn {
  /** Current LLM settings (may have null apiKey if no keys configured) */
  llmSettings: LLMSettings | null;
  /** Open the settings modal */
  openSettings: () => void;
  /** Check if any key is available for the current provider */
  hasKeys: boolean;
  /** Make an LLM API call with automatic key rotation on failure */
  fetchLLM: (endpoint: string, body: Record<string, unknown>) => Promise<Response>;
}

export function useLLMKeys(): UseLLMKeysReturn {
  const { settings: llmSettings, openSettings } = useLLM();
  const keysRef = useRef<KeyEntry[]>([]);
  const [hasKeys, setHasKeys] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check login status
  useEffect(() => {
    fetch(apiPath('/api/user/me'))
      .then(res => res.json())
      .then(data => { if (data.success) setIsLoggedIn(true); })
      .catch(() => {});
  }, []);

  // Load keys when provider changes or login state changes
  useEffect(() => {
    if (!llmSettings?.provider) return;
    let cancelled = false;

    async function loadKeys() {
      const allKeys: KeyEntry[] = [];

      if (isLoggedIn) {
        try {
          const res = await fetch(apiPath('/api/academic/llm-config'));
          if (res.ok) {
            const data = await res.json();
            const configs = data.success ? data.data : [];
            for (const c of configs) {
              if (c.provider === llmSettings!.provider && c.isActive) {
                allKeys.push({
                  id: c.id,
                  provider: c.provider,
                  apiKey: c.apiKey,
                  name: c.name,
                  baseUrl: c.baseUrl || undefined,
                  isActive: c.isActive,
                });
              }
            }
          }
        } catch { /* ignore */ }
      }

      if (!cancelled) {
        keysRef.current = allKeys;
        setHasKeys(allKeys.length > 0);
      }
    }

    loadKeys();
    return () => { cancelled = true; };
  }, [llmSettings?.provider, isLoggedIn]);

  /**
   * Make an LLM API call with automatic key rotation.
   * Tries up to 3 keys; on 429/401/500, switches to next key and retries.
   */
  const fetchLLM = useCallback(async (
    endpoint: string,
    body: Record<string, unknown>,
  ): Promise<Response> => {
    const provider = llmSettings?.provider;
    if (!provider) throw new Error('No LLM provider configured');

    const keys = keysRef.current;
    if (keys.length === 0) throw new Error(`No API keys available for ${provider}`);

    const maxRetries = Math.min(keys.length, 3);
    let lastError: Error | null = null;
    const triedIds = new Set<string>();

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // Pick next untried key (round-robin)
      const key = keys.find(k => !triedIds.has(k.id)) || keys[attempt % keys.length];
      if (!key) break;
      triedIds.add(key.id);

      // Build LLM config with this key
      const llmConfig: LLMSettings = {
        provider: provider as LLMSettings['provider'],
        apiKey: key.apiKey,
        model: (body.llm as LLMSettings | undefined)?.model,
        baseUrl: (body.llm as LLMSettings | undefined)?.baseUrl || key.baseUrl,
        saveMode: 'persistent',
      };

      const requestBody = { ...body, llm: llmConfig };

      try {
        const res = await fetch(apiPath(endpoint), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });

        if (res.ok) return res;

        // Retryable errors
        if (res.status === 429 || res.status === 401 || res.status === 500) {
          lastError = new Error(`API error: ${res.status}`);
          continue;
        }

        // Non-retryable — return as-is
        return res;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        continue;
      }
    }

    throw lastError || new Error(`All ${triedIds.size} API keys failed for provider: ${provider}`);
  }, [llmSettings?.provider]);

  return {
    llmSettings,
    openSettings,
    hasKeys,
    fetchLLM,
  };
}
