import React, { useState, useEffect, MouseEvent } from 'react';
import { useTheme } from './ThemeContext';
import { BookOpen, X } from 'lucide-react';

interface MateriDasarPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MateriDasarPanel: React.FC<MateriDasarPanelProps> = ({ isOpen, onClose }) => {
  const { isDark } = useTheme();
  const [isMobile, setIsMobile] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setPosition({ x: window.innerWidth - 380, y: 80 });
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: globalThis.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (!isOpen) return null;

  const bg = isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200';
  const text = isDark ? 'text-zinc-100' : 'text-gray-900';
  const textMuted = isDark ? 'text-zinc-400' : 'text-gray-500';
  const codeBg = isDark ? 'bg-zinc-800 text-purple-400' : 'bg-purple-50 text-purple-700';
  const divider = isDark ? 'border-zinc-800' : 'border-gray-100';
  
  const content = (
    <div className={`flex flex-col h-full overflow-hidden ${bg} ${!isMobile ? 'border rounded-xl shadow-2xl' : ''}`}>
      {/* Header (Drag Handle for PC) */}
      <div 
        onMouseDown={handleMouseDown}
        className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-zinc-800 bg-zinc-900/80' : 'border-gray-100 bg-gray-50/80'} ${!isMobile ? 'cursor-move' : ''}`}
      >
        <div className="flex items-center gap-2 pointer-events-none select-none">
          <BookOpen className="w-5 h-5 text-blue-500" />
          <h2 className={`font-semibold ${text}`}>Materi Dasar Z-80</h2>
        </div>
        <button 
          onClick={(e) => { e.stopPropagation(); onClose(); }} 
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-gray-200 text-gray-500'}`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 cursor-auto">
        <section>
          <h3 className={`font-semibold mb-3 ${text} flex items-center gap-2`}>
            <span className="text-blue-500">1.</span> Transfer Data
          </h3>
          <ul className={`text-sm space-y-3 ${textMuted} ml-1`}>
            <li>
              <code className={`px-1.5 py-0.5 rounded font-mono text-xs font-semibold ${codeBg}`}>LD dest, src</code>
              <p className="mt-1 leading-snug">Menyalin nilai dari sumber ke tujuan (Register atau Memori).</p>
            </li>
            <li>
              <code className={`px-1.5 py-0.5 rounded font-mono text-xs font-semibold ${codeBg}`}>PUSH reg</code>
              <p className="mt-1 leading-snug">Menyimpan register 16-bit (contoh: HL) ke atas Stack.</p>
            </li>
            <li>
              <code className={`px-1.5 py-0.5 rounded font-mono text-xs font-semibold ${codeBg}`}>POP reg</code>
              <p className="mt-1 leading-snug">Mengambil nilai teratas Stack dan memasukannya ke register.</p>
            </li>
          </ul>
        </section>

        <hr className={divider} />

        <section>
          <h3 className={`font-semibold mb-3 ${text} flex items-center gap-2`}>
            <span className="text-emerald-500">2.</span> Operasi Aritmatika
          </h3>
          <ul className={`text-sm space-y-2 ${textMuted} ml-1`}>
            <li><code className={`px-1.5 py-0.5 rounded font-mono text-xs font-semibold ${codeBg}`}>ADD A, reg</code> <span className="ml-1">- Menambah nilai ke Akumulator (A).</span></li>
            <li><code className={`px-1.5 py-0.5 rounded font-mono text-xs font-semibold ${codeBg}`}>SUB reg</code> <span className="ml-1">- Mengurangi Akumulator (A) dengan nilai.</span></li>
            <li><code className={`px-1.5 py-0.5 rounded font-mono text-xs font-semibold ${codeBg}`}>INC reg</code> <span className="ml-1">- Menambah 1 (+1) pada nilai register.</span></li>
            <li><code className={`px-1.5 py-0.5 rounded font-mono text-xs font-semibold ${codeBg}`}>DEC reg</code> <span className="ml-1">- Mengurangi 1 (-1) pada nilai register.</span></li>
            <li><code className={`px-1.5 py-0.5 rounded font-mono text-xs font-semibold ${codeBg}`}>CP reg</code> <span className="ml-1">- Membandingkan (Compare) operasi tanpa mengubah nilai.</span></li>
          </ul>
        </section>

        <hr className={divider} />

        <section>
          <h3 className={`font-semibold mb-3 ${text} flex items-center gap-2`}>
            <span className="text-purple-500">3.</span> Operasi Logika
          </h3>
          <ul className={`text-sm space-y-2 ${textMuted} ml-1`}>
            <li><code className={`px-1.5 py-0.5 rounded font-mono text-xs font-semibold ${codeBg}`}>AND reg</code> <span className="ml-1">- Logika AND terhadap Akumulator (A).</span></li>
            <li><code className={`px-1.5 py-0.5 rounded font-mono text-xs font-semibold ${codeBg}`}>OR reg</code> <span className="ml-1">- Logika OR terhadap Akumulator (A).</span></li>
            <li><code className={`px-1.5 py-0.5 rounded font-mono text-xs font-semibold ${codeBg}`}>XOR reg</code> <span className="ml-1">- Logika XOR (bisa mengosongkan register).</span></li>
          </ul>
        </section>

        <hr className={divider} />

        <section>
          <h3 className={`font-semibold mb-3 ${text} flex items-center gap-2`}>
            <span className="text-amber-500">4.</span> Kendali Program
          </h3>
          <ul className={`text-sm space-y-3 ${textMuted} ml-1`}>
            <li><code className={`px-1.5 py-0.5 rounded font-mono text-xs font-semibold ${codeBg}`}>JP alamat</code> <span className="ml-1">- Lompat mutlak ke alamat/label.</span></li>
            <li><code className={`px-1.5 py-0.5 rounded font-mono text-xs font-semibold ${codeBg}`}>JR C, label</code> <span className="ml-1">- Lompat bersyarat jika status Flag terpenuhi.</span></li>
            <li><code className={`px-1.5 py-0.5 rounded font-mono text-xs font-semibold ${codeBg}`}>DJNZ label</code> <span className="ml-1">- Lompat Looping (mengurangi B).</span></li>
            <li><code className={`px-1.5 py-0.5 rounded font-mono text-xs font-semibold ${codeBg}`}>CALL alamat</code> <span className="ml-1">- Memanggil blok Subrutin fungsi.</span></li>
            <li><code className={`px-1.5 py-0.5 rounded font-mono text-xs font-semibold ${codeBg}`}>RET</code> <span className="ml-1">- Kembali dari blok pemanggilan fungsi (Return).</span></li>
          </ul>
        </section>

        <hr className={divider} />

        <section>
          <h3 className={`font-semibold mb-3 ${text} flex items-center gap-2`}>
            <span className="text-red-500">5.</span> Penghenti Eksekusi
          </h3>
          <ul className={`text-sm space-y-3 ${textMuted} ml-1`}>
            <li>
              <code className={`px-1.5 py-0.5 rounded font-mono text-xs font-semibold ${codeBg}`}>HALT</code>
              <p className="mt-1 leading-snug">Menghentikan seluruh pemrosesan (eksekusi) CPU sepenuhnya.</p>
            </li>
          </ul>
        </section>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className={`fixed inset-0 z-[100] ${bg}`}>
        {content}
      </div>
    );
  }

  return (
    <div 
      className="fixed z-[60]" 
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '350px',
        height: '550px',
        maxHeight: '80vh'
      }}
    >
      {content}
    </div>
  );
};
