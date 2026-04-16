/**
 * Execution Log Component
 * Displays real-time execution messages with enhanced formatting
 */

import React, { useEffect, useRef, useState } from 'react';
import { useTheme } from './ThemeContext';

interface ExecutionLogEntry {
  timestamp: number;
  message: string;
  type: 'info' | 'error' | 'success';
}

interface ExecutionLogProps {
  entries: ExecutionLogEntry[];
  onClear: () => void;
}

const LogEntry: React.FC<{ entry: ExecutionLogEntry; isDark: boolean }> = ({ entry, isDark }) => {
  const iconByType = {
    info: (
      <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="w-3.5 h-3.5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    success: (
      <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const textColor = {
    info: isDark ? 'text-zinc-300' : 'text-gray-700',
    error: isDark ? 'text-red-300' : 'text-red-600',
    success: isDark ? 'text-green-300' : 'text-green-600',
  };

  const borderColor = {
    info: isDark ? 'border-zinc-800/50' : 'border-gray-100',
    error: isDark ? 'border-red-900/30' : 'border-red-100',
    success: isDark ? 'border-green-900/30' : 'border-green-100',
  };

  const time = new Date(entry.timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className={`flex items-start gap-2 py-1.5 border-b ${borderColor[entry.type]} last:border-0 transition-colors duration-200 hover:${isDark ? 'bg-zinc-900/50' : 'bg-gray-50'}`}>
      <div className="flex-shrink-0 mt-0.5">{iconByType[entry.type]}</div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs ${textColor[entry.type]}`} style={{ fontFamily: 'var(--font-mono)' }}>
          {entry.message}
        </p>
      </div>
      <span className={`text-xs flex-shrink-0 ${isDark ? 'text-zinc-600' : 'text-gray-400'}`} style={{ fontFamily: 'var(--font-mono)' }}>{time}</span>
    </div>
  );
};

export const ExecutionLog: React.FC<ExecutionLogProps> = ({ entries, onClear }) => {
  const { isDark } = useTheme();
  const logEndRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll) {
      logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [entries, autoScroll]);

  const bg = isDark ? 'bg-zinc-950' : 'bg-white';
  const headerBg = isDark ? 'bg-zinc-900' : 'bg-gray-50';
  const border = isDark ? 'border-zinc-700' : 'border-gray-200';
  const text = isDark ? 'text-zinc-100' : 'text-gray-900';
  const subtext = isDark ? 'text-zinc-400' : 'text-gray-500';

  return (
    <div className={`flex flex-col h-full ${bg} transition-colors duration-300`}>
      <div className={`flex items-center justify-between px-4 py-2.5 ${headerBg} border-b ${border} transition-colors duration-300`}>
        <div className="flex items-center gap-2">
          <h2 className={`font-semibold text-sm ${text}`} style={{ fontFamily: 'var(--font-sans)' }}>Execution Log</h2>
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-200 text-gray-500'}`}>
            {entries.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              autoScroll
                ? isDark ? 'bg-blue-900/30 text-blue-400 border border-blue-700/50' : 'bg-blue-50 text-blue-600 border border-blue-200'
                : isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            {autoScroll ? '⬇ Auto' : '⏸ Paused'}
          </button>
          <button
            onClick={onClear}
            className={`px-2 py-1 text-xs rounded transition-colors ${isDark ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
          >
            Clear
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-2">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <svg className={`w-10 h-10 ${isDark ? 'text-zinc-700' : 'text-gray-300'} mb-2`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className={`text-xs ${subtext}`}>No execution log yet</p>
            <p className={`text-xs ${isDark ? 'text-zinc-600' : 'text-gray-400'} mt-0.5`}>Load and run a program to see details</p>
          </div>
        ) : (
          <div>
            {entries.map((entry, index) => (
              <LogEntry key={`${entry.timestamp}-${index}`} entry={entry} isDark={isDark} />
            ))}
            <div ref={logEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};
