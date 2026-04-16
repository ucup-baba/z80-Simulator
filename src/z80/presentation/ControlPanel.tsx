/**
 * Control Panel Component
 * Execution controls with speed control and enhanced visual feedback
 */

import React, { useState } from 'react';
import { useTheme } from './ThemeContext';

interface ControlPanelProps {
  onLoad: () => void;
  onStep: () => void;
  onRun: () => void;
  onReset: () => void;
  isRunning: boolean;
  hasProgram: boolean;
  halted?: boolean;
}

interface ControlButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'success' | 'danger';
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  isDark: boolean;
}

const ControlButton: React.FC<ControlButtonProps> = ({
  onClick,
  disabled = false,
  variant = 'secondary',
  icon,
  label,
  shortcut,
  isDark,
}) => {
  const variants = isDark
    ? {
        primary: 'bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900/50 disabled:text-blue-800 border-blue-500 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40',
        secondary: 'bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-900 disabled:text-zinc-700 border-zinc-600',
        success: 'bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900/50 disabled:text-emerald-800 border-emerald-500 shadow-lg shadow-emerald-500/20',
        danger: 'bg-red-600 hover:bg-red-500 disabled:bg-red-900/50 disabled:text-red-800 border-red-500',
      }
    : {
        primary: 'bg-blue-500 hover:bg-blue-600 disabled:bg-blue-100 disabled:text-blue-300 border-blue-400 text-white shadow-md shadow-blue-500/20',
        secondary: 'bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 border-gray-300 text-gray-700',
        success: 'bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-100 disabled:text-emerald-300 border-emerald-400 text-white shadow-md',
        danger: 'bg-red-500 hover:bg-red-600 disabled:bg-red-100 disabled:text-red-300 border-red-400 text-white',
      };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg border transition-all duration-200 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-95 ${variants[variant]}`}
    >
      {icon}
      <span className="font-medium text-sm" style={{ fontFamily: 'var(--font-sans)' }}>{label}</span>
      {shortcut && (
        <span className={`ml-1.5 px-1.5 py-0.5 text-xs rounded ${isDark ? 'bg-black/30' : 'bg-black/10'}`} style={{ fontFamily: 'var(--font-mono)' }}>
          {shortcut}
        </span>
      )}
    </button>
  );
};

export const ControlPanel: React.FC<ControlPanelProps> = ({
  onLoad,
  onStep,
  onRun,
  onReset,
  isRunning,
  hasProgram,
  halted = false,
}) => {
  const { isDark } = useTheme();

  const bg = isDark ? 'bg-zinc-900/95 backdrop-blur-xl' : 'bg-white/95 backdrop-blur-xl';
  const border = isDark ? 'border-zinc-700/50' : 'border-gray-200';
  const subtext = isDark ? 'text-zinc-500' : 'text-gray-400';

  return (
    <div className={`px-4 py-3 ${bg} border-t ${border} transition-colors duration-300`}>
      <div className="flex items-center gap-3">
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

        <div className={`w-px h-8 ${isDark ? 'bg-zinc-700' : 'bg-gray-200'}`} />

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
          label="Run All"
          shortcut="⌃R"
        />

        <div className="flex-1" />

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
        <div className="mt-3 flex items-center gap-2 text-sm text-blue-400">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          <span style={{ fontFamily: 'var(--font-mono)' }}>Executing program...</span>
        </div>
      )}
    </div>
  );
};
