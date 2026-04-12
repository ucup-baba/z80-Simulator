/**
 * Memory Viewer Component
 * Displays memory contents in hex dump format (64KB support)
 */

import React, { useState } from 'react';
import type { MemoryMap } from '../domain';

interface MemoryViewerProps {
  memory: MemoryMap;
  displayRows?: number;
}

export const MemoryViewer: React.FC<MemoryViewerProps> = ({ memory, displayRows = 16 }) => {
  const [startAddress, setStartAddress] = useState(0);
  const bytesPerRow = 16;
  const bytesToShow = displayRows * bytesPerRow;

  const rows: number[][] = [];

  // Group bytes into rows
  for (let i = 0; i < displayRows; i++) {
    const row: number[] = [];
    for (let j = 0; j < bytesPerRow; j++) {
      const index = startAddress + i * bytesPerRow + j;
      if (index < memory.size) {
        row.push(memory.bytes[index]);
      }
    }
    if (row.length > 0) {
      rows.push(row);
    }
  }

  const handlePrevPage = () => {
    setStartAddress(Math.max(0, startAddress - bytesToShow));
  };

  const handleNextPage = () => {
    setStartAddress(Math.min(memory.size - bytesToShow, startAddress + bytesToShow));
  };

  const handleJumpToAddress = (addr: string) => {
    const address = parseInt(addr, 16);
    if (!isNaN(address) && address >= 0 && address < memory.size) {
      setStartAddress(Math.floor(address / bytesPerRow) * bytesPerRow);
    }
  };

  const endAddress = Math.min(startAddress + bytesToShow - 1, memory.size - 1);
  const currentPage = Math.floor(startAddress / bytesToShow) + 1;
  const totalPages = Math.ceil(memory.size / bytesToShow);

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-zinc-100">Memory Viewer</h2>
            <p className="text-xs text-zinc-500 mt-1">
              64KB ({(memory.size / 1024).toFixed(0)}KB) - Page {currentPage}/{totalPages}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Jump (hex)"
              className="px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded text-zinc-100 font-mono w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleJumpToAddress(e.currentTarget.value);
                  e.currentTarget.value = '';
                }
              }}
            />
            <button
              onClick={handlePrevPage}
              disabled={startAddress === 0}
              className="px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700 rounded transition-colors"
            >
              ◀ Prev
            </button>
            <button
              onClick={handleNextPage}
              disabled={startAddress + bytesToShow >= memory.size}
              className="px-2 py-1 text-xs bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed border border-zinc-700 rounded transition-colors"
            >
              Next ▶
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="font-mono text-xs">
          {/* Header */}
          <div className="flex items-center gap-2 pb-2 border-b border-zinc-800 mb-2 sticky top-0 bg-zinc-950">
            <div className="w-16 text-zinc-500">Addr</div>
            <div className="flex gap-1.5 text-zinc-500">
              {Array.from({ length: bytesPerRow }, (_, i) => (
                <div key={i} className="w-6 text-center">
                  {i.toString(16).toUpperCase()}
                </div>
              ))}
            </div>
            <div className="ml-4 text-zinc-500">ASCII</div>
          </div>

          {/* Memory rows */}
          {rows.map((row, rowIndex) => {
            const address = startAddress + rowIndex * bytesPerRow;
            return (
              <div key={address} className="flex items-center gap-2 py-0.5 hover:bg-zinc-900/30 transition-colors">
                {/* Address */}
                <div className="w-16 text-zinc-400">
                  {address.toString(16).toUpperCase().padStart(4, '0')}
                </div>

                {/* Hex values */}
                <div className="flex gap-1.5">
                  {row.map((byte, byteIndex) => {
                    const isZero = byte === 0;
                    return (
                      <div
                        key={byteIndex}
                        className={`w-6 text-center ${
                          isZero ? 'text-zinc-700' : 'text-zinc-300'
                        }`}
                      >
                        {byte.toString(16).toUpperCase().padStart(2, '0')}
                      </div>
                    );
                  })}
                  {/* Fill empty cells */}
                  {Array.from({ length: bytesPerRow - row.length }, (_, i) => (
                    <div key={`empty-${i}`} className="w-6" />
                  ))}
                </div>

                {/* ASCII representation */}
                <div className="ml-4 text-zinc-600">
                  {row.map((byte, byteIndex) => {
                    const char = byte >= 32 && byte <= 126 ? String.fromCharCode(byte) : '.';
                    return (
                      <span key={byteIndex} className={byte === 0 ? 'text-zinc-800' : ''}>
                        {char}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-700">
        <div className="flex items-center gap-4 text-xs text-zinc-400">
          <span>Viewing: {startAddress.toString(16).toUpperCase().padStart(4, '0')}H - {endAddress.toString(16).toUpperCase().padStart(4, '0')}H</span>
          <span>•</span>
          <span>Total: {memory.size.toLocaleString()} bytes (64KB)</span>
        </div>
      </div>
    </div>
  );
};
