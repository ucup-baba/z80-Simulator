import React, { useState } from 'react';
import { useTheme } from './ThemeContext';
import {
  FileText, X, Search, BookOpen, ChevronRight, Download, Play,
  Cpu, Layers, CheckCircle2, AlertTriangle, Terminal, Sparkles, HelpCircle,
} from 'lucide-react';

interface ManualBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTryCode?: (code: string) => void;
}

interface Chapter {
  id: string;
  number: string;
  title: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

export const ManualBookModal: React.FC<ManualBookModalProps> = ({ isOpen, onClose, onTryCode }) => {
  const { isDark } = useTheme();
  const [activeChapter, setActiveChapter] = useState('bab1');
  const [searchQuery, setSearchQuery] = useState('');

  if (!isOpen) return null;

  const bg = isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-white border-gray-200 text-gray-900';
  const sidebarBg = isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-gray-50 border-gray-200';
  const textMuted = isDark ? 'text-zinc-400' : 'text-gray-500';
  const codeBg = isDark ? 'bg-zinc-950 text-emerald-400 border-zinc-800' : 'bg-gray-900 text-emerald-400 border-gray-800';
  const cardBg = isDark ? 'bg-zinc-800/40 border-zinc-800' : 'bg-gray-50 border-gray-200';
  const highlightBadge = isDark ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-blue-100 text-blue-700 border-blue-200';

  const handleTry = (code: string) => {
    if (onTryCode) {
      onTryCode(code);
      onClose();
    }
  };

  const handleDownloadMarkdown = () => {
    const a = document.createElement('a');
    a.href = '/MANUAL_BOOK_Z80_SIMULATOR.md';
    a.download = 'MANUAL_BOOK_Z80_SIMULATOR.md';
    a.click();
  };

  const chapters: Chapter[] = [
    {
      id: 'bab1',
      number: 'BAB I',
      title: 'Pendahuluan',
      icon: <BookOpen className="w-4 h-4 text-blue-500" />,
      content: (
        <div className="space-y-4">
          <div className={`p-4 rounded-xl border ${cardBg}`}>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <span className={`px-2 py-0.5 text-xs rounded border ${highlightBadge}`}>Produk R&D</span>
              Z-80 Simulator Core Logic
            </h4>
            <p className={`text-xs leading-relaxed ${textMuted}`}>
              Perangkat lunak edukatif berbasis web yang mengemulasikan perilaku internal mikroprosesor Zilog Z-80 secara visual, interaktif, dan real-time. Dirancang untuk pembelajaran mandiri (*self-paced learning*) mata kuliah Sistem Mikroprosesor.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-500">✨ Keunggulan Utama Media</h4>
            <ul className={`text-xs space-y-2 ${textMuted}`}>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span><strong>Tanpa Instalasi (*Cross-Platform*)</strong>: Dijalankan langsung melalui browser di laptop, desktop, maupun smartphone/tablet.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span><strong>Progressive Web App (PWA)</strong>: Dapat diinstal ke layar utama dan dijalankan dalam mode **Offline**.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span><strong>Visualisasi Real-Time</strong>: Perubahan register dan memori ditunjukkan dengan animasi flash warna secara langsung.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span><strong>AI Feedback Dua Tahap</strong>: Engine Linter lokal (skor 0-100) dan AI Deep Scan berbasis Google Gemini API.</span>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'bab2',
      number: 'BAB II',
      title: 'Pengenalan Antarmuka',
      icon: <Cpu className="w-4 h-4 text-purple-500" />,
      content: (
        <div className="space-y-4">
          <p className={`text-xs ${textMuted}`}>Antarmuka aplikasi dibagi menjadi 2 area utama: Area Kerja (Editor & Panel) dan Area Informasi (Register & Memori).</p>
          
          <div className="space-y-3">
            <div className={`p-3 rounded-lg border ${cardBg}`}>
              <h5 className="text-xs font-bold text-blue-400 mb-1">⚡ Control Panel (Toolbar Bawah)</h5>
              <p className={`text-xs ${textMuted}`}>Memuat tombol kontrol utama: <strong>Load</strong> (Compile & Load), <strong>Step</strong> (Eksekusi 1 baris), <strong>Run</strong> (Eksekusi penuh), <strong>Reset</strong> (Kembali ke 0000H), <strong>Contoh</strong> (Preset program), dan <strong>Speed Slider</strong>.</p>
            </div>

            <div className={`p-3 rounded-lg border ${cardBg}`}>
              <h5 className="text-xs font-bold text-emerald-400 mb-1">📝 Code Editor (Syntax Highlighting)</h5>
              <p className={`text-xs ${textMuted}`}>Tempat menulis kode assembly Z-80. Dilengkapi pewarnaan otomatis, nomor baris, penanda baris eksekusi, Undo/Redo, dan multi-file tab.</p>
            </div>

            <div className={`p-3 rounded-lg border ${cardBg}`}>
              <h5 className="text-xs font-bold text-amber-400 mb-1">📊 Register Dashboard & Flag Viewer</h5>
              <p className={`text-xs ${textMuted}`}>Menampilkan register A, B, C, D, E, H, L, F (Zero/Sign/Carry), SP, dan PC. Nilai register yang berubah akan **menyala kuning** selama 0,6 detik. Format dapat diubah ke HEX, DEC, atau BIN.</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'bab3',
      number: 'BAB III',
      title: 'Langkah Penggunaan',
      icon: <Layers className="w-4 h-4 text-emerald-500" />,
      content: (
        <div className="space-y-4">
          <ol className="space-y-3">
            <li className={`p-3 rounded-lg border ${cardBg} flex items-start gap-3`}>
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center flex-shrink-0">1</span>
              <div>
                <h5 className="text-xs font-bold mb-1">Tulis Kode Assembly</h5>
                <p className={`text-xs ${textMuted}`}>Tulis perintah assembly pada Code Editor. Gunakan penanda <code>ORG 0000H</code> dan akhiri program dengan <code>HALT</code>.</p>
              </div>
            </li>

            <li className={`p-3 rounded-lg border ${cardBg} flex items-start gap-3`}>
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0">2</span>
              <div>
                <h5 className="text-xs font-bold mb-1">Load Program (Ctrl + L)</h5>
                <p className={`text-xs ${textMuted}`}>Klik <strong>⚡ Load</strong>. Program akan dikompilasi ke memori dan PC di-set ke alamat 0000H.</p>
              </div>
            </li>

            <li className={`p-3 rounded-lg border ${cardBg} flex items-start gap-3`}>
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center flex-shrink-0">3</span>
              <div>
                <h5 className="text-xs font-bold mb-1">Eksekusi Step (Ctrl + S) / Run (Ctrl + R)</h5>
                <p className={`text-xs ${textMuted}`}>Gunakan <strong>Step</strong> untuk mengamati pergerakan register per baris, atau <strong>Run</strong> untuk menjalankan otomatis.</p>
              </div>
            </li>
          </ol>
        </div>
      )
    },
    {
      id: 'bab4',
      number: 'BAB IV',
      title: 'Pendukung & AI Analyzer',
      icon: <Sparkles className="w-4 h-4 text-amber-500" />,
      content: (
        <div className="space-y-4">
          <div className={`p-3 rounded-lg border ${cardBg}`}>
            <h5 className="text-xs font-bold text-purple-400 mb-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Engine Linter (Analisis Statis)
            </h5>
            <p className={`text-xs ${textMuted}`}>Mendeteksi secara instan kesalahan struktur seperti program tanpa `HALT`, potensi infinite loop, atau instruksi yang tidak pernah teresekusi (*Dead Code*), lengkap dengan Health Score 0–100.</p>
          </div>

          <div className={`p-3 rounded-lg border ${cardBg}`}>
            <h5 className="text-xs font-bold text-blue-400 mb-1 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5" /> AI Deep Scan (Google Gemini)
            </h5>
            <p className={`text-xs ${textMuted}`}>Klik <strong>Deep Scan (AI)</strong> pada panel AI Analyzer. Model kecerdasan buatan Gemini API akan menganalisis logika program Anda dan memberikan rekomendasi perbaikan pedagogis.</p>
          </div>
        </div>
      )
    },
    {
      id: 'bab5',
      number: 'BAB V',
      title: 'Modul Praktikum',
      icon: <Terminal className="w-4 h-4 text-cyan-500" />,
      content: (
        <div className="space-y-4">
          <p className={`text-xs ${textMuted}`}>Pilih modul praktikum di bawah ini dan klik <strong>Coba Kode Ini</strong> untuk memuat langsung ke editor:</p>

          {/* Praktikum 1 */}
          <div className={`p-3 rounded-xl border ${cardBg}`}>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-bold text-emerald-400">Praktikum 1: Penjumlahan Aritmatika</h5>
              <button
                onClick={() => handleTry(`ORG 0000H\n    LD A, 12H       ; A = 12H (18 desimal)\n    LD B, 24H       ; B = 24H (36 desimal)\n    ADD A, B        ; A = 12H + 24H = 36H\n    HALT`)}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium transition-colors"
              >
                <Play className="w-3 h-3" /> Coba Kode Ini
              </button>
            </div>
            <pre className={`p-2.5 rounded-lg text-[11px] font-mono border overflow-x-auto ${codeBg}`}>
              {`ORG 0000H\n    LD A, 12H       ; A = 12H (18 desimal)\n    LD B, 24H       ; B = 24H (36 desimal)\n    ADD A, B        ; A = 12H + 24H = 36H\n    HALT`}
            </pre>
          </div>

          {/* Praktikum 2 */}
          <div className={`p-3 rounded-xl border ${cardBg}`}>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-bold text-amber-400">Praktikum 2: Deteksi Carry Flag & Overflow</h5>
              <button
                onClick={() => handleTry(`ORG 0000H\n    LD A, 0FFH      ; A = 255 (maksimal 8-bit)\n    ADD A, 01H      ; A = 00H, Carry Flag = 1!\n    HALT`)}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium transition-colors"
              >
                <Play className="w-3 h-3" /> Coba Kode Ini
              </button>
            </div>
            <pre className={`p-2.5 rounded-lg text-[11px] font-mono border overflow-x-auto ${codeBg}`}>
              {`ORG 0000H\n    LD A, 0FFH      ; A = 255 (maksimal 8-bit)\n    ADD A, 01H      ; A = 00H, Carry Flag = 1!\n    HALT`}
            </pre>
          </div>

          {/* Praktikum 3 */}
          <div className={`p-3 rounded-xl border ${cardBg}`}>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-bold text-purple-400">Praktikum 3: Looping & Zero Flag</h5>
              <button
                onClick={() => handleTry(`ORG 0000H\n    LD B, 03H       ; Counter = 3\nLOOP:\n    DEC B           ; B--\n    JP NZ, LOOP     ; Ulangi jika B != 0\n    HALT`)}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium transition-colors"
              >
                <Play className="w-3 h-3" /> Coba Kode Ini
              </button>
            </div>
            <pre className={`p-2.5 rounded-lg text-[11px] font-mono border overflow-x-auto ${codeBg}`}>
              {`ORG 0000H\n    LD B, 03H       ; Counter = 3\nLOOP:\n    DEC B           ; B--\n    JP NZ, LOOP     ; Ulangi jika B != 0\n    HALT`}
            </pre>
          </div>
        </div>
      )
    },
    {
      id: 'bab6',
      number: 'BAB VI',
      title: 'Troubleshooting & Error',
      icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
      content: (
        <div className="space-y-4">
          <div className={`p-3 rounded-lg border ${cardBg}`}>
            <h5 className="text-xs font-bold text-red-400 mb-1">❌ Parse Error (Kesalahan Sintaks)</h5>
            <p className={`text-xs ${textMuted}`}>Terjadi jika ada salah eja perintah (misal `LOD` bukannya `LD`), nilai hex diawali huruf tanpa angka `0` (gunakan `0FFH`), atau lupa koma pemisah.</p>
          </div>

          <div className={`p-3 rounded-lg border ${cardBg}`}>
            <h5 className="text-xs font-bold text-amber-400 mb-1">🔄 Infinite Loop (Loop Tanpa Henti)</h5>
            <p className={`text-xs ${textMuted}`}>Jika program tidak pernah berhenti saat di-Run, periksa syarat perulangan `JP NZ` atau pastikan menyertakan perintah `HALT` di akhir program.</p>
          </div>
        </div>
      )
    }
  ];

  const currentChapter = chapters.find(c => c.id === activeChapter) || chapters[0];

  const filteredChapters = searchQuery.trim()
    ? chapters.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.number.toLowerCase().includes(searchQuery.toLowerCase()))
    : chapters;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-4xl h-[85vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${bg}`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between px-5 py-4 border-b ${isDark ? 'border-zinc-800 bg-zinc-950/50' : 'border-gray-100 bg-gray-50/50'}`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base flex items-center gap-2">
                Buku Panduan Penggunaan (Manual Book)
                <span className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${highlightBadge}`}>Z-80 Sim</span>
              </h3>
              <p className={`text-xs ${textMuted}`}>Panduan Operasional & Modul Praktikum Skripsi</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadMarkdown}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                isDark ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'border-gray-200 hover:bg-gray-100 text-gray-700'
              }`}
              title="Unduh file dokumen markdown"
            >
              <Download className="w-3.5 h-3.5" /> Unduh Dokumen
            </button>
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-gray-200 text-gray-500'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Split View */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Sidebar Left */}
          <div className={`w-56 sm:w-64 flex-shrink-0 border-r overflow-y-auto p-3 space-y-1 ${sidebarBg}`}>
            {/* Search input */}
            <div className="mb-3">
              <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}>
                <Search className={`w-3.5 h-3.5 ${textMuted}`} />
                <input
                  type="text"
                  placeholder="Cari Bab..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent outline-none text-xs"
                />
              </div>
            </div>

            {filteredChapters.map((chap) => {
              const isActive = chap.id === activeChapter;
              return (
                <button
                  key={chap.id}
                  onClick={() => setActiveChapter(chap.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-all ${
                    isActive
                      ? (isDark ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold' : 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold')
                      : (isDark ? 'hover:bg-zinc-800/60 text-zinc-400' : 'hover:bg-gray-200/60 text-gray-600')
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    {chap.icon}
                    <div className="truncate">
                      <span className="text-[10px] block opacity-70 font-mono">{chap.number}</span>
                      <span className="truncate">{chap.title}</span>
                    </div>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Main Content Right */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6">
            <div className="mb-4 pb-3 border-b border-zinc-800/50 flex items-center justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-blue-500">{currentChapter.number}</span>
                <h3 className="text-base font-bold">{currentChapter.title}</h3>
              </div>
            </div>

            {currentChapter.content}
          </div>

        </div>

      </div>
    </div>
  );
};
