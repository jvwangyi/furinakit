import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { prisma } from '@/lib/prisma';
import os from 'os';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/system — System information
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request);
  if (auth.error) return auth.error;

  const mem = process.memoryUsage();
  const uptime = process.uptime();

  // Database info
  const dbPath = process.env.DATABASE_URL || 'file:./prisma/dev.db';
  let dbSize = 'N/A';
  try {
    const fs = await import('fs');
    const path = await import('path');
    // Extract the file path from the URL
    const filePath = dbPath.replace('file:', '');
    const resolvedPath = path.resolve(filePath);
    if (fs.existsSync(resolvedPath)) {
      const stats = fs.statSync(resolvedPath);
      dbSize = `${(stats.size / 1024 / 1024).toFixed(2)} MB`;
    }
  } catch {
    // ignore
  }

  const [userCount, sessionCount, historyCount, favoriteCount] = await Promise.all([
    prisma.user.count(),
    prisma.session.count(),
    prisma.toolUsageHistory.count(),
    prisma.favorite.count(),
  ]);

  // Environment variables (masked)
  const envVars: Record<string, string> = {};
  const safeKeys = [
    'NODE_ENV', 'NEXT_PUBLIC_BASE_PATH', 'DATABASE_URL',
    'GITHUB_ID', 'RESEND_API_KEY', 'EMAIL_FROM',
  ];
  for (const key of safeKeys) {
    const val = process.env[key];
    if (val) {
      if (key.includes('SECRET') || key.includes('KEY') || key.includes('TOKEN') || key.includes('PASSWORD')) {
        envVars[key] = val.slice(0, 4) + '****' + val.slice(-4);
      } else if (val.length > 50) {
        envVars[key] = val.slice(0, 20) + '...' + val.slice(-10);
      } else {
        envVars[key] = val;
      }
    }
  }

  return NextResponse.json({
    success: true,
    data: {
      server: {
        uptime: Math.round(uptime),
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
        hostname: os.hostname(),
        cpus: os.cpus().length,
        totalMemory: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(1)} GB`,
        freeMemory: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(1)} GB`,
        heapUsed: `${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB`,
        heapTotal: `${(mem.heapTotal / 1024 / 1024).toFixed(1)} MB`,
        rss: `${(mem.rss / 1024 / 1024).toFixed(1)} MB`,
      },
      database: {
        url: dbPath.replace(/\/\/.*@/, '//***@'),
        size: dbSize,
        records: { users: userCount, sessions: sessionCount, history: historyCount, favorites: favoriteCount },
      },
      environment: envVars,
    },
  });
}
