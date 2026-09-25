import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  Undo2,
  Redo2,
  Trash2,
  Eraser,
  PenLine,
  Check,
  Sparkles
} from 'lucide-react';

interface DrawingCanvasProps {
  initialImage?: string;
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

const PALETTE = [
  { name: 'Charcoal', color: '#2D2A26' },
  { name: 'Espresso', color: '#5A3E2B' },
  { name: 'Terracotta', color: '#C8684C' },
  { name: 'Dusty Rose', color: '#C77D7D' },
  { name: 'Sage Green', color: '#628564' },
  { name: 'Lavender', color: '#7E6B97' },
  { name: 'Golden Honey', color: '#C9933B' },
  { name: 'Soft Cream', color: '#F7F3EB' },
];

const PEN_SIZES = [
  { label: 'Fine', size: 2 },
  { label: 'Medium', size: 5 },
  { label: 'Bold', size: 10 },
  { label: 'Marker', size: 22 },
];

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  initialImage,
  onSave,
  onCancel,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [currentColor, setCurrentColor] = useState(PALETTE[0].color);
  const [currentSize, setCurrentSize] = useState(5);
  const [isEraser, setIsEraser] = useState(false);
  const [history, setHistory] = useState<ImageData[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isDrawing, setIsDrawing] = useState(false);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Size canvas to container
    const rect = container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const width = Math.floor(rect.width) || 600;
    const height = Math.floor(rect.height) || 450;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    ctx.scale(dpr, dpr);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Warm paper background fill
    ctx.fillStyle = '#FFFDF9';
    ctx.fillRect(0, 0, width, height);

    // If initial image exists, draw it
    if (initialImage) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        // Save initial snapshot
        const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
        setHistory([snap]);
        setHistoryIndex(0);
      };
      img.src = initialImage;
    } else {
      const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setHistory([snap]);
      setHistoryIndex(0);
    }
  }, [initialImage]);

  const saveStateToHistory = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const snap = ctx.getImageData(0, 0, canvas.width, canvas.height);
    setHistory((prev) => {
      const updated = prev.slice(0, historyIndex + 1);
      return [...updated, snap];
    });
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);

  const undo = () => {
    if (historyIndex <= 0) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const newIndex = historyIndex - 1;
    ctx.putImageData(history[newIndex], 0, 0);
    setHistoryIndex(newIndex);
  };

  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const newIndex = historyIndex + 1;
    ctx.putImageData(history[newIndex], 0, 0);
    setHistoryIndex(newIndex);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    ctx.fillStyle = '#FFFDF9';
    ctx.fillRect(0, 0, width, height);
    saveStateToHistory();
  };

  // Pointer drawing handlers
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  const getCanvasCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e);
    lastPointRef.current = coords;
    setIsDrawing(true);

    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
    ctx.lineTo(coords.x, coords.y);

    if (isEraser) {
      ctx.strokeStyle = '#FFFDF9';
      ctx.lineWidth = currentSize * 2.5;
    } else {
      ctx.strokeStyle = currentColor;
      ctx.lineWidth = currentSize;
      if (currentSize >= 20) {
        // Marker effect with soft opacity
        ctx.strokeStyle = `${currentColor}99`;
      }
    }
    ctx.stroke();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !lastPointRef.current) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e);

    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(coords.x, coords.y);

    if (isEraser) {
      ctx.strokeStyle = '#FFFDF9';
      ctx.lineWidth = currentSize * 2.5;
    } else {
      ctx.strokeStyle = currentSize >= 20 ? `${currentColor}88` : currentColor;
      ctx.lineWidth = currentSize;
    }

    ctx.stroke();
    lastPointRef.current = coords;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPointRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // Ignore
    }
    saveStateToHistory();
  };

  const handleComplete = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="flex flex-col h-full bg-[#FAF7F2] rounded-3xl overflow-hidden border border-[#EAE2D5] shadow-md">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#F4EDE2] border-b border-[#E8DFC0]/60">
        {/* Tool switches: Pen vs Eraser */}
        <div className="flex items-center gap-1 bg-[#EAE0D3] p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setIsEraser(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              !isEraser
                ? 'bg-white text-[#3D2C1E] shadow-xs'
                : 'text-[#6C5B4C] hover:text-[#3D2C1E]'
            }`}
          >
            <PenLine className="w-3.5 h-3.5" />
            <span>Pen</span>
          </button>
          <button
            type="button"
            onClick={() => setIsEraser(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition cursor-pointer ${
              isEraser
                ? 'bg-white text-[#3D2C1E] shadow-xs'
                : 'text-[#6C5B4C] hover:text-[#3D2C1E]'
            }`}
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Eraser</span>
          </button>
        </div>

        {/* Size Selection */}
        <div className="flex items-center gap-1.5 bg-[#EAE0D3] p-1 rounded-2xl">
          {PEN_SIZES.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => setCurrentSize(s.size)}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium transition cursor-pointer ${
                currentSize === s.size
                  ? 'bg-white text-[#3D2C1E] shadow-xs'
                  : 'text-[#6C5B4C] hover:text-[#3D2C1E]'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Undo, Redo, Clear */}
        <div className="flex items-center gap-1 text-[#6C5B4C]">
          <button
            type="button"
            onClick={undo}
            disabled={historyIndex <= 0}
            className="p-1.5 rounded-xl hover:bg-[#EAE0D3] disabled:opacity-35 transition cursor-pointer"
            title="Undo"
          >
            <Undo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={historyIndex >= history.length - 1}
            className="p-1.5 rounded-xl hover:bg-[#EAE0D3] disabled:opacity-35 transition cursor-pointer"
            title="Redo"
          >
            <Redo2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={clearCanvas}
            className="p-1.5 rounded-xl hover:bg-[#F2DDD9] text-[#9C4B4B] transition cursor-pointer"
            title="Clear canvas"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Color Palette Strip */}
      {!isEraser && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#F8F3EA] border-b border-[#EAE2D5] overflow-x-auto no-scrollbar">
          <span className="text-[11px] font-medium text-[#7D6B5A] uppercase tracking-wider pl-1">
            Palette:
          </span>
          <div className="flex items-center gap-2">
            {PALETTE.map((p) => {
              const active = currentColor === p.color;
              return (
                <button
                  key={p.name}
                  type="button"
                  onClick={() => setCurrentColor(p.color)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer flex items-center justify-center ${
                    active
                      ? 'scale-110 border-[#3D2C1E] shadow-xs'
                      : 'border-white/80 hover:scale-105'
                  }`}
                  style={{ backgroundColor: p.color }}
                  title={p.name}
                >
                  {active && (
                    <span
                      className={`block w-1.5 h-1.5 rounded-full ${
                        p.color === '#F7F3EB' || p.color === '#FBF8F3'
                          ? 'bg-[#3D2C1E]'
                          : 'bg-white'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Canvas Area */}
      <div
        ref={containerRef}
        className="relative flex-1 min-h-[340px] w-full bg-[#FFFDF9] cursor-crosshair overflow-hidden touch-none"
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 block touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>

      {/* Bottom Action Footer */}
      <div className="flex items-center justify-between p-3 bg-[#F4EDE2] border-t border-[#E8DFC0]/60">
        <div className="flex items-center gap-1.5 text-xs text-[#7D6B5A]">
          <Sparkles className="w-3.5 h-3.5 text-[#C8684C]" />
          <span>Draw with touch, stylus or mouse</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-1.5 rounded-2xl text-xs font-medium text-[#6C5B4C] hover:bg-[#EAE0D3] transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleComplete}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-2xl text-xs font-medium bg-[#9C5237] hover:bg-[#85452D] text-white shadow-xs transition cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Attach Sketch</span>
          </button>
        </div>
      </div>
    </div>
  );
};
