'use client';
import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';

interface Props {
  src: string;          // originalImageBase64 (data URL)
  imageW: number;       // compressed image width (px)
  imageH: number;       // compressed image height (px)
  aspect: '1:1' | '4:5' | 'original';
  onChange: (cropped: string) => void;
  onChangeSrc: () => void;
  changeLabel: string;
}

export default function CropDragger({ src, imageW, imageH, aspect, onChange, onChangeSrc, changeLabel }: Props) {
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(0);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const currentOffset = useRef({ x: 0, y: 0 });
  const drag = useRef({ active: false, startX: 0, startY: 0, startOX: 0, startOY: 0 });
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

  const cropAspectNum = aspect === '1:1' ? 1 : aspect === '4:5' ? 4 / 5 : imageW / imageH;
  const containerH = containerW > 0 ? containerW / cropAspectNum : 0;
  const scale = containerW > 0 ? Math.max(containerW / imageW, containerH / imageH) : 1;
  const imgDispW = imageW * scale;
  const imgDispH = imageH * scale;
  const minX = Math.min(0, containerW - imgDispW);
  const maxX = 0;
  const minY = Math.min(0, containerH - imgDispH);
  const maxY = 0;
  const canDrag = imgDispW > containerW + 0.5 || imgDispH > containerH + 0.5;

  // Re-center and emit crop whenever aspect, containerW or src change
  useEffect(() => {
    if (containerW === 0) return;

    if (aspect === 'original') {
      onChangeRef.current(src);
      return;
    }

    const cH = containerW / cropAspectNum;
    const s = Math.max(containerW / imageW, cH / imageH);
    const dW = imageW * s;
    const dH = imageH * s;
    const cx = Math.max(containerW - dW, Math.min(0, (containerW - dW) / 2));
    const cy = Math.max(cH - dH, Math.min(0, (cH - dH) / 2));
    const newOff = { x: cx, y: cy };
    setOffset(newOff);
    currentOffset.current = newOff;
    emitCrop(newOff, containerW, cH, s);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspect, containerW, src, imageW, imageH]);

  function emitCrop(off: { x: number; y: number }, cW: number, cH: number, s: number) {
    const sx = Math.round((-off.x) / s);
    const sy = Math.round((-off.y) / s);
    const sw = Math.round(cW / s);
    const sh = Math.round(cH / s);
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

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (!canDrag) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { active: true, startX: e.clientX, startY: e.clientY, startOX: currentOffset.current.x, startOY: currentOffset.current.y };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current.active) return;
    const dx = e.clientX - drag.current.startX;
    const dy = e.clientY - drag.current.startY;
    const nx = Math.max(minX, Math.min(maxX, drag.current.startOX + dx));
    const ny = Math.max(minY, Math.min(maxY, drag.current.startOY + dy));
    const newOff = { x: nx, y: ny };
    setOffset(newOff);
    currentOffset.current = newOff;
  }

  function onPointerUp() {
    if (!drag.current.active) return;
    drag.current.active = false;
    emitCrop(currentOffset.current, containerW, containerH, scale);
  }

  const hintText = locale === 'zh' ? '拖动调整范围' : locale === 'ja' ? 'ドラッグで調整' : 'Drag to adjust';

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl select-none bg-black/20"
      style={{ aspectRatio: String(cropAspectNum), cursor: canDrag ? 'grab' : 'default' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Draggable image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="crop"
        draggable={false}
        style={{
          position: 'absolute',
          width: imgDispW || undefined,
          height: imgDispH || undefined,
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      />

      {/* Rule-of-thirds grid */}
      {canDrag && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: [
              'linear-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
              'linear-gradient(90deg, rgba(255,255,255,0.07) 1px, transparent 1px)',
            ].join(', '),
            backgroundSize: '33.33% 33.33%',
          }}
        />
      )}

      {/* Gradient overlay (bottom) */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

      {/* Bottom row: drag hint (left) + change button (right) */}
      <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-between pointer-events-none">
        {canDrag ? (
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
