/**
 * Code Editor Component
 * Assembly code input with line numbers and syntax highlighting
 */

import React, { useRef, useCallback, useEffect } from 'react';
import { useTheme } from './ThemeContext';

interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  parseError: string | null;
}

// Z-80 syntax highlighting tokens
const Z80_MNEMONICS = /\b(LD|ADD|ADC|SUB|SBC|AND|OR|XOR|CP|INC|DEC|PUSH|POP|EX|EXX|CALL|RET|RETI|RETN|RST|JP|JR|DJNZ|NOP|HALT|DI|EI|IM|RLC|RRC|RL|RR|SLA|SRA|SRL|BIT|SET|RES|IN|OUT|LDI|LDIR|LDD|LDDR|CPI|CPIR|CPD|CPDR|INI|INIR|IND|INDR|OUTI|OTIR|OUTD|OTDR|DAA|CPL|NEG|CCF|SCF|RLCA|RRCA|RLA|RRA|RLD|RRD)\b/gi;
const Z80_REGISTERS = /\b(A|B|C|D|E|H|L|F|AF|BC|DE|HL|SP|PC|IX|IY|IXH|IXL|IYH|IYL|I|R)\b/g;
const Z80_CONDITIONS = /\b(NZ|NC|PO|PE|P|M|Z|C)\b/g;
const HEX_NUMBERS = /\b([0-9][0-9A-Fa-f]*[Hh])\b/g;
const DEC_NUMBERS = /\b(\d+)\b/g;
const LABELS = /^([A-Za-z_]\w*)\s*:/gm;

const highlightLine = (line: string, isDark: boolean): string => {
  // First handle comments - everything after ; is a comment
  const commentIndex = line.indexOf(';');
  let codePart = commentIndex >= 0 ? line.substring(0, commentIndex) : line;
  let commentPart = commentIndex >= 0 ? line.substring(commentIndex) : '';

  const commentColor = isDark ? '#6A9955' : '#008000';
  const mnemonicColor = isDark ? '#569CD6' : '#0000FF';
  const registerColor = isDark ? '#4EC9B0' : '#267f99';
  const numberColor = isDark ? '#B5CEA8' : '#098658';
  const labelColor = isDark ? '#DCDCAA' : '#795E26';
  const condColor = isDark ? '#C586C0' : '#AF00DB';

  // Highlight code part
  codePart = codePart
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Labels
  codePart = codePart.replace(
    /^([A-Za-z_]\w*)\s*:/gm,
    `<span style="color:${labelColor}">$1:</span>`
  );

  // Mnemonics
  codePart = codePart.replace(
    Z80_MNEMONICS,
    `<span style="color:${mnemonicColor};font-weight:600">$1</span>`
  );

  // Hex numbers (must go before dec numbers)
  codePart = codePart.replace(
    /\b([0-9][0-9A-Fa-f]*[Hh])\b/g,
    `<span style="color:${numberColor}">$1</span>`
  );

  // Registers (be careful not to replace inside already highlighted spans)
  codePart = codePart.replace(
    /(?<!<[^>]*)\b(AF'|BC'|DE'|HL'|AF|BC|DE|HL|SP|PC|IX|IY|IXH|IXL|IYH|IYL)\b(?![^<]*>)/g,
    `<span style="color:${registerColor}">$1</span>`
  );

  // Comment part  
  if (commentPart) {
    commentPart = commentPart
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    commentPart = `<span style="color:${commentColor};font-style:italic">${commentPart}</span>`;
  }

  return codePart + commentPart;
};

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, parseError }) => {
  const { isDark } = useTheme();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const lines = value.split('\n');
  const lineCount = lines.length;

  // Sync scroll between textarea, highlight overlay, and line numbers
  const handleScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current && lineNumbersRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  // Colors
  const editorBg = isDark ? 'bg-zinc-950' : 'bg-white';
  const headerBg = isDark ? 'bg-zinc-900' : 'bg-gray-50';
  const borderColor = isDark ? 'border-zinc-700' : 'border-gray-200';
  const textColor = isDark ? 'text-zinc-100' : 'text-gray-900';
  const subColor = isDark ? 'text-zinc-400' : 'text-gray-500';
  const lineNumBg = isDark ? 'bg-zinc-900/50' : 'bg-gray-50';
  const lineNumColor = isDark ? 'text-zinc-600' : 'text-gray-400';

  return (
    <div className="flex flex-col h-full">
      <div className={`flex items-center justify-between px-4 py-2.5 ${headerBg} border-b ${borderColor} transition-colors duration-300`}>
        <h2 className={`font-semibold text-sm ${textColor}`} style={{ fontFamily: 'var(--font-sans)' }}>Assembly Code</h2>
        <div className={`text-xs ${subColor}`} style={{ fontFamily: 'var(--font-mono)' }}>Z-80 ASM</div>
      </div>

      <div className={`flex-1 relative flex ${editorBg} transition-colors duration-300`}>
        {/* Line Numbers */}
        <div
          ref={lineNumbersRef}
          className={`flex-shrink-0 ${lineNumBg} border-r ${borderColor} overflow-hidden select-none transition-colors duration-300`}
          style={{ width: '48px' }}
        >
          <div className="py-3 px-2 text-right" style={{ fontFamily: 'var(--font-mono)' }}>
            {Array.from({ length: lineCount }, (_, i) => (
              <div
                key={i}
                className={`text-xs leading-relaxed ${lineNumColor}`}
                style={{ height: '1.625em' }}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Editor Area with Syntax Overlay */}
        <div className="flex-1 relative overflow-hidden">
          {/* Syntax highlight overlay */}
          <div
            ref={highlightRef}
            className="absolute inset-0 pointer-events-none overflow-hidden px-4 py-3"
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

          {/* Actual textarea (transparent text) */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onScroll={handleScroll}
            className={`w-full h-full px-4 py-3 ${editorBg} text-transparent caret-blue-400 text-sm leading-relaxed resize-none focus:outline-none selection:bg-blue-500/30`}
            style={{ fontFamily: 'var(--font-mono)', caretColor: isDark ? '#60a5fa' : '#2563eb' }}
            placeholder="Enter Z-80 assembly code..."
            spellCheck={false}
          />
        </div>

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
          <span>•</span>
          <span className={isDark ? 'text-blue-400' : 'text-blue-600'}>Ctrl+L Load | Ctrl+S Step | Ctrl+R Run</span>
        </div>
      </div>
    </div>
  );
};
