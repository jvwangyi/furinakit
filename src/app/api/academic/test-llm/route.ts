import { NextRequest, NextResponse } from 'next/server';

const API_ENDPOINTS: Record<string, string> = {
  claude: 'https://api.anthropic.com/v1/messages',
  openai: 'https://api.openai.com/v1/chat/completions',
  deepseek: 'https://api.deepseek.com/v1/chat/completions',
  mimo: 'https://api.xiaomimimo.com/v1/chat/completions',
};

const DEFAULT_MODELS: Record<string, string> = {
  claude: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o',
  deepseek: 'deepseek-chat',
  mimo: 'mimo-v2.5-pro',
};

/**
 * Resolve the actual endpoint URL.
 * Preset baseUrl is already a full path; custom baseUrl might be just the base.
 */
function resolveEndpoint(provider: string, baseUrl?: string): string {
  if (!baseUrl) return API_ENDPOINTS[provider] || '';
  // Already a full endpoint — use directly
  if (baseUrl.includes('/chat/completions') || baseUrl.includes('/messages')) {
    return baseUrl;
  }
  // Ends with /v1 — just append the resource path (no extra /v1)
  if (/\/v1\/?$/.test(baseUrl)) {
    if (provider === 'claude') return baseUrl.replace(/\/+$/, '') + '/messages';
    return baseUrl.replace(/\/+$/, '') + '/chat/completions';
  }
  // Bare base URL — append full path
  if (provider === 'claude') {
    return baseUrl.replace(/\/+$/, '') + '/v1/messages';
  }
  return baseUrl.replace(/\/+$/, '') + '/v1/chat/completions';
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, apiKey, model, baseUrl } = body;

    if (!provider || !apiKey) {
      return NextResponse.json(
        { success: false, error: 'Missing provider or apiKey' },
        { status: 400 },
      );
    }

    const endpoint = resolveEndpoint(provider, baseUrl);
    if (!endpoint) {
      return NextResponse.json(
        { success: false, error: `Unknown provider: ${provider}` },
        { status: 400 },
      );
    }

    const useModel = model || DEFAULT_MODELS[provider] || 'gpt-4o';

    // Build request — use stream:false for simpler response parsing
    let url: string;
    let headers: Record<string, string>;
    let bodyObj: Record<string, unknown>;

    if (provider === 'claude') {
      // Anthropic Messages API
      url = endpoint;
      headers = {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      };
      bodyObj = {
        model: useModel,
        max_tokens: 16,
        stream: false,
        messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
      };
    } else {
      // OpenAI-compatible Chat Completions API
      url = endpoint;
      headers = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      };
      bodyObj = {
        model: useModel,
        max_tokens: 16,
        stream: false,
        messages: [{ role: 'user', content: 'Reply with exactly: OK' }],
      };
    }

    const startTime = Date.now();

    const res = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(bodyObj),
      signal: AbortSignal.timeout(20000),
    });

    const latencyMs = Date.now() - startTime;

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      let errMsg = `HTTP ${res.status}`;
      try {
        const errJson = JSON.parse(errText);
        errMsg = errJson.error?.message || errJson.message || errMsg;
      } catch {
        if (errText) errMsg = errText.slice(0, 300);
      }
      // Friendly hints for common errors
      if (res.status === 401) errMsg = `认证失败 (401): API Key 无效或已过期`;
      if (res.status === 403) errMsg = `权限不足 (403): API Key 没有访问该模型的权限`;
      if (res.status === 404) errMsg = `端点不存在 (404): 请检查 URL 和模型名称。当前: ${url}`;
      if (res.status === 429) errMsg = `频率限制 (429): 请求过于频繁，请稍后重试`;
      return NextResponse.json({ success: false, error: errMsg, latencyMs });
    }

    // Validate response body
    const resText = await res.text();
    let reply = '';
    try {
      const resJson = JSON.parse(resText);
      if (provider === 'claude') {
        // Anthropic: { content: [{ type: "text", text: "..." }] }
        reply = resJson.content?.[0]?.text || '';
      } else {
        // OpenAI: { choices: [{ message: { content: "..." } }] }
        reply = resJson.choices?.[0]?.message?.content || '';
      }
    } catch {
      // Response is not JSON — still a 200, so endpoint is reachable
    }

    return NextResponse.json({
      success: true,
      model: useModel,
      latencyMs,
      reply: reply.slice(0, 100),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error';
    // Network-level errors
    if (msg.includes('fetch failed') || msg.includes('ENOTFOUND')) {
      return NextResponse.json({
        success: false,
        error: `网络错误: 无法连接到 API 端点。请检查 URL 是否正确。`,
      });
    }
    if (msg.includes('abort') || msg.includes('timeout')) {
      return NextResponse.json({
        success: false,
        error: `连接超时 (20s): API 端点响应过慢或无法访问`,
      });
    }
    return NextResponse.json({ success: false, error: msg });
  }
}
