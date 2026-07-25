import React, { useState, useEffect, MouseEvent } from 'react';
import { useTheme } from './ThemeContext';
import {
  BookOpen, X, Search, ChevronDown, ChevronRight, Play,
  Cpu, MapPin, ArrowLeftRight, Calculator, Binary,
  GitBranch, Layers, StopCircle,
} from 'lucide-react';
import { materiSections, type MateriSection, type InstructionDetail } from '../data/materiData';

// Map icon name string to Lucide component
const iconMap: Record<string, React.ElementType> = {
  Cpu, MapPin, ArrowLeftRight, Calculator, Binary,
  GitBranch, Layers, StopCircle,
};

interface MateriDasarPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onTryCode?: (code: string) => void;
}

export const MateriDasarPanel: React.FC<MateriDasarPanelProps> = ({ isOpen, onClose, onTryCode }) => {
  const { isDark } = useTheme();

  const [isMobile, setIsMobile] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<string[]>([]);
  const [expandedInstructions, setExpandedInstructions] = useState<string[]>([]);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (!mobile) {
        setPosition({ x: window.innerWidth - 420, y: 80 });
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    if (isMobile) return;
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleMouseMove = (e: globalThis.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragOffset.x,
      y: e.clientY - dragOffset.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  if (!isOpen) return null;

  const toggleSection = (id: string) => {
    setExpandedSections((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const toggleInstruction = (key: string) => {
    setExpandedInstructions((prev) =>
      prev.includes(key) ? prev.filter((s) => s !== key) : [...prev, key]
    );
  };

  const handleTryCode = (code: string) => {
    if (onTryCode) {
      onTryCode(code);
    }
  };

  // Filter sections/instructions by search
  const filteredSections = searchQuery.trim()
    ? materiSections.map((section) => ({
        ...section,
        instructions: section.instructions.filter(
          (instr) =>
            instr.mnemonic.toLowerCase().includes(searchQuery.toLowerCase()) ||
            instr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            instr.description.toLowerCase().includes(searchQuery.toLowerCase())
        ),
      })).filter(
        (section) =>
          section.instructions.length > 0 ||
          section.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          section.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : materiSections;

  // Theme colors
  const bg = isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-gray-200';
  const text = isDark ? 'text-zinc-100' : 'text-gray-900';
  const textMuted = isDark ? 'text-zinc-400' : 'text-gray-500';
  const codeBg = isDark ? 'bg-zinc-800 text-emerald-400' : 'bg-gray-100 text-emerald-700';
  const cardBg = isDark ? 'bg-zinc-800/50' : 'bg-gray-50';
  const borderColor = isDark ? 'border-zinc-800' : 'border-gray-100';

  const renderRegisterTable = (section: MateriSection) => {
    if (!section.registers) return null;
    return (
      <div className="mt-3 overflow-x-auto">
        <table className={`w-full text-xs border-collapse`}>
          <thead>
            <tr className={isDark ? 'bg-zinc-800' : 'bg-gray-100'}>
              <th className={`px-2 py-1.5 text-left font-semibold ${text}`}>Register</th>
              <th className={`px-2 py-1.5 text-left font-semibold ${text}`}>Ukuran</th>
              <th className={`px-2 py-1.5 text-left font-semibold ${text}`}>Fungsi</th>
            </tr>
          </thead>
          <tbody>
            {section.registers.map((reg, i) => (
              <tr key={reg.name} className={i % 2 === 0 ? '' : (isDark ? 'bg-zinc-800/30' : 'bg-gray-50')}>
                <td className={`px-2 py-1.5 font-mono font-semibold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{reg.name}</td>
                <td className={`px-2 py-1.5 ${textMuted}`}>{reg.bits}</td>
                <td className={`px-2 py-1.5 ${textMuted}`}>{reg.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderAddressingModes = (section: MateriSection) => {
    if (!section.addressingModes) return null;
    return (
      <div className="mt-3 space-y-2">
        {section.addressingModes.map((mode) => (
          <div key={mode.mode} className={`rounded-lg p-3 ${cardBg}`}>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-bold ${text}`}>{mode.mode}</span>
            </div>
            <p className={`text-xs ${textMuted} mb-1.5`}>{mode.description}</p>
            <code className={`text-xs px-2 py-1 rounded font-mono ${codeBg}`}>{mode.example}</code>
          </div>
        ))}
      </div>
    );
  };

  const renderFlagTable = (section: MateriSection) => {
    if (!section.flagTable) return null;
    return (
      <div className="mt-3 overflow-x-auto">
        <table className={`w-full text-xs border-collapse`}>
          <thead>
            <tr className={isDark ? 'bg-zinc-800' : 'bg-gray-100'}>
              <th className={`px-2 py-1.5 text-left font-semibold ${text}`}>Flag</th>
              <th className={`px-2 py-1.5 text-left font-semibold ${text}`}>Nama</th>
              <th className={`px-2 py-1.5 text-left font-semibold ${text}`}>Bit</th>
              <th className={`px-2 py-1.5 text-left font-semibold ${text}`}>Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {section.flagTable.map((f, i) => (
              <tr key={f.flag} className={i % 2 === 0 ? '' : (isDark ? 'bg-zinc-800/30' : 'bg-gray-50')}>
                <td className={`px-2 py-1.5 font-mono font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{f.flag}</td>
                <td className={`px-2 py-1.5 font-medium ${text}`}>{f.name}</td>
                <td className={`px-2 py-1.5 ${textMuted}`}>{f.bit}</td>
                <td className={`px-2 py-1.5 ${textMuted}`}>{f.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderInstruction = (instr: InstructionDetail, sectionId: string) => {
    const key = `${sectionId}-${instr.mnemonic}`;
    const isExpanded = expandedInstructions.includes(key);

    return (
      <div key={key} className={`rounded-lg border ${isDark ? 'border-zinc-700/50' : 'border-gray-200'} overflow-hidden`}>
        {/* Collapsed header */}
        <button
          onClick={() => toggleInstruction(key)}
          className={`w-full flex items-center gap-2 px-3 py-2.5 text-left transition-colors ${
            isDark ? 'hover:bg-zinc-800' : 'hover:bg-gray-50'
          }`}
        >
          {isExpanded ? (
            <ChevronDown className="w-3.5 h-3.5 flex-shrink-0 text-blue-500" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 flex-shrink-0 text-blue-500" />
          )}
          <code className={`px-1.5 py-0.5 rounded font-mono text-xs font-bold ${codeBg}`}>
            {instr.mnemonic}
          </code>
          <span className={`text-xs ${textMuted} truncate`}>{instr.title}</span>
        </button>

        {/* Expanded detail */}
        {isExpanded && (
          <div className={`px-3 pb-3 pt-1 border-t ${borderColor} space-y-3`}>
            {/* Description */}
            <p className={`text-xs leading-relaxed ${textMuted}`}>{instr.description}</p>

            {/* Syntax */}
            <div>
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                Sintaks
              </span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {instr.syntax.map((s, i) => (
                  <code key={i} className={`px-1.5 py-0.5 rounded font-mono text-[11px] ${codeBg}`}>
                    {s}
                  </code>
                ))}
              </div>
            </div>

            {/* Flag Effects */}
            {instr.flagEffects && (
              <div>
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                  Efek Flag
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {Object.entries(instr.flagEffects).map(([flag, desc]) => (
                    <div
                      key={flag}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] ${
                        isDark ? 'bg-zinc-800 border border-zinc-700' : 'bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <span className={`font-bold font-mono ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>{flag}</span>
                      <span className={textMuted}>{desc}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Examples */}
            {instr.examples.length > 0 && (
              <div>
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                  Contoh
                </span>
                {instr.examples.map((ex, i) => (
                  <div key={i} className={`mt-1.5 rounded-lg overflow-hidden ${isDark ? 'bg-zinc-950' : 'bg-gray-900'}`}>
                    <pre className="p-2.5 text-[11px] leading-relaxed font-mono text-emerald-400 overflow-x-auto whitespace-pre">
                      {ex.code}
                    </pre>
                    <div className={`px-2.5 py-2 border-t ${isDark ? 'border-zinc-800' : 'border-gray-700'} flex items-start gap-2`}>
                      <span className="text-[11px] text-zinc-400 leading-snug flex-1">→ {ex.explanation}</span>
                      <button
                        onClick={() => handleTryCode(ex.code)}
                        className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors flex-shrink-0"
                        title="Muat kode ini ke editor"
                      >
                        <Play className="w-3 h-3" />
                        Coba
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Addressing Modes */}
            {instr.addressingModes && instr.addressingModes.length > 0 && (
              <div>
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                  Mode Pengalamatan
                </span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {instr.addressingModes.map((m) => (
                    <span key={m} className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                      isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700'
                    }`}>
                      {m}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const content = (
    <div className={`flex flex-col h-full overflow-hidden ${bg} ${!isMobile ? 'border rounded-xl shadow-2xl' : ''}`}>
      {/* Header (Drag Handle for PC) */}
      <div
        onMouseDown={handleMouseDown}
        className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-zinc-800 bg-zinc-900/80' : 'border-gray-100 bg-gray-50/80'} ${!isMobile ? 'cursor-move' : ''}`}
      >
        <div className="flex items-center gap-2 pointer-events-none select-none">
          <BookOpen className="w-5 h-5 text-blue-500" />
          <h2 className={`font-semibold ${text}`}>Materi Dasar Z-80</h2>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); }}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-gray-200 text-gray-500'}`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search Bar */}
      <div className={`px-4 py-2 border-b ${borderColor}`}>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${isDark ? 'bg-zinc-800' : 'bg-gray-100'}`}>
          <Search className={`w-3.5 h-3.5 ${textMuted}`} />
          <input
            type="text"
            placeholder="Cari instruksi (LD, ADD, JP, ...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`flex-1 bg-transparent text-xs outline-none ${text}`}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className={`${textMuted} hover:text-red-400`}>
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 cursor-auto">
        {filteredSections.map((section) => {
          const isExpanded = expandedSections.includes(section.id);
          const IconComponent = iconMap[section.icon] || BookOpen;

          return (
            <div key={section.id} className={`rounded-xl border overflow-hidden ${isDark ? 'border-zinc-800' : 'border-gray-200'}`}>
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                  isDark ? 'hover:bg-zinc-800/50' : 'hover:bg-gray-50'
                }`}
              >
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${section.color}20` }}
                >
                  <IconComponent className="w-4 h-4" style={{ color: section.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold" style={{ color: section.color }}>
                      {section.number}.
                    </span>
                    <span className={`text-sm font-semibold ${text} truncate`}>{section.title}</span>
                  </div>
                  {!isExpanded && (
                    <p className={`text-[11px] ${textMuted} truncate mt-0.5`}>{section.description}</p>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronDown className={`w-4 h-4 flex-shrink-0 ${textMuted}`} />
                ) : (
                  <ChevronRight className={`w-4 h-4 flex-shrink-0 ${textMuted}`} />
                )}
              </button>

              {/* Section Body */}
              {isExpanded && (
                <div className={`px-4 pb-4 border-t ${borderColor}`}>
                  {/* Section description */}
                  <p className={`text-xs ${textMuted} mt-3 mb-2 leading-relaxed`}>{section.description}</p>

                  {/* Section content (for intro sections) */}
                  {section.content && (
                    <div className={`text-xs ${textMuted} leading-relaxed whitespace-pre-line mt-2 mb-3 p-3 rounded-lg ${cardBg}`}>
                      {section.content}
                    </div>
                  )}

                  {/* Register table */}
                  {renderRegisterTable(section)}

                  {/* Addressing modes */}
                  {renderAddressingModes(section)}

                  {/* Flag table */}
                  {renderFlagTable(section)}

                  {/* Instructions list */}
                  {section.instructions.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {section.instructions.map((instr) => renderInstruction(instr, section.id))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {filteredSections.length === 0 && (
          <div className={`text-center py-8 ${textMuted}`}>
            <Search className="w-6 h-6 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Instruksi "{searchQuery}" tidak ditemukan.</p>
          </div>
        )}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <div className={`fixed inset-0 z-[100] ${bg}`}>
        {content}
      </div>
    );
  }

  return (
    <div
      className="fixed z-[60]"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '390px',
        height: '600px',
        maxHeight: '85vh'
      }}
    >
      {content}
    </div>
  );
};
