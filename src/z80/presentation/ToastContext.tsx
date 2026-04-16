/**
 * Toast Notification System
 * Elegant popup notifications for actions and events
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useTheme } from './ThemeContext';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextValue {
  addToast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue>({ addToast: () => {} });

export const useToast = () => useContext(ToastContext);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, message, type, duration }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </ToastContext.Provider>
  );
};

// Toast container renders all toasts
const ToastContainer: React.FC<{ toasts: Toast[]; onRemove: (id: string) => void }> = ({ toasts, onRemove }) => {
  return (
    <div className="fixed bottom-20 right-4 z-[60] flex flex-col gap-2 pointer-events-none" style={{ maxWidth: '360px' }}>
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
};

const ToastItem: React.FC<{ toast: Toast; onRemove: (id: string) => void }> = ({ toast, onRemove }) => {
  const { isDark } = useTheme();
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    timerRef.current = window.setTimeout(() => {
      setIsExiting(true);
      setTimeout(() => onRemove(toast.id), 300);
    }, toast.duration || 3000);
    return () => clearTimeout(timerRef.current);
  }, [toast, onRemove]);

  const icons: Record<ToastType, string> = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  const colors: Record<ToastType, string> = {
    success: isDark ? 'border-l-emerald-400 bg-emerald-950/90' : 'border-l-emerald-500 bg-emerald-50/95',
    error: isDark ? 'border-l-red-400 bg-red-950/90' : 'border-l-red-500 bg-red-50/95',
    warning: isDark ? 'border-l-amber-400 bg-amber-950/90' : 'border-l-amber-500 bg-amber-50/95',
    info: isDark ? 'border-l-blue-400 bg-blue-950/90' : 'border-l-blue-500 bg-blue-50/95',
  };

  const iconColors: Record<ToastType, string> = {
    success: 'text-emerald-400',
    error: 'text-red-400',
    warning: 'text-amber-400',
    info: 'text-blue-400',
  };

  const textColor = isDark ? 'text-zinc-200' : 'text-gray-800';

  return (
    <div
      className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl border-l-4 ${colors[toast.type]} backdrop-blur-xl shadow-xl transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'
      }`}
      style={{ animation: isExiting ? undefined : 'slideInRight 0.3s ease-out' }}
    >
      <span className={`text-lg ${iconColors[toast.type]} flex-shrink-0`}>{icons[toast.type]}</span>
      <p className={`text-sm ${textColor} flex-1`} style={{ fontFamily: 'var(--font-sans)' }}>{toast.message}</p>
      <button
        onClick={() => { setIsExiting(true); setTimeout(() => onRemove(toast.id), 300); }}
        className={`flex-shrink-0 p-0.5 rounded transition-colors ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-gray-400 hover:text-gray-600'}`}
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
