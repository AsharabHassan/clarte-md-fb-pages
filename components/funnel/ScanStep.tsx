'use client';

import { useEffect, useRef, useState } from 'react';
import NextImage from 'next/image';
import { PROTOCOL_HERO } from '@/lib/funnel/product-images';
import { ACNE_GLOW, FUNNEL_AI_PROMPT } from '@/lib/funnel/offer';
import { pushFunnelEvent } from '@/lib/funnel/analytics';
import type { ZoneSource } from '@/lib/funnel/collage';
import { StarRating } from './StarRating';
import { Reviews } from './Reviews';
import { CaseStudies } from './CaseStudies';
import { CameraCapture } from './CameraCapture';
import { DOCTOR_LINE } from '@/lib/funnel/evidence';
import type { ReviewCard, CaseStudy } from '@/lib/reviews/types';

export interface ScanResult {
  beforeUrl: string;      // object URL of the original photo
  afterUrl: string | null; // AI projection data URL (null on AI failure)
  source: ZoneSource | null;
  aiSessionId?: string;
}

// Smaller, lighter upload = faster round-trip. 768px @ q0.72 is plenty for
// the model to read acne and still trims payload + latency vs 1024 @ q0.9.
const MAX_EDGE = 768;
const JPEG_QUALITY = 0.72;

/** Downscale an image File to a compact JPEG base64 (no data: prefix). */
async function downscaleToBase64(file: File): Promise<{ base64: string; objectUrl: string }> {
  const objectUrl = URL.createObjectURL(file);
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = reject;
    i.src = objectUrl;
  });
  const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
  return { base64: dataUrl.split(',')[1], objectUrl };
}

const STAGES = [
  'Uploading your photo…',
  'Mapping active breakouts…',
  'Reading skin texture & tone…',
  'Projecting your week 12 skin…',
  'Rendering your result…',
];

export function ScanStep({
  onComplete,
  reviews,
  caseStudies,
  aggregate,
}: {
  onComplete: (r: ScanResult) => void;
  reviews: ReviewCard[];
  caseStudies: CaseStudy[];
  aggregate: { avg: number; count: number };
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [stageIdx, setStageIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const stageTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  function stopTimers() {
    if (stageTimer.current) clearInterval(stageTimer.current);
    if (progressTimer.current) clearInterval(progressTimer.current);
    stageTimer.current = null;
    progressTimer.current = null;
  }

  // Clear any running timers if the component unmounts mid-analysis.
  useEffect(() => stopTimers, []);

  function startLoader() {
    setStageIdx(0);
    setProgress(0);
    stageTimer.current = setInterval(() => {
      setStageIdx((i) => Math.min(i + 1, STAGES.length - 1));
    }, 2200);
    // Ease toward 92% so the bar feels alive without ever "finishing" early.
    progressTimer.current = setInterval(() => {
      setProgress((p) => (p >= 92 ? 92 : p + Math.max(0.6, (92 - p) * 0.07)));
    }, 350);
  }

  async function handleFile(file: File) {
    setErr(null);
    setBusy(true);
    pushFunnelEvent('scan_started');
    startLoader();
    try {
      const { base64, objectUrl } = await downscaleToBase64(file);
      setPreview(objectUrl);

      const analyzeReq = fetch('/api/ai/analyze-skin', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          image_base64: base64,
          mime_type: 'image/jpeg',
          concern: 'acne',
          consent: true,
        }),
      }).then((r) => r.json()).catch(() => null);

      const generateReq = fetch('/api/generate-after', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          image_base64: base64,
          mime_type: 'image/jpeg',
          concern: 'acne',
          prompt: FUNNEL_AI_PROMPT,
          bundle_slug: ACNE_GLOW.slug,
          quality: 'low', // funnel trades fidelity for speed
        }),
      }).then((r) => r.json()).catch(() => null);

      const [analyze, generate] = await Promise.all([analyzeReq, generateReq]);

      const source: ZoneSource | null =
        generate?.skin_map ?? (analyze?.analysis
          ? { primary_concerns: analyze.analysis.primary_concerns }
          : null);

      pushFunnelEvent('analysis_complete', { ai_ok: Boolean(generate?.image) });
      stopTimers();
      setProgress(100);
      // brief beat so the bar visibly reaches 100% before we transition
      await new Promise((r) => setTimeout(r, 280));
      setBusy(false);
      onComplete({
        beforeUrl: objectUrl,
        afterUrl: generate?.image ?? null,
        source,
        aiSessionId: generate?.ai_session_id ?? analyze?.ai_session_id,
      });
    } catch {
      stopTimers();
      setErr('Something went wrong reading your photo. Please try another, clearer photo.');
      setBusy(false);
    }
  }

  return (
    <section className="funnel-scan">
      <h1 className="funnel-h1">See your skin in 12 weeks.</h1>
      <p className="funnel-sub">
        Take a selfie. Our dermatologist-trained AI maps your acne and projects your
        skin after the 12-week protocol — free, in seconds.
      </p>

      <div className="funnel-trustline">
        <StarRating avg={aggregate.avg} count={aggregate.count} />
        <span className="funnel-doctor funnel-doctor--inline">{DOCTOR_LINE}</span>
      </div>

      <div className="funnel-hero-img funnel-hero-img--scan">
        <NextImage
          src={PROTOCOL_HERO}
          alt="The Acne Glow Protocol"
          fill
          sizes="(max-width: 560px) 100vw, 560px"
          style={{ objectFit: 'cover' }}
          priority
        />
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="user"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />

      <CameraCapture
        onCapture={handleFile}
        onUploadFallback={() => inputRef.current?.click()}
        disabled={busy}
      />

      {err && <p className="funnel-error">{err}</p>}

      <CaseStudies cases={caseStudies} heading="Real 12-week before & afters" />

      <Reviews reviews={reviews} heading="What customers say" />

      {busy && (
        <div className="funnel-loader" role="status" aria-live="polite">
          <div className="funnel-loader-card">
            <div className="funnel-scanframe">
              {preview ? (
                <img src={preview} alt="" className="funnel-scanimg" />
              ) : (
                <div className="funnel-scanimg funnel-scanimg--empty" />
              )}
              <div className="funnel-scanline" />
            </div>
            <p className="funnel-stage">{STAGES[stageIdx]}</p>
            <div className="funnel-progress">
              <span style={{ width: `${Math.round(progress)}%` }} />
            </div>
            <p className="funnel-loadhint">Usually about 10–15 seconds.</p>
          </div>
        </div>
      )}
    </section>
  );
}
