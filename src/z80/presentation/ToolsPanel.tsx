/**
 * Tools Panel Component
 * Settings panel to toggle features on/off
 */

import React from 'react';
import { useTheme } from './ThemeContext';
import { useFeatureFlags, type FeatureFlags } from './FeatureToggleContext';

interface ToolsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const FEATURE_META: Record<keyof FeatureFlags, { label: string; icon: string; desc: string; pcOnly: boolean }> = {
  autocomplete: { label: 'Auto-Complete', icon: '💡', desc: 'IntelliSense for Z-80 mnemonics', pcOnly: true },
  cpuDiagram: { label: 'CPU Diagram', icon: '🔲', desc: 'Animated data flow visualization', pcOnly: true },
  resizablePanels: { label: 'Resizable Panels', icon: '↔️', desc: 'Drag to resize panel borders', pcOnly: true },
  toastNotifications: { label: 'Toast Notifications', icon: '🔔', desc: 'Popup alerts for actions', pcOnly: false },
  multiFileTabs: { label: 'Multi-File Tabs', icon: '📑', desc: 'Open multiple .asm files', pcOnly: false },
  undoRedo: { label: 'Undo / Redo', icon: '↩️', desc: 'Editor history (Ctrl+Z/Y)', pcOnly: false },
};

export const ToolsPanel: React.FC<ToolsPanelProps> = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  const { features, toggle } = useFeatureFlags();

  if (!isOpen) return null;

  const overlayBg = 'bg-black/50 backdrop-blur-sm';
  const panelBg = isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200';
  const text = isDark ? 'text-zinc-100' : 'text-gray-900';
  const subtext = isDark ? 'text-zinc-400' : 'text-gray-500';
  const divider = isDark ? 'border-zinc-800' : 'border-gray-100';
  const toggleOn = 'bg-blue-500';
  const toggleOff = isDark ? 'bg-zinc-700' : 'bg-gray-300';

  return (
    <div className={`fixed inset-0 z-50 ${overlayBg} flex items-center justify-center p-4`} onClick={onClose}>
      <div
        className={`w-full max-w-sm rounded-2xl border ${panelBg} shadow-2xl overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${divider}`}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">⚙</span>
            </div>
            <h2 className={`text-lg font-semibold ${text}`} style={{ fontFamily: 'var(--font-sans)' }}>
              Tools & Features
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

        {/* Features list */}
        <div className="px-5 py-3 space-y-1">
          {(Object.keys(FEATURE_META) as (keyof FeatureFlags)[]).map((key) => {
            const meta = FEATURE_META[key];
            const enabled = features[key];
            return (
              <div
                key={key}
                className={`flex items-center justify-between py-2.5 px-2 rounded-lg transition-colors ${isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-lg flex-shrink-0">{meta.icon}</span>
                  <div className="min-w-0">
                    <div className={`text-sm font-medium ${text} flex items-center gap-2`}>
                      {meta.label}
                      {meta.pcOnly && (
                        <span className={`text-xs px-1.5 py-0.5 rounded ${isDark ? 'bg-zinc-800 text-zinc-500' : 'bg-gray-100 text-gray-400'}`}>
                          PC
                        </span>
                      )}
                    </div>
                    <p className={`text-xs ${subtext} truncate`}>{meta.desc}</p>
                  </div>
                </div>
                {/* Toggle switch */}
                <button
                  onClick={() => toggle(key)}
                  className={`relative flex-shrink-0 w-10 h-6 rounded-full transition-colors duration-200 ${enabled ? toggleOn : toggleOff}`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                      enabled ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className={`px-5 py-3 border-t ${divider}`}>
          <p className={`text-xs text-center ${subtext}`}>
            Features marked <span className={`px-1 py-0.5 rounded ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>PC</span> are desktop-only
          </p>
        </div>
      </div>
    </div>
  );
};
