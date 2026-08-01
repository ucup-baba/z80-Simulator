import React, { useRef, useEffect, useState, useCallback } from 'react';
import { RotateCcw, Edit3, PenTool } from 'lucide-react';

interface SignaturePadProps {
  onSave?: (dataUrl: string | null) => void;
  isDark?: boolean;
}

interface Point {
  x: number; // normalized 0..1
  y: number; // normalized 0..1
}

type Stroke = Point[];

/**
 * Trims blank margins from a canvas so the signature occupies the full exported image bounds.
 */
function getCroppedCanvasDataUrl(canvas: HTMLCanvasElement): string {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas.toDataURL('image/png');

  const width = canvas.width;
  const height = canvas.height;
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;

  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  // If blank canvas
  if (maxX === -1) return canvas.toDataURL('image/png');

  // Add 16px padding
  const padding = 16;
  const cropMinX = Math.max(0, minX - padding);
  const cropMinY = Math.max(0, minY - padding);
  const cropWidth = Math.min(width - cropMinX, (maxX - minX) + padding * 2);
  const cropHeight = Math.min(height - cropMinY, (maxY - minY) + padding * 2);

  const croppedCanvas = document.createElement('canvas');
  croppedCanvas.width = cropWidth;
  croppedCanvas.height = cropHeight;
  const croppedCtx = croppedCanvas.getContext('2d');
  if (croppedCtx) {
    croppedCtx.drawImage(
      canvas,
      cropMinX, cropMinY, cropWidth, cropHeight,
      0, 0, cropWidth, cropHeight
    );
    return croppedCanvas.toDataURL('image/png');
  }

  return canvas.toDataURL('image/png');
}

export const SignaturePad: React.FC<SignaturePadProps> = ({ onSave, isDark = false }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const strokesRef = useRef<Stroke[]>([]);

  // Sync ref with state
  strokesRef.current = strokes;

  // Redraw all strokes on canvas based on current CSS dimensions
  const redrawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const dpr = Math.max(window.devicePixelRatio || 1, 2);
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, rect.width, rect.height);
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = isDark ? '#60a5fa' : '#1e40af';

    const currentStrokes = strokesRef.current;
    for (const stroke of currentStrokes) {
      if (stroke.length === 0) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x * rect.width, stroke[0].y * rect.height);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x * rect.width, stroke[i].y * rect.height);
      }
      ctx.stroke();
    }
    ctx.restore();
  }, [isDark]);

  // Handle ResizeObserver to automatically adjust canvas size on modal resize or drag
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(() => {
      redrawCanvas();
    });

    resizeObserver.observe(container);
    redrawCanvas();

    return () => {
      resizeObserver.disconnect();
    };
  }, [redrawCanvas]);

  // Clear canvas
  const clearCanvas = useCallback(() => {
    setStrokes([]);
    strokesRef.current = [];
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    if (onSave) onSave(null);
  }, [onSave]);

  const getNormalizedPoint = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

    return {
      x: rect.width > 0 ? x / rect.width : 0,
      y: rect.height > 0 ? y / rect.height : 0
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    setIsDrawing(true);
    const pt = getNormalizedPoint(e);
    const newStroke: Stroke = [pt];
    const updatedStrokes = [...strokesRef.current, newStroke];
    setStrokes(updatedStrokes);
    strokesRef.current = updatedStrokes;
    redrawCanvas();
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    e.preventDefault();
    const pt = getNormalizedPoint(e);
    const currentStrokes = [...strokesRef.current];
    if (currentStrokes.length > 0) {
      const lastStroke = [...currentStrokes[currentStrokes.length - 1], pt];
      currentStrokes[currentStrokes.length - 1] = lastStroke;
      setStrokes(currentStrokes);
      strokesRef.current = currentStrokes;
      redrawCanvas();
    }
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas && onSave && strokesRef.current.length > 0) {
      const dataUrl = getCroppedCanvasDataUrl(canvas);
      onSave(dataUrl);
    }
  };

  const isEmpty = strokes.length === 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold flex items-center gap-1.5 opacity-90 truncate pr-2">
          <Edit3 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span className="truncate">Tanda Tangan Digital <span className="hidden sm:inline">(Gambar di dalam kotak di bawah)</span></span>
        </label>
        <button
          type="button"
          onClick={clearCanvas}
          className={`flex items-center justify-center gap-1 p-2 sm:px-2.5 sm:py-1 rounded-lg text-xs font-medium border transition-colors shrink-0 ${
            isDark ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'border-gray-200 hover:bg-gray-100 text-gray-700'
          }`}
          title="Hapus tanda tangan"
        >
          <RotateCcw className="w-3.5 h-3.5 text-red-400" /> <span className="hidden sm:inline">Bersihkan TTD</span>
        </button>
      </div>

      <div
        ref={containerRef}
        className={`relative rounded-xl border overflow-hidden transition-colors ${
          isDark ? 'bg-zinc-950 border-zinc-700' : 'bg-slate-50 border-gray-300'
        }`}
      >
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-36 touch-none cursor-crosshair block"
        />

        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-40 px-4 text-center">
            <span className="text-xs sm:text-sm font-medium tracking-wide">
              <PenTool className="w-4 h-4 inline-block mr-1 shrink-0" /> Bubuhkan tanda tangan di sini <span className="hidden sm:inline">(Gunakan Mouse / Sentuhan Jari)</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
