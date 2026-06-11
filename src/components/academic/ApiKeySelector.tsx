'use client';

import { useLLM } from '@/components/academic/LLMProvider';
import { useI18n } from '@/lib/i18n';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Key, Settings, Check, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

function maskKey(key: string): string {
  if (key.length <= 8) return key;
  return key.slice(0, 4) + '...' + key.slice(-4);
}

export function ApiKeySelector() {
  const { t } = useI18n();
  const router = useRouter();
  const { settings, allKeys, selectKey } = useLLM();

  // No saved keys — show "configure" button
  if (allKeys.length === 0) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={() => router.push('/academic/settings')}
        className="h-7 text-xs px-2"
      >
        <Key className="h-3 w-3 mr-1" />
        {t('academic.llm.no_keys')}
      </Button>
    );
  }

  // Current active key info
  const currentKey = settings?.apiKey
    ? allKeys.find((k) => k.apiKey === settings.apiKey)
    : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="sm" className="h-7 text-xs px-2 gap-1" />}
      >
        <Key className="h-3 w-3" />
        {currentKey ? (
          <span className="truncate max-w-[100px]">
            {currentKey.name || maskKey(currentKey.apiKey)}
          </span>
        ) : settings?.apiKey ? (
          <span className="truncate max-w-[100px]">{maskKey(settings.apiKey)}</span>
        ) : (
          <span>{t('academic.llm.no_keys')}</span>
        )}
        <ChevronDown className="h-3 w-3 opacity-50" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel>{t('academic.llm.switch_key')}</DropdownMenuLabel>
          {allKeys.filter((k) => k.isActive).map((key) => {
            const isActive = settings?.apiKey === key.apiKey;
            return (
              <DropdownMenuItem
                key={key.id}
                onClick={() => selectKey(key.id)}
                className="flex items-center gap-2"
              >
                {isActive && <Check className="h-3 w-3 text-primary" />}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate">
                    {key.name || maskKey(key.apiKey)}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    {key.provider}
                    {key.model ? ` · ${key.model}` : ''}
                  </div>
                </div>
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push('/academic/settings')}>
          <Settings className="h-3 w-3 mr-1.5" />
          {t('academic.llm.manage_keys')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
