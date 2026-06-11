'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { apiPath } from '@/lib/utils';
import {
  Download,
  FileText,
  Loader2,
  AlertCircle,
  Check,
} from 'lucide-react';

interface ExportStageProps {
  projectId: string;
  projectName: string;
  reviews: Array<{ type: string; content: string; stage?: string }>;
}

export function ExportStage({ projectId, projectName, reviews }: ExportStageProps) {
  const { t } = useI18n();
  const [exporting, setExporting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [includeSections, setIncludeSections] = useState<Set<string>>(new Set(['literature', 'integrity', 'peer_review', 'revision']));

  const toggleSection = (section: string) => {
    setIncludeSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const generateReport = (): string => {
    let md = `# ${projectName} — Research Report\n\n`;

    const literatureReviews = reviews.filter(r => r.type === 'literature_review' || r.stage === 'review');
    const integrityChecks = reviews.filter(r => r.type === 'integrity_check' || r.stage === 'integrity');
    const peerReviews = reviews.filter(r => r.type === 'peer_review' || r.stage === 'peer_review');
    const revisions = reviews.filter(r => r.type === 'revision' || r.stage === 'revision');

    if (includeSections.has('literature') && literatureReviews.length > 0) {
      md += `## ${t('academic.export.include_literature')}\n\n`;
      for (const r of literatureReviews) md += `${r.content}\n\n---\n\n`;
    }

    if (includeSections.has('integrity') && integrityChecks.length > 0) {
      md += `## ${t('academic.export.include_integrity')}\n\n`;
      for (const r of integrityChecks) md += `${r.content}\n\n---\n\n`;
    }

    if (includeSections.has('peer_review') && peerReviews.length > 0) {
      md += `## ${t('academic.export.include_peer_review')}\n\n`;
      for (const r of peerReviews) md += `${r.content}\n\n---\n\n`;
    }

    if (includeSections.has('revision') && revisions.length > 0) {
      md += `## ${t('academic.export.include_revision')}\n\n`;
      for (const r of revisions) md += `${r.content}\n\n---\n\n`;
    }

    return md;
  };

  const handleExport = async (format: 'markdown' | 'docx' | 'latex') => {
    setExporting(format);
    setError(null);
    try {
      const content = generateReport();
      const res = await fetch(apiPath('/api/academic/export'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, format, filename: `${projectName.replace(/\s+/g, '-')}-report` }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: 'Export failed' }));
        throw new Error(errData.error || 'Export failed');
      }
      const blob = await res.blob();
      const ext = format === 'docx' ? 'docx' : format === 'latex' ? 'tex' : 'md';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${projectName.replace(/\s+/g, '-')}-report.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed');
    } finally {
      setExporting(null);
    }
  };

  const sections = [
    { key: 'literature', label: t('academic.export.include_literature'), count: reviews.filter(r => r.type === 'literature_review' || r.stage === 'review').length },
    { key: 'integrity', label: t('academic.export.include_integrity'), count: reviews.filter(r => r.type === 'integrity_check' || r.stage === 'integrity').length },
    { key: 'peer_review', label: t('academic.export.include_peer_review'), count: reviews.filter(r => r.type === 'peer_review' || r.stage === 'peer_review').length },
    { key: 'revision', label: t('academic.export.include_revision'), count: reviews.filter(r => r.type === 'revision' || r.stage === 'revision').length },
  ];

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">{t('academic.export.title')}</CardTitle>
          </div>
          <CardDescription className="text-xs">{t('academic.export.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">{t('academic.export.include_sections')}</Label>
            <div className="flex flex-wrap gap-2">
              {sections.map(s => (
                <button
                  key={s.key}
                  onClick={() => toggleSection(s.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border transition-all ${
                    includeSections.has(s.key) ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-muted/50 border-border/50 text-muted-foreground'
                  }`}
                >
                  {includeSections.has(s.key) && <Check className="h-3 w-3" />}
                  {s.label}
                  <Badge variant="secondary" className="text-[10px] ml-1">{s.count}</Badge>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">{t('academic.export.select_format')}</Label>
            <div className="flex gap-2">
              {(['markdown', 'docx', 'latex'] as const).map(format => (
                <Button
                  key={format}
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport(format)}
                  disabled={!!exporting}
                  className="flex-1"
                >
                  {exporting === format ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <FileText className="h-4 w-4 mr-2" />
                  )}
                  {format === 'markdown' ? 'Markdown' : format === 'docx' ? 'DOCX' : 'LaTeX'}
                </Button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-2 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs">
              <div className="flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
