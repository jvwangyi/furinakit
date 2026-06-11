'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useI18n } from '@/lib/i18n';
import { apiPath } from '@/lib/utils';
import {
  FolderKanban,
  Plus,
  Loader2,
  FileText,
  MessageSquareText,
  Trash2,
  Clock,
  AlertCircle,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Users,
  Pencil,
  Download,
} from 'lucide-react';
import { STAGE_CONFIG, STAGE_ORDER, type Stage } from '@/lib/academic/pipeline';

interface Project {
  id: string;
  name: string;
  description: string | null;
  topic: string | null;
  stage: string;
  createdAt: string;
  updatedAt: string;
  _count: {
    papers: number;
    reviews: number;
    drafts: number;
  };
  reviewCounts: Record<string, number>;
}

const STAGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  BookOpen,
  Sparkles,
  ShieldCheck,
  Users,
  Pencil,
  Download,
};

export default function AcademicProjectsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [creating, setCreating] = useState(false);

  // Delete dialog
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiPath('/api/academic/projects'));
      const data = await res.json();
      if (data.success) {
        setProjects(data.data);
      } else {
        setError(data.error || 'Failed to fetch projects');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(apiPath('/api/academic/projects'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName.trim(),
          description: newDesc.trim() || undefined,
          topic: newTopic.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProjects((prev) => [data.data, ...prev]);
        setCreateOpen(false);
        setNewName('');
        setNewDesc('');
        setNewTopic('');
      } else {
        setError(data.error || 'Failed to create project');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const res = await fetch(apiPath(`/api/academic/projects/${deleteId}`), {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setProjects((prev) => prev.filter((p) => p.id !== deleteId));
        setDeleteId(null);
      } else {
        setError(data.error || 'Failed to delete project');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="min-h-screen animate-fade-in">
      <div className="p-4 sm:p-6 lg:p-8 mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FolderKanban className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{t('academic.projects.title')}</h1>
              <p className="text-muted-foreground text-sm">{t('academic.projects.description')}</p>
            </div>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger render={<Button />}>
              <Plus className="h-4 w-4 mr-2" />
              {t('academic.projects.create')}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t('academic.projects.create')}</DialogTitle>
                <DialogDescription>{t('academic.projects.create_desc')}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('academic.projects.name')} *</Label>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={t('academic.projects.name_placeholder')}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newName.trim()) handleCreate();
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('academic.projects.description')}</Label>
                  <Textarea
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder={t('academic.projects.desc_placeholder')}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('academic.projects.topic')}</Label>
                  <Input
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder={t('academic.projects.topic_placeholder')}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreate}
                  disabled={!newName.trim() || creating}
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  {t('academic.projects.create')}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              <span className="flex-1">{error}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setError(null); fetchProjects(); }}
                className="h-7 text-xs text-destructive hover:text-destructive"
              >
                {t('academic.common.retry') }
              </Button>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}

        {/* Projects List */}
        {!loading && projects.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <FolderKanban className="h-12 w-12 mx-auto mb-4 opacity-30" />
            <p className="text-lg mb-1">{t('academic.projects.empty')}</p>
            <p className="text-sm">{t('academic.projects.empty_desc')}</p>
          </div>
        )}

        {!loading && projects.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer transition-all duration-200 hover:border-primary/30 hover:shadow-md group"
                onClick={() => router.push(`/academic/projects/${project.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base group-hover:text-primary transition-colors">
                      {project.name}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteId(project.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  {project.description && (
                    <CardDescription className="line-clamp-2 text-xs">
                      {project.description}
                    </CardDescription>
                  )}
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {project.topic && (
                      <Badge variant="secondary" className="text-xs">
                        {project.topic}
                      </Badge>
                    )}
                    {project.stage && STAGE_CONFIG[project.stage as Stage] && (
                      <Badge variant="outline" className="text-xs">
                        {(() => {
                          const Icon = STAGE_ICONS[STAGE_CONFIG[project.stage as Stage]?.icon] || BookOpen;
                          return <Icon className="h-3 w-3 mr-1" />;
                        })()}
                        {t(STAGE_CONFIG[project.stage as Stage].label)}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDate(project.updatedAt)}
                    </span>
                    {project._count.papers > 0 && (
                      <span className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {project._count.papers} {t('academic.projects.papers')}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <Dialog open={!!deleteId} onOpenChange={(open) => { if (!open) setDeleteId(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('academic.projects.delete_title')}</DialogTitle>
              <DialogDescription>{t('academic.projects.delete_desc')}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteId(null)}>
                {t('btn.cancel')}
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                {t('academic.projects.delete_confirm')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
