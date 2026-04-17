/**
 * Memory Editor Panel
 * Interactive hex editor for direct memory manipulation
 */

import React, { useState } from 'react';
import type { MemoryMap } from '../domain';
import { useTheme } from './ThemeContext';
import { Lightbulb } from 'lucide-react';

interface MemoryEditorPanelProps {
  memory: MemoryMap;
  onMemoryWrite: (address: number, value: number) => void;
}

export const MemoryEditorPanel: React.FC<MemoryEditorPanelProps> = ({ memory, onMemoryWrite }) => {
  const { isDark } = useTheme();
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [startAddress, setStartAddress] = useState(0);
  const bytesPerRow = 16;
  const rowsToShow = 16;
  const bytesToShow = rowsToShow * bytesPerRow;

  const handleCellDoubleClick = (row: number, col: number) => {
    const address = startAddress + row * bytesPerRow + col;
    if (address < memory.size) {
      setEditingCell({ row, col });
      setEditValue(memory.bytes[address].toString(16).toUpperCase().padStart(2, '0'));
    }
  };

  const handleEditSubmit = (row: number, col: number) => {
    const address = startAddress + row * bytesPerRow + col;
    const value = parseInt(editValue, 16);
    if (!isNaN(value) && value >= 0 && value <= 0xFF) {
      onMemoryWrite(address, value);
    }
    setEditingCell(null);
    setEditValue('');
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, row: number, col: number) => {
    if (e.key === 'Enter') handleEditSubmit(row, col);
    else if (e.key === 'Escape') { setEditingCell(null); setEditValue(''); }
  };

  const handleJumpToAddress = (addr: string) => {
    const address = parseInt(addr, 16);
    if (!isNaN(address) && address >= 0 && address < memory.size)
      setStartAddress(Math.floor(address / bytesPerRow) * bytesPerRow);
  };

  const handlePrevPage = () => setStartAddress(Math.max(0, startAddress - bytesToShow));
  const handleNextPage = () => setStartAddress(Math.min(memory.size - bytesToShow, startAddress + bytesToShow));

  const endAddress = Math.min(startAddress + bytesToShow - 1, memory.size - 1);
  const currentPage = Math.floor(startAddress / bytesToShow) + 1;
  const totalPages = Math.ceil(memory.size / bytesToShow);

  const rows: number[][] = [];
  for (let i = 0; i < rowsToShow; i++) {
    const row: number[] = [];
    for (let j = 0; j < bytesPerRow; j++) {
      const index = startAddress + i * bytesPerRow + j;
      if (index < memory.size) row.push(memory.bytes[index]);
    }
    if (row.length > 0) rows.push(row);
  }

  const bg = isDark ? 'bg-zinc-950' : 'bg-white';
  const headerBg = isDark ? 'bg-zinc-900' : 'bg-gray-50';
  const border = isDark ? 'border-zinc-700' : 'border-gray-200';
  const text = isDark ? 'text-zinc-100' : 'text-gray-900';
  const subtext = isDark ? 'text-zinc-400' : 'text-gray-500';
  const inputBg = isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-white border-gray-300 text-gray-900';
  const btnBg = isDark ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700' : 'bg-gray-100 hover:bg-gray-200 border-gray-300';

  return (
    <div className={`flex flex-col h-full ${bg} transition-colors duration-300`}>
      <div className={`px-4 py-2.5 ${headerBg} border-b ${border}`}>
        <div className="flex items-center justify-between mb-1.5">
          <div>
            <h2 className={`font-semibold text-sm ${text}`} style={{ fontFamily: 'var(--font-sans)' }}>Memory Editor</h2>
            <p className={`text-xs ${subtext} mt-0.5`}>{currentPage}/{totalPages} pages</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Jump (hex)"
              className={`px-2 py-1 text-xs ${inputBg} border rounded w-20 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              style={{ fontFamily: 'var(--font-mono)' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { handleJumpToAddress(e.currentTarget.value); e.currentTarget.value = ''; }
              }}
            />
            <button onClick={handlePrevPage} disabled={startAddress === 0} className={`px-2 py-1 text-xs ${btnBg} disabled:opacity-50 border rounded transition-colors`}>◀</button>
            <button onClick={handleNextPage} disabled={startAddress + bytesToShow >= memory.size} className={`px-2 py-1 text-xs ${btnBg} disabled:opacity-50 border rounded transition-colors`}>▶</button>
          </div>
        </div>
        <div className={`text-xs ${subtext} flex items-center justify-center gap-1`}><Lightbulb className="w-3.5 h-3.5" /> Double-click cell to edit • Enter to save • Esc to cancel</div>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        <div style={{ fontFamily: 'var(--font-mono)' }} className="text-xs">
          <div className={`flex items-center gap-2 pb-2 border-b ${isDark ? 'border-zinc-800' : 'border-gray-200'} mb-1 sticky top-0 ${bg}`}>
            <div className={`w-16 ${subtext}`}>Address</div>
            <div className={`flex gap-1.5 ${subtext}`}>
              {Array.from({ length: bytesPerRow }, (_, i) => (
                <div key={i} className="w-7 text-center">+{i.toString(16).toUpperCase()}</div>
              ))}
            </div>
            <div className={`ml-3 ${subtext}`}>ASCII</div>
          </div>

          {rows.map((row, rowIndex) => {
            const address = startAddress + rowIndex * bytesPerRow;
            return (
              <div key={address} className={`flex items-center gap-2 py-0.5 hover:${isDark ? 'bg-zinc-900/30' : 'bg-gray-50'} transition-colors rounded`}>
                <div className={`w-16 ${isDark ? 'text-blue-400' : 'text-blue-600'} font-semibold`}>
                  {address.toString(16).toUpperCase().padStart(4, '0')}
                </div>
                <div className="flex gap-1.5">
                  {row.map((byte, byteIndex) => {
                    const isEditing = editingCell?.row === rowIndex && editingCell?.col === byteIndex;
                    const isZero = byte === 0;
                    return (
                      <div key={byteIndex} className="relative">
                        {isEditing ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value.toUpperCase())}
                            onBlur={() => handleEditSubmit(rowIndex, byteIndex)}
                            onKeyDown={(e) => handleEditKeyDown(e, rowIndex, byteIndex)}
                            className={`w-7 text-center rounded text-xs focus:outline-none ${isDark ? 'bg-blue-950 border-blue-500 text-blue-100' : 'bg-blue-50 border-blue-400 text-blue-900'} border`}
                            maxLength={2}
                            autoFocus
                          />
                        ) : (
                          <div
                            onDoubleClick={() => handleCellDoubleClick(rowIndex, byteIndex)}
                            className={`w-7 text-center cursor-pointer rounded transition-colors ${
                              isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-200'
                            } ${isZero ? (isDark ? 'text-zinc-700' : 'text-gray-300') : (isDark ? 'text-zinc-300' : 'text-gray-700')}`}
                          >
                            {byte.toString(16).toUpperCase().padStart(2, '0')}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {Array.from({ length: bytesPerRow - row.length }, (_, i) => (
                    <div key={`empty-${i}`} className="w-7" />
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

      <div className={`px-4 py-1.5 ${headerBg} border-t ${border}`}>
        <div className={`flex items-center gap-3 text-xs ${subtext}`}>
          <span>{startAddress.toString(16).toUpperCase().padStart(4, '0')}H…{endAddress.toString(16).toUpperCase().padStart(4, '0')}H</span>
          <span>•</span>
          <span>{memory.size.toLocaleString()} bytes</span>
        </div>
      </div>
    </div>
  );
};
