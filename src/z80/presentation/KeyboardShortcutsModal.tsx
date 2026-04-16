/**
 * Keyboard Shortcuts Modal (PC only)
 * Shows all available keyboard shortcuts
 */

import React from 'react';
import { useTheme } from './ThemeContext';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const shortcuts = [
  { category: 'Program Control', items: [
    { keys: 'Ctrl + L', desc: 'Load / Assemble code' },
    { keys: 'Ctrl + S', desc: 'Step one instruction' },
    { keys: 'Ctrl + R', desc: 'Run program to completion' },
  ]},
  { category: 'Navigation', items: [
    { keys: '?', desc: 'Show this shortcuts panel' },
    { keys: 'Esc', desc: 'Close modal / dialogs' },
  ]},
  { category: 'Editor', items: [
    { keys: 'Tab', desc: 'Indent (in code editor)' },
    { keys: 'Ctrl + A', desc: 'Select all code' },
  ]},
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  const overlayBg = 'bg-black/60 backdrop-blur-sm';
  const modalBg = isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200';
  const text = isDark ? 'text-zinc-100' : 'text-gray-900';
  const subtext = isDark ? 'text-zinc-400' : 'text-gray-500';
  const kbdBg = isDark
    ? 'bg-zinc-800 border-zinc-600 text-zinc-200 shadow-zinc-950'
    : 'bg-gray-100 border-gray-300 text-gray-700 shadow-gray-200';
  const catText = isDark ? 'text-zinc-500' : 'text-gray-400';
  const divider = isDark ? 'border-zinc-800' : 'border-gray-100';

  return (
    <div
      className={`fixed inset-0 z-50 ${overlayBg} flex items-center justify-center p-4`}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-md rounded-2xl border ${modalBg} shadow-2xl overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${divider}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">⌨</span>
            </div>
            <h2 className={`text-lg font-semibold ${text}`} style={{ fontFamily: 'var(--font-sans)' }}>
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-gray-100 text-gray-400'}`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-5">
          {shortcuts.map((section) => (
            <div key={section.category}>
              <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2.5 ${catText}`} style={{ fontFamily: 'var(--font-sans)' }}>
                {section.category}
              </h3>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <div key={item.keys} className="flex items-center justify-between">
                    <span className={`text-sm ${subtext}`}>{item.desc}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.split(' + ').map((key, i) => (
                        <React.Fragment key={key}>
                          {i > 0 && <span className={`text-xs ${subtext}`}>+</span>}
                          <kbd className={`px-2 py-0.5 text-xs rounded border shadow-sm font-mono ${kbdBg}`}>
                            {key}
                          </kbd>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className={`px-6 py-3 border-t ${divider}`}>
          <p className={`text-xs text-center ${subtext}`}>
            Press <kbd className={`px-1.5 py-0.5 rounded border text-xs ${kbdBg}`}>Esc</kbd> or click outside to close
          </p>
        </div>
      </div>
    </div>
  );
};
