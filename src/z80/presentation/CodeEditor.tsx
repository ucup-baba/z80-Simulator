/**
 * Code Editor Component
 * Assembly code input with line numbers, syntax highlighting,
 * breakpoints (click line numbers, PC only), and instruction tooltips (hover, PC only)
 */

import React, { useRef, useCallback, useState } from 'react';
import { useTheme } from './ThemeContext';
import { Z80_INSTRUCTION_DOCS } from './z80InstructionDocs';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  parseError: string | null;
  breakpoints?: Set<number>;
  onToggleBreakpoint?: (line: number) => void;
}

// Z-80 syntax highlighting
const highlightLine = (line: string, isDark: boolean): string => {
  const commentIndex = line.indexOf(';');
  let codePart = commentIndex >= 0 ? line.substring(0, commentIndex) : line;
  let commentPart = commentIndex >= 0 ? line.substring(commentIndex) : '';

  const commentColor = isDark ? '#6A9955' : '#008000';
  const mnemonicColor = isDark ? '#569CD6' : '#0000FF';
  const registerColor = isDark ? '#4EC9B0' : '#267f99';
  const numberColor = isDark ? '#B5CEA8' : '#098658';
  const labelColor = isDark ? '#DCDCAA' : '#795E26';

  codePart = codePart
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Labels
  codePart = codePart.replace(
    /^([A-Za-z_]\w*)\s*:/gm,
    `<span style="color:${labelColor}">$1:</span>`
  );

  // Mnemonics — wrap with data-mnemonic for tooltip
  codePart = codePart.replace(
    /\b(LD|ADD|ADC|SUB|SBC|AND|OR|XOR|CP|INC|DEC|PUSH|POP|EX|EXX|CALL|RET|RETI|RETN|RST|JP|JR|DJNZ|NOP|HALT|DI|EI|IM|RLC|RRC|RL|RR|SLA|SRA|SRL|BIT|SET|RES|IN|OUT|LDI|LDIR|LDD|LDDR|CPI|CPIR|CPD|CPDR|INI|INIR|IND|INDR|OUTI|OTIR|OUTD|OTDR|DAA|CPL|NEG|CCF|SCF|RLCA|RRCA|RLA|RRA|RLD|RRD|ORG|DB|DW|DS|EQU)\b/gi,
    `<span class="z80-mnemonic" data-mnemonic="$1" style="color:${mnemonicColor};font-weight:600">$1</span>`
  );

  // Hex numbers
  codePart = codePart.replace(
    /\b([0-9][0-9A-Fa-f]*[Hh])\b/g,
    `<span style="color:${numberColor}">$1</span>`
  );

  // Registers
  codePart = codePart.replace(
    /(?<!<[^>]*)\b(AF'|BC'|DE'|HL'|AF|BC|DE|HL|SP|PC|IX|IY|IXH|IXL|IYH|IYL)\b(?![^<]*>)/g,
    `<span style="color:${registerColor}">$1</span>`
  );

  // Comment
  if (commentPart) {
    commentPart = commentPart
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    commentPart = `<span style="color:${commentColor};font-style:italic">${commentPart}</span>`;
  }

  return codePart + commentPart;
};

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value, onChange, parseError, breakpoints = new Set(), onToggleBreakpoint
}) => {
  const { isDark } = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);

  const lines = value.split('\n');
  const lineCount = lines.length;

  const handleScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current && lineNumbersRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  // Tooltip handler for mnemonic hover (PC only)
  const handleHighlightMouseMove = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('z80-mnemonic')) {
      const mnemonic = target.getAttribute('data-mnemonic')?.toUpperCase();
      if (mnemonic && Z80_INSTRUCTION_DOCS[mnemonic]) {
        const rect = target.getBoundingClientRect();
        setTooltip({
          text: `${mnemonic}: ${Z80_INSTRUCTION_DOCS[mnemonic]}`,
          x: rect.left,
          y: rect.top - 8,
        });
        return;
      }
    }
    setTooltip(null);
  }, []);

  const handleHighlightMouseLeave = useCallback(() => setTooltip(null), []);

  const editorBg = isDark ? 'bg-zinc-950' : 'bg-white';
  const headerBg = isDark ? 'bg-zinc-900' : 'bg-gray-50';
  const borderColor = isDark ? 'border-zinc-700' : 'border-gray-200';
  const textColor = isDark ? 'text-zinc-100' : 'text-gray-900';
  const subColor = isDark ? 'text-zinc-400' : 'text-gray-500';
  const lineNumBg = isDark ? 'bg-zinc-900/50' : 'bg-gray-50';
  const lineNumColor = isDark ? 'text-zinc-600' : 'text-gray-400';
  const tooltipBg = isDark ? 'bg-zinc-800 border-zinc-600 text-zinc-200' : 'bg-gray-800 border-gray-600 text-gray-100';

  return (
    <div className="flex flex-col h-full">
      <div className={`flex items-center justify-between px-4 py-2.5 ${headerBg} border-b ${borderColor} transition-colors duration-300`}>
        <h2 className={`font-semibold text-sm ${textColor}`} style={{ fontFamily: 'var(--font-sans)' }}>Assembly Code</h2>
        <div className="flex items-center gap-2">
          {breakpoints.size > 0 && (
            <span className="text-xs px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full">{breakpoints.size} BP</span>
          )}
          <div className={`text-xs ${subColor}`} style={{ fontFamily: 'var(--font-mono)' }}>Z-80 ASM</div>
        </div>
      </div>

      <div className={`flex-1 relative flex ${editorBg} transition-colors duration-300`}>
        {/* Line Numbers + Breakpoint Gutter */}
        <div
          ref={lineNumbersRef}
          className={`flex-shrink-0 ${lineNumBg} border-r ${borderColor} overflow-hidden select-none transition-colors duration-300`}
          style={{ width: '52px' }}
        >
          <div className="py-3 px-1" style={{ fontFamily: 'var(--font-mono)' }}>
            {Array.from({ length: lineCount }, (_, i) => (
              <div
                key={i}
                className={`text-xs leading-relaxed flex items-center gap-0.5 cursor-pointer group ${lineNumColor}`}
                style={{ height: '1.625em' }}
                onClick={() => onToggleBreakpoint?.(i + 1)}
                title="Click to toggle breakpoint"
              >
                {/* Breakpoint dot */}
                <div className="w-3 h-3 flex items-center justify-center flex-shrink-0">
                  {breakpoints.has(i + 1) ? (
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
                  ) : (
                    <div className="w-2.5 h-2.5 rounded-full opacity-0 group-hover:opacity-30 bg-red-400 transition-opacity hidden md:block" />
                  )}
                </div>
                <span className="text-right flex-1 pr-1">{i + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Editor Area with Syntax Overlay */}
        <div className="flex-1 relative overflow-hidden">
          {/* Syntax highlight overlay — pointer-events enabled for tooltip */}
          <div
            ref={highlightRef}
            className="absolute inset-0 overflow-hidden px-4 py-3 hidden md:block"
            style={{ pointerEvents: 'none', zIndex: 1 }}
            aria-hidden="true"
          >
            <pre
              className="text-sm leading-relaxed whitespace-pre"
              style={{ fontFamily: 'var(--font-mono)', pointerEvents: 'none' }}
            >
              {lines.map((line, i) => (
                <div
                  key={i}
                  dangerouslySetInnerHTML={{ __html: highlightLine(line, isDark) || '&nbsp;' }}
                  style={{ height: '1.625em' }}
                />
              ))}
            </pre>
          </div>

          {/* Mobile highlight overlay (no pointer events) */}
          <div
            className="absolute inset-0 pointer-events-none overflow-hidden px-4 py-3 md:hidden"
            aria-hidden="true"
          >
            <pre
              className="text-sm leading-relaxed whitespace-pre"
              style={{ fontFamily: 'var(--font-mono)' }}
            >
              {lines.map((line, i) => (
                <div
                  key={i}
                  dangerouslySetInnerHTML={{ __html: highlightLine(line, isDark) || '&nbsp;' }}
                  style={{ height: '1.625em' }}
                />
              ))}
            </pre>
          </div>

          {/* Actual textarea — on top for editing */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            onMouseMove={handleHighlightMouseMove}
            onMouseLeave={handleHighlightMouseLeave}
            className={`w-full h-full px-4 py-3 ${editorBg} text-transparent caret-blue-400 text-sm leading-relaxed resize-none focus:outline-none selection:bg-blue-500/30`}
            style={{ fontFamily: 'var(--font-mono)', caretColor: isDark ? '#60a5fa' : '#2563eb', position: 'relative', zIndex: 2, background: 'transparent' }}
            placeholder="Enter Z-80 assembly code..."
            spellCheck={false}
          />
        </div>

        {/* Instruction Tooltip (PC only) */}
        {tooltip && (
          <div
            className={`fixed z-50 px-3 py-1.5 text-xs rounded-lg border shadow-xl ${tooltipBg} pointer-events-none hidden md:block`}
            style={{
              left: tooltip.x,
              top: tooltip.y,
              transform: 'translateY(-100%)',
              fontFamily: 'var(--font-sans)',
              maxWidth: '350px',
            }}
          >
            {tooltip.text}
          </div>
        )}

        {parseError && (
          <div className={`absolute bottom-0 left-0 right-0 px-4 py-2 ${isDark ? 'bg-red-950/80' : 'bg-red-50'} border-t ${isDark ? 'border-red-800' : 'border-red-200'} backdrop-blur-sm`}>
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className={`text-xs ${isDark ? 'text-red-300' : 'text-red-600'}`} style={{ fontFamily: 'var(--font-mono)' }}>{parseError}</p>
            </div>
          </div>
        )}
      </div>

      <div className={`px-4 py-2 ${headerBg} border-t ${borderColor} transition-colors duration-300`}>
        <div className={`flex items-center gap-4 text-xs ${subColor}`}>
          <span>Lines: {lineCount}</span>
          <span>•</span>
          <span>Syntax: Z-80 Assembly</span>
          <span className="hidden sm:inline">•</span>
          <span className={`hidden sm:inline ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Ctrl+L Load | Ctrl+S Step | Ctrl+R Run</span>
        </div>
      </div>
    </div>
  );
};
