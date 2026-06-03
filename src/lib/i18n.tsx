'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import zh from './locales/zh.json';
import en from './locales/en.json';
import ja from './locales/ja.json';
import ko from './locales/ko.json';

export type Locale = 'zh' | 'en' | 'ja' | 'ko';

const localeNames: Record<Locale, string> = {
  zh: '中文',
  en: 'English',
  ja: '日本語',
  ko: '한국어',
};

const translations: Record<Locale, Record<string, string>> = {
  zh,
  en,
  ja,
  ko,
};

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
  /** Translate error messages - tries error.${key} first, falls back to key */
  tError: (message: string) => string;
  localeNames: Record<Locale, string>;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('zh');

  useEffect(() => {
    const saved = localStorage.getItem('furinakit-locale') as Locale;
    if (saved && translations[saved]) {
      setLocaleState(saved);
    }
  }, []);

  // Keep <html lang> in sync with the current locale
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('furinakit-locale', newLocale);
  };

  const t = (key: string): string => {
    return translations[locale]?.[key] || translations.en[key] || key;
  };

  const tError = (message: string): string => {
    // Try error.${message} first (for error codes like INVALID_INPUT)
    const byCode = translations[locale]?.[`error.${message}`] || translations.en[`error.${message}`];
    if (byCode) return byCode;
    // Try error.${message} for literal messages like "File is required"
    const byMessage = translations[locale]?.[`error.${message}`] || translations.en[`error.${message}`];
    if (byMessage) return byMessage;
    // Fallback to original message
    return message;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t, tError, localeNames }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}
