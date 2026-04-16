/**
 * Autocomplete Dropdown for Z-80 mnemonics (PC only)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from './ThemeContext';
import { Z80_INSTRUCTION_DOCS } from './z80InstructionDocs';

interface AutocompleteProps {
  isEnabled: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  onInsert: (text: string) => void;
}

const ALL_MNEMONICS = Object.keys(Z80_INSTRUCTION_DOCS);

export const useAutocomplete = ({ isEnabled, textareaRef, onInsert }: AutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [currentWord, setCurrentWord] = useState('');

  const updateSuggestions = useCallback(() => {
    if (!isEnabled || !textareaRef.current) {
      setSuggestions([]);
      return;
    }

    const textarea = textareaRef.current;
    const cursorPos = textarea.selectionStart;
    const text = textarea.value;

    // Get the current word being typed
    let wordStart = cursorPos;
    while (wordStart > 0 && /[A-Za-z]/.test(text[wordStart - 1])) {
      wordStart--;
    }
    const word = text.substring(wordStart, cursorPos).toUpperCase();

    if (word.length < 2) {
      setSuggestions([]);
      setPosition(null);
      return;
    }

    const matches = ALL_MNEMONICS.filter(m => m.startsWith(word) && m !== word).slice(0, 8);

    if (matches.length === 0) {
      setSuggestions([]);
      setPosition(null);
      return;
    }

    setCurrentWord(word);
    setSuggestions(matches);
    setSelectedIndex(0);

    // Calculate position (approximate)
    const rect = textarea.getBoundingClientRect();
    const lineHeight = 26; // ~1.625em
    const lines = text.substring(0, cursorPos).split('\n');
    const lineIndex = lines.length - 1;
    const colIndex = lines[lineIndex].length;
    const charWidth = 8.4; // approximate monospace char width

    setPosition({
      top: rect.top + (lineIndex * lineHeight) - textarea.scrollTop + lineHeight + 48,
      left: rect.left + (colIndex * charWidth) + 52,
    });
  }, [isEnabled, textareaRef]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => Math.max(prev - 1, 0));
    } else if (e.key === 'Tab' || e.key === 'Enter') {
      if (suggestions.length > 0) {
        e.preventDefault();
        const selected = suggestions[selectedIndex];
        // Insert the remaining part of the mnemonic
        const remaining = selected.substring(currentWord.length);
        onInsert(remaining);
        setSuggestions([]);
        setPosition(null);
      }
    } else if (e.key === 'Escape') {
      setSuggestions([]);
      setPosition(null);
    }
  }, [suggestions, selectedIndex, currentWord, onInsert]);

  const dismiss = useCallback(() => {
    setSuggestions([]);
    setPosition(null);
  }, []);

  return { suggestions, selectedIndex, position, updateSuggestions, handleKeyDown, dismiss, currentWord };
};

// Dropdown UI component
export const AutocompleteDropdown: React.FC<{
  suggestions: string[];
  selectedIndex: number;
  position: { top: number; left: number } | null;
  currentWord: string;
  onSelect: (mnemonic: string) => void;
}> = ({ suggestions, selectedIndex, position, currentWord, onSelect }) => {
  const { isDark } = useTheme();

  if (!position || suggestions.length === 0) return null;

  const bg = isDark ? 'bg-zinc-800 border-zinc-600' : 'bg-white border-gray-200';
  const hoverBg = isDark ? 'bg-zinc-700' : 'bg-blue-50';
  const textColor = isDark ? 'text-zinc-200' : 'text-gray-800';
  const descColor = isDark ? 'text-zinc-500' : 'text-gray-400';

  return (
    <div
      className={`fixed z-[70] rounded-xl border ${bg} shadow-2xl overflow-hidden hidden md:block`}
      style={{ top: position.top, left: position.left, minWidth: '260px', maxWidth: '360px' }}
    >
      {suggestions.map((s, i) => (
        <div
          key={s}
          className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
            i === selectedIndex ? hoverBg : ''
          }`}
          onMouseDown={(e) => { e.preventDefault(); onSelect(s.substring(currentWord.length)); }}
          onMouseEnter={() => {}}
        >
          <span className={`font-mono font-bold text-sm ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{s}</span>
          <span className={`text-xs truncate flex-1 ${descColor}`}>{Z80_INSTRUCTION_DOCS[s] || ''}</span>
        </div>
      ))}
    </div>
  );
};
