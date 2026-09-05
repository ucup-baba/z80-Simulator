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
import { MateriDasarPanel } from '../z80/presentation/MateriDasarPanel';
import { ManualBookModal } from '../z80/presentation/ManualBookModal';
import { ValidationModal } from '../z80/presentation/ValidationModal';
import { ValidationWelcomeModal } from '../z80/presentation/ValidationWelcomeModal';
import { ValidationDashboard } from '../z80/presentation/ValidationDashboard';
import { VALIDATOR_PROFILES, ValidatorPresetProfile } from '../z80/data/validationInstrumentsData';
import { PwaInstallPrompt } from '../z80/presentation/PwaInstallPrompt';
import { examplePrograms } from '../z80/data/examplePrograms';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
} from './components/ui/context-menu';
import {
  Code, CircuitBoard, Database, List, Terminal, Eye, Layers, Activity,
  Cpu, BookOpen, Sparkles, Settings2, Sun, Moon, LogIn, LogOut, MoreVertical, FileText,
  Edit3, Download, Copy, Trash2, FileCheck2
} from 'lucide-react';
import { useAuthStore } from '../z80/adapters/useAuthStore';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';

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
  const { cpu, program, executionLog, isRunning, parseError, isCodeDirty,
    loadCode, stepInstruction, runProgram, pauseProgram, setSpeed: setStoreSpeed, resetCPU, clearLog, writeMemory,
    analyzeCode, analysisResult } = store;

  const { isDark, toggleTheme } = useTheme();
  const { isEnabled } = useFeatureFlags();
  const { addToast } = useToast();
  const { user, loginWithGoogle, logout } = useAuthStore();

  const [activeTab, setActiveTab] = useState<TabType>('assembler');
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('code');
  const [breakpoints, setBreakpoints] = useState<Set<number>>(new Set());
  const [speed, setSpeed] = useState(50);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showAIFeedback, setShowAIFeedback] = useState(false);
  const [showMateriDasar, setShowMateriDasar] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [validationType, setValidationType] = useState<'materi' | 'media' | 'mahasiswa' | 'dosen'>('materi');
  const [validationViewMode, setValidationViewMode] = useState<'split' | 'minimized' | 'modal'>('split');
  const [validationPanelWidth, setValidationPanelWidth] = useState<number>(480);
  const [presetProfile, setPresetProfile] = useState<ValidatorPresetProfile | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState<boolean>(false);
  const [isValidationMode, setIsValidationMode] = useState<boolean>(false);
  const [showDashboard, setShowDashboard] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.has('hasil') || window.location.search.toLowerCase().includes('hasil');
    }
    return false;
  });

  const [showManualBook, setShowManualBook] = useState(() => {
    return !localStorage.getItem('z80sim_manual_seen');
  });
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Check URL query parameters for direct validation links (e.g. ?validasi=materi1 or ?hasil)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has('hasil') || window.location.search.toLowerCase().includes('hasil')) {
      setShowDashboard(true);
      return;
    }

    const validasiParam = params.get('validasi')?.toLowerCase();
    if (validasiParam && VALIDATOR_PROFILES[validasiParam]) {
      const profile = VALIDATOR_PROFILES[validasiParam];
      setPresetProfile(profile);
      setValidationType(profile.type);
      setIsValidationMode(true);
      setShowWelcomeModal(true);
      setShowValidationModal(true);
    } else if (validasiParam && ['materi', 'media', 'mahasiswa', 'dosen'].includes(validasiParam)) {
      setValidationType(validasiParam as any);
      setIsValidationMode(true);
      setShowValidationModal(true);
    }
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setShowMobileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Multi-file tabs
  const [fileTabs, setFileTabs] = useState<FileTab[]>(() => {
    try {
      const stored = localStorage.getItem('z80-file-tabs');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [{ id: 'main', name: 'program.asm', content: store.sourceCode }];
  });
  
  const [activeFileId, setActiveFileId] = useState<string>(() => {
    return localStorage.getItem('z80-active-file') || 'main';
  });

  // Undo/Redo
  const undoRedo = useUndoRedo(
    fileTabs.find(f => f.id === activeFileId)?.content || store.sourceCode, 
    isEnabled('undoRedo')
  );

  // Save changes to localStorage automatically
  useEffect(() => {
    localStorage.setItem('z80-file-tabs', JSON.stringify(fileTabs));
  }, [fileTabs]);

  useEffect(() => {
    localStorage.setItem('z80-active-file', activeFileId);
  }, [activeFileId]);

  // Sync initial state to store on mount
  useEffect(() => {
    const activeTab = fileTabs.find(f => f.id === activeFileId);
    if (activeTab) {
      store.setSourceCode(activeTab.content);
    }
  }, []); // Run only on mount

  // Cloud Sync: Download & Upload
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  
  useEffect(() => {
    if (user) {
      setIsCloudSyncing(true);
      const docRef = doc(db, 'users', user.uid);
      getDoc(docRef).then(snap => {
        if (snap.exists()) {
          const data = snap.data();
          if (data.fileTabs) {
            setFileTabs(data.fileTabs);
            if (data.activeFileId) setActiveFileId(data.activeFileId);
            
            const activeTab = data.fileTabs.find((f: FileTab) => f.id === (data.activeFileId || activeFileId));
            if (activeTab) {
              store.setSourceCode(activeTab.content);
              undoRedo.setValue(activeTab.content);
            }
          }
        }
        setIsCloudSyncing(false);
      }).catch(err => {
        console.error("Cloud Sync Download Error", err);
        setIsCloudSyncing(false);
      });
    }
  }, [user]);

  useEffect(() => {
    if (user && !isCloudSyncing) {
      const timer = setTimeout(() => {
        const docRef = doc(db, 'users', user.uid);
        setDoc(docRef, {
          fileTabs,
          activeFileId,
          updatedAt: serverTimestamp()
        }, { merge: true }).catch(err => console.error("Cloud Sync Upload Error", err));
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [fileTabs, activeFileId, user, isCloudSyncing]);

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

  // Multi-file tab editing state
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  // Multi-file: start rename tab
  const startRenameTab = useCallback((id: string, currentName: string) => {
    setEditingTabId(id);
    setEditingName(currentName);
  }, []);

  // Multi-file: finish rename tab
  const saveRenameTab = useCallback((id: string) => {
    if (!editingName.trim()) {
      setEditingTabId(null);
      return;
    }
    let formatted = editingName.trim();
    if (!formatted.toLowerCase().endsWith('.asm') && !formatted.toLowerCase().endsWith('.z80') && !formatted.toLowerCase().endsWith('.txt')) {
      formatted += '.asm';
    }
    setFileTabs(prev => prev.map(f => f.id === id ? { ...f, name: formatted } : f));
    setEditingTabId(null);
    addToast(`Renamed to ${formatted}`, 'info', 2000);
  }, [editingName, addToast]);

  // Multi-file: export single tab
  const exportFileTab = useCallback((id: string) => {
    const tab = fileTabs.find(f => f.id === id);
    if (!tab) return;
    if (!tab.content.trim()) {
      addToast('File is empty', 'warning', 2000);
      return;
    }
    const blob = new Blob([tab.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = tab.name.endsWith('.asm') ? tab.name : `${tab.name}.asm`;
    a.click();
    URL.revokeObjectURL(url);
    addToast(`Exported ${tab.name}`, 'success', 2000);
  }, [fileTabs, addToast]);

  // Multi-file: duplicate tab
  const duplicateFileTab = useCallback((id: string) => {
    const tab = fileTabs.find(f => f.id === id);
    if (!tab) return;
    const newId = Date.now().toString(36);
    const baseName = tab.name.replace(/\.(asm|z80|txt)$/i, '');
    const ext = tab.name.match(/\.(asm|z80|txt)$/i)?.[0] || '.asm';
    const newName = `${baseName}_copy${ext}`;
    const newTab: FileTab = { id: newId, name: newName, content: tab.content };
    setFileTabs(prev => [...prev, newTab]);
    setActiveFileId(newId);
    store.setSourceCode(tab.content);
    undoRedo.setValue(tab.content);
    addToast(`Duplicated: ${newName}`, 'info', 2000);
  }, [fileTabs, store, undoRedo, addToast]);

  // Multi-file: close other tabs
  const closeOtherFileTabs = useCallback((id: string) => {
    const tab = fileTabs.find(f => f.id === id);
    if (!tab) return;
    setFileTabs([tab]);
    setActiveFileId(tab.id);
    store.setSourceCode(tab.content);
    undoRedo.setValue(tab.content);
    addToast('Closed other tabs', 'info', 2000);
  }, [fileTabs, store, undoRedo, addToast]);

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
    store.setSourceCode(undoRedo.currentValue);
    const success = loadCode();
    if (isEnabled('toastNotifications')) {
      if (success) {
        addToast('Program assembled & loaded', 'success');
      } else {
        addToast('Failed to load — check your code', 'error');
      }
    }
  }, [loadCode, addToast, isEnabled, store, undoRedo.currentValue]);

  const handleReset = useCallback(() => {
    resetCPU();
    if (isEnabled('toastNotifications')) addToast('CPU reset to initial state', 'info');
  }, [resetCPU, addToast, isEnabled]);

  const handleImport = useCallback((code: string) => {
    handleCodeChange(code);
    if (isEnabled('toastNotifications')) addToast('File imported successfully', 'success');
  }, [handleCodeChange, addToast, isEnabled]);

  const handleLoadExample = useCallback((id: string) => {
    const example = examplePrograms.find(p => p.id === id);
    if (example) {
      handleCodeChange(example.code);
      store.loadExampleProgram(id);
    }
  }, [handleCodeChange, store]);

  // Toast feedback when Run/Step is clicked without program
  const handleRunBlocked = useCallback((reason: string) => {
    addToast(reason, 'warning');
  }, [addToast]);

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
          case 'r': e.preventDefault(); if (program && !cpu.halted) { if (isRunning) pauseProgram(); else runProgram(speed); } break;
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

  const mobileNavItems: { id: MobilePanel; icon: React.ReactNode; label: string }[] = [
    { id: 'code', icon: <Code className="w-5 h-5" />, label: 'Code' },
    { id: 'cpu', icon: <CircuitBoard className="w-5 h-5" />, label: 'CPU' },
    ...(isEnabled('memoryViewer') ? [{ id: 'memory' as MobilePanel, icon: <Database className="w-5 h-5" />, label: 'Memory' }] : []),
    { id: 'log', icon: <List className="w-5 h-5" />, label: 'Log' },
  ];

  const desktopTabs: { id: TabType; label: React.ReactNode; shortLabel: React.ReactNode; pcOnly?: boolean }[] = [
    { id: 'assembler', label: <div className="flex items-center gap-1.5 whitespace-nowrap"><Terminal className="w-4 h-4" /> <span>Assembler</span></div>, shortLabel: <div className="flex items-center gap-1 whitespace-nowrap"><Terminal className="w-3.5 h-3.5"/> <span>ASM</span></div> },
    { id: 'memory-editor', label: <div className="flex items-center gap-1.5 whitespace-nowrap"><Database className="w-4 h-4" /> <span>Memory Editor</span></div>, shortLabel: <div className="flex items-center gap-1 whitespace-nowrap"><Database className="w-3.5 h-3.5"/> <span>MemEdit</span></div> },
    { id: 'watch', label: <div className="flex items-center gap-1.5 whitespace-nowrap"><Eye className="w-4 h-4" /> <span>Watch</span></div>, shortLabel: <div className="flex items-center gap-1 whitespace-nowrap"><Eye className="w-3.5 h-3.5"/> <span>Watch</span></div> },
    { id: 'stack', label: <div className="flex items-center gap-1.5 whitespace-nowrap"><Layers className="w-4 h-4" /> <span>Stack</span></div>, shortLabel: <div className="flex items-center gap-1 whitespace-nowrap"><Layers className="w-3.5 h-3.5"/> <span>Stack</span></div> },
    ...(isEnabled('cpuDiagram') ? [{ id: 'cpu-diagram' as TabType, label: <div className="flex items-center gap-1.5 whitespace-nowrap"><Activity className="w-4 h-4" /> <span>CPU Flow</span></div>, shortLabel: <div className="flex items-center gap-1 whitespace-nowrap"><Activity className="w-3.5 h-3.5"/> <span>CPU</span></div>, pcOnly: true }] : []),
  ];

  // Left panel content
  const renderLeftContent = () => {
    if (activeTab === 'assembler') {
      return (
        <>
          {/* Multi-file tab bar */}
          {isEnabled('multiFileTabs') && (
            <div className={`flex-shrink-0 flex items-center gap-0 px-1 py-1 ${fileTabBg} border-b ${border} overflow-x-auto select-none`}>
              {fileTabs.map((f) => {
                const isActive = activeFileId === f.id;
                const isEditing = editingTabId === f.id;
                return (
                  <ContextMenu key={f.id}>
                    <ContextMenuTrigger asChild>
                      <div
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs cursor-pointer whitespace-nowrap transition-colors rounded-t-md ${
                          isActive ? fileTabActive : fileTabInactive
                        }`}
                        onClick={() => switchFileTab(f.id)}
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          startRenameTab(f.id, f.name);
                        }}
                        title="Klik 2x untuk ubah nama, klik kanan untuk opsi menu"
                      >
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveRenameTab(f.id);
                              if (e.key === 'Escape') setEditingTabId(null);
                            }}
                            onBlur={() => saveRenameTab(f.id)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            className={`px-1 py-0.5 text-xs border rounded outline-none w-28 font-mono ${
                              isDark ? 'bg-zinc-800 text-zinc-100 border-blue-500' : 'bg-white text-gray-900 border-blue-500'
                            }`}
                          />
                        ) : (
                          <span>{f.name}</span>
                        )}

                        {fileTabs.length > 1 && !isEditing && (
                          <button
                            onClick={(e) => { e.stopPropagation(); closeFileTab(f.id); }}
                            className="ml-1 opacity-40 hover:opacity-100 hover:text-red-500 transition-opacity p-0.5 rounded"
                            title="Close tab"
                          >×</button>
                        )}
                      </div>
                    </ContextMenuTrigger>

                    <ContextMenuContent className={`w-48 text-xs ${isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : 'bg-white border-gray-200 text-gray-800'}`}>
                      <ContextMenuItem
                        onClick={() => startRenameTab(f.id, f.name)}
                        className="flex items-center gap-2 cursor-pointer text-xs"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-400" />
                        <span>Rename (Edit Nama)</span>
                        <span className="ml-auto text-[10px] opacity-60">2x Click</span>
                      </ContextMenuItem>

                      <ContextMenuItem
                        onClick={() => exportFileTab(f.id)}
                        disabled={!f.content.trim()}
                        className="flex items-center gap-2 cursor-pointer text-xs disabled:opacity-40"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Export (.asm)</span>
                      </ContextMenuItem>

                      <ContextMenuItem
                        onClick={() => duplicateFileTab(f.id)}
                        className="flex items-center gap-2 cursor-pointer text-xs"
                      >
                        <Copy className="w-3.5 h-3.5 text-amber-400" />
                        <span>Duplicate</span>
                      </ContextMenuItem>

                      <ContextMenuSeparator />

                      <ContextMenuItem
                        onClick={() => closeFileTab(f.id)}
                        disabled={fileTabs.length <= 1}
                        className="flex items-center gap-2 cursor-pointer text-xs text-red-400 focus:text-red-400 disabled:opacity-40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Close Tab</span>
                      </ContextMenuItem>

                      {fileTabs.length > 1 && (
                        <ContextMenuItem
                          onClick={() => closeOtherFileTabs(f.id)}
                          className="flex items-center gap-2 cursor-pointer text-xs text-amber-400 focus:text-amber-400"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Close Others</span>
                        </ContextMenuItem>
                      )}
                    </ContextMenuContent>
                  </ContextMenu>
                );
              })}
              <button
                onClick={addFileTab}
                className={`px-2.5 py-1.5 text-xs rounded hover:bg-zinc-800/40 transition-colors flex items-center gap-1 font-medium ${
                  isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-gray-400 hover:text-gray-600'
                }`}
                title="New file tab"
              >
                +
              </button>
            </div>
          )}
          <div className={`flex-1 min-h-0 flex flex-col relative`}>
            {(program !== null || executionLog.length > 0) ? (
              <ResizablePanel
                direction="vertical"
                initialRatio={0.7}
                enabled={isEnabled('resizablePanels')}
                left={
                  <div className="h-full w-full relative">
                    <CodeEditor
                      value={undoRedo.currentValue}
                      onChange={handleCodeChange}
                      parseError={parseError}
                      breakpoints={breakpoints}
                      onToggleBreakpoint={toggleBreakpoint}
                    />
                  </div>
                }
                right={
                  <div className={`h-full w-full flex flex-col min-h-0 border-t ${panelBorder}`}>
                    <ExecutionLog entries={executionLog} onClear={clearLog} />
                  </div>
                }
              />
            ) : (
              <div className="flex-1 w-full relative min-h-0">
                <CodeEditor
                  value={undoRedo.currentValue}
                  onChange={handleCodeChange}
                  parseError={parseError}
                  breakpoints={breakpoints}
                  onToggleBreakpoint={toggleBreakpoint}
                />
              </div>
            )}
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
      {isEnabled('memoryViewer') && (
        <div className="h-48 lg:h-64 overflow-hidden">
          <MemoryViewer memory={cpu.memory} pc={cpu.registers.registers16.PC} sp={cpu.registers.registers16.SP} displayRows={16} />
        </div>
      )}
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

  if (showDashboard) {
    return <ValidationDashboard onBackToSimulator={() => setShowDashboard(false)} />;
  }

  return (
    <div className={`fixed inset-0 ${bg} ${text} flex flex-row overflow-hidden transition-colors duration-300`}>
      {/* ─── Main App Left Side ─── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative z-10">
        {/* ─── Header ─── */}
        <header className={`relative z-50 flex-shrink-0 px-3 sm:px-6 py-2 sm:py-3 ${headerBg} border-b shadow-lg transition-colors duration-300`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20 flex-shrink-0">
                <Cpu className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
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
              <div className={`px-3 py-1.5 ${badgeBg} rounded-lg border flex items-center`}>
                <span className={subtext}>PC:</span>
                <span className="ml-2 font-mono font-semibold text-blue-400" style={{ fontFamily: 'var(--font-mono)' }}>{cpu.registers.registers16.PC.toString(16).toUpperCase().padStart(4, '0')}H</span>
              </div>
              <div className={`px-3 py-1.5 ${badgeBg} rounded-lg border flex items-center`}>
                <span className={subtext}>Inst:</span>
                <span className="ml-2 font-semibold text-emerald-400">{cpu.performance.instructionsExecuted}</span>
              </div>
            </div>

            {/* AI Review button - Always visible */}
            <button onClick={() => setShowAIFeedback(true)}
              className={`p-1.5 sm:p-2 rounded-lg transition-all duration-300 hover:scale-110 ${isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-purple-400 border border-zinc-700' : 'bg-gray-100 hover:bg-gray-200 text-purple-600 border border-gray-200'}`}
              title="AI Code Review">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>

            {/* Desktop only buttons */}
            <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
              {/* Materi Dasar button */}
              <button onClick={() => setShowMateriDasar(true)}
                className={`p-1.5 sm:p-2 rounded-lg transition-all duration-300 hover:scale-110 ${isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-blue-400 border border-zinc-700' : 'bg-gray-100 hover:bg-gray-200 text-blue-600 border border-gray-200'}`}
                title="Materi Dasar Z-80">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Validation Form button (Only visible on preset validation links) */}
              {isValidationMode && (
                <button onClick={() => setShowValidationModal(true)}
                  className={`p-1.5 sm:p-2 rounded-lg transition-all duration-300 hover:scale-110 ${isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-purple-400 border border-zinc-700' : 'bg-gray-100 hover:bg-gray-200 text-purple-600 border border-gray-200'}`}
                  title="Instrumen Validasi Penelitian R&D (Cetak PDF)">
                  <FileCheck2 className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}

              {/* Manual Book button */}
              <button onClick={() => setShowManualBook(true)}
                className={`p-1.5 sm:p-2 rounded-lg transition-all duration-300 hover:scale-110 ${isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700' : 'bg-gray-100 hover:bg-gray-200 text-emerald-600 border border-gray-200'}`}
                title="Buku Panduan (Manual Book)">
                <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Tools button */}
              <button onClick={() => setShowTools(true)}
                className={`p-1.5 sm:p-2 rounded-lg transition-all duration-300 hover:scale-110 ${isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-amber-400 border border-zinc-700' : 'bg-gray-100 hover:bg-gray-200 text-amber-600 border border-gray-200'}`}
                title="Tools & Features">
                <Settings2 className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Theme toggle */}
              <button onClick={toggleTheme}
                className={`p-1.5 sm:p-2 rounded-lg transition-all duration-300 hover:scale-110 ${isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-yellow-400 border border-zinc-700' : 'bg-gray-100 hover:bg-gray-200 text-indigo-500 border border-gray-200'}`}
                title={`Switch to ${isDark ? 'light' : 'dark'} mode`}>
                {isDark ? (
                  <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
                ) : (
                  <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
                )}
              </button>

              {/* Authentication (Desktop) */}
              {user ? (
                <button onClick={() => logout()} title={`Logged in as ${user.displayName}\nClick to logout`} className={`w-7 h-7 sm:w-9 sm:h-9 rounded-full overflow-hidden border-2 transition-all hover:scale-105 ${isDark ? 'border-zinc-600 hover:border-red-400' : 'border-gray-300 hover:border-red-500'}`}>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-full h-full bg-blue-500 flex items-center justify-center text-white font-bold" style={{ fontFamily: 'var(--font-sans)' }}>{user.displayName?.charAt(0) || 'U'}</div>
                  )}
                </button>
              ) : (
                <button onClick={() => loginWithGoogle()}
                  className={`p-1.5 sm:p-2 rounded-lg transition-all duration-300 hover:scale-110 ${isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-emerald-400 border border-zinc-700' : 'bg-gray-100 hover:bg-gray-200 text-emerald-600 border border-gray-200'}`}
                  title="Login with Google">
                  <LogIn className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="sm:hidden relative" ref={mobileMenuRef}>
              <button onClick={() => setShowMobileMenu(!showMobileMenu)}
                className={`p-1.5 rounded-lg transition-all duration-300 hover:scale-110 ${showMobileMenu ? (isDark ? 'bg-zinc-700 text-zinc-100' : 'bg-gray-200 text-gray-900') : (isDark ? 'bg-zinc-800 text-zinc-400 border border-zinc-700' : 'bg-gray-100 text-gray-500 border border-gray-200')}`}>
                <MoreVertical className="w-4 h-4" />
              </button>
              
              {showMobileMenu && (
                <div className={`absolute right-0 mt-2 w-48 rounded-xl shadow-xl border overflow-hidden z-50 ${isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200'}`}>
                  <button onClick={() => { setShowValidationModal(true); setShowMobileMenu(false); }} className={`w-full text-left px-4 py-3 flex items-center gap-3 text-sm ${isDark ? 'text-zinc-200 hover:bg-zinc-800' : 'text-gray-700 hover:bg-gray-50'}`}>
                    <FileCheck2 className="w-4 h-4 text-purple-400" /> Form Validasi (R&amp;D)
                  </button>
                  <button onClick={() => { setShowMateriDasar(true); setShowMobileMenu(false); }} className={`w-full text-left px-4 py-3 flex items-center gap-3 text-sm border-t ${isDark ? 'border-zinc-800 text-zinc-200 hover:bg-zinc-800' : 'border-gray-100 text-gray-700 hover:bg-gray-50'}`}>
                    <BookOpen className="w-4 h-4 text-blue-500" /> Materi Dasar
                  </button>
                  <button onClick={() => { setShowManualBook(true); setShowMobileMenu(false); }} className={`w-full text-left px-4 py-3 flex items-center gap-3 text-sm ${isDark ? 'text-zinc-200 hover:bg-zinc-800' : 'text-gray-700 hover:bg-gray-50'}`}>
                    <FileText className="w-4 h-4 text-emerald-500" /> Buku Panduan (Manual)
                  </button>
                  <button onClick={() => { setShowTools(true); setShowMobileMenu(false); }} className={`w-full text-left px-4 py-3 flex items-center gap-3 text-sm border-t ${isDark ? 'border-zinc-800 text-zinc-200 hover:bg-zinc-800' : 'border-gray-100 text-gray-700 hover:bg-gray-50'}`}>
                    <Settings2 className="w-4 h-4 text-amber-500" /> Tools & Features
                  </button>
                  <button onClick={() => { toggleTheme(); setShowMobileMenu(false); }} className={`w-full text-left px-4 py-3 flex items-center gap-3 text-sm border-t ${isDark ? 'border-zinc-800 text-zinc-200 hover:bg-zinc-800' : 'border-gray-100 text-gray-700 hover:bg-gray-50'}`}>
                    {isDark ? <Sun className="w-4 h-4 text-yellow-500" /> : <Moon className="w-4 h-4 text-indigo-500" />} 
                    {isDark ? 'Light Mode' : 'Dark Mode'}
                  </button>
                  <div className={`border-t ${isDark ? 'border-zinc-800' : 'border-gray-100'}`}>
                    {user ? (
                      <button onClick={() => { logout(); setShowMobileMenu(false); }} className={`w-full text-left px-4 py-3 flex items-center gap-3 text-sm ${isDark ? 'text-red-400 hover:bg-zinc-800' : 'text-red-500 hover:bg-red-50'}`}>
                        <LogOut className="w-4 h-4" /> Logout ({user.displayName?.split(' ')[0]})
                      </button>
                    ) : (
                      <button onClick={() => { loginWithGoogle(); setShowMobileMenu(false); }} className={`w-full text-left px-4 py-3 flex items-center gap-3 text-sm ${isDark ? 'text-emerald-400 hover:bg-zinc-800' : 'text-emerald-600 hover:bg-emerald-50'}`}>
                        <LogIn className="w-4 h-4" /> Login with Google
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
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
              <div className={`flex items-center justify-center gap-1 px-2 py-1.5 ${tabBg} border-b ${border}`}>
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
            <div className="h-full overflow-hidden flex flex-col items-center justify-center">
              {isEnabled('memoryViewer') ? (
                <MemoryViewer memory={cpu.memory} pc={cpu.registers.registers16.PC} sp={cpu.registers.registers16.SP} displayRows={16} />
              ) : (
                <p className={`text-sm ${subtext}`}>Memory Viewer is hidden. Enable in Tools & Features.</p>
              )}
            </div>
          )}
          {mobilePanel === 'log' && (
            <div className="h-full overflow-hidden">
              <ExecutionLog entries={executionLog} onClear={clearLog} />
            </div>
          )}
        </div>

        <div className={`flex-shrink-0 ${mobileNavBg} border-t ${border} safe-area-bottom`}>
          <div className="flex justify-center gap-0">
            {mobileNavItems.map((item) => (
              <button key={item.id} onClick={() => setMobilePanel(item.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-6 transition-colors ${mobilePanel === item.id ? mobileNavActive : mobileNavInactive}`}>
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
          onLoad={handleLoad} onStep={stepInstruction} onRun={() => runProgram(speed)} onPause={pauseProgram} onReset={handleReset}
          isRunning={isRunning} hasProgram={program !== null} isCodeDirty={store.isCodeDirty} halted={cpu.halted}
          sourceCode={undoRedo.currentValue} onImportCode={handleImport}
          speed={speed} onSpeedChange={(newSpeed) => {
            setSpeed(newSpeed);
            setStoreSpeed(newSpeed);
          }}
          onShowShortcuts={() => setShowShortcuts(true)}
          onLoadExample={handleLoadExample}
          onRunBlocked={handleRunBlocked}
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
        isCodeDirty={isCodeDirty}
        sourceCode={store.sourceCode}
      />
      <MateriDasarPanel 
        isOpen={showMateriDasar} 
        onClose={() => setShowMateriDasar(false)}
        onTryCode={(code) => handleCodeChange(code)}
      />
      <ManualBookModal
        isOpen={showManualBook}
        onClose={() => {
          setShowManualBook(false);
          localStorage.setItem('z80sim_manual_seen', 'true');
        }}
        onTryCode={(code) => handleCodeChange(code)}
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

      {/* ─── PWA Install Banner ─── */}
      <PwaInstallPrompt />
      
      </div> {/* Closes Main App Left Side */}

      {/* ─── Validation Welcome & Technical Guide Modal ─── */}
      {showWelcomeModal && presetProfile && (
        <ValidationWelcomeModal
          isOpen={true}
          profile={presetProfile}
          onClose={() => setShowWelcomeModal(false)}
          onStartValidation={() => {
            setShowWelcomeModal(false);
            setShowValidationModal(true);
            setShowManualBook(true);
          }}
        />
      )}

      {/* ─── Validation Split Panel (Right Side) ─── */}
      {showValidationModal && validationViewMode === 'split' && typeof window !== 'undefined' && window.innerWidth >= 768 && (
        <div 
          style={{ width: `${Math.max(300, Math.min(validationPanelWidth, window.innerWidth - 420))}px` }} 
          className="flex-shrink-0 h-full relative z-20 transition-all duration-150"
        >
          <ValidationModal
            isOpen={true}
            onClose={() => setShowValidationModal(false)}
            initialType={validationType}
            presetProfile={presetProfile}
            windowMode="split"
            onWindowModeChange={setValidationViewMode}
            panelWidth={validationPanelWidth}
            onPanelWidthChange={setValidationPanelWidth}
            onTryCode={(code) => handleCodeChange(code)}
          />
        </div>
      )}

      {/* ─── Validation Overlay Modes (Minimized / Modal) ─── */}
      {showValidationModal && (validationViewMode !== 'split' || typeof window !== 'undefined' && window.innerWidth < 768) && (
        <ValidationModal
          isOpen={true}
          onClose={() => setShowValidationModal(false)}
          initialType={validationType}
          presetProfile={presetProfile}
          windowMode={validationViewMode}
          onWindowModeChange={setValidationViewMode}
          panelWidth={validationPanelWidth}
          onPanelWidthChange={setValidationPanelWidth}
          onTryCode={(code) => handleCodeChange(code)}
        />
      )}
    </div>
  );
}
