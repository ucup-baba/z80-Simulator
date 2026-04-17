import React, { useEffect, useState } from 'react';
import { useTheme } from './ThemeContext';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed',
    platform: string
  }>;
  prompt(): Promise<void>;
}

export const PwaInstallPrompt: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const { isDark } = useTheme();

  useEffect(() => {
    const handler = (e: Event) => {
      // Mencegah Chrome memunculkan mini-infobar secara otomatis
      e.preventDefault();
      // Simpan event agar bisa dipicu nanti
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Tampilkan UI Snackbar kita
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Munculkan prompt instalasi bawaan browser
    deferredPrompt.prompt();
    
    // Tunggu pilihan user (Install atau Batal)
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) return null;

  return (
    <div className={`fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl transition-all duration-300 ease-in-out animate-in slide-in-from-bottom-5 ${
      isDark ? 'bg-zinc-800 text-zinc-100 border border-zinc-700 shadow-black/50' : 'bg-white text-gray-900 border border-gray-200 shadow-gray-200/50'
    }`}>
      <div className={`p-2 rounded-lg flex-shrink-0 ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
        <Download className="w-5 h-5" />
      </div>
      
      <div className="flex flex-col pr-2 sm:pr-4">
        <span className="text-sm font-bold antialiased">Install Z-80 Simulator</span>
        <span className={`text-xs ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Akses lebih cepat & main offline</span>
      </div>

      <div className={`flex items-center gap-1.5 sm:gap-2 ml-1 sm:ml-2 border-l pl-3 sm:pl-4 transition-colors ${isDark ? 'border-zinc-700' : 'border-gray-100'}`}>
        <button 
          onClick={handleInstallClick}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
            isDark ? 'bg-blue-600 hover:bg-blue-500 text-white shadow shadow-blue-500/20' : 'bg-blue-500 hover:bg-blue-600 text-white shadow-sm shadow-blue-500/30'
          }`}
        >
          Install
        </button>
        <button 
          onClick={handleDismiss}
          className={`p-1.5 rounded-md transition-colors ${
            isDark ? 'hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-900'
          }`}
          title="Tutup"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
