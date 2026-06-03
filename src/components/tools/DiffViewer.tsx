'use client';

import { useMemo } from 'react';

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
}

function parseDiff(text: string): DiffLine[] {
  const lines = text.split('\n');
  const result: DiffLine[] = [];
  let oldLine = 1;
  let newLine = 1;

  for (const line of lines) {
    // ANSI color codes: \x1b[32m = green (added), \x1b[31m = red (removed), \x1b[0m = reset
    const isAdded = line.includes('\x1b[32m');
    const isRemoved = line.includes('\x1b[31m');
    // Strip ANSI codes
    const clean = line.replace(/\x1b\[[0-9;]*m/g, '');

    if (isAdded) {
      result.push({ type: 'added', content: clean.replace(/^\+/, ''), newLineNum: newLine++ });
    } else if (isRemoved) {
      result.push({ type: 'removed', content: clean.replace(/^-/, ''), oldLineNum: oldLine++ });
    } else {
      result.push({ type: 'unchanged', content: clean, oldLineNum: oldLine++, newLineNum: newLine++ });
    }
  }

  return result;
}

interface DiffViewerProps {
  diffText: string;
  mode?: 'split' | 'unified';
}

export function DiffViewer({ diffText, mode = 'unified' }: DiffViewerProps) {
  const lines = useMemo(() => parseDiff(diffText), [diffText]);

  const stats = useMemo(() => {
    const added = lines.filter(l => l.type === 'added').length;
    const removed = lines.filter(l => l.type === 'removed').length;
    return { added, removed };
  }, [lines]);

  if (mode === 'split') {
    return <SplitDiffView lines={lines} />;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4 text-xs">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400 font-medium">+{stats.added} 新增</span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-medium">-{stats.removed} 删除</span>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <div className="max-h-[500px] overflow-auto font-mono text-sm">
          {lines.map((line, i) => (
            <div
              key={i}
              className={`flex ${
                line.type === 'added'
                  ? 'bg-green-50 dark:bg-green-950/30'
                  : line.type === 'removed'
                  ? 'bg-red-50 dark:bg-red-950/30'
                  : ''
              }`}
            >
              <span className="w-12 text-right pr-2 text-muted-foreground select-none shrink-0 border-r text-xs leading-6">
                {line.oldLineNum ?? ''}
              </span>
              <span className="w-12 text-right pr-2 text-muted-foreground select-none shrink-0 border-r text-xs leading-6">
                {line.newLineNum ?? ''}
              </span>
              <span className={`w-6 text-center shrink-0 font-bold leading-6 ${
                line.type === 'added' ? 'text-green-600' : line.type === 'removed' ? 'text-red-600' : ''
              }`}>
                {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
              </span>
              <span className="flex-1 px-2 leading-6 whitespace-pre-wrap break-all">
                {line.content}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SplitDiffView({ lines }: { lines: DiffLine[] }) {
  const oldLines = lines.filter(l => l.type !== 'added');
  const newLines = lines.filter(l => l.type !== 'removed');

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="border rounded-lg overflow-hidden">
        <div className="px-3 py-1.5 bg-red-50 dark:bg-red-950/30 border-b text-xs font-medium text-red-700 dark:text-red-400">
          旧文本
        </div>
        <div className="max-h-[400px] overflow-auto font-mono text-sm">
          {oldLines.map((line, i) => (
            <div key={i} className={`flex ${line.type === 'removed' ? 'bg-red-50 dark:bg-red-950/30' : ''}`}>
              <span className="w-8 text-right pr-2 text-muted-foreground select-none shrink-0 text-xs leading-6">
                {line.oldLineNum ?? ''}
              </span>
              <span className="flex-1 px-2 leading-6 whitespace-pre-wrap break-all">
                {line.content}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="border rounded-lg overflow-hidden">
        <div className="px-3 py-1.5 bg-green-50 dark:bg-green-950/30 border-b text-xs font-medium text-green-700 dark:text-green-400">
          新文本
        </div>
        <div className="max-h-[400px] overflow-auto font-mono text-sm">
          {newLines.map((line, i) => (
            <div key={i} className={`flex ${line.type === 'added' ? 'bg-green-50 dark:bg-green-950/30' : ''}`}>
              <span className="w-8 text-right pr-2 text-muted-foreground select-none shrink-0 text-xs leading-6">
                {line.newLineNum ?? ''}
              </span>
              <span className="flex-1 px-2 leading-6 whitespace-pre-wrap break-all">
                {line.content}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
