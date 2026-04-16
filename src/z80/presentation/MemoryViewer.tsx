/**
 * Memory Viewer Component
 * Displays memory contents in hex dump format with PC/SP highlighting
 */

import React, { useState, useEffect } from 'react';
import type { MemoryMap } from '../domain';
import { useTheme } from './ThemeContext';

interface MemoryViewerProps {
  memory: MemoryMap;
  pc?: number;
  sp?: number;
  displayRows?: number;
}

export const MemoryViewer: React.FC<MemoryViewerProps> = ({ memory, pc = 0, sp = 0, displayRows = 16 }) => {
  const { isDark } = useTheme();
  const [startAddress, setStartAddress] = useState(0);
  const [autoFollowPC, setAutoFollowPC] = useState(false);
  const bytesPerRow = 16;
  const bytesToShow = displayRows * bytesPerRow;

  // Auto-follow PC
  useEffect(() => {
    if (autoFollowPC && pc !== undefined) {
      setStartAddress(Math.floor(pc / bytesPerRow) * bytesPerRow);
    }
  }, [pc, autoFollowPC, bytesPerRow]);

  const rows: number[][] = [];
  for (let i = 0; i < displayRows; i++) {
    const row: number[] = [];
    for (let j = 0; j < bytesPerRow; j++) {
      const index = startAddress + i * bytesPerRow + j;
      if (index < memory.size) row.push(memory.bytes[index]);
    }
    if (row.length > 0) rows.push(row);
  }

  const handlePrevPage = () => setStartAddress(Math.max(0, startAddress - bytesToShow));
  const handleNextPage = () => setStartAddress(Math.min(memory.size - bytesToShow, startAddress + bytesToShow));
  const handleJumpToAddress = (addr: string) => {
    const address = parseInt(addr, 16);
    if (!isNaN(address) && address >= 0 && address < memory.size) {
      setStartAddress(Math.floor(address / bytesPerRow) * bytesPerRow);
    }
  };

  const endAddress = Math.min(startAddress + bytesToShow - 1, memory.size - 1);
  const currentPage = Math.floor(startAddress / bytesToShow) + 1;
  const totalPages = Math.ceil(memory.size / bytesToShow);

  const bg = isDark ? 'bg-zinc-950' : 'bg-white';
  const headerBg = isDark ? 'bg-zinc-900' : 'bg-gray-50';
  const border = isDark ? 'border-zinc-700' : 'border-gray-200';
  const text = isDark ? 'text-zinc-100' : 'text-gray-900';
  const subtext = isDark ? 'text-zinc-400' : 'text-gray-500';
  const inputBg = isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-white border-gray-300 text-gray-900';
  const btnBg = isDark ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700' : 'bg-gray-100 hover:bg-gray-200 border-gray-300';

  return (
    <div className={`flex flex-col h-full ${bg} transition-colors duration-300`}>
      <div className={`px-4 py-2.5 ${headerBg} border-b ${border} transition-colors duration-300`}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`font-semibold text-sm ${text}`} style={{ fontFamily: 'var(--font-sans)' }}>Memory Viewer</h2>
            <p className={`text-xs ${subtext} mt-0.5`}>{currentPage}/{totalPages} pages</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setAutoFollowPC(!autoFollowPC)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                autoFollowPC
                  ? isDark ? 'bg-blue-900/30 text-blue-400 border border-blue-700/50' : 'bg-blue-50 text-blue-600 border border-blue-200'
                  : isDark ? 'text-zinc-500 hover:text-zinc-300 border border-zinc-700' : 'text-gray-400 hover:text-gray-600 border border-gray-200'
              }`}
            >
              {autoFollowPC ? '📍 Following PC' : '📍 Follow PC'}
            </button>
            <input
              type="text"
              placeholder="Jump (hex)"
              className={`px-2 py-1 text-xs ${inputBg} border rounded w-20 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              style={{ fontFamily: 'var(--font-mono)' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleJumpToAddress(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
            <button onClick={handlePrevPage} disabled={startAddress === 0} className={`px-2 py-1 text-xs ${btnBg} disabled:opacity-50 border rounded transition-colors`}>◀</button>
            <button onClick={handleNextPage} disabled={startAddress + bytesToShow >= memory.size} className={`px-2 py-1 text-xs ${btnBg} disabled:opacity-50 border rounded transition-colors`}>▶</button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div style={{ fontFamily: 'var(--font-mono)' }} className="text-xs">
          {/* Header */}
          <div className={`flex items-center gap-2 pb-2 border-b ${isDark ? 'border-zinc-800' : 'border-gray-200'} mb-1 sticky top-0 ${bg}`}>
            <div className={`w-14 ${subtext}`}>Addr</div>
            <div className={`flex gap-1 ${subtext}`}>
              {Array.from({ length: bytesPerRow }, (_, i) => (
                <div key={i} className="w-6 text-center">{i.toString(16).toUpperCase()}</div>
              ))}
            </div>
            <div className={`ml-3 ${subtext}`}>ASCII</div>
          </div>

          {rows.map((row, rowIndex) => {
            const address = startAddress + rowIndex * bytesPerRow;
            const isPCRow = pc >= address && pc < address + bytesPerRow;
            const isSPRow = sp >= address && sp < address + bytesPerRow;

            return (
              <div
                key={address}
                className={`flex items-center gap-2 py-0.5 transition-colors ${
                  isPCRow
                    ? isDark ? 'bg-blue-950/30 rounded' : 'bg-blue-50 rounded'
                    : isSPRow
                      ? isDark ? 'bg-purple-950/20 rounded' : 'bg-purple-50 rounded'
                      : `hover:${isDark ? 'bg-zinc-900/30' : 'bg-gray-50'}`
                }`}
              >
                <div className={`w-14 ${isPCRow ? (isDark ? 'text-blue-400' : 'text-blue-600') : isSPRow ? (isDark ? 'text-purple-400' : 'text-purple-600') : subtext} font-semibold`}>
                  {address.toString(16).toUpperCase().padStart(4, '0')}
                </div>
                <div className="flex gap-1">
                  {row.map((byte, byteIndex) => {
                    const byteAddr = address + byteIndex;
                    const isPC = byteAddr === pc;
                    const isSP = byteAddr === sp;
                    const isZero = byte === 0;
                    return (
                      <div
                        key={byteIndex}
                        className={`w-6 text-center rounded ${
                          isPC
                            ? isDark ? 'bg-blue-500/30 text-blue-300 font-bold' : 'bg-blue-200 text-blue-800 font-bold'
                            : isSP
                              ? isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
                              : isZero
                                ? isDark ? 'text-zinc-700' : 'text-gray-300'
                                : isDark ? 'text-zinc-300' : 'text-gray-700'
                        }`}
                      >
                        {byte.toString(16).toUpperCase().padStart(2, '0')}
                      </div>
                    );
                  })}
                  {Array.from({ length: bytesPerRow - row.length }, (_, i) => (
                    <div key={`empty-${i}`} className="w-6" />
                  ))}
                </div>
                <div className={`ml-3 ${isDark ? 'text-zinc-600' : 'text-gray-400'}`}>
                  {row.map((byte, byteIndex) => {
                    const char = byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.';
                    return <span key={byteIndex} className={byte === 0 ? (isDark ? 'text-zinc-800' : 'text-gray-200') : ''}>{char}</span>;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={`px-4 py-1.5 ${headerBg} border-t ${border} transition-colors duration-300`}>
        <div className={`flex items-center gap-3 text-xs ${subtext}`}>
          <span>{startAddress.toString(16).toUpperCase().padStart(4, '0')}H…{endAddress.toString(16).toUpperCase().padStart(4, '0')}H</span>
          <span>•</span>
          <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>● PC</span>
          <span className={isDark ? 'text-purple-400' : 'text-purple-600'}>● SP</span>
        </div>
      </div>
    </div>
  );
};
