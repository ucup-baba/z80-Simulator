/**
 * Z-80 CPU Simulator
 * Educational web-based simulator for Z-80 microprocessor
 */

import React, { useEffect, useState } from 'react';
import { useZ80Store } from '../z80/adapters/useZ80Store';
import { useTheme } from '../z80/presentation/ThemeContext';
import { CodeEditor } from '../z80/presentation/CodeEditor';
import { RegisterDashboard } from '../z80/presentation/RegisterDashboard';
import { ControlPanel } from '../z80/presentation/ControlPanel';
import { ExecutionLog } from '../z80/presentation/ExecutionLog';
import { MemoryViewer } from '../z80/presentation/MemoryViewer';
import { MemoryEditorPanel } from '../z80/presentation/MemoryEditorPanel';
import { WatchPanel } from '../z80/presentation/WatchPanel';

type TabType = 'assembler' | 'memory-editor' | 'watch';

export default function App() {
  const {
    cpu,
    program,
    sourceCode,
    executionLog,
    isRunning,
    parseError,
    setSourceCode,
    loadCode,
    stepInstruction,
    runProgram,
    resetCPU,
    clearLog,
    writeMemory,
  } = useZ80Store();

  const { theme, toggleTheme, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TabType>('assembler');

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'l':
            e.preventDefault();
            loadCode();
            break;
          case 's':
            e.preventDefault();
            if (program && !cpu.halted && !isRunning) {
              stepInstruction();
            }
            break;
          case 'r':
            e.preventDefault();
            if (program && !cpu.halted && !isRunning) {
              runProgram();
            }
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [program, cpu.halted, isRunning, loadCode, stepInstruction, runProgram]);

  // Theme-aware class helpers
  const bg = isDark ? 'bg-zinc-950' : 'bg-gray-50';
  const text = isDark ? 'text-zinc-100' : 'text-gray-900';
  const headerBg = isDark
    ? 'bg-zinc-900/80 backdrop-blur-xl border-zinc-700/50'
    : 'bg-white/80 backdrop-blur-xl border-gray-200/50';
  const panelBg = isDark ? 'bg-zinc-900' : 'bg-white';
  const border = isDark ? 'border-zinc-700/50' : 'border-gray-200';
  const subtext = isDark ? 'text-zinc-400' : 'text-gray-500';
  const tabBg = isDark ? 'bg-zinc-900' : 'bg-gray-100';
  const tabActive = isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white';
  const tabInactive = isDark
    ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
    : 'bg-white text-gray-500 hover:bg-gray-200 hover:text-gray-700';
  const badgeBg = isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-100 border-gray-200';
  const panelBorder = isDark ? 'border-zinc-800' : 'border-gray-200';

  return (
    <div className={`h-screen w-screen ${bg} ${text} flex flex-col overflow-hidden transition-colors duration-300`}>
      {/* Header with Glassmorphism */}
      <header className={`flex-shrink-0 px-6 py-3 ${headerBg} border-b shadow-lg transition-colors duration-300`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight" style={{ fontFamily: 'var(--font-sans)' }}>Z-80 CPU Simulator</h1>
              <p className={`text-xs ${subtext}`}>Educational Microprocessor Emulator</p>
            </div>
            {/* CPU Status Indicator */}
            <div className="ml-4 flex items-center gap-2">
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${
                isRunning
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : cpu.halted
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : program
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : isDark
                        ? 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                        : 'bg-gray-100 text-gray-500 border border-gray-200'
              }`}>
                <div className={`w-2 h-2 rounded-full ${
                  isRunning
                    ? 'bg-blue-400 animate-pulse'
                    : cpu.halted
                      ? 'bg-red-400'
                      : program
                        ? 'bg-emerald-400'
                        : isDark ? 'bg-zinc-500' : 'bg-gray-400'
                }`} />
                {isRunning ? 'Running' : cpu.halted ? 'Halted' : program ? 'Ready' : 'Idle'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <div className={`px-3 py-1.5 ${badgeBg} rounded-lg border`}>
              <span className={subtext}>PC:</span>
              <span className="ml-2 font-mono font-semibold text-blue-400" style={{ fontFamily: 'var(--font-mono)' }}>
                {cpu.registers.registers16.PC.toString(16).toUpperCase().padStart(4, '0')}H
              </span>
            </div>
            <div className={`px-3 py-1.5 ${badgeBg} rounded-lg border`}>
              <span className={subtext}>Inst:</span>
              <span className="ml-2 font-semibold text-emerald-400">{cpu.performance.instructionsExecuted}</span>
            </div>
            <div className={`px-3 py-1.5 ${badgeBg} rounded-lg border`}>
              <span className={subtext}>Cycles:</span>
              <span className="ml-2 font-mono font-semibold text-purple-400" style={{ fontFamily: 'var(--font-mono)' }}>{cpu.performance.clockCycles}</span>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`ml-2 p-2 rounded-lg transition-all duration-300 hover:scale-110 ${
                isDark
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-yellow-400 border border-zinc-700'
                  : 'bg-gray-100 hover:bg-gray-200 text-indigo-500 border border-gray-200'
              }`}
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            >
              {isDark ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Tabbed Interface */}
        <div className={`flex-1 flex flex-col border-r ${panelBorder}`}>
          {/* Tab Navigation */}
          <div className={`flex items-center gap-1 px-2 py-2 ${tabBg} border-b ${border} transition-colors duration-300`}>
            {(['assembler', 'memory-editor', 'watch'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  activeTab === tab ? tabActive : tabInactive
                }`}
              >
                {tab === 'assembler' ? '⌨ Assembler' : tab === 'memory-editor' ? '📝 Memory Editor' : '👁 Watch'}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeTab === 'assembler' && (
              <>
                <div className={`flex-1 border-b ${panelBorder}`}>
                  <CodeEditor
                    value={sourceCode}
                    onChange={setSourceCode}
                    parseError={parseError}
                  />
                </div>
                <div className="h-64">
                  <ExecutionLog entries={executionLog} onClear={clearLog} />
                </div>
              </>
            )}

            {activeTab === 'memory-editor' && (
              <div className="flex-1">
                <MemoryEditorPanel
                  memory={cpu.memory}
                  onMemoryWrite={writeMemory}
                />
              </div>
            )}

            {activeTab === 'watch' && (
              <div className="flex-1">
                <WatchPanel
                  memory={cpu.memory}
                  registers={cpu.registers}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - CPU Dashboard and Memory */}
        <div className="flex-1 flex flex-col">
          <div className={`flex-1 border-b ${panelBorder} overflow-y-auto`}>
            <RegisterDashboard
              registers={cpu.registers}
              halted={cpu.halted}
              error={cpu.error}
              performance={cpu.performance}
              lastInstruction={cpu.lastInstruction}
            />
          </div>
          <div className="h-64 overflow-hidden">
            <MemoryViewer
              memory={cpu.memory}
              pc={cpu.registers.registers16.PC}
              sp={cpu.registers.registers16.SP}
              displayRows={16}
            />
          </div>
        </div>
      </div>

      {/* Control Panel Footer */}
      <div className="flex-shrink-0">
        <ControlPanel
          onLoad={loadCode}
          onStep={stepInstruction}
          onRun={runProgram}
          onReset={resetCPU}
          isRunning={isRunning}
          hasProgram={program !== null}
          halted={cpu.halted}
        />
      </div>
    </div>
  );
}
