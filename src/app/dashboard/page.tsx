'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AuthButton } from '@/components/AuthButton';
import { useI18n } from '@/lib/i18n';
import { withBasePath } from '@/lib/basePath';
import { BarChart3, Heart, Clock, Star, Trash2, ArrowLeft, Key, Copy, Plus, Eye, EyeOff, Check } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import Link from 'next/link';

interface UserStats {
  totalUsage: number;
  favoritesCount: number;
  recentHistory: { toolName: string; usedAt: string }[];
  topTools: { toolName: string; count: number }[];
}

interface ApiKeyItem {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
  requestCount: number;
  enabled: boolean;
}

type DashboardTab = 'overview' | 'api-keys';

export default function DashboardPage() {
  const { t } = useI18n();
  const toolLabel = (name: string) => t(`tool.${name}`) || name;
  const [stats, setStats] = useState<UserStats | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKey, setNewKey] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [createdKeys, setCreatedKeys] = useState<Record<string, string>>({});  // id -> full key (only for newly created)
  const [revealedKeys, setRevealedKeys] = useState<Set<string>>(new Set());  // ids that are currently shown

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Try to fetch server-side stats (requires login)
      const res = await fetch(withBasePath('/api/user/stats'));
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStats(data.data);
          setIsLoggedIn(true);
        }
      }

      // Load favorites from localStorage as fallback
      const stored = localStorage.getItem('furinakit-favorites');
      if (stored) {
        setFavorites(JSON.parse(stored));
      }

      // Load API keys and stored created keys
      loadApiKeys();
      const storedKeys = localStorage.getItem('furinakit-created-keys');
      if (storedKeys) {
        setCreatedKeys(JSON.parse(storedKeys));
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }

  async function loadApiKeys() {
    try {
      const res = await fetch(withBasePath('/api/auth/api-keys'));
      if (res.ok) {
        const data = await res.json();
        if (data.success) setApiKeys(data.data);
      }
    } catch {}
  }

  async function createApiKey() {
    const name = newKeyName.trim() || 'Unnamed Key';
    try {
      const res = await fetch(withBasePath('/api/auth/api-keys'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.success) {
        setNewKey(data.data.key);
        // Store the full key for the new entry so eye/copy work
        const updated = { ...createdKeys, [data.data.id]: data.data.key };
        setCreatedKeys(updated);
        localStorage.setItem('furinakit-created-keys', JSON.stringify(updated));
        setRevealedKeys(prev => new Set(prev).add(data.data.id));
        setNewKeyName('');
        setShowCreateDialog(false);
        setShowNewKeyDialog(true);
        loadApiKeys();
      }
    } catch {}
  }

  async function revokeApiKey(id: string) {
    if (!confirm(t('dashboard.revoke_confirm'))) return;
    try {
      await fetch(withBasePath('/api/auth/api-keys'), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      const updated = { ...createdKeys };
      delete updated[id];
      setCreatedKeys(updated);
      localStorage.setItem('furinakit-created-keys', JSON.stringify(updated));
      loadApiKeys();
    } catch {}
  }

  const [copied, setCopied] = useState(false);

  function copyToClipboard(text: string) {
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  function toggleKeyVisibility(id: string) {
    setRevealedKeys(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (createdKeys[id]) {
        next.add(id);
      }
      return next;
    });
  }

  async function clearHistory() {
    if (!confirm(t('dashboard.clear_history_confirm'))) return;
    try {
      await fetch(withBasePath('/api/user/history'), { method: 'DELETE' });
      setStats(prev => prev ? { ...prev, recentHistory: [], totalUsage: 0 } : null);
    } catch {}
  }

  async function removeFavorite(toolName: string) {
    try {
      if (isLoggedIn) {
        await fetch(withBasePath(`/api/user/favorites?tool=${toolName}`), { method: 'DELETE' });
      }
      const updated = favorites.filter(t => t !== toolName);
      setFavorites(updated);
      localStorage.setItem('furinakit-favorites', JSON.stringify(updated));
    } catch {}
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <h1 className="text-2xl font-bold">{t('dashboard.title')}</h1>
        </div>
        <AuthButton />
      </div>

      {!isLoggedIn && (
        <Card className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-950/20">
          <CardContent className="py-4">
            <p className="text-sm text-amber-700 dark:text-amber-300">
              💡 {t('dashboard.login_hint')}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.total_usage')}</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalUsage ?? favorites.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.favorites')}</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.favoritesCount ?? favorites.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.top_tool')}</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">
              {stats?.topTools[0] ? toolLabel(stats.topTools[0].toolName) : t('dashboard.no_data')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {t('dashboard.overview')}
        </button>
        <button
          onClick={() => setActiveTab('api-keys')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-1 ${
            activeTab === 'api-keys'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Key className="h-4 w-4" />
          API Keys
        </button>
      </div>

      {/* API Keys Tab */}
      {activeTab === 'api-keys' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              {t('apikey.title')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Create new key button */}
            <Button onClick={() => setShowCreateDialog(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              {t('apikey.create')}
            </Button>

            {/* Create key dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t('apikey.create')}</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Input
                    placeholder={t('dashboard.key_name_placeholder')}
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    autoFocus
                    onKeyDown={(e) => { if (e.key === 'Enter') createApiKey(); }}
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>{t("btn.cancel")}</Button>
                  <Button onClick={createApiKey}>{t('dashboard.create')}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Show newly created key dialog */}
            <Dialog open={showNewKeyDialog && !!newKey} onOpenChange={(open) => { if (!open) { setShowNewKeyDialog(false); setNewKey(null); } }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>✅ {t('apikey.create')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">{t('dashboard.key_created_hint')}</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-3 bg-muted rounded text-sm font-mono break-all">{newKey}</code>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(newKey!)}>
                      {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Key list */}
            {apiKeys.length > 0 ? (
              <div className="space-y-2">
                {apiKeys.map((k) => (
                  <div key={k.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{k.name}</div>
                      <div className="text-xs font-mono text-muted-foreground truncate mt-1">
                        {revealedKeys.has(k.id) && createdKeys[k.id] ? createdKeys[k.id] : 'fk_••••••••••••••••'}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {t('dashboard.created_at')} {new Date(k.createdAt).toLocaleDateString('zh-CN')}
                        {k.lastUsedAt && ` · ${t('dashboard.last_used')} ${new Date(k.lastUsedAt).toLocaleDateString('zh-CN')}`}
                        {` · ${k.requestCount} ${t('dashboard.requests')}`}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleKeyVisibility(k.id)}
                        title={revealedKeys.has(k.id) ? t("dashboard.hide_key") : createdKeys[k.id] ? t("dashboard.show_key") : t("dashboard.key_viewable_hint")}
                        disabled={!createdKeys[k.id]}
                      >
                        {revealedKeys.has(k.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          if (createdKeys[k.id]) copyToClipboard(createdKeys[k.id]);
                        }}
                        title={t("dashboard.copy_key")}
                        disabled={!createdKeys[k.id]}
                      >
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => revokeApiKey(k.id)}
                        className="text-destructive hover:text-destructive"
                        title={t("dashboard.delete")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-4 text-center">
                {t('dashboard.no_api_keys')}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Overview Tab */}
      {activeTab === 'overview' && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent History */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('dashboard.recent')}
            </CardTitle>
            {isLoggedIn && stats?.recentHistory && stats.recentHistory.length > 0 && (
              <Button variant="ghost" size="sm" onClick={clearHistory}>
                <Trash2 className="h-4 w-4 mr-1" />
                {t('dashboard.clear')}
              </Button>
            )}
          </CardHeader>
          <CardContent>
            {stats?.recentHistory && stats.recentHistory.length > 0 ? (
              <div className="space-y-2">
                {stats.recentHistory.map((item, i) => (
                  <div key={i} className="flex items-center justify-between py-2 border-b last:border-0">
                    <Link
                      href={`/${item.toolName.split('-')[0]}/${item.toolName}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {toolLabel(item.toolName)}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.usedAt).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-4 text-center">
                {isLoggedIn ? t('dashboard.no_history') : t('dashboard.login_for_history')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top Tools */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {t('dashboard.top_tools')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats?.topTools && stats.topTools.length > 0 ? (
              <div className="space-y-3">
                {stats.topTools.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Badge variant={i < 3 ? 'default' : 'secondary'} className="w-6 h-6 flex items-center justify-center p-0">
                      {i + 1}
                    </Badge>
                    <div className="flex-1">
                      <div className="font-medium">{toolLabel(item.toolName)}</div>
                      <div className="text-xs text-muted-foreground">{item.count} {t('dashboard.requests')}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-4 text-center">
                {isLoggedIn ? t('dashboard.no_data') : t('dashboard.login_for_data')}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Favorites */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              {t('dashboard.my_favorites')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {favorites.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {favorites.map(toolName => (
                  <div key={toolName} className="flex items-center justify-between p-2 border rounded-lg">
                    <Link
                      href={`/${toolName.split('-')[0]}/${toolName}`}
                      className="text-sm font-medium hover:text-primary truncate"
                    >
                      {toolLabel(toolName)}
                    </Link>
                    <button
                      onClick={() => removeFavorite(toolName)}
                      className="text-muted-foreground hover:text-destructive ml-2"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm py-4 text-center">
                {t('dashboard.no_favorites')}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
      )}
    </div>
  );
}
