'use client';
import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';

interface Props {
  src: string;
  imageW: number;
  imageH: number;
  aspect: '1:1' | '3:4' | '4:5' | '9:16' | 'original' | 'free';
  onChange: (cropped: string) => void;
  onChangeSrc: () => void;
  changeLabel: string;
}

const MAX_H = 560;
const MIN_H = 200;
const MIN_FRAME = 40;

type Corner = 'tl' | 'tr' | 'bl' | 'br';
type Frame = { x: number; y: number; w: number; h: number };

interface Interaction {
  type: 'drag' | 'resize';
  corner?: Corner;
  startClientX: number;
  startClientY: number;
  startFX: number;
  startFY: number;
  startFW: number;
  startFH: number;
}

const CORNER_CURSORS: Record<Corner, string> = {
  tl: 'nw-resize', tr: 'ne-resize', bl: 'sw-resize', br: 'se-resize',
};
// Corner handle size in px (visual L-shape, larger hit area)
const HANDLE = 20;

export default function CropDragger({ src, imageW, imageH, aspect, onChange, onChangeSrc, changeLabel }: Props) {
  const locale = useLocale();
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(0);

  // Adaptive container height — no longer fixed at 320px
  const containerH = containerW > 0
    ? Math.max(MIN_H, Math.min(MAX_H, Math.round(containerW * imageH / imageW)))
    : MIN_H;

  const [frame, setFrame] = useState<Frame>({ x: 0, y: 0, w: 0, h: 0 });
  const frameRef = useRef<Frame>({ x: 0, y: 0, w: 0, h: 0 });
  const interactionRef = useRef<Interaction | null>(null);

  const onChangeRef = useRef(onChange);
  useEffect(() => { onChangeRef.current = onChange; });

  const [zoomed, setZoomed] = useState(false);
  const zoomTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const measure = () => setContainerW(el.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Image displayed letterboxed inside the adaptive container
  const imgScale = containerW > 0 ? Math.min(containerW / imageW, containerH / imageH) : 1;
  const imgW = imageW * imgScale;
  const imgH = imageH * imgScale;
  const imgX = (containerW - imgW) / 2;
  const imgY = (containerH - imgH) / 2;

  // Aspect ratio as W/H (only meaningful for fixed-ratio modes)
  const cropNum =
    aspect === '1:1' ? 1 :
    aspect === '3:4' ? 3 / 4 :
    aspect === '4:5' ? 4 / 5 :
    aspect === '9:16' ? 9 / 16 :
    imageW / imageH;

  function defaultFrame(): Frame {
    if (aspect === 'original') return { x: imgX, y: imgY, w: imgW, h: imgH };
    if (aspect === 'free') {
      const fw = imgW * 0.7;
      const fh = imgH * 0.7;
      return { x: imgX + (imgW - fw) / 2, y: imgY + (imgH - fh) / 2, w: fw, h: fh };
    }
    const fw = Math.min(imgW, imgH * cropNum);
    const fh = fw / cropNum;
    return { x: imgX + (imgW - fw) / 2, y: imgY + (imgH - fh) / 2, w: fw, h: fh };
  }

  function clampFrame(f: Frame): Frame {
    const w = Math.max(MIN_FRAME, Math.min(f.w, imgW));
    const h = Math.max(MIN_FRAME, Math.min(f.h, imgH));
    const x = Math.max(imgX, Math.min(imgX + imgW - w, f.x));
    const y = Math.max(imgY, Math.min(imgY + imgH - h, f.y));
    return { x, y, w, h };
  }

  // Clamp while preserving w/h = ratio — prevents independent clamping from breaking the ratio
  function clampFrameProp(f: Frame, ratio: number): Frame {
    let w = f.w;
    // Derive h from w to enforce ratio
    let h = w / ratio;
    // Scale down if either dimension exceeds image bounds
    if (w > imgW) { w = imgW; h = w / ratio; }
    if (h > imgH) { h = imgH; w = h * ratio; }
    // Re-check after adjustment
    if (w > imgW) { w = imgW; h = w / ratio; }
    // Enforce minimum
    if (w < MIN_FRAME) { w = MIN_FRAME; h = w / ratio; }
    // Clamp position
    const x = Math.max(imgX, Math.min(imgX + imgW - w, f.x));
    const y = Math.max(imgY, Math.min(imgY + imgH - h, f.y));
    return { x, y, w, h };
  }

  function emitCrop(f: Frame) {
    if (aspect === 'original') { onChangeRef.current(src); return; }
    const sx = Math.round((f.x - imgX) / imgScale);
    const sy = Math.round((f.y - imgY) / imgScale);
    const sw = Math.round(f.w / imgScale);
    const sh = Math.round(f.h / imgScale);
    if (sw <= 0 || sh <= 0) return;
    const img = document.createElement('img');
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = sw; canvas.height = sh;
      canvas.getContext('2d')!.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
      onChangeRef.current(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.src = src;
  }

  function scheduleZoom() {
    if (aspect === 'original') return;
    if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current);
    zoomTimerRef.current = setTimeout(() => setZoomed(true), 2000);
  }

  function cancelZoom() {
    if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current);
    setZoomed(false);
  }

  useEffect(() => {
    if (containerW === 0 || imgW === 0) return;
    if (aspect === 'original') { onChangeRef.current(src); return; }
    const cf = clampFrame(defaultFrame());
    frameRef.current = cf;
    setFrame(cf);
    setZoomed(false);
    if (zoomTimerRef.current) clearTimeout(zoomTimerRef.current);
    emitCrop(cf);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aspect, containerW, src, imageW, imageH]);

  // --- Drag (frame interior) ---
  function onFrameDragDown(e: React.PointerEvent<HTMLDivElement>) {
    if (aspect === 'original' || zoomed) return;
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    cancelZoom();
    const f = frameRef.current;
    interactionRef.current = {
      type: 'drag',
      startClientX: e.clientX, startClientY: e.clientY,
      startFX: f.x, startFY: f.y, startFW: f.w, startFH: f.h,
    };
  }

  // --- Corner resize ---
  function onCornerDown(e: React.PointerEvent<HTMLDivElement>, corner: Corner) {
    e.stopPropagation();
    // Capture on the container so pointermove/up fire there
    containerRef.current?.setPointerCapture(e.pointerId);
    cancelZoom();
    const f = frameRef.current;
    interactionRef.current = {
      type: 'resize', corner,
      startClientX: e.clientX, startClientY: e.clientY,
      startFX: f.x, startFY: f.y, startFW: f.w, startFH: f.h,
    };
  }

  function onPointerMove(e: React.PointerEvent) {
    const inter = interactionRef.current;
    if (!inter) return;
    const dx = e.clientX - inter.startClientX;
    const dy = e.clientY - inter.startClientY;

    if (inter.type === 'drag') {
      const next = clampFrame({ x: inter.startFX + dx, y: inter.startFY + dy, w: inter.startFW, h: inter.startFH });
      frameRef.current = next;
      setFrame(next);
      return;
    }

    const c = inter.corner!;
    // signX/Y: +1 means dragging in positive direction grows the frame
    const signX = (c === 'br' || c === 'tr') ? 1 : -1;
    const signY = (c === 'br' || c === 'bl') ? 1 : -1;
    const relDx = dx * signX;
    const relDy = dy * signY;

    let newX = inter.startFX;
    let newY = inter.startFY;

    // All modes (including free) are proportional — free uses the frame's own starting ratio
    const ratio = aspect === 'free'
      ? inter.startFW / inter.startFH
      : cropNum;

    // Dominant-axis: whichever axis (x or y) moves more (in width-equivalent units) drives the resize
    const absXNorm = Math.abs(relDx);
    const absYNorm = Math.abs(relDy * ratio);
    const delta = absXNorm >= absYNorm ? relDx : relDy * ratio;
    const newW = inter.startFW + delta;
    const newH = newW / ratio;

    // For left/top corners: anchor is the opposite edge
    if (signX < 0) newX = inter.startFX + inter.startFW - newW;
    if (signY < 0) newY = inter.startFY + inter.startFH - newH;

    // Use ratio-aware clamp so independent w/h clamping can't break the aspect ratio
    const next = clampFrameProp({ x: newX, y: newY, w: newW, h: newH }, ratio);
    frameRef.current = next;
    setFrame(next);
  }

  function onPointerUp() {
    if (!interactionRef.current) return;
    interactionRef.current = null;
    emitCrop(frameRef.current);
    scheduleZoom();
  }

  // Zoom: scale image so crop area fills the container
  let dispScale = imgScale;
  let dispX = imgX;
  let dispY = imgY;
  if (zoomed && aspect !== 'original' && frame.w > 0) {
    const sw = frame.w / imgScale;
    const sh = frame.h / imgScale;
    const sx = (frame.x - imgX) / imgScale;
    const sy = (frame.y - imgY) / imgScale;
    dispScale = Math.min(containerW / sw, containerH / sh) * 0.92;
    dispX = containerW / 2 - (sx + sw / 2) * dispScale;
    dispY = containerH / 2 - (sy + sh / 2) * dispScale;
  }

  const hintText = locale === 'zh'
    ? '拖动移动裁剪框，拖角可缩放'
    : locale === 'ja'
    ? 'ドラッグ移動・角ハンドルでリサイズ'
    : 'Drag to move · corners to resize';

  const showFrame = aspect !== 'original' && containerW > 0 && frame.w > 0 && !zoomed;

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-2xl select-none"
      style={{ height: containerH, background: '#0a0a0f' }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="crop preview"
        draggable={false}
        style={{
          position: 'absolute',
          left: dispX, top: dispY,
          width: imageW * dispScale,
          height: imageH * dispScale,
          pointerEvents: 'none',
          userSelect: 'none',
          transition: zoomed
            ? 'left 0.35s ease, top 0.35s ease, width 0.35s ease, height 0.35s ease'
            : 'none',
        }}
      />

      {showFrame && (
        <>
          {/* Dark mask */}
          <div style={{ position: 'absolute', inset: 0, bottom: 'auto', height: frame.y, background: 'rgba(0,0,0,0.6)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, top: frame.y + frame.h, background: 'rgba(0,0,0,0.6)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: 0, top: frame.y, width: frame.x, height: frame.h, background: 'rgba(0,0,0,0.6)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: frame.x + frame.w, top: frame.y, right: 0, height: frame.h, background: 'rgba(0,0,0,0.6)', pointerEvents: 'none' }} />

          {/* Crop frame border + grid + interior drag zone */}
          <div
            onPointerDown={onFrameDragDown}
            style={{
              position: 'absolute',
              left: frame.x, top: frame.y,
              width: frame.w, height: frame.h,
              border: '1.5px solid rgba(255,255,255,0.75)',
              boxSizing: 'border-box',
              cursor: 'move',
            }}
          >
            <div style={{
              position: 'absolute', inset: 0, pointerEvents: 'none',
              backgroundImage: [
                'linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)',
                'linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)',
              ].join(', '),
              backgroundSize: '33.33% 33.33%',
            }} />
          </div>

          {/* Corner handles — direct children of container, NOT inside frame */}
          {(['tl', 'tr', 'bl', 'br'] as Corner[]).map((c) => {
            const isL = c === 'tl' || c === 'bl';
            const isT = c === 'tl' || c === 'tr';
            return (
              <div
                key={c}
                onPointerDown={(e) => onCornerDown(e, c)}
                style={{
                  position: 'absolute',
                  width: HANDLE, height: HANDLE,
                  left: isL ? frame.x - HANDLE / 2 : frame.x + frame.w - HANDLE / 2,
                  top: isT ? frame.y - HANDLE / 2 : frame.y + frame.h - HANDLE / 2,
                  cursor: CORNER_CURSORS[c],
                  // Visual L-shape border
                  borderTop: isT ? '2.5px solid #fff' : undefined,
                  borderBottom: !isT ? '2.5px solid #fff' : undefined,
                  borderLeft: isL ? '2.5px solid #fff' : undefined,
                  borderRight: !isL ? '2.5px solid #fff' : undefined,
                }}
              />
            );
          })}
        </>
      )}

      {/* Back button in zoomed mode */}
      {zoomed && (
        <button
          className="absolute top-2 left-2 px-2.5 py-1 rounded-lg bg-black/70 backdrop-blur-sm
                     border border-white/20 text-[11px] text-white hover:bg-black/90 transition-colors"
          onClick={() => cancelZoom()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {locale === 'zh' ? '← 返回' : locale === 'ja' ? '← 戻る' : '← Back'}
        </button>
      )}

      {/* Bottom overlay */}
      <div className="absolute bottom-2.5 inset-x-3 flex items-center justify-between pointer-events-none">
        {aspect !== 'original' && !zoomed ? (
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
