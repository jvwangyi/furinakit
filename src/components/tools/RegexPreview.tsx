'use client';

import { useMemo } from 'react';

interface RegexMatch {
  text: string;
  index: number;
  groups?: string[];
}

interface RegexPreviewProps {
  text: string;
  pattern: string;
  flags?: string;
}

export function RegexPreview({ text, pattern, flags = 'g' }: RegexPreviewProps) {
  const { matches, error } = useMemo(() => {
    if (!pattern || !text) return { matches: [], error: null };
    try {
      const regex = new RegExp(pattern, flags);
      const matches: RegexMatch[] = [];
      let match;
      // Limit to 100 matches to prevent infinite loops
      let count = 0;
      while ((match = regex.exec(text)) !== null && count < 100) {
        matches.push({
          text: match[0],
          index: match.index,
          groups: match.slice(1),
        });
        count++;
        if (!flags.includes('g')) break;
      }
      return { matches, error: null };
    } catch (e) {
      return { matches: [], error: (e as Error).message };
    }
  }, [text, pattern, flags]);

  if (error) {
    return (
      <div className="p-3.5 bg-red-50/80 dark:bg-red-950/30 border border-red-200/60 dark:border-red-800/30 rounded-lg text-sm text-red-700 dark:text-red-300">
        正则错误: {error}
      </div>
    );
  }

  if (!pattern || !text) return null;

  if (matches.length === 0) {
    return (
      <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
        没有匹配结果
      </div>
    );
  }

  // Highlight matches in the original text
  const parts: { text: string; isMatch: boolean; matchIndex?: number }[] = [];
  let lastEnd = 0;
  matches.forEach((m, i) => {
    if (m.index > lastEnd) {
      parts.push({ text: text.slice(lastEnd, m.index), isMatch: false });
    }
    parts.push({ text: m.text, isMatch: true, matchIndex: i });
    lastEnd = m.index + m.text.length;
  });
  if (lastEnd < text.length) {
    parts.push({ text: text.slice(lastEnd), isMatch: false });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="font-medium text-foreground">找到 {matches.length} 个匹配</span>
        {matches.length >= 100 && <span className="text-orange-500">（已截断，最多显示 100 个）</span>}
      </div>

      {/* Highlighted text */}
      <div className="p-3 bg-background border rounded-lg font-mono text-sm whitespace-pre-wrap break-all leading-6 max-h-48 overflow-auto">
        {parts.map((part, i) =>
          part.isMatch ? (
            <mark
              key={i}
              className="bg-yellow-200 dark:bg-yellow-800/50 text-foreground rounded px-0.5"
              title={`匹配 #${(part.matchIndex ?? 0) + 1}`}
            >
              {part.text}
            </mark>
          ) : (
            <span key={i}>{part.text}</span>
          )
        )}
      </div>

      {/* Match list */}
      <div className="space-y-1.5 max-h-48 overflow-auto">
        {matches.slice(0, 20).map((m, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-1.5 bg-muted/30 rounded text-xs font-mono">
            <span className="text-muted-foreground w-8 text-right">#{i + 1}</span>
            <span className="flex-1 truncate">"{m.text}"</span>
            <span className="text-muted-foreground">位置 {m.index}</span>
            {m.groups && m.groups.length > 0 && (
              <span className="text-muted-foreground">
                组: {m.groups.map((g, j) => `$${j + 1}="${g}"`).join(', ')}
              </span>
            )}
          </div>
        ))}
        {matches.length > 20 && (
          <div className="text-xs text-muted-foreground px-3">
            还有 {matches.length - 20} 个匹配未显示...
          </div>
        )}
      </div>
    </div>
  );
}
