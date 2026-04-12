/**
 * Watch Panel
 * Monitor specific memory addresses and register values
 */

import React, { useState } from 'react';
import type { MemoryMap, RegisterState } from '../domain';

interface WatchVariable {
  id: string;
  name: string;
  address?: number;  // Memory address to watch
  register?: string; // Register name to watch
  type: 'memory' | 'register';
  format: 'hex' | 'dec' | 'bin';
}

interface WatchPanelProps {
  memory: MemoryMap;
  registers: RegisterState;
}

export const WatchPanel: React.FC<WatchPanelProps> = ({ memory, registers }) => {
  const [watches, setWatches] = useState<WatchVariable[]>([
    { id: '1', name: 'Accumulator', register: 'A', type: 'register', format: 'hex' },
    { id: '2', name: 'Stack Pointer', register: 'SP', type: 'register', format: 'hex' },
  ]);
  const [newWatchName, setNewWatchName] = useState('');
  const [newWatchAddress, setNewWatchAddress] = useState('');
  const [newWatchType, setNewWatchType] = useState<'memory' | 'register'>('memory');
  const [newWatchRegister, setNewWatchRegister] = useState('A');

  const getWatchValue = (watch: WatchVariable): number => {
    if (watch.type === 'memory' && watch.address !== undefined) {
      return memory.bytes[watch.address] || 0;
    } else if (watch.type === 'register' && watch.register) {
      const reg = watch.register;
      // 8-bit registers
      if (reg === 'A') return registers.registers8.A;
      if (reg === 'B') return registers.registers8.B;
      if (reg === 'C') return registers.registers8.C;
      if (reg === 'D') return registers.registers8.D;
      if (reg === 'E') return registers.registers8.E;
      if (reg === 'H') return registers.registers8.H;
      if (reg === 'L') return registers.registers8.L;
      // 16-bit registers
      if (reg === 'PC') return registers.registers16.PC;
      if (reg === 'SP') return registers.registers16.SP;
      if (reg === 'IX') return registers.registers16.IX;
      if (reg === 'IY') return registers.registers16.IY;
      // Special
      if (reg === 'I') return registers.special.I;
      if (reg === 'R') return registers.special.R;
      // Pairs
      if (reg === 'BC') return (registers.registers8.B << 8) | registers.registers8.C;
      if (reg === 'DE') return (registers.registers8.D << 8) | registers.registers8.E;
      if (reg === 'HL') return (registers.registers8.H << 8) | registers.registers8.L;
    }
    return 0;
  };

  const formatValue = (value: number, format: 'hex' | 'dec' | 'bin', is16bit: boolean = false): string => {
    switch (format) {
      case 'hex':
        return '0x' + value.toString(16).toUpperCase().padStart(is16bit ? 4 : 2, '0');
      case 'dec':
        return value.toString(10);
      case 'bin':
        return '0b' + value.toString(2).padStart(is16bit ? 16 : 8, '0');
      default:
        return value.toString();
    }
  };

  const addWatch = () => {
    if (!newWatchName) return;

    const newWatch: WatchVariable = {
      id: Date.now().toString(),
      name: newWatchName,
      type: newWatchType,
      format: 'hex',
    };

    if (newWatchType === 'memory') {
      const addr = parseInt(newWatchAddress, 16);
      if (isNaN(addr) || addr < 0 || addr >= memory.size) {
        alert('Invalid address');
        return;
      }
      newWatch.address = addr;
    } else {
      newWatch.register = newWatchRegister;
    }

    setWatches([...watches, newWatch]);
    setNewWatchName('');
    setNewWatchAddress('');
  };

  const removeWatch = (id: string) => {
    setWatches(watches.filter(w => w.id !== id));
  };

  const toggleFormat = (id: string) => {
    setWatches(watches.map(w => {
      if (w.id === id) {
        const formats: ('hex' | 'dec' | 'bin')[] = ['hex', 'dec', 'bin'];
        const currentIndex = formats.indexOf(w.format);
        const nextFormat = formats[(currentIndex + 1) % formats.length];
        return { ...w, format: nextFormat };
      }
      return w;
    }));
  };

  const is16BitRegister = (reg: string) => {
    return ['PC', 'SP', 'IX', 'IY', 'BC', 'DE', 'HL'].includes(reg);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      {/* Header */}
      <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-700">
        <h2 className="font-semibold text-zinc-100">Watch Variables</h2>
        <p className="text-xs text-zinc-500 mt-1">Monitor memory addresses and registers in real-time</p>
      </div>

      {/* Add Watch Form */}
      <div className="px-4 py-3 bg-zinc-900/50 border-b border-zinc-700">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <select
              value={newWatchType}
              onChange={(e) => setNewWatchType(e.target.value as 'memory' | 'register')}
              className="px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="memory">Memory</option>
              <option value="register">Register</option>
            </select>

            {newWatchType === 'memory' ? (
              <input
                type="text"
                placeholder="Address (hex)"
                value={newWatchAddress}
                onChange={(e) => setNewWatchAddress(e.target.value)}
                className="px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded text-zinc-100 font-mono w-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            ) : (
              <select
                value={newWatchRegister}
                onChange={(e) => setNewWatchRegister(e.target.value)}
                className="px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded text-zinc-100 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <optgroup label="8-bit">
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="E">E</option>
                  <option value="H">H</option>
                  <option value="L">L</option>
                </optgroup>
                <optgroup label="16-bit">
                  <option value="BC">BC</option>
                  <option value="DE">DE</option>
                  <option value="HL">HL</option>
                  <option value="PC">PC</option>
                  <option value="SP">SP</option>
                  <option value="IX">IX</option>
                  <option value="IY">IY</option>
                </optgroup>
                <optgroup label="Special">
                  <option value="I">I</option>
                  <option value="R">R</option>
                </optgroup>
              </select>
            )}

            <input
              type="text"
              placeholder="Name"
              value={newWatchName}
              onChange={(e) => setNewWatchName(e.target.value)}
              className="flex-1 px-2 py-1 text-xs bg-zinc-800 border border-zinc-700 rounded text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={addWatch}
              className="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
            >
              Add Watch
            </button>
          </div>
        </div>
      </div>

      {/* Watch List */}
      <div className="flex-1 overflow-y-auto">
        {watches.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <svg className="w-12 h-12 text-zinc-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <p className="text-sm text-zinc-500">No watch variables</p>
            <p className="text-xs text-zinc-600 mt-1">Add memory addresses or registers to monitor</p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {watches.map((watch) => {
              const value = getWatchValue(watch);
              const is16bit = watch.type === 'register' && watch.register ? is16BitRegister(watch.register) : false;
              const formattedValue = formatValue(value, watch.format, is16bit);

              return (
                <div
                  key={watch.id}
                  className="flex items-center justify-between px-3 py-2 bg-zinc-900/50 border border-zinc-700/50 rounded-lg hover:border-zinc-600 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-zinc-200">{watch.name}</span>
                      <span className="text-xs px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400 font-mono">
                        {watch.type === 'memory'
                          ? `@${watch.address?.toString(16).toUpperCase().padStart(4, '0')}H`
                          : watch.register
                        }
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFormat(watch.id)}
                      className="px-3 py-1 bg-blue-950/50 border border-blue-700/50 rounded font-mono text-sm text-blue-300 hover:bg-blue-900/50 transition-colors cursor-pointer"
                      title="Click to change format (hex → dec → bin)"
                    >
                      {formattedValue}
                    </button>

                    <button
                      onClick={() => removeWatch(watch.id)}
                      className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                      title="Remove watch"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-700">
        <div className="flex items-center gap-4 text-xs text-zinc-400">
          <span>{watches.length} watch{watches.length !== 1 ? 'es' : ''}</span>
          <span>•</span>
          <span className="text-yellow-400">Tip: Click value to cycle between hex/dec/bin formats</span>
        </div>
      </div>
    </div>
  );
};
