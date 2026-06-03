import { NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function GET() {
  try {
    const specPath = join(process.cwd(), 'docs', 'api', 'openapi.yaml');
    const spec = readFileSync(specPath, 'utf-8');
    
    return new NextResponse(spec, {
      headers: {
        'Content-Type': 'text/yaml; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch {
    // Fallback: return a minimal spec if file not found
    return NextResponse.json(
      { error: 'OpenAPI spec not found. Run the build first.' },
      { status: 404 }
    );
  }
}
