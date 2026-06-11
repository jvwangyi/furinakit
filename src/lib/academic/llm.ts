/**
 * Unified LLM streaming utility.
 * Supports Claude (Anthropic), OpenAI, DeepSeek, and MiMo.
 * Uses Server-Sent Events (SSE) for streaming responses.
 * API Keys are passed per-request and never stored server-side.
 *
 * Supports automatic key rotation: when streamLLMWithRetry is called with
 * multiple keys, it will try each key in order on retryable errors (401/429/500).
 */

export interface LLMConfig {
  provider: 'claude' | 'openai' | 'deepseek' | 'mimo';
  apiKey: string;
  model?: string;
  baseUrl?: string;  // custom base URL override
  maxTokens?: number;
}

export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const DEFAULT_MODELS: Record<string, string> = {
  claude: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o',
  deepseek: 'deepseek-v4-flash',
  mimo: 'mimo-v2.5-pro',
};

const API_ENDPOINTS: Record<string, string> = {
  claude: 'https://api.anthropic.com/v1/messages',
  openai: 'https://api.openai.com/v1/chat/completions',
  deepseek: 'https://api.deepseek.com/v1/chat/completions',
  mimo: 'https://api.xiaomimimo.com/v1/chat/completions',
};

const TIMEOUT_MS = 120_000;

/**
 * Normalize baseUrl to a full endpoint URL.
 * Handles: full URL, /v1 suffix, bare domain.
 */
function resolveUrl(provider: string, baseUrl?: string): string {
  const fallback = API_ENDPOINTS[provider] || '';
  if (!baseUrl) return fallback;
  // Already a full endpoint
  if (baseUrl.includes('/chat/completions') || baseUrl.includes('/messages')) return baseUrl;
  // Ends with /v1 — append resource path only
  if (/\/v1\/?$/.test(baseUrl)) {
    return provider === 'claude'
      ? baseUrl.replace(/\/+$/, '') + '/messages'
      : baseUrl.replace(/\/+$/, '') + '/chat/completions';
  }
  // Bare domain — append full path
  return provider === 'claude'
    ? baseUrl.replace(/\/+$/, '') + '/v1/messages'
    : baseUrl.replace(/\/+$/, '') + '/v1/chat/completions';
}

interface ProviderRequest {
  url: string;
  headers: Record<string, string>;
  body: Record<string, unknown>;
  /** Extract the text token from a single SSE JSON line (already parsed from `data:` prefix). */
  parseToken: (json: Record<string, unknown>) => string | null;
  /** Check whether the chunk signals stream completion. */
  isDone: (json: Record<string, unknown>) => boolean;
}

function buildRequest(config: LLMConfig, messages: Message[]): ProviderRequest {
  const model = config.model || DEFAULT_MODELS[config.provider];
  const maxTokens = config.maxTokens || 4096;

  switch (config.provider) {
    case 'claude': {
      const systemMsgs = messages.filter((m) => m.role === 'system');
      const nonSystem = messages.filter((m) => m.role !== 'system');
      return {
        url: resolveUrl('claude', config.baseUrl),
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: {
          model,
          max_tokens: maxTokens,
          stream: true,
          system: systemMsgs.map((m) => m.content).join('\n\n') || undefined,
          messages: nonSystem.map((m) => ({ role: m.role, content: m.content })),
        },
        parseToken: (json) => {
          if (json.type === 'content_block_delta') {
            const delta = json.delta as Record<string, unknown> | undefined;
            if (delta?.type === 'text_delta') return (delta.text as string) || null;
          }
          return null;
        },
        isDone: (json) => json.type === 'message_stop',
      };
    }
    case 'openai':
    case 'deepseek':
    case 'mimo': {
      return {
        url: resolveUrl(config.provider, config.baseUrl),
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: {
          model,
          max_tokens: maxTokens,
          stream: true,
          messages: messages.map((m) => ({ role: m.role, content: m.content })),
        },
        parseToken: (json) => {
          const choices = json.choices as Array<Record<string, unknown>> | undefined;
          if (choices && choices.length > 0) {
            const delta = choices[0].delta as Record<string, unknown> | undefined;
            return (delta?.content as string) || null;
          }
          return null;
        },
        isDone: (json) => {
          const choices = json.choices as Array<Record<string, unknown>> | undefined;
          return !!choices?.[0]?.finish_reason;
        },
      };
    }
    default:
      throw new Error(`Unsupported LLM provider: ${config.provider}`);
  }
}

/**
 * Stream LLM response as an async generator of text tokens.
 * Callers consume tokens with `for await (const token of streamLLM(...))`.
 */
export async function* streamLLM(
  config: LLMConfig,
  messages: Message[],
): AsyncGenerator<string> {
  if (!config.apiKey) throw new Error('API Key is required');

  const req = buildRequest(config, messages);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(req.url, {
      method: 'POST',
      headers: req.headers,
      body: JSON.stringify(req.body),
      signal: controller.signal,
    });

    if (!res.ok) {
      let errorMsg = `LLM API error: ${res.status}`;
      try {
        const errBody = await res.json() as Record<string, unknown>;
        const errObj = errBody.error as Record<string, unknown> | undefined;
        errorMsg = (errObj?.message as string) || (errBody.message as string) || errorMsg;
      } catch {
        // ignore parse errors
      }
      if (res.status === 401) throw new Error('API Key is invalid or expired');
      if (res.status === 429) throw new Error('Rate limit exceeded. Please try again later');
      throw new Error(errorMsg);
    }

    const body = res.body;
    if (!body) throw new Error('No response body from LLM API');

    const reader = body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE lines
        const lines = buffer.split('\n');
        // Keep the last (possibly incomplete) line in the buffer
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue; // skip empty lines and comments

          if (trimmed.startsWith('data: ')) {
            const data = trimmed.slice(6);
            if (data === '[DONE]') return;

            try {
              const json = JSON.parse(data) as Record<string, unknown>;
              const token = req.parseToken(json);
              if (token) yield token;
              if (req.isDone(json)) return;
            } catch {
              // skip malformed JSON chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Stream LLM with automatic key rotation on retryable errors.
 *
 * When the API returns 401 (invalid key) or 429 (rate limit), this function
 * will try the next key from `altKeys` if available.
 *
 * @param config - Primary LLM config with apiKey to try first
 * @param messages - Chat messages
 * @param altKeys - Alternative API keys to try on failure (same provider)
 * @yields Text tokens from the LLM response
 */
export async function* streamLLMWithRetry(
  config: LLMConfig,
  messages: Message[],
  altKeys: string[] = [],
): AsyncGenerator<string> {
  const allKeys = [config.apiKey, ...altKeys.filter((k) => k !== config.apiKey)];
  let lastError: Error | null = null;

  for (let i = 0; i < allKeys.length; i++) {
    const currentConfig: LLMConfig = {
      ...config,
      apiKey: allKeys[i],
    };

    try {
      yield* streamLLM(currentConfig, messages);
      return; // Success - exit
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const msg = lastError.message;

      // Only retry on retryable errors
      const isRetryable =
        msg.includes('401') ||
        msg.includes('429') ||
        msg.includes('invalid or expired') ||
        msg.includes('Rate limit') ||
        msg.includes('500') ||
        msg.includes('Internal server error');

      if (!isRetryable || i >= allKeys.length - 1) {
        // Not retryable or no more keys - throw
        throw lastError;
      }

      // Log the retry attempt (will appear in server logs)
      console.warn(
        `[LLM Key Rotation] Key ${i + 1}/${allKeys.length} failed (${msg}), trying next key...`,
      );
    }
  }

  // Should not reach here, but just in case
  throw lastError || new Error('All LLM keys failed');
}

/**
 * Convenience: collect the full streamed response into a single string.
 * Use when you need the complete result rather than streaming tokens.
 */
export async function collectLLM(
  config: LLMConfig,
  messages: Message[],
): Promise<string> {
  let result = '';
  for await (const token of streamLLM(config, messages)) {
    result += token;
  }
  return result;
}
