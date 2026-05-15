'use client';
import { useRef, useState, useCallback, useEffect } from 'react';
import Image from 'next/image';

interface Props {
  beforeSrc: string;
  afterSrc: string;
  aspectRatio?: number;
}

export default function BeforeAfterSlider({ beforeSrc, afterSrc, aspectRatio }: Props) {
  const [pos, setPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const move = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const pct = Math.max(3, Math.min(97, ((clientX - rect.left) / rect.width) * 100));
    setPos(pct);
  }, []);

  // Release drag anywhere on window
  useEffect(() => {
    const stop = () => { dragging.current = false; };
    window.addEventListener('mouseup', stop);
    window.addEventListener('touchend', stop);
    return () => {
      window.removeEventListener('mouseup', stop);
      window.removeEventListener('touchend', stop);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full rounded-3xl overflow-hidden select-none cursor-col-resize"
      onMouseMove={(e) => dragging.current && move(e.clientX)}
      onTouchMove={(e) => { e.preventDefault(); move(e.touches[0].clientX); }}
      style={{ touchAction: 'none', aspectRatio: String(aspectRatio ?? 1) }}
    >
      {/* AI result — full layer underneath */}
      <div className="absolute inset-0 bg-[rgba(0,0,0,0.3)]">
        <Image src={afterSrc} alt="AI result" fill className="object-contain" unoptimized />
      </div>

      {/* Original — clipped to left side of slider */}
      <div
        className="absolute inset-0 bg-[rgba(0,0,0,0.3)]"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
      >
        <Image src={beforeSrc} alt="Original" fill className="object-contain" unoptimized />
      </div>

      {/* Divider line + handle */}
      <div
        className="absolute inset-y-0 z-10"
        style={{ left: `${pos}%`, transform: 'translateX(-50%)' }}
        onMouseDown={() => { dragging.current = true; }}
        onTouchStart={() => { dragging.current = true; }}
      >
        <div className="h-full w-px bg-white/90 shadow-[0_0_10px_rgba(255,255,255,0.5)]" />
        {/* Drag handle */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2
                        w-10 h-10 rounded-full bg-white/95 shadow-xl
                        flex items-center justify-center gap-0.5
                        border border-white/30 backdrop-blur-sm">
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none">
            <path d="M5 1L1 7l4 6M13 1l4 6-4 6" stroke="#111" strokeWidth="1.5"
                  strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-4 left-4 px-2.5 py-1 rounded-xl
                      bg-black/60 backdrop-blur-md
                      text-[10px] font-semibold tracking-widest uppercase text-white/70
                      pointer-events-none z-10">
        Before
      </div>
      <div className="absolute top-4 right-4 px-2.5 py-1 rounded-xl
                      bg-[rgba(200,169,107,0.85)] backdrop-blur-md
                      text-[10px] font-semibold tracking-widest uppercase text-black
                      pointer-events-none z-10">
        AI
      </div>
    </div>
  );
}
