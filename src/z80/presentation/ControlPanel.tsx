/**
 * Control Panel Component
 * Execution controls (Load, Step, Run, Reset)
 */

import React from 'react';

interface ControlPanelProps {
  onLoad: () => void;
  onStep: () => void;
  onRun: () => void;
  onReset: () => void;
  isRunning: boolean;
  hasProgram: boolean;
}

interface ControlButtonProps {
  onClick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
}

const ControlButton: React.FC<ControlButtonProps> = ({
  onClick,
  disabled = false,
  variant = 'secondary',
  icon,
  label,
  shortcut,
}) => {
  const variantStyles = {
    primary: 'bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 disabled:text-blue-700 border-blue-500',
    secondary: 'bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-900 disabled:text-zinc-700 border-zinc-600',
    danger: 'bg-red-600 hover:bg-red-500 disabled:bg-red-900 disabled:text-red-700 border-red-500',
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border transition-all disabled:cursor-not-allowed ${variantStyles[variant]}`}
    >
      {icon}
      <span className="font-medium">{label}</span>
      {shortcut && (
        <span className="ml-2 px-1.5 py-0.5 text-xs bg-black/30 rounded">
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
}) => {
  return (
    <div className="px-4 py-3 bg-zinc-900 border-t border-zinc-700">
      <div className="flex items-center gap-3">
        <ControlButton
          onClick={onLoad}
          disabled={isRunning}
          variant="primary"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
          }
          label="Load"
          shortcut="L"
        />

        <ControlButton
          onClick={onStep}
          disabled={isRunning || !hasProgram}
          variant="secondary"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          }
          label="Step"
          shortcut="S"
        />

        <ControlButton
          onClick={onRun}
          disabled={isRunning || !hasProgram}
          variant="secondary"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Run"
          shortcut="R"
        />

        <div className="flex-1" />

        <ControlButton
          onClick={onReset}
          disabled={isRunning}
          variant="danger"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          }
          label="Reset"
        />
      </div>

      {isRunning && (
        <div className="mt-3 flex items-center gap-2 text-sm text-blue-300">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
          <span>Running program...</span>
        </div>
      )}
    </div>
  );
};
