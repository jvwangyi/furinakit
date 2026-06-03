'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronDown, Braces, Copy } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { toast } from 'sonner';

interface JsonTreeViewProps {
  data: string | object;
}

function getType(value: any): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

function getValueColor(type: string): string {
  switch (type) {
    case 'string': return 'text-emerald-400';
    case 'number': return 'text-blue-400';
    case 'boolean': return 'text-purple-400';
    case 'null': return 'text-muted-foreground';
    default: return 'text-foreground';
  }
}

interface TreeNodeProps {
  keyName?: string;
  value: any;
  depth: number;
  isLast: boolean;
}

function TreeNode({ keyName, value, depth, isLast }: TreeNodeProps) {
  const [expanded, setExpanded] = useState(depth < 2);
  const type = getType(value);
  const isExpandable = type === 'object' || type === 'array';
  const entries = isExpandable ? Object.entries(value) : [];

  const renderValue = () => {
    if (type === 'string') return <span className={getValueColor(type)}>&quot;{value}&quot;</span>;
    if (type === 'number' || type === 'boolean') return <span className={getValueColor(type)}>{String(value)}</span>;
    if (type === 'null') return <span className={getValueColor(type)}>null</span>;
    if (type === 'array' && entries.length === 0) return <span className="text-muted-foreground">[]</span>;
    if (type === 'object' && entries.length === 0) return <span className="text-muted-foreground">{'{}'}</span>;
    return null;
  };

  if (!isExpandable) {
    return (
      <div className="flex items-start gap-1 py-0.5" style={{ paddingLeft: `${depth * 16}px` }}>
        {keyName !== undefined && (
          <>
            <span className="text-amber-400 shrink-0">&quot;{keyName}&quot;</span>
            <span className="text-muted-foreground shrink-0 mr-1">:</span>
          </>
        )}
        {renderValue()}
        {!isLast && <span className="text-muted-foreground">,</span>}
      </div>
    );
  }

  return (
    <div>
      <div
        className="flex items-center gap-1 py-0.5 cursor-pointer hover:bg-accent/10 rounded-sm transition-colors duration-100"
        style={{ paddingLeft: `${depth * 16}px` }}
        onClick={() => setExpanded(!expanded)}
      >
        <span className="w-4 h-4 flex items-center justify-center shrink-0">
          {expanded ? (
            <ChevronDown className="h-3 w-3 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
          )}
        </span>
        {keyName !== undefined && (
          <>
            <span className="text-amber-400 shrink-0">&quot;{keyName}&quot;</span>
            <span className="text-muted-foreground shrink-0 mr-1">:</span>
          </>
        )}
        <span className="text-muted-foreground">
          {type === 'array' ? '[' : '{'}
        </span>
        {!expanded && (
          <>
            <span className="text-muted-foreground text-xs">...</span>
            <span className="text-muted-foreground">
              {type === 'array' ? ']' : '}'}
            </span>
            <span className="text-muted-foreground text-xs ml-1">
              ({entries.length} {entries.length === 1 ? 'item' : 'items'})
            </span>
            {!isLast && <span className="text-muted-foreground">,</span>}
          </>
        )}
      </div>
      {expanded && (
        <>
          {entries.map(([key, val], idx) => (
            <TreeNode
              key={key}
              keyName={type === 'array' ? undefined : key}
              value={val}
              depth={depth + 1}
              isLast={idx === entries.length - 1}
            />
          ))}
          <div className="flex items-center py-0.5" style={{ paddingLeft: `${depth * 16}px` }}>
            <span className="w-4 h-4 shrink-0" />
            <span className="text-muted-foreground">
              {type === 'array' ? ']' : '}'}
            </span>
            {!isLast && <span className="text-muted-foreground">,</span>}
          </div>
        </>
      )}
    </div>
  );
}

export function JsonTreeView({ data }: JsonTreeViewProps) {
  const { t } = useI18n();
  const [viewMode, setViewMode] = useState<'tree' | 'raw'>('tree');

  let parsed: any;
  let rawText: string;

  if (typeof data === 'string') {
    rawText = data;
    try {
      parsed = JSON.parse(data);
    } catch {
      parsed = null;
    }
  } else {
    parsed = data;
    rawText = JSON.stringify(data, null, 2);
  }

  const copyToClipboard = useCallback(() => {
    navigator.clipboard.writeText(rawText);
    toast.success(t('tool.copied_toast'));
  }, [rawText, t]);

  return (
    <Card className="bg-muted/30 border border-border/30">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Braces className="h-4 w-4" />
            {t('tool.json_tree')}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'tree' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setViewMode('tree')}
            >
              {t('tool.tree_view')}
            </Button>
            <Button
              variant={viewMode === 'raw' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setViewMode('raw')}
            >
              {t('tool.raw_view')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={copyToClipboard}
            >
              <Copy className="h-3 w-3 mr-1" />
              {t('tool.copy')}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {viewMode === 'tree' && parsed !== null ? (
          <div className="font-mono text-xs overflow-auto max-h-[500px] p-4 bg-background rounded-lg border">
            <TreeNode value={parsed} depth={0} isLast={true} />
          </div>
        ) : (
          <pre className="p-4 bg-background rounded-lg overflow-auto max-h-[500px] text-sm font-mono">
            {rawText}
          </pre>
        )}
      </CardContent>
    </Card>
  );
}
