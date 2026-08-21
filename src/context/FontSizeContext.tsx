import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { FontSizePreset, FontSizeOption } from '../types';

export const FONT_SIZE_PRESETS: FontSizeOption[] = [
  {
    id: 'compact',
    label: 'Compact',
    subLabel: '14px Base (87.5%)',
    scalePercent: 87.5,
    basePx: 14,
    description: 'High-density view optimized for viewing large datasets, extensive trial balances, and multi-line ledgers.',
    recommendedFor: 'Financial Analysts & Dense Spreadsheets',
  },
  {
    id: 'standard',
    label: 'Standard',
    subLabel: '16px Base (100%)',
    scalePercent: 100,
    basePx: 16,
    description: 'Default enterprise balance providing standard optical proportions, padding, and visual hierarchy.',
    recommendedFor: 'Daily Operational Accounting',
  },
  {
    id: 'large',
    label: 'Large',
    subLabel: '18px Base (112.5%)',
    scalePercent: 112.5,
    basePx: 18,
    description: 'Comfortable high-legibility layout reducing eye strain during extended audit reviews and compliance checks.',
    recommendedFor: 'Auditors & Large High-DPI Monitors',
  },
  {
    id: 'xlarge',
    label: 'Extra Large',
    subLabel: '20px Base (125%)',
    scalePercent: 125,
    basePx: 20,
    description: 'Maximum visual accessibility, presentation mode, and high-visibility financial reporting.',
    recommendedFor: 'Accessibility, Boardroom & Projector Displays',
  },
];

const STORAGE_KEY = 'enterprise_audit_app_font_size';
const MIN_SCALE = 80; // 80% (12.8px)
const MAX_SCALE = 140; // 140% (22.4px)
const STEP_SIZE = 5; // 5% per click

interface FontSizeContextType {
  fontSize: number; // Percentage, e.g. 100
  preset: FontSizePreset;
  basePx: number;
  setFontSize: (percent: number) => void;
  setFontPreset: (presetId: FontSizePreset) => void;
  increaseFontSize: () => void;
  decreaseFontSize: () => void;
  resetFontSize: () => void;
  presets: FontSizeOption[];
}

const FontSizeContext = createContext<FontSizeContextType | undefined>(undefined);

export const FontSizeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontSize, setFontSizeState] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = parseFloat(saved);
        if (!isNaN(parsed) && parsed >= MIN_SCALE && parsed <= MAX_SCALE) {
          return parsed;
        }
      }
    }
    return 100;
  });

  // Calculate current preset or custom
  const preset: FontSizePreset = useMemo(() => {
    const match = FONT_SIZE_PRESETS.find((p) => Math.abs(p.scalePercent - fontSize) < 0.1);
    return match ? match.id : 'custom';
  }, [fontSize]);

  const basePx = useMemo(() => {
    return Math.round((16 * fontSize) / 100 * 10) / 10;
  }, [fontSize]);

  // Synchronize with root DOM element
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.style.fontSize = `${fontSize}%`;
      document.documentElement.style.setProperty('--app-font-scale', `${fontSize}%`);
      document.documentElement.setAttribute('data-font-size-preset', preset);
      try {
        localStorage.setItem(STORAGE_KEY, fontSize.toString());
      } catch (err) {
        console.warn('Unable to persist font size to localStorage', err);
      }
    }
  }, [fontSize, preset]);

  const setFontSize = useCallback((percent: number) => {
    const clamped = Math.min(MAX_SCALE, Math.max(MIN_SCALE, Math.round(percent * 10) / 10));
    setFontSizeState(clamped);
  }, []);

  const setFontPreset = useCallback((presetId: FontSizePreset) => {
    const target = FONT_SIZE_PRESETS.find((p) => p.id === presetId);
    if (target) {
      setFontSizeState(target.scalePercent);
    }
  }, []);

  const increaseFontSize = useCallback(() => {
    setFontSizeState((prev) => Math.min(MAX_SCALE, prev + STEP_SIZE));
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSizeState((prev) => Math.max(MIN_SCALE, prev - STEP_SIZE));
  }, []);

  const resetFontSize = useCallback(() => {
    setFontSizeState(100);
  }, []);

  const value = useMemo(
    () => ({
      fontSize,
      preset,
      basePx,
      setFontSize,
      setFontPreset,
      increaseFontSize,
      decreaseFontSize,
      resetFontSize,
      presets: FONT_SIZE_PRESETS,
    }),
    [fontSize, preset, basePx, setFontSize, setFontPreset, increaseFontSize, decreaseFontSize, resetFontSize]
  );

  return <FontSizeContext.Provider value={value}>{children}</FontSizeContext.Provider>;
};

export const useFontSize = (): FontSizeContextType => {
  const context = useContext(FontSizeContext);
  if (!context) {
    throw new Error('useFontSize must be used within a FontSizeProvider');
  }
  return context;
};
