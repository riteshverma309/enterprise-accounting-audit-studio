import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLanguage, tr, t } from '../context/LanguageContext';
import { Globe, Check, ChevronDown, Sparkles, Search, MapPin } from 'lucide-react';
import { LanguageCode } from '../i18n/translations';

interface LanguageSelectorProps {
  variant?: 'header_button' | 'dropdown_only' | 'compact';
  className?: string;
}

type FilterCategory = 'all' | 'india' | 'global';

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'header_button',
  className = '',
}) => {
  const { language, setLanguage, currentLanguageInfo, languages, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FilterCategory>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearchQuery('');
      setSelectedCategory('all');
    }
  }, [isOpen]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectLanguage = (code: LanguageCode) => {
    setLanguage(code);
    setIsOpen(false);
  };

  const filteredLanguages = useMemo(() => {
    return languages.filter((lang) => {
      // Category filter
      if (selectedCategory === 'india' && lang.category !== 'india') return false;
      if (selectedCategory === 'global' && lang.category !== 'global') return false;

      // Query filter
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        lang.name.toLowerCase().includes(q) ||
        lang.nativeName.toLowerCase().includes(q) ||
        lang.code.toLowerCase().includes(q) ||
        lang.region.toLowerCase().includes(q) ||
        ((lang.state || lang.stateOrHub) && (lang.state || lang.stateOrHub)!.toLowerCase().includes(q))
      );
    });
  }, [languages, selectedCategory, searchQuery]);

  const indiaCount = useMemo(() => languages.filter((l) => l.category === 'india').length, [languages]);
  const globalCount = useMemo(() => languages.filter((l) => l.category === 'global').length, [languages]);

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        id="language-selector-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        title={`${t('language_switcher_title')}: ${currentLanguageInfo.nativeName}`}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all cursor-pointer select-none ${
          isOpen
            ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/50 shadow-inner'
            : 'bg-slate-800/90 hover:bg-slate-800 text-slate-200 border-slate-700 hover:border-slate-600 shadow-sm'
        }`}
      >
        <span className="text-base leading-none" role="img" aria-label={currentLanguageInfo.name}>
          {currentLanguageInfo.flag}
        </span>
        <span className="text-xs font-semibold tracking-tight hidden sm:inline">
          {currentLanguageInfo.code.toUpperCase()}
        </span>
        <span className="text-[11px] text-slate-300 font-medium hidden md:inline truncate max-w-[85px]">
          {currentLanguageInfo.nativeName.split(' ')[0]}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-indigo-400' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          id="language-selector-dropdown"
          className="absolute right-0 mt-1.5 w-84 sm:w-96 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-2xl shadow-black/90 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="p-3 bg-slate-950/90 border-b border-slate-800/80">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white leading-none">{t('language_switcher_title')}</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">{t('language_switcher_desc')}</p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-800 text-indigo-300 border border-slate-700">
                {languages.length} Locales
              </span>
            </div>

            {/* Search Input */}
            <div className="relative mt-2">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                id="language-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search language, state (e.g. Hindi, Tamil, Maharashtra)..."
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors"
              />
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-1 mt-2.5 pt-2 border-t border-slate-800/60">
              <button
                type="button"
                id="lang-cat-all"
                onClick={() => setSelectedCategory('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                All ({languages.length})
              </button>
              <button
                type="button"
                id="lang-cat-india"
                onClick={() => setSelectedCategory('india')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
                  selectedCategory === 'india'
                    ? 'bg-emerald-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span>🇮🇳 India</span>
                <span className={`text-[10px] px-1 rounded ${selectedCategory === 'india' ? 'bg-emerald-700' : 'bg-slate-800 text-slate-400'}`}>
                  {indiaCount}
                </span>
              </button>
              <button
                type="button"
                id="lang-cat-global"
                onClick={() => setSelectedCategory('global')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all flex items-center gap-1 ${
                  selectedCategory === 'global'
                    ? 'bg-blue-600 text-white font-semibold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <span>🌐 Global</span>
                <span className={`text-[10px] px-1 rounded ${selectedCategory === 'global' ? 'bg-blue-700' : 'bg-slate-800 text-slate-400'}`}>
                  {globalCount}
                </span>
              </button>
            </div>
          </div>

          {/* Languages List */}
          <div className="p-1.5 max-h-80 overflow-y-auto space-y-1 divide-y divide-slate-800/40">
            {filteredLanguages.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No matching languages found for "{searchQuery}"
              </div>
            ) : (
              filteredLanguages.map((lang) => {
                const isSelected = lang.code === language;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    id={`lang-option-${lang.code}`}
                    onClick={() => handleSelectLanguage(lang.code)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/20 text-white border border-indigo-500/40 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800/80 hover:text-white border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="text-xl leading-none shrink-0" role="img" aria-label={lang.name}>
                        {lang.flag}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white tracking-tight">{lang.nativeName}</span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                            {lang.code.toUpperCase()}
                          </span>
                          {lang.category === 'india' && (lang.state || lang.stateOrHub) && (
                            <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800/50 flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5" />
                              {lang.state || lang.stateOrHub}
                            </span>
                          )}
                          {lang.dir === 'rtl' && (
                            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              RTL
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-none mt-1 truncate">
                          {lang.name} • {lang.region}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white shrink-0 shadow-sm shadow-indigo-500/50">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Info */}
          <div className="p-2.5 bg-slate-950/90 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center justify-between">
            <span className="flex items-center gap-1 text-slate-400">
              <Sparkles className="w-3 h-3 text-indigo-400" />
              <span>{tr("Full Double-Entry Ledger Localization")}</span>
            </span>
            <span className="font-mono text-slate-500">
              {filteredLanguages.length} of {languages.length} shown
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
