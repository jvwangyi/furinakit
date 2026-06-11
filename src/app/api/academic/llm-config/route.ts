import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/auth-helpers';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

// ─── Encryption helpers ──────────────────────────────────────────────────────

const ENCRYPTION_KEY = process.env.LLM_CONFIG_SECRET || 'furinakit-llm-config-default-key-32b!';
const ALGORITHM = 'aes-256-gcm';

function encrypt(text: string): string {
  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const tag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${tag}:${encrypted}`;
}

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

// ─── GET: Fetch user's LLM configs (one per provider) ────────────────────────

export async function GET(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const configs = await prisma.lLMConfig.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        provider: true,
        name: true,
        apiKey: true,
        model: true,
        baseUrl: true,
        saveMode: true,
        isActive: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    // Deduplicate: keep only the most recently updated config per provider
    const seen = new Set<string>();
    const unique: typeof configs = [];
    for (const c of configs) {
      if (!seen.has(c.provider)) {
        seen.add(c.provider);
        unique.push(c);
      }
    }

    // Decrypt API keys for the response
    const decrypted = unique.map((c) => ({
      id: c.id,
      provider: c.provider,
      name: c.name,
      apiKey: decrypt(c.apiKey),
      model: c.model,
      baseUrl: c.baseUrl,
      saveMode: c.saveMode,
      isActive: c.isActive,
      updatedAt: c.updatedAt,
    }));

    return NextResponse.json({ success: true, data: decrypted });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

// ─── POST: Upsert LLM config (one key per provider) ─────────────────────────

interface PostBody {
  provider: string;
  apiKey: string;
  model?: string;
  baseUrl?: string;
  saveMode?: 'session' | 'persistent';
  name?: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body: PostBody = await request.json();
    const { provider, apiKey, model, baseUrl, saveMode = 'persistent', name } = body;

    if (!provider || !apiKey) {
      return NextResponse.json(
        { success: false, error: 'provider and apiKey are required' },
        { status: 400 },
      );
    }

    const validProviders = ['claude', 'openai', 'deepseek', 'mimo'];
    if (!validProviders.includes(provider)) {
      return NextResponse.json(
        { success: false, error: `Invalid provider. Must be one of: ${validProviders.join(', ')}` },
        { status: 400 },
      );
    }

    const encryptedKey = encrypt(apiKey);

    // Upsert: if this user already has a config for this provider, overwrite it
    const existing = await prisma.lLMConfig.findFirst({
      where: { userId: user.id, provider },
    });

    const config = existing
      ? await prisma.lLMConfig.update({
          where: { id: existing.id },
          data: {
            name: name || existing.name,
            apiKey: encryptedKey,
            model: model || null,
            baseUrl: baseUrl || null,
            saveMode,
            isActive: true,
          },
        })
      : await prisma.lLMConfig.create({
          data: {
            userId: user.id,
            provider,
            name: name || provider,
            apiKey: encryptedKey,
            model: model || null,
            baseUrl: baseUrl || null,
            saveMode,
          },
        });

    return NextResponse.json({
      success: true,
      data: {
        id: config.id,
        provider: config.provider,
        name: config.name,
        model: config.model,
        baseUrl: config.baseUrl,
        saveMode: config.saveMode,
        isActive: config.isActive,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

// ─── PATCH: Update config by id (name, baseUrl, isActive) ────────────────────

interface PatchBody {
  id: string;
  name?: string;
  baseUrl?: string;
  isActive?: boolean;
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body: PatchBody = await request.json();
    const { id, name, baseUrl, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'id is required' },
        { status: 400 },
      );
    }

    // Verify ownership
    const existing = await prisma.lLMConfig.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Config not found' },
        { status: 404 },
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (baseUrl !== undefined) updateData.baseUrl = baseUrl;
    if (isActive !== undefined) updateData.isActive = isActive;

    const config = await prisma.lLMConfig.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      data: {
        id: config.id,
        provider: config.provider,
        name: config.name,
        model: config.model,
        baseUrl: config.baseUrl,
        saveMode: config.saveMode,
        isActive: config.isActive,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}

// ─── DELETE: Remove config by provider ────────────────────────────────────────

export async function DELETE(request: NextRequest) {
  try {
    const user = await getSessionUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const provider = searchParams.get('provider');

    if (!provider) {
      return NextResponse.json(
        { success: false, error: 'provider query param is required' },
        { status: 400 },
      );
    }

    // Delete all configs for this user+provider (should be at most 1)
    const result = await prisma.lLMConfig.deleteMany({
      where: { userId: user.id, provider },
    });

    if (result.count === 0) {
      return NextResponse.json(
        { success: false, error: 'Config not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 },
    );
  }
}
