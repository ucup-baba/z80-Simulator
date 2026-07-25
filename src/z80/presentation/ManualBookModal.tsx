import React, { useState } from 'react';
import { useTheme } from './ThemeContext';
import {
  FileText, X, Search, BookOpen, ChevronRight, Download, Play,
  Cpu, Layers, CheckCircle2, AlertTriangle, Terminal, Sparkles, HelpCircle, Code2, Database, Binary, Info
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
      title: 'Pendahuluan & Tujuan',
      icon: <BookOpen className="w-4 h-4 text-blue-500" />,
      content: (
        <div className="space-y-4">
          <div className={`p-4 rounded-xl border ${cardBg}`}>
            <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <span className={`px-2 py-0.5 text-xs rounded border ${highlightBadge}`}>Produk R&D</span>
              Z-80 Simulator Core Logic
            </h4>
            <p className={`text-xs leading-relaxed ${textMuted}`}>
              Perangkat lunak edukatif berbasis web yang mengemulasikan perilaku internal mikroprosesor Zilog Z-80 secara visual, interaktif, dan real-time. Dirancang untuk pembelajaran mandiri (<em>self-paced learning</em>) mata kuliah Sistem Mikroprosesor & Arsitektur Komputer.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-500">✨ Keunggulan Utama Media</h4>
            <ul className={`text-xs space-y-2 ${textMuted}`}>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span><strong>Cross-Platform & Tanpa Instalasi</strong>: Dijalankan langsung melalui browser tanpa memerlukan compiler eksternal.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span><strong>Progressive Web App (PWA)</strong>: Dapat diinstal ke layar utama dan dijalankan secara penuh dalam mode <strong>Offline</strong>.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span><strong>Visualisasi Hardware Real-Time</strong>: Perubahan nilai register, flag, dan memori RAM ditampilkan dengan efek animasi highlight warna.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span><strong>AI Feedback Dua Tahap</strong>: Linter Statis Lokal (Health Score 0–100) dan AI Deep Scan terintegrasi Google Gemini API.</span>
              </li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'bab2',
      number: 'BAB II',
      title: 'Pengenalan Antarmuka UI',
      icon: <Cpu className="w-4 h-4 text-purple-500" />,
      content: (
        <div className="space-y-4">
          <p className={`text-xs ${textMuted}`}>Antarmuka simulator dirancang secara modular dan intuitif, terbagi menjadi beberapa area kerja:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className={`p-3 rounded-lg border ${cardBg}`}>
              <h5 className="text-xs font-bold text-blue-400 mb-1 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5" /> Code Editor
              </h5>
              <p className={`text-xs ${textMuted}`}>Editor teks assembly dengan nomor baris, pewarnaan sintaks (syntax highlighting), penanda instruksi aktif, undo/redo, serta dukungan multi-tab.</p>
            </div>

            <div className={`p-3 rounded-lg border ${cardBg}`}>
              <h5 className="text-xs font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" /> CPU Register & Flag
              </h5>
              <p className={`text-xs ${textMuted}`}>Menampilkan register 8-bit (A, B, C, D, E, H, L), register pasangan 16-bit (BC, DE, HL), register khusus (SP, PC), serta Flag status (Zero, Carry, Sign).</p>
            </div>

            <div className={`p-3 rounded-lg border ${cardBg}`}>
              <h5 className="text-xs font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" /> Memory Editor
              </h5>
              <p className={`text-xs ${textMuted}`}>Panel untuk menginspeksi dan mengubah langsung isi memori RAM (0000H–FFFFH) baik dalam format Hexadecimal maupun ASCII.</p>
            </div>

            <div className={`p-3 rounded-lg border ${cardBg}`}>
              <h5 className="text-xs font-bold text-cyan-400 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Stack & Watch Panel
              </h5>
              <p className={`text-xs ${textMuted}`}>Menampilkan struktur memori LIFO Stack yang ditunjuk oleh Stack Pointer (SP) serta daftar variabel/register yang sedang dipantau.</p>
            </div>
          </div>

          <div className={`p-3 rounded-lg border ${cardBg}`}>
            <h5 className="text-xs font-bold text-purple-400 mb-1">⚡ Control Toolbar (Navigasi Eksekusi)</h5>
            <div className={`text-xs space-y-1 ${textMuted}`}>
              <p>• <strong>Load (Ctrl+L)</strong>: Mengkompilasi program ke memori dan mengatur PC ke 0000H.</p>
              <p>• <strong>Step (Ctrl+S)</strong>: Mengeksekusi tepat 1 instruksi untuk melacak pergerakan variabel.</p>
              <p>• <strong>Run (Ctrl+R)</strong>: Jalankan eksekusi otomatis secara terus-menerus hingga ketemu HALT.</p>
              <p>• <strong>Speed Slider</strong>: Mengatur kecepatan eksekusi simulasi (Lambat – Cepat).</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'bab3',
      number: 'BAB III',
      title: 'Aturan Sintaks Assembly',
      icon: <Terminal className="w-4 h-4 text-emerald-500" />,
      content: (
        <div className="space-y-4">
          <p className={`text-xs ${textMuted}`}>Untuk memastikan program assembly dapat dikompilasi tanpa error, perhatikan aturan sintaks berikut:</p>

          <div className="space-y-3">
            <div className={`p-3 rounded-lg border ${cardBg}`}>
              <h5 className="text-xs font-bold text-emerald-400 mb-1">1. Format Angka Hexadecimal</h5>
              <p className={`text-xs leading-relaxed ${textMuted}`}>
                Angka hex diakhiri huruf <strong>H</strong> (contoh: <code>05H</code>, <code>12H</code>). 
                <br />
                <span className="text-amber-400 font-semibold">Aturan Penting:</span> Jika angka hex diawali dengan huruf (A–F), wajib ditambahi angka <code>0</code> di depannya. Contoh: <code>0FFH</code> (bukan <code>FFH</code>), <code>0ABH</code> (bukan <code>ABH</code>).
              </p>
            </div>

            <div className={`p-3 rounded-lg border ${cardBg}`}>
              <h5 className="text-xs font-bold text-blue-400 mb-1">2. Alamat Memori (Indirect Addressing)</h5>
              <p className={`text-xs leading-relaxed ${textMuted}`}>
                Pengaksesan lokasi memori menggunakan tanda kurung siku/biasa. Contoh: <code>(HL)</code> mengakses isi memori yang alamatnya tersimpan di register HL. <code>LD A, (0050H)</code> membaca isi RAM alamat 0050H.
              </p>
            </div>

            <div className={`p-3 rounded-lg border ${cardBg}`}>
              <h5 className="text-xs font-bold text-purple-400 mb-1">3. Label dan Komentar</h5>
              <p className={`text-xs leading-relaxed ${textMuted}`}>
                • <strong>Label</strong> diakhiri dengan titik dua (<code>LOOP:</code>). Digunakan sebagai target jump.
                <br />
                • <strong>Komentar</strong> diawali dengan titik koma (<code>; ini komentar</code>). Karakter setelah titik koma diabaikan oleh parser.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'bab4',
      number: 'BAB IV',
      title: 'Langkah Penggunaan & Evaluasi',
      icon: <Layers className="w-4 h-4 text-cyan-500" />,
      content: (
        <div className="space-y-4">
          <ol className="space-y-3">
            <li className={`p-3 rounded-lg border ${cardBg} flex items-start gap-3`}>
              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs flex items-center justify-center flex-shrink-0">1</span>
              <div>
                <h5 className="text-xs font-bold mb-1">Menulis & Memuat Kode</h5>
                <p className={`text-xs ${textMuted}`}>Ketik program pada Code Editor atau pilih preset pada dropdown <strong>Contoh Program</strong>. Klik tombol <strong>⚡ Load</strong> untuk kompilasi.</p>
              </div>
            </li>

            <li className={`p-3 rounded-lg border ${cardBg} flex items-start gap-3`}>
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0">2</span>
              <div>
                <h5 className="text-xs font-bold mb-1">Simulasi & Penelusuran</h5>
                <p className={`text-xs ${textMuted}`}>Gunakan <strong>Step</strong> untuk eksekusi per baris. amati perubahan nilai register yang berwarna kuning serta perubahan indikator Flag (Z, C, S).</p>
              </div>
            </li>

            <li className={`p-3 rounded-lg border ${cardBg} flex items-start gap-3`}>
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center flex-shrink-0">3</span>
              <div>
                <h5 className="text-xs font-bold mb-1">Evaluasi Kode dengan AI Analyzer</h5>
                <p className={`text-xs ${textMuted}`}>Buka panel <strong>AI Analyzer</strong> untuk melihat Health Score (0-100), analisis linter statis, atau klik <strong>Deep Scan (AI)</strong> untuk saran perbaikan tingkat lanjut dari Gemini API.</p>
              </div>
            </li>
          </ol>
        </div>
      )
    },
    {
      id: 'bab5',
      number: 'BAB V',
      title: 'Modul Praktikum Mandiri',
      icon: <Binary className="w-4 h-4 text-emerald-500" />,
      content: (
        <div className="space-y-4">
          <p className={`text-xs ${textMuted}`}>Klik <strong>Coba Kode Ini</strong> pada modul di bawah ini untuk memuat program praktikum secara instan ke editor:</p>

          {/* Praktikum 1 */}
          <div className={`p-3 rounded-xl border ${cardBg}`}>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-bold text-emerald-400">Modul 1: Penjumlahan 8-Bit</h5>
              <button
                onClick={() => handleTry(`ORG 0000H\n    LD A, 12H       ; Accumulator A = 12H\n    LD B, 24H       ; Register B = 24H\n    ADD A, B        ; A = 12H + 24H = 36H\n    HALT`)}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium transition-colors"
              >
                <Play className="w-3 h-3" /> Coba Kode Ini
              </button>
            </div>
            <pre className={`p-2.5 rounded-lg text-[11px] font-mono border overflow-x-auto ${codeBg}`}>
              {`ORG 0000H\n    LD A, 12H       ; Accumulator A = 12H\n    LD B, 24H       ; Register B = 24H\n    ADD A, B        ; A = 12H + 24H = 36H\n    HALT`}
            </pre>
          </div>

          {/* Praktikum 2 */}
          <div className={`p-3 rounded-xl border ${cardBg}`}>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-bold text-amber-400">Modul 2: Carry Flag & Overflow Trap</h5>
              <button
                onClick={() => handleTry(`ORG 0000H\n    LD A, 0FFH      ; A = 255 (Batas 8-bit)\n    ADD A, 01H      ; Overflow -> A = 00H, Carry Flag = 1!\n    HALT`)}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium transition-colors"
              >
                <Play className="w-3 h-3" /> Coba Kode Ini
              </button>
            </div>
            <pre className={`p-2.5 rounded-lg text-[11px] font-mono border overflow-x-auto ${codeBg}`}>
              {`ORG 0000H\n    LD A, 0FFH      ; A = 255 (Batas 8-bit)\n    ADD A, 01H      ; Overflow -> A = 00H, Carry Flag = 1!\n    HALT`}
            </pre>
          </div>

          {/* Praktikum 3 */}
          <div className={`p-3 rounded-xl border ${cardBg}`}>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-bold text-purple-400">Modul 3: Looping & Zero Flag</h5>
              <button
                onClick={() => handleTry(`ORG 0000H\n    LD B, 05H       ; Counter = 5\nLOOP:\n    DEC B           ; Kurangi B\n    JP NZ, LOOP     ; Ulangi jika B != 0 (Zero Flag = 0)\n    HALT`)}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium transition-colors"
              >
                <Play className="w-3 h-3" /> Coba Kode Ini
              </button>
            </div>
            <pre className={`p-2.5 rounded-lg text-[11px] font-mono border overflow-x-auto ${codeBg}`}>
              {`ORG 0000H\n    LD B, 05H       ; Counter = 5\nLOOP:\n    DEC B           ; Kurangi B\n    JP NZ, LOOP     ; Ulangi jika B != 0 (Zero Flag = 0)\n    HALT`}
            </pre>
          </div>

          {/* Praktikum 4 */}
          <div className={`p-3 rounded-xl border ${cardBg}`}>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-xs font-bold text-cyan-400">Modul 4: Operasi Logika AND Masking</h5>
              <button
                onClick={() => handleTry(`ORG 0000H\n    LD A, 3FH       ; A = 00111111B\n    AND 0FH         ; Isolasi 4 bit bawah -> A = 0FH\n    HALT`)}
                className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-medium transition-colors"
              >
                <Play className="w-3 h-3" /> Coba Kode Ini
              </button>
            </div>
            <pre className={`p-2.5 rounded-lg text-[11px] font-mono border overflow-x-auto ${codeBg}`}>
              {`ORG 0000H\n    LD A, 3FH       ; A = 00111111B\n    AND 0FH         ; Isolasi 4 bit bawah -> A = 0FH\n    HALT`}
            </pre>
          </div>
        </div>
      )
    },
    {
      id: 'bab6',
      number: 'BAB VI',
      title: 'Troubleshooting & Pesan Error',
      icon: <AlertTriangle className="w-4 h-4 text-red-500" />,
      content: (
        <div className="space-y-4">
          <div className={`p-3 rounded-lg border ${cardBg}`}>
            <h5 className="text-xs font-bold text-red-400 mb-1">❌ Parse error / Invalid operand</h5>
            <p className={`text-xs ${textMuted}`}>Disebabkan oleh kesalahan penulisan instruksi, nilai operand 8-bit melebihi 255 (<code>0FFH</code>), atau penulisan angka hex tanpa awalan <code>0</code> jika diawali huruf (misal <code>ABH</code> harus ditulis <code>0ABH</code>).</p>
          </div>

          <div className={`p-3 rounded-lg border ${cardBg}`}>
            <h5 className="text-xs font-bold text-amber-400 mb-1">🔄 Infinite Loop (Program Menggantung)</h5>
            <p className={`text-xs ${textMuted}`}>Terjadi jika instruksi <code>JP</code> melompat terus tanpa batas, atau tidak ada instruksi <code>HALT</code> di akhir program. Gunakan tombol <strong>Reset</strong> untuk menghentikan.</p>
          </div>

          <div className={`p-3 rounded-lg border ${cardBg}`}>
            <h5 className="text-xs font-bold text-blue-400 mb-1">⚠️ No Program Loaded</h5>
            <p className={`text-xs ${textMuted}`}>Muncul saat menekan tombol <strong>Step/Run</strong> tetapi belum pernah menekan tombol <strong>Load</strong> atau proses Load sebelumnya mengalami error.</p>
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
              <p className={`text-xs ${textMuted}`}>Panduan Operasional, Aturan Sintaks & Modul Praktikum Skripsi</p>
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
