import React, { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { CheckCircle, ClipboardList, RefreshCw } from 'lucide-react';
import { db } from '../../firebase';
import { ensureUid } from '../adapters/useAuthStore';
import { useTheme } from './ThemeContext';

/**
 * Daftar hadir peserta seminar hasil (?semhas atau /semhas).
 *
 * Halaman berdiri sendiri tanpa simulator, karena peserta membukanya dari HP
 * saat seminar. Pengisi tidak perlu login: sesi anonim memberi uid, dan id
 * dokumen dikunci ke uid itu sehingga satu perangkat hanya punya satu isian
 * yang bisa diperbarui (lihat firestore.rules).
 */
export const SEMHAS_COLLECTION = 'semhas_attendance';
const DRAFT_KEY = 'z80sim_semhas_draft';

interface SemhasFormState {
  nama: string;
  prodi: string;
  angkatan: string;
  saran: string;
}

const EMPTY: SemhasFormState = { nama: '', prodi: '', angkatan: '', saran: '' };

const isValidAngkatan = (v: string) => /^(19|20)\d{2}$/.test(v.trim());

export const SemhasForm: React.FC<{ onBackToSimulator: () => void }> = ({ onBackToSimulator }) => {
  const { isDark } = useTheme();
  const [form, setForm] = useState<SemhasFormState>(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) return { ...EMPTY, ...JSON.parse(raw) };
    } catch {}
    return EMPTY;
  });
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Kalau perangkat ini sudah pernah mengisi, tampilkan isiannya.
  useEffect(() => {
    let cancelled = false;
    ensureUid()
      .then((uid) => getDoc(doc(db, SEMHAS_COLLECTION, uid)))
      .then((snap) => {
        if (cancelled || !snap.exists()) return;
        const d = snap.data();
        setForm({
          nama: d.nama ?? '',
          prodi: d.prodi ?? '',
          angkatan: d.angkatan ?? '',
          saran: d.saran ?? '',
        });
        setSubmitted(true);
      })
      .catch(() => {
        // Baca dokumen sendiri gagal (offline): form tetap bisa diisi.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
    } catch {}
  }, [form]);

  const errors = {
    nama: !form.nama.trim() ? 'Nama wajib diisi.' : null,
    prodi: !form.prodi.trim() ? 'Program studi wajib diisi.' : null,
    angkatan: !isValidAngkatan(form.angkatan) ? 'Isi 4 digit tahun, misalnya 2022.' : null,
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const update = (key: keyof SemhasFormState) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const value = key === 'angkatan' ? e.target.value.replace(/\D/g, '').slice(0, 4) : e.target.value;
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (hasErrors) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const uid = await ensureUid();
      await setDoc(doc(db, SEMHAS_COLLECTION, uid), {
        uid,
        nama: form.nama.trim(),
        prodi: form.prodi.trim(),
        angkatan: form.angkatan.trim(),
        saran: form.saran.trim(),
        submittedAt: serverTimestamp(),
      });
      setSubmitted(true);
    } catch (err) {
      console.error('Gagal menyimpan daftar hadir semhas:', err);
      setSubmitError('Isian belum terkirim. Periksa koneksi internet, lalu tekan Kirim lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const bg = isDark ? 'bg-zinc-950 text-zinc-100' : 'bg-gray-50 text-gray-900';
  const cardBg = isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-gray-200 shadow-sm';
  const textMuted = isDark ? 'text-zinc-400' : 'text-gray-500';
  const inputCls = `w-full px-3.5 py-3 rounded-xl border text-sm outline-none transition-colors focus:ring-2 focus:ring-blue-500/40 ${
    isDark ? 'bg-zinc-950 border-zinc-700 focus:border-blue-500' : 'bg-white border-gray-300 focus:border-blue-500'
  }`;
  const errCls = 'border-red-500 focus:border-red-500';

  return (
    <div className={`min-h-screen w-full flex items-start sm:items-center justify-center px-4 py-8 font-sans ${bg}`}>
      <div className={`w-full max-w-lg p-6 sm:p-8 rounded-3xl border space-y-6 ${cardBg}`}>
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-blue-500/15 text-blue-500 flex items-center justify-center border border-blue-500/25">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-blue-500">Seminar Hasil Penelitian</p>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Daftar Hadir Peserta</h1>
            <p className={`text-sm leading-relaxed ${textMuted}`}>
              Web Simulator Z-80 Terintegrasi Asisten AI. Terima kasih sudah hadir. Isi data di bawah sebagai bukti kehadiran.
            </p>
          </div>
        </div>

        {submitted ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-sm space-y-1">
                <p className="font-bold">Kehadiran tercatat.</p>
                <p className={textMuted}>
                  {form.nama} · {form.prodi} · Angkatan {form.angkatan}
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2.5">
              <button
                type="button"
                onClick={() => setSubmitted(false)}
                className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-semibold ${isDark ? 'border-zinc-700 hover:bg-zinc-800' : 'border-gray-300 hover:bg-gray-100'}`}
              >
                Ubah isian
              </button>
              <button
                type="button"
                onClick={onBackToSimulator}
                className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold"
              >
                Coba Simulator Z-80
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="semhas-nama" className="text-sm font-semibold">Nama lengkap</label>
              <input
                id="semhas-nama"
                autoComplete="name"
                maxLength={120}
                value={form.nama}
                onChange={update('nama')}
                placeholder="cth. Siti Rahmawati"
                aria-invalid={touched && !!errors.nama}
                className={`${inputCls} ${touched && errors.nama ? errCls : ''}`}
              />
              {touched && errors.nama && <p className="text-xs text-red-500">{errors.nama}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_8.5rem] gap-4">
              <div className="space-y-1.5 min-w-0">
                <label htmlFor="semhas-prodi" className="text-sm font-semibold">Program studi</label>
                <input
                  id="semhas-prodi"
                  maxLength={100}
                  value={form.prodi}
                  onChange={update('prodi')}
                  placeholder="cth. Pendidikan Teknik Elektro"
                  aria-invalid={touched && !!errors.prodi}
                  className={`${inputCls} ${touched && errors.prodi ? errCls : ''}`}
                />
                {touched && errors.prodi && <p className="text-xs text-red-500">{errors.prodi}</p>}
              </div>
              <div className="space-y-1.5">
                <label htmlFor="semhas-angkatan" className="text-sm font-semibold">Angkatan</label>
                <input
                  id="semhas-angkatan"
                  inputMode="numeric"
                  maxLength={4}
                  value={form.angkatan}
                  onChange={update('angkatan')}
                  placeholder="2022"
                  aria-invalid={touched && !!errors.angkatan}
                  className={`${inputCls} tabular-nums ${touched && errors.angkatan ? errCls : ''}`}
                />
                {touched && errors.angkatan && <p className="text-xs text-red-500">{errors.angkatan}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="semhas-saran" className="text-sm font-semibold">
                Saran &amp; masukan <span className={`font-normal ${textMuted}`}>(opsional)</span>
              </label>
              <textarea
                id="semhas-saran"
                maxLength={2000}
                rows={4}
                value={form.saran}
                onChange={update('saran')}
                placeholder="Saran, pertanyaan, atau masukan untuk presentasi dan penelitian ini"
                className={`${inputCls} resize-y min-h-[110px]`}
              />
            </div>

            {submitError && (
              <p className="text-sm text-red-500 font-medium" role="alert">{submitError}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2"
            >
              {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
              {submitting ? 'Mengirim…' : 'Kirim kehadiran'}
            </button>
            <p className={`text-xs ${textMuted}`}>
              Satu perangkat satu isian. Kalau mengirim ulang, isian sebelumnya diperbarui.
            </p>
          </form>
        )}
      </div>
    </div>
  );
};
