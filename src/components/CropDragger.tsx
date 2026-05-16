'use client';
import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';

interface Props {
  src: string;
  imageW: number;
  imageH: number;
  aspect: '1:1' | '3:4' | '4:5' | '9:16' | 'original';
  onChange: (cropped: string) => void;
  onChangeSrc: () => void;
  changeLabel: string;
}

const CONTAINER_H = 320;

export default function CropDragger({ src, imageW, imageH, aspect, onChange, onChangeSrc, changeLabel }: Props) {
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(0);

  // Crop frame position in container coordinates
  const [frame, setFrame] = useState({ x: 0, y: 0 });
  const frameRef = useRef({ x: 0, y: 0 });
  const drag = useRef({ active: false, startX: 0, startY: 0, startFX: 0, startFY: 0 });

  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setContainerW(el.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Image letterboxed to fit container (no stretching)
  const imgScale = containerW > 0 ? Math.min(containerW / imageW, CONTAINER_H / imageH) : 1;
  const imgW = imageW * imgScale;
  const imgH = imageH * imgScale;
  const imgX = (containerW - imgW) / 2;
  const imgY = (CONTAINER_H - imgH) / 2;

  const cropNum =
    aspect === '1:1' ? 1 :
    aspect === '3:4' ? 3 / 4 :
    aspect === '4:5' ? 4 / 5 :
    aspect === '9:16' ? 9 / 16 :
    imageW / imageH;

  // Crop frame: largest rectangle with the target ratio that fits inside the displayed image
  const frameW = Math.min(imgW, imgH * cropNum);
  const frameH = frameW / cropNum;

  function clampFrame(pos: { x: number; y: number }) {
    return {
      x: Math.max(imgX, Math.min(imgX + imgW - frameW, pos.x)),
      y: Math.max(imgY, Math.min(imgY + imgH - frameH, pos.y)),
    };
  }

  function emitCrop(fx: number, fy: number) {
    if (aspect === 'original') {
      onChangeRef.current(src);
      return;
    }
    const sx = Math.round((fx - imgX) / imgScale);
    const sy = Math.round((fy - imgY) / imgScale);
    const sw = Math.round(frameW / imgScale);
    const sh = Math.round(frameH / imgScale);
    if (sw <= 0 || sh <= 0) return;
    const img = document.createElement('img');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = sw;
      canvas.height = sh;
      canvas.getContext('2d')!.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      onChangeRef.current(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = src;
  }

  // Re-center crop frame whenever aspect/image/container changes
  useEffect(() => {
    if (containerW === 0) return;
    if (aspect === 'original') {
      onChangeRef.current(src);
      return;
    }
    const centered = clampFrame({
      x: imgX + (imgW - frameW) / 2,
      y: imgY + (imgH - frameH) / 2,
    });
    frameRef.current = centered;
    setFrame(centered);
    emitCrop(centered.x, centered.y);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspect, containerW, src, imageW, imageH]);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (aspect === 'original') return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;
    // Only start drag when clicking inside the crop frame
    if (px >= frame.x && px <= frame.x + frameW && py >= frame.y && py <= frame.y + frameH) {
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = { active: true, startX: e.clientX, startY: e.clientY, startFX: frame.x, startFY: frame.y };
    }
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    const next = clampFrame({ x: drag.current.startFX + dx, y: drag.current.startFY + dy });
    frameRef.current = next;
    setFrame(next);
  }

  function onPointerUp() {
    if (!drag.current.active) return;
    drag.current.active = false;
    emitCrop(frameRef.current.x, frameRef.current.y);
  }

  const hintText = locale === 'zh' ? '拖动裁剪框调整位置' : locale === 'ja' ? 'ドラッグで調整' : 'Drag frame to reposition';

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl select-none"
      style={{ height: CONTAINER_H, background: '#0a0a0f', cursor: 'default' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Full image — always shown at natural proportions */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="crop preview"
        draggable={false}
        style={{
          position: 'absolute',
          left: imgX,
          top: imgY,
          width: imgW,
          height: imgH,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />

      {/* Dark mask outside crop frame */}
      {aspect !== 'original' && containerW > 0 && (
        <>
          {/* Top */}
          <div style={{ position: 'absolute', inset: 0, bottom: 'auto', height: frame.y, background: 'rgba(0,0,0,0.6)', pointerEvents: 'none' }} />
          {/* Bottom */}
          <div style={{ position: 'absolute', inset: 0, top: frame.y + frameH, background: 'rgba(0,0,0,0.6)', pointerEvents: 'none' }} />
          {/* Left */}
          <div style={{ position: 'absolute', left: 0, top: frame.y, width: frame.x, height: frameH, background: 'rgba(0,0,0,0.6)', pointerEvents: 'none' }} />
          {/* Right */}
          <div style={{ position: 'absolute', left: frame.x + frameW, top: frame.y, right: 0, height: frameH, background: 'rgba(0,0,0,0.6)', pointerEvents: 'none' }} />

          {/* Crop frame border + grid */}
          <div
            style={{
              position: 'absolute',
              left: frame.x,
              top: frame.y,
              width: frameW,
              height: frameH,
              border: '1.5px solid rgba(255,255,255,0.75)',
              boxSizing: 'border-box',
              cursor: 'move',
              pointerEvents: 'none',
            }}
          >
            {/* Rule-of-thirds grid */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: [
                'linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)',
                'linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
              ].join(', '),
              backgroundSize: '33.33% 33.33%',
            }} />
            {/* Corner handles */}
            {[
              { top: -1, left: -1, borderTop: '2px solid #fff', borderLeft: '2px solid #fff' },
              { top: -1, right: -1, borderTop: '2px solid #fff', borderRight: '2px solid #fff' },
              { bottom: -1, left: -1, borderBottom: '2px solid #fff', borderLeft: '2px solid #fff' },
              { bottom: -1, right: -1, borderBottom: '2px solid #fff', borderRight: '2px solid #fff' },
            ].map((s, i) => (
              <div key={i} style={{ position: 'absolute', width: 14, height: 14, ...s }} />
            ))}
          </div>
        </>
      )}

      {/* Bottom overlay: hint + change button */}
      <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-between pointer-events-none">
        {aspect !== 'original' ? (
          <span className="px-2 py-0.5 rounded-full bg-black/60 text-[10px] text-white/60">
            {hintText}
          </span>
        ) : <span />}
        <button
          className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-[rgba(255,255,255,0.12)]
                     text-[11px] text-white hover:bg-black/80 transition-colors pointer-events-auto"
          onClick={(e) => { e.stopPropagation(); onChangeSrc(); }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {changeLabel}
        </button>
      </div>
    </div>
  );
}
