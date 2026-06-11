'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { apiPath } from '@/lib/utils';
import { useLLM } from '@/components/academic/LLMProvider';
import {
  Pencil,
  Loader2,
  AlertCircle,
  Save,
  MessageSquareText,
  Bot,
  User,
  Sparkles,
  FileText,
  Key,
} from 'lucide-react';

interface CoachingMessage {
  role: 'assistant' | 'user';
  content: string;
}

interface RevisionPlan {
  steps: Array<{
    reviewer_point: string;
    action: string;
    reasoning: string;
    priority: string;
  }>;
  summary: string;
}

interface RevisionStageProps {
  projectId: string;
  existingReviews: Array<{ id: string; type: string; content: string; stage?: string; score: number | null; verdict: string | null; createdAt: string }>;
  onSaved: () => void;
}

export function RevisionStage({ projectId, existingReviews, onSaved }: RevisionStageProps) {
  const { t } = useI18n();
  const [mode, setMode] = useState<'coaching' | 'manual'>('coaching');
  const [replyText, setReplyText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Coaching state
  const { settings: llmSettings, openSettings, getLLMConfig } = useLLM();
  const [coachingMessages, setCoachingMessages] = useState<CoachingMessage[]>([]);
  const [coachingInput, setCoachingInput] = useState('');
  const [coachingLoading, setCoachingLoading] = useState(false);
  const [round, setRound] = useState(0);
  const [revisionPlan, setRevisionPlan] = useState<RevisionPlan | null>(null);
  const coachingEndRef = useRef<HTMLDivElement>(null);

  const peerReviews = existingReviews.filter(r => r.type === 'peer_review' || r.stage === 'peer_review');

  useEffect(() => {
    coachingEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [coachingMessages]);

  const startCoaching = async () => {
    if (!llmSettings?.apiKey) { openSettings(); return; }
    if (peerReviews.length === 0) return;

    setCoachingLoading(true);
    setError(null);
    setCoachingMessages([]);
    setRound(1);

    try {
      const reviews = peerReviews.map(r => ({
        reviewer: r.verdict || 'Reviewer',
        content: r.content.substring(0, 3000),
      }));

      const res = await fetch(apiPath('/api/academic/revision-coach'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviews, round: 1, llm: getLLMConfig() }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      let assistantMsg = '';
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(trimmed.slice(6));
            if (data.type === 'token' && data.content) {
              assistantMsg += data.content;
              setCoachingMessages([{ role: 'assistant', content: assistantMsg }]);
            } else if (data.type === 'revision_plan') {
              setRevisionPlan(data.data);
            }
          } catch { /* skip */ }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Coaching failed');
    } finally {
      setCoachingLoading(false);
    }
  };

  const sendCoachingReply = async () => {
    if (!coachingInput.trim() || !llmSettings?.apiKey) return;

    const userMsg = coachingInput.trim();
    setCoachingInput('');
    setCoachingMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setCoachingLoading(true);
    setError(null);

    const nextRound = round + 1;
    setRound(nextRound);

    try {
      const reviews = peerReviews.map(r => ({
        reviewer: r.verdict || 'Reviewer',
        content: r.content.substring(0, 3000),
      }));

      const res = await fetch(apiPath('/api/academic/revision-coach'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviews,
          userReply: userMsg,
          round: nextRound,
          llm: getLLMConfig(),
        }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error('No response body');

      let assistantMsg = '';
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data: ')) continue;
          try {
            const data = JSON.parse(trimmed.slice(6));
            if (data.type === 'token' && data.content) {
              assistantMsg += data.content;
              setCoachingMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return [...prev.slice(0, -1), { ...last, content: assistantMsg }];
                }
                return [...prev, { role: 'assistant', content: assistantMsg }];
              });
            } else if (data.type === 'revision_plan') {
              setRevisionPlan(data.data);
            }
          } catch { /* skip */ }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Coaching failed');
    } finally {
      setCoachingLoading(false);
    }
  };

  const handleSave = async () => {
    if (!replyText.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(apiPath(`/api/academic/projects/${projectId}/reviews`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'revision',
          content: replyText.trim(),
          stage: 'revision',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setReplyText('');
        onSaved();
      } else {
        setError(data.error || 'Failed to save');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePlan = async () => {
    if (!revisionPlan) return;
    const planMd = `# Revision Plan\n\n${revisionPlan.summary}\n\n${revisionPlan.steps.map((s, i) => `## ${i + 1}. ${s.reviewer_point}\n**Action:** ${s.action}\n**Reasoning:** ${s.reasoning}\n**Priority:** ${s.priority}\n`).join('\n')}`;
    setReplyText(planMd);
    setMode('manual');
  };

  const maxRounds = 8;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Pencil className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">{t('academic.revision.title')}</CardTitle>
          </div>
          <CardDescription className="text-xs">{t('academic.revision.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Show peer review summaries */}
          {peerReviews.length > 0 ? (
            <div className="space-y-2">
              <Label className="text-xs">{t('academic.revision.peer_reviews')}</Label>
              {peerReviews.map((review) => (
                <div key={review.id} className="p-3 rounded-lg bg-muted/50 border border-border/50">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquareText className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium">{t('academic.projects.type_peer_review')}</span>
                    {review.verdict && <Badge variant="outline" className="text-xs">{review.verdict}</Badge>}
                    {review.score !== null && <Badge variant="secondary" className="text-xs">{review.score.toFixed(1)}/100</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground whitespace-pre-wrap max-h-[200px] overflow-y-auto content-scroll">
                    {review.content}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t('academic.revision.no_reviews')}</p>
          )}

          {/* Mode toggle */}
          <div className="flex gap-1">
            <Button
              variant={mode === 'coaching' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('coaching')}
              className="flex-1 text-xs h-8"
            >
              <Sparkles className="h-3 w-3 mr-1.5" />
              {t('academic.revision.coaching')}
            </Button>
            <Button
              variant={mode === 'manual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setMode('manual')}
              className="flex-1 text-xs h-8"
            >
              <Pencil className="h-3 w-3 mr-1.5" />
              {t('academic.revision.add_note')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Coaching mode */}
      {mode === 'coaching' && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                <CardTitle className="text-sm">{t('academic.revision.coaching')}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {t('academic.revision.coaching_desc')}
                </Badge>
                <Button variant="outline" size="sm" onClick={openSettings} className="h-7 text-xs px-2">
                  <Key className="h-3 w-3 mr-1" />
                  {llmSettings?.apiKey ? llmSettings.provider : t('academic.llm.configure')}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {coachingMessages.length === 0 && !coachingLoading && (
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground mb-3">{t('academic.revision.coaching_desc')}</p>
                <Button
                  size="sm"
                  onClick={startCoaching}
                  disabled={peerReviews.length === 0}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  {t('academic.revision.coaching_start')}
                </Button>
              </div>
            )}

            {/* Coaching conversation */}
            {coachingMessages.length > 0 && (
              <div className="space-y-3 max-h-[400px] overflow-y-auto content-scroll p-1">
                {coachingMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                      <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        msg.role === 'assistant' ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        {msg.role === 'assistant' ? <Bot className="h-3.5 w-3.5 text-primary" /> : <User className="h-3.5 w-3.5 text-muted-foreground" />}
                      </div>
                      <div className={`p-2.5 rounded-lg text-xs leading-relaxed ${
                        msg.role === 'assistant'
                          ? 'bg-muted/50 border border-border/50'
                          : 'bg-primary/10 border border-primary/20'
                      }`}>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {coachingLoading && coachingMessages[coachingMessages.length - 1]?.role !== 'assistant' && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <div className="p-2.5 rounded-lg bg-muted/50 border border-border/50">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
                <div ref={coachingEndRef} />
              </div>
            )}

            {/* Input for coaching reply */}
            {coachingMessages.length > 0 && !revisionPlan && (
              <div className="flex gap-2">
                <Input
                  value={coachingInput}
                  onChange={(e) => setCoachingInput(e.target.value)}
                  placeholder={t('academic.revision.coaching_placeholder')}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendCoachingReply(); } }}
                  disabled={coachingLoading || round >= maxRounds}
                  className="text-xs"
                />
                <Button
                  size="sm"
                  onClick={sendCoachingReply}
                  disabled={!coachingInput.trim() || coachingLoading || round >= maxRounds}
                >
                  {coachingLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : t('academic.revision.coaching_send')}
                </Button>
              </div>
            )}

            {round >= maxRounds && !revisionPlan && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {t('academic.revision.coaching_max_rounds')}
              </p>
            )}

            {/* Revision plan */}
            {revisionPlan && (
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm">{t('academic.revision.revision_plan')}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-muted-foreground">{revisionPlan.summary}</p>
                  <div className="space-y-2">
                    {revisionPlan.steps.map((step, i) => (
                      <div key={i} className="p-2 rounded-md bg-muted/50 border border-border/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[10px]">{step.priority}</Badge>
                          <span className="text-xs font-medium">{step.reviewer_point}</span>
                        </div>
                        <p className="text-xs"><strong>Action:</strong> {step.action}</p>
                        <p className="text-xs text-muted-foreground">{step.reasoning}</p>
                      </div>
                    ))}
                  </div>
                  <Button size="sm" onClick={handleSavePlan} className="mt-2">
                    <FileText className="h-3.5 w-3.5 mr-1.5" />
                    {t('academic.revision.save')}
                  </Button>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      {/* Manual mode */}
      {mode === 'manual' && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{t('academic.revision.add_note')}</Label>
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={t('academic.revision.placeholder')}
                className="min-h-[100px] text-sm resize-y"
              />
            </div>

            {error && (
              <div className="p-2 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs">
                <div className="flex items-center gap-1"><AlertCircle className="h-3 w-3" />{error}</div>
              </div>
            )}

            <Button onClick={handleSave} disabled={!replyText.trim() || saving} size="sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              {t('academic.revision.save')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Existing revision notes */}
      {existingReviews.filter(r => r.type === 'revision' || r.stage === 'revision').map((review) => (
        <Card key={review.id}>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
              <CardTitle className="text-sm">{t('academic.revision.title')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-3 rounded-lg bg-muted/50 text-xs whitespace-pre-wrap">{review.content}</div>
          </CardContent>
        </Card>
      ))}

    </div>
  );
}
