/**
 * Z-80 CPU Simulator
 * Educational web-based simulator for Z-80 microprocessor
 */

import React, { useEffect, useState } from 'react';
import { useZ80Store } from '../z80/adapters/useZ80Store';
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

  return (
    <div className="h-screen w-screen bg-zinc-950 text-zinc-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 px-6 py-4 bg-zinc-900 border-b border-zinc-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold">Z-80 CPU Simulator</h1>
              <p className="text-sm text-zinc-400">Educational Microprocessor Emulator</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="px-3 py-1.5 bg-zinc-800 rounded-lg border border-zinc-700">
              <span className="text-zinc-400">PC:</span>
              <span className="ml-2 font-mono font-semibold text-blue-400">
                {cpu.registers.registers16.PC.toString(16).toUpperCase().padStart(4, '0')}H
              </span>
            </div>
            <div className="px-3 py-1.5 bg-zinc-800 rounded-lg border border-zinc-700">
              <span className="text-zinc-400">Instructions:</span>
              <span className="ml-2 font-semibold text-emerald-400">{cpu.performance.instructionsExecuted}</span>
            </div>
            <div className="px-3 py-1.5 bg-zinc-800 rounded-lg border border-zinc-700">
              <span className="text-zinc-400">Cycles:</span>
              <span className="ml-2 font-mono font-semibold text-purple-400">{cpu.performance.clockCycles}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Tabbed Interface */}
        <div className="flex-1 flex flex-col border-r border-zinc-800">
          {/* Tab Navigation */}
          <div className="flex items-center gap-1 px-2 py-2 bg-zinc-900 border-b border-zinc-700">
            <button
              onClick={() => setActiveTab('assembler')}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                activeTab === 'assembler'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              }`}
            >
              Assembler
            </button>
            <button
              onClick={() => setActiveTab('memory-editor')}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                activeTab === 'memory-editor'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              }`}
            >
              Memory Editor
            </button>
            <button
              onClick={() => setActiveTab('watch')}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                activeTab === 'watch'
                  ? 'bg-blue-600 text-white'
                  : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              }`}
            >
              Watch
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeTab === 'assembler' && (
              <>
                <div className="flex-1 border-b border-zinc-800">
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
          <div className="flex-1 border-b border-zinc-800 overflow-y-auto">
            <RegisterDashboard
              registers={cpu.registers}
              halted={cpu.halted}
              error={cpu.error}
              performance={cpu.performance}
              lastInstruction={cpu.lastInstruction}
            />
          </div>
          <div className="h-64 overflow-hidden">
            <MemoryViewer memory={cpu.memory} displayRows={16} />
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
        />
      </div>
    </div>
  );
}
