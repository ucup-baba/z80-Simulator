import React from 'react';
import { useTheme } from './ThemeContext';
import type { ValidatorPresetProfile } from '../data/validationInstrumentsData';
import { FileText, Sparkles, CheckCircle2, Cpu, PenTool, Send, BookOpen, X, ChevronRight } from 'lucide-react';

interface ValidationWelcomeModalProps {
  isOpen: boolean;
  profile: ValidatorPresetProfile;
  onClose: () => void;
  onStartValidation: () => void;
}

export const ValidationWelcomeModal: React.FC<ValidationWelcomeModalProps> = ({
  isOpen,
  profile,
  onClose,
  onStartValidation,
}) => {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  const bg = isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200';
  const text = isDark ? 'text-zinc-100' : 'text-gray-900';
  const textMuted = isDark ? 'text-zinc-400' : 'text-gray-600';
  const cardBg = isDark ? 'bg-zinc-800/60 border-zinc-700/60' : 'bg-blue-50/50 border-blue-100';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-black/70 backdrop-blur-md animate-fade-in">
      <div className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${bg}`}>
        
        {/* Decorative Top Banner */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center shadow-lg">
                <Cpu className="w-6 h-6 text-white" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/20 border border-white/30 text-blue-100">
                  {profile.formalTitle}
                </span>
                <h2 className="text-xl font-extrabold mt-0.5 tracking-tight text-white">
                  Permohonan Validasi Media R&D
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
              title="Tutup Halaman Sambutan"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5" style={{ WebkitOverflowScrolling: 'touch' }}>
          
          {/* Formal Greeting Letter */}
          <div className={`p-4 sm:p-5 rounded-2xl border ${cardBg}`}>
            <h3 className="text-base font-bold text-blue-600 dark:text-blue-400 mb-2">
              Yth. {profile.salutation}
            </h3>
            <p className={`text-xs sm:text-sm leading-relaxed ${textMuted}`}>
              Dengan hormat, sehubungan dengan penyusunan produk **Web Simulator Z-80 Terintegrasi Asisten AI** untuk mata kuliah <em>Sistem Mikroprosesor (Pendidikan Teknik Elektro UNY)</em>, kami memohon kesediaan Bapak/Ibu/Saudara untuk memberikan masukan, saran, serta penilaian kelayakan melalui lembar validasi ini.
            </p>
          </div>

          {/* 4 Steps Guide */}
          <div>
            <h4 className={`text-xs font-bold uppercase tracking-wider ${textMuted} mb-3 flex items-center gap-1.5`}>
              <Sparkles className="w-4 h-4 text-amber-500" />
              Petunjuk Teknis Pengisian & Evaluasi (4 Langkah)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              
              {/* Step 1 */}
              <div className={`p-3 sm:p-3.5 rounded-xl border ${isDark ? 'bg-zinc-800/40 border-zinc-700/50' : 'bg-gray-50 border-gray-200'} flex items-start gap-3`}>
                <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                  1
                </div>
                <div>
                  <h5 className={`text-xs font-bold ${text}`}>Eksplorasi Simulator</h5>
                  <p className={`text-[11px] ${textMuted} mt-0.5 leading-snug`}>
                    Buka <strong>Buku Panduan</strong> di panel kiri simulator untuk menguji fitur & eksekusi kode Z-80.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className={`p-3 sm:p-3.5 rounded-xl border ${isDark ? 'bg-zinc-800/40 border-zinc-700/50' : 'bg-gray-50 border-gray-200'} flex items-start gap-3`}>
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-purple-500/20">
                  2
                </div>
                <div>
                  <h5 className={`text-xs font-bold ${text}`}>Isi Butir Penilaian</h5>
                  <p className={`text-[11px] ${textMuted} mt-0.5 leading-snug`}>
                    Pilih skala penilaian (1-4) & berikan saran perbaikan pada panel validasi di sebelah kanan.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className={`p-3 sm:p-3.5 rounded-xl border ${isDark ? 'bg-zinc-800/40 border-zinc-700/50' : 'bg-gray-50 border-gray-200'} flex items-start gap-3`}>
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-amber-500/20">
                  3
                </div>
                <div>
                  <h5 className={`text-xs font-bold ${text}`}>Tanda Tangan Digital</h5>
                  <p className={`text-[11px] ${textMuted} mt-0.5 leading-snug`}>
                    Gunakan pad tanda tangan digital di bagian bawah lembar validasi untuk mengesahkan pengujian.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className={`p-3 sm:p-3.5 rounded-xl border ${isDark ? 'bg-zinc-800/40 border-zinc-700/50' : 'bg-gray-50 border-gray-200'} flex items-start gap-3`}>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                  4
                </div>
                <div>
                  <h5 className={`text-xs font-bold ${text}`}>Kirim & Simpan PDF</h5>
                  <p className={`text-[11px] ${textMuted} mt-0.5 leading-snug`}>
                    Klik <strong>Kirim Hasil Validasi</strong> untuk menyimpan ke database cloud & mengunduh salinan PDF.
                  </p>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Footer Action Button */}
        <div className={`px-6 py-4 border-t ${isDark ? 'border-zinc-800 bg-zinc-950/40' : 'border-gray-100 bg-gray-50/50'} flex items-center justify-between gap-3`}>
          <span className={`text-xs ${textMuted} hidden sm:inline`}>
            Data identitas telah terisi otomatis sesuai link.
          </span>
          <button
            onClick={() => {
              onStartValidation();
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 transition-all hover:scale-102"
          >
            <Send className="w-4 h-4 text-white" />
            <span>Buka Form & Mulai Validasi</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
};
