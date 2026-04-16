/**
 * Register Dashboard Component
 * Displays complete Z-80 CPU state with flash animations on value changes
 */

import React, { useEffect, useRef, useState } from 'react';
import type { RegisterState, PerformanceCounters } from '../domain';
import { useTheme } from './ThemeContext';

interface RegisterDashboardProps {
  registers: RegisterState;
  halted: boolean;
  error: string | null;
  performance: PerformanceCounters;
  lastInstruction: { source: string; output: string } | null;
}

type DisplayFormat = 'hex' | 'dec' | 'bin';

interface RegisterDisplayProps {
  name: string;
  value: number;
  bits: 8 | 16;
  highlight?: boolean;
  isDark: boolean;
  format: DisplayFormat;
  onToggleFormat: () => void;
}

const RegisterDisplay: React.FC<RegisterDisplayProps> = ({ name, value, bits, highlight = false, isDark, format, onToggleFormat }) => {
  const prevValueRef = useRef(value);
  const [flashing, setFlashing] = useState(false);

  useEffect(() => {
    if (prevValueRef.current !== value) {
      setFlashing(true);
      const timer = setTimeout(() => setFlashing(false), 600);
      prevValueRef.current = value;
      return () => clearTimeout(timer);
    }
  }, [value]);

  const formatValue = () => {
    switch (format) {
      case 'hex': return value.toString(16).toUpperCase().padStart(bits === 8 ? 2 : 4, '0');
      case 'dec': return value.toString(10);
      case 'bin': return value.toString(2).padStart(bits, '0');
    }
  };

  const baseBg = highlight
    ? isDark ? 'bg-blue-950/40 border-blue-700/50' : 'bg-blue-50 border-blue-200'
    : isDark ? 'bg-zinc-900/50 border-zinc-700/50' : 'bg-gray-50 border-gray-200';

  const flashClass = flashing
    ? isDark ? 'ring-2 ring-yellow-400/60 bg-yellow-950/30' : 'ring-2 ring-yellow-400/60 bg-yellow-50'
    : '';

  return (
    <div
      className={`flex items-center justify-between px-2 py-1 rounded border transition-all duration-300 cursor-pointer hover:opacity-80 ${baseBg} ${flashClass}`}
      onClick={onToggleFormat}
      title={`Click to toggle format (${format})`}
    >
      <span className={`text-xs font-semibold min-w-[28px] ${isDark ? 'text-zinc-400' : 'text-gray-500'}`} style={{ fontFamily: 'var(--font-sans)' }}>{name}</span>
      <span className={`text-xs font-bold ${isDark ? 'text-zinc-100' : 'text-gray-900'}`} style={{ fontFamily: 'var(--font-mono)' }}>
        {format === 'hex' && <span className={isDark ? 'text-zinc-600' : 'text-gray-400'}>0x</span>}
        {formatValue()}
      </span>
    </div>
  );
};

interface FlagBitDisplayProps {
  bit: number;
  name: string;
  value: boolean;
  isDark: boolean;
}

const FlagBitDisplay: React.FC<FlagBitDisplayProps> = ({ bit, name, value, isDark }) => {
  return (
    <div className="flex items-center gap-1.5 px-2 py-0.5">
      <span className={`text-xs min-w-[10px] ${isDark ? 'text-zinc-600' : 'text-gray-400'}`} style={{ fontFamily: 'var(--font-mono)' }}>{bit}</span>
      <span className={`text-xs font-medium min-w-[24px] ${isDark ? 'text-zinc-400' : 'text-gray-500'}`} style={{ fontFamily: 'var(--font-mono)' }}>{name}</span>
      <div className={`w-5 h-5 rounded flex items-center justify-center text-xs font-bold transition-all duration-300 ${
        value
          ? isDark ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50' : 'bg-emerald-100 text-emerald-700 border border-emerald-300'
          : isDark ? 'bg-zinc-800 text-zinc-700 border border-zinc-700' : 'bg-gray-100 text-gray-400 border border-gray-200'
      }`} style={{ fontFamily: 'var(--font-mono)' }}>
        {value ? '1' : '0'}
      </div>
    </div>
  );
};

export const RegisterDashboard: React.FC<RegisterDashboardProps> = ({
  registers,
  halted,
  error,
  performance,
  lastInstruction,
}) => {
  const { isDark } = useTheme();
  const [regFormat, setRegFormat] = useState<DisplayFormat>('hex');

  const toggleFormat = () => {
    setRegFormat(prev => prev === 'hex' ? 'dec' : prev === 'dec' ? 'bin' : 'hex');
  };

  const BC = (registers.registers8.B << 8) | registers.registers8.C;
  const DE = (registers.registers8.D << 8) | registers.registers8.E;
  const HL = (registers.registers8.H << 8) | registers.registers8.L;

  const bg = isDark ? 'bg-zinc-950' : 'bg-white';
  const headerBg = isDark ? 'bg-zinc-900' : 'bg-gray-50';
  const border = isDark ? 'border-zinc-700' : 'border-gray-200';
  const text = isDark ? 'text-zinc-100' : 'text-gray-900';
  const subtext = isDark ? 'text-zinc-400' : 'text-gray-500';
  const sectionLabel = isDark ? 'text-zinc-500' : 'text-gray-400';

  return (
    <div className={`flex flex-col h-full ${bg} transition-colors duration-300`}>
      <div className={`px-4 py-2.5 ${headerBg} border-b ${border} transition-colors duration-300`}>
        <div className="flex items-center justify-between">
          <h2 className={`font-semibold text-sm ${text}`} style={{ fontFamily: 'var(--font-sans)' }}>CPU State</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFormat}
              className={`px-2 py-0.5 text-xs rounded transition-colors ${isDark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {regFormat.toUpperCase()}
            </button>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${halted ? 'bg-red-400' : 'bg-green-400 animate-pulse'}`} />
              <span className={`text-xs ${subtext}`}>{halted ? 'Halted' : 'Active'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3">
          {/* Left Column - Main Registers */}
          <div className="space-y-1.5">
            <h3 className={`text-xs font-semibold ${sectionLabel} uppercase tracking-wider mb-2`} style={{ fontFamily: 'var(--font-sans)' }}>Main registers</h3>
            <RegisterDisplay name="A" value={registers.registers8.A} bits={8} highlight isDark={isDark} format={regFormat} onToggleFormat={toggleFormat} />
            <RegisterDisplay name="B" value={registers.registers8.B} bits={8} isDark={isDark} format={regFormat} onToggleFormat={toggleFormat} />
            <RegisterDisplay name="C" value={registers.registers8.C} bits={8} isDark={isDark} format={regFormat} onToggleFormat={toggleFormat} />
            <RegisterDisplay name="D" value={registers.registers8.D} bits={8} isDark={isDark} format={regFormat} onToggleFormat={toggleFormat} />
            <RegisterDisplay name="E" value={registers.registers8.E} bits={8} isDark={isDark} format={regFormat} onToggleFormat={toggleFormat} />
            <RegisterDisplay name="H" value={registers.registers8.H} bits={8} isDark={isDark} format={regFormat} onToggleFormat={toggleFormat} />
            <RegisterDisplay name="L" value={registers.registers8.L} bits={8} isDark={isDark} format={regFormat} onToggleFormat={toggleFormat} />

            <div className="pt-2">
              <h3 className={`text-xs font-semibold ${sectionLabel} uppercase tracking-wider mb-2`} style={{ fontFamily: 'var(--font-sans)' }}>Flags (F)</h3>
              <div className={`${isDark ? 'bg-zinc-900/50 border-zinc-700/50' : 'bg-gray-50 border-gray-200'} border rounded p-1 space-y-0`}>
                <FlagBitDisplay bit={7} name="SF" value={registers.flags.S} isDark={isDark} />
                <FlagBitDisplay bit={6} name="ZF" value={registers.flags.Z} isDark={isDark} />
                <FlagBitDisplay bit={5} name="YF" value={registers.flags.Y} isDark={isDark} />
                <FlagBitDisplay bit={4} name="HF" value={registers.flags.H} isDark={isDark} />
                <FlagBitDisplay bit={3} name="XF" value={registers.flags.X} isDark={isDark} />
                <FlagBitDisplay bit={2} name="PF" value={registers.flags.P} isDark={isDark} />
                <FlagBitDisplay bit={1} name="NF" value={registers.flags.N} isDark={isDark} />
                <FlagBitDisplay bit={0} name="CF" value={registers.flags.C} isDark={isDark} />
              </div>
            </div>
          </div>

          {/* Middle Column - Alternate Registers */}
          <div className="space-y-1.5">
            <h3 className={`text-xs font-semibold ${sectionLabel} uppercase tracking-wider mb-2`} style={{ fontFamily: 'var(--font-sans)' }}>Alternate registers</h3>
            <RegisterDisplay name="A'" value={registers.alternate.A} bits={8} isDark={isDark} format={regFormat} onToggleFormat={toggleFormat} />
            <RegisterDisplay name="B'" value={registers.alternate.B} bits={8} isDark={isDark} format={regFormat} onToggleFormat={toggleFormat} />
            <RegisterDisplay name="C'" value={registers.alternate.C} bits={8} isDark={isDark} format={regFormat} onToggleFormat={toggleFormat} />
            <RegisterDisplay name="D'" value={registers.alternate.D} bits={8} isDark={isDark} format={regFormat} onToggleFormat={toggleFormat} />
            <RegisterDisplay name="E'" value={registers.alternate.E} bits={8} isDark={isDark} format={regFormat} onToggleFormat={toggleFormat} />
            <RegisterDisplay name="H'" value={registers.alternate.H} bits={8} isDark={isDark} format={regFormat} onToggleFormat={toggleFormat} />
            <RegisterDisplay name="L'" value={registers.alternate.L} bits={8} isDark={isDark} format={regFormat} onToggleFormat={toggleFormat} />

            <div className="pt-2">
              <h3 className={`text-xs font-semibold ${sectionLabel} uppercase tracking-wider mb-2`} style={{ fontFamily: 'var(--font-sans)' }}>Alternate Flags (F')</h3>
              <div className={`${isDark ? 'bg-zinc-900/50 border-zinc-700/50' : 'bg-gray-50 border-gray-200'} border rounded p-1 space-y-0`}>
                <FlagBitDisplay bit={7} name="SF'" value={registers.alternate.flags.S} isDark={isDark} />
                <FlagBitDisplay bit={6} name="ZF'" value={registers.alternate.flags.Z} isDark={isDark} />
                <FlagBitDisplay bit={5} name="YF'" value={registers.alternate.flags.Y} isDark={isDark} />
                <FlagBitDisplay bit={4} name="HF'" value={registers.alternate.flags.H} isDark={isDark} />
                <FlagBitDisplay bit={3} name="XF'" value={registers.alternate.flags.X} isDark={isDark} />
                <FlagBitDisplay bit={2} name="PF'" value={registers.alternate.flags.P} isDark={isDark} />
                <FlagBitDisplay bit={1} name="NF'" value={registers.alternate.flags.N} isDark={isDark} />
                <FlagBitDisplay bit={0} name="CF'" value={registers.alternate.flags.C} isDark={isDark} />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-2">
            {/* Last Instruction */}
            <div>
              <h3 className={`text-xs font-semibold ${sectionLabel} uppercase tracking-wider mb-2`}>Last instruction</h3>
              <div className={`${isDark ? 'bg-emerald-950/20 border-emerald-800/50' : 'bg-emerald-50 border-emerald-200'} border rounded p-2 transition-colors duration-300`}>
                <div className={`text-xs font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-700'} mb-1`} style={{ fontFamily: 'var(--font-mono)' }}>
                  {lastInstruction?.source || 'None'}
                </div>
                <div className={`text-xs ${isDark ? 'text-zinc-400' : 'text-gray-500'}`} style={{ fontFamily: 'var(--font-mono)' }}>
                  {lastInstruction?.output || 'No output'}
                </div>
              </div>
            </div>

            {/* Performance */}
            <div>
              <h3 className={`text-xs font-semibold ${sectionLabel} uppercase tracking-wider mb-1`}>Performance</h3>
              <div className="space-y-1">
                <div className={`flex justify-between px-2 py-1 ${isDark ? 'bg-zinc-900/50 border-zinc-700/50' : 'bg-gray-50 border-gray-200'} border rounded text-xs`}>
                  <span className={subtext}>Cycles:</span>
                  <span className={`font-bold ${isDark ? 'text-zinc-200' : 'text-gray-800'}`} style={{ fontFamily: 'var(--font-mono)' }}>{performance.clockCycles}</span>
                </div>
                <div className={`flex justify-between px-2 py-1 ${isDark ? 'bg-zinc-900/50 border-zinc-700/50' : 'bg-gray-50 border-gray-200'} border rounded text-xs`}>
                  <span className={subtext}>Instructions:</span>
                  <span className={`font-bold ${isDark ? 'text-zinc-200' : 'text-gray-800'}`} style={{ fontFamily: 'var(--font-mono)' }}>{performance.instructionsExecuted}</span>
                </div>
              </div>
            </div>

            {/* 16-bit Registers */}
            <div>
              <h3 className={`text-xs font-semibold ${sectionLabel} uppercase tracking-wider mb-2`}>16-bit registers</h3>
              <div className="grid grid-cols-2 gap-1">
                <RegisterDisplay name="BC" value={BC} bits={16} isDark={isDark} format={regFormat} onToggleFormat={toggleFormat} />
                <RegisterDisplay name="SP" value={registers.registers16.SP} bits={16} isDark={isDark} format={regFormat} onToggleFormat={toggleFormat} />
                <RegisterDisplay name="DE" value={DE} bits={16} isDark={isDark} format={regFormat} onToggleFormat={toggleFormat} />
                <RegisterDisplay name="PC" value={registers.registers16.PC} bits={16} highlight isDark={isDark} format={regFormat} onToggleFormat={toggleFormat} />
                <RegisterDisplay name="HL" value={HL} bits={16} isDark={isDark} format={regFormat} onToggleFormat={toggleFormat} />
                <RegisterDisplay name="IX" value={registers.registers16.IX} bits={16} isDark={isDark} format={regFormat} onToggleFormat={toggleFormat} />
                <RegisterDisplay name="IY" value={registers.registers16.IY} bits={16} isDark={isDark} format={regFormat} onToggleFormat={toggleFormat} />
              </div>
            </div>

            {/* Special Registers */}
            <div>
              <h3 className={`text-xs font-semibold ${sectionLabel} uppercase tracking-wider mb-2`}>Special</h3>
              <div className="grid grid-cols-2 gap-1">
                <RegisterDisplay name="I" value={registers.special.I} bits={8} isDark={isDark} format={regFormat} onToggleFormat={toggleFormat} />
                <RegisterDisplay name="R" value={registers.special.R} bits={8} isDark={isDark} format={regFormat} onToggleFormat={toggleFormat} />
              </div>
            </div>

            {/* Interrupt Control */}
            <div>
              <h3 className={`text-xs font-semibold ${sectionLabel} uppercase tracking-wider mb-2`}>Interrupt</h3>
              <div className="grid grid-cols-3 gap-1">
                {(['IFF1', 'IFF2'] as const).map(name => (
                  <div key={name} className={`flex items-center justify-between px-2 py-1 ${isDark ? 'bg-zinc-900/50 border-zinc-700/50' : 'bg-gray-50 border-gray-200'} border rounded`}>
                    <span className={`text-xs ${subtext}`} style={{ fontFamily: 'var(--font-mono)' }}>{name}</span>
                    <span className={`text-xs font-bold ${registers.interrupt[name] ? 'text-emerald-400' : isDark ? 'text-zinc-600' : 'text-gray-400'}`} style={{ fontFamily: 'var(--font-mono)' }}>
                      {registers.interrupt[name] ? '1' : '0'}
                    </span>
                  </div>
                ))}
                <div className={`flex items-center justify-between px-2 py-1 ${isDark ? 'bg-zinc-900/50 border-zinc-700/50' : 'bg-gray-50 border-gray-200'} border rounded`}>
                  <span className={`text-xs ${subtext}`} style={{ fontFamily: 'var(--font-mono)' }}>IM</span>
                  <span className={`text-xs font-bold ${isDark ? 'text-zinc-200' : 'text-gray-800'}`} style={{ fontFamily: 'var(--font-mono)' }}>{registers.interrupt.IM}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className={`mt-2 px-2 py-1.5 rounded ${isDark ? 'bg-red-950/50 border-red-800/50' : 'bg-red-50 border-red-200'} border`}>
                <p className={`text-xs ${isDark ? 'text-red-300' : 'text-red-600'}`} style={{ fontFamily: 'var(--font-mono)' }}>{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
