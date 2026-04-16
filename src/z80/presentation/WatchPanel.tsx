/**
 * Watch Panel
 * Monitor specific memory addresses and register values
 */

import React, { useState } from 'react';
import type { MemoryMap, RegisterState } from '../domain';
import { useTheme } from './ThemeContext';

interface WatchVariable {
  id: string;
  name: string;
  address?: number;
  register?: string;
  type: 'memory' | 'register';
  format: 'hex' | 'dec' | 'bin';
}

interface WatchPanelProps {
  memory: MemoryMap;
  registers: RegisterState;
}

export const WatchPanel: React.FC<WatchPanelProps> = ({ memory, registers }) => {
  const { isDark } = useTheme();
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
      if (reg === 'A') return registers.registers8.A;
      if (reg === 'B') return registers.registers8.B;
      if (reg === 'C') return registers.registers8.C;
      if (reg === 'D') return registers.registers8.D;
      if (reg === 'E') return registers.registers8.E;
      if (reg === 'H') return registers.registers8.H;
      if (reg === 'L') return registers.registers8.L;
      if (reg === 'PC') return registers.registers16.PC;
      if (reg === 'SP') return registers.registers16.SP;
      if (reg === 'IX') return registers.registers16.IX;
      if (reg === 'IY') return registers.registers16.IY;
      if (reg === 'I') return registers.special.I;
      if (reg === 'R') return registers.special.R;
      if (reg === 'BC') return (registers.registers8.B << 8) | registers.registers8.C;
      if (reg === 'DE') return (registers.registers8.D << 8) | registers.registers8.E;
      if (reg === 'HL') return (registers.registers8.H << 8) | registers.registers8.L;
    }
    return 0;
  };

  const formatValue = (value: number, format: 'hex' | 'dec' | 'bin', is16bit: boolean = false): string => {
    switch (format) {
      case 'hex': return '0x' + value.toString(16).toUpperCase().padStart(is16bit ? 4 : 2, '0');
      case 'dec': return value.toString(10);
      case 'bin': return '0b' + value.toString(2).padStart(is16bit ? 16 : 8, '0');
      default: return value.toString();
    }
  };

  const addWatch = () => {
    if (!newWatchName) return;
    const newWatch: WatchVariable = { id: Date.now().toString(), name: newWatchName, type: newWatchType, format: 'hex' };
    if (newWatchType === 'memory') {
      const addr = parseInt(newWatchAddress, 16);
      if (isNaN(addr) || addr < 0 || addr >= memory.size) return;
      newWatch.address = addr;
    } else {
      newWatch.register = newWatchRegister;
    }
    setWatches([...watches, newWatch]);
    setNewWatchName('');
    setNewWatchAddress('');
  };

  const removeWatch = (id: string) => setWatches(watches.filter(w => w.id !== id));

  const toggleFormat = (id: string) => {
    setWatches(watches.map(w => {
      if (w.id === id) {
        const formats: ('hex' | 'dec' | 'bin')[] = ['hex', 'dec', 'bin'];
        return { ...w, format: formats[(formats.indexOf(w.format) + 1) % formats.length] };
      }
      return w;
    }));
  };

  const is16BitRegister = (reg: string) => ['PC', 'SP', 'IX', 'IY', 'BC', 'DE', 'HL'].includes(reg);

  const bg = isDark ? 'bg-zinc-950' : 'bg-white';
  const headerBg = isDark ? 'bg-zinc-900' : 'bg-gray-50';
  const border = isDark ? 'border-zinc-700' : 'border-gray-200';
  const text = isDark ? 'text-zinc-100' : 'text-gray-900';
  const subtext = isDark ? 'text-zinc-400' : 'text-gray-500';
  const inputBg = isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-100' : 'bg-white border-gray-300 text-gray-900';

  return (
    <div className={`flex flex-col h-full ${bg} transition-colors duration-300`}>
      <div className={`px-4 py-2.5 ${headerBg} border-b ${border}`}>
        <h2 className={`font-semibold text-sm ${text}`} style={{ fontFamily: 'var(--font-sans)' }}>Watch Variables</h2>
        <p className={`text-xs ${subtext} mt-0.5`}>Monitor memory and registers in real-time</p>
      </div>

      {/* Add Watch Form */}
      <div className={`px-4 py-3 ${isDark ? 'bg-zinc-900/50' : 'bg-gray-50/50'} border-b ${border}`}>
        <div className="flex items-center gap-2">
          <select
            value={newWatchType}
            onChange={(e) => setNewWatchType(e.target.value as 'memory' | 'register')}
            className={`px-2 py-1 text-xs ${inputBg} border rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
              className={`px-2 py-1 text-xs ${inputBg} border rounded w-24 focus:outline-none focus:ring-2 focus:ring-blue-500`}
              style={{ fontFamily: 'var(--font-mono)' }}
            />
          ) : (
            <select
              value={newWatchRegister}
              onChange={(e) => setNewWatchRegister(e.target.value)}
              className={`px-2 py-1 text-xs ${inputBg} border rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              <optgroup label="8-bit">
                {['A','B','C','D','E','H','L'].map(r => <option key={r} value={r}>{r}</option>)}
              </optgroup>
              <optgroup label="16-bit">
                {['BC','DE','HL','PC','SP','IX','IY'].map(r => <option key={r} value={r}>{r}</option>)}
              </optgroup>
              <optgroup label="Special">
                {['I','R'].map(r => <option key={r} value={r}>{r}</option>)}
              </optgroup>
            </select>
          )}

          <input
            type="text"
            placeholder="Name"
            value={newWatchName}
            onChange={(e) => setNewWatchName(e.target.value)}
            className={`flex-1 px-2 py-1 text-xs ${inputBg} border rounded focus:outline-none focus:ring-2 focus:ring-blue-500`}
          />

          <button
            onClick={addWatch}
            className={`px-3 py-1 text-xs rounded transition-all duration-200 hover:scale-105 ${isDark ? 'bg-blue-600 hover:bg-blue-500 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
          >
            + Add
          </button>
        </div>
      </div>

      {/* Watch List */}
      <div className="flex-1 overflow-y-auto">
        {watches.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <svg className={`w-10 h-10 ${isDark ? 'text-zinc-700' : 'text-gray-300'} mb-2`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            <p className={`text-xs ${subtext}`}>No watch variables</p>
            <p className={`text-xs ${isDark ? 'text-zinc-600' : 'text-gray-400'} mt-0.5`}>Add addresses or registers to monitor</p>
          </div>
        ) : (
          <div className="p-3 space-y-1.5">
            {watches.map((watch) => {
              const value = getWatchValue(watch);
              const is16bit = watch.type === 'register' && watch.register ? is16BitRegister(watch.register) : false;
              const formattedValue = formatValue(value, watch.format, is16bit);

              return (
                <div
                  key={watch.id}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-all duration-200 ${isDark ? 'bg-zinc-900/50 border-zinc-700/50 hover:border-zinc-600' : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${isDark ? 'text-zinc-200' : 'text-gray-800'}`}>{watch.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-gray-200 text-gray-500'}`} style={{ fontFamily: 'var(--font-mono)' }}>
                        {watch.type === 'memory'
                          ? `@${watch.address?.toString(16).toUpperCase().padStart(4, '0')}H`
                          : watch.register}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFormat(watch.id)}
                      className={`px-3 py-1 rounded text-sm cursor-pointer transition-all duration-200 hover:scale-105 ${isDark ? 'bg-blue-950/50 border-blue-700/50 text-blue-300 hover:bg-blue-900/50' : 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100'} border`}
                      style={{ fontFamily: 'var(--font-mono)' }}
                      title="Click to cycle format"
                    >
                      {formattedValue}
                    </button>
                    <button
                      onClick={() => removeWatch(watch.id)}
                      className={`p-1 transition-colors ${isDark ? 'text-zinc-500 hover:text-red-400' : 'text-gray-400 hover:text-red-500'}`}
                      title="Remove"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      <div className={`px-4 py-1.5 ${headerBg} border-t ${border}`}>
        <div className={`flex items-center gap-3 text-xs ${subtext}`}>
          <span>{watches.length} watch{watches.length !== 1 ? 'es' : ''}</span>
          <span>•</span>
          <span className={isDark ? 'text-yellow-400' : 'text-yellow-600'}>Click value to toggle format</span>
        </div>
      </div>
    </div>
  );
};
