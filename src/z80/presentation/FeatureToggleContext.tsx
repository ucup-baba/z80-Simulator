/**
 * Feature Toggle Context
 * Manages which features are enabled/disabled with localStorage persistence
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface FeatureFlags {
  autocomplete: boolean;
  cpuDiagram: boolean;
  resizablePanels: boolean;
  toastNotifications: boolean;
  multiFileTabs: boolean;
  undoRedo: boolean;
  memoryViewer: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  autocomplete: true,
  cpuDiagram: true,
  resizablePanels: true,
  toastNotifications: true,
  multiFileTabs: true,
  undoRedo: true,
  memoryViewer: false,
};

interface FeatureToggleContextValue {
  features: FeatureFlags;
  toggle: (key: keyof FeatureFlags) => void;
  isEnabled: (key: keyof FeatureFlags) => boolean;
}

const FeatureToggleContext = createContext<FeatureToggleContextValue>({
  features: DEFAULT_FLAGS,
  toggle: () => {},
  isEnabled: () => true,
});

const STORAGE_KEY = 'z80-feature-flags';

export const FeatureToggleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [features, setFeatures] = useState<FeatureFlags>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return { ...DEFAULT_FLAGS, ...JSON.parse(stored) };
    } catch {}
    return DEFAULT_FLAGS;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(features));
  }, [features]);

  const toggle = useCallback((key: keyof FeatureFlags) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const isEnabled = useCallback((key: keyof FeatureFlags) => features[key], [features]);

  return (
    <FeatureToggleContext.Provider value={{ features, toggle, isEnabled }}>
      {children}
    </FeatureToggleContext.Provider>
  );
};

export const useFeatureFlags = () => useContext(FeatureToggleContext);
