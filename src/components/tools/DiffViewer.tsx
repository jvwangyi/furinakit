'use client';

import { useMemo, useRef, useCallback } from 'react';
import { useI18n } from '@/lib/i18n';

interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  content: string;
  oldLineNum?: number;
  newLineNum?: number;
}

function parseDiff(text: string): DiffLine[] {
  const result: DiffLine[] = [];
  let oldLine = 1;
  let newLine = 1;

  // Parse ANSI-coded diff output segment by segment
  // Pattern: \x1b[31m...\x1b[0m = removed, \x1b[32m...\x1b[0m = added, plain text = unchanged
  const segments = text.split(/(\x1b\[[0-9;]*m)/);
  let currentType: 'added' | 'removed' | 'unchanged' = 'unchanged';
  let buffer = '';

  function flush() {
    if (!buffer) return;
    // Split buffer by newlines to create separate lines
    const parts = buffer.split('\n');
    for (let i = 0; i < parts.length; i++) {
      if (i > 0) {
        // Newline boundary - push current line and start new one
        if (currentType === 'added') newLine++;
        else if (currentType === 'removed') oldLine++;
        else { oldLine++; newLine++; }
      }
      if (parts[i]) {
        result.push({
          type: currentType,
          content: parts[i].replace(/^[+-]/, ''),
          ...(currentType === 'added' ? { newLineNum: newLine } :
              currentType === 'removed' ? { oldLineNum: oldLine } :
              { oldLineNum: oldLine, newLineNum: newLine }),
        });
      }
    }
    buffer = '';
  }

  for (const seg of segments) {
    if (seg === '\x1b[31m') { flush(); currentType = 'removed'; }
    else if (seg === '\x1b[32m') { flush(); currentType = 'added'; }
    else if (seg === '\x1b[0m') { flush(); currentType = 'unchanged'; }
    else { buffer += seg; }
  }
  flush();

  return result;
}

interface DiffViewerProps {
  diffText: string;
  mode?: 'split' | 'unified';
}

export function DiffViewer({ diffText, mode = 'unified' }: DiffViewerProps) {
  const { t } = useI18n();
  const lines = useMemo(() => parseDiff(diffText), [diffText]);

  const stats = useMemo(() => {
    const added = lines.filter(l => l.type === 'added').reduce((sum, l) => sum + l.content.length, 0);
    const removed = lines.filter(l => l.type === 'removed').reduce((sum, l) => sum + l.content.length, 0);
    const unchanged = lines.filter(l => l.type === 'unchanged').reduce((sum, l) => sum + l.content.length, 0);
    return { added, removed, unchanged };
  }, [lines]);

  if (mode === 'split') {
    return <SplitDiffView lines={lines} />;
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-4 text-xs">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 dark:bg-green-950/40 dark:text-green-400 font-medium">+{stats.added} {t('diff.added')}</span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400 font-medium">-{stats.removed} {t('diff.removed')}</span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-50 text-gray-700 dark:bg-gray-800/40 dark:text-gray-400 font-medium">={stats.unchanged} {t('diff.unchanged')}</span>
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
  const { t } = useI18n();
  const oldLines = lines.filter(l => l.type !== 'added');
  const newLines = lines.filter(l => l.type !== 'removed');

  const leftRef = useRef<HTMLDivElement>(null);
  const rightRef = useRef<HTMLDivElement>(null);
  const syncingRef = useRef(false);

  const handleLeftScroll = useCallback(() => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    if (leftRef.current && rightRef.current) {
      rightRef.current.scrollTop = leftRef.current.scrollTop;
    }
    requestAnimationFrame(() => { syncingRef.current = false; });
  }, []);

  const handleRightScroll = useCallback(() => {
    if (syncingRef.current) return;
    syncingRef.current = true;
    if (leftRef.current && rightRef.current) {
      leftRef.current.scrollTop = rightRef.current.scrollTop;
    }
    requestAnimationFrame(() => { syncingRef.current = false; });
  }, []);

  return (
    <div className="grid grid-cols-2 gap-2">
      <div className="border rounded-lg overflow-hidden">
        <div className="px-3 py-1.5 bg-red-50 dark:bg-red-950/30 border-b text-xs font-medium text-red-700 dark:text-red-400">
          {t('diff.old_text')}
        </div>
        <div
          ref={leftRef}
          className="max-h-[400px] overflow-auto font-mono text-sm"
          onScroll={handleLeftScroll}
        >
          {oldLines.map((line, i) => (
            <div key={i} className={`flex ${line.type === 'removed' ? 'bg-red-50 dark:bg-red-950/30' : ''}`}>
              <span className="w-10 text-right pr-2 text-muted-foreground select-none shrink-0 border-r text-xs leading-6">
                {line.oldLineNum ?? ''}
              </span>
              <span className={`w-6 text-center shrink-0 font-bold leading-6 ${
                line.type === 'removed' ? 'text-red-600' : ''
              }`}>
                {line.type === 'removed' ? '-' : ' '}
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
          {t('diff.new_text')}
        </div>
        <div
          ref={rightRef}
          className="max-h-[400px] overflow-auto font-mono text-sm"
          onScroll={handleRightScroll}
        >
          {newLines.map((line, i) => (
            <div key={i} className={`flex ${line.type === 'added' ? 'bg-green-50 dark:bg-green-950/30' : ''}`}>
              <span className="w-10 text-right pr-2 text-muted-foreground select-none shrink-0 border-r text-xs leading-6">
                {line.newLineNum ?? ''}
              </span>
              <span className={`w-6 text-center shrink-0 font-bold leading-6 ${
                line.type === 'added' ? 'text-green-600' : ''
              }`}>
                {line.type === 'added' ? '+' : ' '}
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
