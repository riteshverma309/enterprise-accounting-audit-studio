import React, { useState, useRef, useEffect } from 'react';
import { useFontSize } from '../context/FontSizeContext';
import {
  ALargeSmall,
  Plus,
  Minus,
  RotateCcw,
  Check,
  Sliders,
  Eye,
  Info,
  ChevronDown,
  Sparkles,
  X,
} from 'lucide-react';
import { FontSizePreset } from '../types';

interface FontSizeControlProps {
  variant?: 'header_button' | 'full_panel' | 'inline_selector';
  showLabel?: boolean;
}

export const FontSizeControl: React.FC<FontSizeControlProps> = ({
  variant = 'header_button',
  showLabel = true,
}) => {
  const {
    fontSize,
    preset,
    basePx,
    setFontSize,
    setFontPreset,
    increaseFontSize,
    decreaseFontSize,
    resetFontSize,
    presets,
  } = useFontSize();

  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  // If full panel variant (e.g. inside Help Center or User Settings view)
  if (variant === 'full_panel') {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
              <ALargeSmall className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Display & Font Sizing Preferences</h3>
              <p className="text-xs text-slate-400">
                Adjust the base font scaling across all ledger tables, forms, and analytical dashboards.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetFontSize}
              disabled={fontSize === 100}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 rounded-lg text-xs font-medium border border-slate-700 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Default (100%)</span>
            </button>
          </div>
        </div>

        {/* Preset Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5">
          {presets.map((p) => {
            const isSelected = preset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => setFontPreset(p.id)}
                className={`p-4 rounded-xl border text-left transition relative flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600/15 border-indigo-500 text-white shadow-lg shadow-indigo-600/10 ring-1 ring-indigo-500'
                    : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80 text-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-white">{p.label}</span>
                    {isSelected ? (
                      <span className="p-1 bg-indigo-500 text-white rounded-full">
                        <Check className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-400">{p.scalePercent}%</span>
                    )}
                  </div>
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-indigo-300 border border-slate-700 mb-2">
                    {p.subLabel}
                  </span>
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">{p.description}</p>
                </div>
                <div className="pt-2 border-t border-slate-700/50 text-[10px] text-slate-500 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-indigo-400 shrink-0" />
                  <span className="truncate">{p.recommendedFor}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Stepper & Fine-Grained Slider */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-slate-200">Fine Scale Calibration</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-lg border border-indigo-500/20">
                {fontSize}% Scale • {basePx}px Base
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={decreaseFontSize}
              disabled={fontSize <= 80}
              title="Decrease Font Size (5%)"
              className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg border border-slate-700 transition cursor-pointer"
            >
              <Minus className="w-4 h-4" />
            </button>

            <div className="flex-1 relative flex items-center">
              <input
                type="range"
                min="80"
                max="140"
                step="2.5"
                value={fontSize}
                onChange={(e) => setFontSize(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
              />
            </div>

            <button
              onClick={increaseFontSize}
              disabled={fontSize >= 140}
              title="Increase Font Size (5%)"
              className="p-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg border border-slate-700 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="flex justify-between text-[10px] text-slate-500 font-mono px-1">
            <span>80% (Compact 12.8px)</span>
            <span>100% (Standard 16px)</span>
            <span>125% (Large 20px)</span>
            <span>140% (Max 22.4px)</span>
          </div>
        </div>

        {/* Live Interactive Sample Preview Box */}
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Eye className="w-3.5 h-3.5 text-indigo-400" />
              <span>Live Render Preview (Real-time Scale Test)</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono">Real-time Root CSS Synchronized</span>
          </div>

          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800 text-slate-400 font-medium">
              <span>Account & Transaction</span>
              <span>Reference</span>
              <span>Debit Amount</span>
              <span>Status</span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-200">
              <div className="flex items-center gap-2">
                <span className="font-mono text-indigo-400 font-bold">1010</span>
                <span>Operating Cash & Treasury Account</span>
              </div>
              <span className="font-mono text-slate-400">JE-2026-8902</span>
              <span className="font-mono font-bold text-white">$142,500.00</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                POSTED
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Header Dropdown Popover Variant
  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        title={`Change Font Size (Currently ${fontSize}%)`}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer ${
          isOpen
            ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/50 shadow-sm'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
        }`}
      >
        <ALargeSmall className="w-4 h-4 text-indigo-400" />
        {showLabel && (
          <span className="hidden sm:inline font-mono font-semibold text-[11px]">
            {fontSize}%
          </span>
        )}
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover Dropdown Window */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-50 p-4 space-y-4 animate-in fade-in zoom-in-95 duration-150 text-slate-100">
          
          {/* Header Row */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                <ALargeSmall className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white tracking-tight">Display Font Size</h4>
                <p className="text-[10px] text-slate-400">Scale entire UI & ledger density</p>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-md transition"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Stepper Bar */}
          <div className="flex items-center justify-between gap-2 bg-slate-950 p-2 rounded-xl border border-slate-800">
            <button
              onClick={decreaseFontSize}
              disabled={fontSize <= 80}
              title="Decrease Font Size (-5%)"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg border border-slate-700 transition cursor-pointer flex items-center gap-1 text-xs font-medium px-2"
            >
              <Minus className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-[11px]">A⁻</span>
            </button>

            <div className="text-center px-2">
              <span className="text-xs font-mono font-bold text-white block">
                {fontSize}%
              </span>
              <span className="text-[9px] font-mono text-slate-400 block">
                {basePx}px Base
              </span>
            </div>

            <button
              onClick={increaseFontSize}
              disabled={fontSize >= 140}
              title="Increase Font Size (+5%)"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 rounded-lg border border-slate-700 transition cursor-pointer flex items-center gap-1 text-xs font-medium px-2"
            >
              <span className="text-[11px]">A⁺</span>
              <Plus className="w-3.5 h-3.5 text-indigo-400" />
            </button>

            <button
              onClick={resetFontSize}
              disabled={fontSize === 100}
              title="Reset to standard 100%"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-lg border border-slate-700 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Preset Buttons Grid */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Quick Presets
            </span>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((p) => {
                const isSelected = preset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setFontPreset(p.id)}
                    className={`p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm ring-1 ring-indigo-500'
                        : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700 text-slate-300'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-xs text-white leading-none">{p.label}</div>
                      <div className="text-[10px] font-mono text-indigo-300 mt-1">{p.scalePercent}% ({p.basePx}px)</div>
                    </div>
                    {isSelected && (
                      <div className="p-1 bg-indigo-500 text-white rounded-full">
                        <Check className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slider */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Slider Adjustment</span>
              <span className="font-mono">{fontSize}%</span>
            </div>
            <input
              type="range"
              min="80"
              max="140"
              step="2.5"
              value={fontSize}
              onChange={(e) => setFontSize(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 focus:outline-none"
            />
          </div>

          {/* Mini Live Preview */}
          <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] space-y-1">
            <div className="flex items-center justify-between text-slate-400 text-[10px]">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3 text-indigo-400" />
                <span>Preview Scale</span>
              </span>
              <span className="text-emerald-400 font-mono text-[9px]">Saved to Browser</span>
            </div>
            <div className="flex items-center justify-between font-mono pt-1 text-slate-200">
              <span className="truncate max-w-[140px]">Cash & Equiv.</span>
              <span className="text-white font-bold">$24,500.00</span>
              <span className="text-[9px] px-1.5 py-0.2 bg-emerald-500/20 text-emerald-300 rounded font-semibold">
                ACTIVE
              </span>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};
