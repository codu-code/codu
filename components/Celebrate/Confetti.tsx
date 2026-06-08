"use client";

import { useEffect, useRef } from "react";

// Design-token celebration palette (dark theme literals — pragmatic for canvas,
// where CSS vars aren't directly paintable): mint accent + accent-soft, warning,
// info, and white.
const COLORS = ["#2dd4bf", "#6ee7d6", "#f5b544", "#5fa8f5", "#ffffff"];

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vr: number;
  color: string;
}

/**
 * Lightweight one-shot confetti burst on a full-screen canvas. Particles spray
 * up/out from centre, fall under gravity, and fade over ~1.7s, after which the
 * component clears the canvas and unmounts itself. Decorative only:
 * pointer-events-none, aria-hidden, high z-index. Fully gated on
 * prefers-reduced-motion — renders nothing when the user prefers reduced motion.
 */
export function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const prefersReduced =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  useEffect(() => {
    if (prefersReduced) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const cx = w / 2;
    const cy = h * 0.42;
    const count = 140;
    const particles: Particle[] = Array.from({ length: count }, () => {
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.1;
      const speed = 6 + Math.random() * 9;
      return {
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 5,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      };
    });

    const DURATION = 1700;
    const start = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = elapsed / DURATION;
      ctx.clearRect(0, 0, w, h);

      if (progress >= 1) {
        return; // done — leave canvas cleared
      }

      const alpha = progress < 0.7 ? 1 : 1 - (progress - 0.7) / 0.3;

      for (const p of particles) {
        p.vy += 0.28; // gravity
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;

        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        ctx.restore();
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [prefersReduced]);

  if (prefersReduced) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[96] h-full w-full"
    />
  );
}
