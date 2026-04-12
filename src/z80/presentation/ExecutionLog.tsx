/**
 * Execution Log Component
 * Displays real-time execution messages
 */

import React, { useEffect, useRef } from 'react';

interface ExecutionLogEntry {
  timestamp: number;
  message: string;
  type: 'info' | 'error' | 'success';
}

interface ExecutionLogProps {
  entries: ExecutionLogEntry[];
  onClear: () => void;
}

const LogEntry: React.FC<{ entry: ExecutionLogEntry }> = ({ entry }) => {
  const iconByType = {
    info: (
      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    success: (
      <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  const textColorByType = {
    info: 'text-zinc-300',
    error: 'text-red-300',
    success: 'text-green-300',
  };

  const time = new Date(entry.timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <div className="flex items-start gap-2 py-1.5 border-b border-zinc-800/50 last:border-0">
      <div className="flex-shrink-0 mt-0.5">
        {iconByType[entry.type]}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-mono ${textColorByType[entry.type]}`}>
          {entry.message}
        </p>
        <p className="text-xs text-zinc-600 mt-0.5">{time}</p>
      </div>
    </div>
  );
};

export const ExecutionLog: React.FC<ExecutionLogProps> = ({ entries, onClear }) => {
  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-700">
        <h2 className="font-semibold text-zinc-100">Execution Log</h2>
        <button
          onClick={onClear}
          className="px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
        >
          Clear
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <svg className="w-12 h-12 text-zinc-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm text-zinc-500">No execution log yet</p>
            <p className="text-xs text-zinc-600 mt-1">Load and run a program to see execution details</p>
          </div>
        ) : (
          <div className="space-y-0">
            {entries.map((entry, index) => (
              <LogEntry key={`${entry.timestamp}-${index}`} entry={entry} />
            ))}
            <div ref={logEndRef} />
          </div>
        )}
      </div>
    </div>
  );
};
