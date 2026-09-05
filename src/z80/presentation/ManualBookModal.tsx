import React, { useState } from 'react';
import { useTheme } from './ThemeContext';
import {
  FileText, X, Search, BookOpen, ChevronRight, ChevronDown, Download, Play,
  Cpu, Layers, CheckCircle2, AlertTriangle, Terminal, Sparkles, HelpCircle, Code2, Database, Binary, Info, Library,
  Zap, XCircle, RefreshCw, Lightbulb
} from 'lucide-react';
import { examplePrograms } from '../data/examplePrograms';

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  const handleDownloadPDF = () => {
    const a = document.createElement('a');
    a.href = '/MANUAL_BOOK_Z80_SIMULATOR.pdf';
    a.download = 'MANUAL_BOOK_Z80_SIMULATOR.pdf';
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
            <p className={`text-sm leading-relaxed ${textMuted}`}>
              Perangkat lunak edukatif berbasis web yang mengemulasikan perilaku internal mikroprosesor Zilog Z-80 secara visual, interaktif, dan real-time. Dirancang untuk pembelajaran mandiri (<em>self-paced learning</em>) mata kuliah Sistem Mikroprosesor & Arsitektur Komputer.
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-bold uppercase tracking-wider text-blue-500">✨ Keunggulan Utama Media</h4>
            <ul className={`text-sm space-y-2 ${textMuted}`}>
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
          <p className={`text-sm ${textMuted}`}>Antarmuka simulator dirancang secara modular dan intuitif, terbagi menjadi beberapa area kerja:</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className={`p-3 rounded-lg border ${cardBg}`}>
              <h5 className="text-sm font-bold text-blue-400 mb-1 flex items-center gap-1.5">
                <Code2 className="w-3.5 h-3.5" /> Code Editor
              </h5>
              <p className={`text-sm ${textMuted}`}>Editor teks assembly dengan nomor baris, pewarnaan sintaks (syntax highlighting), penanda instruksi aktif, undo/redo, serta dukungan multi-tab.</p>
            </div>

            <div className={`p-3 rounded-lg border ${cardBg}`}>
              <h5 className="text-sm font-bold text-amber-400 mb-1 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" /> CPU Register & Flag
              </h5>
              <p className={`text-sm ${textMuted}`}>Menampilkan register 8-bit (A, B, C, D, E, H, L), register pasangan 16-bit (BC, DE, HL), register khusus (SP, PC), serta Flag status (Zero, Carry, Sign).</p>
            </div>

            <div className={`p-3 rounded-lg border ${cardBg}`}>
              <h5 className="text-sm font-bold text-emerald-400 mb-1 flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5" /> Memory Editor
              </h5>
              <p className={`text-sm ${textMuted} mb-2`}>Panel untuk menginspeksi dan mengubah langsung isi memori RAM (0000H–FFFFH) baik dalam format Hexadecimal maupun ASCII.</p>
              
              <details className={`mt-2 rounded-lg border overflow-hidden group ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-gray-100/80 border-gray-200'}`}>
                <summary className={`px-2.5 py-2 text-xs font-bold flex items-center gap-1.5 cursor-pointer select-none transition-colors ${isDark ? 'text-emerald-300 hover:bg-zinc-800/60' : 'text-emerald-600 hover:bg-gray-200/60'}`}>
                  <ChevronRight className="w-3 h-3 transition-transform group-open:rotate-90" />
                  <Info className="w-3 h-3" /> Cara Input Data Langsung di Memory Editor
                </summary>
                <div className="px-2.5 pb-2.5">
                  <ol className={`text-xs space-y-1.5 ${textMuted} list-decimal list-inside`}>
                    <li>Buka tab <strong>Memory Editor</strong> di panel kiri (ikon <em>Database</em>).</li>
                    <li>Navigasi ke halaman memori yang diinginkan menggunakan tombol <strong>◀ Prev / Next ▶</strong>, atau ketik alamat hex di kolom <strong>Jump to Address</strong> lalu tekan Enter.</li>
                    <li><strong>Double-click</strong> (klik dua kali) pada sel byte yang ingin diubah — sel akan berubah menjadi <em>input field</em>.</li>
                    <li>Ketik nilai hexadecimal baru (2 digit, contoh: <code className={`px-1 py-0.5 rounded ${isDark ? 'bg-zinc-800 text-emerald-400' : 'bg-gray-200 text-emerald-700'}`}>FF</code>, <code className={`px-1 py-0.5 rounded ${isDark ? 'bg-zinc-800 text-emerald-400' : 'bg-gray-200 text-emerald-700'}`}>0A</code>, <code className={`px-1 py-0.5 rounded ${isDark ? 'bg-zinc-800 text-emerald-400' : 'bg-gray-200 text-emerald-700'}`}>42</code>).</li>
                    <li>Tekan <strong>Enter</strong> untuk menyimpan perubahan, atau <strong>Esc</strong> untuk membatalkan.</li>
                    <li>Perubahan langsung terlihat di panel <strong>Memory Viewer</strong> di sisi kanan.</li>
                  </ol>
                  <p className={`text-[11px] mt-2 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                    💡 Tip: Nilai yang valid adalah 00–FF (0–255 desimal). Setiap sel merepresentasikan 1 byte (8-bit) memori.
                  </p>
                </div>
              </details>
            </div>

            <div className={`p-3 rounded-lg border ${cardBg}`}>
              <h5 className="text-sm font-bold text-cyan-400 mb-1 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> Stack & Watch Panel
              </h5>
              <p className={`text-sm ${textMuted}`}>Menampilkan struktur memori LIFO Stack yang ditunjuk oleh Stack Pointer (SP) serta daftar variabel/register yang sedang dipantau.</p>
            </div>
          </div>

          <div className={`p-3 rounded-lg border ${cardBg}`}>
            <h5 className="text-sm font-bold text-purple-400 mb-1 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> Control Toolbar (Navigasi Eksekusi)</h5>
            <div className={`text-sm space-y-1 ${textMuted}`}>
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
          <p className={`text-sm ${textMuted}`}>Untuk memastikan program assembly dapat dikompilasi tanpa error, perhatikan aturan sintaks berikut:</p>

          <div className="space-y-3">
            <div className={`p-3 rounded-lg border ${cardBg}`}>
              <h5 className="text-sm font-bold text-emerald-400 mb-1">1. Format Angka Hexadecimal</h5>
              <p className={`text-sm leading-relaxed ${textMuted}`}>
                Angka hex diakhiri huruf <strong>H</strong> (contoh: <code>05H</code>, <code>12H</code>). 
                <br />
                <span className="text-amber-400 font-semibold">Aturan Penting:</span> Jika angka hex diawali dengan huruf (A–F), wajib ditambahi angka <code>0</code> di depannya. Contoh: <code>0FFH</code> (bukan <code>FFH</code>), <code>0ABH</code> (bukan <code>ABH</code>).
              </p>
            </div>

            <div className={`p-3 rounded-lg border ${cardBg}`}>
              <h5 className="text-sm font-bold text-blue-400 mb-1">2. Alamat Memori (Indirect Addressing)</h5>
              <p className={`text-sm leading-relaxed ${textMuted}`}>
                Pengaksesan lokasi memori menggunakan tanda kurung siku/biasa. Contoh: <code>(HL)</code> mengakses isi memori yang alamatnya tersimpan di register HL. <code>LD A, (0050H)</code> membaca isi RAM alamat 0050H.
              </p>
            </div>

            <div className={`p-3 rounded-lg border ${cardBg}`}>
              <h5 className="text-sm font-bold text-purple-400 mb-1">3. Label dan Komentar</h5>
              <p className={`text-sm leading-relaxed ${textMuted}`}>
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
                <h5 className="text-sm font-bold mb-1">Menulis & Memuat Kode</h5>
                <p className={`text-sm ${textMuted}`}>Ketik program pada Code Editor atau pilih preset pada dropdown <strong>Contoh Program</strong>. Klik tombol <strong>Load</strong> untuk kompilasi.</p>
              </div>
            </li>

            <li className={`p-3 rounded-lg border ${cardBg} flex items-start gap-3`}>
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0">2</span>
              <div>
                <h5 className="text-sm font-bold mb-1">Simulasi & Penelusuran</h5>
                <p className={`text-sm ${textMuted}`}>Gunakan <strong>Step</strong> untuk eksekusi per baris. amati perubahan nilai register yang berwarna kuning serta perubahan indikator Flag (Z, C, S).</p>
              </div>
            </li>

            <li className={`p-3 rounded-lg border ${cardBg} flex items-start gap-3`}>
              <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 font-bold text-xs flex items-center justify-center flex-shrink-0">3</span>
              <div>
                <h5 className="text-sm font-bold mb-1">Evaluasi Kode dengan AI Analyzer</h5>
                <p className={`text-sm ${textMuted}`}>Buka panel <strong>AI Analyzer</strong> untuk melihat Health Score (0-100), analisis linter statis, atau klik <strong>Deep Scan (AI)</strong> untuk saran perbaikan tingkat lanjut dari Gemini API.</p>
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
          <p className={`text-sm ${textMuted}`}>Klik <strong>Coba Kode Ini</strong> pada modul di bawah ini untuk memuat program praktikum secara instan ke editor:</p>

          {/* Praktikum 1 */}
          <div className={`p-3 rounded-xl border ${cardBg}`}>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-bold text-emerald-400">Modul 1: Penjumlahan 8-Bit</h5>
              <button
                onClick={() => handleTry(`ORG 0000H\n    LD A, 12H       ; Accumulator A = 12H\n    LD B, 24H       ; Register B = 24H\n    ADD A, B        ; A = 12H + 24H = 36H\n    HALT`)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
              >
                <Play className="w-3.5 h-3.5" /> Coba Kode Ini
              </button>
            </div>
            <pre className={`p-2.5 rounded-lg text-xs font-mono border overflow-x-auto ${codeBg}`}>
              {`ORG 0000H\n    LD A, 12H       ; Accumulator A = 12H\n    LD B, 24H       ; Register B = 24H\n    ADD A, B        ; A = 12H + 24H = 36H\n    HALT`}
            </pre>
          </div>

          {/* Praktikum 2 */}
          <div className={`p-3 rounded-xl border ${cardBg}`}>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-bold text-amber-400">Modul 2: Carry Flag & Overflow Trap</h5>
              <button
                onClick={() => handleTry(`ORG 0000H\n    LD A, 0FFH      ; A = 255 (Batas 8-bit)\n    ADD A, 01H      ; Overflow -> A = 00H, Carry Flag = 1!\n    HALT`)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
              >
                <Play className="w-3.5 h-3.5" /> Coba Kode Ini
              </button>
            </div>
            <pre className={`p-2.5 rounded-lg text-xs font-mono border overflow-x-auto ${codeBg}`}>
              {`ORG 0000H\n    LD A, 0FFH      ; A = 255 (Batas 8-bit)\n    ADD A, 01H      ; Overflow -> A = 00H, Carry Flag = 1!\n    HALT`}
            </pre>
          </div>

          {/* Praktikum 3 */}
          <div className={`p-3 rounded-xl border ${cardBg}`}>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-bold text-purple-400">Modul 3: Looping & Zero Flag</h5>
              <button
                onClick={() => handleTry(`ORG 0000H\n    LD B, 05H       ; Counter = 5\nLOOP:\n    DEC B           ; Kurangi B\n    JP NZ, LOOP     ; Ulangi jika B != 0 (Zero Flag = 0)\n    HALT`)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
              >
                <Play className="w-3.5 h-3.5" /> Coba Kode Ini
              </button>
            </div>
            <pre className={`p-2.5 rounded-lg text-xs font-mono border overflow-x-auto ${codeBg}`}>
              {`ORG 0000H\n    LD B, 05H       ; Counter = 5\nLOOP:\n    DEC B           ; Kurangi B\n    JP NZ, LOOP     ; Ulangi jika B != 0 (Zero Flag = 0)\n    HALT`}
            </pre>
          </div>

          {/* Praktikum 4 */}
          <div className={`p-3 rounded-xl border ${cardBg}`}>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-bold text-cyan-400">Modul 4: Operasi Logika AND Masking</h5>
              <button
                onClick={() => handleTry(`ORG 0000H\n    LD A, 3FH       ; A = 00111111B\n    AND 0FH         ; Isolasi 4 bit bawah -> A = 0FH\n    HALT`)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
              >
                <Play className="w-3.5 h-3.5" /> Coba Kode Ini
              </button>
            </div>
            <pre className={`p-2.5 rounded-lg text-xs font-mono border overflow-x-auto ${codeBg}`}>
              {`ORG 0000H\n    LD A, 3FH       ; A = 00111111B\n    AND 0FH         ; Isolasi 4 bit bawah -> A = 0FH\n    HALT`}
            </pre>
          </div>

          {/* Praktikum 5: Stack & Subrutin */}
          <div className={`p-3 rounded-xl border ${cardBg}`}>
            <div className="flex items-center justify-between mb-2">
              <h5 className="text-sm font-bold text-pink-400">Modul 5: Operasi Stack & Subrutin (PUSH / POP / CALL / RET)</h5>
              <button
                onClick={() => handleTry(`ORG 0000H\n    LD SP, 1000H    ; Inisialisasi Stack Pointer (SP)\n    LD BC, 1234H    ; BC = 1234H\n    PUSH BC         ; Simpan BC ke Stack (RAM[0FFFH]=12H, RAM[0FFEH]=34H)\n    POP HL          ; Ambil data teratas ke HL (HL = 1234H)\n    CALL SUB1       ; Panggil Subrutin SUB1\n    HALT\n\nSUB1:\n    LD A, 0FFH\n    RET             ; Kembali dari subrutin`)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
              >
                <Play className="w-3.5 h-3.5" /> Coba Kode Ini
              </button>
            </div>
            <pre className={`p-2.5 rounded-lg text-xs font-mono border overflow-x-auto ${codeBg}`}>
              {`ORG 0000H\n    LD SP, 1000H    ; Inisialisasi Stack Pointer (SP)\n    LD BC, 1234H    ; BC = 1234H\n    PUSH BC         ; Simpan BC ke Stack (RAM[0FFFH]=12H, RAM[0FFEH]=34H)\n    POP HL          ; Ambil data teratas ke HL (HL = 1234H)\n    CALL SUB1       ; Panggil Subrutin SUB1\n    HALT\n\nSUB1:\n    LD A, 0FFH\n    RET             ; Kembali dari subrutin`}
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
            <h5 className="text-sm font-bold text-red-400 mb-1 flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> Parse error / Invalid operand</h5>
            <p className={`text-sm ${textMuted}`}>Disebabkan oleh kesalahan penulisan instruksi, nilai operand 8-bit melebihi 255 (<code>0FFH</code>), atau penulisan angka hex tanpa awalan <code>0</code> jika diawali huruf (misal <code>ABH</code> harus ditulis <code>0ABH</code>).</p>
          </div>

          <div className={`p-3 rounded-lg border ${cardBg}`}>
            <h5 className="text-sm font-bold text-amber-400 mb-1 flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" /> Infinite Loop (Program Menggantung)</h5>
            <p className={`text-sm ${textMuted}`}>Terjadi jika instruksi <code>JP</code> melompat terus tanpa batas, atau tidak ada instruksi <code>HALT</code> di akhir program. Gunakan tombol <strong>Reset</strong> untuk menghentikan.</p>
          </div>

          <div className={`p-3 rounded-lg border ${cardBg}`}>
            <h5 className="text-sm font-bold text-blue-400 mb-1 flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> No Program Loaded</h5>
            <p className={`text-sm ${textMuted}`}>Muncul saat menekan tombol <strong>Step/Run</strong> tetapi belum pernah menekan tombol <strong>Load</strong> atau proses Load sebelumnya mengalami error.</p>
          </div>
        </div>
      )
    },
    {
      id: 'bab7',
      number: 'BAB VII',
      title: 'Referensi Contoh Program',
      icon: <Library className="w-4 h-4 text-indigo-500" />,
      content: (
        <div className="space-y-4">
          <p className={`text-sm ${textMuted}`}>
            Kumpulan lengkap contoh program assembly Z-80 yang tersedia di simulator. Klik <strong>Muat ke Editor</strong> untuk langsung memuat kode ke Code Editor.
          </p>

          {examplePrograms.map((prog) => (
            <div key={prog.id} className={`p-4 rounded-xl border ${cardBg}`}>
              <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <h5 className="text-sm font-bold">{prog.title}</h5>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    prog.difficulty === 'mudah'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : prog.difficulty === 'sedang'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                  }`}>
                    {prog.difficulty}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-xs ${isDark ? 'bg-zinc-700/50 text-zinc-400' : 'bg-gray-200 text-gray-500'}`}>
                    {prog.category}
                  </span>
                </div>
                <button
                  onClick={() => handleTry(prog.code)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors shadow-sm hover:shadow-md"
                >
                  <Play className="w-3.5 h-3.5" /> Muat ke Editor
                </button>
              </div>
              <p className={`text-sm mb-2 ${textMuted}`}>{prog.description}</p>
              <div className={`text-xs mb-2 px-3 py-1.5 rounded-lg border ${isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>
                <Lightbulb className="w-3.5 h-3.5 inline" /> <strong>Tujuan Belajar:</strong> {prog.learningObjective}
              </div>
              <details className="group">
                <summary className={`text-xs font-medium cursor-pointer select-none ${isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-gray-500 hover:text-gray-700'} transition-colors`}>
                  <FileText className="w-3.5 h-3.5 inline mr-0.5" /> Lihat Preview Kode
                </summary>
                <pre className={`mt-2 p-3 rounded-lg text-xs font-mono border overflow-x-auto whitespace-pre-wrap ${codeBg}`}>
                  {prog.code}
                </pre>
              </details>
            </div>
          ))}
        </div>
      )
    }
  ];

  const currentChapter = chapters.find(c => c.id === activeChapter) || chapters[0];

  const filteredChapters = searchQuery.trim()
    ? chapters.filter(c => c.title.toLowerCase().includes(searchQuery.toLowerCase()) || c.number.toLowerCase().includes(searchQuery.toLowerCase()))
    : chapters;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm pointer-events-auto">
      <div className={`w-full max-w-4xl h-[85vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden ${bg}`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between px-3.5 py-3 sm:px-5 sm:py-4 border-b gap-2 ${isDark ? 'border-zinc-800 bg-zinc-950/50' : 'border-gray-100 bg-gray-50/50'}`}>
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center border border-blue-500/30 flex-shrink-0">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-xs sm:text-sm md:text-base truncate leading-tight">
                  Buku Panduan Penggunaan
                </h3>
                <span className={`hidden sm:inline-flex px-2 py-0.5 text-[10px] font-semibold rounded-full border flex-shrink-0 ${highlightBadge}`}>Z-80 Sim</span>
              </div>
              <p className={`text-[11px] sm:text-xs truncate ${textMuted}`}>Panduan Operasional, Sintaks & Modul Praktikum</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={handleDownloadPDF}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                isDark ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'border-gray-200 hover:bg-gray-100 text-gray-700'
              }`}
              title="Unduh Manual Book versi PDF"
            >
              <Download className="w-3.5 h-3.5 text-blue-500" />
              <span className="hidden sm:inline">Unduh PDF</span>
            </button>
            <button
              onClick={onClose}
              className={`p-1.5 sm:p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-gray-200 text-gray-500'}`}
              aria-label="Tutup modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mobile Chapter Selector (Visible only on mobile < md) */}
        <div className={`md:hidden border-b px-3.5 py-2 ${isDark ? 'bg-zinc-950/70 border-zinc-800' : 'bg-gray-100/80 border-gray-200'}`}>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`w-full flex items-center justify-between p-2 rounded-xl border text-xs transition-all ${
              isDark ? 'bg-zinc-900 border-zinc-700/80 text-zinc-200' : 'bg-white border-gray-300 text-gray-800 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2 truncate min-w-0">
              <span className="flex-shrink-0">{currentChapter.icon}</span>
              <span className="font-mono text-blue-500 font-bold flex-shrink-0">{currentChapter.number}:</span>
              <span className="truncate font-semibold">{currentChapter.title}</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-medium text-blue-500 flex-shrink-0 ml-1.5">
              <span>{isMobileMenuOpen ? 'Tutup' : 'Pilih Bab'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
            </div>
          </button>

          {/* Collapsible Chapter List Dropdown for Mobile */}
          {isMobileMenuOpen && (
            <div className={`mt-2.5 p-2 rounded-xl border space-y-1 max-h-64 overflow-y-auto ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-lg'}`}>
              <div className="mb-2">
                <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-gray-50 border-gray-200'}`}>
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
                    onClick={() => {
                      setActiveChapter(chap.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left text-xs transition-all ${
                      isActive
                        ? (isDark ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 font-semibold' : 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold')
                        : (isDark ? 'hover:bg-zinc-800/60 text-zinc-400' : 'hover:bg-gray-100 text-gray-600')
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {chap.icon}
                      <span className="font-mono text-[10px] opacity-75">{chap.number}</span>
                      <span className="truncate">{chap.title}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Body Split View */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Sidebar Left (Desktop only: md and above) */}
          <div className={`hidden md:block w-64 flex-shrink-0 border-r overflow-y-auto p-3 space-y-1 ${sidebarBg}`} style={{ WebkitOverflowScrolling: 'touch' }}>
            {/* Search input */}
            <div className="mb-3">
              <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-sm ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200'}`}>
                <Search className={`w-3.5 h-3.5 ${textMuted}`} />
                <input
                  type="text"
                  placeholder="Cari Bab..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent outline-none text-sm"
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

            {/* Start Simulation Button at bottom of chapter list */}
            <div className="pt-3 mt-3 border-t border-zinc-800/40">
              <button
                onClick={onClose}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all hover:scale-102"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Ayo Mulai Simulasi</span>
              </button>
            </div>
          </div>

          {/* Main Content Right (Full width on mobile, right side on desktop) */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6" style={{ WebkitOverflowScrolling: 'touch' }}>
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
