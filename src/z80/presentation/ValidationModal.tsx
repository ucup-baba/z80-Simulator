import React, { useState, useEffect } from 'react';
import { useTheme } from './ThemeContext';
import {
  FileCheck2, X, Printer, User, Award, CheckCircle, HelpCircle,
  Sparkles, RotateCcw, Send, ChevronRight, ChevronDown, ShieldCheck, Info,
  Columns, Maximize2, Minimize2, GripVertical, Eye, AlertTriangle, PenTool,
  BarChart3, CheckCircle2, ExternalLink, Download, Laptop, Smartphone, Apple
} from 'lucide-react';
import { triggerPwaInstall } from './PwaInstallPrompt';
import { INSTRUMENTS, InstrumentDefinition, VALIDATOR_PROFILES, ValidatorPresetProfile } from '../data/validationInstrumentsData';
import { SignaturePad } from './SignaturePad';
import { PrintableValidationSheet, ValidationFormState } from './PrintableValidationSheet';
import { db } from '../../firebase';
import { collection, addDoc, setDoc, doc, query, where, getDocs, serverTimestamp } from 'firebase/firestore';

export type WindowMode = 'split' | 'minimized' | 'modal';

interface ValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'materi' | 'media' | 'mahasiswa' | 'dosen';
  presetProfile?: ValidatorPresetProfile | null;
  windowMode?: WindowMode;
  onWindowModeChange?: (mode: WindowMode) => void;
  panelWidth?: number;
  onPanelWidthChange?: (width: number) => void;
  onTryCode?: (code: string) => void;
}

export const ValidationModal: React.FC<ValidationModalProps> = ({
  isOpen,
  onClose,
  initialType = 'materi',
  presetProfile: presetProfileProp,
  windowMode: windowModeProp,
  onWindowModeChange,
  panelWidth: panelWidthProp,
  onPanelWidthChange,
  onTryCode
}) => {
  const { isDark } = useTheme();
  const [activeType, setActiveType] = useState<'materi' | 'media' | 'mahasiswa' | 'dosen'>(initialType);
  
  // Controlled or uncontrolled view mode & panel width
  const [internalWindowMode, setInternalWindowMode] = useState<WindowMode>('split');
  const [internalPanelWidth, setInternalPanelWidth] = useState<number>(520);
  const [isResizing, setIsResizing] = useState<boolean>(false);

  const windowMode = windowModeProp ?? internalWindowMode;
  const panelWidth = panelWidthProp ?? internalPanelWidth;

  const setWindowMode = (mode: WindowMode) => {
    if (onWindowModeChange) onWindowModeChange(mode);
    else setInternalWindowMode(mode);
  };

  const setPanelWidth = (width: number) => {
    if (onPanelWidthChange) onPanelWidthChange(width);
    else setInternalPanelWidth(width);
  };

  useEffect(() => {
    setActiveType(initialType);
  }, [initialType]);

  // Handle Drag-to-Resize Panel Width
  const startResizing = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      const clamped = Math.max(340, Math.min(newWidth, Math.min(950, window.innerWidth * 0.75)));
      setPanelWidth(clamped);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isResizing) return;
      const touch = e.touches[0];
      const newWidth = window.innerWidth - touch.clientX;
      const clamped = Math.max(340, Math.min(newWidth, Math.min(950, window.innerWidth * 0.75)));
      setPanelWidth(clamped);
    };

    const stopResizing = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('mouseup', stopResizing);
      window.addEventListener('touchend', stopResizing);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', stopResizing);
      window.removeEventListener('touchend', stopResizing);
    };
  }, [isResizing]);

  const [presetProfile, setPresetProfile] = useState<ValidatorPresetProfile | null>(presetProfileProp || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'incomplete' | 'reset' | 'missing_name' | 'missing_nip';
    title: string;
    unansweredCount: number;
    missingSignature: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    type: 'incomplete',
    title: '',
    unansweredCount: 0,
    missingSignature: false,
    onConfirm: () => {},
  });

  const [formState, setFormState] = useState<ValidationFormState>({
    validatorName: presetProfileProp?.name || '',
    validatorNip: presetProfileProp?.nip || '',
    validatorInstansi: presetProfileProp?.instansi || '',
    validatorKeahlian: presetProfileProp?.keahlian || '',
    evaluationDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    ratings: {},
    feedback: '',
    conclusion: 'layak_dengan_revisi',
    signatureDataUrl: null
  });

  const [showKisiKisi, setShowKisiKisi] = useState(false);
  const [showPwaGuide, setShowPwaGuide] = useState(false);

  useEffect(() => {
    if (presetProfileProp) {
      setPresetProfile(presetProfileProp);
      setFormState(prev => ({
        ...prev,
        validatorName: presetProfileProp.name || prev.validatorName,
        validatorNip: presetProfileProp.nip || prev.validatorNip,
        validatorInstansi: presetProfileProp.instansi || prev.validatorInstansi,
        validatorKeahlian: presetProfileProp.keahlian || prev.validatorKeahlian,
      }));
    }
  }, [presetProfileProp]);

  if (!isOpen) return null;

  const currentInstrument: InstrumentDefinition = INSTRUMENTS[activeType];

  let answeredCount = 0;
  let totalScore = 0;
  const maxScore = currentInstrument.totalItems * 4;

  currentInstrument.aspects.forEach(aspect => {
    aspect.items.forEach(item => {
      if (formState.ratings[item.id]) {
        answeredCount++;
        totalScore += formState.ratings[item.id];
      }
    });
  });

  const percentage = maxScore > 0 ? ((totalScore / maxScore) * 100).toFixed(1) : '0';
  const pctNum = parseFloat(percentage);

  let category = 'Belum Lengkap';
  let categoryColor = 'text-gray-400 border-gray-400 bg-gray-500/10';
  if (answeredCount === currentInstrument.totalItems) {
    if (pctNum >= 81.25) {
      category = 'Sangat Layak';
      categoryColor = 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    } else if (pctNum >= 62.5) {
      category = 'Layak';
      categoryColor = 'text-blue-400 border-blue-500/30 bg-blue-500/10';
    } else if (pctNum >= 43.75) {
      category = 'Cukup Layak';
      categoryColor = 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    } else {
      category = 'Tidak Layak';
      categoryColor = 'text-red-400 border-red-500/30 bg-red-500/10';
    }
  }

  const handlePrint = () => {
    window.print();
  };

  const handleRatingChange = (itemId: number, score: number) => {
    setFormState(prev => ({
      ...prev,
      ratings: {
        ...prev.ratings,
        [itemId]: score
      }
    }));
  };

  const handleResetForm = () => {
    setConfirmModal({
      isOpen: true,
      type: 'reset',
      title: 'Konfirmasi Reset Form',
      unansweredCount: 0,
      missingSignature: false,
      onConfirm: () => {
        setFormState({
          validatorName: presetProfile?.name || '',
          validatorNip: presetProfile?.nip || '',
          validatorInstansi: presetProfile?.instansi || 'Pendidikan Teknik Elektro UNY',
          validatorKeahlian: presetProfile?.keahlian || '',
          evaluationDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
          ratings: {},
          feedback: '',
          conclusion: 'layak_dengan_revisi',
          signatureDataUrl: null
        });
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const executeSubmission = async () => {
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
    setIsSubmitting(true);
    const safeKeyName = formState.validatorName.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');

    const payload = {
      validatorName: formState.validatorName.trim(),
      validatorNip: formState.validatorNip.trim(),
      validatorInstansi: formState.validatorInstansi.trim(),
      validatorKeahlian: formState.validatorKeahlian.trim(),
      instrumentType: activeType,
      instrumentTitle: currentInstrument.title,
      ratings: formState.ratings,
      feedback: formState.feedback,
      conclusion: formState.conclusion,
      totalScore,
      maxScore,
      percentage: parseFloat(percentage),
      category,
      signatureDataUrl: formState.signatureDataUrl,
      evaluationDate: formState.evaluationDate,
      submittedAt: serverTimestamp(),
    };

    try {
      // Check if document from this validator already exists for this instrument type
      const q = query(
        collection(db, 'validation_responses'),
        where('validatorName', '==', formState.validatorName.trim()),
        where('instrumentType', '==', activeType)
      );
      const querySnap = await getDocs(q);

      if (!querySnap.empty) {
        // Update existing record
        const existingDocId = querySnap.docs[0].id;
        await setDoc(doc(db, 'validation_responses', existingDocId), payload, { merge: true });
      } else {
        // Create new record
        await addDoc(collection(db, 'validation_responses'), payload);
      }

      localStorage.setItem(`z80sim_val_${activeType}_${safeKeyName}`, JSON.stringify(formState));
      setSubmitSuccess(true);
    } catch (err) {
      console.error('Firestore submit fallback to localStorage:', err);
      localStorage.setItem(`z80sim_val_${activeType}_${safeKeyName}`, JSON.stringify(formState));
      setSubmitSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = () => {
    if (!formState.validatorName.trim()) {
      setConfirmModal({
        isOpen: true,
        type: 'missing_name',
        title: activeType === 'mahasiswa' ? 'Nama Mahasiswa Belum Terisi' : 'Nama Validator Belum Terisi',
        unansweredCount: 0,
        missingSignature: false,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
      });
      return;
    }

    if (!formState.validatorNip.trim()) {
      setConfirmModal({
        isOpen: true,
        type: 'missing_nip',
        title: activeType === 'mahasiswa' ? 'NIM Belum Terisi' : 'NIP / NIDN Belum Terisi',
        unansweredCount: 0,
        missingSignature: false,
        onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false })),
      });
      return;
    }

    const unanswered = currentInstrument.totalItems - answeredCount;
    const missingSig = !formState.signatureDataUrl;

    if (unanswered > 0 || missingSig) {
      setConfirmModal({
        isOpen: true,
        type: 'incomplete',
        title: 'Penilaian Belum Lengkap',
        unansweredCount: unanswered,
        missingSignature: missingSig,
        onConfirm: executeSubmission,
      });
      return;
    }

    executeSubmission();
  };

  const bg = isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-white border-gray-200 text-gray-900';
  const cardBg = isDark ? 'bg-zinc-950/60 border-zinc-800' : 'bg-gray-50/90 border-gray-200';
  const textMuted = isDark ? 'text-zinc-400' : 'text-gray-500';
  const inputBg = isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-100 focus:border-blue-500' : 'bg-white border-gray-300 text-gray-900 focus:border-blue-600';

  return (
    <>
      {/* Printable PDF Sheet (Rendered at root via createPortal) */}
      <PrintableValidationSheet instrument={currentInstrument} formState={formState} />

      {/* Mode 2: Minimized Bottom-Right Floating Widget */}
      {windowMode === 'minimized' && (
        <div className="fixed right-4 bottom-4 z-[100] print:hidden pointer-events-auto">
          <button
            onClick={() => setWindowMode('split')}
            className="flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-2xl shadow-blue-500/40 border border-blue-400/30 transition-all hover:scale-105"
            title="Klik untuk membuka kembali Form Validasi (Split View)"
          >
            <FileCheck2 className="w-5 h-5 animate-bounce text-blue-200" />
            <span>Form Validasi ({answeredCount}/{currentInstrument.totalItems} Butir)</span>
            <Columns className="w-4 h-4 ml-1 opacity-80" />
          </button>
        </div>
      )}

      {/* Mode 1 & 3: Split Screen View OR Centered Modal */}
      {windowMode !== 'minimized' && (
        <div
          className={`print:hidden ${
            windowMode === 'modal'
              ? 'fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm pointer-events-auto'
              : 'w-full h-full pointer-events-none relative z-50'
          }`}
        >
          <div
            className={`${bg} transition-all duration-150 relative ${
              windowMode === 'split'
                ? 'w-full h-full flex flex-col border-l shadow-2xl border-zinc-700/80 overflow-hidden pointer-events-auto'
                : 'w-full max-w-4xl h-[92vh] sm:h-[88vh] shadow-2xl rounded-2xl border flex flex-col overflow-hidden pointer-events-auto'
            }`}
          >
            {/* Drag Handle to Resize Split Width (Visible on desktop in split mode) */}
            {windowMode === 'split' && (
              <div
                onMouseDown={startResizing}
                onTouchStart={startResizing}
                className={`hidden md:flex absolute left-0 top-0 bottom-0 w-3 cursor-col-resize z-50 items-center justify-center transition-colors group select-none ${
                  isResizing
                    ? 'bg-blue-600 text-white'
                    : isDark ? 'hover:bg-blue-500/40 text-zinc-600 hover:text-blue-400' : 'hover:bg-blue-500/30 text-gray-400 hover:text-blue-600'
                }`}
                title="Tarik ke kiri/kanan untuk menyesuaikan lebar form validasi"
              >
                <GripVertical className="w-4 h-5 opacity-70 group-hover:opacity-100" />
              </div>
            )}

            {/* Header */}
            <div className={`flex items-center justify-between px-4 py-3 sm:px-5 sm:py-3.5 border-b ${isDark ? 'border-zinc-800 bg-zinc-950/80' : 'border-gray-200 bg-gray-50'}`}>
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 flex-shrink-0">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-sm sm:text-base truncate flex items-center gap-2">
                    Form Validasi R&amp;D
                    <span className="hidden sm:inline-flex px-2.5 py-0.5 text-xs font-semibold rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      {windowMode === 'split' ? `${panelWidth}px` : 'Layar Penuh'}
                    </span>
                  </h3>
                  <p className={`text-xs truncate ${textMuted}`}>Tarik garis kiri untuk atur lebar panel</p>
                </div>
              </div>

              {/* Toolbar Controls */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* View Mode Switcher */}
                <div className={`flex items-center gap-1 p-1 rounded-xl border text-xs ${isDark ? 'bg-zinc-950 border-zinc-800' : 'bg-gray-200/80 border-gray-300'}`}>
                  <button
                    onClick={() => setWindowMode('split')}
                    className={`p-1.5 sm:px-2 sm:py-1 rounded-lg transition-all flex items-center gap-1 text-xs ${
                      windowMode === 'split'
                        ? 'bg-blue-600 text-white shadow-sm font-semibold'
                        : isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Mode Split Screen (Bisa ditarik lebarnya)"
                  >
                    <Columns className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setWindowMode('modal')}
                    className={`p-1.5 sm:px-2 sm:py-1 rounded-lg transition-all flex items-center gap-1 text-xs ${
                      windowMode === 'modal'
                        ? 'bg-blue-600 text-white shadow-sm font-semibold'
                        : isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Mode Layar Penuh (Tengah)"
                  >
                    <Maximize2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setWindowMode('minimized')}
                    className={`p-1.5 sm:px-2 sm:py-1 rounded-lg transition-all flex items-center gap-1 text-xs ${
                      windowMode === 'minimized'
                        ? 'bg-blue-600 text-white shadow-sm font-semibold'
                        : isDark ? 'text-zinc-400 hover:text-zinc-200' : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Minimize ke widget pojok bawah"
                  >
                    <Minimize2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Close Button */}
                <button
                  onClick={onClose}
                  className={`p-1.5 sm:p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-gray-200 text-gray-600'}`}
                  title="Tutup Form Validasi"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Instrument Title Banner */}
            <div className={`px-4 py-2.5 border-b text-xs font-bold flex items-center justify-between gap-2 overflow-x-auto ${isDark ? 'bg-zinc-950/60 border-zinc-800 text-zinc-300' : 'bg-gray-100/90 border-gray-200 text-gray-700'}`}>
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                <span className="truncate uppercase tracking-wider">{currentInstrument.title}</span>
              </div>
              
              {/* Progress & Percentage Badges (Replaces role title) */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1.5 whitespace-nowrap">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
                  <span>{answeredCount} / {currentInstrument.totalItems} Butir</span>
                </span>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 whitespace-nowrap ${categoryColor}`}>
                  <BarChart3 className="w-3.5 h-3.5" />
                  <span>{percentage}% ({category})</span>
                </span>
              </div>
            </div>

            {/* Main Form Content */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6" style={{ WebkitOverflowScrolling: 'touch' }}>
              
              {/* Title Summary Card */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${cardBg}`}>
                <div className="space-y-1">
                  <h4 className="font-bold text-sm sm:text-base text-blue-400 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-blue-500 flex-shrink-0" />
                    {currentInstrument.title}
                  </h4>
                  <p className={`text-xs sm:text-sm ${textMuted}`}>{currentInstrument.subtitle}</p>
                </div>
              </div>

              {/* Section A: Identitas */}
              <div className={`p-4 sm:p-5 rounded-2xl border space-y-4 ${cardBg}`}>
                <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-blue-400 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" />
                  {activeType === 'materi' || activeType === 'media' ? 'A. Identitas Validator' : 'A. Identitas Responden'}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs sm:text-sm">
                  <div>
                    <label className="block mb-1.5 font-semibold text-xs sm:text-sm">
                      {activeType === 'dosen' ? 'Nama Dosen' : activeType === 'mahasiswa' ? 'Nama' : 'Nama Validator'} *
                    </label>
                    <input
                      type="text"
                      placeholder={activeType === 'mahasiswa' ? 'Nama Mahasiswa' : 'Contoh: Sigit Yatmono, S.T., M.T.'}
                      value={formState.validatorName}
                      onChange={(e) => setFormState(prev => ({ ...prev, validatorName: e.target.value }))}
                      className={`w-full p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm outline-none transition-colors ${inputBg}`}
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-xs sm:text-sm">
                      {activeType === 'mahasiswa' ? 'NIM' : 'NIP / NIDN'} *
                    </label>
                    <input
                      type="text"
                      placeholder={activeType === 'mahasiswa' ? 'Contoh: 21501241001' : 'Contoh: 19730125 199903 1 001'}
                      value={formState.validatorNip}
                      onChange={(e) => setFormState(prev => ({ ...prev, validatorNip: e.target.value }))}
                      className={`w-full p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm outline-none transition-colors ${inputBg}`}
                    />
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-xs sm:text-sm">
                      {activeType === 'mahasiswa' ? 'Program Studi' : 'Instansi'}
                    </label>
                    {activeType === 'mahasiswa' ? (
                      <div className="relative">
                        <select
                          value={formState.validatorInstansi || 'Pendidikan Teknik Elektro'}
                          onChange={(e) => setFormState(prev => ({ ...prev, validatorInstansi: e.target.value }))}
                          className={`w-full p-2.5 sm:p-3 pr-10 rounded-xl border text-xs sm:text-sm outline-none transition-all cursor-pointer appearance-none hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${inputBg}`}
                        >
                          <option value="Pendidikan Teknik Elektro">Pendidikan Teknik Elektro</option>
                          <option value="Teknik Elektro">Teknik Elektro</option>
                          <option value="Pendidikan Teknik Elektronika">Pendidikan Teknik Elektronika</option>
                          <option value="Teknik Elektronika">Teknik Elektronika</option>
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    ) : (
                      <input
                        type="text"
                        placeholder="Contoh: Pendidikan Teknik Elektro UNY"
                        value={formState.validatorInstansi}
                        onChange={(e) => setFormState(prev => ({ ...prev, validatorInstansi: e.target.value }))}
                        className={`w-full p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm outline-none transition-colors ${inputBg}`}
                      />
                    )}
                  </div>

                  <div>
                    <label className="block mb-1.5 font-semibold text-xs sm:text-sm">
                      {activeType === 'dosen' ? 'Mata Kuliah yang Diampu' : activeType === 'mahasiswa' ? 'Angkatan' : 'Bidang Keahlian'}
                    </label>
                    {activeType === 'mahasiswa' ? (
                      <div className="relative">
                        <select
                          value={formState.validatorKeahlian || '2023'}
                          onChange={(e) => setFormState(prev => ({ ...prev, validatorKeahlian: e.target.value }))}
                          className={`w-full p-2.5 sm:p-3 pr-10 rounded-xl border text-xs sm:text-sm outline-none transition-all cursor-pointer appearance-none hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 ${inputBg}`}
                        >
                          <option value="2023">2023</option>
                          <option value="2024">2024</option>
                          <option value="2025">2025</option>
                          <option value="2026">2026</option>
                        </select>
                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                    ) : (
                      <input
                        type="text"
                        placeholder={activeType === 'dosen' ? 'Contoh: Sistem Mikroprosesor & Kontrol' : 'Contoh: Sistem Mikroprosesor & Kontrol'}
                        value={formState.validatorKeahlian}
                        onChange={(e) => setFormState(prev => ({ ...prev, validatorKeahlian: e.target.value }))}
                        className={`w-full p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm outline-none transition-colors ${inputBg}`}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Kisi-kisi Instrumen (Collapsible) */}
              <div className={`rounded-2xl border transition-all duration-300 ${cardBg}`}>
                <button 
                  type="button"
                  onClick={() => setShowKisiKisi(!showKisiKisi)}
                  className="w-full flex items-center justify-between gap-2 p-3 sm:p-4 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <div className="flex items-center gap-2 text-blue-500 font-bold uppercase text-xs sm:text-sm tracking-wider">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>Kisi-kisi Instrumen</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showKisiKisi ? 'rotate-180' : ''} shrink-0`} />
                </button>
                
                {showKisiKisi && (
                  <div className="px-4 pb-4 animate-fade-in text-xs sm:text-sm border-t border-black/5 dark:border-white/5 pt-3">
                    <p className={`font-medium ${textMuted} mb-3`}>
                      Instrumen ini terdiri dari <strong>{currentInstrument.totalItems} butir pernyataan</strong> yang mencakup aspek-aspek berikut:
                    </p>
                    <ul className="space-y-2">
                      {currentInstrument.aspects.map((aspect, idx) => {
                        const titleParts = aspect.title.split(':');
                        const mainTitle = titleParts[0];
                        const subTitle = titleParts[1]?.trim() || '';
                        
                        return (
                          <li key={idx} className="flex gap-2.5 items-start bg-black/5 dark:bg-white/5 p-2.5 rounded-xl border border-black/5 dark:border-white/5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                            <div className={`flex-1 ${textMuted}`}>
                              <p className="font-bold text-gray-800 dark:text-gray-200">
                                {mainTitle}{subTitle ? `: ${subTitle}` : ''}
                              </p>
                              {aspect.indicator && (
                                <p className="mt-0.5 leading-relaxed text-[11px] sm:text-xs">
                                  {aspect.indicator}
                                </p>
                              )}
                              <div className="mt-1.5">
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-500 border border-blue-500/20">
                                  {aspect.items.length} Butir
                                </span>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>

              {/* Section B: Butir Penilaian (Likert Questionnaire) */}
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl border bg-blue-500/5 border-blue-500/20 space-y-1.5">
                  <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-blue-400 flex items-center gap-2">
                    <Award className="w-4 h-4 text-blue-500 flex-shrink-0" />
                    <span>B. Butir Penilaian (Skala 1 s.d. 4)</span>
                  </h4>
                  <div className={`text-xs font-medium ${textMuted} flex flex-wrap items-center gap-x-2 gap-y-1 pl-6`}>
                    <span className="font-bold text-blue-400">Keterangan:</span>
                    <span><strong className="text-emerald-400">SS</strong> = Sangat Setuju (4)</span>
                    <span>•</span>
                    <span><strong className="text-blue-400">S</strong> = Setuju (3)</span>
                    <span>•</span>
                    <span><strong className="text-amber-400">TS</strong> = Tidak Setuju (2)</span>
                    <span>•</span>
                    <span><strong className="text-red-400">STS</strong> = Sangat Tidak Setuju (1)</span>
                  </div>
                </div>

                {currentInstrument.aspects.map((aspect, aspectIdx) => (
                  <div key={aspectIdx} className={`rounded-2xl border overflow-hidden ${cardBg}`}>
                    <div className={`px-4 py-3 border-b font-bold text-xs sm:text-sm ${isDark ? 'bg-blue-500/10 text-blue-400 border-zinc-800' : 'bg-blue-50 text-blue-700 border-gray-200'}`}>
                      {aspect.title}
                    </div>

                    <div className="divide-y divide-zinc-800/40">
                      {aspect.items.map((item) => {
                        const selectedRating = formState.ratings[item.id];
                        return (
                          <div key={item.id} className="p-3.5 sm:p-4 flex flex-col gap-3 hover:bg-blue-500/5 transition-colors">
                            <div className="flex items-start gap-3 min-w-0 flex-1">
                              <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 font-bold text-xs sm:text-sm flex items-center justify-center flex-shrink-0 mt-0.5">
                                {item.id}
                              </span>
                              <p className="text-xs sm:text-sm leading-relaxed font-medium">{item.statement}</p>
                            </div>

                            {/* Testing Guidance & Quick Test Code Button */}
                            {item.testGuide && (
                              <div className={`ml-9 p-2.5 sm:p-3 rounded-xl border text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                                isDark ? 'bg-blue-950/40 border-blue-800/50 text-blue-300' : 'bg-blue-50/90 border-blue-200 text-blue-900'
                              }`}>
                                <div className="flex items-start gap-2 min-w-0">
                                  <Sparkles className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                                  <p className="leading-relaxed">
                                    <strong className="font-bold">Panduan Pengujian:</strong> {item.testGuide}
                                  </p>
                                </div>
                                {item.sampleCode && onTryCode && (
                                  <button
                                    type="button"
                                    onClick={() => onTryCode(item.sampleCode!)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all hover:scale-105 flex-shrink-0 self-end sm:self-auto"
                                    title="Klik untuk langsung memuat contoh kode pengujian ke Editor Z-80"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                                    <span>Uji Kode Ini</span>
                                  </button>
                                )}
                                {item.externalLink && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (item.installPwa) {
                                        const triggered = triggerPwaInstall();
                                        if (!triggered) {
                                          setShowPwaGuide(true);
                                        }
                                      } else {
                                        window.open(item.externalLink, '_blank');
                                      }
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all hover:scale-105 flex-shrink-0 self-end sm:self-auto cursor-pointer"
                                    title={item.installPwa ? "Klik untuk mengunduh / menginstall aplikasi PWA untuk penggunaan offline" : "Buka Web Utama"}
                                  >
                                    {item.installPwa ? <Download className="w-3.5 h-3.5 text-white" /> : <ExternalLink className="w-3.5 h-3.5 text-white" />}
                                    <span>{item.externalLinkText || 'Buka Web Utama'}</span>
                                  </button>
                                )}
                              </div>
                            )}

                            {/* Likert 4 Radio options */}
                            <div className="flex items-center gap-2 justify-end flex-shrink-0 pl-9">
                              {[
                                { score: 4, label: 'SS (4)', full: 'SS: Sangat Setuju (Skor 4)' },
                                { score: 3, label: 'S (3)', full: 'S: Setuju (Skor 3)' },
                                { score: 2, label: 'TS (2)', full: 'TS: Tidak Setuju (Skor 2)' },
                                { score: 1, label: 'STS (1)', full: 'STS: Sangat Tidak Setuju (Skor 1)' },
                              ].map((opt) => {
                                const isChecked = selectedRating === opt.score;
                                return (
                                  <button
                                    key={opt.score}
                                    type="button"
                                    title={opt.full}
                                    onClick={() => handleRatingChange(item.id, opt.score)}
                                    className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold border transition-all ${
                                      isChecked
                                        ? 'bg-blue-600 text-white border-blue-500 shadow-sm scale-105'
                                        : isDark ? 'border-zinc-700 bg-zinc-900 text-zinc-300 hover:border-zinc-500' : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Section C: Saran dan Masukan */}
              <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${cardBg}`}>
                <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-blue-400">
                  C. Saran dan Masukan untuk Perbaikan Media
                </h4>
                <textarea
                  rows={3}
                  placeholder="Tuliskan saran atau catatan masukan Anda di sini..."
                  value={formState.feedback}
                  onChange={(e) => setFormState(prev => ({ ...prev, feedback: e.target.value }))}
                  className={`w-full p-3 rounded-xl border text-xs sm:text-sm outline-none transition-colors ${inputBg}`}
                />
              </div>

              {/* Section D: Kesimpulan Penilaian */}
              <div className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${cardBg}`}>
                <h4 className="font-bold text-xs sm:text-sm uppercase tracking-wider text-blue-400">
                  D. Kesimpulan Penilaian Kelayakan Media
                </h4>
                <div className="space-y-2 text-xs sm:text-sm">
                  {[
                    { value: 'layak_tanpa_revisi', label: 'Layak digunakan tanpa revisi' },
                    { value: 'layak_dengan_revisi', label: 'Layak digunakan dengan revisi sesuai saran' },
                    { value: 'tidak_layak', label: 'Tidak layak digunakan, perlu revisi besar' },
                  ].map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
                      <input
                        type="radio"
                        name="conclusion"
                        value={opt.value}
                        checked={formState.conclusion === opt.value}
                        onChange={(e) => setFormState(prev => ({ ...prev, conclusion: e.target.value }))}
                        className="accent-blue-500 w-4 h-4"
                      />
                      <span className="font-medium text-xs sm:text-sm">{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Section E: Tanda Tangan Digital */}
              <div className={`p-4 sm:p-5 rounded-2xl border ${cardBg}`}>
                <SignaturePad
                  isDark={isDark}
                  onSave={(dataUrl) => setFormState(prev => ({ ...prev, signatureDataUrl: dataUrl }))}
                />
              </div>

              {/* Action Bar */}
              <div className="pt-4 flex items-center justify-between gap-2 sm:gap-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className={`flex items-center gap-1.5 p-2 sm:px-3 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold border transition-colors ${
                    isDark ? 'border-zinc-700 text-zinc-400 hover:bg-zinc-800' : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                  title="Reset Form"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" /> <span className="hidden sm:inline">Reset Form</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrint}
                    className={`flex items-center gap-1.5 p-2 sm:px-4 sm:py-2.5 rounded-xl border text-xs sm:text-sm font-bold transition-all ${
                      isDark ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-200' : 'border-gray-300 hover:bg-gray-100 text-gray-700'
                    }`}
                    title="Pratinjau & simpan salinan PDF"
                  >
                    <Eye className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="hidden sm:inline">Preview / Unduh PDF</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-3 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-500/25 transition-all hover:scale-105"
                    title="Kirim Hasil Validasi"
                  >
                    <Send className="w-4 h-4 text-white shrink-0" />
                    <span>{isSubmitting ? 'Mengirim...' : (
                      <>
                        <span className="hidden sm:inline">Kirim Hasil Validasi</span>
                        <span className="sm:hidden">Kirim</span>
                      </>
                    )}</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Submission Success Modal */}
      {submitSuccess && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-3xl border shadow-2xl text-center space-y-4 ${isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-white border-gray-200 text-gray-900'}`}>
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-500 flex items-center justify-center mx-auto border border-emerald-500/30">
              <CheckCircle className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold">Hasil Validasi Terkirim!</h3>
            <p className={`text-xs sm:text-sm ${textMuted} leading-relaxed`}>
              Terima kasih Yth. <strong>{formState.validatorName || 'Bapak/Ibu/Saudara'}</strong> atas waktu, penilaian, dan masukan berharga yang telah Anda berikan untuk pengembangan media pembelajaran Web Simulator Z-80 ini.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
              <button
                onClick={() => {
                  setSubmitSuccess(false);
                  handlePrint();
                }}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak / Simpan PDF</span>
              </button>
              <button
                onClick={() => {
                  setSubmitSuccess(false);
                  onClose();
                }}
                className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold ${isDark ? 'border-zinc-700 hover:bg-zinc-800' : 'border-gray-300 hover:bg-gray-100'}`}
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Confirmation Web Modal (Replaces browser window.confirm/alert) */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className={`w-full max-w-lg p-5 sm:p-6 rounded-3xl border shadow-2xl space-y-4 ${isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-100' : 'bg-white border-gray-200 text-gray-900'}`}>
            
            {/* Header */}
            <div className="flex items-center gap-3">
              <div className={`w-11 h-11 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                confirmModal.type === 'reset'
                  ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30'
                  : 'bg-blue-500/20 text-blue-500 border border-blue-500/30'
              }`}>
                {confirmModal.type === 'reset' ? <RotateCcw className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5 text-amber-500" />}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold">{confirmModal.title}</h3>
                <p className={`text-xs ${textMuted}`}>
                  {confirmModal.type === 'reset' ? 'Tindakan pengosongan form' : `Yth. ${formState.validatorName || 'Bapak/Ibu/Saudara'}`}
                </p>
              </div>
            </div>

            {/* Content Body */}
            {confirmModal.type === 'missing_name' && (
              <p className={`text-xs sm:text-sm leading-relaxed ${textMuted}`}>
                Mohon maaf Bapak/Ibu/Saudara, <strong>{activeType === 'mahasiswa' ? 'Nama Mahasiswa' : 'Nama Validator'} belum terisi</strong>. Mohon berkenan melengkapi nama terlebih dahulu sebelum mengirimkan hasil validasi.
              </p>
            )}

            {confirmModal.type === 'missing_nip' && (
              <p className={`text-xs sm:text-sm leading-relaxed ${textMuted}`}>
                Mohon maaf Bapak/Ibu/Saudara, <strong>{activeType === 'mahasiswa' ? 'NIM Mahasiswa' : 'NIP / NIDN'} belum terisi</strong>. Mohon berkenan melengkapi kolom {activeType === 'mahasiswa' ? 'NIM' : 'NIP'} terlebih dahulu sebelum mengirimkan hasil validasi.
              </p>
            )}

            {confirmModal.type === 'reset' && (
              <p className={`text-xs sm:text-sm leading-relaxed ${textMuted}`}>
                Apakah Anda yakin ingin mengosongkan seluruh isian data identitas, skor penilaian, dan tanda tangan digital pada lembar validasi ini?
              </p>
            )}

            {confirmModal.type === 'incomplete' && (
              <div className="space-y-3">
                <p className={`text-xs sm:text-sm leading-relaxed ${textMuted}`}>
                  Dengan hormat <strong>{formState.validatorName}</strong>, masih terdapat bagian yang belum terisi pada lembar validasi ini:
                </p>

                <div className={`p-3.5 rounded-2xl border space-y-2 text-xs sm:text-sm ${isDark ? 'bg-amber-950/30 border-amber-800/50 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                  {confirmModal.unansweredCount > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                      <span>Masih terdapat <strong>{confirmModal.unansweredCount} dari {currentInstrument.totalItems} butir penilaian</strong> yang belum terisi.</span>
                    </div>
                  )}
                  {confirmModal.missingSignature && (
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0" />
                      <span><strong>Tanda Tangan Digital</strong> belum dibubuhkan pada bagian bawah lembar validasi.</span>
                    </div>
                  )}
                </div>

                <p className={`text-xs font-semibold ${textMuted}`}>
                  Apakah Anda tetap ingin mengirimkan hasil validasi ini?
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 flex flex-col sm:flex-row gap-2.5 justify-end">
              {confirmModal.type === 'missing_name' ? (
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="w-full px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md"
                >
                  Paham &amp; Lengkapi Nama
                </button>
              ) : confirmModal.type === 'missing_nip' ? (
                <button
                  onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                  className="w-full px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm shadow-md"
                >
                  Paham &amp; Lengkapi {activeType === 'mahasiswa' ? 'NIM' : 'NIP/NIDN'}
                </button>
              ) : confirmModal.type === 'reset' ? (
                <>
                  <button
                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-semibold ${isDark ? 'border-zinc-700 hover:bg-zinc-800' : 'border-gray-300 hover:bg-gray-100'}`}
                  >
                    Batal
                  </button>
                  <button
                    onClick={confirmModal.onConfirm}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm shadow-md"
                  >
                    Ya, Reset Form
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    className={`px-4 py-2.5 rounded-xl border text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 ${isDark ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-200' : 'border-gray-300 hover:bg-gray-100 text-gray-700'}`}
                  >
                    <PenTool className="w-4 h-4 text-blue-500" />
                    <span>Kembali &amp; Lengkapi</span>
                  </button>
                  <button
                    onClick={confirmModal.onConfirm}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-4 h-4 text-white" />
                    <span>Tetap Kirim</span>
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* PWA Install Guide Modal */}
      {showPwaGuide && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowPwaGuide(false)}>
          <div className={`w-full max-w-md rounded-2xl border p-5 sm:p-6 space-y-4 shadow-2xl ${cardBg}`} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-black/10 dark:border-white/10 pb-3">
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-base">
                <Download className="w-5 h-5" />
                <span>Panduan Unduh / Install PWA</span>
              </div>
              <button onClick={() => setShowPwaGuide(false)} className={`p-1 rounded-lg ${textMuted} hover:bg-black/5 dark:hover:bg-white/5`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className={`text-xs sm:text-sm ${textMuted} leading-relaxed`}>
              Aplikasi Web Simulator Z-80 didesain sebagai <strong>Progressive Web App (PWA)</strong> sehingga dapat diunduh dan dijalankan secara <strong>Offline 100% tanpa koneksi internet</strong>.
            </p>

            <div className="space-y-3 text-xs sm:text-sm">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 space-y-1">
                <div className="flex items-center gap-2 font-bold text-blue-400">
                  <Laptop className="w-4 h-4" />
                  <span>1. Desktop (Chrome / Edge):</span>
                </div>
                <p className={textMuted}>Klik ikon <strong>Install / Download</strong> di sebelah kanan Address Bar (kolom URL) browser, atau buka Menu titik 3 &rarr; <strong>Install Z-80 Simulator</strong>.</p>
              </div>

              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <div className="flex items-center gap-2 font-bold text-emerald-400">
                  <Smartphone className="w-4 h-4" />
                  <span>2. Android (Chrome / Edge):</span>
                </div>
                <p className={textMuted}>Klik Menu titik 3 di kanan atas &rarr; pilih <strong>"Tambahkan ke Layar Utama" (Add to Home Screen)</strong> / <strong>Install Aplikasi</strong>.</p>
              </div>

              <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-1">
                <div className="flex items-center gap-2 font-bold text-purple-400">
                  <Apple className="w-4 h-4" />
                  <span>3. iOS / iPhone (Safari):</span>
                </div>
                <p className={textMuted}>Tekan tombol <strong>Bagikan (Share)</strong> di bagian bawah &rarr; pilih <strong>"Add to Home Screen" (Tambah ke Layar Utama)</strong>.</p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-2 border-t border-black/10 dark:border-white/10">
              <a
                href="https://z80-simulation.web.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs text-center shadow-md transition-all hover:scale-105"
              >
                Buka Web Utama (`z80-simulation.web.app`)
              </a>
              <button
                type="button"
                onClick={() => setShowPwaGuide(false)}
                className={`py-2.5 px-4 rounded-xl border text-xs font-semibold ${isDark ? 'border-zinc-700 hover:bg-zinc-800' : 'border-gray-300 hover:bg-gray-100'}`}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
