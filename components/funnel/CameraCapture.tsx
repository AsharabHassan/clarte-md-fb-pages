'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Camera, SwitchCamera, X, Loader2, Upload } from 'lucide-react';

type Facing = 'user' | 'environment';

/**
 * In-browser live camera capture. Opens the device camera *inside* the page
 * (getUserMedia) rather than handing off to the native camera app, and lets
 * the user flip between front/back cameras.
 *
 * Requires a secure context (HTTPS or localhost). When the camera is
 * unavailable — no getUserMedia, insecure origin, permission denied, or no
 * camera — it surfaces a message and the parent's file-upload fallback takes
 * over. The component never blocks the funnel.
 *
 * On capture it draws the current video frame to a canvas, encodes a JPEG
 * File, and hands it to `onCapture` — identical shape to a file-input File,
 * so all downstream logic (downscale → analyze → generate) is untouched.
 */
export function CameraCapture({
  onCapture,
  onUploadFallback,
  disabled,
}: {
  onCapture: (file: File) => void;
  /** Trigger the parent's hidden file input (always-available fallback). */
  onUploadFallback: () => void;
  disabled?: boolean;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [open, setOpen] = useState(false);
  const [starting, setStarting] = useState(false);
  const [facing, setFacing] = useState<Facing>('user');
  const [canSwitch, setCanSwitch] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Whether the live camera is usable. Computed after mount (not during
  // render) so the first client render matches the server's — otherwise
  // `navigator`/`isSecureContext` differ between SSR and client and React
  // throws a hydration mismatch. Starts false (= upload fallback) on both.
  const [supported, setSupported] = useState(false);
  useEffect(() => {
    setSupported(!!navigator.mediaDevices?.getUserMedia && window.isSecureContext);
  }, []);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  // Acquire (or re-acquire) the stream for the given facing mode.
  const startStream = useCallback(async (mode: Facing) => {
    setStarting(true);
    setErr(null);
    stopStream();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
      // Only show the flip control when there's more than one camera.
      const devices = await navigator.mediaDevices.enumerateDevices();
      setCanSwitch(devices.filter((d) => d.kind === 'videoinput').length > 1);
    } catch {
      setErr('Couldn’t access your camera. Allow camera access, or upload a photo instead.');
      setOpen(false);
    } finally {
      setStarting(false);
    }
  }, [stopStream]);

  async function openCamera() {
    if (!supported) {
      onUploadFallback();
      return;
    }
    setOpen(true);
    await startStream(facing);
  }

  function closeCamera() {
    stopStream();
    setOpen(false);
  }

  function switchCamera() {
    const next: Facing = facing === 'user' ? 'environment' : 'user';
    setFacing(next);
    void startStream(next);
  }

  function capture() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')!.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], 'selfie.jpg', { type: 'image/jpeg' });
        closeCamera();
        onCapture(file);
      },
      'image/jpeg',
      0.92,
    );
  }

  // Stop the camera if the component unmounts mid-stream (light turns off).
  useEffect(() => stopStream, [stopStream]);

  if (open) {
    return (
      <div className="funnel-cam" role="dialog" aria-label="Camera">
        <div className="funnel-cam-frame">
          {/* Mirror the front camera so it feels like a selfie mirror. */}
          <video
            ref={videoRef}
            className={`funnel-cam-video ${facing === 'user' ? 'is-mirrored' : ''}`}
            playsInline
            muted
            autoPlay
          />
          {starting && (
            <div className="funnel-cam-loading">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          )}
          <button type="button" className="funnel-cam-close" onClick={closeCamera} aria-label="Close camera">
            <X className="h-5 w-5" />
          </button>
          {canSwitch && (
            <button type="button" className="funnel-cam-switch" onClick={switchCamera} aria-label="Switch camera">
              <SwitchCamera className="h-5 w-5" />
            </button>
          )}
        </div>
        <button
          type="button"
          className="funnel-cam-shutter"
          onClick={capture}
          disabled={starting}
          aria-label="Capture photo"
        >
          <span className="funnel-cam-shutter-dot" />
        </button>
        <button type="button" className="funnel-cam-upload" onClick={onUploadFallback}>
          <Upload className="h-4 w-4" /> Upload a photo instead
        </button>
      </div>
    );
  }

  return (
    <>
      <button type="button" className="funnel-cta" disabled={disabled} onClick={openCamera}>
        <Camera className="h-5 w-5" /> {supported ? 'Open camera' : 'Take / upload photo'}
      </button>
      {supported && (
        <button type="button" className="funnel-cam-altupload" onClick={onUploadFallback} disabled={disabled}>
          <Upload className="h-4 w-4" /> Upload a photo instead
        </button>
      )}
      {err && <p className="funnel-error">{err}</p>}
    </>
  );
}
