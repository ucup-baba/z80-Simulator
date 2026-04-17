/**
 * CPU Diagram Component (PC only)
 * Animated visualization of data flow between CPU registers
 */

import React from 'react';
import { useTheme } from './ThemeContext';

interface CPUDiagramProps {
  registers: any;
  lastInstruction?: { source: string; output: string } | string | null;
  halted: boolean;
  isRunning: boolean;
}

const RegBox: React.FC<{
  label: string;
  value: string;
  color: string;
  isDark: boolean;
  highlight?: boolean;
  small?: boolean;
}> = ({ label, value, color, isDark, highlight = false, small = false }) => (
  <div
    className={`flex flex-col items-center justify-center rounded-lg border transition-all duration-300 ${
      highlight
        ? `${color} shadow-lg scale-105`
        : isDark
          ? 'border-zinc-700 bg-zinc-800/50'
          : 'border-gray-200 bg-gray-50'
    } ${small ? 'px-2 py-1' : 'px-3 py-1.5'}`}
  >
    <span className={`text-xs font-medium ${isDark ? 'text-zinc-400' : 'text-gray-500'}`} style={{ fontFamily: 'var(--font-sans)' }}>{label}</span>
    <span className={`font-bold ${small ? 'text-xs' : 'text-sm'} ${isDark ? 'text-zinc-100' : 'text-gray-900'}`} style={{ fontFamily: 'var(--font-mono)' }}>{value}</span>
  </div>
);

export const CPUDiagram: React.FC<CPUDiagramProps> = ({ registers, lastInstruction, halted, isRunning }) => {
  const { isDark } = useTheme();

  const hex8 = (v: number) => v.toString(16).toUpperCase().padStart(2, '0');
  const hex16 = (v: number) => v.toString(16).toUpperCase().padStart(4, '0');

  const bg = isDark ? 'bg-zinc-950' : 'bg-white';
  const headerBg = isDark ? 'bg-zinc-900' : 'bg-gray-50';
  const border = isDark ? 'border-zinc-700' : 'border-gray-200';
  const text = isDark ? 'text-zinc-100' : 'text-gray-900';
  const subtext = isDark ? 'text-zinc-400' : 'text-gray-500';
  const lineBg = isDark ? 'bg-zinc-700' : 'bg-gray-300';
  const lineActive = 'bg-blue-400';

  // Determine which registers are "active" based on last instruction
  const instStr = typeof lastInstruction === 'string' ? lastInstruction : (lastInstruction?.source || '');
  const inst = instStr.toUpperCase();
  const isActive = (reg: string) => inst.includes(reg);

  const blueHL = 'border-blue-400/50 bg-blue-500/10';
  const greenHL = 'border-emerald-400/50 bg-emerald-500/10';
  const purpleHL = 'border-purple-400/50 bg-purple-500/10';

  return (
    <div className={`flex flex-col h-full ${bg} transition-colors duration-300`}>
      <div className={`flex items-center justify-between px-4 py-2.5 ${headerBg} border-b ${border}`}>
        <h2 className={`font-semibold text-sm ${text}`} style={{ fontFamily: 'var(--font-sans)' }}>CPU Data Flow</h2>
        <div className={`text-xs ${subtext}`}>
          {halted ? '🔴 Halted' : isRunning ? '🔵 Running' : '🟢 Ready'}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* ALU Section */}
        <div className="flex flex-col items-center mb-4">
          <div className={`px-4 py-2 rounded-xl border-2 ${isActive('A') ? 'border-amber-400 bg-amber-500/10' : isDark ? 'border-zinc-600 bg-zinc-800' : 'border-gray-300 bg-gray-100'} transition-all duration-300`}>
            <span className={`text-xs ${subtext}`}>ALU / Accumulator</span>
            <div className={`text-center text-xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`} style={{ fontFamily: 'var(--font-mono)' }}>
              A = {hex8(registers.registers8.A)}
            </div>
            <div className={`text-center text-xs ${subtext}`}>
              Flags: {hex8(registers.registers8.F)}
            </div>
          </div>
          {/* Data bus line */}
          <div className={`w-0.5 h-4 ${isActive('A') ? lineActive : lineBg} transition-colors`} />
        </div>

        {/* Register pairs */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="space-y-1">
            <RegBox label="B" value={hex8(registers.registers8.B)} color={blueHL} isDark={isDark} highlight={isActive('B')} />
            <RegBox label="C" value={hex8(registers.registers8.C)} color={blueHL} isDark={isDark} highlight={isActive('C')} />
            <div className={`text-center text-xs py-1 rounded ${isDark ? 'bg-zinc-800 text-blue-400' : 'bg-gray-100 text-blue-600'}`} style={{ fontFamily: 'var(--font-mono)' }}>
              BC={hex16((registers.registers8.B << 8) | registers.registers8.C)}
            </div>
          </div>
          <div className="space-y-1">
            <RegBox label="D" value={hex8(registers.registers8.D)} color={greenHL} isDark={isDark} highlight={isActive('D')} />
            <RegBox label="E" value={hex8(registers.registers8.E)} color={greenHL} isDark={isDark} highlight={isActive('E')} />
            <div className={`text-center text-xs py-1 rounded ${isDark ? 'bg-zinc-800 text-emerald-400' : 'bg-gray-100 text-emerald-600'}`} style={{ fontFamily: 'var(--font-mono)' }}>
              DE={hex16((registers.registers8.D << 8) | registers.registers8.E)}
            </div>
          </div>
          <div className="space-y-1">
            <RegBox label="H" value={hex8(registers.registers8.H)} color={purpleHL} isDark={isDark} highlight={isActive('H')} />
            <RegBox label="L" value={hex8(registers.registers8.L)} color={purpleHL} isDark={isDark} highlight={isActive('L')} />
            <div className={`text-center text-xs py-1 rounded ${isDark ? 'bg-zinc-800 text-purple-400' : 'bg-gray-100 text-purple-600'}`} style={{ fontFamily: 'var(--font-mono)' }}>
              HL={hex16((registers.registers8.H << 8) | registers.registers8.L)}
            </div>
          </div>
        </div>

        {/* Control registers */}
        <div className={`w-full h-px my-3 ${lineBg}`} />
        <div className="grid grid-cols-2 gap-2">
          <RegBox label="PC" value={hex16(registers.registers16.PC)} color={blueHL} isDark={isDark} highlight={true} />
          <RegBox label="SP" value={hex16(registers.registers16.SP)} color={purpleHL} isDark={isDark} highlight={isActive('SP')} />
          <RegBox label="IX" value={hex16(registers.registers16.IX)} color={greenHL} isDark={isDark} highlight={isActive('IX')} small />
          <RegBox label="IY" value={hex16(registers.registers16.IY)} color={greenHL} isDark={isDark} highlight={isActive('IY')} small />
        </div>

        {/* Last instruction */}
        {lastInstruction && (
          <div className={`mt-4 px-3 py-2 rounded-lg text-center ${isDark ? 'bg-zinc-800 border border-zinc-700' : 'bg-gray-50 border border-gray-200'}`}>
            <span className={`text-xs ${subtext}`}>Last Instruction</span>
            <div className={`text-sm font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`} style={{ fontFamily: 'var(--font-mono)' }}>
              {instStr}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
