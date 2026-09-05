import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext';
import {
  FileText, Trash2, Printer, ArrowLeft, CheckCircle, AlertTriangle,
  BarChart3, Users, Award, Sparkles, Filter, Search, Copy, Check,
  Calendar, Building, User, PenTool, ChevronRight, RefreshCw
} from 'lucide-react';
import { INSTRUMENTS, InstrumentDefinition } from '../data/validationInstrumentsData';
import { PrintableValidationSheet, ValidationFormState } from './PrintableValidationSheet';
import { db } from '../../firebase';
import { collection, getDocs, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { useAuthStore } from '../adapters/useAuthStore';

export interface SavedValidationResponse {
  id: string;
  validatorName: string;
  validatorNip?: string;
  validatorInstansi?: string;
  validatorKeahlian?: string;
  instrumentType: 'materi' | 'media' | 'mahasiswa' | 'dosen';
  instrumentTitle: string;
  ratings: Record<number, number>;
  feedback: string;
  conclusion: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  category: string;
  signatureDataUrl?: string | null;
  evaluationDate?: string;
  submittedAt?: any;
}

export const ValidationDashboard: React.FC<{ onBackToSimulator: () => void }> = ({ onBackToSimulator }) => {
  const { isDark } = useTheme();
  const { user, loading: authLoading, loginWithGoogle } = useAuthStore();
  const [loginError, setLoginError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'responses' | 'analysis'>('responses');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [responses, setResponses] = useState<SavedValidationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedChapter4, setCopiedChapter4] = useState(false);

  // Print Preview state for a specific response card
  const [printTarget, setPrintTarget] = useState<{
    instrument: InstrumentDefinition;
    formState: ValidationFormState;
  } | null>(null);

  // Custom Delete Confirm Modal State
  const [deleteTarget, setDeleteTarget] = useState<SavedValidationResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch validation responses from Firestore & LocalStorage
  const fetchResponses = async () => {
    setLoading(true);
    let combined: SavedValidationResponse[] = [];

    // 1. Try Firestore first
    try {
      const snap = await getDocs(collection(db, 'validation_responses'));
      snap.forEach((docSnap) => {
        const data = docSnap.data();
        combined.push({
          id: docSnap.id,
          validatorName: data.validatorName || 'Tanpa Nama',
          validatorNip: data.validatorNip || '',
          validatorInstansi: data.validatorInstansi || '',
          validatorKeahlian: data.validatorKeahlian || '',
          instrumentType: data.instrumentType || 'materi',
          instrumentTitle: data.instrumentTitle || '',
          ratings: data.ratings || {},
          feedback: data.feedback || '',
          conclusion: data.conclusion || '',
          totalScore: data.totalScore || 0,
          maxScore: data.maxScore || 0,
          percentage: data.percentage || 0,
          category: data.category || 'Belum Lengkap',
          signatureDataUrl: data.signatureDataUrl || null,
          evaluationDate: data.evaluationDate || '',
          submittedAt: data.submittedAt,
        });
      });
    } catch (err) {
      console.warn('Firestore fetch notice (using localStorage fallback):', err);
    }

    // 2. Also load from LocalStorage entries starting with z80sim_val_
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('z80sim_val_')) {
          const raw = localStorage.getItem(key);
          if (raw) {
            const parsed = JSON.parse(raw);
            const typeFromKey = key.split('_')[2] as any || 'materi';
            const instDef = INSTRUMENTS[typeFromKey] || INSTRUMENTS['materi'];

            let totalScore = 0;
            const ratings = parsed.ratings || {};
            Object.values(ratings).forEach((v) => { totalScore += Number(v); });
            const maxScore = instDef.totalItems * 4;
            const pct = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

            // Avoid duplicate if exact ID already in combined
            const exists = combined.some(r => r.id === key);
            if (!exists) {
              combined.push({
                id: key,
                validatorName: parsed.validatorName || 'Tanpa Nama',
                validatorNip: parsed.validatorNip || '',
                validatorInstansi: parsed.validatorInstansi || '',
                validatorKeahlian: parsed.validatorKeahlian || '',
                instrumentType: typeFromKey,
                instrumentTitle: instDef.title,
                ratings,
                feedback: parsed.feedback || '',
                conclusion: parsed.conclusion || '',
                totalScore,
                maxScore,
                percentage: parseFloat(pct.toFixed(1)),
                category: pct >= 81.25 ? 'Sangat Layak' : pct >= 62.5 ? 'Layak' : 'Cukup Layak',
                signatureDataUrl: parsed.signatureDataUrl || null,
                evaluationDate: parsed.evaluationDate || '',
                submittedAt: parsed.submittedAt || null,
              });
            }
          }
        }
      }
    } catch (e) {
      console.error('LocalStorage parse error:', e);
    }

    setResponses(combined);
    setLoading(false);
  };

  useEffect(() => {
    // Menunggu identitas siap: sebelum login, Firestore menolak baca koleksi ini.
    if (!user) return;

    fetchResponses();

    // Listen to live updates from Firestore
    const unsub = onSnapshot(
      collection(db, 'validation_responses'),
      () => fetchResponses(),
      (err) => {
        // Penolakan izin datang secara asinkron, jadi tidak tertangkap try/catch.
        console.warn('Firestore live update dihentikan:', err.message);
      }
    );
    return () => unsub();
  }, [user]);

  // Handle Deleting a Response
  const confirmDeleteResponse = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      if (!deleteTarget.id.startsWith('z80sim_val_')) {
        // Delete from Firestore
        await deleteDoc(doc(db, 'validation_responses', deleteTarget.id));
      } else {
        // Delete from LocalStorage
        localStorage.removeItem(deleteTarget.id);
      }
    } catch (err) {
      console.error('Delete error:', err);
      if (deleteTarget.id.startsWith('z80sim_val_')) {
        localStorage.removeItem(deleteTarget.id);
      }
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
      fetchResponses();
    }
  };

  // Handle Print Action for a specific item
  const handlePrintItem = (item: SavedValidationResponse) => {
    const inst = INSTRUMENTS[item.instrumentType] || INSTRUMENTS['materi'];
    const formState: ValidationFormState = {
      validatorName: item.validatorName,
      validatorNip: item.validatorNip || '',
      validatorInstansi: item.validatorInstansi || '',
      validatorKeahlian: item.validatorKeahlian || '',
      evaluationDate: item.evaluationDate || new Date().toLocaleDateString('id-ID'),
      ratings: item.ratings,
      feedback: item.feedback,
      conclusion: item.conclusion,
      signatureDataUrl: item.signatureDataUrl || null,
    };

    setPrintTarget({ instrument: inst, formState });
    setTimeout(() => {
      window.print();
    }, 200);
  };

  // Filter responses
  const filteredResponses = responses.filter(r => {
    const matchType = filterType === 'all' || r.instrumentType === filterType;
    const matchSearch = r.validatorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        (r.validatorInstansi && r.validatorInstansi.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchType && matchSearch;
  });

  // Calculate Chapter 4 (Bab IV) Statistical Analysis
  const getCategoryStats = (type: 'materi' | 'media' | 'dosen' | 'mahasiswa') => {
    const list = responses.filter(r => r.instrumentType === type);
    const inst = INSTRUMENTS[type];
    const N = list.length;

    if (N === 0) {
      return { N: 0, avgPercentage: 0, overallCategory: 'Belum Ada Data', aspectStats: [] };
    }

    let totalPctSum = 0;
    list.forEach(r => { totalPctSum += r.percentage; });
    const avgPercentage = parseFloat((totalPctSum / N).toFixed(2));

    let overallCategory = 'Belum Lengkap';
    if (avgPercentage >= 81.25) overallCategory = 'Sangat Layak';
    else if (avgPercentage >= 62.5) overallCategory = 'Layak';
    else if (avgPercentage >= 43.75) overallCategory = 'Cukup Layak';
    else overallCategory = 'Tidak Layak';

    // Break-down per indicator item
    const itemRatingsSum: Record<number, number> = {};
    const itemRatingsCount: Record<number, number> = {};

    list.forEach(r => {
      Object.entries(r.ratings).forEach(([itemIdStr, score]) => {
        const itemId = Number(itemIdStr);
        itemRatingsSum[itemId] = (itemRatingsSum[itemId] || 0) + Number(score);
        itemRatingsCount[itemId] = (itemRatingsCount[itemId] || 0) + 1;
      });
    });

    const aspectStats = inst.aspects.map(aspect => {
      const itemsInfo = aspect.items.map(item => {
        const sum = itemRatingsSum[item.id] || 0;
        const count = itemRatingsCount[item.id] || 0;
        const meanScore = count > 0 ? parseFloat((sum / count).toFixed(2)) : 0;
        const itemPct = count > 0 ? parseFloat(((sum / (count * 4)) * 100).toFixed(1)) : 0;
        
        let itemCat = 'Belum Ada';
        if (itemPct >= 81.25) itemCat = 'Sangat Layak';
        else if (itemPct >= 62.5) itemCat = 'Layak';
        else if (itemPct >= 43.75) itemCat = 'Cukup Layak';
        else if (count > 0) itemCat = 'Tidak Layak';

        return {
          id: item.id,
          statement: item.statement,
          meanScore,
          itemPct,
          itemCat
        };
      });
      return { title: aspect.title, itemsInfo };
    });

    return { N, avgPercentage, overallCategory, aspectStats };
  };

  const materiStats = getCategoryStats('materi');
  const mediaStats = getCategoryStats('media');
  const dosenStats = getCategoryStats('dosen');
  const mahasiswaStats = getCategoryStats('mahasiswa');

  // Copy Chapter 4 summary markdown text
  const generateChapter4Markdown = () => {
    return `# BAB IV: HASIL PENELITIAN DAN PEMBAHASAN
## Analysis Data Validasi & Respon Penggunaan Web Simulator Z-80

### 1. Hasil Validasi Ahli Materi (N = ${materiStats.N})
- Rata-rata Kelayakan: ${materiStats.avgPercentage}%
- Kategori Kelayakan: **${materiStats.overallCategory}**

### 2. Hasil Validasi Ahli Media (N = ${mediaStats.N})
- Rata-rata Kelayakan: ${mediaStats.avgPercentage}%
- Kategori Kelayakan: **${mediaStats.overallCategory}**

### 3. Hasil Respon Dosen Pengampu (N = ${dosenStats.N})
- Rata-rata Kepraktisan: ${dosenStats.avgPercentage}%
- Kategori Kepraktisan: **${dosenStats.overallCategory}**

### 4. Hasil Uji Coba Respon Mahasiswa (N = ${mahasiswaStats.N})
- Rata-rata Kepraktisan: ${mahasiswaStats.avgPercentage}%
- Kategori Kepraktisan: **${mahasiswaStats.overallCategory}**
`;
  };

  const handleCopyChapter4 = () => {
    navigator.clipboard.writeText(generateChapter4Markdown());
    setCopiedChapter4(true);
    setTimeout(() => setCopiedChapter4(false), 2500);
  };

  const bg = isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-gray-50 text-gray-900';
  const cardBg = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm';
  const textMuted = isDark ? 'text-zinc-400' : 'text-gray-500';

  const formatFormattedDateTime = (item: SavedValidationResponse) => {
    if (item.submittedAt) {
      try {
        let d: Date | null = null;
        if (typeof item.submittedAt.toDate === 'function') {
          d = item.submittedAt.toDate();
        } else if (item.submittedAt.seconds) {
          d = new Date(item.submittedAt.seconds * 1000);
        } else if (typeof item.submittedAt === 'string' || typeof item.submittedAt === 'number') {
          d = new Date(item.submittedAt);
        }
        
        if (d && !isNaN(d.getTime())) {
          const dateStr = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
          const timeStr = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace('.', ':');
          return `${dateStr}, Pukul ${timeStr} WIB`;
        }
      } catch (e) {
        // fallback
      }
    }
    return item.evaluationDate || 'Terkirim';
  };

  // ── Gerbang admin ────────────────────────────────────────────────
  // Dashboard memuat data pribadi validator (nama, NIP/NIDN, tanda tangan),
  // jadi tidak boleh terbuka hanya karena seseorang menebak URL "?hasil".
  // Penegakan sesungguhnya ada di firestore.rules; gerbang ini agar peneliti
  // punya cara masuk yang jelas dan orang lain mendapat pesan yang jelas pula.
  if (authLoading) {
    return (
      <div className={`min-h-screen w-full flex items-center justify-center ${bg}`}>
        <RefreshCw className="w-6 h-6 animate-spin opacity-40" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className={`min-h-screen w-full flex items-center justify-center p-4 font-sans ${bg}`}>
        <div className={`w-full max-w-md p-8 rounded-3xl border text-center space-y-5 ${cardBg}`}>
          <div className="w-16 h-16 rounded-2xl bg-blue-500/15 text-blue-500 flex items-center justify-center mx-auto border border-blue-500/25">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold">Dashboard Hasil Validasi</h1>
            <p className={`text-sm leading-relaxed ${textMuted}`}>
              Halaman ini memuat data pribadi para validator. Masuk dengan akun Google peneliti untuk melanjutkan.
            </p>
          </div>
          {loginError && (
            <p className="text-xs text-red-500 font-medium">{loginError}</p>
          )}
          <div className="space-y-2.5">
            <button
              onClick={async () => {
                setLoginError(null);
                try {
                  await loginWithGoogle();
                } catch {
                  setLoginError('Login gagal. Silakan coba lagi.');
                }
              }}
              className="w-full px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md"
            >
              Masuk dengan Google
            </button>
            <button
              onClick={onBackToSimulator}
              className={`w-full px-4 py-2.5 rounded-xl border text-sm font-semibold ${isDark ? 'border-zinc-700 hover:bg-zinc-800' : 'border-gray-300 hover:bg-gray-100'}`}
            >
              Kembali ke Simulator
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full flex flex-col font-sans ${bg}`}>
      
      {/* Top Navbar */}
      <header className={`sticky top-0 z-30 px-4 sm:px-8 py-4 border-b backdrop-blur-md ${isDark ? 'bg-zinc-900/90 border-zinc-800' : 'bg-white/90 border-gray-200 shadow-sm'}`}>
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold tracking-tight flex items-center gap-2">
                Dashboard Hasil Validasi R&amp;D
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  {responses.length} Respons
                </span>
              </h1>
              <p className={`text-xs ${textMuted}`}>Web Simulator Z-80 Terintegrasi Asisten AI — Pendidikan Teknik Elektro UNY</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchResponses}
              className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                isDark ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'border-gray-200 hover:bg-gray-100 text-gray-700'
              }`}
              title="Refresh data dari database"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-500' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={onBackToSimulator}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-102"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Simulator</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        
        {/* Navigation Tabs */}
        <div className={`flex items-center gap-2 p-1.5 rounded-2xl border max-w-md ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-gray-200/80 border-gray-300'}`}>
          <button
            onClick={() => setActiveTab('responses')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'responses'
                ? 'bg-blue-600 text-white shadow-md'
                : isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Respons Terkirim</span>
          </button>

          <button
            onClick={() => setActiveTab('analysis')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              activeTab === 'analysis'
                ? 'bg-blue-600 text-white shadow-md'
                : isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Analisis Bab IV</span>
          </button>
        </div>

        {/* ─── TAB 1: DAFTAR RESPONS TERKIRIM ─── */}
        {activeTab === 'responses' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Filter & Search Bar */}
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${cardBg}`}>
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${textMuted} mr-1`}>
                  <Filter className="w-3.5 h-3.5" /> Filter:
                </span>
                {[
                  { key: 'all', label: 'Semua' },
                  { key: 'materi', label: 'Ahli Materi' },
                  { key: 'media', label: 'Ahli Media' },
                  { key: 'dosen', label: 'Dosen' },
                  { key: 'mahasiswa', label: 'Mahasiswa' }
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilterType(f.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      filterType === f.key
                        ? 'bg-blue-600 text-white shadow'
                        : isDark ? 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              {/* Search Box */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border w-full sm:w-64 text-xs ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-gray-300'}`}>
                <Search className={`w-4 h-4 ${textMuted}`} />
                <input
                  type="text"
                  placeholder="Cari nama / instansi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent outline-none"
                />
              </div>
            </div>

            {/* List of Cards */}
            {loading ? (
              <div className="text-center py-16 space-y-3">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-500 mx-auto" />
                <p className={`text-xs sm:text-sm ${textMuted}`}>Memuat seluruh data hasil validasi...</p>
              </div>
            ) : filteredResponses.length === 0 ? (
              <div className={`p-12 text-center rounded-3xl border space-y-3 ${cardBg}`}>
                <FileText className="w-12 h-12 text-gray-400 mx-auto opacity-50" />
                <h3 className="text-base font-bold">Belum Ada Data Validasi Terkirim</h3>
                <p className={`text-xs max-w-md mx-auto ${textMuted}`}>
                  Hasil pengisian validasi dari Ahli Materi, Ahli Media, Dosen, maupun Mahasiswa akan otomatis muncul di halaman ini.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                {filteredResponses.map((item) => {
                  const inst = INSTRUMENTS[item.instrumentType] || INSTRUMENTS['materi'];
                  const isSangatLayak = item.percentage >= 81.25;

                  return (
                    <div key={item.id} className={`p-5 rounded-3xl border flex flex-col justify-between gap-4 transition-all hover:border-blue-500/50 ${cardBg}`}>
                      
                      <div className="space-y-3">
                        {/* Header Badge */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-blue-500/10 text-blue-500 border border-blue-500/20">
                            {inst.title}
                          </span>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            isSangatLayak
                              ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                              : 'bg-blue-500/10 text-blue-500 border-blue-500/30'
                          }`}>
                            {item.category} ({item.percentage}%)
                          </span>
                        </div>

                        {/* Validator Info */}
                        <div>
                          <h3 className="text-base font-bold flex items-center gap-1.5">
                            <User className="w-4 h-4 text-blue-500 flex-shrink-0" />
                            <span>{item.validatorName}</span>
                          </h3>
                          {item.validatorNip && (
                            <p className={`text-xs ${textMuted} font-mono mt-0.5 ml-5`}>NIP/NIM: {item.validatorNip}</p>
                          )}
                          {item.validatorInstansi && (
                            <p className={`text-xs ${textMuted} flex items-center gap-1 mt-1 ml-5`}>
                              <Building className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{item.validatorInstansi}</span>
                            </p>
                          )}
                        </div>

                        {/* Feedback preview */}
                        {item.feedback && (
                          <div className={`p-3 rounded-xl border text-xs italic ${isDark ? 'bg-zinc-950/60 border-zinc-800 text-zinc-300' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                            "{item.feedback}"
                          </div>
                        )}

                        {/* Signature Thumbnail */}
                        {item.signatureDataUrl && (
                          <div className="flex items-center gap-2 text-xs text-emerald-500 font-medium">
                            <PenTool className="w-3.5 h-3.5" />
                            <span>Tanda Tangan Digital Terlampir</span>
                          </div>
                        )}
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-3 border-t border-zinc-800/40 flex items-center justify-between gap-2">
                        <span className={`text-[11px] ${textMuted} flex items-center gap-1`}>
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{formatFormattedDateTime(item)}</span>
                        </span>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handlePrintItem(item)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                              isDark ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-200' : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                            }`}
                            title="Cetak atau unduh salinan PDF"
                          >
                            <Printer className="w-3.5 h-3.5 text-blue-500" />
                            <span>Cetak PDF</span>
                          </button>

                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 text-xs font-bold transition-all"
                            title="Hapus data validasi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

        {/* ─── TAB 2: ANALISIS DATA PENELITIAN (BAB IV) ─── */}
        {activeTab === 'analysis' && (
          <div className="space-y-6 animate-fade-in">
            
            {/* Header Card for Chapter 4 */}
            <div className={`p-6 rounded-3xl border space-y-4 ${cardBg}`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-500 border border-purple-500/20">
                    Otomatisasi Olah Data Skripsi / R&amp;D
                  </span>
                  <h2 className="text-xl font-extrabold mt-2">Analisis Statistik Bab IV (Hasil &amp; Pembahasan)</h2>
                  <p className={`text-xs sm:text-sm ${textMuted} mt-1`}>
                    Data skor persentase kelayakan dan kepraktisan telah dikalkulasi secara otomatis dari seluruh responden terdaftar.
                  </p>
                </div>

                <button
                  onClick={handleCopyChapter4}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm shadow-md transition-all hover:scale-102 flex-shrink-0"
                >
                  {copiedChapter4 ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedChapter4 ? 'Tersalin ke Clipboard!' : 'Salin Rangkuman Bab IV'}</span>
                </button>
              </div>
            </div>

            {/* 4 Summary Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Materi Card */}
              <div className={`p-5 rounded-3xl border space-y-2 ${cardBg}`}>
                <span className="text-xs font-bold text-blue-500 uppercase tracking-wider">Ahli Materi</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold">{materiStats.avgPercentage}%</span>
                  <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    {materiStats.overallCategory}
                  </span>
                </div>
                <p className={`text-xs ${textMuted}`}>Jumlah Validator (N) = {materiStats.N}</p>
              </div>

              {/* Media Card */}
              <div className={`p-5 rounded-3xl border space-y-2 ${cardBg}`}>
                <span className="text-xs font-bold text-purple-500 uppercase tracking-wider">Ahli Media</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold">{mediaStats.avgPercentage}%</span>
                  <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    {mediaStats.overallCategory}
                  </span>
                </div>
                <p className={`text-xs ${textMuted}`}>Jumlah Validator (N) = {mediaStats.N}</p>
              </div>

              {/* Dosen Card */}
              <div className={`p-5 rounded-3xl border space-y-2 ${cardBg}`}>
                <span className="text-xs font-bold text-amber-500 uppercase tracking-wider">Dosen Pengampu</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold">{dosenStats.avgPercentage}%</span>
                  <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    {dosenStats.overallCategory}
                  </span>
                </div>
                <p className={`text-xs ${textMuted}`}>Jumlah Responden (N) = {dosenStats.N}</p>
              </div>

              {/* Mahasiswa Card */}
              <div className={`p-5 rounded-3xl border space-y-2 ${cardBg}`}>
                <span className="text-xs font-bold text-emerald-500 uppercase tracking-wider">Responden Mahasiswa</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-extrabold">{mahasiswaStats.avgPercentage}%</span>
                  <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    {mahasiswaStats.overallCategory}
                  </span>
                </div>
                <p className={`text-xs ${textMuted}`}>Jumlah Responden (N) = {mahasiswaStats.N}</p>
              </div>

            </div>

            {/* Detailed Tables per Instrument */}
            {[
              { type: 'materi', title: '1. Tabulasi Per Aspek - Ahli Materi', stats: materiStats },
              { type: 'media', title: '2. Tabulasi Per Aspek - Ahli Media', stats: mediaStats },
              { type: 'dosen', title: '3. Tabulasi Per Aspek - Dosen Pengampu', stats: dosenStats },
              { type: 'mahasiswa', title: '4. Tabulasi Per Aspek - Uji Coba Mahasiswa', stats: mahasiswaStats },
            ].map((section) => (
              <div key={section.type} className={`p-6 rounded-3xl border space-y-4 ${cardBg}`}>
                <h3 className="text-base font-bold flex items-center justify-between">
                  <span>{section.title}</span>
                  <span className="text-xs font-semibold text-blue-500">N = {section.stats.N} Responden</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={`border-b ${isDark ? 'border-zinc-800 bg-zinc-950/60 text-zinc-400' : 'border-gray-200 bg-gray-100 text-gray-700'}`}>
                        <th className="p-3 w-12 text-center font-bold">No</th>
                        <th className="p-3 font-bold">Pernyataan Indikator Penilaian</th>
                        <th className="p-3 w-28 text-center font-bold">Rata-rata Skor</th>
                        <th className="p-3 w-28 text-center font-bold">Persentase</th>
                        <th className="p-3 w-32 text-center font-bold">Kategori</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/40">
                      {section.stats.aspectStats.flatMap(aspect =>
                        aspect.itemsInfo.map(item => (
                          <tr key={item.id} className="hover:bg-blue-500/5 transition-colors">
                            <td className="p-3 text-center font-mono font-bold text-blue-500">{item.id}</td>
                            <td className="p-3 font-medium">{item.statement}</td>
                            <td className="p-3 text-center font-mono font-bold">{item.meanScore} / 4.0</td>
                            <td className="p-3 text-center font-mono font-bold text-emerald-500">{item.itemPct}%</td>
                            <td className="p-3 text-center font-semibold">{item.itemCat}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

          </div>
        )}

      </main>

      {/* ─── PRINTABLE SHEET PORTAL FOR INDIVIDUAL PRINT ─── */}
      {printTarget && (
        <PrintableValidationSheet
          instrument={printTarget.instrument}
          formState={printTarget.formState}
        />
      )}

      {/* ─── CUSTOM DELETE CONFIRMATION WEB MODAL ─── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl space-y-4 ${isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-white border-gray-200 text-gray-900'}`}>
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 text-red-500 border border-red-500/30 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div className="text-center space-y-1">
              <h3 className="text-lg font-bold">Konfirmasi Hapus Data</h3>
              <p className={`text-xs ${textMuted}`}>
                Apakah Anda yakin ingin menghapus data hasil validasi Yth. <strong>{deleteTarget.validatorName}</strong>?
              </p>
            </div>

            <div className={`p-3 rounded-xl border text-xs text-red-400 bg-red-950/20 border-red-800/40 text-center font-medium`}>
              <AlertTriangle className="w-3.5 h-3.5 inline mr-1" /> Data yang telah dihapus dari database tidak dapat dikembalikan lagi.
            </div>

            <div className="pt-2 flex items-center gap-2.5">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className={`flex-1 py-2.5 rounded-xl border text-xs font-semibold ${isDark ? 'border-zinc-700 hover:bg-zinc-800' : 'border-gray-300 hover:bg-gray-100'}`}
              >
                Batal
              </button>
              <button
                onClick={confirmDeleteResponse}
                disabled={isDeleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Data'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
