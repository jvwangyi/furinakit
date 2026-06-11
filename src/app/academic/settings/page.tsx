'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import { apiPath } from '@/lib/utils';
import { useLLM, LLMProvider } from '@/components/academic/LLMProvider';
import { getStoredLLMSettings } from '@/components/academic/ApiKeyModal';
import { PROVIDER_PRESETS, getPresetById, PRESET_I18N_KEYS, type ProviderPreset } from '@/lib/academic/provider-presets';
import {
  Settings,
  Key,
  Trash2,
  Shield,
  Cloud,
  HardDrive,
  ExternalLink,
  Info,
  Settings2,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

function AcademicSettingsContent() {
  const { t } = useI18n();
  const { settings: llmSettings, openSettings } = useLLM();
  const [localCleared, setLocalCleared] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);

  const handleTestConnection = async () => {
    const cfg = displaySettings;
    if (!cfg?.apiKey || !cfg?.provider) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch(apiPath('/api/academic/test-llm'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: cfg.provider,
          apiKey: cfg.apiKey,
          model: cfg.model || undefined,
          baseUrl: cfg.baseUrl || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResult({ ok: true, msg: `${cfg.provider} (${data.model || cfg.model || 'default'})${data.latencyMs ? ` — ${data.latencyMs}ms` : ''}` });
      } else {
        setTestResult({ ok: false, msg: data.error || 'Connection failed' });
      }
    } catch (e) {
      setTestResult({ ok: false, msg: e instanceof Error ? e.message : 'Network error' });
    } finally {
      setTesting(false);
    }
  };

  // Quick setup: open modal with preset
  const handleQuickSetup = useCallback((presetId: string) => {
    openSettings(presetId);
  }, [openSettings]);

  // Read local settings
  const localSettings = typeof window !== 'undefined' && !localCleared ? getStoredLLMSettings() : null;
  const displaySettings = llmSettings || localSettings;

  // Current preset info
  const currentPreset = displaySettings?.presetId ? getPresetById(displaySettings.presetId) : undefined;

  const getPresetDisplayName = (preset: ProviderPreset) => {
    const keys = PRESET_I18N_KEYS[preset.id];
    if (keys) return t(keys.name) || preset.name;
    return preset.name;
  };

  const getPresetDisplayDesc = (preset: ProviderPreset) => {
    const keys = PRESET_I18N_KEYS[preset.id];
    if (keys) return t(keys.description) || preset.description;
    return preset.description;
  };

  const standardPresets = PROVIDER_PRESETS.filter((p) => !p.needsBaseUrl);
  const customPreset = PROVIDER_PRESETS.find((p) => p.needsBaseUrl);

  return (
    <div className="min-h-screen animate-fade-in">
      <div className="p-4 sm:p-6 lg:p-8 mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Settings className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {t('academic.settings.title') }
            </h1>
            <p className="text-muted-foreground text-sm">
              {t('academic.settings.description') }
            </p>
          </div>
        </div>

        {/* Current Config */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">
                {t('academic.settings.current_config') }
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {displaySettings?.apiKey ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  {currentPreset ? (
                    <Badge variant="secondary" className="text-sm">
                      {getPresetDisplayName(currentPreset)}
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="text-sm">
                      {displaySettings.provider}
                    </Badge>
                  )}
                  {displaySettings.model && (
                    <Badge variant="outline" className="text-sm">
                      {displaySettings.model}
                    </Badge>
                  )}
                  {displaySettings.baseUrl && (
                    <Badge variant="outline" className="text-sm max-w-[300px] truncate" title={displaySettings.baseUrl}>
                      {displaySettings.baseUrl}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-sm gap-1">
                    {displaySettings.saveMode === 'persistent' ? (
                      <>
                        <Cloud className="h-3 w-3" />
                        {t('academic.settings.persistent') }
                      </>
                    ) : (
                      <>
                        <HardDrive className="h-3 w-3" />
                        {t('academic.settings.temporary') }
                      </>
                    )}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openSettings()}>
                    {t('academic.settings.modify') }
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleTestConnection} disabled={testing}>
                    {testing ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                    ) : testResult?.ok ? (
                      <CheckCircle2 className="h-3.5 w-3.5 mr-1.5 text-green-500" />
                    ) : testResult && !testResult.ok ? (
                      <XCircle className="h-3.5 w-3.5 mr-1.5 text-destructive" />
                    ) : null}
                    {t('academic.settings.test_connection') }
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => {
                    localStorage.removeItem('furinakit-academic-llm');
                    window.dispatchEvent(new Event('llm-config-changed'));
                    setLocalCleared(true);
                  }} className="h-8 text-xs text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                    {t('academic.llm.clear_config') }
                  </Button>
                </div>
                {testResult && (
                  <div className={`p-2 rounded-md text-xs ${
                    testResult.ok
                      ? 'bg-green-500/10 border border-green-500/30 text-green-700 dark:text-green-400'
                      : 'bg-destructive/10 border border-destructive/30 text-destructive'
                  }`}>
                    {testResult.ok ? (
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        {t('academic.settings.test_success') }: {testResult.msg}
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <XCircle className="h-3.5 w-3.5" />
                        {t('academic.settings.test_failed') }: {testResult.msg}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  {t('academic.settings.no_config') }
                </p>
                <p className="text-xs text-muted-foreground">
                  {t('academic.settings.no_config_desc') }
                </p>
                <Button size="sm" onClick={() => openSettings()}>
                  <Key className="h-4 w-4 mr-2" />
                  {t('academic.settings.configure') }
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Setup — Preset Cards */}
        <Card className="mb-6">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">
                {t('academic.settings.quick_setup') }
              </CardTitle>
            </div>
            <CardDescription>
              {t('academic.settings.quick_setup_desc') }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {standardPresets.map((preset) => (
                <div
                  key={preset.id}
                  className="p-4 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group"
                  onClick={() => handleQuickSetup(preset.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                      {getPresetDisplayName(preset)}
                    </h4>
                    <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">
                    {getPresetDisplayDesc(preset)}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {preset.models.map((model) => (
                      <Badge key={model} variant="secondary" className="text-[10px]">
                        {model}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}

              {/* Custom provider card */}
              {customPreset && (
                <div
                  className="p-4 rounded-lg border border-dashed border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer group"
                  onClick={() => handleQuickSetup(customPreset.id)}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Settings2 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <h4 className="font-medium text-sm group-hover:text-primary transition-colors">
                      {getPresetDisplayName(customPreset)}
                    </h4>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {getPresetDisplayDesc(customPreset)}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Note */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <CardTitle className="text-base">
                {t('academic.settings.security_note') }
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  {t('academic.settings.security_desc') }
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  {t('academic.settings.shared_desc') }
                </p>
              </div>
              <div className="flex items-start gap-2">
                <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-sm text-muted-foreground">
                  {t('academic.settings.browser_hint') }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function AcademicSettingsPage() {
  return (
    <LLMProvider>
      <AcademicSettingsContent />
    </LLMProvider>
  );
}
