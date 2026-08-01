/**
 * Control Panel Component
 * Execution controls with export/import and speed slider
 */

import React, { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from './ThemeContext';
import { Zap, StepForward, Play, Pause, Download, Upload, RotateCcw, Gauge, BookOpenCheck, ChevronDown, X } from 'lucide-react';
import { examplePrograms } from '../data/examplePrograms';

interface ControlPanelProps {
  onLoad: () => void;
  onStep: () => void;
  onRun: () => void;
  onPause?: () => void;
  onReset: () => void;
  isRunning: boolean;
  hasProgram: boolean;
  isCodeDirty?: boolean;
  halted?: boolean;
  // Export/Import
  sourceCode?: string;
  onImportCode?: (code: string) => void;
  // Speed
  speed?: number;
  onSpeedChange?: (speed: number) => void;
  // Keyboard shortcuts modal
  onShowShortcuts?: () => void;
  // Example programs
  onLoadExample?: (id: string) => void;
}

interface ControlButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  isDark: boolean;
  small?: boolean;
  title?: string;
}

const ControlButton: React.FC<ControlButtonProps> = ({
  onClick, disabled = false, variant = 'secondary', icon, label, shortcut, isDark, small = false, title,
}) => {
  const variants = isDark
    ? {
        primary: 'bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900/50 disabled:text-blue-800 border-blue-500 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40',
        secondary: 'bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-900 disabled:text-zinc-700 border-zinc-600',
        success: 'bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900/50 disabled:text-emerald-800 border-emerald-500 shadow-lg shadow-emerald-500/20',
        danger: 'bg-red-600 hover:bg-red-500 disabled:bg-red-900/50 disabled:text-red-800 border-red-500',
        ghost: 'bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-transparent',
      }
    : {
        primary: 'bg-blue-500 hover:bg-blue-600 disabled:bg-blue-100 disabled:text-blue-300 border-blue-400 text-white shadow-md shadow-blue-500/20',
        secondary: 'bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 border-gray-300 text-gray-700',
        success: 'bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-100 disabled:text-emerald-300 border-emerald-400 text-white shadow-md',
        danger: 'bg-red-500 hover:bg-red-600 disabled:bg-red-100 disabled:text-red-300 border-red-400 text-white',
        ghost: 'bg-transparent hover:bg-gray-100 text-gray-500 hover:text-gray-700 border-transparent',
      };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`flex items-center justify-center gap-1.5 ${small ? 'px-2 sm:px-3 py-1.5 sm:py-2' : 'px-2.5 sm:px-4 py-1.5 sm:py-2.5'} rounded-lg border transition-all duration-200 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 ${variants[variant]}`}
    >
      {icon}
      <span className={`font-medium ${small ? 'text-xs' : 'text-xs sm:text-sm'} hidden sm:inline`} style={{ fontFamily: 'var(--font-sans)' }}>{label}</span>
      {shortcut && (
        <span className={`ml-1 px-1.5 py-0.5 text-xs rounded ${isDark ? 'bg-black/30' : 'bg-black/10'} hidden lg:inline`} style={{ fontFamily: 'var(--font-mono)' }}>
          {shortcut}
        </span>
      )}
    </button>
  );
};

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onLoad, onStep, onRun, onPause, onReset, isRunning, hasProgram, isCodeDirty = false, halted = false,
  sourceCode = '', onImportCode, speed = 50, onSpeedChange, onShowShortcuts, onLoadExample,
}) => {
  const { isDark } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showExamples, setShowExamples] = useState(false);

  const bg = isDark ? 'bg-zinc-900/95 backdrop-blur-xl' : 'bg-white/95 backdrop-blur-xl';
  const border = isDark ? 'border-zinc-700/50' : 'border-gray-200';
  const subtext = isDark ? 'text-zinc-500' : 'text-gray-400';
  const sliderTrack = isDark ? 'accent-blue-500' : 'accent-blue-600';

  const canStepOrRun = hasProgram && !isCodeDirty && !halted;

  // Export .asm file
  const handleExport = () => {
    const blob = new Blob([sourceCode], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'program.asm';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import .asm file
  const handleImport = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onImportCode) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        if (text) onImportCode(text);
      };
      reader.readAsText(file);
      e.target.value = '';
    }
  };

  const speedLabel = speed <= 10 ? 'Slow' : speed <= 50 ? 'Normal' : speed <= 80 ? 'Fast' : 'Turbo';

  return (
    <div className={`border-t ${border} ${bg} p-2.5 sm:p-3 transition-colors`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".asm,.z80,.txt"
        onChange={handleFileChange}
        className="hidden"
      />

      <div className="flex items-center justify-between sm:justify-start gap-1 sm:gap-2 flex-nowrap sm:flex-wrap overflow-x-auto">
        {/* Main controls */}
        <ControlButton
          onClick={onLoad}
          disabled={isRunning}
          variant="primary"
          isDark={isDark}
          icon={<Zap className="w-4 h-4" />}
          label="Load"
          shortcut="⌃L"
          title={isCodeDirty ? "Ada perubahan kode! Klik Load untuk memuat ke memori." : "Muat kode ke memori"}
        />

        <ControlButton
          onClick={onStep}
          disabled={isRunning || !canStepOrRun}
          variant="secondary"
          isDark={isDark}
          icon={<StepForward className="w-4 h-4" />}
          label="Step"
          shortcut="⌃S"
          title={isCodeDirty ? "Kode telah diubah. Klik Load terlebih dahulu." : "Eksekusi 1 instruksi"}
        />

        <ControlButton
          onClick={isRunning ? (onPause || (() => {})) : onRun}
          disabled={!canStepOrRun && !isRunning}
          variant={isRunning ? "danger" : "success"}
          isDark={isDark}
          icon={isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          label={isRunning ? "Pause" : "Run"}
          shortcut="⌃R"
          title={isCodeDirty ? "Kode telah diubah. Klik Load terlebih dahulu." : (isRunning ? "Jeda eksekusi" : "Jalankan program")}
        />

        <ControlButton
          onClick={onReset}
          disabled={isRunning}
          variant="danger"
          isDark={isDark}
          icon={<RotateCcw className="w-4 h-4" />}
          label="Reset"
          title="Reset status CPU & Register ke keadaan awal"
        />

        <div className={`w-px h-6 sm:h-8 ${isDark ? 'bg-zinc-700' : 'bg-gray-200'} hidden sm:block`} />

        {/* Export / Import */}
        <ControlButton
          onClick={handleExport}
          disabled={!sourceCode}
          variant="ghost"
          isDark={isDark}
          small
          title="Export .asm file"
          icon={<Download className="w-4 h-4" />}
          label="Export"
        />
        <ControlButton
          onClick={handleImport}
          disabled={isRunning}
          variant="ghost"
          isDark={isDark}
          small
          title="Import .asm file"
          icon={<Upload className="w-4 h-4" />}
          label="Import"
        />

        {/* Example Program Dropdown */}
        {onLoadExample && (
          <div className="relative">
            <button
              onClick={() => setShowExamples(!showExamples)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg border transition-all duration-200 hover:scale-[1.02] active:scale-95 text-xs font-medium ${
                isDark
                  ? 'bg-transparent hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-transparent'
                  : 'bg-transparent hover:bg-gray-100 text-gray-500 hover:text-gray-700 border-transparent'
              }`}
              title="Muat contoh program"
            >
              <BookOpenCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Contoh</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showExamples ? 'rotate-180' : ''}`} />
            </button>
            {showExamples && createPortal(
              <>
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm" onClick={() => setShowExamples(false)} />
                <div className={`fixed z-[101] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[calc(100vw-2rem)] max-w-lg max-h-[80vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${
                  isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-white border-gray-200 text-gray-900'
                }`}>
                  <div className={`flex items-center justify-between px-5 py-3.5 border-b flex-shrink-0 ${
                    isDark ? 'border-zinc-800 bg-zinc-950/50' : 'border-gray-100 bg-gray-50/50'
                  }`}>
                    <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
                      <span>📚 Contoh Program</span>
                    </div>
                    <button
                      onClick={() => setShowExamples(false)}
                      className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-gray-200 text-gray-500'}`}
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
                    {examplePrograms.map((prog) => (
                      <button
                        key={prog.id}
                        onClick={() => {
                          onLoadExample(prog.id);
                          setShowExamples(false);
                        }}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                          isDark
                            ? 'bg-zinc-800/40 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700'
                            : 'bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-sm font-bold">{prog.title}</span>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                            prog.difficulty === 'mudah'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : prog.difficulty === 'sedang'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {prog.difficulty}
                          </span>
                        </div>
                        <p className={`text-xs leading-relaxed ${
                          isDark ? 'text-zinc-400' : 'text-gray-500'
                        }`}>{prog.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </>,
              document.body
            )}
          </div>
        )}

        {/* Speed Slider — hidden on very small screens */}
        <div className={`hidden sm:flex items-center gap-2 ml-2 px-3 py-1.5 rounded-lg ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
          <Gauge className={`w-3.5 h-3.5 ${subtext}`} />
          <input
            type="range"
            min={1}
            max={100}
            value={speed}
            onChange={(e) => onSpeedChange?.(Number(e.target.value))}
            className={`w-16 lg:w-24 h-1 rounded-lg cursor-pointer ${sliderTrack}`}
            title={`Speed: ${speedLabel}`}
          />
          <span className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-gray-500'}`} style={{ fontFamily: 'var(--font-mono)', minWidth: '42px' }}>
            {speedLabel}
          </span>
        </div>

        <div className="hidden sm:block flex-1" />

        {/* Keyboard Shortcuts ? button (PC only) */}
        {onShowShortcuts && (
          <button
            onClick={onShowShortcuts}
            className={`hidden md:flex items-center justify-center w-8 h-8 rounded-lg border transition-all hover:scale-105 ${
              isDark ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200' : 'border-gray-200 text-gray-400 hover:bg-gray-100 hover:text-gray-700'
            }`}
            title="Keyboard Shortcuts (?)"
          >
            <span className="text-sm font-bold">?</span>
          </button>
        )}
      </div>

      {isRunning && (
        <div className="mt-2 flex items-center gap-2 text-sm text-blue-400">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          <span style={{ fontFamily: 'var(--font-mono)' }}>Executing program...</span>
        </div>
      )}
    </div>
  );
};
