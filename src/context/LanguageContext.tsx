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
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (amount: number, currencyCode?: string) => string;
  formatDate: (date: string | Date, formatStyle?: 'short' | 'medium' | 'long') => string;
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
      const matched = SUPPORTED_LANGUAGES.find((l) => browserLang.startsWith(l.code));
      if (matched) return matched.code;
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
      // Indic fallback to Hindi if available
      if (currentLanguageInfo.category === 'india' && TRANSLATIONS.hi && TRANSLATIONS.hi[key]) {
        return TRANSLATIONS.hi[key];
      }
      // Fallback to English
      const enDict = TRANSLATIONS.en;
      if (enDict && enDict[key]) {
        return enDict[key];
      }
      return fallback || key;
    },
    [language, currentLanguageInfo]
  );

  // Universal phrase dictionary translator with fuzzy/exact lookup, reverse lookup, & regional fallback
  const tr = useCallback(
    (phraseOrText: string): string => {
      if (!phraseOrText || typeof phraseOrText !== 'string') return phraseOrText;
      if (language === 'en') return phraseOrText;

      const trimmed = phraseOrText.trim();
      
      // 1. Direct dictionary match in PHRASE_DICTIONARY in target language
      if (PHRASE_DICTIONARY[trimmed]?.[language]) {
        return PHRASE_DICTIONARY[trimmed][language]!;
      }

      // 2. Direct match as TranslationKey in TRANSLATIONS
      const langDict = TRANSLATIONS[language];
      if (langDict && langDict[trimmed as TranslationKey]) {
        return langDict[trimmed as TranslationKey];
      }

      // 3. Reverse lookup: Check if phrase matches an English value in TRANSLATIONS.en
      const enDict = TRANSLATIONS.en;
      if (enDict && langDict) {
        const foundKey = (Object.keys(enDict) as TranslationKey[]).find(
          (k) => enDict[k]?.trim().toLowerCase() === trimmed.toLowerCase()
        );
        if (foundKey && langDict[foundKey]) {
          return langDict[foundKey];
        }
      }

      // 4. Case-insensitive key match in PHRASE_DICTIONARY
      const lower = trimmed.toLowerCase();
      const matchedKey = Object.keys(PHRASE_DICTIONARY).find(
        (k) => k.toLowerCase() === lower
      );
      if (matchedKey && PHRASE_DICTIONARY[matchedKey]?.[language]) {
        return PHRASE_DICTIONARY[matchedKey][language]!;
      }

      // 5. Trim trailing punctuation (colons, dots, dashes, parentheses)
      const cleanEndMatch = trimmed.match(/^(.+?)([:.!?\-\s]+)$/);
      if (cleanEndMatch) {
        const coreText = cleanEndMatch[1].trim();
        const punct = cleanEndMatch[2];
        const translatedCore = tr(coreText);
        if (translatedCore !== coreText) {
          return `${translatedCore}${punct}`;
        }
      }

      // 6. Indian regional language fallback to Hindi (or Urdu for Urdu)
      if (currentLanguageInfo.category === 'india') {
        if (language === 'ur') {
          if (PHRASE_DICTIONARY[trimmed]?.ur) return PHRASE_DICTIONARY[trimmed].ur!;
          if (PHRASE_DICTIONARY[trimmed]?.ar) return PHRASE_DICTIONARY[trimmed].ar!;
        }
        if (PHRASE_DICTIONARY[trimmed]?.hi) {
          return PHRASE_DICTIONARY[trimmed].hi!;
        }
        if (matchedKey && PHRASE_DICTIONARY[matchedKey]?.hi) {
          return PHRASE_DICTIONARY[matchedKey].hi!;
        }
        if (TRANSLATIONS.hi && TRANSLATIONS.hi[trimmed as TranslationKey]) {
          return TRANSLATIONS.hi[trimmed as TranslationKey];
        }
      }

      // 7. Fallback to original text
      return phraseOrText;
    },
    [language, currentLanguageInfo]
  );

  // Locale-aware Number Formatter
  const formatNumber = useCallback(
    (num: number, options?: Intl.NumberFormatOptions): string => {
      if (isNaN(num)) return '0';
      try {
        const localeCode = language === 'ur' ? 'ur-PK' : language === 'hi' ? 'hi-IN' : language;
        return new Intl.NumberFormat(localeCode, options).format(num);
      } catch {
        return num.toLocaleString();
      }
    },
    [language]
  );

  // Locale-aware Currency Formatter
  const formatCurrency = useCallback(
    (amount: number, currencyCode: string = 'USD'): string => {
      const symbols: Record<string, string> = {
        USD: '$',
        EUR: '€',
        GBP: '£',
        INR: '₹',
        SAR: '﷼',
        AED: 'د.إ',
        QAR: 'ر.ق',
        JPY: '¥',
        CNY: '¥',
      };
      const symbol = symbols[currencyCode] || currencyCode + ' ';
      const formattedNumber = formatNumber(amount, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      return isRtl ? `${formattedNumber} ${symbol}` : `${symbol}${formattedNumber}`;
    },
    [formatNumber, isRtl]
  );

  // Locale-aware Date Formatter
  const formatDate = useCallback(
    (date: string | Date, formatStyle: 'short' | 'medium' | 'long' = 'medium'): string => {
      if (!date) return '';
      try {
        const d = typeof date === 'string' ? new Date(date) : date;
        if (isNaN(d.getTime())) return String(date);
        const localeCode = language === 'ur' ? 'ur-PK' : language === 'hi' ? 'hi-IN' : language;
        return new Intl.DateTimeFormat(localeCode, {
          dateStyle: formatStyle,
        }).format(d);
      } catch {
        return String(date);
      }
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
      formatNumber,
      formatCurrency,
      formatDate,
    }),
    [language, setLanguage, currentLanguageInfo, dir, isRtl, t, tr, formatNumber, formatCurrency, formatDate]
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

// Global standalone translator helper for module-level or outside-component usage
export function tr(phraseOrText: string, lang?: LanguageCode): string {
  if (!phraseOrText || typeof phraseOrText !== 'string') return phraseOrText;
  let targetLang = lang;
  if (!targetLang && typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode;
    if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
      targetLang = saved;
    }
  }
  if (!targetLang || targetLang === 'en') return phraseOrText;

  const trimmed = phraseOrText.trim();
  if (PHRASE_DICTIONARY[trimmed]?.[targetLang]) {
    return PHRASE_DICTIONARY[trimmed][targetLang]!;
  }
  const langDict = TRANSLATIONS[targetLang];
  if (langDict && langDict[trimmed as TranslationKey]) {
    return langDict[trimmed as TranslationKey];
  }
  const enDict = TRANSLATIONS.en;
  if (enDict && langDict) {
    const foundKey = (Object.keys(enDict) as TranslationKey[]).find(
      (k) => enDict[k]?.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (foundKey && langDict[foundKey]) {
      return langDict[foundKey];
    }
  }
  const lower = trimmed.toLowerCase();
  const matchedKey = Object.keys(PHRASE_DICTIONARY).find(
    (k) => k.toLowerCase() === lower
  );
  if (matchedKey && PHRASE_DICTIONARY[matchedKey]?.[targetLang]) {
    return PHRASE_DICTIONARY[matchedKey][targetLang]!;
  }

  // Trim trailing punctuation (colons, dots, dashes, parentheses)
  const cleanEndMatch = trimmed.match(/^(.+?)([:.!?\-\s]+)$/);
  if (cleanEndMatch) {
    const coreText = cleanEndMatch[1].trim();
    const punct = cleanEndMatch[2];
    const translatedCore = tr(coreText, targetLang);
    if (translatedCore !== coreText) {
      return `${translatedCore}${punct}`;
    }
  }

  if (targetLang === 'ur' && (PHRASE_DICTIONARY[trimmed]?.ur || PHRASE_DICTIONARY[trimmed]?.ar)) {
    return PHRASE_DICTIONARY[trimmed]?.ur || PHRASE_DICTIONARY[trimmed]?.ar!;
  }
  if (PHRASE_DICTIONARY[trimmed]?.hi) {
    return PHRASE_DICTIONARY[trimmed].hi!;
  }
  if (matchedKey && PHRASE_DICTIONARY[matchedKey]?.hi) {
    return PHRASE_DICTIONARY[matchedKey].hi!;
  }
  return phraseOrText;
}

export function t(key: TranslationKey, fallback?: string): string {
  let targetLang: LanguageCode = 'en';
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode;
    if (saved && SUPPORTED_LANGUAGES.some((l) => l.code === saved)) {
      targetLang = saved;
    }
  }
  const langDict = TRANSLATIONS[targetLang];
  if (langDict && langDict[key]) return langDict[key];
  if (TRANSLATIONS.en?.[key]) return TRANSLATIONS.en[key];
  return fallback || key;
}
