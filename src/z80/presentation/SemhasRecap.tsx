import React, { useEffect, useMemo, useState } from 'react';
import { collection, deleteDoc, doc, onSnapshot } from 'firebase/firestore';
import { Check, Copy, MessageSquare, Printer, Search, Trash2, Users } from 'lucide-react';
import { db } from '../../firebase';
import { SEMHAS_COLLECTION } from './SemhasForm';

interface SemhasEntry {
  id: string;
  nama: string;
  prodi: string;
  angkatan: string;
  saran: string;
  submittedAt?: any;
}

const toDate = (ts: any): Date | null => {
  if (!ts) return null;
  if (typeof ts.toDate === 'function') return ts.toDate();
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
};

const formatTime = (ts: any) => {
  const d = toDate(ts);
  if (!d) return '—';
  return d.toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
};

/** Tab "Peserta Semhas" di dashboard ?hasil. Hanya admin yang bisa membaca (firestore.rules). */
export const SemhasRecap: React.FC<{ isDark: boolean; cardBg: string; textMuted: string }> = ({
  isDark,
  cardBg,
  textMuted,
}) => {
  const [entries, setEntries] = useState<SemhasEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SemhasEntry | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, SEMHAS_COLLECTION),
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SemhasEntry, 'id'>) }));
        rows.sort((a, b) => (toDate(a.submittedAt)?.getTime() ?? 0) - (toDate(b.submittedAt)?.getTime() ?? 0));
        setEntries(rows);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Gagal memuat daftar hadir semhas:', err);
        setError('Data peserta tidak bisa dimuat. Pastikan masuk dengan akun peneliti.');
        setLoading(false);
      }
    );
    return unsub;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter((e) => [e.nama, e.prodi, e.angkatan].some((v) => (v || '').toLowerCase().includes(q)));
  }, [entries, query]);

  const withSaran = entries.filter((e) => e.saran).length;
  const prodiCount = new Set(entries.map((e) => (e.prodi || '').trim().toLowerCase()).filter(Boolean)).size;

  const copyCsv = async () => {
    const q = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = ['No,Nama,Prodi,Angkatan,Saran & Masukan,Waktu'].concat(
      entries.map((e, i) => [i + 1, q(e.nama), q(e.prodi), q(e.angkatan), q(e.saran), q(formatTime(e.submittedAt))].join(','))
    );
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Gagal menyalin ke clipboard.');
    }
  };

  // Cetak daftar hadir lewat iframe tersembunyi, jadi tidak diblokir popup blocker.
  // Di dialog cetak browser, pilih "Simpan sebagai PDF" untuk mengunduh berkas PDF.
  const printPdf = () => {
    const esc = (v: unknown) =>
      String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
    const fullTime = (ts: any) => {
      const d = toDate(ts);
      return d ? d.toLocaleString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
    };
    const printedAt = new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });
    const rows = entries
      .map(
        (e, i) => `<tr>
          <td class="c">${i + 1}</td>
          <td>${esc(e.nama)}</td>
          <td>${esc(e.prodi)}</td>
          <td class="c">${esc(e.angkatan)}</td>
          <td class="saran">${esc(e.saran) || '—'}</td>
          <td class="t">${esc(fullTime(e.submittedAt))}</td>
        </tr>`
      )
      .join('');
    const html = `<!doctype html><html lang="id"><head><meta charset="utf-8">
      <title>Daftar Hadir Seminar Hasil</title>
      <style>
        @page { size: A4 landscape; margin: 14mm; }
        * { box-sizing: border-box; }
        body { font-family: 'Times New Roman', serif; color: #000; font-size: 11pt; margin: 0; }
        h1 { text-align: center; font-size: 15pt; margin: 0 0 2pt; text-transform: uppercase; }
        .sub { text-align: center; font-size: 10pt; margin: 0 0 12pt; }
        .meta { display: flex; justify-content: space-between; font-size: 10pt; margin-bottom: 6pt; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #000; padding: 4pt 6pt; vertical-align: top; }
        th { background: #e5e7eb; font-size: 10pt; }
        thead { display: table-header-group; }
        tr { page-break-inside: avoid; }
        .c { text-align: center; }
        .t { white-space: nowrap; font-size: 9.5pt; }
        .saran { white-space: pre-wrap; word-break: break-word; }
        .sign { margin-top: 28pt; width: 240pt; margin-left: auto; text-align: center; font-size: 10.5pt; }
        .sign .line { margin-top: 56pt; border-top: 1px solid #000; }
        * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      </style></head><body>
      <h1>Daftar Hadir Seminar Hasil Penelitian</h1>
      <p class="sub">Simulator Mikroprosesor Z80</p>
      <div class="meta"><span>Jumlah peserta: <b>${entries.length}</b></span><span>Dicetak: ${esc(printedAt)}</span></div>
      <table>
        <thead><tr>
          <th style="width:4%">No</th><th style="width:20%">Nama</th><th style="width:16%">Program Studi</th>
          <th style="width:8%">Angkatan</th><th>Saran &amp; Masukan</th><th style="width:15%">Waktu Hadir</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="sign">Mengetahui,<div class="line"></div></div>
      </body></html>`;

    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
    document.body.appendChild(iframe);
    const win = iframe.contentWindow;
    const docu = iframe.contentDocument;
    if (!win || !docu) {
      iframe.remove();
      setError('Gagal menyiapkan dokumen cetak.');
      return;
    }
    docu.open();
    docu.write(html);
    docu.close();
    const cleanup = () => setTimeout(() => iframe.remove(), 500);
    win.addEventListener('afterprint', cleanup, { once: true });
    setTimeout(() => {
      win.focus();
      win.print();
      // Safari tidak selalu memicu afterprint; hapus iframe sebagai cadangan.
      setTimeout(() => iframe.isConnected && iframe.remove(), 60_000);
    }, 250);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteDoc(doc(db, SEMHAS_COLLECTION, deleteTarget.id));
    } catch (err) {
      console.error(err);
      setError('Gagal menghapus data peserta.');
    }
    setDeleteTarget(null);
  };

  const stat = (label: string, value: number, Icon: React.FC<{ className?: string }>) => (
    <div className={`p-4 rounded-2xl border flex items-center gap-3 ${cardBg}`}>
      <Icon className="w-5 h-5 text-blue-500 shrink-0" />
      <div>
        <p className="text-xl font-extrabold tabular-nums">{value}</p>
        <p className={`text-xs ${textMuted}`}>{label}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stat('Peserta hadir', entries.length, Users)}
        {stat('Program studi', prodiCount, Users)}
        {stat('Memberi saran', withSaran, MessageSquare)}
      </div>

      <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 ${cardBg}`}>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border w-full sm:w-72 text-xs ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-gray-300'}`}>
          <Search className={`w-4 h-4 ${textMuted}`} />
          <input
            id="semhas-search"
            type="text"
            placeholder="Cari nama / prodi / angkatan..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent outline-none"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={printPdf}
          disabled={entries.length === 0}
          className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-bold disabled:opacity-50 ${
            isDark ? 'border-zinc-700 hover:bg-zinc-800' : 'border-gray-300 hover:bg-gray-100'
          }`}
          title="Cetak daftar hadir atau simpan sebagai PDF"
        >
          <Printer className="w-4 h-4 text-blue-500" />
          Cetak / Unduh PDF
        </button>
        <button
          onClick={copyCsv}
          disabled={entries.length === 0}
          className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl border text-xs font-bold disabled:opacity-50 ${
            isDark ? 'border-zinc-700 hover:bg-zinc-800' : 'border-gray-300 hover:bg-gray-100'
          }`}
        >
          {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-blue-500" />}
          {copied ? 'Tersalin' : 'Salin CSV (untuk Excel)'}
        </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-500 font-medium">{error}</p>}

      <div className={`rounded-2xl border overflow-hidden ${cardBg}`}>
        {loading ? (
          <p className={`p-6 text-sm ${textMuted}`}>Memuat daftar hadir…</p>
        ) : filtered.length === 0 ? (
          <p className={`p-6 text-sm ${textMuted}`}>
            {entries.length === 0
              ? 'Belum ada peserta. Bagikan tautan ?semhas ke peserta seminar.'
              : 'Tidak ada peserta yang cocok dengan pencarian.'}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className={isDark ? 'bg-zinc-800/60' : 'bg-gray-50'}>
                <tr className={`text-left text-xs uppercase tracking-wider ${textMuted}`}>
                  <th className="px-4 py-3 w-10">No</th>
                  <th className="px-4 py-3">Nama</th>
                  <th className="px-4 py-3">Prodi</th>
                  <th className="px-4 py-3">Angkatan</th>
                  <th className="px-4 py-3 min-w-[16rem]">Saran &amp; Masukan</th>
                  <th className="px-4 py-3 whitespace-nowrap">Waktu</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.map((e) => (
                  <tr key={e.id} className={`border-t align-top ${isDark ? 'border-zinc-800' : 'border-gray-100'}`}>
                    <td className={`px-4 py-3 tabular-nums ${textMuted}`}>{entries.indexOf(e) + 1}</td>
                    <td className="px-4 py-3 font-semibold">{e.nama}</td>
                    <td className="px-4 py-3">{e.prodi}</td>
                    <td className="px-4 py-3 tabular-nums">{e.angkatan}</td>
                    <td className="px-4 py-3 whitespace-pre-wrap break-words">
                      {e.saran || <span className={textMuted}>—</span>}
                    </td>
                    <td className={`px-4 py-3 whitespace-nowrap text-xs tabular-nums ${textMuted}`}>{formatTime(e.submittedAt)}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setDeleteTarget(e)}
                        className="p-1.5 rounded-lg text-red-500 hover:bg-red-500/10"
                        title="Hapus peserta"
                        aria-label={`Hapus ${e.nama}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className={`w-full max-w-sm p-6 rounded-2xl border space-y-4 ${cardBg}`}>
            <p className="text-sm">
              Hapus data kehadiran <strong>{deleteTarget.nama}</strong>? Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className={`flex-1 px-4 py-2 rounded-xl border text-sm font-semibold ${isDark ? 'border-zinc-700 hover:bg-zinc-800' : 'border-gray-300 hover:bg-gray-100'}`}
              >
                Batal
              </button>
              <button onClick={confirmDelete} className="flex-1 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold">
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
