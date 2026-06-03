import { NextResponse } from 'next/server';
import { getAllTools } from '@/lib/tools';

export async function GET() {
  const tools = getAllTools().map(tool => ({
    name: tool.name,
    description: tool.description,
    category: tool.category,
  }));
  
  return NextResponse.json({ success: true, data: tools });
}
