'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';
import { BookOpen, PenLine, MessageSquareText, FolderKanban, Key, Lightbulb } from 'lucide-react';
import { useLLM, LLMProvider } from '@/components/academic/LLMProvider';
import { Button } from '@/components/ui/button';

const modules = [
  { key: 'brainstorm', icon: Lightbulb, href: '/academic/brainstorm' },
  { key: 'literature', icon: BookOpen, href: '/academic/literature' },
  { key: 'writing', icon: PenLine, href: '/academic/writing' },
  { key: 'review', icon: MessageSquareText, href: '/academic/review' },
  { key: 'projects', icon: FolderKanban, href: '/academic/projects' },
];

function AcademicHomeContent() {
  const { t } = useI18n();
  const { settings: llmSettings, openSettings } = useLLM();

  return (
    <div className="min-h-screen animate-fade-in">
      <div className="p-4 sm:p-6 lg:p-8 mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">{t('academic.home.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('academic.home.description')}</p>
        </div>

        {/* API Key 提示 */}
        {!llmSettings?.apiKey && (
          <Card className="mb-6 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                <h4 className="text-sm font-medium text-amber-800 dark:text-amber-300">
                  {t('academic.apikey_required_title') || 'LLM API Key Required'}
                </h4>
              </div>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {t('academic.apikey_required_desc') || 'Configure your API key to use academic features.'}
              </p>
              <Button size="sm" onClick={openSettings} className="h-8 text-xs">
                <Key className="h-3.5 w-3.5 mr-1.5" />
                {t('academic.llm.configure')}
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {modules.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link key={mod.key} href={mod.href} className="group">
                <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-primary/30 cursor-pointer">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{t(`academic.${mod.key}.title`)}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-sm">
                      {t(`academic.${mod.key}.description`)}
                    </CardDescription>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function AcademicHomePage() {
  return (
    <LLMProvider>
      <AcademicHomeContent />
    </LLMProvider>
  );
}
