/**
 * Stack Viewer Component
 * Shows the current stack contents based on SP value
 */

import React from 'react';
import { useTheme } from './ThemeContext';
import { Layers } from 'lucide-react';

interface StackViewerProps {
  memory: { bytes: Uint8Array; size: number };
  sp: number;
  pc: number;
}

export const StackViewer: React.FC<StackViewerProps> = ({ memory, sp, pc }) => {
  const { isDark } = useTheme();

  const bg = isDark ? 'bg-zinc-950' : 'bg-white';
  const headerBg = isDark ? 'bg-zinc-900' : 'bg-gray-50';
  const border = isDark ? 'border-zinc-700' : 'border-gray-200';
  const text = isDark ? 'text-zinc-100' : 'text-gray-900';
  const subtext = isDark ? 'text-zinc-400' : 'text-gray-500';
  const rowHover = isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-gray-50';
  const spHighlight = isDark ? 'bg-purple-500/10 border-l-2 border-l-purple-400' : 'bg-purple-50 border-l-2 border-l-purple-500';

  // Show stack from SP upward (stack grows downward in Z-80)
  // Initial SP is typically 0xFFFF, show 32 entries max above SP
  const stackEntries: { address: number; low: number; high: number; word: number }[] = [];
  const maxEntries = 24;
  const startAddr = sp;

  for (let i = 0; i < maxEntries * 2 && startAddr + i + 1 < memory.size; i += 2) {
    const addr = startAddr + i;
    const low = memory.bytes[addr] ?? 0;
    const high = memory.bytes[addr + 1] ?? 0;
    const word = (high << 8) | low;
    stackEntries.push({ address: addr, low, high, word });
  }

  const isEmpty = sp >= 0xFFFE || stackEntries.length === 0;

  return (
    <div className={`flex flex-col h-full ${bg} transition-colors duration-300`}>
      <div className={`flex items-center justify-between px-4 py-2.5 ${headerBg} border-b ${border}`}>
        <h2 className={`font-semibold text-sm ${text}`} style={{ fontFamily: 'var(--font-sans)' }}>
          Stack Viewer
        </h2>
        <div className={`text-xs font-mono ${subtext}`} style={{ fontFamily: 'var(--font-mono)' }}>
          SP: {sp.toString(16).toUpperCase().padStart(4, '0')}H
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className={`flex items-center justify-center h-full ${subtext}`}>
            <div className="text-center">
              <Layers className="w-8 h-8 mb-2 opacity-30 mx-auto" />
              <p className="text-sm">Stack is empty</p>
              <p className="text-xs mt-1">SP = {sp.toString(16).toUpperCase().padStart(4, '0')}H</p>
            </div>
          </div>
        ) : (
          <div className="p-2">
            {/* Header row */}
            <div className={`grid grid-cols-3 gap-2 px-3 py-1.5 text-xs font-semibold ${subtext} uppercase tracking-wider`} style={{ fontFamily: 'var(--font-sans)' }}>
              <span>Address</span>
              <span>Value (16-bit)</span>
              <span>Bytes</span>
            </div>
            {/* Stack entries */}
            {stackEntries.map((entry, i) => (
              <div
                key={entry.address}
                className={`grid grid-cols-3 gap-2 px-3 py-1.5 rounded text-xs transition-colors ${
                  i === 0 ? spHighlight : rowHover
                }`}
                style={{ fontFamily: 'var(--font-mono)' }}
              >
                <span className={`${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>
                  {entry.address.toString(16).toUpperCase().padStart(4, '0')}H
                  {i === 0 && <span className="ml-1 text-purple-400">← SP</span>}
                </span>
                <span className={`font-semibold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                  {entry.word.toString(16).toUpperCase().padStart(4, '0')}H
                </span>
                <span className={subtext}>
                  {entry.high.toString(16).toUpperCase().padStart(2, '0')}{' '}
                  {entry.low.toString(16).toUpperCase().padStart(2, '0')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
