/**
 * Control Panel Component
 * Execution controls with export/import and speed slider
 */

import React, { useRef } from 'react';
import { useTheme } from './ThemeContext';

interface ControlPanelProps {
  onLoad: () => void;
  onStep: () => void;
  onRun: () => void;
  onReset: () => void;
  isRunning: boolean;
  hasProgram: boolean;
  halted?: boolean;
  // Export/Import
  sourceCode?: string;
  onImportCode?: (code: string) => void;
  // Speed
  speed?: number;
  onSpeedChange?: (speed: number) => void;
  // Keyboard shortcuts modal
  onShowShortcuts?: () => void;
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
      className={`flex items-center justify-center gap-1.5 ${small ? 'px-3 py-2' : 'px-4 sm:px-5 py-2 sm:py-2.5'} rounded-lg border transition-all duration-200 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 ${variants[variant]}`}
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
  onLoad, onStep, onRun, onReset, isRunning, hasProgram, halted = false,
  sourceCode = '', onImportCode, speed = 50, onSpeedChange, onShowShortcuts,
}) => {
  const { isDark } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const bg = isDark ? 'bg-zinc-900/95 backdrop-blur-xl' : 'bg-white/95 backdrop-blur-xl';
  const border = isDark ? 'border-zinc-700/50' : 'border-gray-200';
  const subtext = isDark ? 'text-zinc-500' : 'text-gray-400';
  const sliderTrack = isDark ? 'accent-blue-500' : 'accent-blue-600';

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result;
        if (typeof text === 'string') {
          onImportCode?.(text);
        }
      };
      reader.readAsText(file);
      // Reset input so same file can be re-imported
      e.target.value = '';
    }
  };

  const speedLabel = speed <= 10 ? 'Slow' : speed <= 50 ? 'Normal' : speed <= 80 ? 'Fast' : 'Turbo';

  return (
    <div className={`px-3 sm:px-4 py-2 sm:py-3 ${bg} border-t ${border} transition-colors duration-300`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".asm,.z80,.txt"
        onChange={handleFileSelect}
        className="hidden"
      />

      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {/* Main controls */}
        <ControlButton
          onClick={onLoad}
          disabled={isRunning}
          variant="primary"
          isDark={isDark}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          }
          label="Load"
          shortcut="⌃L"
        />

        <div className={`w-px h-6 sm:h-8 ${isDark ? 'bg-zinc-700' : 'bg-gray-200'} hidden sm:block`} />

        <ControlButton
          onClick={onStep}
          disabled={isRunning || !hasProgram || halted}
          variant="secondary"
          isDark={isDark}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          }
          label="Step"
          shortcut="⌃S"
        />

        <ControlButton
          onClick={onRun}
          disabled={isRunning || !hasProgram || halted}
          variant="success"
          isDark={isDark}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Run"
          shortcut="⌃R"
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
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          }
          label="Export"
        />
        <ControlButton
          onClick={handleImport}
          disabled={isRunning}
          variant="ghost"
          isDark={isDark}
          small
          title="Import .asm file"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          }
          label="Import"
        />

        {/* Speed Slider — hidden on very small screens */}
        <div className={`hidden sm:flex items-center gap-2 ml-2 px-3 py-1.5 rounded-lg ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
          <span className={`text-xs ${subtext}`}>🏎</span>
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

        <div className="flex-1" />

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

        <ControlButton
          onClick={onReset}
          disabled={isRunning}
          variant="danger"
          isDark={isDark}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
          label="Reset"
        />
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
