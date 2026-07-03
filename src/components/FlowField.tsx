"use client";

import { useEffect, useRef } from "react";

// Generative flow field (algorithmic-art skill): particles drifting through a
// seeded pseudo-noise vector field, drawn as long translucent strokes in the
// brand's volt-blue → live-cyan current with a rationed filament-coral spark.
// Deterministic per seed — the same storm every time. Pauses offscreen and
// renders a single calm frame under prefers-reduced-motion.

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Cheap smooth angle field from layered trig — no noise library needed.
function fieldAngle(x: number, y: number, t: number): number {
  return (
    Math.sin(x * 0.0016 + t * 0.00008) * 2.1 +
    Math.cos(y * 0.0021 - t * 0.00005) * 1.7 +
    Math.sin((x + y) * 0.0009 + t * 0.00003) * 1.3
  );
}

const STROKES = [
  "76, 110, 245", // volt
  "92, 124, 250", // volt bright
  "34, 211, 238", // live cyan
];

export default function FlowField({
  seed = 20260703,
  density = 170,
  className = "",
  opacity = 1,
}: {
  seed?: number;
  density?: number;
  className?: string;
  opacity?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rand = mulberry32(seed);
    let raf = 0;
    let running = true;
    let w = 0;
    let h = 0;

    interface P {
      x: number;
      y: number;
      speed: number;
      color: string;
      alpha: number;
      width: number;
      life: number;
      maxLife: number;
    }
    let particles: P[] = [];

    const spawn = (p?: P): P => {
      const isCoral = rand() < 0.04; // filament coral is rationed
      const next: P = p ?? ({} as P);
      next.x = rand() * w;
      next.y = rand() * h;
      next.speed = 0.45 + rand() * 0.9;
      next.color = isCoral ? "255, 120, 71" : STROKES[Math.floor(rand() * STROKES.length)];
      next.alpha = isCoral ? 0.45 : 0.24 + rand() * 0.26;
      next.width = rand() < 0.12 ? 1.4 : 0.7;
      next.maxLife = 240 + rand() * 400;
      next.life = rand() * next.maxLife;
      return next;
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = "rgba(9, 11, 18, 1)";
      ctx.fillRect(0, 0, w, h);
      particles = Array.from({ length: density }, () => spawn());
    };

    resize();

    const step = (t: number) => {
      if (!running) return;
      // Fade previous strokes toward night — the trail.
      ctx.fillStyle = "rgba(9, 11, 18, 0.045)";
      ctx.fillRect(0, 0, w, h);

      for (const p of particles) {
        const a = fieldAngle(p.x, p.y, t);
        const nx = p.x + Math.cos(a) * p.speed;
        const ny = p.y + Math.sin(a) * p.speed;
        ctx.strokeStyle = `rgba(${p.color}, ${p.alpha})`;
        ctx.lineWidth = p.width;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(nx, ny);
        ctx.stroke();
        p.x = nx;
        p.y = ny;
        p.life += 1;
        if (p.life > p.maxLife || p.x < -20 || p.x > w + 20 || p.y < -20 || p.y > h + 20) {
          spawn(p);
          p.life = 0;
        }
      }
      raf = requestAnimationFrame(step);
    };

    if (reduced) {
      // One calm, dense frame — the field as a still artifact.
      for (let i = 0; i < 140; i++) {
        for (const p of particles) {
          const a = fieldAngle(p.x, p.y, i * 16);
          const nx = p.x + Math.cos(a) * p.speed;
          const ny = p.y + Math.sin(a) * p.speed;
          ctx.strokeStyle = `rgba(${p.color}, ${p.alpha * 0.5})`;
          ctx.lineWidth = p.width;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(nx, ny);
          ctx.stroke();
          p.x = nx;
          p.y = ny;
        }
      }
    } else {
      // Only animate while visible.
      const io = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          running = true;
          raf = requestAnimationFrame(step);
        } else {
          running = false;
          cancelAnimationFrame(raf);
        }
      });
      io.observe(canvas);
      const onResize = () => resize();
      window.addEventListener("resize", onResize);
      return () => {
        running = false;
        cancelAnimationFrame(raf);
        io.disconnect();
        window.removeEventListener("resize", onResize);
      };
    }
  }, [seed, density]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      style={{ opacity }}
    />
  );
}
