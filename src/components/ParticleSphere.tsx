"use client";

import { useEffect, useRef } from "react";

// The particle sphere: a few thousand dots on a slowly turning globe, each
// displaced by drifting noise so the surface breathes like a living map.
// Violet→indigo→cyan dots with depth fade. One static frame under
// prefers-reduced-motion.

export default function ParticleSphere({
  size = 560,
  className = "",
}: {
  size?: number;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const N = 2600;
    const R = size * 0.36;
    const cx = size / 2;
    const cy = size / 2;

    // Fibonacci sphere — evenly scattered points.
    const pts: { x: number; y: number; z: number; seed: number }[] = [];
    const GA = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < N; i++) {
      const y = 1 - (i / (N - 1)) * 2;
      const r = Math.sqrt(1 - y * y);
      const th = GA * i;
      pts.push({ x: Math.cos(th) * r, y, z: Math.sin(th) * r, seed: (i % 97) / 97 });
    }

    // violet → indigo → cyan by latitude band
    const COLORS = ["168, 85, 247", "129, 108, 245", "99, 102, 241", "72, 149, 239", "34, 211, 238"];

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let t = 0;

    const frame = () => {
      ctx.clearRect(0, 0, size, size);
      const rot = t * 0.00016;
      const cosR = Math.cos(rot);
      const sinR = Math.sin(rot);

      for (const p of pts) {
        // slow rotation around Y
        const x = p.x * cosR - p.z * sinR;
        const z = p.x * sinR + p.z * cosR;
        // breathing displacement — cheap layered waves stand in for noise
        const n =
          Math.sin(p.y * 4.2 + t * 0.0011 + p.seed * 9) * 0.05 +
          Math.sin(x * 3.1 - t * 0.0007 + p.seed * 5) * 0.04;
        const rr = R * (1 + n);
        const sx = cx + x * rr;
        const sy = cy + p.y * rr * 0.96;
        const depth = (z + 1) / 2; // 0 back … 1 front
        if (depth < 0.18) continue; // cull far-back dots
        const band = Math.min(COLORS.length - 1, Math.floor(((p.y + 1) / 2) * COLORS.length));
        ctx.fillStyle = `rgba(${COLORS[band]}, ${(0.16 + depth * 0.6).toFixed(3)})`;
        const d = 0.6 + depth * 1.3;
        ctx.fillRect(sx, sy, d, d);
      }
      if (!reduced) {
        t += 16.7;
        raf = requestAnimationFrame(frame);
      }
    };

    // pause offscreen
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        raf = requestAnimationFrame(frame);
      } else {
        cancelAnimationFrame(raf);
      }
    });
    io.observe(canvas);

    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
    };
  }, [size]);

  return (
    <canvas
      ref={ref}
      className={className}
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}
