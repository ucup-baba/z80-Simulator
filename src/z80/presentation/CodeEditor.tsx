/**
 * Code Editor Component
 * Assembly code input with syntax highlighting
 */

import React from 'react';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  parseError: string | null;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, parseError }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 bg-zinc-900 border-b border-zinc-700">
        <h2 className="font-semibold text-zinc-100">Assembly Code</h2>
        <div className="text-xs text-zinc-400">Z-80 Simulator</div>
      </div>

      <div className="flex-1 relative">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full h-full px-4 py-3 bg-zinc-950 text-zinc-100 font-mono text-sm leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/50"
          placeholder="Enter Z-80 assembly code..."
          spellCheck={false}
        />

        {parseError && (
          <div className="absolute bottom-0 left-0 right-0 px-4 py-2 bg-red-950/50 border-t border-red-800">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-xs text-red-300">{parseError}</p>
            </div>
          </div>
        )}
      </div>

      <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-700">
        <div className="flex items-center gap-4 text-xs text-zinc-400">
          <span>Lines: {value.split('\n').length}</span>
          <span>•</span>
          <span>Syntax: Z-80 Assembly</span>
        </div>
      </div>
    </div>
  );
};
