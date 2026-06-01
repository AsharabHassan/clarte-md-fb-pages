'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion as motionRM } from 'motion/react';

export const useReducedMotion = motionRM;

export function useMagnetic(strength = 8) {
  const ref = useRef<HTMLElement | null>(null);
  const [t, setT] = useState({ x: 0, y: 0 });
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const el = ref.current;
    if (!el) return;

    function onMove(e: MouseEvent) {
      if (!el) return;
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const dx = (e.clientX - cx) / (r.width / 2);
      const dy = (e.clientY - cy) / (r.height / 2);
      setT({
        x: Math.max(-1, Math.min(1, dx)) * strength,
        y: Math.max(-1, Math.min(1, dy)) * strength,
      });
    }
    function onLeave() {
      setT({ x: 0, y: 0 });
    }

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [strength, reduced]);

  return {
    ref,
    style: {
      transform: `translate3d(${t.x}px, ${t.y}px, 0)`,
      transition: 'transform 300ms cubic-bezier(0.22, 1, 0.36, 1)',
    } as React.CSSProperties,
  };
}

export function useMounted() {
  const [m, setM] = useState(false);
  useEffect(() => setM(true), []);
  return m;
}
