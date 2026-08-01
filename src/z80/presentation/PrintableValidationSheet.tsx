import React from 'react';
import { createPortal } from 'react-dom';
import { InstrumentDefinition } from '../data/validationInstrumentsData';

export interface ValidationFormState {
  validatorName: string;
  validatorNip: string;
  validatorInstansi: string;
  validatorKeahlian: string;
  evaluationDate: string;
  ratings: Record<number, number>; // item.id -> rating (1..4)
  feedback: string;
  conclusion: string;
  signatureDataUrl: string | null;
}

interface PrintableValidationSheetProps {
  instrument: InstrumentDefinition;
  formState: ValidationFormState;
}

export const PrintableValidationSheet: React.FC<PrintableValidationSheetProps> = ({ instrument, formState }) => {
  // Label customizations based on instrument type
  const isValidator = instrument.type === 'materi' || instrument.type === 'media';
  const isMahasiswa = instrument.type === 'mahasiswa';
  const isDosen = instrument.type === 'dosen';

  const sectionATitle = isValidator ? 'A. Identitas Validator' : 'A. Identitas Responden';

  const nameLabel = isDosen
    ? 'Nama Dosen'
    : isMahasiswa
    ? 'Nama'
    : 'Nama Validator';

  const nipLabel = isMahasiswa ? 'NIM' : 'NIP / NIDN';

  const instansiLabel = isMahasiswa ? 'Program Studi' : 'Instansi';

  const keahlianLabel = isDosen
    ? 'Mata Kuliah yang Diampu'
    : isMahasiswa
    ? 'Angkatan'
    : 'Bidang Keahlian';

  const signatureRole = isDosen
    ? 'Dosen Pengampu Mata Kuliah'
    : isMahasiswa
    ? 'Responden'
    : instrument.targetRole;

  const content = (
    <div className="printable-sheet-portal hidden print:block bg-white text-black font-serif leading-relaxed text-sm">
      <style>{`
        @media print {
          html, body {
            height: auto !important;
            min-height: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            background: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Hide all elements under body except our portal */
          body > *:not(.printable-sheet-portal) {
            display: none !important;
          }
          .printable-sheet-portal {
            display: block !important;
            position: static !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            float: none !important;
            overflow: visible !important;
          }
          @page {
            size: A4 portrait;
            margin: 12mm 15mm 15mm 15mm;
          }
          table {
            page-break-inside: auto;
          }
          tr {
            page-break-inside: avoid;
            break-inside: avoid;
          }
          thead {
            display: table-header-group;
          }
          .page-break-inside-avoid {
            page-break-inside: avoid;
            break-inside: avoid;
          }
        }
      `}</style>

      {/* Official Header */}
      <div className="text-center border-b-2 border-black pb-3 mb-5">
        <h2 className="font-bold text-base uppercase tracking-wider mb-1">{instrument.title}</h2>
        <p className="text-xs font-semibold">Judul Penelitian:</p>
        <p className="text-xs italic font-bold max-w-xl mx-auto">
          "Pengembangan Web Simulator Z-80 Terintegrasi Asisten Kecerdasan Buatan sebagai Media Pembelajaran pada Mata Kuliah Sistem Mikroprosesor"
        </p>
        <div className="mt-2 text-[11px]">
          <p>Peneliti: <strong>Yusuf Syaifulloh</strong> (NIM. 21501241026)</p>
          <p>Program Studi Pendidikan Teknik Elektro — Fakultas Teknik — Universitas Negeri Yogyakarta</p>
        </div>
      </div>

      {/* Section A: Identity Table */}
      <div className="mb-5">
        <h3 className="font-bold text-xs uppercase mb-2 border-b border-gray-400 pb-1">{sectionATitle}</h3>
        <table className="w-full text-xs border-none">
          <tbody>
            <tr>
              <td className="py-0.5 w-44 font-semibold border-none">{nameLabel}</td>
              <td className="py-0.5 w-4 border-none">:</td>
              <td className="py-0.5 border-none">{formState.validatorName || '.........................................................'}</td>
            </tr>
            <tr>
              <td className="py-0.5 font-semibold border-none">{nipLabel}</td>
              <td className="py-0.5 border-none">:</td>
              <td className="py-0.5 border-none">{formState.validatorNip || '.........................................................'}</td>
            </tr>
            <tr>
              <td className="py-0.5 font-semibold border-none">{instansiLabel}</td>
              <td className="py-0.5 border-none">:</td>
              <td className="py-0.5 border-none">{formState.validatorInstansi || '.........................................................'}</td>
            </tr>
            <tr>
              <td className="py-0.5 font-semibold border-none">{keahlianLabel}</td>
              <td className="py-0.5 border-none">:</td>
              <td className="py-0.5 border-none">{formState.validatorKeahlian || '.........................................................'}</td>
            </tr>
            <tr>
              <td className="py-0.5 font-semibold border-none">Tanggal Pengisian</td>
              <td className="py-0.5 border-none">:</td>
              <td className="py-0.5 border-none">{formState.evaluationDate || '.........................................................'}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Section B: Instructions */}
      <div className="mb-4 text-xs">
        <h3 className="font-bold text-xs uppercase mb-1 border-b border-gray-400 pb-1">B. Petunjuk Pengisian</h3>
        <p className="italic mb-1 text-[11px]">Berikan tanda centang (✓) pada kolom skala penilaian yang paling sesuai:</p>
        <div className="flex gap-4 font-semibold text-[11px]">
          <span>SS = Sangat Setuju (4)</span>
          <span>S = Setuju (3)</span>
          <span>TS = Tidak Setuju (2)</span>
          <span>STS = Sangat Tidak Setuju (1)</span>
        </div>
      </div>

      {/* Section C: Items Table */}
      <div className="mb-5">
        <h3 className="font-bold text-xs uppercase mb-2 border-b border-gray-400 pb-1">C. Butir Penilaian</h3>
        <table className="w-full border-collapse border border-black text-xs">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-black p-1.5 w-8 text-center">No</th>
              <th className="border border-black p-1.5 text-left">Pernyataan / Indikator Penilaian</th>
              <th className="border border-black p-1 w-9 text-center">SS<br/>(4)</th>
              <th className="border border-black p-1 w-9 text-center">S<br/>(3)</th>
              <th className="border border-black p-1 w-9 text-center">TS<br/>(2)</th>
              <th className="border border-black p-1 w-9 text-center">STS<br/>(1)</th>
            </tr>
          </thead>
          <tbody>
            {instrument.aspects.map((aspect, aspectIdx) => (
              <React.Fragment key={aspectIdx}>
                <tr className="bg-gray-100 font-bold">
                  <td colSpan={6} className="border border-black px-2 py-1 bg-gray-100 text-[11px]">
                    {aspect.title}
                  </td>
                </tr>
                {aspect.items.map((item) => {
                  const rating = formState.ratings[item.id];
                  return (
                    <tr key={item.id}>
                      <td className="border border-black p-1 text-center font-semibold text-[11px]">{item.id}</td>
                      <td className="border border-black p-1 text-[11px] leading-tight">{item.statement}</td>
                      <td className="border border-black p-1 text-center font-bold">{rating === 4 ? '✓' : ''}</td>
                      <td className="border border-black p-1 text-center font-bold">{rating === 3 ? '✓' : ''}</td>
                      <td className="border border-black p-1 text-center font-bold">{rating === 2 ? '✓' : ''}</td>
                      <td className="border border-black p-1 text-center font-bold">{rating === 1 ? '✓' : ''}</td>
                    </tr>
                  );
                })}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Section D: Feedback / Saran */}
      <div className="mb-5 page-break-inside-avoid">
        <h3 className="font-bold text-xs uppercase mb-2 border-b border-gray-400 pb-1">D. Saran dan Masukan</h3>
        <div className="border border-black p-2.5 min-h-[70px] text-xs whitespace-pre-wrap">
          {formState.feedback || 'Tidak ada saran khusus.'}
        </div>
      </div>

      {/* Section E: Conclusion */}
      <div className="mb-6 page-break-inside-avoid">
        <h3 className="font-bold text-xs uppercase mb-2 border-b border-gray-400 pb-1">E. Kesimpulan Penilaian</h3>
        <div className="space-y-1 text-xs">
          <p className="flex items-center gap-2">
            <span>{formState.conclusion === 'layak_tanpa_revisi' ? '☑' : '☐'}</span>
            <span>Layak digunakan tanpa revisi</span>
          </p>
          <p className="flex items-center gap-2">
            <span>{formState.conclusion === 'layak_dengan_revisi' ? '☑' : '☐'}</span>
            <span>Layak digunakan dengan revisi sesuai saran</span>
          </p>
          <p className="flex items-center gap-2">
            <span>{formState.conclusion === 'tidak_layak' ? '☑' : '☐'}</span>
            <span>Tidak layak digunakan, perlu revisi besar</span>
          </p>
        </div>
      </div>

      {/* Signature Section */}
      <div className="flex justify-end page-break-inside-avoid">
        <div className="text-center min-w-[240px]">
          <p className="text-xs">Yogyakarta, {formState.evaluationDate || '............................ 2026'}</p>
          <p className="text-xs font-semibold mb-1">{signatureRole}</p>
          
          <div className="h-28 flex items-center justify-center my-1">
            {formState.signatureDataUrl ? (
              <img src={formState.signatureDataUrl} alt="Tanda Tangan" className="max-h-26 max-w-[220px] object-contain scale-110" />
            ) : (
              <span className="text-xs italic text-gray-400 my-8">(Tanda Tangan Digital)</span>
            )}
          </div>
          
          <div className="inline-block border-b border-black pb-0.5 px-2 mb-1">
            <p className="text-xs font-bold">
              ( {formState.validatorName ? formState.validatorName : '.........................................................'} )
            </p>
          </div>
          <p className="text-[11px] text-gray-700">{nipLabel}: {formState.validatorNip || '..........................................'}</p>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
};
