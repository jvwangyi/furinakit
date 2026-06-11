'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';
import {
  Key,
  Eye,
  EyeOff,
  Check,
  Loader2,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { apiPath } from '@/lib/utils';
import {
  PROVIDER_PRESETS,
  PRESET_I18N_KEYS,
  getPresetById,
  type ProviderPreset,
} from '@/lib/academic/provider-presets';

export type LLMProvider = 'claude' | 'openai' | 'deepseek' | 'mimo';

export type SaveMode = 'session' | 'persistent';

export interface LLMSettings {
  provider: LLMProvider;
  apiKey: string;
  model?: string;
  baseUrl?: string;
  saveMode?: SaveMode;
  presetId?: string; // which preset was used (optional)
}

const STORAGE_KEY = 'furinakit-academic-llm';

// ─── localStorage helpers ────────────────────────────────────────────────────

export function getStoredLLMSettings(): LLMSettings | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LLMSettings;
  } catch {
    return null;
  }
}

export function storeLLMSettings(settings: LLMSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

export function clearStoredLLMSettings(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}

// ─── Server API helpers ──────────────────────────────────────────────────────

async function upsertPersistentConfig(
  provider: string,
  apiKey: string,
  model?: string,
  name?: string,
  baseUrl?: string,
): Promise<boolean> {
  try {
    const res = await fetch(apiPath('/api/academic/llm-config'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, apiKey, model, saveMode: 'persistent', name, baseUrl }),
    });
    const data = await res.json();
    return data.success;
  } catch {
    return false;
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

interface ApiKeyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (settings: LLMSettings) => void;
  isLoggedIn?: boolean;
  /** Pre-selected preset id (e.g. when clicking a preset card from settings page). */
  initialPresetId?: string;
}

export function ApiKeyModal({ open, onOpenChange, onSave, isLoggedIn = false, initialPresetId }: ApiKeyModalProps) {
  const { t } = useI18n();

  // Step: 'preset-select' | 'configure'
  const [step, setStep] = useState<'preset-select' | 'configure'>('preset-select');
  const [selectedPreset, setSelectedPreset] = useState<ProviderPreset | null>(null);

  // Form state
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMode, setSaveMode] = useState<SaveMode>('session');

  // Reset state when modal opens
  useEffect(() => {
    if (!open) return;

    // If initialPresetId is provided, jump to configure step
    if (initialPresetId) {
      const preset = getPresetById(initialPresetId);
      if (preset) {
        setSelectedPreset(preset);
        setStep('configure');
        // Pre-fill from stored settings if same preset
        const stored = getStoredLLMSettings();
        if (stored?.presetId === initialPresetId) {
          setApiKey(stored.apiKey);
          setModel(stored.model || '');
          setBaseUrl(stored.baseUrl || '');
        } else {
          setApiKey('');
          setModel(preset.models[0] || '');
          setBaseUrl(preset.baseUrl);
        }
        setShowAdvanced(false);
        setSaveMode('session');
        return;
      }
    }

    // Default: show preset selection
    setStep('preset-select');
    setSelectedPreset(null);
    setApiKey('');
    setModel('');
    setBaseUrl('');
    setShowAdvanced(false);
    setSaveMode('session');
  }, [open, initialPresetId]);

  // Select a preset → move to configure step
  const handleSelectPreset = useCallback((preset: ProviderPreset) => {
    setSelectedPreset(preset);
    setStep('configure');
    setApiKey('');
    setModel(preset.models[0] || '');
    setBaseUrl(preset.baseUrl);
    setShowAdvanced(false);
    setSaveMode('session');

    // Pre-fill from stored settings if same preset
    const stored = getStoredLLMSettings();
    if (stored?.presetId === preset.id) {
      setApiKey(stored.apiKey);
      setModel(stored.model || preset.models[0] || '');
      setBaseUrl(stored.baseUrl || preset.baseUrl);
    }
  }, []);

  // Go back to preset selection
  const handleBack = useCallback(() => {
    setStep('preset-select');
    setSelectedPreset(null);
  }, []);

  // Save settings (session + optional persistent upsert)
  const handleSave = useCallback(async () => {
    if (!apiKey.trim() || !selectedPreset) return;
    setSaving(true);

    const finalBaseUrl = (showAdvanced ? baseUrl.trim() : '') || selectedPreset.baseUrl || undefined;
    const finalModel = model || selectedPreset.models[0] || undefined;

    const settings: LLMSettings = {
      provider: selectedPreset.provider,
      apiKey: apiKey.trim(),
      model: finalModel,
      baseUrl: finalBaseUrl,
      saveMode,
      presetId: selectedPreset.id,
    };

    // Store locally
    storeLLMSettings(settings);

    // If account mode, also upsert to server
    if (saveMode === 'persistent' && isLoggedIn) {
      await upsertPersistentConfig(
        selectedPreset.provider,
        apiKey.trim(),
        finalModel,
        selectedPreset.provider,
        finalBaseUrl,
      );
    }

    onSave?.(settings);
    setTimeout(() => {
      setSaving(false);
      onOpenChange(false);
    }, 300);
  }, [selectedPreset, apiKey, model, baseUrl, showAdvanced, isLoggedIn, onSave, onOpenChange]);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            {t('academic.llm.settings') || 'LLM API Settings'}
          </DialogTitle>
          <DialogDescription>
            {t('academic.llm.settings_desc') || 'Configure your LLM provider and API key. Keys are stored locally in your browser and never sent to our servers.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {step === 'preset-select' ? (
            /* ─── Step 1: Preset Selection ─── */
            <div className="space-y-3">
              <Label>{t('academic.llm.provider') }</Label>
              <div className="grid grid-cols-2 gap-2">
                {PROVIDER_PRESETS.filter((p) => p.id !== 'custom').map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleSelectPreset(preset)}
                    className="p-3 rounded-lg border border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="font-medium text-sm group-hover:text-primary transition-colors">
                      {getPresetDisplayName(preset)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                      {getPresetDisplayDesc(preset)}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {preset.models.slice(0, 2).map((m) => (
                        <Badge key={m} variant="secondary" className="text-[10px] h-4">
                          {m}
                        </Badge>
                      ))}
                      {preset.models.length > 2 && (
                        <Badge variant="secondary" className="text-[10px] h-4">
                          +{preset.models.length - 2}
                        </Badge>
                      )}
                    </div>
                  </button>
                ))}
              </div>
              {/* Custom provider */}
              {(() => {
                const customPreset = PROVIDER_PRESETS.find((p) => p.id === 'custom');
                if (!customPreset) return null;
                return (
                  <button
                    onClick={() => handleSelectPreset(customPreset)}
                    className="w-full p-3 rounded-lg border border-dashed border-border/50 hover:border-primary/40 hover:bg-primary/5 transition-all text-left group"
                  >
                    <div className="font-medium text-sm group-hover:text-primary transition-colors">
                      {getPresetDisplayName(customPreset)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {getPresetDisplayDesc(customPreset)}
                    </div>
                  </button>
                );
              })()}
            </div>
          ) : (
            /* ─── Step 2: Configure ─── */
            selectedPreset && (
              <div className="space-y-4">
                {/* Back + Preset info */}
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handleBack}>
                    <ArrowLeft className="h-3 w-3" />
                  </Button>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">
                      {getPresetDisplayName(selectedPreset)}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {getPresetDisplayDesc(selectedPreset)}
                    </div>
                  </div>
                </div>

                {/* API Key input */}
                <div className="space-y-2">
                  <Label>{t('academic.llm.apikey') || 'API Key'}</Label>
                  <div className="relative">
                    <Input
                      type={showKey ? 'text' : 'password'}
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-... / tp-..."
                      className="pr-10 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Advanced options (collapsible) */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showAdvanced ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                    {t('academic.llm.advanced_options') }
                  </button>

                  {showAdvanced && (
                    <div className="space-y-3 pl-4 border-l-2 border-border/30">
                      {/* Base URL */}
                      <div className="space-y-2">
                        <Label className="text-xs">{t('academic.llm.endpoint') }</Label>
                        <Input
                          value={baseUrl}
                          onChange={(e) => setBaseUrl(e.target.value)}
                          placeholder={selectedPreset.baseUrl}
                          className="h-8 text-xs font-mono"
                        />
                      </div>

                      {/* Model selection */}
                      {selectedPreset.models.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-xs">{t('academic.llm.model') || 'Model'}</Label>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedPreset.models.map((m) => (
                              <Button
                                key={m}
                                variant={model === m ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setModel(m)}
                                className="text-[10px] h-6"
                              >
                                {m}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Custom model input for custom provider */}
                      {selectedPreset.id === 'custom' && (
                        <div className="space-y-2">
                          <Label className="text-xs">{t('academic.llm.model') || 'Model'}</Label>
                          <Input
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            placeholder="gpt-4o"
                            className="h-8 text-xs"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Save mode selector */}
                <div className="space-y-2">
                  <Label className="text-xs">{t('academic.llm.save_mode') }</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={saveMode === 'session' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSaveMode('session')}
                      className="text-xs h-7"
                    >
                      {t('academic.llm.save_browser') }
                    </Button>
                    <Button
                      variant={saveMode === 'persistent' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSaveMode('persistent')}
                      disabled={!isLoggedIn}
                      className="text-xs h-7"
                    >
                      {t('academic.llm.save_account') }
                    </Button>
                  </div>
                  {!isLoggedIn && (
                    <p className="text-xs text-muted-foreground">
                      {t('academic.llm.login_hint') }
                    </p>
                  )}
                </div>

                {/* Save button */}
                <div className="flex justify-end pt-2">
                  <Button onClick={handleSave} disabled={!apiKey.trim() || saving} size="sm" className="gap-1.5">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    {t('btn.save') || 'Save'}
                  </Button>
                </div>
              </div>
            )
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('btn.cancel') || 'Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
