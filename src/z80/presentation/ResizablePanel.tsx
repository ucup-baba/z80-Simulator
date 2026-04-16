/**
 * Resizable Panel Splitter (PC only)
 * Drag the divider to resize panels
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useTheme } from './ThemeContext';

interface ResizablePanelProps {
  left: React.ReactNode;
  right: React.ReactNode;
  direction?: 'horizontal' | 'vertical';
  initialRatio?: number;
  minRatio?: number;
  maxRatio?: number;
  enabled?: boolean;
}

export const ResizablePanel: React.FC<ResizablePanelProps> = ({
  left,
  right,
  direction = 'horizontal',
  initialRatio = 0.5,
  minRatio = 0.25,
  maxRatio = 0.75,
  enabled = true,
}) => {
  const { isDark } = useTheme();
  const [ratio, setRatio] = useState(initialRatio);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!enabled) return;
    e.preventDefault();
    setIsDragging(true);
  }, [enabled]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let newRatio: number;
      if (direction === 'horizontal') {
        newRatio = (e.clientX - rect.left) / rect.width;
      } else {
        newRatio = (e.clientY - rect.top) / rect.height;
      }
      setRatio(Math.min(maxRatio, Math.max(minRatio, newRatio)));
    };

    const handleMouseUp = () => setIsDragging(false);

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, direction, minRatio, maxRatio]);

  const isH = direction === 'horizontal';
  const dividerColor = isDragging
    ? 'bg-blue-500'
    : isDark ? 'bg-zinc-700 hover:bg-blue-500/50' : 'bg-gray-200 hover:bg-blue-400/50';

  if (!enabled) {
    return (
      <div ref={containerRef} className={`flex ${isH ? 'flex-row' : 'flex-col'} h-full w-full`}>
        <div className={isH ? 'flex-1' : 'flex-1'} style={{ [isH ? 'width' : 'height']: '50%' }}>{left}</div>
        <div className={isH ? 'flex-1' : 'flex-1'} style={{ [isH ? 'width' : 'height']: '50%' }}>{right}</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`flex ${isH ? 'flex-row' : 'flex-col'} h-full w-full ${isDragging ? 'select-none' : ''}`}
    >
      <div className="overflow-hidden" style={{ [isH ? 'width' : 'height']: `${ratio * 100}%` }}>
        {left}
      </div>
      <div
        className={`flex-shrink-0 ${dividerColor} transition-colors duration-150 ${
          isH ? 'w-1 cursor-col-resize hover:w-1.5' : 'h-1 cursor-row-resize hover:h-1.5'
        } ${isDragging ? (isH ? 'w-1.5' : 'h-1.5') : ''}`}
        onMouseDown={handleMouseDown}
      />
      <div className="flex-1 overflow-hidden">
        {right}
      </div>
    </div>
  );
};
