/**
 * Shared LLM helper for API routes.
 * Provides key rotation: fetches all active keys for the same provider
 * from the database and passes them to streamLLMWithRetry.
 */

import { streamLLMWithRetry, type LLMConfig, type Message } from '@/lib/academic/llm';
import { prisma } from '@/lib/prisma';
import { getSessionUser } from '@/lib/auth-helpers';
import { NextRequest } from 'next/server';
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.LLM_CONFIG_SECRET || 'furinakit-llm-config-default-key-32b!';
const ALGORITHM = 'aes-256-gcm';

function decrypt(encryptedText: string): string {
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const [ivHex, tagHex, encrypted] = encryptedText.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

/**
 * Fetch all active API keys for a given user and provider.
 * Returns decrypted keys, ordered by creation time.
 */
async function getActiveKeysForProvider(
  userId: string,
  provider: string,
): Promise<string[]> {
  const configs = await prisma.lLMConfig.findMany({
    where: {
      userId,
      provider,
      isActive: true,
    },
    select: { apiKey: true },
    orderBy: { createdAt: 'asc' },
  });
  return configs.map((c) => decrypt(c.apiKey));
}

/**
 * Fetch alternative keys for a provider, excluding the current key.
 * Returns empty array if user is not authenticated or on any error.
 */
export async function getAltKeys(
  userId: string,
  provider: string,
  currentApiKey: string,
): Promise<string[]> {
  try {
    const allKeys = await getActiveKeysForProvider(userId, provider);
    return allKeys.filter((k) => k !== currentApiKey);
  } catch {
    return [];
  }
}

/**
 * Stream LLM with automatic key rotation.
 * Attempts the primary key first, then tries alternative keys on failure.
 *
 * @param config - Primary LLM config with apiKey to try first
 * @param messages - Chat messages
 * @param altKeys - Alternative API keys to try on failure (same provider)
 * @yields Text tokens from the LLM response
 */
export async function* streamLLMWithKeyRotation(
  config: LLMConfig,
  messages: Message[],
  altKeys: string[] = [],
): AsyncGenerator<string> {
  yield* streamLLMWithRetry(config, messages, altKeys);
}
