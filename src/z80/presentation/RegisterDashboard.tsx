/**
 * Register Dashboard Component
 * Displays complete Z-80 CPU state with all registers and flags
 */

import React from 'react';
import type { RegisterState, PerformanceCounters } from '../domain';

interface RegisterDashboardProps {
  registers: RegisterState;
  halted: boolean;
  error: string | null;
  performance: PerformanceCounters;
  lastInstruction: { source: string; output: string } | null;
}

interface RegisterDisplayProps {
  name: string;
  value: number;
  bits: 8 | 16;
  highlight?: boolean;
}

const RegisterDisplay: React.FC<RegisterDisplayProps> = ({ name, value, bits, highlight = false }) => {
  const hexValue = value.toString(16).toUpperCase().padStart(bits === 8 ? 2 : 4, '0');

  return (
    <div
      className={`flex items-center justify-between px-2 py-1 rounded border transition-all ${
        highlight
          ? 'bg-blue-950/30 border-blue-700/50'
          : 'bg-zinc-900/50 border-zinc-700/50'
      }`}
    >
      <span className="text-xs font-medium text-zinc-400 min-w-[24px]">{name}</span>
      <span className="text-sm font-mono font-semibold text-zinc-100">{hexValue}</span>
    </div>
  );
};

interface FlagBitDisplayProps {
  bit: number;
  name: string;
  value: boolean;
}

const FlagBitDisplay: React.FC<FlagBitDisplayProps> = ({ bit, name, value }) => {
  return (
    <div className="flex items-center gap-2 px-2 py-1">
      <span className="text-xs text-zinc-500 min-w-[8px]">{bit}</span>
      <span className="text-xs font-medium text-zinc-400 min-w-[20px]">{name}</span>
      <span className={`text-sm font-mono font-semibold min-w-[12px] ${value ? 'text-emerald-300' : 'text-zinc-600'}`}>
        {value ? '1' : '0'}
      </span>
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
  // Calculate 16-bit register pairs
  const BC = (registers.registers8.B << 8) | registers.registers8.C;
  const DE = (registers.registers8.D << 8) | registers.registers8.E;
  const HL = (registers.registers8.H << 8) | registers.registers8.L;
  const BC_alt = (registers.alternate.B << 8) | registers.alternate.C;
  const DE_alt = (registers.alternate.D << 8) | registers.alternate.E;
  const HL_alt = (registers.alternate.H << 8) | registers.alternate.L;

  return (
    <div className="flex flex-col h-full bg-zinc-950">
      <div className="px-4 py-3 bg-zinc-900 border-b border-zinc-700">
        <h2 className="font-semibold text-zinc-100">CPU State</h2>
        <div className="flex items-center gap-2 mt-1">
          <div className={`w-2 h-2 rounded-full ${halted ? 'bg-red-400' : 'bg-green-400'}`} />
          <span className="text-xs text-zinc-400">
            {halted ? 'Halted' : 'Running'}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-3 gap-3 p-3">
          {/* Left Column - Main Registers */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Main registers</h3>
            <RegisterDisplay name="A" value={registers.registers8.A} bits={8} highlight />
            <RegisterDisplay name="B" value={registers.registers8.B} bits={8} />
            <RegisterDisplay name="C" value={registers.registers8.C} bits={8} />
            <RegisterDisplay name="D" value={registers.registers8.D} bits={8} />
            <RegisterDisplay name="E" value={registers.registers8.E} bits={8} />
            <RegisterDisplay name="H" value={registers.registers8.H} bits={8} />
            <RegisterDisplay name="L" value={registers.registers8.L} bits={8} />

            <div className="pt-2">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Main F register</h3>
              <div className="bg-zinc-900/50 border border-zinc-700/50 rounded p-1 space-y-0.5">
                <FlagBitDisplay bit={7} name="SF" value={registers.flags.S} />
                <FlagBitDisplay bit={6} name="ZF" value={registers.flags.Z} />
                <FlagBitDisplay bit={5} name="YF" value={registers.flags.Y} />
                <FlagBitDisplay bit={4} name="HF" value={registers.flags.H} />
                <FlagBitDisplay bit={3} name="XF" value={registers.flags.X} />
                <FlagBitDisplay bit={2} name="PF" value={registers.flags.P} />
                <FlagBitDisplay bit={1} name="NF" value={registers.flags.N} />
                <FlagBitDisplay bit={0} name="CF" value={registers.flags.C} />
              </div>
            </div>
          </div>

          {/* Middle Column - Alternate Registers */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Alternate registers</h3>
            <RegisterDisplay name="A'" value={registers.alternate.A} bits={8} />
            <RegisterDisplay name="B'" value={registers.alternate.B} bits={8} />
            <RegisterDisplay name="C'" value={registers.alternate.C} bits={8} />
            <RegisterDisplay name="D'" value={registers.alternate.D} bits={8} />
            <RegisterDisplay name="E'" value={registers.alternate.E} bits={8} />
            <RegisterDisplay name="H'" value={registers.alternate.H} bits={8} />
            <RegisterDisplay name="L'" value={registers.alternate.L} bits={8} />

            <div className="pt-2">
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Alternate F reg.</h3>
              <div className="bg-zinc-900/50 border border-zinc-700/50 rounded p-1 space-y-0.5">
                <FlagBitDisplay bit={7} name="SF'" value={registers.alternate.flags.S} />
                <FlagBitDisplay bit={6} name="ZF'" value={registers.alternate.flags.Z} />
                <FlagBitDisplay bit={5} name="YF'" value={registers.alternate.flags.Y} />
                <FlagBitDisplay bit={4} name="HF'" value={registers.alternate.flags.H} />
                <FlagBitDisplay bit={3} name="XF'" value={registers.alternate.flags.X} />
                <FlagBitDisplay bit={2} name="PF'" value={registers.alternate.flags.P} />
                <FlagBitDisplay bit={1} name="NF'" value={registers.alternate.flags.N} />
                <FlagBitDisplay bit={0} name="CF'" value={registers.alternate.flags.C} />
              </div>
            </div>
          </div>

          {/* Right Column - Last Instruction, Counters, 16-bit, Special */}
          <div className="space-y-2">
            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Last instruction</h3>
              <div className="bg-emerald-950/20 border border-emerald-800/50 rounded p-2">
                <div className="text-xs font-mono text-emerald-300 mb-1">
                  {lastInstruction?.source || 'None'}
                </div>
                <div className="text-xs text-zinc-400">
                  {lastInstruction?.output || 'No output'}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-1">Performance</h3>
              <div className="space-y-1">
                <div className="flex justify-between px-2 py-1 bg-zinc-900/50 border border-zinc-700/50 rounded text-xs">
                  <span className="text-zinc-400">Clock cycles:</span>
                  <span className="font-mono text-zinc-200">{performance.clockCycles}</span>
                </div>
                <div className="flex justify-between px-2 py-1 bg-zinc-900/50 border border-zinc-700/50 rounded text-xs">
                  <span className="text-zinc-400">Instructions:</span>
                  <span className="font-mono text-zinc-200">{performance.instructionsExecuted}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">16-bit registers</h3>
              <div className="grid grid-cols-2 gap-1">
                <RegisterDisplay name="BC" value={BC} bits={16} />
                <RegisterDisplay name="SP" value={registers.registers16.SP} bits={16} />
                <RegisterDisplay name="DE" value={DE} bits={16} />
                <RegisterDisplay name="PC" value={registers.registers16.PC} bits={16} highlight />
                <RegisterDisplay name="HL" value={HL} bits={16} />
                <RegisterDisplay name="IX" value={registers.registers16.IX} bits={16} />
                <RegisterDisplay name="IY" value={registers.registers16.IY} bits={16} />
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Special registers</h3>
              <div className="grid grid-cols-2 gap-1">
                <RegisterDisplay name="I" value={registers.special.I} bits={8} />
                <RegisterDisplay name="R" value={registers.special.R} bits={8} />
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-zinc-400 uppercase tracking-wide mb-2">Interrupt control</h3>
              <div className="grid grid-cols-3 gap-1">
                <div className="flex items-center justify-between px-2 py-1 bg-zinc-900/50 border border-zinc-700/50 rounded">
                  <span className="text-xs text-zinc-400">IFF1</span>
                  <span className={`text-sm font-mono ${registers.interrupt.IFF1 ? 'text-emerald-300' : 'text-zinc-600'}`}>
                    {registers.interrupt.IFF1 ? '1' : '0'}
                  </span>
                </div>
                <div className="flex items-center justify-between px-2 py-1 bg-zinc-900/50 border border-zinc-700/50 rounded">
                  <span className="text-xs text-zinc-400">IFF2</span>
                  <span className={`text-sm font-mono ${registers.interrupt.IFF2 ? 'text-emerald-300' : 'text-zinc-600'}`}>
                    {registers.interrupt.IFF2 ? '1' : '0'}
                  </span>
                </div>
                <div className="flex items-center justify-between px-2 py-1 bg-zinc-900/50 border border-zinc-700/50 rounded">
                  <span className="text-xs text-zinc-400">IM</span>
                  <span className="text-sm font-mono text-zinc-200">{registers.interrupt.IM}</span>
                </div>
              </div>
            </div>

            {error && (
              <div className="mt-2 px-2 py-1.5 rounded bg-red-950/50 border border-red-800/50">
                <p className="text-xs text-red-300">{error}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
