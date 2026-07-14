"use client";

import { useEffect, useRef } from "react";

// The ambient galaxy (algorithmic-art skill): three parallax depths of
// seeded stars that twinkle on slow cycles and lean toward the cursor, with a
// shooting star rare enough to feel lucky. Deterministic per seed; pauses
// offscreen; renders a still star chart under prefers-reduced-motion.

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

interface Star {
  x: number; // 0..1 relative
  y: number;
  depth: number; // 0 far … 2 near
  r: number;
  baseAlpha: number;
  twinkleSpeed: number;
  twinklePhase: number;
  tint: string;
}

interface Meteor {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
}

const TINTS = ["244, 242, 255", "244, 242, 255", "244, 242, 255", "34, 211, 238", "168, 85, 247"];
const PARALLAX = [6, 14, 26]; // px of cursor lean per depth

export default function Starfield({
  seed = 20260705,
  density = 210, // stars per megapixel
  opacity = 1,
  className = "",
}: {
  seed?: number;
  density?: number;
  opacity?: number;
  className?: string;
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
    let stars: Star[] = [];
    let meteor: Meteor | null = null;
    let nextMeteorAt = performance.now() + 15_000 + Math.random() * 30_000;
    const lean = { x: 0, y: 0, tx: 0, ty: 0 };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.max(80, Math.round(((w * h) / 1_000_000) * density));
      stars = Array.from({ length: count }, () => {
        const depth = rand() < 0.5 ? 0 : rand() < 0.7 ? 1 : 2;
        return {
          x: rand(),
          y: rand(),
          depth,
          r: depth === 2 ? 1.1 + rand() * 1.1 : depth === 1 ? 0.7 + rand() * 0.7 : 0.4 + rand() * 0.5,
          baseAlpha: depth === 2 ? 0.7 : depth === 1 ? 0.5 : 0.32,
          twinkleSpeed: 0.4 + rand() * 1.2,
          twinklePhase: rand() * Math.PI * 2,
          tint: TINTS[Math.floor(rand() * TINTS.length)],
        };
      });
    };

    resize();

    const draw = (t: number, animate: boolean) => {
      ctx.clearRect(0, 0, w, h);
      lean.x += (lean.tx - lean.x) * 0.04;
      lean.y += (lean.ty - lean.y) * 0.04;

      for (const s of stars) {
        const tw = animate ? 0.55 + 0.45 * Math.sin(t * 0.001 * s.twinkleSpeed + s.twinklePhase) : 0.8;
        const px = s.x * w + lean.x * PARALLAX[s.depth];
        const py = s.y * h + lean.y * PARALLAX[s.depth];
        ctx.fillStyle = `rgba(${s.tint}, ${(s.baseAlpha * tw).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(px, py, s.r, 0, Math.PI * 2);
        ctx.fill();
        // Bright near stars get a four-point sparkle.
        if (s.depth === 2 && s.r > 1.7) {
          ctx.strokeStyle = `rgba(${s.tint}, ${(0.35 * tw).toFixed(3)})`;
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(px - s.r * 3, py);
          ctx.lineTo(px + s.r * 3, py);
          ctx.moveTo(px, py - s.r * 3);
          ctx.lineTo(px, py + s.r * 3);
          ctx.stroke();
        }
      }

      if (animate) {
        if (!meteor && t > nextMeteorAt) {
          const fromLeft = Math.random() < 0.5;
          meteor = {
            x: fromLeft ? -30 : w * (0.4 + Math.random() * 0.6),
            y: h * 0.05 + Math.random() * h * 0.25,
            vx: 7 + Math.random() * 5,
            vy: 2.4 + Math.random() * 2,
            life: 1,
          };
          nextMeteorAt = t + 25_000 + Math.random() * 35_000;
        }
        if (meteor) {
          meteor.x += meteor.vx;
          meteor.y += meteor.vy;
          meteor.life -= 0.012;
          const tail = 16;
          const grad = ctx.createLinearGradient(
            meteor.x - meteor.vx * tail,
            meteor.y - meteor.vy * tail,
            meteor.x,
            meteor.y,
          );
          grad.addColorStop(0, "rgba(168, 85, 247, 0)");
          grad.addColorStop(1, `rgba(244, 242, 255, ${Math.max(0, meteor.life * 0.9)})`);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(meteor.x - meteor.vx * tail, meteor.y - meteor.vy * tail);
          ctx.lineTo(meteor.x, meteor.y);
          ctx.stroke();
          if (meteor.life <= 0 || meteor.x > w + 50 || meteor.y > h + 50) meteor = null;
        }
      }
    };

    if (reduced) {
      draw(0, false);
      const onResize = () => {
        resize();
        draw(0, false);
      };
      window.addEventListener("resize", onResize);
      return () => window.removeEventListener("resize", onResize);
    }

    const step = (t: number) => {
      if (!running) return;
      draw(t, true);
      raf = requestAnimationFrame(step);
    };

    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        running = true;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(step);
      } else {
        running = false;
        cancelAnimationFrame(raf);
      }
    });
    io.observe(canvas);

    const onMove = (e: MouseEvent) => {
      lean.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      lean.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    const onResize = () => resize();
    window.addEventListener("mousemove", onMove);
    window.addEventListener("resize", onResize);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
    };
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
