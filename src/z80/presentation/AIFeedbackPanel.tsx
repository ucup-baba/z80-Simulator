/**
 * AI Feedback Panel Component
 * Displays rule-based code analysis results with premium UI
 */

import React, { useState } from 'react';
import { useTheme } from './ThemeContext';
import type { AnalysisFeedback, AnalysisResult, FeedbackSeverity, FeedbackCategory } from '../usecases/programAnalyzer';
import { deepAnalyzeZ80Code } from '../usecases/geminiAnalyzer';
import { Bot, Search, Lightbulb, FileText, CheckCircle2, Activity, Repeat, Trash2, Package, RefreshCw, Sparkles, Hourglass, Flag, Zap, PartyPopper } from 'lucide-react';

interface AIFeedbackPanelProps {
  isOpen: boolean;
  onClose: () => void;
  analysisResult: AnalysisResult | null;
  onAnalyze: () => void;
  hasProgram: boolean;
  sourceCode: string;
}

const SEVERITY_META: Record<FeedbackSeverity, { color: string; darkColor: string; bg: string; darkBg: string; label: string }> = {
  error:   { color: 'text-red-600', darkColor: 'text-red-400', bg: 'bg-red-50 border-red-200', darkBg: 'bg-red-950/30 border-red-800/50', label: 'Error' },
  warning: { color: 'text-amber-600', darkColor: 'text-amber-400', bg: 'bg-amber-50 border-amber-200', darkBg: 'bg-amber-950/30 border-amber-800/50', label: 'Peringatan' },
  info:    { color: 'text-blue-600', darkColor: 'text-blue-400', bg: 'bg-blue-50 border-blue-200', darkBg: 'bg-blue-950/30 border-blue-800/50', label: 'Info' },
  tip:     { color: 'text-emerald-600', darkColor: 'text-emerald-400', bg: 'bg-emerald-50 border-emerald-200', darkBg: 'bg-emerald-950/30 border-emerald-800/50', label: 'Tips' },
};

const CATEGORY_LABELS: Record<FeedbackCategory, React.ReactNode> = {
  'infinite-loop': <><Repeat className="w-3.5 h-3.5 inline mr-1" /> Infinite Loop</>,
  'register-misuse': <><FileText className="w-3.5 h-3.5 inline mr-1" /> Register</>,
  'dead-code': <><Trash2 className="w-3.5 h-3.5 inline mr-1" /> Dead Code</>,
  'stack-issue': <><Package className="w-3.5 h-3.5 inline mr-1" /> Stack</>,
  'efficiency': <><Zap className="w-3.5 h-3.5 inline mr-1" /> Efisiensi</>,
  'flag-awareness': <><Flag className="w-3.5 h-3.5 inline mr-1" /> Flags</>,
  'best-practice': <><CheckCircle2 className="w-3.5 h-3.5 inline mr-1" /> Best Practice</>,
};

function ScoreGauge({ score, isDark }: { score: number; isDark: boolean }) {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;
  const color = score >= 80 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative w-20 h-20 flex-shrink-0">
      <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
        <circle cx="40" cy="40" r="36" fill="none" stroke={isDark ? '#27272a' : '#e5e7eb'} strokeWidth="6" />
        <circle
          cx="40" cy="40" r="36" fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-lg font-bold ${isDark ? 'text-zinc-100' : 'text-gray-900'}`}>{score}</span>
      </div>
    </div>
  );
}

function FeedbackItem({ feedback, isDark }: { feedback: AnalysisFeedback; isDark: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const meta = SEVERITY_META[feedback.severity];

  return (
    <div
      className={`border rounded-xl p-3 transition-all duration-200 cursor-pointer hover:scale-[1.01] ${isDark ? meta.darkBg : meta.bg}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3">
        {/* Line badge */}
        <div className={`flex-shrink-0 px-2 py-0.5 rounded-md text-xs font-mono font-bold ${isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-white text-gray-600'} shadow-sm`}>
          L{feedback.line}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-sm font-semibold ${isDark ? meta.darkColor : meta.color}`}>{feedback.title}</span>
            <span className={`px-1.5 py-0.5 rounded text-xs ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-white/80 text-gray-500'}`}>
              {CATEGORY_LABELS[feedback.category]}
            </span>
          </div>

          {expanded && (
            <div className="mt-2 space-y-2">
              <p className={`text-sm leading-relaxed ${isDark ? 'text-zinc-300' : 'text-gray-700'}`}>
                {feedback.message}
              </p>
              {feedback.suggestion && (
                <div className={`flex items-start gap-2 text-xs px-3 py-2 rounded-lg ${isDark ? 'bg-zinc-900/80 text-emerald-400' : 'bg-white text-emerald-700'}`}>
                  <span className="flex-shrink-0 mt-0.5"><Lightbulb className="w-3.5 h-3.5" /></span>
                  <span>{feedback.suggestion}</span>
                </div>
              )}
            </div>
          )}

          {!expanded && (
            <p className={`text-xs mt-0.5 truncate ${isDark ? 'text-zinc-500' : 'text-gray-500'}`}>
              {feedback.message}
            </p>
          )}
        </div>

        {/* Expand icon */}
        <svg
          className={`w-4 h-4 flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''} ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
}

export const AIFeedbackPanel: React.FC<AIFeedbackPanelProps> = ({
  isOpen, onClose, analysisResult, onAnalyze, hasProgram, sourceCode,
}) => {
  const { isDark } = useTheme();

  const [isDeepScanning, setIsDeepScanning] = useState(false);
  const [geminiResponse, setGeminiResponse] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDeepScan = async () => {
    setIsDeepScanning(true);
    setGeminiResponse(null);
    const result = await deepAnalyzeZ80Code(sourceCode, analysisResult?.feedbacks || []);
    setGeminiResponse(result.markdown);
    setIsDeepScanning(false);
  };

  const overlayBg = 'bg-black/50 backdrop-blur-sm';
  const panelBg = isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200';
  const text = isDark ? 'text-zinc-100' : 'text-gray-900';
  const subtext = isDark ? 'text-zinc-400' : 'text-gray-500';
  const divider = isDark ? 'border-zinc-800' : 'border-gray-100';

  const errorCount = analysisResult?.feedbacks.filter(f => f.severity === 'error').length ?? 0;
  const warningCount = analysisResult?.feedbacks.filter(f => f.severity === 'warning').length ?? 0;
  const infoCount = analysisResult?.feedbacks.filter(f => f.severity === 'info').length ?? 0;
  const tipCount = analysisResult?.feedbacks.filter(f => f.severity === 'tip').length ?? 0;

  return (
    <div className={`fixed inset-0 z-50 ${overlayBg} flex items-center justify-center p-4`} onClick={onClose}>
      <div
        className={`w-full max-w-lg max-h-[85vh] rounded-2xl border ${panelBg} shadow-2xl overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with gradient */}
        <div className={`relative px-5 py-4 border-b ${divider} overflow-hidden`}>
          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 via-blue-500/10 to-emerald-500/10" />
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className={`text-lg font-bold ${text}`} style={{ fontFamily: 'var(--font-sans)' }}>
                  AI Code Review
                </h2>
                <p className={`text-xs ${subtext}`}>Analisis Otomatis Program Assembly Z-80</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg transition-colors ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-gray-100 text-gray-400'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {!analysisResult ? (
            // No analysis yet
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
                <Search className="w-8 h-8 text-purple-500" />
              </div>
              <p className={`text-center ${subtext} text-sm mb-4`}>
                {hasProgram
                  ? 'Klik "Analisis Kode" untuk memulai review otomatis program Assembly Anda.'
                  : 'Tulis kode Assembly dan klik "Load" terlebih dahulu, lalu jalankan analisis.'
                }
              </p>
              <button
                onClick={onAnalyze}
                disabled={!hasProgram}
                className={`px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                  hasProgram
                    ? 'bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-105 active:scale-95'
                    : isDark ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-center gap-2"><Search className="w-4 h-4" /> Analisis Kode</div>
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Score + Summary */}
              <div className={`flex items-center gap-4 p-4 rounded-xl ${isDark ? 'bg-zinc-800/50' : 'bg-gray-50'}`}>
                <ScoreGauge score={analysisResult.score} isDark={isDark} />
                <div className="flex-1">
                  <p className={`text-sm font-medium ${text}`}>{analysisResult.summary}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    {errorCount > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400">{errorCount} error</span>}
                    {warningCount > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">{warningCount} peringatan</span>}
                    {infoCount > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">{infoCount} info</span>}
                    {tipCount > 0 && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">{tipCount} tips</span>}
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex gap-2">
                <button
                  onClick={onAnalyze}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
                >
                  <div className="flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4" /> Linter Ulang</div>
                </button>
                <button
                  onClick={handleDeepScan}
                  disabled={isDeepScanning}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                    isDeepScanning 
                      ? 'bg-purple-500/50 cursor-not-allowed text-white' 
                      : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    {isDeepScanning ? <><Hourglass className="w-4 h-4 animate-spin" /> Menganalisis...</> : <><Sparkles className="w-4 h-4" /> Deep Scan (AI)</>}
                  </div>
                </button>
              </div>

              {/* Gemini Response Area */}
              {geminiResponse && (
                <div className={`mt-4 p-4 rounded-xl border ${isDark ? 'bg-purple-950/20 border-purple-800/50 text-zinc-200' : 'bg-purple-50 border-purple-200 text-gray-800'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <h3 className="font-bold text-sm">Saran Mentor AI:</h3>
                  </div>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed font-mono">
                    {geminiResponse}
                  </div>
                </div>
              )}

              {/* Feedback list */}
              {analysisResult.feedbacks.length === 0 ? (
                <div className="text-center py-8">
                  <PartyPopper className={`w-12 h-12 mx-auto mb-2 ${isDark ? 'text-emerald-500' : 'text-emerald-500'}`} />
                  <p className={`mt-2 text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-600'} font-medium`}>
                    Program Sempurna!
                  </p>
                  <p className={`text-xs ${subtext} mt-1 flex items-center justify-center gap-1`}>
                    Tidak ditemukan masalah logika. Kerja bagus! <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {analysisResult.feedbacks.map((fb) => (
                    <FeedbackItem key={fb.id} feedback={fb} isDark={isDark} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`px-5 py-3 border-t ${divider} flex-shrink-0`}>
          <p className={`text-xs text-center ${subtext}`}>
            Analisis berjalan 100% di browser • Klik feedback untuk detail
          </p>
        </div>
      </div>
    </div>
  );
};
