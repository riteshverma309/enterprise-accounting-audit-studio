import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { LanguageCode, LanguageInfo, TranslationKey, SUPPORTED_LANGUAGES, TRANSLATIONS } from '../i18n/translations';
import { PHRASE_DICTIONARY } from '../i18n/phraseDictionary';

const STORAGE_KEY = 'enterprise_audit_app_language';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  currentLanguageInfo: LanguageInfo;
  languages: LanguageInfo[];
  dir: 'ltr' | 'rtl';
  isRtl: boolean;
  t: (key: TranslationKey, fallback?: string) => string;
  tr: (phraseOrText: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode;
      if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
        return saved;
      }
      // Check browser language
      const browserLang = navigator.language?.toLowerCase() || '';
      if (browserLang.startsWith('ar')) return 'ar';
      if (browserLang.startsWith('hi')) return 'hi';
      if (browserLang.startsWith('es')) return 'es';
      if (browserLang.startsWith('fr')) return 'fr';
      if (browserLang.startsWith('de')) return 'de';
      if (browserLang.startsWith('ja')) return 'ja';
      if (browserLang.startsWith('zh')) return 'zh';
    }
    return 'en';
  });

  const currentLanguageInfo = useMemo(() => {
    return SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];
  }, [language]);

  const dir = currentLanguageInfo.dir;
  const isRtl = dir === 'rtl';

  // Synchronize HTML attributes for language and direction
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
      document.documentElement.dir = dir;
      document.documentElement.setAttribute('data-language', language);
      try {
        localStorage.setItem(STORAGE_KEY, language);
      } catch (err) {
        console.warn('Unable to persist language preference', err);
      }
    }
  }, [language, dir]);

  const setLanguage = useCallback((lang: LanguageCode) => {
    if (SUPPORTED_LANGUAGES.some((l) => l.code === lang)) {
      setLanguageState(lang);
    }
  }, []);

  const t = useCallback(
    (key: TranslationKey, fallback?: string): string => {
      const langDict = TRANSLATIONS[language];
      if (langDict && langDict[key]) {
        return langDict[key];
      }
      // Fallback to English
      const enDict = TRANSLATIONS.en;
      if (enDict && enDict[key]) {
        return enDict[key];
      }
      return fallback || key;
    },
    [language]
  );

  // Universal phrase dictionary translator with fuzzy/exact lookup
  const tr = useCallback(
    (phraseOrText: string): string => {
      if (!phraseOrText || typeof phraseOrText !== 'string') return phraseOrText;
      if (language === 'en') return phraseOrText;

      const trimmed = phraseOrText.trim();
      
      // 1. Direct dictionary match
      if (PHRASE_DICTIONARY[trimmed]?.[language]) {
        return PHRASE_DICTIONARY[trimmed][language];
      }

      // 2. Case-insensitive key match in dictionary
      const lower = trimmed.toLowerCase();
      const matchedKey = Object.keys(PHRASE_DICTIONARY).find(
        (k) => k.toLowerCase() === lower
      );
      if (matchedKey && PHRASE_DICTIONARY[matchedKey]?.[language]) {
        return PHRASE_DICTIONARY[matchedKey][language];
      }

      // 3. Fallback to original text
      return phraseOrText;
    },
    [language]
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      currentLanguageInfo,
      languages: SUPPORTED_LANGUAGES,
      dir,
      isRtl,
      t,
      tr,
    }),
    [language, setLanguage, currentLanguageInfo, dir, isRtl, t, tr]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

