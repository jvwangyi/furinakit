import { randomBytes, createHash } from 'crypto';

export interface ApiKey {
  id: string;
  name: string;
  keyHash: string;
  createdAt: string;
  lastUsedAt: string | null;
  requestCount: number;
  enabled: boolean;
}

// In-memory store (could be persisted to file/db later)
const apiKeys = new Map<string, ApiKey>();

export function generateApiKey(name: string): { key: string; apiKey: ApiKey } {
  const key = `fk_${randomBytes(32).toString('hex')}`;
  const keyHash = createHash('sha256').update(key).digest('hex');
  const id = randomBytes(8).toString('hex');

  const apiKey: ApiKey = {
    id,
    name,
    keyHash,
    createdAt: new Date().toISOString(),
    lastUsedAt: null,
    requestCount: 0,
    enabled: true,
  };

  apiKeys.set(id, apiKey);
  return { key, apiKey };
}

export function validateApiKey(key: string): ApiKey | null {
  const keyHash = createHash('sha256').update(key).digest('hex');

  for (const apiKey of apiKeys.values()) {
    if (apiKey.keyHash === keyHash && apiKey.enabled) {
      apiKey.lastUsedAt = new Date().toISOString();
      apiKey.requestCount++;
      return apiKey;
    }
  }
  return null;
}

export function listApiKeys(): Omit<ApiKey, 'keyHash'>[] {
  return Array.from(apiKeys.values())
    .filter(k => k.enabled)
    .map(({ keyHash: _keyHash, ...rest }) => rest);
}

export function revokeApiKey(id: string): boolean {
  const apiKey = apiKeys.get(id);
  if (apiKey) {
    apiKeys.delete(id);
    return true;
  }
  return false;
}
