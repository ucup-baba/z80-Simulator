/**
 * Z-80 CPU Simulator — Main App
 * Integrates all features with feature toggle support
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useZ80Store } from '../z80/adapters/useZ80Store';
import { useTheme } from '../z80/presentation/ThemeContext';
import { useFeatureFlags } from '../z80/presentation/FeatureToggleContext';
import { useToast } from '../z80/presentation/ToastContext';
import { CodeEditor } from '../z80/presentation/CodeEditor';
import { RegisterDashboard } from '../z80/presentation/RegisterDashboard';
import { ControlPanel } from '../z80/presentation/ControlPanel';
import { ExecutionLog } from '../z80/presentation/ExecutionLog';
import { MemoryViewer } from '../z80/presentation/MemoryViewer';
import { MemoryEditorPanel } from '../z80/presentation/MemoryEditorPanel';
import { WatchPanel } from '../z80/presentation/WatchPanel';
import { StackViewer } from '../z80/presentation/StackViewer';
import { KeyboardShortcutsModal } from '../z80/presentation/KeyboardShortcutsModal';
import { ToolsPanel } from '../z80/presentation/ToolsPanel';
import { CPUDiagram } from '../z80/presentation/CPUDiagram';
import { ResizablePanel } from '../z80/presentation/ResizablePanel';
import { AutocompleteDropdown, useAutocomplete } from '../z80/presentation/Autocomplete';
import { AIFeedbackPanel } from '../z80/presentation/AIFeedbackPanel';

type TabType = 'assembler' | 'memory-editor' | 'watch' | 'stack' | 'cpu-diagram';
type MobilePanel = 'code' | 'cpu' | 'memory' | 'log';

// Simple undo/redo hook
function useUndoRedo(initialValue: string, enabled: boolean) {
  const [history, setHistory] = useState<string[]>([initialValue]);
  const [index, setIndex] = useState(0);
  const lastPushTime = useRef(0);

  const currentValue = history[index];

  const setValue = useCallback((val: string) => {
    if (!enabled) {
      setHistory([val]);
      setIndex(0);
      return;
    }
    // Debounce: only push to history every 500ms
    const now = Date.now();
    if (now - lastPushTime.current > 500) {
      setHistory(prev => {
        const newHist = prev.slice(0, index + 1);
        newHist.push(val);
        if (newHist.length > 100) newHist.shift(); // limit
        return newHist;
      });
      setIndex(prev => Math.min(prev + 1, 100));
      lastPushTime.current = now;
    } else {
      // Update current entry in-place
      setHistory(prev => {
        const newHist = [...prev];
        newHist[index] = val;
        return newHist;
      });
    }
  }, [enabled, index]);

  const undo = useCallback(() => {
    if (index > 0) setIndex(prev => prev - 1);
  }, [index]);

  const redo = useCallback(() => {
    if (index < history.length - 1) setIndex(prev => prev + 1);
  }, [index, history.length]);

  const canUndo = index > 0;
  const canRedo = index < history.length - 1;

  return { currentValue, setValue, undo, redo, canUndo, canRedo };
}

// Multi-file tabs
interface FileTab {
  id: string;
  name: string;
  content: string;
}

export default function App() {
  const store = useZ80Store();
  const { cpu, program, executionLog, isRunning, parseError,
    loadCode, stepInstruction, runProgram, resetCPU, clearLog, writeMemory,
    analyzeCode, analysisResult } = store;

  const { isDark, toggleTheme } = useTheme();
  const { isEnabled } = useFeatureFlags();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState<TabType>('assembler');
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('code');
  const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set());
  const [speed, setSpeed] = useState(50);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showAIFeedback, setShowAIFeedback] = useState(false);

  // Multi-file tabs
  const [fileTabs, setFileTabs] = useState<FileTab[]>([
    { id: 'main', name: 'program.asm', content: store.sourceCode },
  ]);
  const [activeFileId, setActiveFileId] = useState('main');

  // Undo/Redo
  const undoRedo = useUndoRedo(store.sourceCode, isEnabled('undoRedo'));

  // Sync undo/redo value → store
  const handleCodeChange = useCallback((code: string) => {
    undoRedo.setValue(code);
    store.setSourceCode(code);
    // Update active file tab
    setFileTabs(prev => prev.map(f => f.id === activeFileId ? { ...f, content: code } : f));
  }, [store, undoRedo, activeFileId]);

  // Autocomplete ref
  const editorTextareaRef = useRef<HTMLTextAreaElement>(null);
  const autocomplete = useAutocomplete({
    isEnabled: isEnabled('autocomplete'),
    textareaRef: editorTextareaRef,
    onInsert: (text) => {
      const ta = editorTextareaRef.current;
      if (!ta) return;
      const pos = ta.selectionStart;
      const before = ta.value.substring(0, pos);
      const after = ta.value.substring(pos);
      const newVal = before + text + after;
      handleCodeChange(newVal);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = pos + text.length;
        ta.focus();
      });
    },
  });

  const toggleBreakpoint = useCallback((line: number) => {
    setBreakpoints(prev => {
      const next = new Set(prev);
      if (next.has(line)) { next.delete(line); addToast(`Breakpoint removed: line ${line}`, 'info', 2000); }
      else { next.add(line); addToast(`Breakpoint set: line ${line}`, 'success', 2000); }
      return next;
    });
  }, [addToast]);

  // Multi-file: add new tab
  const addFileTab = useCallback(() => {
    const id = Date.now().toString(36);
    const num = fileTabs.length + 1;
    const newTab: FileTab = { id, name: `file${num}.asm`, content: '' };
    setFileTabs(prev => [...prev, newTab]);
    setActiveFileId(id);
    store.setSourceCode('');
    undoRedo.setValue('');
    addToast(`New file: ${newTab.name}`, 'info', 2000);
  }, [fileTabs, store, undoRedo, addToast]);

  // Multi-file: switch tab
  const switchFileTab = useCallback((id: string) => {
    const tab = fileTabs.find(f => f.id === id);
    if (tab) {
      setActiveFileId(id);
      store.setSourceCode(tab.content);
      undoRedo.setValue(tab.content);
    }
  }, [fileTabs, store, undoRedo]);

  // Multi-file: close tab
  const closeFileTab = useCallback((id: string) => {
    if (fileTabs.length <= 1) return;
    const remaining = fileTabs.filter(f => f.id !== id);
    setFileTabs(remaining);
    if (activeFileId === id) {
      const newActive = remaining[0];
      setActiveFileId(newActive.id);
      store.setSourceCode(newActive.content);
    }
    addToast('File tab closed', 'info', 2000);
  }, [fileTabs, activeFileId, store, addToast]);

  // Toast-enhanced actions
  const handleLoad = useCallback(() => {
    loadCode();
    if (isEnabled('toastNotifications')) addToast('Program assembled & loaded', 'success');
  }, [loadCode, addToast, isEnabled]);

  const handleReset = useCallback(() => {
    resetCPU();
    if (isEnabled('toastNotifications')) addToast('CPU reset to initial state', 'info');
  }, [resetCPU, addToast, isEnabled]);

  const handleImport = useCallback((code: string) => {
    handleCodeChange(code);
    if (isEnabled('toastNotifications')) addToast('File imported successfully', 'success');
  }, [handleCodeChange, addToast, isEnabled]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '?' && !(e.target instanceof HTMLTextAreaElement) && !(e.target instanceof HTMLInputElement)) {
        e.preventDefault(); setShowShortcuts(prev => !prev); return;
      }
      if (e.key === 'Escape') { setShowShortcuts(false); setShowTools(false); return; }

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'l': e.preventDefault(); handleLoad(); break;
          case 's': e.preventDefault(); if (program && !cpu.halted && !isRunning) stepInstruction(); break;
          case 'r': e.preventDefault(); if (program && !cpu.halted && !isRunning) runProgram(); break;
          case 'z':
            if (isEnabled('undoRedo')) {
              e.preventDefault();
              if (e.shiftKey) undoRedo.redo(); else undoRedo.undo();
              store.setSourceCode(undoRedo.currentValue);
            }
            break;
          case 'y':
            if (isEnabled('undoRedo')) { e.preventDefault(); undoRedo.redo(); store.setSourceCode(undoRedo.currentValue); }
            break;
        }
      }

      // Autocomplete keyboard
      autocomplete.handleKeyDown(e);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [program, cpu.halted, isRunning, handleLoad, stepInstruction, runProgram, undoRedo, autocomplete, isEnabled, store]);

  // Theme classes
  const bg = isDark ? 'bg-zinc-950' : 'bg-gray-50';
  const text = isDark ? 'text-zinc-100' : 'text-gray-900';
  const headerBg = isDark ? 'bg-zinc-900/80 backdrop-blur-xl border-zinc-700/50' : 'bg-white/80 backdrop-blur-xl border-gray-200/50';
  const border = isDark ? 'border-zinc-700/50' : 'border-gray-200';
  const subtext = isDark ? 'text-zinc-400' : 'text-gray-500';
  const tabBg = isDark ? 'bg-zinc-900' : 'bg-gray-100';
  const tabActive = isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white';
  const tabInactive = isDark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200' : 'bg-white text-gray-500 hover:bg-gray-200 hover:text-gray-700';
  const badgeBg = isDark ? 'bg-zinc-800 border-zinc-700' : 'bg-gray-100 border-gray-200';
  const panelBorder = isDark ? 'border-zinc-800' : 'border-gray-200';
  const mobileNavBg = isDark ? 'bg-zinc-900/95 backdrop-blur-xl' : 'bg-white/95 backdrop-blur-xl';
  const mobileNavActive = isDark ? 'text-blue-400' : 'text-blue-600';
  const mobileNavInactive = isDark ? 'text-zinc-500' : 'text-gray-400';
  const fileTabBg = isDark ? 'bg-zinc-900' : 'bg-gray-100';
  const fileTabActive = isDark ? 'bg-zinc-800 text-zinc-100 border-b-2 border-b-blue-500' : 'bg-white text-gray-900 border-b-2 border-b-blue-500';
  const fileTabInactive = isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-gray-400 hover:text-gray-600';

  const mobileNavItems: { id: MobilePanel; icon: string; label: string }[] = [
    { id: 'code', icon: '⌨', label: 'Code' },
    { id: 'cpu', icon: '🔲', label: 'CPU' },
    { id: 'memory', icon: '📝', label: 'Memory' },
    { id: 'log', icon: '📋', label: 'Log' },
  ];

  const desktopTabs: { id: TabType; label: string; shortLabel: string; pcOnly?: boolean }[] = [
    { id: 'assembler', label: '⌨ Assembler', shortLabel: '⌨ ASM' },
    { id: 'memory-editor', label: '📝 Memory Editor', shortLabel: '📝 MemEdit' },
    { id: 'watch', label: '👁 Watch', shortLabel: '👁 Watch' },
    { id: 'stack', label: '📚 Stack', shortLabel: '📚 Stack' },
    ...(isEnabled('cpuDiagram') ? [{ id: 'cpu-diagram' as TabType, label: '🔲 CPU Flow', shortLabel: '🔲 CPU', pcOnly: true }] : []),
  ];

  // Left panel content
  const renderLeftContent = () => {
    if (activeTab === 'assembler') {
      return (
        <>
          {/* Multi-file tab bar */}
          {isEnabled('multiFileTabs') && (
            <div className={`flex items-center gap-0 px-1 py-1 ${fileTabBg} border-b ${border} overflow-x-auto`}>
              {fileTabs.map((f) => (
                <div
                  key={f.id}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs cursor-pointer whitespace-nowrap transition-colors ${
                    activeFileId === f.id ? fileTabActive : fileTabInactive
                  }`}
                  onClick={() => switchFileTab(f.id)}
                >
                  <span>{f.name}</span>
                  {fileTabs.length > 1 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); closeFileTab(f.id); }}
                      className="ml-1 opacity-50 hover:opacity-100"
                    >×</button>
                  )}
                </div>
              ))}
              <button
                onClick={addFileTab}
                className={`px-2 py-1.5 text-xs ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-gray-400 hover:text-gray-600'} transition-colors`}
                title="New file"
              >+</button>
            </div>
          )}
          <div className={`flex-1 border-b ${panelBorder} relative`}>
            <CodeEditor
              value={undoRedo.currentValue}
              onChange={handleCodeChange}
              parseError={parseError}
              breakpoints={breakpoints}
              onToggleBreakpoint={toggleBreakpoint}
            />
          </div>
          <div className="h-48 lg:h-64">
            <ExecutionLog entries={executionLog} onClear={clearLog} />
          </div>
        </>
      );
    }
    if (activeTab === 'memory-editor') return <div className="flex-1"><MemoryEditorPanel memory={cpu.memory} onMemoryWrite={writeMemory} /></div>;
    if (activeTab === 'watch') return <div className="flex-1"><WatchPanel memory={cpu.memory} registers={cpu.registers} /></div>;
    if (activeTab === 'stack') return <div className="flex-1"><StackViewer memory={cpu.memory} sp={cpu.registers.registers16.SP} pc={cpu.registers.registers16.PC} /></div>;
    if (activeTab === 'cpu-diagram') return <div className="flex-1"><CPUDiagram registers={cpu.registers} lastInstruction={cpu.lastInstruction} halted={cpu.halted} isRunning={isRunning} /></div>;
    return null;
  };

  // Desktop right panel
  const rightPanel = (
    <div className="flex-1 flex flex-col h-full">
      <div className={`flex-1 border-b ${panelBorder} overflow-y-auto`}>
        <RegisterDashboard registers={cpu.registers} halted={cpu.halted} error={cpu.error} performance={cpu.performance} lastInstruction={cpu.lastInstruction} />
      </div>
      <div className="h-48 lg:h-64 overflow-hidden">
        <MemoryViewer memory={cpu.memory} pc={cpu.registers.registers16.PC} sp={cpu.registers.registers16.SP} displayRows={16} />
      </div>
    </div>
  );

  // Desktop left panel
  const leftPanel = (
    <div className={`flex flex-col h-full border-r ${panelBorder}`}>
      <div className={`flex items-center gap-1 px-2 py-2 ${tabBg} border-b ${border}`}>
        {desktopTabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-3 lg:px-4 py-2 text-xs lg:text-sm font-medium rounded-lg transition-all duration-200 ${activeTab === tab.id ? tabActive : tabInactive}`}>
            {tab.label}
          </button>
        ))}
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderLeftContent()}
      </div>
    </div>
  );

  return (
    <div className={`h-screen w-screen ${bg} ${text} flex flex-col overflow-hidden transition-colors duration-300`}>
      {/* ─── Header ─── */}
      <header className={`flex-shrink-0 px-3 sm:px-6 py-2 sm:py-3 ${headerBg} border-b shadow-lg transition-colors duration-300`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
              <svg className="w-4 h-4 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-bold tracking-tight truncate" style={{ fontFamily: 'var(--font-sans)' }}>Z-80 CPU Simulator</h1>
              <p className={`text-xs ${subtext} hidden sm:block`}>Educational Microprocessor Emulator</p>
            </div>
            <div className="ml-1 sm:ml-4 flex items-center">
              <div className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium ${
                isRunning ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : cpu.halted ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : program ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : isDark ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' : 'bg-gray-100 text-gray-500 border border-gray-200'
              }`}>
                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                  isRunning ? 'bg-blue-400 animate-pulse' : cpu.halted ? 'bg-red-400' : program ? 'bg-emerald-400' : isDark ? 'bg-zinc-500' : 'bg-gray-400'
                }`} />
                <span className="hidden xs:inline">{isRunning ? 'Running' : cpu.halted ? 'Halted' : program ? 'Ready' : 'Idle'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 text-sm flex-shrink-0">
            <div className="hidden md:flex items-center gap-2">
              <div className={`px-3 py-1.5 ${badgeBg} rounded-lg border`}>
                <span className={subtext}>PC:</span>
                <span className="ml-2 font-mono font-semibold text-blue-400" style={{ fontFamily: 'var(--font-mono)' }}>{cpu.registers.registers16.PC.toString(16).toUpperCase().padStart(4, '0')}H</span>
              </div>
              <div className={`px-3 py-1.5 ${badgeBg} rounded-lg border`}>
                <span className={subtext}>Inst:</span>
                <span className="ml-2 font-semibold text-emerald-400">{cpu.performance.instructionsExecuted}</span>
              </div>
            </div>

            {/* AI Review button */}
            <button onClick={() => setShowAIFeedback(true)}
              className={`p-1.5 sm:p-2 rounded-lg transition-all duration-300 hover:scale-110 ${isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-purple-400 border border-zinc-700' : 'bg-gray-100 hover:bg-gray-200 text-purple-600 border border-gray-200'}`}
              title="AI Code Review">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </button>

            {/* Tools button */}
            <button onClick={() => setShowTools(true)}
              className={`p-1.5 sm:p-2 rounded-lg transition-all duration-300 hover:scale-110 ${isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700' : 'bg-gray-100 hover:bg-gray-200 text-amber-600 border border-gray-200'}`}
              title="Tools & Features">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>

            {/* Theme toggle */}
            <button onClick={toggleTheme}
              className={`p-1.5 sm:p-2 rounded-lg transition-all duration-300 hover:scale-110 ${isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-yellow-400 border border-zinc-700' : 'bg-gray-100 hover:bg-gray-200 text-indigo-500 border border-gray-200'}`}
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
              {isDark ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* ─── Desktop Layout (md+) ─── */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {isEnabled('resizablePanels') ? (
          <ResizablePanel left={leftPanel} right={rightPanel} direction="horizontal" initialRatio={0.5} enabled={true} />
        ) : (
          <>
            <div className="flex-1">{leftPanel}</div>
            <div className="flex-1">{rightPanel}</div>
          </>
        )}
      </div>

      {/* ─── Mobile Layout (<md) ─── */}
      <div className="flex md:hidden flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden">
          {mobilePanel === 'code' && (
            <div className="h-full flex flex-col">
              <div className={`flex items-center gap-1 px-2 py-1.5 ${tabBg} border-b ${border}`}>
                {desktopTabs.filter(t => !t.pcOnly).map((tab) => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${activeTab === tab.id ? tabActive : tabInactive}`}>
                    {tab.shortLabel}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-hidden flex flex-col">
                {renderLeftContent()}
              </div>
            </div>
          )}
          {mobilePanel === 'cpu' && (
            <div className="h-full overflow-y-auto">
              <RegisterDashboard registers={cpu.registers} halted={cpu.halted} error={cpu.error} performance={cpu.performance} lastInstruction={cpu.lastInstruction} />
            </div>
          )}
          {mobilePanel === 'memory' && (
            <div className="h-full overflow-hidden">
              <MemoryViewer memory={cpu.memory} pc={cpu.registers.registers16.PC} sp={cpu.registers.registers16.SP} displayRows={16} />
            </div>
          )}
          {mobilePanel === 'log' && (
            <div className="h-full overflow-hidden">
              <ExecutionLog entries={executionLog} onClear={clearLog} />
            </div>
          )}
        </div>

        <div className={`flex-shrink-0 ${mobileNavBg} border-t ${border} safe-area-bottom`}>
          <div className="grid grid-cols-4 gap-0">
            {mobileNavItems.map((item) => (
              <button key={item.id} onClick={() => setMobilePanel(item.id)}
                className={`flex flex-col items-center justify-center py-2 transition-colors ${mobilePanel === item.id ? mobileNavActive : mobileNavInactive}`}>
                <span className="text-lg">{item.icon}</span>
                <span className="text-xs mt-0.5 font-medium">{item.label}</span>
                {mobilePanel === item.id && <div className={`w-5 h-0.5 rounded-full mt-1 ${isDark ? 'bg-blue-400' : 'bg-blue-500'}`} />}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Control Panel ─── */}
      <div className="flex-shrink-0">
        <ControlPanel
          onLoad={handleLoad} onStep={stepInstruction} onRun={runProgram} onReset={handleReset}
          isRunning={isRunning} hasProgram={program !== null} halted={cpu.halted}
          sourceCode={undoRedo.currentValue} onImportCode={handleImport}
          speed={speed} onSpeedChange={setSpeed}
          onShowShortcuts={() => setShowShortcuts(true)}
        />
      </div>

      {/* ─── Modals ─── */}
      <KeyboardShortcutsModal isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <ToolsPanel isOpen={showTools} onClose={() => setShowTools(false)} />
      <AIFeedbackPanel
        isOpen={showAIFeedback}
        onClose={() => setShowAIFeedback(false)}
        analysisResult={analysisResult}
        onAnalyze={analyzeCode}
        hasProgram={program !== null}
        sourceCode={store.sourceCode}
      />

      {/* ─── Autocomplete Dropdown (PC only) ─── */}
      {isEnabled('autocomplete') && (
        <AutocompleteDropdown
          suggestions={autocomplete.suggestions}
          selectedIndex={autocomplete.selectedIndex}
          position={autocomplete.position}
          currentWord={autocomplete.currentWord}
          onSelect={(text) => {
            const ta = editorTextareaRef.current;
            if (!ta) return;
            const pos = ta.selectionStart;
            const before = ta.value.substring(0, pos);
            const after = ta.value.substring(pos);
            handleCodeChange(before + text + after);
            autocomplete.dismiss();
          }}
        />
      )}
    </div>
  );
}
