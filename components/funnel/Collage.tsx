'use client';

import { useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import { deriveZoneBadges, type ZoneSource } from '@/lib/funnel/collage';

/**
 * Composes a single shareable BEFORE | AFTER collage on a canvas.
 * - BEFORE (left) is the user's photo with face-region badges.
 * - AFTER (right) is the AI 12-week projection labelled "Week 12".
 * Falls back to showing just the AFTER image if either source is missing.
 */
export function Collage({
  beforeUrl,
  afterUrl,
  source,
}: {
  beforeUrl: string | null;
  afterUrl: string | null;
  source: ZoneSource | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!afterUrl) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = 1080;
    const H = 720;
    const panelW = beforeUrl ? W / 2 : W;
    canvas.width = W;
    canvas.height = H;

    const loadImg = (src: string) =>
      new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
      });

    function drawCover(img: HTMLImageElement, dx: number, dw: number) {
      const scale = Math.max(dw / img.width, H / img.height);
      const sw = dw / scale;
      const sh = H / scale;
      const sx = (img.width - sw) / 2;
      const sy = (img.height - sh) / 2;
      ctx!.drawImage(img, sx, sy, sw, sh, dx, 0, dw, H);
    }

    function label(text: string, dx: number, dw: number) {
      ctx!.fillStyle = 'rgba(14,31,58,0.82)';
      ctx!.fillRect(dx, H - 56, dw, 56);
      ctx!.fillStyle = '#fff';
      ctx!.font = '600 26px ui-sans-serif, system-ui, sans-serif';
      ctx!.textAlign = 'center';
      ctx!.textBaseline = 'middle';
      ctx!.fillText(text, dx + dw / 2, H - 28);
    }

    (async () => {
      try {
        const after = await loadImg(afterUrl);
        if (beforeUrl) {
          const before = await loadImg(beforeUrl);
          drawCover(before, 0, panelW);
          // zone badges on the BEFORE panel
          const badges = deriveZoneBadges(source);
          ctx.font = '600 18px ui-sans-serif, system-ui, sans-serif';
          ctx.textAlign = 'left';
          badges.forEach((b, i) => {
            const y = 28 + i * 36;
            const w = ctx.measureText(b).width + 28;
            ctx.fillStyle = 'rgba(193,75,54,0.92)';
            ctx.fillRect(20, y - 14, w, 28);
            ctx.fillStyle = '#fff';
            ctx.fillText(b, 34, y + 1);
          });
          label('Before', 0, panelW);
          drawCover(after, panelW, panelW);
          label('Week 12 — projected', panelW, panelW);
        } else {
          drawCover(after, 0, panelW);
          label('Week 12 — projected', 0, panelW);
        }
        setReady(true);
      } catch {
        // If the AFTER image fails to load, leave canvas hidden; parent
        // shows its own fallback.
        setReady(false);
      }
    })();
  }, [beforeUrl, afterUrl, source]);

  function download() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.download = 'clarte-acne-projection.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  }

  if (!afterUrl) return null;

  return (
    <figure className="funnel-collage">
      <canvas ref={canvasRef} className="w-full rounded-2xl" style={{ display: ready ? undefined : 'none' }} aria-label="Before and after skin projection" />
      <figcaption className="mt-2 text-center font-mono text-[10.5px] uppercase tracking-[0.18em] text-ink-mute">
        ✨ Projected result — individual results vary
      </figcaption>
      {ready && (
        <button
          type="button"
          onClick={download}
          className="mt-3 inline-flex items-center gap-1.5 font-mono text-[10.5px] uppercase tracking-[0.18em] text-cobalt"
        >
          <Download className="h-3.5 w-3.5" /> Save my result
        </button>
      )}
    </figure>
  );
}
